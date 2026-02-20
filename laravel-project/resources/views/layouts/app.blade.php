<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>@yield('title', 'WAYRA — ViveWayra')</title>
    <!-- CSS currently linked relatively, in Lara project should be asset() -->
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a class="logo" href="{{ route('home') }}">
                <img src="{{ asset('img/logo.png') }}" alt="Wayra logo">
            </a>

            <nav class="main-nav">
                <a href="{{ route('home') }}#sobre-wayra">Sobre WAYRA</a>
                <a href="{{ route('experiences.index') }}">Experiencias</a>
                <a href="{{ route('plans') }}">Plan temporada de ballenas</a>
                <a href="{{ route('home') }}#contacto">Contacto</a>
            </nav>
            
            <!-- Actions (Social, WhatsApp) -->
            <div class="header-actions">
                <a href="#" class="btn-whatsapp">WhatsApp</a>
            </div>
        </div>
    </header>

    <main>
        @yield('content')
    </main>

    <footer class="site-footer">
        <div class="container footer-inner">
            <small>&copy; {{ date('Y') }} WAYRA.</small>
        </div>
    </footer>

    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>
