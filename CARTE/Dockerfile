# Utiliser une image Node.js légère
FROM node:18-alpine

# Installer mbtiles-server globalement
RUN npm install -g mbtiles-server

# Créer un répertoire de travail
WORKDIR /app

# Copier tous les fichiers du projet (y compris .mbtiles et index.html)
COPY . .

# Exposer le port 3000 (port par défaut de mbtiles-server)
EXPOSE 3000

# Commande pour lancer le serveur : servir les tuiles sur /tiles et les fichiers statiques sur /
CMD ["mbtiles-server", "--port", "3000", "--tiles", "/app/osm-2020-02-10-v3.11_madagascar_antananarivo.mbtiles", "--static", "/app"]