<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion / Inscription</ion-title>
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

      <ion-card>
        <ion-card-header>
          <ion-card-title>Inscription</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input v-model="registerEmail" type="email" placeholder="Entrez votre email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input v-model="registerPassword" type="password" placeholder="Entrez votre mot de passe"></ion-input>
          </ion-item>
          <ion-button expand="block" @click="register">S'inscrire</ion-button>
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
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/vue';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// @ts-ignore
import { auth } from '../firebase';
import axios from 'axios';

const loginEmail = ref('');
const loginPassword = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const showToast = ref(false);
const toastMessage = ref('');

const login = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    const token = await userCredential.user.getIdToken();
    const response = await axios.post('http://localhost:8080/auth/firebase-login', { token });
    toastMessage.value = response.data;
    showToast.value = true;
  } catch (error: any) {
    toastMessage.value = 'Erreur de connexion: ' + error.message;
    showToast.value = true;
  }
};

const register = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value);
    const token = await userCredential.user.getIdToken();
    const response = await axios.post('http://localhost:8080/auth/firebase-register', { token });
    toastMessage.value = response.data;
    showToast.value = true;
  } catch (error: any) {
    toastMessage.value = 'Erreur d\'inscription: ' + error.message;
    showToast.value = true;
  }
};
</script>
