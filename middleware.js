import { NextResponse } from 'next/server';

/**
 * Vercel Middleware
 * Protege la ruta /admin interceptando las peticiones a nivel de Edge.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Solo protegemos las rutas de /admin
    if (pathname.startsWith('/admin')) {
        // Obtenemos el token esperado de las variables de entorno
        const EXPECTED_TOKEN = process.env.ADMIN_TOKEN;

        // Si no hay token configurado (ej en local), dejamos pasar para no bloquear
        if (!EXPECTED_TOKEN) {
            return NextResponse.next();
        }

        // Leemos la cookie
        const token = request.cookies.get('wayra_admin_token')?.value;

        // Si el token es correcto, permitimos el paso
        if (token === EXPECTED_TOKEN) {
            return NextResponse.next();
        }

        // Si no es correcto o no existe, redirigimos al login
        const loginUrl = new URL('/admin-login.html', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Opcional: Configurar para que solo corra en ciertas rutas para ahorrar ejecución
export const config = {
    matcher: ['/admin/:path*', '/admin'],
};
