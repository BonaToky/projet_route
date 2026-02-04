<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title>⚙️ Paramètres</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="settings-page">
      <div class="settings-container">
        <div class="settings-card">
          <div class="card-header">
            <ion-icon :icon="server" class="header-icon" />
            <h2>Configuration Serveur</h2>
            <p>Configurez l'adresse IP du serveur backend</p>
          </div>

          <div class="form-group">
            <label>Adresse IP du serveur</label>
            <ion-input 
              v-model="serverIp" 
              placeholder="Ex: 192.168.1.100" 
              class="custom-input"
              type="text"
            />
            <div class="input-hint">
              <ion-icon :icon="informationCircle" />
              <span>Laissez vide pour utiliser localhost (émulateur)</span>
            </div>
          </div>

          <div class="button-group">
            <ion-button expand="block" @click="testConnection" class="test-btn">
              <ion-icon :icon="wifi" slot="start" />
              Tester la connexion
            </ion-button>
            <ion-button expand="block" @click="saveSettings" class="save-btn">
              <ion-icon :icon="save" slot="start" />
              Enregistrer
            </ion-button>
          </div>

          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
            <ion-icon :icon="testResult.success ? checkmarkCircle : closeCircle" />
            <span>{{ testResult.message }}</span>
          </div>
        </div>

        <div class="info-card">
          <h3>💡 Comment trouver votre IP ?</h3>
          <div class="info-step">
            <strong>Sur Windows :</strong>
            <ol>
              <li>Ouvrez <code>cmd</code></li>
              <li>Tapez <code>ipconfig</code></li>
              <li>Cherchez "Adresse IPv4"</li>
            </ol>
          </div>
          <div class="info-step">
            <strong>Exemple :</strong>
            <p><code>192.168.1.100</code> ou <code>192.168.43.1</code></p>
          </div>
          <div class="info-note">
            ⚠️ Votre téléphone et le PC doivent être sur le même réseau WiFi
          </div>
        </div>

        <div class="current-config">
          <h4>📡 Configuration actuelle</h4>
          <div class="config-item">
            <span class="label">URL de l'API :</span>
            <span class="value">{{ currentApiUrl }}</span>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="2000"
      @didDismiss="showToast = false"
      position="top"
      :color="toastColor"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonToast, IonIcon } from '@ionic/vue';
import { server, wifi, save, informationCircle, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { getApiBaseUrl } from '@/config/api';

const serverIp = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref('success');
const currentApiUrl = ref('');
const testResult = ref<{success: boolean, message: string} | null>(null);

onMounted(() => {
  // Charger l'IP sauvegardée
  const savedIp = localStorage.getItem('api_server_ip');
  if (savedIp) {
    serverIp.value = savedIp;
  }
  updateCurrentUrl();
});

const updateCurrentUrl = () => {
  currentApiUrl.value = getApiBaseUrl();
};

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
    const testUrl = `http://${serverIp.value}:8080/api/auth/params`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

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
    testResult.value = {
      success: false,
      message: `❌ Impossible de se connecter: ${error.message}`
    };
  }
};

const saveSettings = () => {
  if (serverIp.value.trim()) {
    localStorage.setItem('api_server_ip', serverIp.value.trim());
  } else {
    localStorage.removeItem('api_server_ip');
  }
  
  updateCurrentUrl();
  
  toastMessage.value = 'Paramètres enregistrés ! Redémarrez l\'application pour appliquer les changements.';
  toastColor.value = 'success';
  showToast.value = true;
};
</script>

<style scoped>
.settings-page {
  --background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
}

.settings-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.settings-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.header-icon {
  font-size: 48px;
  color: #1e3a5f;
  margin-bottom: 12px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 24px;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.custom-input {
  --background: #f8fafc;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --color: #1e293b;
  --placeholder-color: #94a3b8;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 8px;
  font-size: 13px;
  color: #1e40af;
}

.input-hint ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-btn {
  --background: #3b82f6;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  height: 48px;
  font-weight: 600;
}

.save-btn {
  --background: #10b981;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  height: 48px;
  font-weight: 600;
}

.test-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
}

.test-result.success {
  background: #d1fae5;
  color: #065f46;
}

.test-result.error {
  background: #fee2e2;
  color: #991b1b;
}

.test-result ion-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  color: #1e293b;
  font-size: 18px;
}

.info-step {
  margin-bottom: 16px;
}

.info-step strong {
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
}

.info-step ol {
  margin: 8px 0 0 20px;
  padding: 0;
  color: #475569;
}

.info-step li {
  margin: 4px 0;
}

.info-step code {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #1e293b;
  font-size: 13px;
}

.info-note {
  margin-top: 12px;
  padding: 12px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
  font-weight: 500;
}

.current-config {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
}

.current-config h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.config-item .label {
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.config-item .value {
  font-family: monospace;
  color: #1e293b;
  font-size: 13px;
  word-break: break-all;
}

.custom-toolbar {
  --background: #1e3a5f;
  --color: white;
}
</style>
