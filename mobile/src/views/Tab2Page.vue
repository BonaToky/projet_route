<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title>Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshMap" class="refresh-btn-header">
            <ion-icon :icon="refresh" />
          </ion-button>
          <ion-button @click="goToSettings" class="settings-btn">
            <ion-icon :icon="settings" />
          </ion-button>
          <ion-button @click="syncLocalToFirestore" class="sync-btn">
            <ion-icon :icon="cloudUpload" slot="start" />
            Sync
          </ion-button>
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
            <div class="form-group">
              <label>Photos ({{ photos.length }})</label>
              <div class="photo-buttons">
                <ion-button @click="takePhoto" fill="outline" class="photo-btn">
                  <ion-icon :icon="camera" slot="start" />
                  Appareil photo
                </ion-button>
                <ion-button @click="selectFromGallery" fill="outline" class="photo-btn">
                  <ion-icon :icon="statsChart" slot="start" />
                  Galerie
                </ion-button>
              </div>
              <div class="photo-gallery" v-if="photos.length > 0">
                <div v-for="(photo, index) in photos" :key="index" class="photo-item">
                  <img :src="photo" alt="Photo" />
                  <ion-button @click="removePhoto(index)" class="remove-photo-btn" fill="clear" size="small">
                    <ion-icon :icon="trash" color="danger" />
                  </ion-button>
                </div>
              </div>
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
import { close, send, statsChart, refresh, cloudUpload, camera, trash, settings } from 'ionicons/icons';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getApiBaseUrl, apiRequest } from '@/config/api';
import { useRouter } from 'vue-router';

const router = useRouter();

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
const photos = ref<string[]>([]);
const isInitializing = ref(false);
const locationPermissionGranted = ref(false);

onMounted(async () => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    toastMessage.value = 'Veuillez vous connecter';
    showToast.value = true;
    return;
  }
  await initMapWithPermission();
});

const goToSettings = () => {
  router.push('/tabs/settings');
};

const refreshMap = () => {
  loadAllReports();
  toastMessage.value = 'Carte actualisée';
  showToast.value = true;
};

const initMapWithPermission = async () => {
  if (isInitializing.value) {
    console.log('⏳ Initialisation déjà en cours, skip...');
    return;
  }
  isInitializing.value = true;

  try {
    console.log('🗺️ Début de l\'initialisation de la carte...');
    
    // Vérifier la permission AVANT d'essayer d'obtenir la position
    const permission = await Geolocation.checkPermissions();
    console.log('🔍 État permission localisation:', permission.location);
    
    if (permission.location === 'granted') {
      // Permission déjà accordée, initialiser directement
      console.log('✅ Permission localisation déjà accordée, init carte avec GPS');
      locationPermissionGranted.value = true;
      await initMap();
    } else if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
      // Demander la permission
      console.log('📍 Demande de permission localisation à l\'utilisateur...');
      toastMessage.value = 'Veuillez autoriser l\'accès à votre position';
      showToast.value = true;
      
      const requested = await Geolocation.requestPermissions();
      console.log('📋 Résultat demande permission:', requested.location);
      
      if (requested.location === 'granted') {
        console.log('✅ Permission accordée ! Attente puis init GPS...');
        locationPermissionGranted.value = true;
        // Attendre que le système soit prêt
        await new Promise(resolve => setTimeout(resolve, 800));
        await initMap();
      } else {
        console.warn('❌ Permission localisation refusée par l\'utilisateur');
        await initMapWithDefaultLocation();
      }
    } else {
      // Permission refusée définitivement
      console.warn('❌ Permission localisation refusée (état:', permission.location, ')');
      await initMapWithDefaultLocation();
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'init carte avec permission:', error);
    await initMapWithDefaultLocation();
  } finally {
    isInitializing.value = false;
    console.log('✅ Initialisation carte terminée');
  }
};

const initMap = async () => {
  try {
    console.log('🗺️ Initialisation de la carte avec géolocalisation...');
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    console.log(`📍 Position obtenue: ${lat}, ${lng}`);

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

    toastMessage.value = '✅ Position GPS activée';
    showToast.value = true;
    
    loadAllReports();

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (marker) {
        map!.removeLayer(marker);
      }
      marker = L.marker(e.latlng).addTo(map!);
      currentLatLng.value = e.latlng;
      showModal.value = true;
    });
  } catch (error: any) {
    console.error('Erreur de géolocalisation:', error);
    await initMapWithDefaultLocation();
  }
};

