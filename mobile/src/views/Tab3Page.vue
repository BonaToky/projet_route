<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="page-toolbar">
        <ion-title>Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshReports" class="header-action-btn">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-bg">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div class="page-content">
        <!-- Mini KPI row -->
        <div class="kpi-row">
          <div class="kpi-mini">
            <div class="kpi-mini-icon blue">
              <ion-icon :icon="locationOutline" />
            </div>
            <div class="kpi-mini-body">
              <span class="kpi-mini-value">{{ reports.length }}</span>
              <span class="kpi-mini-label">Total</span>
            </div>
          </div>
          <div class="kpi-mini">
            <div class="kpi-mini-icon amber">
              <ion-icon :icon="timerOutline" />
            </div>
            <div class="kpi-mini-body">
              <span class="kpi-mini-value">{{ getEnCoursCount }}</span>
              <span class="kpi-mini-label">En cours</span>
            </div>
          </div>
          <div class="kpi-mini">
            <div class="kpi-mini-icon green">
              <ion-icon :icon="checkmarkDoneOutline" />
            </div>
            <div class="kpi-mini-body">
              <span class="kpi-mini-value">{{ getTraiteCount }}</span>
              <span class="kpi-mini-label">Traités</span>
            </div>
          </div>
        </div>

        <!-- Reports list -->
        <div class="reports-list" v-if="reports.length > 0">
          <div v-for="report in reports" :key="report.id" class="report-card" @click="openReportDetail(report)">
            <div class="report-row">
              <div class="report-type-icon" :class="getIconColorClass(report.type_probleme)">
                <ion-icon :icon="getTypeIcon(report.type_probleme)" />
              </div>
              <div class="report-body">
                <div class="report-title">{{ getProblemLabel(report.type_probleme) }}</div>
                <div class="report-date">{{ formatDate(report.date_ajoute) }}</div>
              </div>
              <div class="report-badge" :class="getStatusClass(report.statut)">
                <div class="badge-dot"></div>
                <span>{{ getStatusLabel(report.statut) }}</span>
              </div>
            </div>

            <p class="report-desc" v-if="report.description">{{ report.description }}</p>

            <div class="report-meta">
              <div class="meta-chip">
                <ion-icon :icon="resizeOutline" />
                <span>{{ report.surface || 0 }} m²</span>
              </div>
              <div class="meta-chip" v-if="report.travaux">
                <ion-icon :icon="walletOutline" />
                <span>{{ formatBudget(report.travaux.budget) }}</span>
              </div>
              <div class="meta-chip" v-if="report.travaux">
                <ion-icon :icon="constructOutline" />
                <span>{{ report.travaux.avancement || 0 }}%</span>
              </div>
            </div>

            <!-- Progress bar if travaux -->
            <div v-if="report.travaux" class="report-progress">
              <div class="progress-bar-bg">
                <div 
                  class="progress-bar-fill"
                  :class="getProgressClass(report.travaux.avancement || 0)"
                  :style="{ width: (report.travaux.avancement || 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrap">
            <ion-icon :icon="folderOpenOutline" />
          </div>
          <h3>Aucun signalement</h3>
          <p>Vous n'avez pas encore effectué de signalement.</p>
          <ion-button class="empty-action-btn" router-link="/tabs/tab2">
            <ion-icon :icon="addOutline" slot="start" />
            Signaler un problème
          </ion-button>
        </div>

        <!-- Bottom spacer -->
        <div style="height: 100px;"></div>
      </div>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        position="top"
        color="dark"
      />

      <!-- Detail Modal -->
      <ion-modal :is-open="showDetailModal" @will-dismiss="showDetailModal = false" class="detail-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar class="modal-toolbar">
            <ion-title>Détails</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showDetailModal = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-body" v-if="selectedReport">
          <div class="modal-inner">
            <!-- Hero header -->
            <div class="modal-hero">
              <div class="modal-hero-icon" :class="getIconColorClass(selectedReport.type_probleme)">
                <ion-icon :icon="getTypeIcon(selectedReport.type_probleme)" />
              </div>
              <div class="modal-hero-title">{{ getProblemLabel(selectedReport.type_probleme) }}</div>
              <div class="modal-hero-badge" :class="getStatusClass(selectedReport.statut)">
                <div class="badge-dot"></div>
                <span>{{ getStatusLabel(selectedReport.statut) }}</span>
              </div>
            </div>

            <!-- Info section -->
            <div class="section-card">
              <div class="section-header">
                <ion-icon :icon="informationCircleOutline" class="section-icon" />
                <span>Informations</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">{{ formatDate(selectedReport.date_ajoute) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Surface</span>
                <span class="info-value">{{ selectedReport.surface || 0 }} m²</span>
              </div>
              <div class="info-row last">
                <span class="info-label">Coordonnées</span>
                <span class="info-value">{{ selectedReport.latitude?.toFixed(4) }}, {{ selectedReport.longitude?.toFixed(4) }}</span>
              </div>
            </div>

            <!-- Description -->
            <div class="section-card" v-if="selectedReport.description">
              <div class="section-header">
                <ion-icon :icon="documentTextOutline" class="section-icon" />
                <span>Description</span>
              </div>
              <p class="description-text">{{ selectedReport.description }}</p>
            </div>

            <!-- Travaux -->
            <div class="section-card" v-if="selectedReport.travaux">
              <div class="section-header">
                <ion-icon :icon="constructOutline" class="section-icon" />
                <span>Travaux</span>
              </div>
              <div class="info-row">
                <span class="info-label">Budget</span>
                <span class="info-value">{{ selectedReport.travaux.budget?.toLocaleString() || 0 }} Ar</span>
              </div>
              <div class="info-row last">
                <span class="info-label">Avancement</span>
                <span class="info-value highlight">{{ selectedReport.travaux.avancement || 0 }}%</span>
              </div>
              <div class="modal-progress">
                <div class="progress-bar-bg large">
                  <div 
                    class="progress-bar-fill"
                    :class="getProgressClass(selectedReport.travaux.avancement || 0)"
                    :style="{ width: (selectedReport.travaux.avancement || 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonToast, IonButton, 
  IonButtons, IonIcon, IonModal, IonRefresher, IonRefresherContent 
} from '@ionic/vue';
import { 
  refreshOutline, addOutline, closeOutline, locationOutline, timerOutline,
  checkmarkDoneOutline, resizeOutline, walletOutline, constructOutline,
  folderOpenOutline, informationCircleOutline, documentTextOutline,
  warningOutline, waterOutline, flashOutline, flagOutline, ellipseOutline, navigateOutline
} from 'ionicons/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface Report {
  id: string;
  description: string;
  statut: string;
  type_probleme?: string;
  date_ajoute: any;
  latitude: number;
  longitude: number;
  surface: number;
  travaux?: {
    id: string;
    id_entreprise: number;
    budget: number;
    entreprise_nom?: string;
    date_debut_travaux: Date;
    date_fin_travaux: Date;
    avancement: number;
  };
}

