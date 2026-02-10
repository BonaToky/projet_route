FROM maptiler/tileserver-gl:v5.5.0

# Copie la config
COPY config.json /data/config.json

# Copie les données MBTiles
COPY data/ /data/

# Copie les styles
COPY styles/ /data/styles/

EXPOSE 8080
CMD ["--config", "/data/config.json", "--verbose"]