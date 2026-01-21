<template>
  <ion-page>
    <ion-tabs :key="authKey">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Auth</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2" v-if="isAuthenticated">
          <ion-icon aria-hidden="true" :icon="map" />
          <ion-label>Signaler</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3" v-if="isAuthenticated">
          <ion-icon aria-hidden="true" :icon="list" />
          <ion-label>Mes signalements</ion-label>
        </ion-tab-button>

        <ion-tab-button @click="logout" v-if="isAuthenticated" style="margin-left: auto;">
          <ion-icon aria-hidden="true" :icon="logOut" />
          <ion-label>Déconnexion</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { ellipse, square, triangle, person, map, list, logOut } from 'ionicons/icons';
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const isAuthenticated = ref(false);
const router = useRouter();
const authKey = ref(0);

onMounted(() => {
  // Vérifier l'authentification via localStorage
  const user = localStorage.getItem('currentUser');
  isAuthenticated.value = !!user;
  
  // Écouter les changements dans localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'currentUser') {
      isAuthenticated.value = !!e.newValue;
    }
  });
});

const logout = async () => {
  try {
    // Supprimer l'utilisateur du localStorage
    localStorage.removeItem('currentUser');
    isAuthenticated.value = false;
    authKey.value++;
    router.push('/tabs/tab1');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

// Fonction pour forcer la mise à jour de l'état d'authentification
const updateAuthState = async () => {
  await nextTick();
  const user = localStorage.getItem('currentUser');
  isAuthenticated.value = !!user;
  // Forcer le re-render en changeant la clé
  authKey.value++;
};
</script>
