Sube todo el contenido de esta carpeta a public_html en Hostinger.

Incluye:
- sitio publico
- assets
- data
- admin
- admin-login.html
- reservas-admin.html
- robots.txt
- sitemap.xml
- .htaccess

No incluye:
- api
- netlify
- node_modules

Nota:
El frontend ahora esta preparado para consumir el backend remoto en Vercel.
Para que reservas, contacto, analytics y admin funcionen:
- debes publicar tambien los cambios del directorio api/ en Vercel
- y resubir este paquete actualizado a Hostinger
