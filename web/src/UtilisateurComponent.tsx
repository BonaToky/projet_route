import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Lock, Unlock, RefreshCw } from 'lucide-react';

const UtilisateurManagement = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUtilisateur, setSelectedUtilisateur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomUtilisateur: '',
    email: '',
    motDePasse: '',
    idRole: 1,
    estBloque: false
  });

  const API_URL = 'http://localhost:8080/api/utilisateurs';

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  useEffect(() => {
    const filtered = utilisateurs.filter(user =>
      user.nomUtilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUtilisateurs(filtered);
  }, [searchTerm, utilisateurs]);

  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setUtilisateurs(data);
      setFilteredUtilisateurs(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, utilisateur = null) => {
    setModalMode(mode);
    if (mode === 'edit' && utilisateur) {
      setSelectedUtilisateur(utilisateur);
      setFormData({
        nomUtilisateur: utilisateur.nomUtilisateur,
        email: utilisateur.email,
        motDePasse: '',
        idRole: utilisateur.idRole || 1,
        estBloque: utilisateur.estBloque || false
      });
    } else {
      setFormData({
        nomUtilisateur: '',
        email: '',
        motDePasse: '',
        idRole: 1,
        estBloque: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUtilisateur(null);
    setFormData({
      nomUtilisateur: '',
      email: '',
      motDePasse: '',
      idRole: 1,
      estBloque: false
    });
  };

  const handleSubmit = async () => {
    if (!formData.nomUtilisateur || !formData.email || (modalMode === 'add' && !formData.motDePasse)) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const url = modalMode === 'edit' 
        ? `${API_URL}/${selectedUtilisateur.idUtilisateur}`
        : API_URL;
      
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      
      const dataToSend = modalMode === 'edit' && !formData.motDePasse
        ? { ...formData, motDePasse: undefined }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        alert(modalMode === 'edit' ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
        handleCloseModal();
        fetchUtilisateurs();
      } else {
        const error = await response.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Utilisateur supprimé avec succès');
        fetchUtilisateurs();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAttempts = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${id}/reinitialiser-tentatives`, { method: 'PUT' });
      if (response.ok) {
        alert('Tentatives réinitialisées avec succès');
        fetchUtilisateurs();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-t-4 border-sky-400">
          <h1 className="text-3xl font-bold text-sky-700 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Gérer les comptes utilisateurs de votre application</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-400 transition"
              />
            </div>
            <button
              onClick={() => handleOpenModal('add')}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg transition shadow-md"
            >
              <Plus size={20} />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading && (
            <div className="text-center py-8 text-sky-600">Chargement...</div>
          )}
          
          {!loading && filteredUtilisateurs.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucun utilisateur trouvé</div>
          )}

          {!loading && filteredUtilisateurs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sky-500 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Nom d'utilisateur</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Tentatives</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date création</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {filteredUtilisateurs.map((user) => (
                    <tr key={user.idUtilisateur} className="hover:bg-sky-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-700">{user.idUtilisateur}</td>
                      <td className="px-6 py-4 text-sm font-medium text-sky-700">{user.nomUtilisateur}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                          Rôle {user.idRole || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.estBloque ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <Lock size={16} /> Bloqué
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <Unlock size={16} /> Actif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={user.tentativesEchec > 0 ? 'text-orange-600' : 'text-gray-600'}>
                            {user.tentativesEchec || 0}
                          </span>
                          {user.tentativesEchec > 0 && (
                            <button
                              onClick={() => handleResetAttempts(user.idUtilisateur)}
                              className="text-sky-500 hover:text-sky-700"
                              title="Réinitialiser"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.dateCreation)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenModal('edit', user)}
                            className="p-2 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.idUtilisateur)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mt-4 text-center text-gray-600">
          Total: {filteredUtilisateurs.length} utilisateur(s)
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-sky-500 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {modalMode === 'add' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
              </h2>
              <button onClick={handleCloseModal} className="hover:bg-sky-600 p-1 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={formData.nomUtilisateur}
                  onChange={(e) => setFormData({ ...formData, nomUtilisateur: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {modalMode === 'edit' && '(laisser vide pour ne pas modifier)'}
                </label>
                <input
                  type="password"
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.idRole}
                  onChange={(e) => setFormData({ ...formData, idRole: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-400"
                >
                  <option value={1}>Administrateur</option>
                  <option value={2}>Utilisateur</option>
                  <option value={3}>Modérateur</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="estBloque"
                  checked={formData.estBloque}
                  onChange={(e) => setFormData({ ...formData, estBloque: e.target.checked })}
                  className="w-4 h-4 text-sky-500 border-sky-300 rounded focus:ring-sky-400"
                />
                <label htmlFor="estBloque" className="text-sm font-medium text-gray-700">
                  Bloquer cet utilisateur
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'En cours...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilisateurManagement;