<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: transparent;">
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

          <!-- Configuration IP en premier -->
          <div v-if="!ipConfigured" class="login-form">
            <div class="config-notice">
              <ion-icon :icon="server" />
              <h3>Configuration initiale</h3>
              <p>Configurez l'adresse IP du serveur backend</p>
            </div>

            <div class="input-group">
              <label>
                <ion-icon :icon="server" />
                Adresse IP du serveur
              </label>
              <ion-input 
                v-model="serverIp" 
                type="text" 
                placeholder="Ex: 192.168.1.100"
                class="custom-input"
              />
              <div class="input-hint">
                <ion-icon :icon="informationCircle" />
                <span>Laissez vide pour localhost (émulateur)</span>
              </div>
            </div>

            <div class="button-group">
              <ion-button expand="block" @click="testConnection" class="test-button">
                <ion-icon :icon="wifi" slot="start" />
                Tester la connexion
              </ion-button>
              <ion-button expand="block" @click="saveIp" class="save-button">
                <ion-icon :icon="save" slot="start" />
                Enregistrer
              </ion-button>
            </div>

            <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
              <ion-icon :icon="testResult.success ? checkmarkCircle : closeCircle" />
              <span>{{ testResult.message }}</span>
            </div>

            <!-- Bouton pour continuer vers le login après succès -->
            <ion-button 
              v-if="testResult && testResult.success" 
              expand="block" 
              @click="continueToLogin" 
              class="continue-button"
            >
              Continuer vers le login
              <ion-icon :icon="arrowForward" slot="end" />
            </ion-button>
          </div>

          <!-- Formulaire de login -->
          <div v-else class="login-form">
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

            <ion-button fill="clear" @click="reconfigureIp" class="reconfig-button">
              <ion-icon :icon="settings" slot="start" />
              Reconfigurer l'IP
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
        :color="toastColor"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonInput, IonButton, IonToast, IonIcon, IonSpinner } from '@ionic/vue';
import { mail, lockClosed, arrowForward, layers, settings, server, informationCircle, checkmarkCircle, closeCircle, wifi, save, refresh } from 'ionicons/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';
import { getApiBaseUrl, apiRequest } from '@/config/api';
import { initializeNotifications } from '@/services/notificationService';

const router = useRouter();
const loginEmail = ref('');
const loginPassword = ref('');
const serverIp = ref('');
const ipConfigured = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref('success');
const loginAttempts = ref(0);
const isLoading = ref(false);
const isTesting = ref(false);
const testResult = ref<{success: boolean, message: string} | null>(null);

onMounted(() => {
  // Vérifier si l'IP est déjà configurée
  const savedIp = localStorage.getItem('api_server_ip');
  if (savedIp !== null) { // Accepter même si c'est vide (localhost)
    ipConfigured.value = true;
    serverIp.value = savedIp;
    
    // Vérifier si l'utilisateur est déjà connecté
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
  }
});

