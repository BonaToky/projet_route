<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="stats-toolbar">
        <ion-title>Statistiques</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="loadStats" class="header-action-btn">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="stats-page">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div class="stats-content">
        <!-- Summary hero -->
        <div class="hero-section">
          <div class="hero-title">Vue d'ensemble</div>
          <div class="hero-subtitle">Données synchronisées depuis Firestore</div>
        </div>

        <!-- KPI Cards grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-wrap blue">
              <ion-icon :icon="locationOutline" />
            </div>
            <div class="kpi-value">{{ stats.signalements }}</div>
            <div class="kpi-label">Signalements</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap green">
              <ion-icon :icon="constructOutline" />
            </div>
            <div class="kpi-value">{{ stats.travaux }}</div>
            <div class="kpi-label">Travaux</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap amber">
              <ion-icon :icon="resizeOutline" />
            </div>
            <div class="kpi-value">{{ stats.totalSurface }}<span class="kpi-unit">m²</span></div>
            <div class="kpi-label">Surface totale</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap purple">
              <ion-icon :icon="walletOutline" />
            </div>
            <div class="kpi-value">{{ formatBudget(stats.totalBudget) }}</div>
            <div class="kpi-label">Budget total</div>
          </div>
        </div>

        <!-- Progress section -->
        <div class="section-card">
          <div class="section-header">
            <ion-icon :icon="speedometerOutline" class="section-icon" />
            <span>Avancement moyen</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: stats.averageAvancement + '%' }"
                :class="getProgressClass(stats.averageAvancement)"
              ></div>
            </div>
            <div class="progress-text">{{ stats.averageAvancement }}%</div>
          </div>
        </div>

        <!-- Breakdown by type -->
        <div class="section-card">
          <div class="section-header">
            <ion-icon :icon="pieChartOutline" class="section-icon" />
            <span>Par type de problème</span>
          </div>
          <div class="type-list">
            <div 
              v-for="(item, index) in stats.byType" 
              :key="index" 
              class="type-row"
            >
              <div class="type-dot" :style="{ background: item.color }"></div>
              <span class="type-name">{{ item.label }}</span>
              <span class="type-count">{{ item.count }}</span>
            </div>
            <div v-if="stats.byType.length === 0" class="empty-state-inline">
              Aucun signalement
            </div>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="section-card">
          <div class="section-header">
            <ion-icon :icon="checkmarkDoneOutline" class="section-icon" />
            <span>Par statut</span>
          </div>
          <div class="status-chips">
            <div class="status-chip" v-for="(item, index) in stats.byStatus" :key="index">
              <div class="status-dot" :class="item.statusClass"></div>
              <span class="status-label">{{ item.label }}</span>
              <span class="status-badge">{{ item.count }}</span>
            </div>
            <div v-if="stats.byStatus.length === 0" class="empty-state-inline">
              Aucune donnée
            </div>
          </div>
        </div>

        <!-- Bottom spacer for tab bar -->
        <div style="height: 100px;"></div>
      </div>

      <ion-loading :is-open="isLoading" message="Chargement..." />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonIcon, IonRefresher, IonRefresherContent, IonLoading 
} from '@ionic/vue';
import { 
  refreshOutline, locationOutline, constructOutline, resizeOutline, 
  walletOutline, speedometerOutline, pieChartOutline, checkmarkDoneOutline 
} from 'ionicons/icons';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

const isLoading = ref(false);

interface TypeStat {
  label: string;
  count: number;
  color: string;
}

interface StatusStat {
  label: string;
  count: number;
  statusClass: string;
}

const stats = ref({
  signalements: 0,
  travaux: 0,
  totalSurface: 0,
  totalBudget: 0,
  averageAvancement: 0,
  byType: [] as TypeStat[],
  byStatus: [] as StatusStat[]
});

const typeColors: Record<string, { label: string; color: string }> = {
  'nid-de-poule': { label: 'Nid de poule', color: '#ef4444' },
  'route-inondee': { label: 'Route inondée', color: '#3b82f6' },
  'route-endommagee': { label: 'Route endommagée', color: '#f97316' },
  'signalisation-manquante': { label: 'Signalisation manquante', color: '#eab308' },
  'eclairage-defectueux': { label: 'Éclairage défectueux', color: '#8b5cf6' },
  'autre': { label: 'Autre', color: '#6b7280' }
};

