import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'RouteWatch',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: {
        android: 'ACCESS_FINE_LOCATION,ACCESS_COARSE_LOCATION',
        ios: 'location'
      }
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
