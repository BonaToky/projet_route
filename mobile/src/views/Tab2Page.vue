<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des problèmes</ion-title>
      <ion-buttons slot="end">
          <ion-button @click="openRecapModal">
            Récapitulation
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="map" style="height: 100%; width: 100%;"></div>

      <!-- Modal pour le formulaire de signalement -->
      <ion-modal :is-open="showModal" @will-dismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Signaler un problème</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-item>
            <ion-label position="floating">Surface (m²)</ion-label>
            <ion-input v-model="surface" type="number" placeholder="Entrez la surface estimée"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Description</ion-label>
            <ion-textarea v-model="description" placeholder="Décrivez le problème"></ion-textarea>
          </ion-item>
          <ion-button expand="block" @click="submitReport">Envoyer le signalement</ion-button>
        </ion-content>
      </ion-modal>

      <!-- Modal pour le récapitulatif -->
      <ion-modal :is-open="showRecapModal" @will-dismiss="showRecapModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Récapitulation des signalements</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showRecapModal = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item>
              <ion-label>Nombre de points signalés</ion-label>
              <ion-note slot="end">{{ recapData.count }}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Total surface signalée (m²)</ion-label>
              <ion-note slot="end">{{ recapData.totalSurface }}</ion-note>
            </ion-item>
          </ion-list>
          <ion-button expand="block" @click="loadRecapData">Actualiser</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonModal, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonToast, IonList, IonNote } from '@ionic/vue';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';
import { db, auth } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

let map: L.Map | null = null;
let marker: L.Marker | null = null;
const showModal = ref(false);
const description = ref('');
const surface = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const currentLatLng = ref<L.LatLng | null>(null);
const allMarkers = ref<any[]>([]);
const showRecapModal = ref(false);
const recapData = ref({ count: 0, totalSurface: 0 });

onMounted(async () => {
  // Vérifier l'authentification
  const user = localStorage.getItem('currentUser');
  if (!user) {
    toastMessage.value = 'Veuillez vous connecter';
    showToast.value = true;
    return;
  }
  initMap();
});

const initMap = async () => {
  try {
    // Obtenir la position actuelle
    const position = await Geolocation.getCurrentPosition();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Initialiser la carte
    map = L.map('map').setView([lat, lng], 15);

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Ajouter un marqueur pour la position actuelle
    L.marker([lat, lng]).addTo(map).bindPopup('Votre position').openPopup();

    // Charger tous les signalements
    loadAllReports();

    // Événement de clic sur la carte pour signaler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (marker) {
        map!.removeLayer(marker);
      }
      marker = L.marker(e.latlng).addTo(map!);
      currentLatLng.value = e.latlng;
      showModal.value = true;
    });
  } catch (error) {
    console.error('Erreur de géolocalisation:', error);
    toastMessage.value = 'Erreur de géolocalisation';
    showToast.value = true;
    // Carte par défaut si géolocalisation échoue
    map = L.map('map').setView([48.8566, 2.3522], 10); // Paris par défaut
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    loadAllReports();
  }
};

const loadAllReports = async () => {
  if (!map) return;
  // Clear existing markers
  allMarkers.value.forEach(m => {
    if (map) map.removeLayer(m);
  });
  allMarkers.value = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'signalements'));
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      const marker = L.marker([data.latitude, data.longitude]).addTo(map!);
      marker.bindPopup(`
        <b>Nid de poule</b><br>
        Surface: ${data.surface} m²<br>
        Statut: ${data.statut}<br>
        Date: ${data.date_ajoute.toDate().toLocaleDateString('fr-FR')}
      `);
      allMarkers.value.push(marker);
    });
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error);
    toastMessage.value = 'Erreur de chargement des signalements';
    showToast.value = true;
  }
};

const closeModal = () => {
  description.value = '';
  surface.value = '';
  if (marker && map) {
    map.removeLayer(marker as L.Layer);
    marker = null;
  }
  currentLatLng.value = null;
};

const submitReport = async () => {
  if (!currentLatLng.value) {
    toastMessage.value = 'Veuillez sélectionner un emplacement';
    showToast.value = true;
    return;
  }
  if (!surface.value || parseFloat(surface.value) <= 0) {
    toastMessage.value = 'Veuillez entrer une surface valide';
    showToast.value = true;
    return;
  }

  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      toastMessage.value = 'Utilisateur non connecté';
      showToast.value = true;
      return;
    }
    const user = JSON.parse(userStr);

    await addDoc(collection(db, 'signalements'), {
      latitude: currentLatLng.value.lat,
      longitude: currentLatLng.value.lng,
      Id_User: user.idUtilisateur, // Use user ID
      surface: parseFloat(surface.value) || 0,
      description: description.value,
      date_ajoute: new Date(),
      statut: 'non traité'
    });

    toastMessage.value = 'Signalement envoyé avec succès';
    showToast.value = true;
    closeModal();
    // Recharger les signalements pour afficher le nouveau
    loadAllReports();
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error);
    toastMessage.value = `Erreur lors de l\'envoi: ${error.message || 'Connexion bloquée par le navigateur'}`;
    showToast.value = true;
  }
};

const openRecapModal = async () => {
  await loadRecapData();
  showRecapModal.value = true;
};

const loadRecapData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'signalements'));
    let count = 0;
    let totalSurface = 0;
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      count++;
      totalSurface += data.surface || 0;
    });
    recapData.value = { count, totalSurface };
  } catch (error: any) {
    console.error('Erreur lors du chargement du récapitulatif:', error);
    toastMessage.value = 'Erreur de chargement du récapitulatif';
    showToast.value = true;
  }
};
</script>

<style scoped>
#map {
  height: 100vh;
  width: 100%;
}
</style>