const statusMapping: Record<string, { label: string; statusClass: string }> = {
  'non traité': { label: 'Non traité', statusClass: 'status-pending' },
  'en cours': { label: 'En cours', statusClass: 'status-progress' },
  'traité': { label: 'Traité', statusClass: 'status-done' },
  'rejeté': { label: 'Rejeté', statusClass: 'status-rejected' }
};

onMounted(() => {
  loadStats();
});

const formatBudget = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + 'M Ar';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K Ar';
  }
  return value.toLocaleString() + ' Ar';
};

const getProgressClass = (value: number): string => {
  if (value >= 75) return 'progress-high';
  if (value >= 40) return 'progress-mid';
  return 'progress-low';
};

const handleRefresh = async (event: any) => {
  await loadStats();
  event.target.complete();
};

const loadStats = async () => {
  isLoading.value = true;
  try {
    // Load signalements
    const sigSnapshot = await getDocs(collection(db, 'signalements'));
    let totalSurface = 0;
    const typeCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    sigSnapshot.forEach((doc: any) => {
      const data = doc.data();
      totalSurface += data.surface || 0;

      const type = data.type_probleme || data.typeProbleme || 'autre';
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      const statut = data.statut || 'non traité';
      statusCounts[statut] = (statusCounts[statut] || 0) + 1;
    });

    // Load travaux
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

    // Build byType array
    const byType: TypeStat[] = Object.entries(typeCounts).map(([key, count]) => {
      const meta = typeColors[key] || { label: key, color: '#6b7280' };
      return { label: meta.label, count, color: meta.color };
    }).sort((a, b) => b.count - a.count);

    // Build byStatus array
    const byStatus: StatusStat[] = Object.entries(statusCounts).map(([key, count]) => {
      const meta = statusMapping[key] || { label: key, statusClass: 'status-pending' };
      return { label: meta.label, count, statusClass: meta.statusClass };
    });

    stats.value = {
      signalements: sigSnapshot.size,
      travaux: travauxSnapshot.size,
      totalSurface: Math.round(totalSurface),
      totalBudget,
      averageAvancement: travauxCount > 0 ? Math.round(totalAvancement / travauxCount) : 0,
      byType,
      byStatus
    };
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.stats-page {
  --background: #f1f5f9;
}

.stats-toolbar {
  --background: #1e3a5f;
  --color: white;
  --border-width: 0;
}

.stats-toolbar ion-title {
  font-weight: 600;
  font-size: 17px;
}

.header-action-btn {
  --color: rgba(255, 255, 255, 0.85);
}

.header-action-btn ion-icon {
  font-size: 20px;
}

.stats-content {
  padding: 16px;
}

/* Hero */
.hero-section {
  margin-bottom: 20px;
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.hero-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.kpi-icon-wrap ion-icon {
  font-size: 20px;
  color: white;
}

.kpi-icon-wrap.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.kpi-icon-wrap.green { background: linear-gradient(135deg, #10b981, #059669); }
.kpi-icon-wrap.amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.kpi-icon-wrap.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-left: 2px;
}

.kpi-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
}

/* Section cards */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 18px;
  color: #3b82f6;
}

/* Progress bar */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-bg {
  flex: 1;
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.progress-bar-fill.progress-low { background: linear-gradient(90deg, #ef4444, #f97316); }
.progress-bar-fill.progress-mid { background: linear-gradient(90deg, #f59e0b, #eab308); }
.progress-bar-fill.progress-high { background: linear-gradient(90deg, #10b981, #059669); }

.progress-text {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  min-width: 48px;
  text-align: right;
}

/* Type list */
.type-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-name {
  font-size: 14px;
  color: #334155;
  flex: 1;
}

.type-count {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 999px;
}

/* Status chips */
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.status-pending { background: #f59e0b; }
.status-dot.status-progress { background: #3b82f6; }
.status-dot.status-done { background: #10b981; }
.status-dot.status-rejected { background: #ef4444; }

.status-label {
  font-size: 13px;
  color: #475569;
}

.status-badge {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.empty-state-inline {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
  font-style: italic;
}
</style>
