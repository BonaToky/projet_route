# Guide de Test - Notifications Push FCM

## Fonctionnalité
Lorsqu'un manager met à jour le statut d'un signalement (nouveau → en cours → terminé), l'utilisateur mobile qui a créé ce signalement reçoit une notification push.

## Prérequis

### 1. Configuration Firebase (déjà fait)
- ✅ google-services.json présent dans `mobile/android/app/`
- ✅ Firebase Admin SDK configuré dans le backend
- ✅ Plugin @capacitor/push-notifications installé

### 2. Permissions Android (configurées)
- ✅ POST_NOTIFICATIONS dans AndroidManifest.xml

## Processus de Notification

### Étape 1 : Connexion et Enregistrement FCM

1. **Ouvrir l'application mobile** (Android Studio ou téléphone réel)
2. **Se connecter avec un compte utilisateur**
   - L'application demande automatiquement la permission de notification
   - **IMPORTANT** : Accepter la permission
3. **Token FCM enregistré** :
   - Le token est automatiquement sauvegardé dans Firestore
   - Collection : `users`
   - Document : `[userId]`
   - Champ : `fcmToken`

### Étape 2 : Créer un Signalement

1. Dans l'onglet **Carte** du mobile
2. Cliquer sur la carte pour créer un signalement
3. Remplir le formulaire (type, description, surface)
4. Soumettre le signalement
5. Cliquer sur le bouton **SYNC** pour synchroniser avec le backend

### Étape 3 : Mettre à Jour le Statut (Manager Web)

1. **Ouvrir le module web gestionnaire** : `http://localhost:5173/`
2. **Se connecter** en tant que manager
3. **Aller dans Dashboard** ou la liste des signalements
4. **Trouver le signalement créé** depuis le mobile
5. **Changer le statut** :
   - `nouveau` → `en cours` → `terminé`
6. **Sauvegarder**

### Étape 4 : Recevoir la Notification

**Scénario A : Application au premier plan**
- ✅ Une alerte JavaScript s'affiche avec le titre et le message
- Format : `📢 Mise à jour de votre signalement\nLe statut est passé de 'Nouveau' à 'En cours'`

**Scénario B : Application en arrière-plan ou fermée**
- ✅ Notification dans la barre de notifications Android
- 🔔 Son de notification par défaut
- Cliquer sur la notification ouvre l'application

## Vérification des Logs

### Logs Backend (Docker)
```powershell
docker logs -f projet_route-app-1
```

Recherchez :
```
Notification envoyée avec succès: projects/[projet-id]/messages/[message-id]
```

Ou erreurs :
```
Erreur lors de l'envoi de la notification: [détails]
Token FCM non trouvé pour l'utilisateur: [userId]
```

### Logs Mobile (Android Studio)
```
Logcat → Filtre : "FCM"
```

Recherchez :
```
FCM Token: [long-token-string]
Token sauvegardé dans Firestore
Notification reçue: [notification-data]
```

## Vérification Firestore (Firebase Console)

1. **Ouvrir Firebase Console** → Firestore Database
2. **Collection `users`**
3. **Trouver votre document utilisateur**
4. **Vérifier les champs** :
   ```
   fcmToken: "cABC123...xyz" (long token)
   lastTokenUpdate: Timestamp
   ```

## Dépannage

### ❌ "Permission de notification refusée"

**Solution :**
1. Ouvrir les paramètres Android
2. Applications → [Votre App]
3. Notifications → Activer
4. Redémarrer l'application

### ❌ "Token FCM non trouvé"

**Causes possibles :**
1. L'utilisateur n'a pas accepté les permissions
2. Le token n'a pas été sauvegardé dans Firestore
3. Le userId dans PostgreSQL ne correspond pas au document Firestore

**Solution :**
1. Se déconnecter et se reconnecter
2. Vérifier dans Firebase Console que le token existe
3. Vérifier que `Id_User` dans le signalement correspond au document Firestore

### ❌ "Erreur Firebase Messaging"

**Causes possibles :**
1. google-services.json incorrect
2. Token expiré ou invalide
3. Problème de configuration Firebase

**Solution :**
```powershell
# Vérifier les logs backend
docker logs projet_route-app-1 | Select-String "Firebase"

# Vérifier que Firebase Admin est bien initialisé
docker logs projet_route-app-1 | Select-String "FirebaseApp"
```

### ❌ La notification n'arrive pas

**Checklist :**
- [ ] Le mobile est bien connecté à Internet
- [ ] Le backend est démarré (docker ps)
- [ ] La permission de notification est acceptée
- [ ] Le token FCM est sauvegardé dans Firestore
- [ ] Le statut a bien été changé dans le web
- [ ] Le userId dans le signalement est correct

## Test Rapide

### Script de Test Complet

1. **Mobile :**
   ```
   1. Se connecter (userId: abc123)
   2. Accepter la permission de notification
   3. Créer un signalement
   4. Cliquer sur SYNC
   ```

2. **Vérifier Firestore :**
   ```
   users/abc123 → fcmToken existe ?
   signalements/xyz789 → Id_User = "abc123" ?
   ```

3. **Web :**
   ```
   1. Se connecter en tant que manager
   2. Trouver le signalement xyz789
   3. Changer statut : "nouveau" → "en cours"
   4. Sauvegarder
   ```

4. **Vérifier Mobile :**
   ```
   ✅ Notification reçue ?
   ✅ Message correct ?
   ```

## Format des Notifications

### Notification Android
```
┌─────────────────────────────────────┐
│ 🔵 [Nom de l'App]                    │
│ Mise à jour de votre signalement    │
│ Le statut est passé de 'Nouveau'    │
│ à 'En cours'                         │
│                                      │
│ [Il y a 2 minutes]                   │
└─────────────────────────────────────┘
```

### Données de la Notification
```json
{
  "title": "Mise à jour de votre signalement",
  "body": "Le statut est passé de 'Nouveau' à 'En cours'",
  "data": {
    "signalementId": "xyz789",
    "oldStatus": "nouveau",
    "newStatus": "en cours",
    "type": "status_update"
  }
}
```

## Évolution Future

### Améliorations possibles :
1. **Canal de notification personnalisé** :
   - Notifications avec son différent selon l'urgence
   - Icône personnalisée selon le type de problème

2. **Navigation automatique** :
   - Cliquer sur la notification ouvre directement le signalement sur la carte

3. **Historique des notifications** :
   - Page dédiée aux notifications reçues
   - Badge avec nombre de notifications non lues

4. **Notifications riches** :
   - Image du signalement dans la notification
   - Actions rapides (Voir, Ignorer)

5. **Notifications multiples** :
   - Notification quand un travail commence
   - Notification à 50% d'avancement
   - Notification à la fin des travaux
   - Notification si un commentaire est ajouté
