import { useState, useEffect } from 'react';

interface User {
  idUtilisateur: number;
  nomUtilisateur: string;
  email: string;
  role: { nom: string };
}

const ManagerDashboard = () => {
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
      const response = await fetch('/auth/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { nomUtilisateur, email, password };
    try {
      const url = editingId ? `/auth/users/${editingId}` : '/auth/users';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.text();
      if (response.ok) {
        alert(data);
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
      const response = await fetch(`/auth/users/${id}`, { method: 'DELETE' });
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

  const resetForm = () => {
    setNomUtilisateur('');
    setEmail('');
    setPassword('');
    setEditingId(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Tableau de Bord Manager - Gestion des Utilisateurs</h1>
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
                <button onClick={() => handleDelete(user.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManagerDashboard;