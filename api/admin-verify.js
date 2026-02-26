const crypto = require('crypto');

/**
 * api/admin-verify.js — Vercel Serverless Function
 */
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        const EXPECTED_USER = process.env.ADMIN_USER;
        const EXPECTED_PASS = process.env.ADMIN_PASS;
        const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

        if (!EXPECTED_USER || !EXPECTED_PASS || !ADMIN_TOKEN) {
            console.error('Variables de entorno no configuradas');
            return res.status(500).json({ error: 'Configuración de servidor incompleta' });
        }

        // Generar hashes
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        const expectedHash = crypto.createHash('sha256').update(EXPECTED_PASS).digest('hex');

        // Comparación segura (timing-safe)
        // Usamos una función auxiliar para evitar errores de longitud
        const safeCompare = (a, b) => {
            const bufA = Buffer.from(a);
            const bufB = Buffer.from(b);
            if (bufA.length !== bufB.length) return false;
            return crypto.timingSafeEqual(bufA, bufB);
        };

        const userOk = safeCompare(username, EXPECTED_USER);
        const passOk = safeCompare(inputHash, expectedHash);

        if (userOk && passOk) {
            const maxAge = 60 * 60 * 8;
            // Quitamos HttpOnly para que el panel de administración (Javascript) pueda detectar la sesión
            res.setHeader('Set-Cookie', `wayra_admin_token=${ADMIN_TOKEN}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Strict`);
            return res.status(200).json({ ok: true });
        } else {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Error interno' });
    }
};
