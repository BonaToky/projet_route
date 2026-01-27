import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth } from './firebase';

interface SignalementForm {
  latitude: number;
  longitude: number;
  surface?: number;
  idLieux?: number;
  typeProbleme: string;
  description: string;
  idUser: string;
}

interface Lieu {
  idLieux: number;
  libelle: string;
  description?: string;
  ville?: string;
}

const InsertSignalement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignalementForm>({
    latitude: 0,
    longitude: 0,
    surface: undefined,
    idLieux: undefined,
    typeProbleme: 'nid de poule',
    description: '',
    idUser: '',
  });
  
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loadingLieux, setLoadingLieux] = useState(true);
  const [lieuxError, setLieuxError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Récupération de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          idUser: user.uid,
        }));
      } else {
        setAuthError('Vous devez être connecté pour créer un signalement');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Chargement des lieux
  useEffect(() => {
    fetch('http://localhost:8080/api/lieux')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur ${res.status} – ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: Lieu[]) => {
        setLieux(data);
        setLoadingLieux(false);
      })
      .catch((err) => {
        console.error('Erreur chargement lieux:', err);
        setLieuxError('Impossible de charger les lieux');
        setLoadingLieux(false);
      });
  }, []);

  // Récupération lat/lng depuis URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');

    if (lat && lng) {
      setFormData((prev) => ({
        ...prev,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      }));
    }
  }, []);

  const handleSubmit = async () => {
    if (formData.description.length < 10) {
      setError('La description doit contenir au moins 10 caractères');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/signalements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          latitude: formData.latitude.toString(),
          longitude: formData.longitude.toString(),
          surface: formData.surface?.toString() || '',
          idLieux: formData.idLieux?.toString() || '',
          typeProbleme: formData.typeProbleme,
          description: formData.description,
          idUser: formData.idUser,
        }),
      });

      if (!response.ok) throw new Error('Échec création signalement');

      setSuccess(true);

      // Reset après 2 secondes
      setTimeout(() => {
        setFormData({
          latitude: 0,
          longitude: 0,
          surface: undefined,
          idLieux: undefined,
          typeProbleme: 'nid de poule',
          description: '',
          idUser: formData.idUser, // Garde l'ID de session
        });
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi. Vérifiez l'API.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      latitude: 0,
      longitude: 0,
      surface: undefined,
      idLieux: undefined,
      typeProbleme: 'nid de poule',
      description: '',
      idUser: formData.idUser, // Garde l'ID de session
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              margin: '0 0 10px 0',
              color: '#667eea',
              fontSize: '32px',
              fontWeight: '700',
            }}
          >
            🚧 Nouveau Signalement
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
            Signalez un problème sur la route
          </p>
        </div>

        {success && (
          <div
            style={{
              padding: '15px',
              background: '#d4edda',
              border: '2px solid #28a745',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              color: '#155724',
              fontWeight: '600',
            }}
          >
            ✅ Signalement créé avec succès !
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '15px',
              background: '#f8d7da',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              color: '#721c24',
              fontWeight: '600',
            }}
          >
            ❌ {error}
          </div>
        )}

        <div>
          {/* Coordonnées */}
          <div
            style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '25px',
              border: '2px solid #e9ecef',
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#495057', fontSize: '16px' }}>
              📍 Coordonnées GPS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.latitude || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    const num = parseFloat(val);
                    setFormData({ ...formData, latitude: isNaN(num) ? 0 : num });
                  }}
                  placeholder="-19.123456"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #dee2e6',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.longitude || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    const num = parseFloat(val);
                    setFormData({ ...formData, longitude: isNaN(num) ? 0 : num });
                  }}
                  placeholder="47.456789"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #dee2e6',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Type problème */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              🔧 Type de problème *
            </label>
            <select
              value={formData.typeProbleme}
              onChange={(e) => setFormData({ ...formData, typeProbleme: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #667eea',
              }}
            >
              <option value="nid de poule">🕳️ Nid de poule</option>
              <option value="fissure">⚡ Fissure</option>
              <option value="inondation">💧 Inondation</option>
              <option value="affaissement">📉 Affaissement</option>
              <option value="obstacle">🚧 Obstacle</option>
              <option value="autre">❓ Autre</option>
            </select>
          </div>

          {/* Surface */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              📏 Surface estimée (m²)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.surface ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  surface: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Ex: 12.5"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #dee2e6',
              }}
            />
          </div>

          {/* Liste des lieux → partie corrigée */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#495057',
              fontSize: '14px'
            }}>
              📌 Lieu (optionnel)
            </label>
              <select
                value={formData.idLieux ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idLieux: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #dee2e6',
                  fontSize: '15px',
                  color: '#495057',
                  background: 'white'
                }}
              >
                <option value="">— Sélectionner un lieu (facultatif) —</option>
                {lieux.map((lieu) => (
                  <option key={lieu.idLieux} value={lieu.idLieux}>
                    {lieu.libelle} {lieu.ville ? `(${lieu.ville})` : ''}
                  </option>
                ))}
              </select>
          </div>

          {/* ID utilisateur - Lecture seule */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#495057',
              fontSize: '14px'
            }}>
              👤 Identifiant utilisateur
            </label>
            <input
              type="text"
              value={formData.idUser}
              disabled
              placeholder="En cours de chargement..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #dee2e6',
                fontSize: '15px',
                color: '#495057',
                background: '#f8f9fa',
                cursor: 'not-allowed'
              }}
            />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
              Récupéré automatiquement depuis votre session
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
              📝 Description du problème *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              placeholder="Décrivez le problème en détail..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #667eea',
                resize: 'vertical',
              }}
            />
            <div style={{ marginTop: '5px', fontSize: '13px', color: '#6c757d' }}>
              {formData.description.length} caractères (min 10)
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || formData.description.length < 10 || !formData.idUser.trim()}
              style={{
                flex: 1,
                padding: '15px',
                background:
                  submitting || formData.description.length < 10 || !formData.idUser.trim()
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor:
                  submitting || formData.description.length < 10 || !formData.idUser.trim()
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {submitting ? '⏳ Envoi en cours...' : 'Créer le signalement'}
            </button>

            <button
              onClick={handleReset}
              disabled={submitting}
              style={{
                padding: '15px 25px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              🔄 Réinitialiser
            </button>

            <button
              type="button"
              onClick={() => navigate("/map")}
              disabled={submitting}
              style={{
                padding: '15px 25px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              ⬅️ Retour à la carte
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertSignalement;