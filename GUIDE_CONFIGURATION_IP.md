# Guide de Configuration IP - Application Mobile

## Problème "Failed to fetch"

Si vous voyez l'erreur "Failed to fetch" dans votre téléphone, cela signifie que l'application ne peut pas se connecter au serveur backend.

## Solution : Configurer l'IP correctement

### 1. Trouver l'adresse IP de votre PC

**Sur Windows :**
1. Ouvrir PowerShell ou CMD
2. Taper : `ipconfig`
3. Chercher la section **"Wireless LAN adapter Wi-Fi"** ou **"Ethernet adapter"**
4. Copier l'adresse **IPv4** (ex: 192.168.88.23)

**IMPORTANT :** 
- ❌ Ne PAS utiliser `127.0.0.1` ou `localhost` (ça marche seulement sur le PC)
- ✅ Utiliser l'adresse IP locale (commence par 192.168.x.x ou 10.x.x.x)

### 2. Configurer l'IP dans l'application mobile

#### Option A : Page de Configuration (RECOMMANDÉ)

1. **Dans l'écran de login :**
   - Cliquer sur l'icône ⚙️ (Paramètres) en haut à droite

2. **Dans l'écran de carte :**
   - Cliquer sur l'icône ⚙️ (Paramètres) à gauche du bouton Sync

3. **Dans la page Paramètres :**
   - Entrer uniquement l'adresse IP : `192.168.88.23` (sans http://)
   - Cliquer sur "Test Connection"
   - Si ça affiche "Connexion réussie ✓", cliquer sur "Save Settings"
   - Fermer l'application complètement et la rouvrir

#### Option B : Modification du code (ancien)

Dans `mobile/src/config/api.ts`, modifier :
```typescript
export const getApiBaseUrl = (): string => {
  const savedIp = localStorage.getItem('api_server_ip');
  if (savedIp) {
    return `http://${savedIp}:8080/api`;
  }
  return 'http://192.168.88.23:8080/api'; // Changer ici si nécessaire
};
```

### 3. Vérifier que le serveur backend est démarré

```powershell
# Dans c:\xampp\htdocs\S5\Mr_Rojo\projet_route
docker-compose up -d
```

Vérifier que le serveur répond :
- Ouvrir un navigateur sur le PC
- Aller à : `http://localhost:8080/api/auth/params`
- Doit afficher : `{"max_attempts":3,"block_duration":60}`

### 4. Vérifier le pare-feu Windows

Si la connexion échoue toujours :

1. Ouvrir **Pare-feu Windows Defender**
2. Cliquer sur **"Paramètres avancés"**
3. Cliquer sur **"Règles de trafic entrant"**
4. Cliquer sur **"Nouvelle règle..."**
5. Choisir **"Port"**
6. Choisir **"TCP"** et entrer **8080**
7. Choisir **"Autoriser la connexion"**
8. Appliquer à tous les profils
9. Nommer : "Spring Boot API"

### 5. S'assurer que PC et téléphone sont sur le même réseau WiFi

- Le PC et le téléphone DOIVENT être connectés au MÊME réseau WiFi
- Vérifier dans les paramètres WiFi du téléphone

## Utilisation du bouton Refresh

Une fois l'IP configurée correctement, vous pouvez :

1. **Dans la carte des signalements :**
   - Cliquer sur l'icône 🔄 (Refresh) pour recharger les signalements
   - Plus besoin de fermer/rouvrir l'application

## Tests de connexion

### Test simple depuis le téléphone :

1. Ouvrir le navigateur du téléphone
2. Aller à : `http://192.168.88.23:8080/api/auth/params`
3. Si vous voyez le JSON avec `max_attempts`, la connexion fonctionne
4. Si erreur "impossible d'accéder au site", vérifier :
   - Le WiFi (même réseau ?)
   - Le pare-feu Windows
   - Le serveur backend (démarré ?)

### Test de création de signalement avec photos :

1. Se connecter dans l'application
2. Aller dans l'onglet Carte
3. Cliquer sur la carte pour ajouter un signalement
4. Remplir le formulaire
5. Cliquer sur 📷 pour prendre une photo ou 🖼️ pour sélectionner une photo
6. Soumettre le signalement
7. Vérifier dans le module web visiteur que :
   - Le signalement apparaît sur la carte
   - En cliquant sur le marqueur, les photos s'affichent
   - On peut cliquer sur les photos pour les agrandir

## Dépannage

### "Failed to fetch" persiste après configuration

1. Vérifier que l'IP est correcte (pas de typo)
2. Tester la connexion avec le bouton "Test Connection"
3. Fermer COMPLÈTEMENT l'application (pas seulement minimiser)
4. Rouvrir l'application
5. Si ça ne marche toujours pas, redémarrer le téléphone

### Les photos ne s'affichent pas dans le web

1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs dans l'onglet Console
3. Vérifier que Firestore contient bien les photos :
   - Aller sur Firebase Console
   - Ouvrir la collection `signalements`
   - Vérifier qu'il y a un champ `photos` de type Array
   - Chaque photo doit commencer par `data:image/jpeg;base64,`

### Le serveur ne répond pas

```powershell
# Vérifier que les conteneurs Docker sont actifs
docker ps

# Si pas de conteneur "route", les démarrer
cd c:\xampp\htdocs\S5\Mr_Rojo\projet_route
docker-compose up -d

# Vérifier les logs
docker logs projet_route-backend-1
```

## Architecture réseau

```
[Téléphone] --WiFi--> [Routeur WiFi] --Ethernet/WiFi--> [PC]
    📱                     🌐                               💻
    App Mobile           192.168.88.1              192.168.88.23:8080
                                                    Backend Spring Boot
```

Pour que ça fonctionne :
1. Téléphone connecté au WiFi du routeur
2. PC connecté au même routeur (Ethernet ou WiFi)
3. Application configurée avec l'IP du PC (192.168.88.23)
4. Backend démarré sur le PC (port 8080)
5. Pare-feu Windows autorise le port 8080
