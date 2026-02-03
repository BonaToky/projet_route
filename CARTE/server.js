const express = require('express');
const tilelive = require('@mapbox/tilelive');
const path = require('path');
require('@mapbox/tilelive-mapnik').registerProtocols(tilelive);
require('@mapbox/tilelive-vector').registerProtocols(tilelive);
require('@mapbox/tilelive-bridge').registerProtocols(tilelive);

const app = express();
const port = 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Charger le fichier MBTiles
const mbtilesPath = 'mbtiles://' + path.join(__dirname, 'osm-2020-02-10-v3.11_madagascar_antananarivo.mbtiles');

tilelive.load(mbtilesPath, (err, source) => {
  if (err) {
    console.error('Erreur lors du chargement du fichier MBTiles:', err);
    process.exit(1);
  }

  console.log('Source MBTiles chargée');

  app.get('/tiles/:z/:x/:y.png', (req, res) => {
    const z = parseInt(req.params.z);
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);

    // tilelive utilise XYZ directement, pas besoin de conversion
    source.getTile(z, x, y, (err, tile, headers) => {
      if (err) {
        console.log(`Tuile not found: ${z}/${x}/${y}`);
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