const testConnection = async () => {
  testResult.value = null;
  
  if (!serverIp.value.trim()) {
    testResult.value = {
      success: false,
      message: 'Veuillez entrer une adresse IP'
    };
    return;
  }
  
  try {
    // Sauvegarder temporairement l'IP pour le test
    const oldIp = localStorage.getItem('api_server_ip');
    localStorage.setItem('api_server_ip', serverIp.value.trim());
    
    const testUrl = `http://${serverIp.value.trim()}:8080/api/auth/params`;
    console.log('🧪 Test connexion vers:', testUrl);
    
    const response = await apiRequest(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Restaurer l'ancienne IP après le test
    if (oldIp !== null) {
      localStorage.setItem('api_server_ip', oldIp);
    } else {
      localStorage.removeItem('api_server_ip');
    }
    
    if (response.ok) {
      testResult.value = {
        success: true,
        message: '✅ Connexion réussie au serveur !'
      };
    } else {
      testResult.value = {
        success: false,
        message: `❌ Erreur ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    // Restaurer l'ancienne IP en cas d'erreur
    const oldIp = localStorage.getItem('api_server_ip');
    
    testResult.value = {
      success: false,
      message: `❌ Impossible de se connecter: ${error.message}`
    };
    console.error('Test connexion error:', error);
  }
};

const saveIp = () => {
  if (serverIp.value.trim()) {
    localStorage.setItem('api_server_ip', serverIp.value.trim());
    console.log('✅ IP sauvegardée:', serverIp.value.trim());
  } else {
    localStorage.removeItem('api_server_ip');
  }
  
  toastMessage.value = 'Paramètres enregistrés !';
  toastColor.value = 'success';
  showToast.value = true;
};

const continueToLogin = () => {
  // Vérifier que l'IP est sauvegardée
  if (!localStorage.getItem('api_server_ip') && serverIp.value.trim()) {
    localStorage.setItem('api_server_ip', serverIp.value.trim());
  }
  
  console.log('✅ Passage au formulaire de login...');
  ipConfigured.value = true;
  testResult.value = null;
};

const clearCacheAndContinue = async () => {
  console.log('🔄 Vidage du cache et passage au login...');
  
  // Vérifier que l'IP est sauvegardée
  if (!localStorage.getItem('api_server_ip') && serverIp.value.trim()) {
    localStorage.setItem('api_server_ip', serverIp.value.trim());
  }
  
  toastMessage.value = 'Cache vidé ! Redirection vers le login...';
  toastColor.value = 'warning';
  showToast.value = true;
  
  // Attendre 500ms puis passer au formulaire de login
  setTimeout(() => {
    ipConfigured.value = true;
  }, 500);
};

const reconfigureIp = () => {
  ipConfigured.value = false;
  testResult.value = null;
};

const reportFailedLogin = async (email: string) => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await apiRequest(`${apiUrl}/auth/report-failed-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.blocked) {
        toastMessage.value = 'Compte bloqué après trop de tentatives';
        toastColor.value = 'danger';
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
      toastColor.value = 'danger';
      showToast.value = true;
      await reportFailedLogin(loginEmail.value);
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.motDePasse !== loginPassword.value) {
      toastMessage.value = 'Mot de passe incorrect';
      toastColor.value = 'danger';
      showToast.value = true;
      await reportFailedLogin(loginEmail.value);
      return;
    }
    
    try {
      const apiUrl = getApiBaseUrl();
      const checkBlockResponse = await apiRequest(`${apiUrl}/auth/check-blocked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.value }),
      });
      
      if (checkBlockResponse.ok) {
        const blockData = await checkBlockResponse.json();
        if (blockData.blocked) {
          toastMessage.value = 'Votre compte est bloqué. Contactez un administrateur.';
          toastColor.value = 'danger';
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
      const paramsResponse = await apiRequest(`${apiUrl}/auth/params`);
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
      await apiRequest(`${apiUrl}/auth/mobile-login`, {
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
    
    // Initialiser les notifications push après un délai
    setTimeout(async () => {
      try {
        console.log('🔔 Initialisation des notifications pour userId:', userDoc.id);
        const notifResult = await initializeNotifications(userDoc.id);
        if (notifResult) {
          console.log('✅ Notifications initialisées avec succès');
        } else {
          console.warn('⚠️ Notifications non activées (permission refusée ou plateforme non supportée)');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
      }
    }, 2000);
    
    // Navigation vers la carte immédiatement
    router.push('/tabs/tab2');
    
    // Déclencher les événements après navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
      toastMessage.value = 'Connexion réussie';
      toastColor.value = 'success';
      showToast.value = true;
    }, 100);
  } catch (error: any) {
    console.error('Erreur de connexion:', error);
    toastMessage.value = 'Erreur de connexion: ' + error.message;
    toastColor.value = 'danger';
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
  toastColor.value = 'warning';
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
  max-width: 420px;
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

.config-notice {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16px;
  border: 1px solid #bfdbfe;
}

.config-notice ion-icon {
  font-size: 40px;
  color: #3b82f6;
  margin-bottom: 12px;
}

.config-notice h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e3a5f;
  margin: 0 0 6px 0;
}

.config-notice p {
  font-size: 13px;
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

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  margin-top: -4px;
}

.input-hint ion-icon {
  font-size: 14px;
  color: #94a3b8;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.test-button {
  --background: #3b82f6;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  height: 46px;
  font-weight: 600;
  font-size: 14px;
}

.save-button {
  --background: #10b981;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  height: 46px;
  font-weight: 600;
  font-size: 14px;
}

.clear-button {
  --border-radius: 12px;
  height: 46px;
  font-weight: 600;
  font-size: 14px;
}

.continue-button {
  --background: linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%);
  --border-radius: 12px;
  --box-shadow: 0 8px 20px rgba(30, 58, 95, 0.4);
  margin-top: 16px;
  height: 50px;
  font-weight: 600;
  font-size: 15px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
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

.reconfig-button {
  --color: #64748b;
  margin-top: -8px;
  font-size: 14px;
}

.test-result {
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-top: -8px;
}

.test-result.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.test-result.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.test-result ion-icon {
  font-size: 20px;
}
</style>
