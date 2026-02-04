import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const initializeNotifications = async (userId: string) => {
  try {
    // Demander la permission pour les notifications
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // S'enregistrer pour les notifications
      await PushNotifications.register();
      
      // Écouter l'événement de registration
      await PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token:', token.value);
        
        // Sauvegarder le token dans Firestore
        try {
          await setDoc(doc(db, 'users', userId), {
            fcmToken: token.value,
            lastTokenUpdate: new Date()
          }, { merge: true });
          console.log('Token sauvegardé dans Firestore');
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du token:', error);
        }
      });
      
      // Écouter les erreurs d'enregistrement
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Erreur d\'enregistrement:', error);
      });
      
      // Écouter les notifications reçues quand l'app est au premier plan
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notification reçue:', notification);
        // Afficher un toast ou une alerte
        alert(`📢 ${notification.title}\n${notification.body}`);
      });
      
      // Écouter les actions sur les notifications
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Action sur notification:', action);
        // Rediriger l'utilisateur vers la page appropriée
        const data = action.notification.data;
        if (data.signalementId) {
          // Naviguer vers le signalement
          console.log('Redirection vers signalement:', data.signalementId);
        }
      });
      
      return true;
    } else {
      console.log('Permission de notification refusée');
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des notifications:', error);
    return false;
  }
};

export const getStoredFcmToken = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().fcmToken || null;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};
