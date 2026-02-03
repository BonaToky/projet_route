<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title>Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openRecapModal" class="recap-btn">
            <ion-icon :icon="statsChart" slot="start" />
            Stats
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="map-page">
      <div id="map"></div>

      <!-- Modal pour le formulaire de signalement -->
      <ion-modal :is-open="showModal" @will-dismiss="closeModal" class="custom-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar class="modal-toolbar">
            <ion-title>Nouveau Signalement</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">
                <ion-icon :icon="close" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="form-container">
            <div class="form-group">
              <label>Type de problème</label>
              <ion-select v-model="typeProbleme" placeholder="Sélectionnez le type" interface="action-sheet" class="custom-select">
                <ion-select-option value="nid-de-poule">🕳️ Nid de poule</ion-select-option>
                <ion-select-option value="route-inondee">🌊 Route inondée</ion-select-option>
                <ion-select-option value="route-endommagee">⚠️ Route endommagée</ion-select-option>
                <ion-select-option value="signalisation-manquante">🚧 Signalisation manquante</ion-select-option>
                <ion-select-option value="eclairage-defectueux">💡 Éclairage défectueux</ion-select-option>
                <ion-select-option value="autre">📍 Autre</ion-select-option>
              </ion-select>
            </div>
            <div class="form-group">
              <label>Surface (m²)</label>
              <ion-input v-model="surface" type="number" placeholder="Entrez la surface estimée" class="custom-input" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <ion-textarea v-model="description" placeholder="Décrivez le problème" :rows="3" class="custom-textarea" />
            </div>
            <ion-button expand="block" @click="submitReport" class="submit-btn">
              <ion-icon :icon="send" slot="start" />
              Envoyer le signalement
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Modal pour le récapitulatif -->
      <ion-modal :is-open="showRecapModal" @will-dismiss="showRecapModal = false" class="custom-modal recap-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar class="modal-toolbar">
            <ion-title>📊 Récapitulation</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showRecapModal = false">
                <ion-icon :icon="close" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="recap-container">
            <div class="recap-card purple">
              <div class="recap-icon">📍</div>
              <div class="recap-info">
                <span class="recap-label">Points signalés</span>
                <span class="recap-value">{{ recapData.count }}</span>
              </div>
            </div>
            <div class="recap-card green">
              <div class="recap-icon">📐</div>
              <div class="recap-info">
                <span class="recap-label">Surface totale</span>
                <span class="recap-value">{{ recapData.totalSurface }} m²</span>
              </div>
            </div>
            <div class="recap-card yellow">
              <div class="recap-icon">⚡</div>
              <div class="recap-info">
                <span class="recap-label">Avancement moyen</span>
                <span class="recap-value">{{ recapData.averageAvancement }}%</span>
              </div>
            </div>
            <div class="recap-card red">
              <div class="recap-icon">💰</div>
              <div class="recap-info">
                <span class="recap-label">Budget total</span>
                <span class="recap-value">{{ recapData.totalBudget.toLocaleString() }} Ar</span>
              </div>
            </div>
            <ion-button expand="block" @click="loadRecapData" class="refresh-btn">
              <ion-icon :icon="refresh" slot="start" />
              Actualiser
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>

    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="2000"
      @didDismiss="showToast = false"
      position="top"
      color="dark"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonModal, IonButtons, IonButton, IonInput, IonTextarea, IonToast, IonSelect, IonSelectOption, IonIcon } from '@ionic/vue';
import { close, send, statsChart, refresh } from 'ionicons/icons';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';
import { db } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Custom icons for different problem types
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const problemIcons: { [key: string]: L.DivIcon } = {
  'nid-de-poule': createCustomIcon('#ef4444', '🕳️'),
  'route-inondee': createCustomIcon('#3b82f6', '🌊'),
  'route-endommagee': createCustomIcon('#f97316', '⚠️'),
  'signalisation-manquante': createCustomIcon('#eab308', '🚧'),
  'eclairage-defectueux': createCustomIcon('#8b5cf6', '💡'),
  'autre': createCustomIcon('#6b7280', '📍'),
  'default': createCustomIcon('#10b981', '📍'),
};

