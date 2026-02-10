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
          <button className="nav-item" onClick={() => navigate('/create-user')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Utilisateurs
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