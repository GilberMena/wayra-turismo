# Proyecto Laravel - Wayra

Este directorio contiene los archivos base para migrar tu sitio estático a una aplicación Laravel dinámica.

## ⚠️ Requisitos
Para ejecutar este código necesitas un servidor o entorno local con:
-   PHP >= 8.1
-   Composer
-   Base de datos (MySQL/MariaDB)

## 📁 Estructura Generada
-   `app/Models/Experience.php`: Modelo de datos.
-   `app/Http/Controllers/ExperienceController.php`: Lógica para mostrar y administrar experiencias.
-   `routes/web.php`: Rutas del sitio web.
-   `resources/views/`: Plantillas HTML (Blade) para el diseño del sitio.
-   `database/migrations/`: Archivo para crear la tabla de experiencias en la base de datos.

## 🚀 Pasos para Instalar (en servidor)
1.  Instala un proyecto nuevo de Laravel:
    ```bash
    composer create-project laravel/laravel wayra-app
    ```
2.  Copia estos archivos generados dentro de esa carpeta nueva, reemplazando los existentes.
3.  Configura tu base de datos en el archivo `.env`.
4.  Ejecuta las migraciones:
    ```bash
    php artisan migrate
    ```
5.  Inicia el servidor:
    ```bash
    php artisan serve
    ```

## Panel Administrativo
Para el panel administrativo, te recomiendo instalar **FilamentPHP** una vez tengas el proyecto corriendo:
```bash
composer require filament/filament:"^3.2" -W
php artisan filament:install --panels
```
Esto generará automáticamente un panel de login y administración para tus Experiencias.
