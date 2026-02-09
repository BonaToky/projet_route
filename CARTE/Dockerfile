FROM maptiler/tileserver-gl:v5.5.0

COPY data/ /data/
COPY styles/ /data/styles/
COPY fonts/ /data/fonts/
COPY config.json /data/config.json

EXPOSE 8080
CMD ["tileserver-gl", "--config", "/data/config.json", "--verbose"]

# # Utiliser tileserver-gl pour servir les tuiles vectorielles
# FROM maptiler/tileserver-gl

# # Copier les fichiers MBTiles, config et styles
# COPY osm-2020-02-10-v3.11_madagascar_antananarivo.mbtiles /data/
# COPY config.json /data/
# COPY styles/ /data/styles/
