import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/login.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;

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
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">
      <span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span>
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

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  Id_User: string;
  surface: number;
  type_probleme?: string;
  description: string;
  date_ajoute: Date;
  statut: string;
  photos?: string[];
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

interface Entreprise {
  idEntreprise: number;
  nom: string;
}

const VisitorDashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [recapData, setRecapData] = useState({
    count: 0,
    totalSurface: 0,
    averageAvancement: 0,
    totalBudget: 0
  });

  useEffect(() => {
    fetchEntreprises();
    syncReports();
  }, []);

  const fetchEntreprises = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/entreprises');
      const data = await response.json();
      setEntreprises(data);
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  };

  const syncReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'signalements'));
      const reportsData: Report[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reportsData.push({
          id: doc.id,
          latitude: data.latitude,
          longitude: data.longitude,
          Id_User: data.Id_User,
          surface: data.surface,
          type_probleme: data.type_probleme,
          description: data.description,
          date_ajoute: data.date_ajoute.toDate(),
          statut: data.statut,
          photos: data.photos || [],
        });
      });

      const travauxSnapshot = await getDocs(collection(db, 'travaux'));
      const travauxData: any[] = [];
      travauxSnapshot.forEach((doc) => {
        const data = doc.data();
        travauxData.push({
          id: doc.id,
          id_signalement: data.id_signalement,
          id_entreprise: data.id_entreprise,
          budget: data.budget,
          date_debut_travaux: data.date_debut_travaux.toDate(),
          date_fin_travaux: data.date_fin_travaux.toDate(),
          avancement: data.avancement,
        });
      });

      const reportsWithTravaux = reportsData.map(report => {
        const travaux = travauxData.find(t => t.id_signalement === report.id);
        if (travaux) {
          const ent = entreprises.find(e => e.idEntreprise === travaux.id_entreprise);
          return {
            ...report,
            travaux: {
              ...travaux,
              entreprise_nom: ent ? ent.nom : 'Entreprise inconnue'
            }
          };
        }
        return report;
      });

      setReports(reportsWithTravaux);
      calculateRecapData(reportsWithTravaux);
    } catch (error) {
      console.error('Error syncing reports:', error);
      alert('Error syncing reports');
    }
  };

  const calculateRecapData = (reports: Report[]) => {
    const count = reports.length;
    const totalSurface = reports.reduce((sum, report) => sum + report.surface, 0);

    const travauxWithData = reports.filter(report => report.travaux);
    const averageAvancement = travauxWithData.length > 0
      ? travauxWithData.reduce((sum, report) => sum + (report.travaux?.avancement || 0), 0) / travauxWithData.length
      : 0;

    const totalBudget = travauxWithData.reduce((sum, report) => sum + (report.travaux?.budget || 0), 0);

    setRecapData({
      count,
      totalSurface,
      averageAvancement: Math.round(averageAvancement * 100) / 100,
      totalBudget
    });
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'non traité': return 'Nouveau';
      case 'en cours': return 'En cours';
      case 'résolu': return 'Terminé';
      default: return statut;
    }
  };

  const getProblemTypeLabel = (type?: string) => {
    const labels: { [key: string]: string } = {
      'nid-de-poule': 'Nid de poule',
      'route-inondee': 'Route inondée',
      'route-endommagee': 'Route endommagée',
      'signalisation-manquante': 'Signalisation manquante',
      'eclairage-defectueux': 'Éclairage défectueux',
      'autre': 'Autre',
    };
    return labels[type || ''] || 'Problème Routier';
  };

  return (
    <div className="visitor-dashboard">
      <header className="visitor-header">
        <div className="visitor-logo">
          <div className="visitor-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="visitor-logo-text">RouteWatch</span>
        </div>
        <nav className="visitor-nav">
          <Link to="/">Espace Gestionnaire</Link>
        </nav>
      </header>

      <div className="visitor-content">
        <div className="visitor-map" style={{ height: 'calc(100vh - 81px)', minHeight: '700px' }}>
          <MapContainer center={[-18.8792, 47.5079]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            {reports.map((report) => (
              <Marker 
                key={report.id} 
                position={[report.latitude, report.longitude]}
                icon={getIconForProblem(report.type_probleme)}
              >
                <Popup>
                  <div className="popup-content">
                    <div className="popup-header">
                      <div className="popup-icon" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                        {report.type_probleme === 'nid-de-poule' && '🕳️'}
                        {report.type_probleme === 'route-inondee' && '🌊'}
                        {report.type_probleme === 'route-endommagee' && '⚠️'}
                        {report.type_probleme === 'signalisation-manquante' && '🚧'}
                        {report.type_probleme === 'eclairage-defectueux' && '💡'}
                        {(!report.type_probleme || report.type_probleme === 'autre') && '📍'}
                      </div>
                      <h4 className="popup-title">{getProblemTypeLabel(report.type_probleme)}</h4>
                    </div>
                    <div className="popup-row">
                      <span className="popup-label">Date</span>
                      <span className="popup-value">{report.date_ajoute.toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="popup-row">
                      <span className="popup-label">Statut</span>
                      <span className="popup-value">{getStatusText(report.statut)}</span>
                    </div>
                    <div className="popup-row">
                      <span className="popup-label">Surface</span>
                      <span className="popup-value">{report.surface} m²</span>
                    </div>
                    {report.photos && report.photos.length > 0 && (
                      <div className="popup-row" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
                        <span className="popup-label">Photos ({report.photos.length})</span>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%'}}>
                          {report.photos.map((photo, idx) => (
                            <div key={idx} style={{width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer'}} onClick={() => window.open(photo, '_blank')}>
                              <img src={photo} alt={`Photo ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.travaux && (
                      <>
                        <div className="popup-row">
                          <span className="popup-label">Budget</span>
                          <span className="popup-value">{report.travaux.budget.toLocaleString()} Ar</span>
                        </div>
                        <div className="popup-row">
                          <span className="popup-label">Avancement</span>
                          <span className="popup-value">{report.travaux.avancement}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="visitor-sidebar">
          <h3 className="visitor-sidebar-title">Récapitulatif</h3>

          <div className="recap-card">
            <div className="recap-icon blue">📍</div>
            <div className="recap-info">
              <span className="recap-label">Points signalés</span>
              <span className="recap-value">{recapData.count}</span>
            </div>
          </div>

          <div className="recap-card">
            <div className="recap-icon green">📐</div>
            <div className="recap-info">
              <span className="recap-label">Surface totale</span>
              <span className="recap-value">{recapData.totalSurface} m²</span>
            </div>
          </div>

          <div className="recap-card">
            <div className="recap-icon yellow">⚡</div>
            <div className="recap-info">
              <span className="recap-label">Avancement moyen</span>
              <span className="recap-value">{recapData.averageAvancement}%</span>
            </div>
          </div>

          <div className="recap-card">
            <div className="recap-icon red">💰</div>
            <div className="recap-info">
              <span className="recap-label">Budget total</span>
              <span className="recap-value">{recapData.totalBudget.toLocaleString()} Ar</span>
            </div>
          </div>

          <button onClick={syncReports} className="btn btn-primary" style={{width: '100%', marginTop: '16px'}}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
              <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Actualiser
          </button>

          <div className="legend-card">
            <h4 className="legend-title">Légende</h4>
            <div className="legend-item">
              <div className="legend-color red">🕳️</div>
              <span className="legend-label">Nid de poule</span>
            </div>
            <div className="legend-item">
              <div className="legend-color blue">🌊</div>
              <span className="legend-label">Route inondée</span>
            </div>
            <div className="legend-item">
              <div className="legend-color orange">⚠️</div>
              <span className="legend-label">Route endommagée</span>
            </div>
            <div className="legend-item">
              <div className="legend-color yellow">🚧</div>
              <span className="legend-label">Signalisation manquante</span>
            </div>
            <div className="legend-item">
              <div className="legend-color purple">💡</div>
              <span className="legend-label">Éclairage défectueux</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VisitorDashboard;