const reports = ref<Report[]>([]);
const showToast = ref(false);
const toastMessage = ref('');
const showDetailModal = ref(false);
const selectedReport = ref<Report | null>(null);

const getEnCoursCount = computed(() => {
  return reports.value.filter(r => r.travaux && r.travaux.avancement < 100).length;
});

const getTraiteCount = computed(() => {
  return reports.value.filter(r => r.statut === 'terminé' || (r.travaux && r.travaux.avancement >= 100)).length;
});

onMounted(() => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) {
    toastMessage.value = 'Veuillez vous connecter';
    showToast.value = true;
    return;
  }
  const user = JSON.parse(userStr);
  fetchReports(user.id);
});

const handleRefresh = async (event: any) => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    const user = JSON.parse(userStr);
    await fetchReports(user.id);
  }
  event.target.complete();
};

const refreshReports = () => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  fetchReports(user.id);
  toastMessage.value = 'Liste actualisée';
  showToast.value = true;
};

const fetchReports = async (userId: string) => {
  try {
    const q = query(collection(db, 'signalements'), where('Id_User', '==', userId));
    const signalementsSnapshot = await getDocs(q);
    const signalements: any[] = [];
    signalementsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      signalements.push({ id: doc.id, ...data });
    });

    const travauxSnapshot = await getDocs(collection(db, 'travaux'));
    const travaux: any[] = [];
    travauxSnapshot.forEach((doc: any) => {
      travaux.push(doc.data());
    });

    const reportsWithTravaux = signalements.map((signalement) => {
      const travauxAssocie = travaux.find(t => t.id_signalement === signalement.id);
      return travauxAssocie ? { ...signalement, travaux: travauxAssocie } : signalement;
    });

    reports.value = reportsWithTravaux;
  } catch (error: any) {
    console.error('Erreur:', error);
    toastMessage.value = `Erreur: ${error.message}`;
    showToast.value = true;
  }
};

const formatDate = (timestamp: any) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return 'Date inconnue';
};

const formatBudget = (value?: number): string => {
  if (!value) return '0 Ar';
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace('.0', '') + 'M Ar';
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K Ar';
  return value.toLocaleString() + ' Ar';
};

const getProblemLabel = (type?: string) => {
  const labels: Record<string, string> = {
    'nid-de-poule': 'Nid de poule',
    'route-inondee': 'Route inondée',
    'route-endommagee': 'Route endommagée',
    'signalisation-manquante': 'Signalisation manquante',
    'eclairage-defectueux': 'Éclairage défectueux',
    'autre': 'Autre problème',
  };
  return labels[type || ''] || 'Problème routier';
};

const getTypeIcon = (type?: string) => {
  const icons: Record<string, any> = {
    'nid-de-poule': ellipseOutline,
    'route-inondee': waterOutline,
    'route-endommagee': warningOutline,
    'signalisation-manquante': flagOutline,
    'eclairage-defectueux': flashOutline,
    'autre': navigateOutline,
  };
  return icons[type || ''] || navigateOutline;
};