const getIconForProblem = (type?: string) => {
  if (!type) return problemIcons['default'];
  return problemIcons[type] || problemIcons['default'];
};

const getProblemLabel = (type?: string) => {
  const labels: { [key: string]: string } = {
    'nid-de-poule': '🕳️ Nid de poule',
    'route-inondee': '🌊 Route inondée',
    'route-endommagee': '⚠️ Route endommagée',
    'signalisation-manquante': '🚧 Signalisation manquante',
    'eclairage-defectueux': '💡 Éclairage défectueux',
    'autre': '📍 Autre',
  };
  return labels[type || ''] || '📍 Problème routier';
};

let map: L.Map | null = null;
let marker: L.Marker | null = null;
const showModal = ref(false);
const description = ref('');
const surface = ref('');
const typeProbleme = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const currentLatLng = ref<L.LatLng | null>(null);
const allMarkers = ref<any[]>([]);
const showRecapModal = ref(false);
const recapData = ref({ count: 0, totalSurface: 0, averageAvancement: 0, totalBudget: 0 });

onMounted(async () => {
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
    const position = await Geolocation.getCurrentPosition();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="
        background: linear-gradient(135deg, #1e3a5f, #3b82f6);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(30, 58, 95, 0.5);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('📍 Votre position');

    loadAllReports();

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
    map = L.map('map').setView([-18.8792, 47.5079], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    loadAllReports();
  }
};

const loadAllReports = async () => {
  if (!map) return;
  allMarkers.value.forEach(m => {
    if (map) map.removeLayer(m);
  });
  allMarkers.value = [];
  try {
    const signalementsSnapshot = await getDocs(collection(db, 'signalements'));
    const signalements: any[] = [];
    signalementsSnapshot.forEach((doc: any) => {
      signalements.push({ id: doc.id, ...doc.data() });
    });

    const travauxSnapshot = await getDocs(collection(db, 'travaux'));
    const travaux: any[] = [];
    travauxSnapshot.forEach((doc: any) => {
      travaux.push(doc.data());
    });

    signalements.forEach((signalement) => {
      const travauxAssocie = travaux.find(t => t.id_signalement === signalement.id);
      
      const markerInstance = L.marker(
        [signalement.latitude, signalement.longitude],
        { icon: getIconForProblem(signalement.type_probleme) }
      ).addTo(map!);
      
      let popupContent = `
        <div style="
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 12px;
          padding: 16px;
          min-width: 200px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600;">${getProblemLabel(signalement.type_probleme)}</h4>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Surface</span>
            <span style="font-size: 12px;">${signalement.surface} m²</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Statut</span>
            <span style="font-size: 12px;">${signalement.statut || 'Non traité'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Date</span>
            <span style="font-size: 12px;">${signalement.date_ajoute.toDate().toLocaleDateString('fr-FR')}</span>
          </div>
      `;
      
      if (travauxAssocie) {
        popupContent += `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Budget</span>
            <span style="font-size: 12px;">${travauxAssocie.budget?.toLocaleString() || 0} Ar</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0;">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Avancement</span>
            <span style="font-size: 12px;">${travauxAssocie.avancement || 0}%</span>
          </div>
        `;
      }
      
      popupContent += `
          <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.6);">${signalement.description}</p>
        </div>
      `;
      
      markerInstance.bindPopup(popupContent, {
        className: 'custom-popup-wrapper'
      });
      allMarkers.value.push(markerInstance);
    });
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error);
    toastMessage.value = 'Erreur de chargement des signalements';
    showToast.value = true;
  }
};

const closeModal = () => {
  showModal.value = false;
  description.value = '';
  surface.value = '';
  typeProbleme.value = '';
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
  if (!typeProbleme.value) {
    toastMessage.value = 'Veuillez sélectionner un type de problème';
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
      Id_User: user.id,
      surface: parseFloat(surface.value) || 0,
      type_probleme: typeProbleme.value,
      description: description.value,
      date_ajoute: new Date(),
      statut: 'non traité'
    });

    toastMessage.value = 'Signalement envoyé avec succès';
    showToast.value = true;
    closeModal();
    loadAllReports();
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error);
    toastMessage.value = `Erreur lors de l'envoi: ${error.message || 'Connexion bloquée'}`;
    showToast.value = true;
  }
};

