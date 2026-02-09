import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './styles/login.css';

const ManagerRegister = () => {
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Calcul de la progression du formulaire
  const progress = useMemo(() => {
    let filled = 0;
    if (nomUtilisateur.trim().length > 0) filled++;
    if (email.trim().length > 0) filled++;
    if (password.length > 0) filled++;
    if (confirmPassword.length > 0 && confirmPassword === password) filled++;
    return (filled / 4) * 100;
  }, [nomUtilisateur, email, password, confirmPassword]);

  const getProgressLabel = () => {
    if (progress === 0) return 'Commencez à remplir le formulaire';
    if (progress <= 25) return 'Continuez...';
    if (progress <= 50) return 'Bien, encore quelques champs';
    if (progress <= 75) return 'Presque terminé !';
    return 'Formulaire complet ✓';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 3) {
      alert('Le mot de passe doit contenir au moins 3 caractères');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/register-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomUtilisateur,
          email,
          password,
        }),
      });

      if (response.ok) {
        // Auto-login avec les mêmes identifiants
        try {
          const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            localStorage.setItem('authToken', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));
          }
        } catch (loginErr) {
          console.warn('Auto-login failed, user will need to login manually', loginErr);
        }
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      } else {
        const data = await response.text();
        alert('Erreur : ' + data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-sidebar">
          <div className="sidebar-content">
            <div className="sidebar-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="sidebar-title">RouteWatch</h1>
            <p className="sidebar-description">
              Système de gestion et de suivi des problèmes routiers.
              Signalez, suivez et gérez les interventions sur le réseau routier.
            </p>
            <div className="sidebar-features">
              <div className="feature-item">
                <div className="feature-icon">📍</div>
                <span className="feature-text">Suivi en temps réel des signalements</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <span className="feature-text">Tableau de bord analytique</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏗️</div>
                <span className="feature-text">Gestion des travaux et interventions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-main">
          <div className="login-card">
            <div className="register-success">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Inscription réussie !</h2>
              <p>Le compte manager a été créé avec succès.<br/>Redirection vers le tableau de bord...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Left Sidebar with branding */}
      <div className="login-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="sidebar-title">RouteWatch</h1>
          <p className="sidebar-description">
            Système de gestion et de suivi des problèmes routiers.
            Signalez, suivez et gérez les interventions sur le réseau routier.
          </p>

          <div className="sidebar-features">
            <div className="feature-item">
              <div className="feature-icon">📍</div>
              <span className="feature-text">Suivi en temps réel des signalements</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <span className="feature-text">Tableau de bord analytique</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏗️</div>
              <span className="feature-text">Gestion des travaux et interventions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="login-main">
        <div className="login-card">
          <div className="login-header">
            <h1>Inscription Manager</h1>
            <p>Créer un nouveau compte gestionnaire</p>
          </div>

          {/* Progress Bar */}
          <div className="register-progress">
            <div className="progress-header">
              <span className="progress-label">{getProgressLabel()}</span>
              <span className="progress-percent">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="nomUtilisateur">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="nomUtilisateur"
                value={nomUtilisateur}
                onChange={(e) => setNomUtilisateur(e.target.value)}
                required
                placeholder="Ex: jean.dupont"
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votreemail@exemple.com"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              {confirmPassword && confirmPassword !== password && (
                <span className="input-error">Les mots de passe ne correspondent pas</span>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || progress < 100}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  Créer le compte
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/" className="visitor-link">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerRegister;
