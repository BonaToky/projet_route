import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  Id_User: string;
  surface: number;
  description: string;
  date_ajoute: Date;
  statut: string;
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
      // Récupérer les signalements
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
          description: data.description,
          date_ajoute: data.date_ajoute.toDate(),
          statut: data.statut,
        });
      });

      // Récupérer les travaux
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

      // Associer les travaux aux signalements et ajouter les noms d'entreprises
      const reportsWithTravaux = reportsData.map(report => {
        const travaux = travauxData.find(t => t.id_signalement === report.id);
        if (travaux) {
          const entreprise = entreprises.find(e => e.idEntreprise === travaux.id_entreprise);
          return {
            ...report,
            travaux: {
              ...travaux,
              entreprise_nom: entreprise ? entreprise.nom : 'Entreprise inconnue'
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

    // Calculer l'avancement moyen et le budget total
    const travauxWithData = reports.filter(report => report.travaux);
    const averageAvancement = travauxWithData.length > 0
      ? travauxWithData.reduce((sum, report) => sum + (report.travaux?.avancement || 0), 0) / travauxWithData.length
      : 0;

    const totalBudget = travauxWithData.reduce((sum, report) => sum + (report.travaux?.budget || 0), 0);

    setRecapData({
      count,
      totalSurface,
      averageAvancement: Math.round(averageAvancement * 100) / 100, // Arrondi à 2 décimales
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <Link
          to="/dashboard"
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            color: 'white',
            textDecoration: 'none',
            padding: '8px 16px',
            background: '#007bff',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Administration
        </Link>
        <h1>Carte des Problèmes Routiers</h1>
        <p>Consultez l'état des réparations en cours</p>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Carte */}
        <div style={{ flex: 2, position: 'relative' }}>
          <MapContainer center={[-18.8792, 47.5079]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            {reports.map((report) => (
              <Marker key={report.id} position={[report.latitude, report.longitude]}>
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Problème Routier</h4>
                    <p style={{ margin: '5px 0' }}><strong>Date:</strong> {report.date_ajoute.toLocaleDateString('fr-FR')}</p>
                    <p style={{ margin: '5px 0' }}><strong>Statut:</strong> {getStatusText(report.statut)}</p>
                    <p style={{ margin: '5px 0' }}><strong>Surface:</strong> {report.surface} m²</p>
                    {report.travaux && (
                      <>
                        <p style={{ margin: '5px 0' }}><strong>Budget:</strong> {report.travaux.budget.toLocaleString()} Ar</p>
                        <p style={{ margin: '5px 0' }}><strong>Entreprise:</strong> {report.travaux.entreprise_nom}</p>
                        <p style={{ margin: '5px 0' }}><strong>Avancement:</strong> {report.travaux.avancement}%</p>
                      </>
                    )}
                    <p style={{ margin: '10px 0 5px 0', fontSize: '14px', color: '#666' }}>
                      {report.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Tableau de récapitulation */}
        <div style={{
          flex: 1,
          padding: '20px',
          background: '#f8f9fa',
          borderLeft: '1px solid #dee2e6',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Récapitulation</h3>

          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '24px', color: '#007bff', marginRight: '15px' }}>📍</div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Nombre de points</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{recapData.count}</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '24px', color: '#28a745', marginRight: '15px' }}>📐</div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Surface totale</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{recapData.totalSurface} m²</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '24px', color: '#ffc107', marginRight: '15px' }}>⚡</div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Avancement moyen</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{recapData.averageAvancement}%</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '24px', color: '#dc3545', marginRight: '15px' }}>💰</div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>Budget total</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{recapData.totalBudget.toLocaleString()} Ar</div>
              </div>
            </div>
          </div>

          <button
            onClick={syncReports}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Actualiser les données
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorDashboard;