<template>
  <ion-page>
    <ion-tabs :key="authKey">
      <ion-router-outlet></ion-router-outlet>
      
      <!-- Navigation iOS 18 style - Floating centered tab bar -->
      <div class="floating-tab-bar" v-if="isAuthenticated">
        <div class="tab-bar-container">
          <router-link 
            to="/tabs/tab2" 
            custom 
            v-slot="{ navigate, isActive }"
          >
            <button 
              class="tab-button" 
              :class="{ active: isActive }" 
              @click="navigate"
            >
              <ion-icon :icon="mapOutline" class="tab-icon" />
              <span class="tab-label">Carte</span>
            </button>
          </router-link>

          <router-link 
            to="/tabs/tab3" 
            custom 
            v-slot="{ navigate, isActive }"
          >
            <button 
              class="tab-button" 
              :class="{ active: isActive }" 
              @click="navigate"
            >
              <ion-icon :icon="listOutline" class="tab-icon" />
              <span class="tab-label">Signalements</span>
            </button>
          </router-link>

          <button class="tab-button logout-btn" @click="logout">
            <ion-icon :icon="logOutOutline" class="tab-icon" />
            <span class="tab-label">Sortir</span>
          </button>
        </div>
      </div>

      <!-- Login tab bar for non-authenticated users -->
      <ion-tab-bar slot="bottom" class="login-tab-bar" v-if="!isAuthenticated">
        <ion-tab-button tab="tab1" href="/tabs/tab1">
          <ion-icon aria-hidden="true" :icon="personCircleOutline" />
          <ion-label>Connexion</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { personCircleOutline, mapOutline, listOutline, logOutOutline } from 'ionicons/icons';
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const isAuthenticated = ref(false);
const router = useRouter();
const authKey = ref(0);

onMounted(() => {
  const user = localStorage.getItem('currentUser');
  isAuthenticated.value = !!user;
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'currentUser') {
      isAuthenticated.value = !!e.newValue;
    }
  });

  // Listen for custom login event
  window.addEventListener('userLoggedIn', () => {
    isAuthenticated.value = true;
    authKey.value++;
  });
});

const logout = async () => {
  try {
    localStorage.removeItem('currentUser');
    isAuthenticated.value = false;
    authKey.value++;
    router.push('/tabs/tab1');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const updateAuthState = async () => {
  await nextTick();
  const user = localStorage.getItem('currentUser');
  isAuthenticated.value = !!user;
  authKey.value++;
};
</script>

<style scoped>
/* iOS 18 Floating Tab Bar */
.floating-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 16px 16px 34px;
  z-index: 1000;
  pointer-events: none;
}

.tab-bar-container {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 6px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(30, 58, 95, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  pointer-events: auto;
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 70px;
}

.tab-button:active {
  transform: scale(0.95);
}

.tab-button .tab-icon {
  font-size: 22px;
  color: #64748b;
  transition: all 0.3s ease;
}

.tab-button .tab-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.15), rgba(59, 130, 246, 0.15));
  box-shadow: 
    0 4px 12px rgba(30, 58, 95, 0.2),
    inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.tab-button.active .tab-icon {
  color: #1e3a5f;
}

.tab-button.active .tab-label {
  color: #1e3a5f;
}

.tab-button.logout-btn:active {
  background: rgba(239, 68, 68, 0.2);
}

.tab-button.logout-btn:active .tab-icon,
.tab-button.logout-btn:active .tab-label {
  color: #ef4444;
}

/* Login Tab Bar (non-authenticated) */
.login-tab-bar {
  --background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  --border: none;
  padding-bottom: 20px;
}

.login-tab-bar ion-tab-button {
  --color: #64748b;
  --color-selected: #1e3a5f;
}
</style>
