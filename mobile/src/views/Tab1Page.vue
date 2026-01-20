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
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const loginEmail = ref('');
const loginPassword = ref('');
const showToast = ref(false);
const toastMessage = ref('');

onMounted(() => {
  // Vérifier si déjà connecté
  const user = localStorage.getItem('currentUser');
  if (user) {
    router.push('/tabs/tab2');
  }
});

const login = async () => {
  try {
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: loginEmail.value,
      password: loginPassword.value
    });
    // Supposons que la réponse contient les infos utilisateur
    const user = response.data;
    localStorage.setItem('currentUser', JSON.stringify(user));
    toastMessage.value = 'Connexion réussie';
    showToast.value = true;
    setTimeout(() => {
      router.push('/tabs/tab2');
    }, 2000);
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Erreur inconnue';
    toastMessage.value = 'Erreur de connexion: ' + errorMsg;
    showToast.value = true;
  }
};
</script>
