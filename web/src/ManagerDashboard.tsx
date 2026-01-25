import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
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

interface User {
  idUtilisateur: number;
  nomUtilisateur: string;
  email: string;
  role: { nom: string };
  estBloque?: boolean;
  tentativesEchec?: number;
}

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

interface AuthParam {
  cle: string;
  valeur: string;
  description: string;
}

const ManagerDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [authParams, setAuthParams] = useState<AuthParam[]>([]);
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [budget, setBudget] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [avancement, setAvancement] = useState('');
  const [currentView, setCurrentView] = useState<'map' | 'users' | 'reports' | 'auth'>('map');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editSurface, setEditSurface] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvancement, setEditAvancement] = useState('');
  const [editEntreprise, setEditEntreprise] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editDateDebut, setEditDateDebut] = useState('');
  const [editDateFin, setEditDateFin] = useState('');
  const [editStatut, setEditStatut] = useState('');

  // Helper function to make authenticated API calls
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 403) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Authentication failed');
    }

    return response;
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetchUsers();
    fetchEntreprises();
    fetchAuthParams();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8080/api/auth/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEntreprises = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8080/api/entreprises');
      const data = await response.json();
      setEntreprises(data);
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  };

  const fetchAuthParams = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8080/api/auth/params');
      const data = await response.json();
      setAuthParams(data);
    } catch (error) {
      console.error('Error fetching auth params:', error);
    }
  };

  const updateAuthParam = async (cle: string, valeur: string) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/auth/params/${cle}`, {
        method: 'PUT',
        body: JSON.stringify({ valeur }),
      });
      if (response.ok) {
        alert('Paramètre mis à jour avec succès');
        fetchAuthParams();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating auth param:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const resetUserLock = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/auth/reset-lock/${userId}`, {
        method: 'POST',
      });
      if (response.ok) {
        alert('Blocage réinitialisé avec succès');
        fetchUsers();
      } else {
        alert('Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Error resetting user lock:', error);
      alert('Erreur lors de la réinitialisation');
    }
  };

  const syncUsersFromFirebase = async () => {
    try {
      // Récupérer les utilisateurs depuis Firebase
      const firebaseUsersSnapshot = await getDocs(collection(db, 'utilisateurs'));
      const firebaseUsers: any[] = [];
      firebaseUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        firebaseUsers.push({
          id: doc.id,
          ...data
        });
      });

      // Récupérer les utilisateurs existants depuis PostgreSQL
      const postgresResponse = await authenticatedFetch('http://localhost:8080/api/auth/users');
      const postgresUsers = await postgresResponse.json();

      // Pour chaque utilisateur Firebase, vérifier s'il existe dans PostgreSQL
      for (const firebaseUser of firebaseUsers) {
        const existsInPostgres = postgresUsers.some((pgUser: any) => pgUser.email === firebaseUser.email);

        if (!existsInPostgres) {
          try {
            // Créer l'utilisateur dans PostgreSQL
            const createResponse = await authenticatedFetch('http://localhost:8080/api/auth/users', {
              method: 'POST',
              body: JSON.stringify({
                nomUtilisateur: firebaseUser.nomUtilisateur,
                email: firebaseUser.email,
                password: firebaseUser.motDePasse || 'defaultPassword123', // Mot de passe par défaut si non défini
              }),
            });

            if (createResponse.ok) {
              console.log(`Utilisateur ${firebaseUser.email} synchronisé depuis Firebase`);
            } else {
              const errorText = await createResponse.text();
              console.error(`Erreur lors de la synchronisation de ${firebaseUser.email}: ${errorText}`);
            }
          } catch (error) {
            console.error(`Erreur lors du traitement de ${firebaseUser.email}:`, error);
          }
        }
      }

      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
      alert('Synchronisation terminée !');
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('Erreur lors de la synchronisation des utilisateurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { nomUtilisateur, email, password };
    try {
      const url = editingId ? `http://localhost:8080/api/auth/users/${editingId}` : 'http://localhost:8080/api/auth/users';
      const method = editingId ? 'PUT' : 'POST';
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(userData),
      });
      const data = await response.text();
      if (response.ok) {
        alert(data);
        
        // Créer aussi l'utilisateur dans Firebase Firestore
        try {
          await addDoc(collection(db, 'utilisateurs'), {
            nomUtilisateur,
            email,
            motDePasse: password, // Note: En production, hasher le mot de passe
            dateCreation: new Date(),
            sourceAuth: 'local'
          });
          console.log('Utilisateur créé dans Firebase');
        } catch (firebaseError) {
          console.error('Erreur lors de la création dans Firebase:', firebaseError);
          // Ne pas bloquer si Firebase échoue
        }
        
        fetchUsers();
        resetForm();
      } else {
        alert('Error: ' + data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (user: User) => {
    setNomUtilisateur(user.nomUtilisateur);
    setEmail(user.email);
    setPassword('');
    setEditingId(user.idUtilisateur);
  };

  const resetForm = () => {
    setNomUtilisateur('');
    setEmail('');
    setPassword('');
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/auth/users/${id}`, { 
        method: 'DELETE' 
      });
      const data = await response.text();
      if (response.ok) {
        alert(data);
        fetchUsers();
      } else {
        alert('Error: ' + data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
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
          id: doc.id, // Ajouter l'id du document
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
    } catch (error) {
      console.error('Error syncing reports:', error);
      alert('Error syncing reports');
    }
  };

  const handleManageTravaux = (report: Report) => {
    setSelectedReport(report);
    // Pré-remplir avec les données existantes si elles existent
    if (report.travaux) {
      setBudget(report.travaux.budget.toString());
      setEntreprise(report.travaux.id_entreprise.toString());
      setDateDebut(report.travaux.date_debut_travaux.toISOString().split('T')[0]);
      setDateFin(report.travaux.date_fin_travaux.toISOString().split('T')[0]);
      setAvancement(report.travaux.avancement.toString());
    } else {
      // Valeurs par défaut pour un nouveau travaux
      setBudget('');
      setEntreprise('');
      // Utiliser la date du signalement comme date de début par défaut
      setDateDebut(report.date_ajoute.toISOString().split('T')[0]);
      setDateFin('');
      setAvancement('0');
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setEditSurface(report.surface.toString());
    setEditDescription(report.description);
    setEditStatut(report.statut);
    setEditEntreprise(report.travaux ? report.travaux.id_entreprise.toString() : '');
    setEditBudget(report.travaux ? report.travaux.budget.toString() : '');
    setEditDateDebut(report.travaux ? report.travaux.date_debut_travaux.toISOString().split('T')[0] : '');
    setEditDateFin(report.travaux ? report.travaux.date_fin_travaux.toISOString().split('T')[0] : '');
  };

  const saveReportChanges = async () => {
    if (!editingReport) return;

    try {
      // Mettre à jour le signalement
      await updateDoc(doc(db, 'signalements', editingReport.id), {
        surface: parseFloat(editSurface),
        description: editDescription,
        statut: editStatut,
      });

      // Gérer les travaux si des informations sont fournies
      if (editEntreprise && editBudget && editDateDebut && editDateFin) {
        const avancementValue = editAvancement ? parseFloat(editAvancement) : 0;
        if (isNaN(avancementValue) || avancementValue < 0 || avancementValue > 100) {
          alert('L\'avancement doit être un nombre entre 0 et 100');
          return;
        }

        if (editingReport.travaux) {
          // Mettre à jour les travaux existants
          const travauxRef = doc(db, 'travaux', editingReport.travaux.id.toString());
          await updateDoc(travauxRef, {
            budget: parseFloat(editBudget),
            id_entreprise: parseInt(editEntreprise),
            date_debut_travaux: new Date(editDateDebut),
            date_fin_travaux: new Date(editDateFin),
            avancement: avancementValue,
          });
        } else {
          // Créer de nouveaux travaux
          await addDoc(collection(db, 'travaux'), {
            id_signalement: editingReport.id,
            budget: parseFloat(editBudget),
            id_entreprise: parseInt(editEntreprise),
            date_debut_travaux: new Date(editDateDebut),
            date_fin_travaux: new Date(editDateFin),
            avancement: avancementValue,
          });
        }
      }

      alert('Signalement modifié avec succès');
      setEditingReport(null);
      setEditSurface('');
      setEditDescription('');
      setEditStatut('');
      setEditEntreprise('');
      setEditBudget('');
      setEditDateDebut('');
      setEditDateFin('');
      setEditAvancement('');
      syncReports();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Erreur lors de la modification du signalement');
    }
  };

  const saveTravaux = async () => {
    if (!selectedReport) return;

    const avancementValue = parseFloat(avancement);
    if (isNaN(avancementValue) || avancementValue < 0 || avancementValue > 100) {
      alert('L\'avancement doit être un nombre entre 0 et 100');
      return;
    }

    try {
      await addDoc(collection(db, 'travaux'), {
        id_signalement: selectedReport.id,
        budget: parseFloat(budget),
        id_entreprise: parseInt(entreprise),
        date_debut_travaux: new Date(dateDebut),
        date_fin_travaux: new Date(dateFin),
        avancement: avancementValue,
      });
      alert('Travaux ajoutés avec succès');
      setSelectedReport(null);
      setBudget('');
      setEntreprise('');
      setDateDebut('');
      setDateFin('');
      setAvancement('');
      syncReports();
    } catch (error) {
      console.error('Error saving travaux:', error);
      alert('Error saving travaux');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{ width: '200px', background: '#f0f0f0', padding: '20px' }}>
        <h2>Navigation</h2>
        <button onClick={() => setCurrentView('map')} style={{ display: 'block', marginBottom: '10px', width: '100%' }}>Carte</button>
        <button onClick={() => setCurrentView('users')} style={{ display: 'block', marginBottom: '10px', width: '100%' }}>Utilisateurs</button>
        <button onClick={() => setCurrentView('reports')} style={{ display: 'block', marginBottom: '10px', width: '100%' }}>Signalements</button>
        <button onClick={() => setCurrentView('auth')} style={{ display: 'block', marginBottom: '10px', width: '100%' }}>Authentification</button>
        <button onClick={handleLogout} style={{ display: 'block', marginTop: '20px', width: '100%', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>Déconnexion</button>
      </nav>
      <div style={{ flex: 1, padding: '20px' }}>
        {currentView === 'map' && (
          <div>
            <h1>Carte des Signalements</h1>
            <button onClick={syncReports} style={{ padding: '10px 20px', marginBottom: '20px' }}>
              Synchroniser les Signalements
            </button>
            <MapContainer center={[-18.8792, 47.5079]} zoom={12} style={{ height: '600px', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap contributors'
              />
              {reports.map((report) => (
                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                  <Popup>
                    <b>Signalement</b><br />
                    Surface: {report.surface} m²<br />
                    Description: {report.description}<br />
                    Statut: {report.statut}<br />
                    {report.travaux && (
                      <>
                        Entreprise: {report.travaux.entreprise_nom}<br />
                        Budget: {report.travaux.budget} Ar<br />
                      </>
                    )}
                    Date: {report.date_ajoute.toLocaleDateString()}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
        {currentView === 'users' && (
          <div>
            <h1>Gestion des Utilisateurs</h1>
            <button onClick={syncUsersFromFirebase} style={{ padding: '10px 20px', marginBottom: '20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🔄 Synchroniser les Utilisateurs
            </button>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '20px' }}>
              <h2>{editingId ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}</h2>
              <div style={{ marginBottom: '10px' }}>
                <label>Nom Utilisateur:</label>
                <input
                  type="text"
                  value={nomUtilisateur}
                  onChange={(e) => setNomUtilisateur(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px' }}
                  
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Mot de Passe {editingId ? '(laisser vide pour ne pas changer)' : ''}:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingId}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 20px', marginRight: '10px' }}>
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: '10px 20px' }}>
                  Annuler
                </button>
              )}
            </form>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nom Utilisateur</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rôle</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.idUtilisateur}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.idUtilisateur}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.nomUtilisateur}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.role.nom}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <button onClick={() => handleEdit(user)} style={{ marginRight: '10px' }}>Modifier</button>
                <button onClick={() => handleDelete(user.idUtilisateur)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
            </table>
          </div>
        )}
        {currentView === 'reports' && (
          <div>
            <h1>Gestion des Signalements</h1>
            <button onClick={syncReports} style={{ padding: '10px 20px', marginBottom: '20px' }}>
              Synchroniser les Signalements
            </button>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Utilisateur</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Surface (m²)</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Statut</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Entreprise</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Budget</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date Début</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date Fin</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.id}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.Id_User}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.surface}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.description}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.statut}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.travaux ? report.travaux.entreprise_nom : '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.travaux ? `${report.travaux.budget} Ar` : '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.travaux ? report.travaux.date_debut_travaux.toLocaleDateString() : '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.travaux ? report.travaux.date_fin_travaux.toLocaleDateString() : '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.date_ajoute.toLocaleDateString()}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <button onClick={() => handleEditReport(report)} style={{ marginRight: '5px' }}>Modifier</button>
                      <button onClick={() => handleManageTravaux(report)}>Gérer Travaux</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedReport && (
              <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
                <h3>Gérer les Travaux pour Signalement {selectedReport.id}</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label>Budget:</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Entreprise:</label>
                  <select
                    value={entreprise}
                    onChange={(e) => setEntreprise(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                    required
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {entreprises.map((ent) => (
                      <option key={ent.idEntreprise} value={ent.idEntreprise.toString()}>
                        {ent.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Date Début:</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Date Fin:</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Avancement (%):</label>
                  <input
                    type="number"
                    value={avancement}
                    onChange={(e) => setAvancement(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <button onClick={saveTravaux} style={{ padding: '10px 20px', marginRight: '10px' }}>
                  Sauvegarder
                </button>
                <button onClick={() => setSelectedReport(null)} style={{ padding: '10px 20px' }}>
                  Annuler
                </button>
              </div>
            )}

            {editingReport && (
              <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Modifier le Signalement</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label>Surface (m²):</label>
                  <input
                    type="number"
                    value={editSurface}
                    onChange={(e) => setEditSurface(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Description:</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ width: '100%', padding: '8px', minHeight: '80px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Statut:</label>
                  <select
                    value={editStatut}
                    onChange={(e) => setEditStatut(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="non traité">Non traité</option>
                    <option value="en cours">En cours</option>
                    <option value="résolu">Résolu</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Entreprise:</label>
                  <select
                    value={editEntreprise}
                    onChange={(e) => setEditEntreprise(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {entreprises.map((entreprise) => (
                      <option key={entreprise.idEntreprise} value={entreprise.idEntreprise}>
                        {entreprise.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Budget (Ar):</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Date Début Travaux:</label>
                  <input
                    type="date"
                    value={editDateDebut}
                    onChange={(e) => setEditDateDebut(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Date Fin Travaux:</label>
                  <input
                    type="date"
                    value={editDateFin}
                    onChange={(e) => setEditDateFin(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Avancement (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editAvancement}
                    onChange={(e) => setEditAvancement(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <button onClick={saveReportChanges} style={{ padding: '10px 20px', marginRight: '10px' }}>
                  Sauvegarder
                </button>
                <button onClick={() => setEditingReport(null)} style={{ padding: '10px 20px' }}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
        {currentView === 'auth' && (
          <div>
            <h1>Configuration Authentification</h1>
            
            <h2>Paramètres d'Authentification</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Paramètre</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Valeur</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authParams.map((param) => (
                  <tr key={param.cle}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{param.cle}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <input
                        type="text"
                        defaultValue={param.valeur}
                        onBlur={(e) => {
                          if (e.target.value !== param.valeur) {
                            updateAuthParam(param.cle, e.target.value);
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{param.description}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <button 
                        onClick={() => updateAuthParam(param.cle, (document.querySelector(`input[data-param="${param.cle}"]`) as HTMLInputElement)?.value || param.valeur)}
                        style={{ padding: '5px 10px' }}
                      >
                        Sauvegarder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>Gestion des Utilisateurs Bloqués</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nom Utilisateur</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Bloqué</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Tentatives</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(user => user.estBloque).map((user) => (
                  <tr key={user.idUtilisateur}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.idUtilisateur}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.nomUtilisateur}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.email}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.estBloque ? 'Oui' : 'Non'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.tentativesEchec || 0}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <button 
                        onClick={() => resetUserLock(user.idUtilisateur)}
                        style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        Débloquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;