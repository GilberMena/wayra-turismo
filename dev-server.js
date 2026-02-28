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

// Servir archivos estáticos
app.use(express.static(__dirname));

// Autocargar funciones de la carpeta /api como rutas
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
    fs.readdirSync(apiDir).forEach(file => {
        if (file.endsWith('.js')) {
            const routeName = `/api/${file.replace('.js', '')}`;
            const handler = require(path.join(apiDir, file));

            app.all(routeName, async (req, res) => {
                console.log(`${req.method} ${req.url}`);
                try {
                    // Adaptar req/res para que funcionen como en Vercel si es necesario
                    // (Vercel extiende req.body, req.query, res.status, res.json)
                    // Express ya provee la mayoría de estos.
                    await handler(req, res);
                } catch (err) {
                    console.error(`Error en ${routeName}:`, err);
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

app.listen(port, () => {
    console.log(`\n🚀 Servidor de desarrollo Wayra corriendo en:`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`\nEl login de admin ahora debería funcionar.\n`);
});
