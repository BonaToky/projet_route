# Configuration des Notifications Push

## ⚠️ IMPORTANT : Fichier google-services.json

Le fichier `mobile/android/app/google-services.json` actuel est un **placeholder temporaire**.

Pour que les notifications push fonctionnent, vous devez le remplacer par le vrai fichier depuis Firebase Console :

### Étapes pour obtenir le bon fichier :

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet : **cloud-mobile-c6ab2**
3. Cliquez sur l'icône ⚙️ (Project Settings)
4. Allez dans l'onglet **"General"**
5. Scrollez vers "Your apps"
6. Cliquez sur l'app Android (com.projet.route)
7. Téléchargez **google-services.json**
8. Remplacez le fichier dans : `mobile/android/app/google-services.json`

### Rebuild après remplacement :

```bash
cd mobile
npx cap sync android
cd android
./gradlew assembleDebug
```

## Configuration Backend

Le backend utilise Firebase Admin SDK pour envoyer les notifications. Assurez-vous que `route/src/main/resources/firebase-service-account.json` est valide.

## Test des notifications

1. **Connectez-vous** sur l'app mobile
2. **Acceptez** la permission de notification quand demandée
3. Le **FCM token** est automatiquement sauvegardé dans Firestore (collection "users")
4. Depuis le **dashboard web manager**, changez le statut d'un signalement
5. L'utilisateur mobile devrait **recevoir une notification**

## Debugging

Si les notifications ne fonctionnent pas :

1. Vérifiez les logs Android : `adb logcat | grep -i "fcm\|push\|notification"`
2. Vérifiez les logs backend : `docker logs projet_route-app-1 | grep -i "notification"`
3. Vérifiez Firestore : collection "users" → document avec l'email de l'utilisateur → champ "fcmToken"

## Permissions Android

Les permissions suivantes sont déjà configurées dans `AndroidManifest.xml` :
- `android.permission.POST_NOTIFICATIONS` (Android 13+)
- `android.permission.INTERNET`