const initMapWithDefaultLocation = async () => {
  console.log('🗺️ Initialisation de la carte avec position par défaut...');
  toastMessage.value = '⚠️ GPS non disponible. Position: Antananarivo';
  showToast.value = true;
  
  const defaultLat = -18.8792;
  const defaultLng = 47.5079;
  
  if (map) {
    map.remove();
  }
  
  map = L.map('map').setView([defaultLat, defaultLng], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  
  // Ajouter un marqueur à la position par défaut
  const defaultIcon = L.divIcon({
    className: 'default-marker',
    html: `<div style="
      background: #ef4444;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  
  L.marker([defaultLat, defaultLng], { icon: defaultIcon })
    .addTo(map)
    .bindPopup('📍 Position par défaut (Antananarivo)');
  
  loadAllReports();
  
  map.on('click', (e: L.LeafletMouseEvent) => {
    console.log('🗺️ Clic sur la carte:', e.latlng);
    if (marker) {
      map!.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map!);
    currentLatLng.value = e.latlng;
    showModal.value = true;
  });
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
      
      // Gérer la date de manière sécurisée
      let dateStr = 'N/A';
      try {
        if (signalement.date_ajoute) {
          if (typeof signalement.date_ajoute.toDate === 'function') {
            dateStr = signalement.date_ajoute.toDate().toLocaleDateString('fr-FR');
          } else if (signalement.date_ajoute instanceof Date) {
            dateStr = signalement.date_ajoute.toLocaleDateString('fr-FR');
          } else {
            dateStr = new Date(signalement.date_ajoute).toLocaleDateString('fr-FR');
          }
        }
      } catch (e) {
        console.warn('Erreur format date:', e);
      }

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
            <span style="font-size: 12px;">${signalement.surface || 0} m²</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Statut</span>
            <span style="font-size: 12px;">${signalement.statut || 'Non traité'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.5); font-size: 12px;">Date</span>
            <span style="font-size: 12px;">${dateStr}</span>
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

const openSignalementModal = async () => {
  try {
    // Essayer d'obtenir la position GPS actuelle
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    });
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    currentLatLng.value = L.latLng(lat, lng);
    
    if (marker && map) {
      map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map!);
    
    toastMessage.value = 'Position GPS obtenue';
    showToast.value = true;
    showModal.value = true;
  } catch (error: any) {
    console.warn('GPS non disponible, utilisation du centre de la carte:', error);
    
    // Si GPS échoue, utiliser le centre de la carte
    if (map) {
      const center = map.getCenter();
      currentLatLng.value = center;
      
      if (marker) {
        map.removeLayer(marker);
      }
      marker = L.marker([center.lat, center.lng]).addTo(map);
      
      toastMessage.value = 'Utilisation du centre de la carte';
      showToast.value = true;
      showModal.value = true;
    } else {
      toastMessage.value = 'Carte non initialisée';
      showToast.value = true;
    }
  }
};

const closeModal = () => {
  showModal.value = false;
  description.value = '';
  surface.value = '';
  typeProbleme.value = '';
  photos.value = [];
  if (marker && map) {
    map.removeLayer(marker as L.Layer);
    marker = null;
  }
  currentLatLng.value = null;
};

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 40,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 800,
      height: 800
    });
    
    if (image.dataUrl) {
      photos.value.push(image.dataUrl);
    }
  } catch (error: any) {
    console.error('Erreur lors de la prise de photo:', error);
    toastMessage.value = 'Erreur lors de la prise de photo';
    showToast.value = true;
  }
};

const selectFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 40,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 800,
      height: 800
    });
    
    if (image.dataUrl) {
      photos.value.push(image.dataUrl);
    }
  } catch (error: any) {
    console.error('Erreur lors de la sélection:', error);
    toastMessage.value = 'Erreur lors de la sélection de la photo';
    showToast.value = true;
  }
};

const removePhoto = (index: number) => {
  photos.value.splice(index, 1);
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

    // Stocker les photos directement en base64 (pas besoin de Storage)
    await addDoc(collection(db, 'signalements'), {
      latitude: currentLatLng.value.lat,
      longitude: currentLatLng.value.lng,
      Id_User: user.id,
      surface: parseFloat(surface.value) || 0,
      type_probleme: typeProbleme.value,
      description: description.value,
      date_ajoute: new Date(),
      statut: 'non traité',
      photos: photos.value // Stocker les base64 directement
    });

    // Synchroniser automatiquement vers PostgreSQL
    try {
      const apiUrl = getApiBaseUrl();
      const syncResponse = await apiRequest(`${apiUrl}/signalements/sync`);
      if (syncResponse.ok) {
        console.log('Signalement synchronisé vers PostgreSQL');
      }
    } catch (syncError) {
      console.error('Erreur de synchronisation:', syncError);
      // Ne pas bloquer l'utilisateur si la sync échoue
    }

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

const syncLocalToFirestore = async () => {
  try {
    const apiUrl = getApiBaseUrl();
    let syncedCount = 0;
    let updatedCount = 0;

    console.log('🔄 Démarrage synchronisation PostgreSQL → Firestore');

    // 1. SYNC UTILISATEURS (créés/modifiés par manager)
    try {
      const usersResponse = await apiRequest(`${apiUrl}/auth/users`);
      if (usersResponse.ok) {
        const localUsers = await usersResponse.json();
        console.log(`📥 ${localUsers.length} utilisateurs trouvés dans PostgreSQL`);

        for (const user of localUsers) {
          if (!user.email) continue;

          // Chercher l'utilisateur dans Firestore par email
          const usersQuery = query(
            collection(db, 'utilisateurs'),
            where('email', '==', user.email)
          );
          const userSnapshot = await getDocs(usersQuery);

          if (userSnapshot.empty) {
            // Créer dans Firestore
            await addDoc(collection(db, 'utilisateurs'), {
              nom_utilisateur: user.nomUtilisateur || '',
              email: user.email,
              role: user.role?.nom || 'UTILISATEUR',
              est_bloque: user.estBloque || false,
              date_creation: user.dateCreation ? new Date(user.dateCreation) : new Date(),
              source_auth: user.sourceAuth || 'local'
            });
            syncedCount++;
            console.log(`✅ Utilisateur créé: ${user.email}`);
          } else {
            // Mettre à jour dans Firestore
            const docId = userSnapshot.docs[0].id;
            await updateDoc(doc(db, 'utilisateurs', docId), {
              nom_utilisateur: user.nomUtilisateur || '',
              role: user.role?.nom || 'UTILISATEUR',
              est_bloque: user.estBloque || false,
              source_auth: user.sourceAuth || 'local'
            });
            updatedCount++;
            console.log(`🔄 Utilisateur mis à jour: ${user.email}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur sync utilisateurs:', error);
    }

    // 2. SYNC SIGNALEMENTS (créés/modifiés par manager)
    try {
      const sigResponse = await apiRequest(`${apiUrl}/signalements`);
      if (sigResponse.ok) {
        const localSignalements = await sigResponse.json();
        console.log(`📥 ${localSignalements.length} signalements trouvés dans PostgreSQL`);

        for (const sig of localSignalements) {
          // Vérifier si le signalement a un firestoreId (déjà synchro depuis mobile)
          if (sig.firestoreId) {
            // Signalement créé depuis mobile, juste mettre à jour si nécessaire
            try {
              const docRef = doc(db, 'signalements', sig.firestoreId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                // Mettre à jour seulement le statut et les infos modifiables
                await updateDoc(docRef, {
                  statut: sig.statut || 'non traité',
                  surface: sig.surface ? parseFloat(sig.surface) : null,
                  description: sig.description || ''
                });
                updatedCount++;
                console.log(`🔄 Signalement mobile mis à jour: ${sig.firestoreId}`);
              }
            } catch (err) {
              console.warn(`⚠️ Erreur mise à jour signalement ${sig.firestoreId}:`, err);
            }
            continue; // Ne pas créer de doublon
          }

          // Signalement créé par le manager (pas de firestoreId)
          // Chercher par coordonnées pour éviter doublons
          const sigQuery = query(
            collection(db, 'signalements'),
            where('latitude', '==', parseFloat(sig.latitude)),
            where('longitude', '==', parseFloat(sig.longitude))
          );
          const sigSnapshot = await getDocs(sigQuery);

          const sigData = {
            id_signalement: sig.idSignalement?.toString(),
            type_probleme: sig.typeProbleme || '',
            description: sig.description || '',
            latitude: sig.latitude ? parseFloat(sig.latitude) : null,
            longitude: sig.longitude ? parseFloat(sig.longitude) : null,
            surface: sig.surface ? parseFloat(sig.surface) : null,
            statut: sig.statut || 'non traité',
            photos: sig.photos || [],
            date_ajoute: sig.dateSignalement ? new Date(sig.dateSignalement) : new Date(),
            Id_User: sig.utilisateur?.idUtilisateur?.toString() || 'manager'
          };

          if (sigSnapshot.empty) {
            // Créer dans Firestore seulement si vraiment nouveau
            await addDoc(collection(db, 'signalements'), sigData);
            syncedCount++;
            console.log(`✅ Signalement manager créé: ${sig.idSignalement}`);
          } else {
            // Mettre à jour dans Firestore
            const docId = sigSnapshot.docs[0].id;
            await updateDoc(doc(db, 'signalements', docId), sigData);
            updatedCount++;
            console.log(`🔄 Signalement existant mis à jour: ${sig.idSignalement}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur sync signalements:', error);
    }

    // 3. SYNC TRAVAUX (créés/modifiés par manager offline)
    try {
      console.log('🔄 Début sync TRAVAUX...');
      const travauxResponse = await apiRequest(`${apiUrl}/travaux`);
      if (travauxResponse.ok) {
        const localTravaux = await travauxResponse.json();
        console.log(`📥 ${localTravaux.length} travaux trouvés dans PostgreSQL`);
        console.log('Travaux détails:', JSON.stringify(localTravaux, null, 2));

        for (const travail of localTravaux) {
          if (!travail.signalement?.idSignalement) {
            console.warn('⚠️ Travail sans signalement, skip:', travail.id);
            continue;
          }

          let firestoreSignalementId = null;

          // STRATÉGIE 0: Si le signalement PostgreSQL a déjà un firestoreId, l'utiliser directement
          if (travail.signalement.firestoreId) {
            firestoreSignalementId = travail.signalement.firestoreId;
            console.log(`✅ Utilisation firestoreId depuis PostgreSQL: ${firestoreSignalementId}`);
            
            // Vérifier que le document existe toujours dans Firestore
            const docRef = doc(db, 'signalements', firestoreSignalementId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              console.warn(`⚠️ Document Firestore ${firestoreSignalementId} n'existe plus, recherche nécessaire`);
              firestoreSignalementId = null;
            }
          }

          // Si pas de firestoreId ou document inexistant, chercher par d'autres méthodes
          if (!firestoreSignalementId) {
            // Récupérer le signalement complet depuis PostgreSQL pour avoir les coordonnées
            console.log(`🔍 Récupération signalement PostgreSQL ID: ${travail.signalement.idSignalement}`);
            const sigPgResponse = await apiRequest(`${apiUrl}/signalements/${travail.signalement.idSignalement}`);
            if (!sigPgResponse.ok) {
              console.warn(`⚠️ Signalement PostgreSQL non trouvé: ${travail.signalement.idSignalement}`);
              continue;
            }
            const sigPg = await sigPgResponse.json();
            console.log(`✅ Signalement PostgreSQL récupéré:`, sigPg);

            // STRATÉGIE 1: Chercher par id_signalement (si le signalement vient du manager)
            const sigQueryById = query(
              collection(db, 'signalements'),
              where('id_signalement', '==', travail.signalement.idSignalement.toString())
            );
            const sigSnapshotById = await getDocs(sigQueryById);
            
            if (!sigSnapshotById.empty) {
              firestoreSignalementId = sigSnapshotById.docs[0].id;
              console.log(`✅ Signalement trouvé par id_signalement: ${firestoreSignalementId}`);
            } else {
              // STRATÉGIE 2: Chercher par coordonnées (si le signalement vient du mobile)
              console.log(`🔍 Recherche par coordonnées: lat=${sigPg.latitude}, lng=${sigPg.longitude}`);
              const sigQueryByCoords = query(
                collection(db, 'signalements'),
                where('latitude', '==', parseFloat(sigPg.latitude)),
                where('longitude', '==', parseFloat(sigPg.longitude))
              );
              const sigSnapshotByCoords = await getDocs(sigQueryByCoords);
              
              if (!sigSnapshotByCoords.empty) {
                firestoreSignalementId = sigSnapshotByCoords.docs[0].id;
                console.log(`✅ Signalement trouvé par coordonnées: ${firestoreSignalementId}`);
                
                // Ajouter l'id_signalement au document Firestore pour les futures syncs
                await updateDoc(doc(db, 'signalements', firestoreSignalementId), {
                  id_signalement: travail.signalement.idSignalement.toString()
                });
                console.log(`🔄 id_signalement ajouté au document Firestore`);
              } else {
                console.warn(`⚠️ Signalement Firestore non trouvé (ni par ID ni par coordonnées)`);
                continue;
              }
            }
          }

          // Chercher si des travaux existent déjà pour ce signalement Firestore
          console.log(`🔍 Recherche travaux Firestore pour signalement: ${firestoreSignalementId}`);
          const travauxQuery = query(
            collection(db, 'travaux'),
            where('id_signalement', '==', firestoreSignalementId)
          );
          const travauxSnapshot = await getDocs(travauxQuery);
          console.log(`📊 Travaux trouvés dans Firestore: ${travauxSnapshot.docs.length}`);

          const travauxData = {
            id_signalement: firestoreSignalementId, // ID Firestore du document signalement
            id_entreprise: travail.entreprise?.idEntreprise?.toString() || '',
            budget: travail.budget ? parseFloat(travail.budget) : 0,
            date_debut_travaux: travail.dateDebutTravaux ? new Date(travail.dateDebutTravaux) : new Date(),
            date_fin_travaux: travail.dateFinTravaux ? new Date(travail.dateFinTravaux) : new Date(),
            avancement: travail.avancement ? parseFloat(travail.avancement) : 0
          };
          console.log(`📝 Données travaux à synchroniser:`, travauxData);

          if (travauxSnapshot.empty) {
            // Créer dans Firestore
            console.log(`➕ Création nouveau travail dans Firestore...`);
            try {
              const docRef = await addDoc(collection(db, 'travaux'), travauxData);
              console.log(`✅ Travail créé dans Firestore: ${docRef.id}`);
              syncedCount++;
            } catch (error) {
              console.error(`❌ Erreur création travail:`, error);
            }
          } else {
            // Mettre à jour dans Firestore
            console.log(`🔄 Mise à jour travail existant dans Firestore...`);
            try {
              const docId = travauxSnapshot.docs[0].id;
              await updateDoc(doc(db, 'travaux', docId), travauxData);
              console.log(`✅ Travail mis à jour dans Firestore: ${docId}`);
              updatedCount++;
            } catch (error) {
              console.error(`❌ Erreur mise à jour travail:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur sync travaux:', error);
    }

    // 4. SYNC HISTORIQUES_TRAVAUX
    console.log('🔄 Début sync HISTORIQUES...');
    try {
      const histResponse = await apiRequest(`${apiUrl}/travaux/historiques`);
      if (histResponse.ok) {
        const localHistoriques = await histResponse.json();
        console.log(`📥 ${localHistoriques.length} historiques trouvés dans PostgreSQL`);
        console.log('Historiques détails:', JSON.stringify(localHistoriques, null, 2));

        // Récupérer tous les travaux de Firestore pour faire le mapping
        console.log(`🔍 Récupération de tous les travaux Firestore...`);
        const allTravauxFs = await getDocs(collection(db, 'travaux'));
        console.log(`📊 Travaux Firestore trouvés: ${allTravauxFs.docs.length}`);
        
        const travauxMapping = new Map(); // Map: signalement_id_firestore -> travaux_id_firestore
        
        allTravauxFs.forEach(travauxDoc => {
          const data = travauxDoc.data();
          travauxMapping.set(data.id_signalement, travauxDoc.id);
          console.log(`📌 Mapping: signalement ${data.id_signalement} -> travail ${travauxDoc.id}`);
        });

        for (const hist of localHistoriques) {
          console.log(`🔍 Traitement historique PostgreSQL ID: ${hist.id}`);
          
          if (!hist.travaux?.signalement?.idSignalement) {
            console.warn('⚠️ Historique sans signalement dans travaux, skip:', hist.id);
            continue;
          }

          let firestoreSignalementId = null;

          // STRATÉGIE 0: Utiliser firestoreId depuis PostgreSQL si disponible
          if (hist.travaux.signalement.firestoreId) {
            firestoreSignalementId = hist.travaux.signalement.firestoreId;
            console.log(`✅ Utilisation firestoreId depuis PostgreSQL: ${firestoreSignalementId}`);
          } else {
            // Trouver le signalement Firestore correspondant par id_signalement
            const signalementPgId = hist.travaux.signalement.idSignalement;
            console.log(`🔍 Recherche signalement Firestore pour PG ID: ${signalementPgId}`);
            const sigQuery = query(
              collection(db, 'signalements'),
              where('id_signalement', '==', signalementPgId.toString())
            );
            const sigSnapshot = await getDocs(sigQuery);
            
            if (sigSnapshot.empty) {
              console.warn(`⚠️ Signalement Firestore non trouvé pour historique (id_signalement=${signalementPgId})`);
              continue;
            }
            
            firestoreSignalementId = sigSnapshot.docs[0].id;
            console.log(`✅ Signalement Firestore trouvé: ${firestoreSignalementId}`);
          }
          
          // Trouver le travail Firestore correspondant via le mapping
          const firestoreTravauxId = travauxMapping.get(firestoreSignalementId);
          console.log(`🔍 Recherche travail via mapping pour signalement: ${firestoreSignalementId}`);
          
          if (!firestoreTravauxId) {
            console.warn(`⚠️ Travail Firestore non trouvé pour signalement: ${firestoreSignalementId}`);
            continue;
          }
          console.log(`✅ Travail Firestore trouvé: ${firestoreTravauxId}`);

          // Chercher l'historique par postgres_id
          console.log(`🔍 Recherche historique existant pour postgres_id: ${hist.id}`);
          const histQuery = query(
            collection(db, 'historiques_travaux'),
            where('postgres_id', '==', hist.id?.toString())
          );
          const histSnapshot = await getDocs(histQuery);
          console.log(`📊 Historiques trouvés dans Firestore: ${histSnapshot.docs.length}`);

          const histData = {
            postgres_id: hist.id?.toString(),
            id_travaux: firestoreTravauxId, // ID Firestore du document travaux
            date_modification: hist.dateModification ? new Date(hist.dateModification) : new Date(),
            avancement: hist.avancement ? parseFloat(hist.avancement) : 0,
            commentaire: hist.commentaire || ''
          };
          console.log(`📝 Données historique à synchroniser:`, histData);

          if (histSnapshot.empty) {
            // Créer dans Firestore
            console.log(`➕ Création nouvel historique dans Firestore...`);
            try {
              const docRef = await addDoc(collection(db, 'historiques_travaux'), histData);
              console.log(`✅ Historique créé dans Firestore: ${docRef.id}`);
              syncedCount++;
            } catch (error) {
              console.error(`❌ Erreur création historique:`, error);
            }
          } else {
            // Mettre à jour dans Firestore
            console.log(`🔄 Mise à jour historique existant dans Firestore...`);
            try {
              const docId = histSnapshot.docs[0].id;
              await updateDoc(doc(db, 'historiques_travaux', docId), histData);
              console.log(`✅ Historique mis à jour dans Firestore: ${docId}`);
              updatedCount++;
            } catch (error) {
              console.error(`❌ Erreur mise à jour historique:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur sync historiques:', error);
    }

    console.log(`✅ Synchronisation terminée: ${syncedCount} créés, ${updatedCount} mis à jour`);
    toastMessage.value = `✅ Sync terminée: ${syncedCount} créés, ${updatedCount} mis à jour`;
    showToast.value = true;
  } catch (error: any) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    toastMessage.value = `❌ Erreur: ${error.message || 'Connexion bloquée'}`;
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

.photo-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.photo-btn {
  flex: 1;
  --border-width: 1px;
  --border-color: #1e3a5f;
  --color: #1e3a5f;
  --border-radius: 10px;
  height: 42px;
  font-size: 13px;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  --background: rgba(255, 255, 255, 0.9);
  --border-radius: 50%;
  --padding-start: 0;
  --padding-end: 0;
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
