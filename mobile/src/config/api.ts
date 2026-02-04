// Configuration de l'API
// L'IP peut être configurée depuis les paramètres de l'application

export const getApiBaseUrl = (): string => {
  // Récupérer l'IP depuis le localStorage
  const savedIp = localStorage.getItem('api_server_ip');
  
  if (savedIp) {
    return `http://${savedIp}:8080/api`;
  }
  
  // Par défaut, utiliser localhost (pour l'émulateur)
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();
