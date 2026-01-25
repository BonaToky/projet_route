<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Authentification</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Connexion</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input v-model="loginEmail" type="email" placeholder="Entrez votre email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input v-model="loginPassword" type="password" placeholder="Entrez votre mot de passe"></ion-input>
          </ion-item>
          <ion-button expand="block" @click="login">Se connecter</ion-button>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';

const router = useRouter();
const loginEmail = ref('');
const loginPassword = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const loginAttempts = ref(0);

onMounted(() => {
  // Vérifier si déjà connecté
  const user = localStorage.getItem('currentUser');
  if (user) {
    router.push('/tabs/tab2');
  }
});

const reportFailedLogin = async (email: string) => {
  try {
    // Signaler la tentative échouée au backend
    const response = await fetch('http://localhost:8080/api/auth/report-failed-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.blocked) {
        toastMessage.value = 'Compte bloqué après trop de tentatives';
        showToast.value = true;
        return true; // Compte bloqué
      }
    }
  } catch (error) {
    console.error('Erreur lors du signalement de tentative échouée:', error);
  }
  return false; // Compte pas bloqué
};

const login = async () => {
  try {
    // Vérifier les credentials dans Firebase Firestore
    const utilisateursRef = collection(db, 'utilisateurs');
    const q = query(utilisateursRef, where('email', '==', loginEmail.value));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      toastMessage.value = 'Email non trouvé';
      showToast.value = true;
      
      // Signaler la tentative échouée
      const isBlocked = await reportFailedLogin(loginEmail.value);
      if (isBlocked) return;
      
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Vérifier le mot de passe (en production, utiliser un hash)
    if (userData.motDePasse !== loginPassword.value) {
      toastMessage.value = 'Mot de passe incorrect';
      showToast.value = true;
      
      // Signaler la tentative échouée
      const isBlocked = await reportFailedLogin(loginEmail.value);
      if (isBlocked) return;
      
      return;
    }
    
    // Vérifier si le compte est bloqué côté backend avant de permettre la connexion
    try {
      const checkBlockResponse = await fetch('http://localhost:8080/api/auth/check-blocked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // En cas d'erreur, permettre la connexion pour éviter de bloquer les utilisateurs
    }
    
    // Réinitialiser les tentatives en cas de succès
    loginAttempts.value = 0;
    
    // Connexion réussie
    const user = {
      id: userDoc.id,
      ...userData
    };
    
    // Créer ou mettre à jour l'utilisateur dans PostgreSQL
    try {
      await fetch('http://localhost:8080/api/auth/mobile-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail.value,
          nomUtilisateur: userData.nomUtilisateur || 'Mobile User',
          sourceAuth: 'mobile'
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur dans PostgreSQL:', error);
      // Ne pas bloquer la connexion si cela échoue
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Petit délai pour s'assurer que tout est bien sauvegardé
    setTimeout(() => {
      router.push('/tabs/tab2');
      
      // Forcer la mise à jour de l'état d'authentification dans TabsPage
      setTimeout(() => {
        // Dispatch un événement personnalisé pour notifier TabsPage
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Dispatch aussi un événement storage pour être sûr
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser',
          newValue: JSON.stringify(user),
          oldValue: null,
          storageArea: localStorage
        }));
        
        // Afficher le message de succès après la redirection
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
  }
};
</script>
