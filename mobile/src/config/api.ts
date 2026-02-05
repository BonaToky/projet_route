// Configuration de l'API
// L'IP peut être configurée depuis les paramètres de l'application
import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  // Récupérer l'IP depuis le localStorage
  const savedIp = localStorage.getItem('api_server_ip');
  
  // Debug log
  console.log('🔍 getApiBaseUrl - savedIp:', savedIp);
  
  if (savedIp && savedIp.trim() !== '') {
    const url = `http://${savedIp}:8080/api`;
    console.log('🌐 API URL:', url);
    return url;
  }
  
  // Par défaut, utiliser localhost (pour l'émulateur)
  console.log('🌐 API URL: localhost (default)');
  return 'http://localhost:8080/api';
};

// Fonction wrapper pour fetch qui utilise CapacitorHttp sur mobile natif
// Ceci contourne le blocage Mixed Content dans la WebView
export const apiRequest = async (url: string, options?: RequestInit): Promise<Response> => {
  // Sur mobile natif, utiliser CapacitorHttp pour éviter Mixed Content blocking
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Using CapacitorHttp for native platform');
    
    const response = await CapacitorHttp.request({
      url,
      method: (options?.method as any) || 'GET',
      headers: options?.headers as any,
      data: options?.body ? JSON.parse(options.body as string) : undefined,
    });

    // Convertir la réponse CapacitorHttp en format Response standard
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status.toString(),
      headers: new Headers(response.headers),
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      blob: async () => new Blob([JSON.stringify(response.data)]),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: () => ({ ...response } as any),
      body: null,
      bodyUsed: false,
      redirected: false,
      type: 'basic',
      url,
    } as Response;
  }
  
  // Sur web/navigateur, utiliser fetch normal
  console.log('🌐 Using standard fetch for web platform');
  return fetch(url, options);
};

// Ne pas exporter une constante, sinon elle est évaluée une seule fois
// export const API_BASE_URL = getApiBaseUrl();