const getIconColorClass = (type?: string) => {
  const classes: Record<string, string> = {
    'nid-de-poule': 'icon-red',
    'route-inondee': 'icon-blue',
    'route-endommagee': 'icon-orange',
    'signalisation-manquante': 'icon-amber',
    'eclairage-defectueux': 'icon-purple',
    'autre': 'icon-gray',
  };
  return classes[type || ''] || 'icon-gray';
};

const getStatusClass = (statut?: string) => {
  if (!statut || statut === 'nouveau' || statut === 'non traité') return 'status-pending';
  if (statut === 'terminé') return 'status-done';
  return 'status-progress';
};

const getStatusLabel = (statut?: string) => {
  if (!statut || statut === 'nouveau' || statut === 'non traité') return 'Non traité';
  if (statut === 'terminé') return 'Traité';
  if (statut === 'en cours') return 'En cours';
  return statut;
};

const getProgressClass = (value: number): string => {
  if (value >= 75) return 'progress-high';
  if (value >= 40) return 'progress-mid';
  return 'progress-low';
};

const openReportDetail = (report: Report) => {
  selectedReport.value = report;
  showDetailModal.value = true;
};
</script>

<style scoped>
/* ---- Base ---- */
.page-bg {
  --background: #f1f5f9;
}

.page-toolbar {
  --background: #1e3a5f;
  --color: white;
  --border-width: 0;
}

.page-toolbar ion-title {
  font-weight: 600;
  font-size: 17px;
}

.header-action-btn {
  --color: rgba(255, 255, 255, 0.85);
}

.header-action-btn ion-icon {
  font-size: 20px;
}

.page-content {
  padding: 16px;
}

/* ---- KPI Row ---- */
.kpi-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.kpi-mini {
  flex: 1;
  background: white;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.kpi-mini-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-mini-icon ion-icon {
  font-size: 17px;
  color: white;
}

.kpi-mini-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.kpi-mini-icon.amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.kpi-mini-icon.green { background: linear-gradient(135deg, #10b981, #059669); }

.kpi-mini-body {
  display: flex;
  flex-direction: column;
}

.kpi-mini-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.kpi-mini-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

/* ---- Report Cards ---- */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-card {
  background: white;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.report-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-type-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.report-type-icon ion-icon {
  font-size: 20px;
  color: white;
}

.report-type-icon.icon-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
.report-type-icon.icon-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.report-type-icon.icon-orange { background: linear-gradient(135deg, #f97316, #ea580c); }
.report-type-icon.icon-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.report-type-icon.icon-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.report-type-icon.icon-gray { background: linear-gradient(135deg, #6b7280, #4b5563); }

.report-body {
  flex: 1;
  min-width: 0;
}

.report-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-date {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 1px;
}

/* ---- Status Badge ---- */
.report-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.report-badge.status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.report-badge.status-pending .badge-dot { background: #f59e0b; }
.report-badge.status-progress { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.report-badge.status-progress .badge-dot { background: #3b82f6; }
.report-badge.status-done { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.report-badge.status-done .badge-dot { background: #10b981; }

/* ---- Description ---- */
.report-desc {
  font-size: 13px;
  color: #64748b;
  margin: 10px 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- Meta chips ---- */
.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.meta-chip ion-icon {
  font-size: 13px;
  color: #64748b;
}

/* ---- Progress ---- */
.report-progress {
  margin-top: 10px;
}

.progress-bar-bg {
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-bg.large {
  height: 10px;
  margin-top: 12px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.progress-bar-fill.progress-low { background: linear-gradient(90deg, #ef4444, #f97316); }
.progress-bar-fill.progress-mid { background: linear-gradient(90deg, #f59e0b, #eab308); }
.progress-bar-fill.progress-high { background: linear-gradient(90deg, #10b981, #059669); }

/* ---- Empty State ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 58, 95, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon-wrap ion-icon {
  font-size: 32px;
  color: #3b82f6;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}

.empty-state p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px;
}

.empty-action-btn {
  --background: linear-gradient(135deg, #1e3a5f, #3b82f6);
  --border-radius: 12px;
  --box-shadow: 0 8px 20px rgba(30, 58, 95, 0.3);
  height: 44px;
  font-weight: 600;
  font-size: 14px;
}

/* ---- Detail Modal ---- */
.detail-modal {
  --background: transparent;
}

.detail-modal::part(content) {
  background: #f1f5f9;
  border-radius: 20px 20px 0 0;
}

.modal-toolbar {
  --background: #1e3a5f;
  --color: white;
  --border-width: 0;
}

.modal-toolbar ion-title {
  font-weight: 600;
  font-size: 17px;
}

.modal-body {
  --background: #f1f5f9;
}

.modal-inner {
  padding: 16px;
}

/* Modal hero */
.modal-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0 16px;
}

.modal-hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.modal-hero-icon ion-icon {
  font-size: 26px;
  color: white;
}

.modal-hero-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.modal-hero-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

/* Section card (same as stats) */
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
  margin-bottom: 12px;
}

.section-icon {
  font-size: 18px;
  color: #3b82f6;
}

/* Info rows */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row.last {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.info-value.highlight {
  color: #3b82f6;
}

.description-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.modal-progress {
  margin-top: 4px;
}
</style>
