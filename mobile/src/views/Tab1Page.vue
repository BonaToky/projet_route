<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: transparent;">
        <ion-buttons slot="end">
          <ion-button @click="goToSettings" style="--color: white;">
            <ion-icon :icon="settings" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="login-page">
      <div class="login-container">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        
        <div class="login-card">
          <div class="login-header">
            <div class="logo-icon">
              <ion-icon :icon="layers" />
            </div>
            <h1>RouteWatch</h1>
            <p>Signalement des Problèmes Routiers</p>
          </div>

          <div class="login-form">
            <div class="input-group">
              <label>
                <ion-icon :icon="mail" />
                Email
              </label>
              <ion-input 
                v-model="loginEmail" 
                type="email" 
                placeholder="votreemail@exemple.com"
                class="custom-input"
              />
            </div>

            <div class="input-group">
              <label>
                <ion-icon :icon="lockClosed" />
                Mot de passe
              </label>
              <ion-input 
                v-model="loginPassword" 
                type="password" 
                placeholder="••••••••"
                class="custom-input"
              />
            </div>

            <ion-button expand="block" @click="login" class="login-button">
              <span v-if="!isLoading">
                Se connecter
                <ion-icon :icon="arrowForward" />
              </span>
              <ion-spinner v-else name="crescent" />
            </ion-button>
          </div>
        </div>
      </div>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        position="top"
        color="dark"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonContent, IonInput, IonButton, IonToast, IonIcon, IonSpinner } from '@ionic/vue';
import { mail, lockClosed, arrowForward, layers, settings } from 'ionicons/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';
import { getApiBaseUrl } from '@/config/api';

const router = useRouter();
const loginEmail = ref('');
const loginPassword = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const loginAttempts = ref(0);
const isLoading = ref(false);

const goToSettings = () => {
  router.push('/tabs/settings');
};

onMounted(() => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.sessionExpiration && Date.now() > userData.sessionExpiration) {
      logout();
    } else {
      startSessionCheck();
      router.push('/tabs/tab2');
    }
  }
});

const reportFailedLogin = async (email: string) => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/auth/report-failed-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.blocked) {
        toastMessage.value = 'Compte bloqué après trop de tentatives';
        showToast.value = true;
        return true;
      }
    }
  } catch (error) {
    console.error('Erreur lors du signalement de tentative échouée:', error);
  }
  return false;
};

const login = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  
  try {
    const utilisateursRef = collection(db, 'utilisateurs');
    const q = query(utilisateursRef, where('email', '==', loginEmail.value));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      toastMessage.value = 'Email non trouvé';
      showToast.value = true;
      const isBlocked = await reportFailedLogin(loginEmail.value);
      if (isBlocked) return;
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.motDePasse !== loginPassword.value) {
      toastMessage.value = 'Mot de passe incorrect';
      showToast.value = true;
      const isBlocked = await reportFailedLogin(loginEmail.value);
      if (isBlocked) return;
      return;
    }
    
    try {
      const apiUrl = getApiBaseUrl();
      const checkBlockResponse = await fetch(`${apiUrl}/auth/check-blocked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.value }),
      });
      
      if (checkBlockResponse.ok) {
        const blockData = await checkBlockResponse.json();
        if (blockData.blocked) {
          toastMessage.value = 'Votre compte est bloqué. Contactez un administrateur.';
          showToast.value = true;
          return;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du blocage:', error);
    }
    
    loginAttempts.value = 0;
    
    let sessionDurationMinutes = 60;
    try {
      const apiUrl = getApiBaseUrl();
      const paramsResponse = await fetch(`${apiUrl}/auth/params`);
      if (paramsResponse.ok) {
        const params = await paramsResponse.json();
        const sessionParam = params.find((p: any) => p.cle === 'duree_session_minutes');
        if (sessionParam) {
          sessionDurationMinutes = parseInt(sessionParam.valeur) || 60;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de session:', error);
    }
    
    const expirationTime = Date.now() + (sessionDurationMinutes * 60 * 1000);
    
    const user = {
      id: userDoc.id,
      ...userData,
      sessionExpiration: expirationTime
    };
    
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/auth/mobile-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.value,
          nomUtilisateur: userData.nomUtilisateur || 'Mobile User',
          sourceAuth: 'mobile'
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur dans PostgreSQL:', error);
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    startSessionCheck();
    
    setTimeout(() => {
      router.push('/tabs/tab2');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser',
          newValue: JSON.stringify(user),
          oldValue: null,
          storageArea: localStorage
        }));
        setTimeout(() => {
          toastMessage.value = 'Connexion réussie';
          showToast.value = true;
        }, 100);
      }, 100);
    }, 100);
  } catch (error: any) {
    console.error('Erreur de connexion:', error);
    toastMessage.value = 'Erreur de connexion: ' + error.message;
    showToast.value = true;
  } finally {
    isLoading.value = false;
  }
};

const startSessionCheck = () => {
  checkSessionExpiration();
  setInterval(() => {
    checkSessionExpiration();
  }, 10000);
};

const checkSessionExpiration = () => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.sessionExpiration && Date.now() > userData.sessionExpiration) {
      logout();
    }
  }
};

const logout = () => {
  localStorage.removeItem('currentUser');
  router.replace('/tabs/tab1');
  toastMessage.value = 'Session expirée. Veuillez vous reconnecter.';
  showToast.value = true;
};
</script>

<style scoped>
.login-page {
  --background: #f8fafc;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 8s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%);
  top: -80px;
  left: -80px;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
  bottom: -60px;
  right: -60px;
  animation-delay: -2s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.login-card {
  position: relative;
  z-index: 10;
  background: white;
  backdrop-filter: blur(20px);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 40px 30px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px -10px rgba(30, 58, 95, 0.5);
}

.logo-icon ion-icon {
  font-size: 28px;
  color: white;
}

.login-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1e3a5f;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.input-group label ion-icon {
  font-size: 16px;
  color: #3b82f6;
}

.input-group ion-input {
  --background: #f8fafc;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --color: #1e3a5f;
  --placeholder-color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
}

.login-button {
  --background: linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%);
  --border-radius: 12px;
  --box-shadow: 0 10px 30px -10px rgba(30, 58, 95, 0.5);
  margin-top: 8px;
  height: 52px;
  font-weight: 600;
  font-size: 16px;
}

.login-button span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-button ion-icon {
  font-size: 20px;
}
</style>
