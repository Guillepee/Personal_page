# Sitio 100% estático: solo necesita un servidor web.
# nginx:alpine (~25 MB) sirve los archivos y resuelve bien los MIME types.
FROM nginx:alpine

# Copiamos solo lo que sirve el sitio (nada de .git, entornos locales, docs).
COPY index.html /usr/share/nginx/html/
COPY styles  /usr/share/nginx/html/styles
COPY scripts /usr/share/nginx/html/scripts
COPY data    /usr/share/nginx/html/data
COPY config  /usr/share/nginx/html/config
COPY assets  /usr/share/nginx/html/assets

EXPOSE 80

# Build:  docker build -t cv-web .
# Run:    docker run --rm -p 8080:80 cv-web   ->  http://localhost:8080
