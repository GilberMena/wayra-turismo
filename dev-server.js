const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Autocargar funciones de la carpeta /api como rutas ANTES que los archivos estáticos
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
    fs.readdirSync(apiDir).forEach(file => {
        if (file.endsWith('.js')) {
            const routeName = `/api/${file.replace('.js', '')}`;
            let handler;
            try {
                const mod = require(path.join(apiDir, file));
                // Soportar module.exports = fn  Y  export default fn (si el archivo usa CommonJS)
                handler = typeof mod === 'function' ? mod : (mod.default || mod.handler);
            } catch (e) {
                console.warn(`⚠️  No se pudo cargar ${file} (puede usar ESM/export default): ${e.message}`);
                return; // saltar este archivo
            }
            if (typeof handler !== 'function') {
                console.warn(`⚠️  ${file} no exporta una función válida, ignorado.`);
                return;
            }

            // En Express 5, app.use() maneja todos los métodos HTTP (incluido POST)
            // y es más robusto que app.all() para serverless handlers
            app.use(routeName, async (req, res, next) => {
                console.log(`[API] ${req.method} ${routeName}`);
                // Express strip del prefijo en req.url al usar app.use; lo restauramos
                const origUrl = req.url;
                req.url = req.url === '/' ? '' : req.url;
                try {
                    await handler(req, res);
                } catch (err) {
                    console.error(`Error en ${routeName}:`, err);
                    req.url = origUrl;
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Internal Server Error' });
                    }
                }
            });
            console.log(`Ruta API registrada: ${routeName}`);
        }
    });
}

// Ruta para el admin-login (fallback si no se pide el archivo exacto)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Servir archivos estáticos DESPUÉS de las rutas API
app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`\n🚀 Servidor de desarrollo Wayra corriendo en:`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`\nEl login de admin ahora debería funcionar.\n`);
});
