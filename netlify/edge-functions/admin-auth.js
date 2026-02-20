/**
 * admin-auth.js — Netlify Edge Function
 * Intercepta todas las peticiones a /admin/* y /admin
 * Verifica la cookie `wayra_admin_token`.
 * Si no es válida → redirige a /admin-login.html
 *
 * IMPORTANTE: Cambia ADMIN_SECRET_TOKEN por una cadena aleatoria larga.
 * Puedes generarla en: https://generate-secret.vercel.app/64
 * Luego ponla también como variable de entorno en Netlify:
 *   Netlify Dashboard → Site Settings → Environment Variables → ADMIN_TOKEN
 */
export default async function handler(request, context) {
    // Obtiene el token secreto desde la variable de entorno
    const EXPECTED_TOKEN = Deno.env.get('ADMIN_TOKEN') ?? '';

    // Si no está configurada la variable de entorno, deja pasar (modo desarrollo)
    if (!EXPECTED_TOKEN) {
        return context.next();
    }

    // Permite el acceso a la página de login y a la función de verificación
    const url = new URL(request.url);
    if (
        url.pathname === '/admin-login.html' ||
        url.pathname.startsWith('/.netlify/functions/admin-verify')
    ) {
        return context.next();
    }

    // Lee la cookie de sesión
    const cookies = request.headers.get('cookie') ?? '';
    const tokenMatch = cookies.match(/wayra_admin_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';

    // Compara de forma segura (timing-safe sería ideal, pero Deno no tiene crypto.timingSafeEqual aún)
    if (token === EXPECTED_TOKEN) {
        // Token válido → continua normalmente
        return context.next();
    }

    // Token inválido o ausente → redirige al login
    const loginUrl = new URL('/admin-login.html', request.url);
    loginUrl.searchParams.set('next', url.pathname);
    return Response.redirect(loginUrl.toString(), 302);
}
