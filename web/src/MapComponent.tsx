import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Signalement {
  idSignalement: number;
  surface?: number;
  latitude: number;
  longitude: number;
  dateAjoute: string;
  idLieux?: number;
  idUser: string;
  typeProbleme?: string;
  statut: string;
  description?: string;
}

const MapComponent = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number} | null>(null);
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null);

  const mapStyle = {
    version: 8,
    name: 'Madagascar Carte',
    sources: {
      'openmaptiles': {
        type: 'vector',
        tiles: ['http://localhost:3000/data/v3/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#e3f2fd'
        }
      },
      {
        id: 'land',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#c8e6c9',
          'fill-opacity': 0.8
        }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-color': '#64b5f6',
          'fill-opacity': 0.9
        }
      },
      {
        id: 'roads',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['!=', 'brunnel', 'tunnel'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': {
            base: 1.4,
            stops: [
              [8, 2],
              [12, 3],
              [16, 5]
            ]
          }
        }
      },
      {
        id: 'road-border',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['!=', 'brunnel', 'tunnel'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#424242',
          'line-width': {
            base: 1.4,
            stops: [
              [8, 3],
              [12, 4],
              [16, 6]
            ]
          }
        }
      },
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 10,
        paint: {
          'fill-color': '#bdbdbd',
          'fill-outline-color': '#757575',
          'fill-opacity': 0.7
        }
      }
    ]
  };

  // Récupérer les signalements depuis l'API
  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/signalements');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📍 Signalements récupérés:', data);
        setSignalements(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des signalements:', err);
        setError('Impossible de charger les signalements');
      } finally {
        setLoading(false);
      }
    };

    fetchSignalements();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺️ Initialisation de la carte Antananarivo...');

    const initialCenter: [number, number] = [47.528, -18.91];
    const initialZoom = 13;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 8,
      maxZoom: 18,
      renderWorldCopies: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // 🆕 Double-clic pour créer un nouveau signalement
    map.current.on('dblclick', (e) => {
      const { lng, lat } = e.lngLat;
      console.log('🎯 Double-clic pour nouveau signalement:', { lng, lat });
      
      setSelectedPoint({ lat, lng });
      
      // Supprimer l'ancien marqueur temporaire s'il existe
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
      }

      // Ajouter un marqueur temporaire violet pour le nouveau signalement
      const tempMarker = new maplibregl.Marker({ 
        color: '#9c27b0',
        scale: 1.3
      })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 10px; text-align: center;">
              <div style="font-weight: bold; color: #9c27b0; margin-bottom: 5px;">
                ➕ Nouveau signalement
              </div>
              <div style="font-size: 12px; color: #666;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </div>
            </div>
          `))
        .addTo(map.current!);

      tempMarkerRef.current = tempMarker;
      tempMarker.togglePopup();
    });

    map.current.on('load', () => {
      console.log('✅ Carte chargée avec succès!');
    });

    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(Math.round(map.current.getZoom() * 10) / 10);
      }
    });

    map.current.on('error', (e) => {
      console.error('❌ Erreur de la carte:', e.error);
    });

    return () => {
      if (map.current) {
        console.log('Nettoyage de la carte');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Ajouter les marqueurs des signalements existants
  useEffect(() => {
    if (!map.current || signalements.length === 0) return;

    console.log(`🎯 Ajout de ${signalements.length} marqueurs existants...`);

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    signalements.forEach((signalement, index) => {
      const lng = Number(signalement.longitude);
      const lat = Number(signalement.latitude);

      if (isNaN(lng) || isNaN(lat)) {
        console.error(`❌ Coordonnées invalides pour signalement #${signalement.idSignalement}`);
        return;
      }

      // Choisir la couleur selon le statut
      const markerColor = 
        signalement.statut === 'traité' ? '#4caf50' : 
        signalement.statut === 'en cours' ? '#ff9800' : 
        '#f44336';

      // Créer le popup
      const popupHTML = `
        <div style="font-family: Arial, sans-serif; min-width: 220px; max-width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 15px; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">
            🚧 Signalement #${signalement.idSignalement}
          </h3>
          <div style="font-size: 13px; line-height: 1.8;">
            <div style="margin-bottom: 6px;">
              <strong style="color: #555;">Type:</strong> 
              <span style="color: #000;">${signalement.typeProbleme || 'Non spécifié'}</span>
            </div>
            <div style="margin-bottom: 6px;">
              <strong style="color: #555;">Statut:</strong> 
              <span style="
                padding: 3px 8px; 
                border-radius: 4px; 
                background-color: ${markerColor}; 
                color: white;
                font-size: 12px;
                font-weight: 600;
              ">
                ${signalement.statut}
              </span>
            </div>
            ${signalement.surface ? `
              <div style="margin-bottom: 6px;">
                <strong style="color: #555;">Surface:</strong> 
                <span style="color: #000;">${signalement.surface} m²</span>
              </div>
            ` : ''}
            ${signalement.description ? `
              <div style="margin-bottom: 6px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <strong style="color: #555;">Description:</strong><br/>
                <span style="color: #333; font-size: 12px;">${signalement.description}</span>
              </div>
            ` : ''}
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; color: #777; font-size: 11px;">
              <div>📅 ${new Date(signalement.dateAjoute).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div style="margin-top: 3px;">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ 
        offset: 25,
        maxWidth: '320px'
      }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ 
        color: markerColor,
        scale: 1
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    console.log(`✅ ${markersRef.current.length} marqueurs ajoutés sur la carte`);

    // Centrer la carte sur les marqueurs
    if (markersRef.current.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      
      signalements.forEach(s => {
        const lng = Number(s.longitude);
        const lat = Number(s.latitude);
        if (!isNaN(lng) && !isNaN(lat)) {
          bounds.extend([lng, lat]);
        }
      });

      map.current.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 15,
        duration: 1000
      });
    }
  }, [signalements]);

  // Synchronisation des signalements depuis Firestore vers PostgreSQL
  const syncSignalements = async () => {
    try {
      setLoading(true);
      console.log('🔄 Synchronisation des signalements...');
      
      // Appeler l'endpoint de sync
      const syncResponse = await fetch('http://localhost:8080/api/signalements/sync');
      if (!syncResponse.ok) {
        throw new Error(`Erreur sync: ${syncResponse.status}`);
      }
      console.log('✅ Synchronisation terminée');

      // Re-charger les signalements
      const response = await fetch('http://localhost:8080/api/signalements');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log('📍 Signalements mis à jour:', data);
      setSignalements(data);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation:', err);
      setError('Impossible de synchroniser les signalements');
    } finally {
      setLoading(false);
    }
  };

  // Navigation vers le formulaire
  const handleNavigateToForm = () => {
    if (selectedPoint) {
      const url = `insert-signalement?lat=${selectedPoint.lat}&lng=${selectedPoint.lng}`;
      window.location.href = url;
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="sidebar-title">RouteWatch</span>
        </div>
        <div className="nav-menu">
          <button className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 6V22L8 18L16 22L23 18V2L16 6L8 2L1 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Carte
          </button>
          <button className="nav-item" onClick={() => navigate('/dashboard?view=users')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Utilisateurs
          </button>
          <button className="nav-item" onClick={() => navigate('/dashboard?view=reports')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Signalements
          </button>
          <button className="nav-item" onClick={() => navigate('/dashboard?view=config')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Configuration
          </button>
        </div>
        <button className="logout-btn" onClick={() => navigate('/login')}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Déconnexion
        </button>
      </nav>
      <main className="main-content">
        {/* Header flottant en haut */}
        <div style={{ 
          position: 'relative',
          zIndex: 10,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#1976d2', fontSize: '20px' }}>
              🗺️ Carte des Signalements - Antananarivo
            </h3>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {loading ? (
                <span>⏳ Chargement des signalements...</span>
              ) : error ? (
                <span style={{ color: '#f44336' }}>❌ {error}</span>
              ) : (
                <span style={{ color: '#4caf50', fontWeight: '500' }}>
                  ✓ {signalements.length} signalement(s) • Double-cliquez pour en créer un nouveau
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={syncSignalements}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: loading ? '#90caf9' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
              <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9.00001C4.01717 7.56679 4.87913 6.28541 6.01547 5.27543C7.1518 4.26545 8.52547 3.55977 10.0083 3.22427C11.4911 2.88877 13.0348 2.93436 14.4952 3.35679C15.9556 3.77922 17.2853 4.56472 18.36 5.64001L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
        {/* Carte */}
        <div 
          ref={mapContainer} 
          style={{ 
            position: 'relative',
            width: '100%', 
            height: '70vh',
            minHeight: '600px',
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        />
        {/* Zoom indicator - en bas à droite */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          fontSize: '13px',
          zIndex: 1000,
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '15px' }}>
            🔍 Zoom: {currentZoom.toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            📍 {signalements.length} point(s) affichés
          </div>
          {selectedPoint && (
            <div style={{ fontSize: '11px', color: '#9c27b0', marginTop: '4px', fontWeight: '600' }}>
              ➕ Nouveau point sélectionné
            </div>
          )}
        </div>
        {/* Panneau création - en bas à gauche */}
        {selectedPoint && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            maxWidth: '400px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            borderRadius: '12px',
            border: '2px solid #9c27b0',
            boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)',
            zIndex: 1000
          }}>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#6a1b9a', fontSize: '18px' }}>
                ➕ Nouveau signalement
              </h4>
              <div style={{ 
                background: 'white', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '14px',
                color: '#555'
              }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Latitude:</strong> {selectedPoint.lat.toFixed(6)}
                </div>
                <div>
                  <strong>Longitude:</strong> {selectedPoint.lng.toFixed(6)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleNavigateToForm}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                📝 Ouvrir le formulaire
              </button>
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  if (tempMarkerRef.current) {
                    tempMarkerRef.current.remove();
                    tempMarkerRef.current = null;
                  }
                }}
                style={{
                  padding: '14px 20px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ❌
              </button>
            </div>
          </div>
        )}
        {/* Instructions flottantes - en haut à gauche sous le header */}
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '10px',
          maxWidth: '350px',
          padding: '12px 15px',
          background: 'rgba(227, 242, 253, 0.95)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#555',
          border: '1px solid #bbdefb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 9
        }}>
        </div>
      </main>
    </div>
  );
};

export default MapComponent;