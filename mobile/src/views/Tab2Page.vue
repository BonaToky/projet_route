<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isViewMode ? 'Voir les problèmes' : 'Signaler un problème' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleMode">
            {{ isViewMode ? 'Signaler' : 'Voir' }}
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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonModal, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonToast } from '@ionic/vue';
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
const isViewMode = ref(false);
const allMarkers = ref<any[]>([]);

onMounted(async () => {
  // Vérifier l'authentification
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      toastMessage.value = 'Veuillez vous connecter';
      showToast.value = true;
      return;
    }
    initMapForReporting();
  });
});

const initMapForReporting = async () => {
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

    // Événement de clic sur la carte
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
  }
};

const loadAllReports = async () => {
  if (!map) return;
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

const clearAllMarkers = () => {
  allMarkers.value.forEach(m => {
    if (map) map.removeLayer(m);
  });
  allMarkers.value = [];
};

const initMapForViewing = async () => {
  if (!map) {
    // Init map if not already
    try {
      const position = await Geolocation.getCurrentPosition();
      map = L.map('map').setView([position.coords.latitude, position.coords.longitude], 10);
    } catch {
      map = L.map('map').setView([48.8566, 2.3522], 10);
    }
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  }
  loadAllReports();
};

const toggleMode = () => {
  isViewMode.value = !isViewMode.value;
  if (isViewMode.value) {
    clearAllMarkers();
    if (marker) map!.removeLayer(marker as L.Layer);
    initMapForViewing();
  } else {
    clearAllMarkers();
    initMapForReporting();
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
    const user = auth.currentUser;
    if (!user) {
      toastMessage.value = 'Utilisateur non connecté';
      showToast.value = true;
      return;
    }

    await addDoc(collection(db, 'signalements'), {
      latitude: currentLatLng.value.lat,
      longitude: currentLatLng.value.lng,
      Id_User: user.uid,
      surface: parseFloat(surface.value) || 0,
      description: description.value,
      date_ajoute: new Date(),
      statut: 'non traité'
    });

    toastMessage.value = 'Signalement envoyé avec succès';
    showToast.value = true;
    closeModal();
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error);
    toastMessage.value = `Erreur lors de l\'envoi: ${error.message || 'Connexion bloquée par le navigateur'}`;
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