const openRecapModal = async () => {
  await loadRecapData();
  showRecapModal.value = true;
};

const loadRecapData = async () => {
  try {
    const signalementsSnapshot = await getDocs(collection(db, 'signalements'));
    let count = 0;
    let totalSurface = 0;
    signalementsSnapshot.forEach((doc: any) => {
      count++;
      totalSurface += doc.data().surface || 0;
    });

    const travauxSnapshot = await getDocs(collection(db, 'travaux'));
    let totalBudget = 0;
    let totalAvancement = 0;
    let travauxCount = 0;
    
    travauxSnapshot.forEach((doc: any) => {
      const data = doc.data();
      totalBudget += data.budget || 0;
      totalAvancement += data.avancement || 0;
      travauxCount++;
    });

    recapData.value = { 
      count, 
      totalSurface, 
      averageAvancement: travauxCount > 0 ? Math.round(totalAvancement / travauxCount) : 0,
      totalBudget 
    };
  } catch (error: any) {
    console.error('Erreur:', error);
    toastMessage.value = 'Erreur de chargement';
    showToast.value = true;
  }
};
</script>

<style scoped>
.map-page {
  --background: #f8fafc;
}

.custom-toolbar {
  --background: #1e3a5f;
  --color: white;
  --border-width: 0;
}

.custom-toolbar ion-title {
  font-weight: 600;
}

.recap-btn {
  --color: #3b82f6;
  font-weight: 500;
}

#map {
  height: 100%;
  width: 100%;
}

.custom-modal {
  --background: transparent;
}

.custom-modal::part(content) {
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  border-top: 1px solid #e2e8f0;
}

.modal-toolbar {
  --background: #1e3a5f;
  --color: white;
  --border-width: 0;
}

.modal-toolbar ion-title {
  font-weight: 600;
}

.modal-content {
  --background: transparent;
}

.form-container {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.custom-select,
.custom-input,
.custom-textarea {
  --background: #f8fafc;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --color: #1e293b;
  --placeholder-color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.submit-btn {
  --background: linear-gradient(135deg, #1e3a5f, #2d5a8a);
  --border-radius: 12px;
  --box-shadow: 0 10px 30px -10px rgba(30, 58, 95, 0.5);
  height: 52px;
  font-weight: 600;
  margin-top: 10px;
}

.recap-modal::part(content) {
  height: 70vh;
  min-height: 450px;
  background: white;
}

.recap-modal .modal-toolbar {
  --background: linear-gradient(135deg, #1e3a5f, #3b82f6);
  --color: white;
}

.recap-modal .modal-content {
  --background: white;
}

.recap-container {
  padding: 20px;
}

.recap-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f1f5f9;
  border-radius: 16px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}

.recap-card.purple .recap-icon { background: rgba(59, 130, 246, 0.15); }
.recap-card.green .recap-icon { background: rgba(16, 185, 129, 0.15); }
.recap-card.yellow .recap-icon { background: rgba(245, 158, 11, 0.15); }
.recap-card.red .recap-icon { background: rgba(239, 68, 68, 0.15); }

.recap-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.recap-info {
  display: flex;
  flex-direction: column;
}

.recap-label {
  font-size: 13px;
  color: #64748b;
}

.recap-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.refresh-btn {
  --background: #1e3a5f;
  --border-radius: 12px;
  --color: white;
  margin-top: 8px;
  height: 48px;
}
</style>

<style>
.leaflet-popup-content-wrapper {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.leaflet-popup-content {
  margin: 0 !important;
}

.leaflet-popup-tip {
  background: #1e3a5f !important;
}

.custom-popup-wrapper .leaflet-popup-content-wrapper {
  background: transparent !important;
}
</style>
