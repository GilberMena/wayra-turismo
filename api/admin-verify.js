const crypto = require('crypto');

/**
 * api/admin-verify.js — Vercel Serverless Function (Direct Export)
 */
module.exports = async (req, res) => {
    // Manejo de CORS si fuera necesario
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Solo se permite POST' });
    }

    try {
        const { username, password } = req.body;

        const EXPECTED_USER = process.env.ADMIN_USER;
        const EXPECTED_PASS = process.env.ADMIN_PASS;
        const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

        if (!EXPECTED_USER || !EXPECTED_PASS || !ADMIN_TOKEN) {
            return res.status(500).json({ error: 'Configuración faltante en el servidor' });
        }

        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        const expectedHash = crypto.createHash('sha256').update(EXPECTED_PASS).digest('hex');

        // Comparación segura
        const userOk = crypto.timingSafeEqual(Buffer.from(username), Buffer.from(EXPECTED_USER));
        const passOk = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(expectedHash));

        if (!userOk || !passOk) {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }

        // Seteo de cookie
        const maxAge = 60 * 60 * 8;
        res.setHeader('Set-Cookie', `wayra_admin_token=${ADMIN_TOKEN}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`);

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
