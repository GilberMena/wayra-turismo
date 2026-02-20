/**
 * admin-verify.js — Netlify Serverless Function
 * Recibe usuario + contraseña, verifica contra variables de entorno,
 * y si es correcto setea la cookie de sesión segura.
 *
 * Variables de entorno requeridas en Netlify:
 *   ADMIN_USER      → nombre de usuario (ej: wayra_admin)
 *   ADMIN_PASS      → contraseña en texto (se compara con hash SHA-256)
 *   ADMIN_TOKEN     → token secreto largo (mismo que usa la edge function)
 *
 * Generar hash SHA-256: https://emn178.github.io/online-tools/sha256.html
 */

const crypto = require('crypto');

exports.handler = async function (event) {
    // Solo POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: 'Bad Request' };
    }

    const { username, password } = body;

    // Credenciales esperadas desde variables de entorno
    const EXPECTED_USER = process.env.ADMIN_USER ?? '';
    const EXPECTED_PASS = process.env.ADMIN_PASS ?? '';  // contraseña en texto plano (solo existe en servidor)
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';

    if (!EXPECTED_USER || !EXPECTED_PASS || !ADMIN_TOKEN) {
        console.error('[admin-verify] Variables de entorno no configuradas');
        return { statusCode: 500, body: 'Servidor no configurado' };
    }

    // Hash SHA-256 de la contraseña recibida
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    // Hash SHA-256 de la contraseña esperada (comparación timing-safe)
    const expectedHash = crypto.createHash('sha256').update(EXPECTED_PASS).digest('hex');

    const userOk = timingSafeEqual(username, EXPECTED_USER);
    const passOk = timingSafeEqual(inputHash, expectedHash);

    if (!userOk || !passOk) {
        // Añadimos un delay para dificultar fuerza bruta
        await sleep(500);
        return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, error: 'Credenciales incorrectas' })
        };
    }

    // ✅ Credenciales correctas → seteamos cookie segura (HttpOnly, Secure, SameSite)
    // La cookie expira en 8 horas
    const maxAge = 60 * 60 * 8;
    const cookie = `wayra_admin_token=${ADMIN_TOKEN}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookie
        },
        body: JSON.stringify({ ok: true })
    };
};

/** Comparación de strings en tiempo constante para evitar timing attacks */
function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // XOR igualmente para no filtrar longitud por tiempo
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
