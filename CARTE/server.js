const express = require('express');
const MBTiles = require('@mapbox/mbtiles');
const path = require('path');

const app = express();
const port = 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Servir les tuiles depuis le fichier MBTiles
const mbtilesPath = path.join(__dirname, 'osm-2020-02-10-v3.11_madagascar_antananarivo.mbtiles');

new MBTiles(mbtilesPath, (err, mbtiles) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture du fichier MBTiles:', err);
    process.exit(1);
  }

  app.get('/tiles/:z/:x/:y.png', (req, res) => {
    const z = parseInt(req.params.z);
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);

    mbtiles.getTile(z, x, y, (err, tile, headers) => {
      if (err) {
        res.status(404).send('Tile not found');
      } else {
        res.set(headers);
        res.send(tile);
      }
    });
  });

  app.listen(port, () => {
    console.log(`Serveur de cartes en cours d'exécution sur le port ${port}`);
  });
});