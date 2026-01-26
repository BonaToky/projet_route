FROM maptiler/tileserver-gl:v5.5.0

# Copie la config
COPY config.json /data/config.json

# Copie les données (si tu veux les inclure dans l'image)
COPY data/ /data/

# Copie les styles
COPY styles/ /data/styles/

# Copie les fonts (même vide)
COPY fonts/ /data/fonts/

EXPOSE 8080
CMD ["--config", "/data/config.json", "--verbose"]