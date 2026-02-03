import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/login.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Small helper to force Leaflet to recalculate size after render or window resize
const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    // call once after a short delay to account for layout changes
    const t = setTimeout(invalidate, 200);
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
};

// Custom icons for different problem types
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
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
  type_probleme?: string;
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
  const [currentView, setCurrentView] = useState<'map' | 'users' | 'reports' | 'config'>('map');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editSurface, setEditSurface] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEntreprise, setEditEntreprise] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editDateDebut, setEditDateDebut] = useState('');
  const [editDateFin, setEditDateFin] = useState('');
  const [editStatut, setEditStatut] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);

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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Authentication failed');
    }

    return response;
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetchUsers();
    fetchEntreprises();
    fetchAuthParams();
    syncReports();
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
      const firebaseUsersSnapshot = await getDocs(collection(db, 'utilisateurs'));
      const firebaseUsers: any[] = [];
      firebaseUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        firebaseUsers.push({
          id: doc.id,
          ...data
        });
      });

      const postgresResponse = await authenticatedFetch('http://localhost:8080/api/auth/users');
      const postgresUsers = await postgresResponse.json();

      for (const firebaseUser of firebaseUsers) {
        const existsInPostgres = postgresUsers.some((pgUser: any) => pgUser.email === firebaseUser.email);

        if (!existsInPostgres) {
          try {
            const createResponse = await authenticatedFetch('http://localhost:8080/api/auth/users', {
              method: 'POST',
              body: JSON.stringify({
                nomUtilisateur: firebaseUser.nomUtilisateur,
                email: firebaseUser.email,
                password: firebaseUser.motDePasse || 'defaultPassword123',
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

      await fetchUsers();
      alert('Synchronisation terminée !');
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('Erreur lors de la synchronisation des utilisateurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData: any = { nomUtilisateur, email };
    if (password) {
      userData.password = password;
    }
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
        
        if (editingId) {
          try {
            const q = query(collection(db, 'utilisateurs'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docRef = querySnapshot.docs[0].ref;
              const updateData: any = {};
              if (password) {
                updateData.motDePasse = password;
              }
              updateData.nomUtilisateur = nomUtilisateur;
              await updateDoc(docRef, updateData);
              console.log('Utilisateur mis à jour dans Firebase');
            }
          } catch (firebaseError) {
            console.error('Erreur lors de la mise à jour dans Firebase:', firebaseError);
          }
        } else {
          try {
            await addDoc(collection(db, 'utilisateurs'), {
              nomUtilisateur,
              email,
              motDePasse: password,
              dateCreation: new Date(),
              sourceAuth: 'local'
            });
            console.log('Utilisateur créé dans Firebase');
          } catch (firebaseError) {
            console.error('Erreur lors de la création dans Firebase:', firebaseError);
          }
        }
        
        fetchUsers();
        resetForm();
        setShowUserModal(false);
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
    setShowUserModal(true);
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
    } catch (error) {
      console.error('Error syncing reports:', error);
      alert('Error syncing reports');
    }
  };

  const handleManageTravaux = (report: Report) => {
    setSelectedReport(report);
    if (report.travaux) {
      setBudget(report.travaux.budget.toString());
      setEntreprise(report.travaux.id_entreprise.toString());
      setDateDebut(report.travaux.date_debut_travaux.toISOString().split('T')[0]);
      setDateFin(report.travaux.date_fin_travaux.toISOString().split('T')[0]);
    } else {
      setBudget('');
      setEntreprise('');
      setDateDebut(report.date_ajoute.toISOString().split('T')[0]);
      setDateFin('');
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
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, 'signalements', editingReport.id), {
        surface: parseFloat(editSurface),
        description: editDescription,
        statut: editStatut,
      });

      // Calculer automatiquement l'avancement basé sur le statut
      let avancementValue = 0;
      if (editStatut === 'nouveau') avancementValue = 0;
      else if (editStatut === 'en cours') avancementValue = 50;
      else if (editStatut === 'terminé') avancementValue = 100;

      if (editEntreprise && editBudget && editDateDebut && editDateFin) {
        const travauxData = {
          signalement: { idSignalement: parseInt(editingReport.id) },
          entreprise: { idEntreprise: parseInt(editEntreprise) },
          budget: parseFloat(editBudget),
          dateDebutTravaux: editDateDebut,
          dateFinTravaux: editDateFin,
          avancement: avancementValue,
        };

        if (editingReport.travaux) {
          // Update existing travaux in local DB
          const localUpdateResponse = await authenticatedFetch(`http://localhost:8080/api/travaux/${editingReport.travaux.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(travauxData),
          });
          if (!localUpdateResponse.ok) {
            console.warn('Failed to update travaux in local database:', await localUpdateResponse.text());
          }

          // Update in Firestore
          try {
            const travauxRef = doc(db, 'travaux', editingReport.travaux.id.toString());
            await updateDoc(travauxRef, {
              budget: parseFloat(editBudget),
              id_entreprise: parseInt(editEntreprise),
              date_debut_travaux: new Date(editDateDebut),
              date_fin_travaux: new Date(editDateFin),
              avancement: avancementValue,
            });

            // Créer l'historique dans Firestore
            const historiqueCommentaire = 
              editStatut === 'nouveau' ? 'Travaux non commencés' :
              editStatut === 'en cours' ? 'Travaux en cours' :
              'Travaux terminés';
            
            await addDoc(collection(db, 'historiques_travaux'), {
              id_travaux: editingReport.travaux.id,
              date_modification: new Date(),
              avancement: avancementValue,
              commentaire: historiqueCommentaire,
            });
          } catch (firestoreError) {
            console.warn('Failed to update travaux in Firestore:', firestoreError);
          }
        } else {
          // Create new travaux in local DB
          const localCreateResponse = await authenticatedFetch('http://localhost:8080/api/travaux', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(travauxData),
          });
          if (!localCreateResponse.ok) {
            console.warn('Failed to create travaux in local database:', await localCreateResponse.text());
          }

          // Create in Firestore
          try {
            const newTravauxDoc = await addDoc(collection(db, 'travaux'), {
              id_signalement: editingReport.id,
              budget: parseFloat(editBudget),
              id_entreprise: parseInt(editEntreprise),
              date_debut_travaux: new Date(editDateDebut),
              date_fin_travaux: new Date(editDateFin),
              avancement: avancementValue,
            });

            // Créer l'historique dans Firestore
            const historiqueCommentaire = 
              editStatut === 'nouveau' ? 'Travaux non commencés' :
              editStatut === 'en cours' ? 'Travaux en cours' :
              'Travaux terminés';
            
            await addDoc(collection(db, 'historiques_travaux'), {
              id_travaux: newTravauxDoc.id,
              date_modification: new Date(),
              avancement: avancementValue,
              commentaire: historiqueCommentaire,
            });
          } catch (firestoreError) {
            console.warn('Failed to create travaux in Firestore:', firestoreError);
          }
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
      syncReports();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Erreur lors de la modification du signalement');
    }
  };

  const saveTravaux = async () => {
    if (!selectedReport) return;

    // Calculer l'avancement automatiquement basé sur le statut du signalement
    let avancementValue = 0;
    if (selectedReport.statut === 'nouveau') avancementValue = 0;
    else if (selectedReport.statut === 'en cours') avancementValue = 50;
    else if (selectedReport.statut === 'terminé') avancementValue = 100;

    const commentaire = 
      selectedReport.statut === 'nouveau' ? 'Travaux non commencés' :
      selectedReport.statut === 'en cours' ? 'Travaux en cours' :
      'Travaux terminés';

    try {
      // First save to local Postgres database
      const travauxData = {
        signalement: { idSignalement: parseInt(selectedReport.id) },
        entreprise: { idEntreprise: parseInt(entreprise) },
        budget: parseFloat(budget),
        dateDebutTravaux: dateDebut,
        dateFinTravaux: dateFin,
        avancement: avancementValue,
      };

      const localResponse = await authenticatedFetch('http://localhost:8080/api/travaux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(travauxData),
      });

      if (!localResponse.ok) {
        console.warn('Failed to save to local database:', await localResponse.text());
      }

      // Then try to save to Firestore
      let travauxId = null;
      try {
        const travauxDoc = await addDoc(collection(db, 'travaux'), {
          id_signalement: selectedReport.id,
          budget: parseFloat(budget),
          id_entreprise: parseInt(entreprise),
          date_debut_travaux: new Date(dateDebut),
          date_fin_travaux: new Date(dateFin),
          avancement: avancementValue,
        });
        travauxId = travauxDoc.id;

        // Créer l'historique dans Firestore
        await addDoc(collection(db, 'historiques_travaux'), {
          id_travaux: travauxId,
          date_modification: new Date(),
          avancement: avancementValue,
          commentaire: commentaire,
        });
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore, but saved locally:', firestoreError);
      }

      alert('Travaux ajoutés avec succès');
      setSelectedReport(null);
      setBudget('');
      setEntreprise('');
      setDateDebut('');
      setDateFin('');
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

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'nouveau':
        return <span className="status-badge status-pending">⏳ Nouveau</span>;
      case 'en cours':
        return <span className="status-badge status-progress">🔄 En cours</span>;
      case 'terminé':
        return <span className="status-badge status-resolved">✅ Terminé</span>;
      default:
        return <span className="status-badge">{statut}</span>;
    }
  };

  const calculateAverageDelay = () => {
    const completedReports = reports.filter(r => r.statut === 'terminé' && r.travaux);
    if (completedReports.length === 0) return 0;
    
    const totalDays = completedReports.reduce((sum, report) => {
      if (report.travaux && report.travaux.date_debut_travaux && report.travaux.date_fin_travaux) {
        const start = new Date(report.travaux.date_debut_travaux);
        const end = new Date(report.travaux.date_fin_travaux);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }
      return sum;
    }, 0);
    
    return Math.round(totalDays / completedReports.length);
  };

  const getProblemTypeLabel = (type?: string) => {
    const labels: { [key: string]: string } = {
      'nid-de-poule': '🕳️ Nid de poule',
      'route-inondee': '🌊 Route inondée',
      'route-endommagee': '⚠️ Route endommagée',
      'signalisation-manquante': '🚧 Signalisation manquante',
      'eclairage-defectueux': '💡 Éclairage défectueux',
      'autre': '📍 Autre',
    };
    return labels[type || ''] || '📍 Non spécifié';
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
          <button 
            className={`nav-item ${currentView === 'map' ? 'active' : ''}`}
            onClick={() => setCurrentView('map')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 6V22L8 18L16 22L23 18V2L16 6L8 2L1 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Carte
          </button>
          <button 
            className={`nav-item ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentView('users')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Utilisateurs
          </button>
          <button 
            className={`nav-item ${currentView === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentView('reports')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Signalements
          </button>
          <button 
            className={`nav-item ${currentView === 'config' ? 'active' : ''}`}
            onClick={() => setCurrentView('config')}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Configuration
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Déconnexion
        </button>
      </nav>

      <main className="main-content">
        {currentView === 'map' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Carte des Signalements</h1>
              <p className="page-subtitle">Visualisez tous les problèmes routiers signalés</p>
            </div>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={syncReports}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 9.00001C4.01717 7.56679 4.87913 6.28541 6.01547 5.27543C7.1518 4.26545 8.52547 3.55977 10.0083 3.22427C11.4911 2.88877 13.0348 2.93436 14.4952 3.35679C15.9556 3.77922 17.2853 4.56472 18.36 5.64001L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Synchroniser
              </button>
            </div>
            <div className="map-container" style={{ height: '70vh', minHeight: '600px' }}>
              <MapContainer center={[-18.8792, 47.5079]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© OpenStreetMap contributors'
                />
                <MapResizeFix />
                {reports.map((report) => (
                  <Marker 
                    key={report.id} 
                    position={[report.latitude, report.longitude]}
                    icon={getIconForProblem(report.type_probleme)}
                  >
                    <Popup>
                      <div className="custom-popup">
                        <h4>{getProblemTypeLabel(report.type_probleme)}</h4>
                        <div className="popup-row">
                          <span className="popup-label">Surface</span>
                          <span className="popup-value">{report.surface} m²</span>
                        </div>
                        <div className="popup-row">
                          <span className="popup-label">Statut</span>
                          <span className="popup-value">{report.statut}</span>
                        </div>
                        <div className="popup-row">
                          <span className="popup-label">Date</span>
                          <span className="popup-value">{report.date_ajoute.toLocaleDateString()}</span>
                        </div>
                        {report.travaux && (
                          <>
                            <div className="popup-row">
                              <span className="popup-label">Entreprise</span>
                              <span className="popup-value">{report.travaux.entreprise_nom}</span>
                            </div>
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
                        <p style={{margin: '12px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)'}}>
                          {report.description}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </>
        )}

        {currentView === 'users' && (
          <div className="content-wrapper">
            <div className="page-header">
              <h1 className="page-title">Gestion des Utilisateurs</h1>
              <p className="page-subtitle">Gérez les comptes utilisateurs du système</p>
            </div>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => { resetForm(); setShowUserModal(true); }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ajouter Utilisateur
              </button>
              <button className="btn btn-secondary" onClick={syncUsersFromFirebase}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Synchroniser Firebase
              </button>
              <button className="btn btn-danger" onClick={() => setShowBlockedUsersModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Utilisateurs Bloqués ({users.filter(u => u.estBloque).length})
              </button>
            </div>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => !u.estBloque).map((user) => (
                    <tr key={user.idUtilisateur}>
                      <td>{user.idUtilisateur}</td>
                      <td>{user.nomUtilisateur}</td>
                      <td>{user.email}</td>
                      <td><span className="status-badge status-progress">{user.role.nom}</span></td>
                      <td>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button className="btn btn-secondary btn-icon" onClick={() => handleEdit(user)}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className="btn btn-danger btn-icon" onClick={() => handleDelete(user.idUtilisateur)}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'reports' && (
          <div className="content-wrapper">
            <div className="page-header">
              <h1 className="page-title">Gestion des Signalements</h1>
              <p className="page-subtitle">Suivez et gérez tous les problèmes routiers</p>
            </div>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={syncReports}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                  <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Synchroniser
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">📍</div>
                <div className="stat-info">
                  <div className="stat-label">Total signalements</div>
                  <div className="stat-value">{reports.length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon yellow">⏳</div>
                <div className="stat-info">
                  <div className="stat-label">Nouveaux</div>
                  <div className="stat-value">{reports.filter(r => r.statut === 'nouveau').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">🔄</div>
                <div className="stat-info">
                  <div className="stat-label">En cours</div>
                  <div className="stat-value">{reports.filter(r => r.statut === 'en cours').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">✅</div>
                <div className="stat-info">
                  <div className="stat-label">Terminés</div>
                  <div className="stat-value">{reports.filter(r => r.statut === 'terminé').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">📊</div>
                <div className="stat-info">
                  <div className="stat-label">Délai moyen</div>
                  <div className="stat-value">{calculateAverageDelay()} jours</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{overflowX: 'auto'}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Surface</th>
                      <th>Statut</th>
                      <th>Entreprise</th>
                      <th>Budget</th>
                      <th>Avancement</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{getProblemTypeLabel(report.type_probleme)}</td>
                        <td>{report.surface} m²</td>
                        <td>{getStatusBadge(report.statut)}</td>
                        <td>{report.travaux?.entreprise_nom || '-'}</td>
                        <td>{report.travaux ? `${report.travaux.budget.toLocaleString()} Ar` : '-'}</td>
                        <td>
                          {report.travaux ? (
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <div style={{flex: 1, height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden'}}>
                                <div style={{width: `${report.travaux.avancement}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #a855f7)', borderRadius: '3px'}}></div>
                              </div>
                              <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)'}}>{report.travaux.avancement}%</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td>{report.date_ajoute.toLocaleDateString()}</td>
                        <td>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <button className="btn btn-secondary btn-icon" onClick={() => handleEditReport(report)}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button className="btn btn-success btn-icon" onClick={() => handleManageTravaux(report)}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.7 6.3C14.5168 6.48693 14.414 6.73825 14.414 7C14.414 7.26175 14.5168 7.51307 14.7 7.7L16.3 9.3C16.4869 9.48324 16.7383 9.58603 17 9.58603C17.2617 9.58603 17.5131 9.48324 17.7 9.3L21.47 5.53C21.9728 6.51097 22.1251 7.62857 21.9021 8.70406C21.6791 9.77954 21.094 10.7488 20.2465 11.4564C19.399 12.164 18.3374 12.5688 17.233 12.6056C16.1285 12.6424 15.0427 12.3093 14.15 11.66L6.3 19.51C6.01302 19.7969 5.62098 19.9576 5.2125 19.9576C4.80402 19.9576 4.41198 19.7969 4.125 19.51L4.49 19.875C4.20302 19.5881 4.04235 19.196 4.04235 18.7875C4.04235 18.379 4.20302 17.9869 4.49 17.7L12.34 9.85C11.6907 8.95728 11.3576 7.87154 11.3944 6.76701C11.4312 5.66249 11.836 4.60097 12.5436 3.75351C13.2512 2.90605 14.2205 2.32095 15.2959 2.09793C16.3714 1.87491 17.489 2.02722 18.47 2.53L14.71 6.29L14.7 6.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )} 

        {currentView === 'config' && (
          <div className="content-wrapper">
            <div className="page-header">
              <h1 className="page-title">Configuration</h1>
              <p className="page-subtitle">Paramètres et règles de gestion du système</p>
            </div>
            
            <div className="card" style={{marginBottom: '24px'}}>
              <div className="card-header">
                <h3 className="card-title">Paramètres d'Authentification</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paramètre</th>
                    <th>Valeur</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authParams.map((param) => (
                    <tr key={param.cle}>
                      <td style={{fontWeight: 500}}>{param.cle}</td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          defaultValue={param.valeur}
                          data-param={param.cle}
                          style={{maxWidth: '150px'}}
                        />
                      </td>
                      <td style={{color: 'rgba(255,255,255,0.5)'}}>{param.description}</td>
                      <td>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            const input = document.querySelector(`input[data-param="${param.cle}"]`) as HTMLInputElement;
                            if (input) updateAuthParam(param.cle, input.value);
                          }}
                        >
                          Sauvegarder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingId ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}</h3>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nom Utilisateur</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nomUtilisateur}
                    onChange={(e) => setNomUtilisateur(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de Passe {editingId ? '(laisser vide pour ne pas changer)' : ''}</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Modifier' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blocked Users Modal */}
        {showBlockedUsersModal && (
          <div className="modal-overlay" onClick={() => setShowBlockedUsersModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
              <div className="modal-header">
                <h3 className="modal-title">Utilisateurs Bloqués</h3>
                <button className="modal-close" onClick={() => setShowBlockedUsersModal(false)}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {users.filter(user => user.estBloque).length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Tentatives</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user => user.estBloque).map((user) => (
                      <tr key={user.idUtilisateur}>
                        <td>{user.nomUtilisateur}</td>
                        <td>{user.email}</td>
                        <td>{user.tentativesEchec || 0}</td>
                        <td>
                          <button 
                            className="btn btn-success"
                            onClick={() => resetUserLock(user.idUtilisateur)}
                          >
                            Débloquer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px'}}>Aucun utilisateur bloqué</p>
              )}
            </div>
          </div>
        )}

        {/* Travaux Modal */}
        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Gérer les Travaux</h3>
                <button className="modal-close" onClick={() => setSelectedReport(null)}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">Budget (Ar)</label>
                <input type="number" className="form-input" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <select className="form-select" value={entreprise} onChange={(e) => setEntreprise(e.target.value)}>
                  <option value="">Sélectionner une entreprise</option>
                  {entreprises.map((ent) => (
                    <option key={ent.idEntreprise} value={ent.idEntreprise.toString()}>{ent.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date Début</label>
                <input type="date" className="form-input" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date Fin</label>
                <input type="date" className="form-input" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '12px'}}>
                💡 L'avancement est calculé automatiquement selon le statut du signalement
              </p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={saveTravaux}>Sauvegarder</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Report Modal */}
        {editingReport && (
          <div className="modal-overlay" onClick={() => setEditingReport(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Modifier le Signalement</h3>
                <button className="modal-close" onClick={() => setEditingReport(null)}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}}>
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">Surface (m²)</label>
                <input type="number" className="form-input" value={editSurface} onChange={(e) => setEditSurface(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="form-select" value={editStatut} onChange={(e) => setEditStatut(e.target.value)}>
                  <option value="nouveau">Nouveau</option>
                  <option value="en cours">En cours</option>
                  <option value="terminé">Terminé</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <select className="form-select" value={editEntreprise} onChange={(e) => setEditEntreprise(e.target.value)}>
                  <option value="">Sélectionner une entreprise</option>
                  {entreprises.map((ent) => (
                    <option key={ent.idEntreprise} value={ent.idEntreprise}>{ent.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget (Ar)</label>
                <input type="number" className="form-input" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date Début Travaux</label>
                <input type="date" className="form-input" value={editDateDebut} onChange={(e) => setEditDateDebut(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date Fin Travaux</label>
                <input type="date" className="form-input" value={editDateFin} onChange={(e) => setEditDateFin(e.target.value)} />
              </div>
              <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '12px'}}>
                💡 L'avancement est calculé automatiquement selon le statut : Nouveau = 0%, En cours = 50%, Terminé = 100%
              </p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingReport(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={saveReportChanges}>Sauvegarder</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
