<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mes signalements</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Mes signalements</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list v-if="reports.length > 0">
        <ion-item v-for="report in reports" :key="report.id">
          <ion-label>
            <h2>Nid de poule - {{ report.surface }} m²</h2>
            <p>{{ report.description }}</p>
            <p><small>{{ report.travaux ? `Avancement: ${report.travaux.avancement}%` : 'Statut: Non traité' }} | Date: {{ formatDate(report.date_ajoute) }}</small></p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-text v-else color="medium" class="ion-padding">
        <p>Aucun signalement trouvé.</p>
      </ion-text>

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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonText, IonToast } from '@ionic/vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

interface Report {
  id: string;
  description: string;
  statut: string;
  date_ajoute: any;
  latitude: number;
  longitude: number;
  surface: number;
}

const reports = ref<Report[]>([]);
const showToast = ref(false);
const toastMessage = ref('');

onMounted(() => {
  // Vérifier l'authentification
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    toastMessage.value = 'Veuillez vous connecter';
    showToast.value = true;
    return;
  }
  const user = JSON.parse(userStr);
  fetchReports(user.email);
});

const fetchReports = async (userEmail: string) => {
  try {
    const q = query(collection(db, 'signalements'), where('Id_User', '==', userEmail));
    const querySnapshot = await getDocs(q);
    reports.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Report));
  } catch (error: any) {
    console.error('Erreur lors de la récupération:', error);
    toastMessage.value = `Erreur: ${error.message}`;
    showToast.value = true;
  }
};

const formatDate = (timestamp: any) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('fr-FR');
  }
  return 'Date inconnue';
};
</script>
