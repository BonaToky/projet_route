import { useState } from 'react';

const ManagerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'modify'>('create');

  const [createForm, setCreateForm] = useState({
    nomUtilisateur: '',
    email: '',
    password: ''
  });

  const [modifyForm, setModifyForm] = useState({
    email: '',
    newPassword: ''
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      const data = await response.text();
      if (response.ok) {
        alert('User created successfully');
        setCreateForm({ nomUtilisateur: '', email: '', password: '' });
      } else {
        alert('Failed to create user: ' + data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For modify, assuming there's an endpoint, but for now, just placeholder
    alert('Modify user functionality not implemented yet');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>Tableau de Bord Manager</h1>
      <button onClick={onLogout} style={{ float: 'right', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
        Déconnexion
      </button>
      <div style={{ clear: 'both', marginTop: '20px' }}>
        <button onClick={() => setActiveTab('create')} style={{ marginRight: '10px', padding: '10px', backgroundColor: activeTab === 'create' ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>
          Créer Utilisateur
        </button>
        <button onClick={() => setActiveTab('modify')} style={{ padding: '10px', backgroundColor: activeTab === 'modify' ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px' }}>
          Modifier Utilisateur
        </button>
      </div>
      {activeTab === 'create' && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Créer un Nouvel Utilisateur</h2>
          <form onSubmit={handleCreateSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="nomUtilisateur" style={{ display: 'block', marginBottom: '5px' }}>Nom d'Utilisateur:</label>
              <input
                type="text"
                id="nomUtilisateur"
                value={createForm.nomUtilisateur}
                onChange={(e) => setCreateForm({ ...createForm, nomUtilisateur: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="createEmail" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input
                type="email"
                id="createEmail"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="createPassword" style={{ display: 'block', marginBottom: '5px' }}>Mot de passe:</label>
              <input
                type="password"
                id="createPassword"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Créer Utilisateur
            </button>
          </form>
        </div>
      )}
      {activeTab === 'modify' && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Modifier un Utilisateur</h2>
          <form onSubmit={handleModifySubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="modifyEmail" style={{ display: 'block', marginBottom: '5px' }}>Email de l'utilisateur:</label>
              <input
                type="email"
                id="modifyEmail"
                value={modifyForm.email}
                onChange={(e) => setModifyForm({ ...modifyForm, email: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '5px' }}>Nouveau Mot de passe:</label>
              <input
                type="password"
                id="newPassword"
                value={modifyForm.newPassword}
                onChange={(e) => setModifyForm({ ...modifyForm, newPassword: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Modifier Utilisateur
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;