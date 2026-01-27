import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

interface User {
  idUtilisateur: number;
  nomUtilisateur: string;
  email: string;
  role: { nom: string };
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const resetForm = () => {
    setNomUtilisateur('');
    setEmail('');
    setPassword('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { nomUtilisateur, email, password };
    try {
      const url = editingId ? `http://localhost:8080/api/auth/users/${editingId}` : 'http://localhost:8080/api/auth/users';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/auth/users/${id}`, { method: 'DELETE' });
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

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Gestion des Utilisateurs</h1>
        <button
          onClick={() => navigate('/map')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5a6268';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6c757d';
          }}
        >
          ← Retour à la Carte
        </button>
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2>{editingId ? 'Modifier Utilisateur' : 'Créer un Nouvel Utilisateur'}</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom Utilisateur:</label>
          <input
            type="text"
            value={nomUtilisateur}
            onChange={(e) => setNomUtilisateur(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mot de Passe {editingId ? '(laisser vide pour ne pas changer)' : ''}:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editingId}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {editingId ? 'Modifier' : 'Créer'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ flex: 1, padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <h2>Liste des Utilisateurs</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Nom</th>
            <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Rôle</th>
            <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.idUtilisateur}>
              <td style={{ border: '1px solid #ccc', padding: '12px' }}>{user.idUtilisateur}</td>
              <td style={{ border: '1px solid #ccc', padding: '12px' }}>{user.nomUtilisateur}</td>
              <td style={{ border: '1px solid #ccc', padding: '12px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ccc', padding: '12px' }}>{user.role.nom}</td>
              <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                <button onClick={() => handleEdit(user)} style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Modifier</button>
                <button onClick={() => handleDelete(user.idUtilisateur)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManagerDashboard;