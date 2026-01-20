# Utiliser une image Node.js légère
FROM node:18-alpine

# Créer un répertoire de travail
WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tous les fichiers du projet
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Commande pour lancer le serveur
CMD ["node", "server.js"]