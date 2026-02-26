const crypto = require('crypto');

/**
 * api/admin-verify.js — Vercel Serverless Function
 */
module.exports = async function handler(req, res) {
    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    // Credenciales esperadas desde variables de entorno
    const EXPECTED_USER = process.env.ADMIN_USER;
    const EXPECTED_PASS = process.env.ADMIN_PASS;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!EXPECTED_USER || !EXPECTED_PASS || !ADMIN_TOKEN) {
        console.error('[admin-verify] Variables de entorno no configuradas');
        return res.status(500).json({ error: 'Servidor no configurado' });
    }

    // Hash SHA-256 de la contraseña recibida
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    // Hash SHA-256 de la contraseña esperada
    const expectedHash = crypto.createHash('sha256').update(EXPECTED_PASS).digest('hex');

    const userOk = timingSafeEqual(username, EXPECTED_USER);
    const passOk = timingSafeEqual(inputHash, expectedHash);

    if (!userOk || !passOk) {
        // Delay para seguridad
        await new Promise(resolve => setTimeout(resolve, 500));
        return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
    }

    // ✅ Credenciales correctas -> Seteamos cookie
    // En Vercel pasamos la cookie en el header
    const maxAge = 60 * 60 * 8;
    res.setHeader('Set-Cookie', `wayra_admin_token=${ADMIN_TOKEN}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`);

    return res.status(200).json({ ok: true });
}

function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}
