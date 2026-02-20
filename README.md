# ViveWayra — Sitio estático inicial

Este repositorio contiene una página estática básica para la agencia WAYRA con estilo inspirado en la imagen de referencia.

Archivos creados:
- `index.html` — página principal.
- `styles.css` — estilos principales.
- `assets/logo.svg` — logo simple en SVG.

Cómo probar localmente:

1) Abrir `index.html` directamente (doble clic) en el navegador. Para evitar restricciones de CORS al cargar fuentes remotas, usa un servidor simple:

PowerShell (Windows):

```powershell
# Python 3
python -m http.server 8000
# luego abrir http://localhost:8000
```

Personalización rápida:
- Cambia las imágenes de fondo reemplazando los `background-image` de `.hero` o `.card-image` en `styles.css` o insertando una imagen en `assets/` y enlazándola.
- Actualiza textos y enlaces en `index.html`.

Reservas y pagos (configuración rápida)

Esta versión incluye un flujo de reserva híbrido: los usuarios pueden "Pagar ahora" (redirige a un Payment Link de Stripe si lo configuras) o "Reservar y confirmar por WhatsApp" para pactar el pago manualmente.

1) Crear Payment Links en Stripe (rápido):
	- Entra a tu Dashboard de Stripe → Products → Payment Links → Create Payment Link.
	- Crea un Payment Link por cada plan (ej.: Plan Explorador, Plan Fotógrafo, Nuquí Esencial...).
	- Copia la URL del Payment Link.
2) Pegar los enlaces en el proyecto:
	- Abre `script.js` y busca la constante `paymentLinks`.
	Pega las URLs en la propiedad correspondiente, usando la clave del plan:

```js
const paymentLinks = {
	'plan-explorador': { mercadopago: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=XXX', wompi: '' },
	'plan-fotografo': { mercadopago: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=YYY', wompi: '' },
	'plan-a-tu-medida': { mercadopago: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=ZZZ', wompi: '' },
	'nuqui-esencial': { mercadopago: '', wompi: 'server' },
	'nuqui-fotografico': { mercadopago: '', wompi: 'server' },
	'nuqui-a-tu-medida': { mercadopago: '', wompi: 'server' }
};
```

3) Prueba el flujo:
	- Levanta el servidor local y abre la página.
	- Haz click en 'Reservar' en cualquier plan → se abrirá el modal de reserva.
	- Completa tus datos y pulsa 'Pagar ahora' (si existe Payment Link) o 'Reservar y confirmar por WhatsApp' para enviar los datos por WhatsApp.

Nota: como alternativa a Payment Links podemos implementar Stripe Checkout dinámico (serverless) si deseas precios calculados por persona o extras. Si quieres, preparo esa migración tras validar con Payment Links.

Wompi (método serverless) — cómo integrar

Si prefieres Wompi (buena opción para Colombia) y necesitas generar pagos dinámicos (por número de personas o fechas), lo habitual es crear la transacción desde el servidor/serverless usando la API de Wompi. En este proyecto incluí un ejemplo de Netlify Function en `netlify/functions/create-wompi.js` que crea la transacción y devuelve la respuesta de Wompi (incluye `data.transaction.payment_url`).

Pasos rápidos para activar Wompi serverless:
1. Regístrate en Wompi y consigue tu Private Key (usa sandbox para pruebas).
2. Despliega la función serverless (ej. Netlify). Añade la variable de entorno `WOMPI_PRIVATE_KEY` con tu clave privada.
3. En `script.js` configura `paymentLinks[planId].wompi = 'server'` para que al pulsar el botón de Wompi el front llame a la función y reciba el `payment_url`.
4. La función crea la transacción en Wompi (sandbox o live) y devuelve el objeto JSON; el front redirige a `data.transaction.payment_url`.

Serverless para reservas (opcional, recomendado)
-----------------------------------------------
Si quieres que las reservas se almacenen centralmente y puedas verlas desde un panel de admin seguro, desplegar funciones serverless es la manera más directa. He incluido un ejemplo para Netlify que publica dos funciones en `netlify/functions/`:

- `create-reservation.js`: recibe POST con la reserva y la guarda en Airtable (si configuras las variables de entorno). Si no hay backend configurado devuelve un error informativo.
- `list-reservations.js`: lee desde Airtable y sirve las reservas para el panel de `admin.html`.

Cómo configurarlo (Netlify + Airtable — recomendado para empezar rápido):
1) Crea una base en Airtable con una tabla (por ejemplo `Reservas`) y campos: Plan, Precio, Nombre, Telefono, Email, Fecha Inicio, Fecha Fin, Personas, Comentarios.
2) En Netlify, en Site settings → Build & deploy → Environment, añade:
	- `AIRTABLE_API_KEY` = tu API Key de Airtable
	- `AIRTABLE_BASE` = el ID de la base (ej: appxxxxxx)
	- `AIRTABLE_TABLE` = el nombre de la tabla (por defecto `Reservas`)
3) Despliega el repo en Netlify (o haz `netlify deploy`). Las funciones quedarán disponibles en `/.netlify/functions/create-reservation` y `/.netlify/functions/list-reservations`.
4) En el frontend, el modal de reserva intentará enviar primero a Formspree si lo configuras; si no, intentará enviar a la función `create-reservation` y, en caso de error, hará fallback a `mailto:`.

Notas de seguridad y siguientes pasos:
- No incluyas tus claves en el frontend. Usa las variables de entorno de Netlify.
- El panel `admin.html` incluido en el repo intenta leer `/.netlify/functions/list-reservations` y si no está disponible usa `localStorage` como fallback. `admin.html` actualmente usa un prompt con contraseña solo para un acceso rápido de prueba — en producción usa Netlify Identity o Auth0 para proteger el panel.
- Si quieres, puedo ayudarte a desplegar esto en Netlify y a configurar Airtable paso a paso (creo las variables de entorno junto a la función y pruebo el flujo completo en sandbox).

Si quieres, puedo ayudarte a desplegar la función en Netlify y probar el flujo completo.
Siguientes pasos sugeridos:
- Añadir imágenes reales en `assets/` y mejorar contraste/alt.
- Añadir animaciones suaves y optimizar para SEO.
- Conectar el formulario a un endpoint o servicio (Netlify Forms, Formspree o backend propio).

Si quieres, puedo:
- integrar las imágenes de tu diseño (si las subes),
- convertirlo en un pequeño sitio con navegación y secciones dinámicas (React/Vue),
- o preparar una versión lista para desplegar en Netlify/GitHub Pages.

Dime qué prefieres y sigo con ello.

Mejoras añadidas en esta versión
- Meta tags (title y description) y Open Graph para mejorar cómo se comparte la web en redes sociales.
- JSON-LD (schema.org) con datos básicos de la agencia para mejorar resultados enriquecidos.
- Favicon (`assets/favicon.svg`).
- Botones y modales funcionales que lanzan WhatsApp con mensajes prellenados (tu número: +57 322 522 5582).

Opciones recomendadas (puedo implementarlas):
- Integrar Formspree o Netlify Forms para recibir mensajes desde el formulario sin abrir el cliente de correo.
- Reemplazar los SVG placeholders por tus fotos y optimizarlas (webp/jpg responsivo).
- Añadir sección de testimonios y galería con lightbox.
- Preparar deploy automático en Netlify o GitHub Pages (te puedo crear el repo y el workflow).

Cómo habilitar Formspree (rápido):
1. Registra una cuenta en https://formspree.io y crea un formulario. Formspree te dará un endpoint con forma `https://formspree.io/f/xyz...`.
2. Abre `index.html` y en el `<form class="contact-form">` cambia `action="#"` por `action="https://formspree.io/f/ID_DE_TU_FORM"` y `method="POST"`.
3. (Opcional) Añade un campo oculto con `name="_replyto"` para el email y `name="_subject"` para personalizar el asunto.

Habilitar Formspree para las reservas (modal)
-------------------------------------------
Si quieres que las reservas hechas desde el modal se guarden automáticamente sin abrir el cliente de correo, configura Formspree y pega el endpoint en el archivo `script.js`.

1) Entra a https://formspree.io y crea un formulario; copia el endpoint con forma `https://formspree.io/f/xxxxxx`.
2) Abre `script.js` y localiza la constante `formspreeEndpoint` (cerca de `paymentLinks`) y pega tu URL entre las comillas:

```js
const formspreeEndpoint = 'https://formspree.io/f/XXXXXX';
```

3) Ahora, cuando el cliente complete el modal de reserva y pulse "Reservar" el front intentará enviar los datos al endpoint de Formspree. Si la petición funciona recibirás una confirmación en pantalla. Si no hay endpoint configurado, el form usará `mailto:` como fallback.

Notas rápidas:
- Formspree acepta JSON (la implementación actual envía JSON y espera `application/json`).
- Revisa el panel de Formspree para ver las entradas recibidas y configurar notificaciones por correo.

Deploy rápido en Netlify (recomendado):
- Conecta el repositorio a Netlify, y en `Build settings` pon `Build command` vacío (sitio estático) y `Publish directory` a la raíz del proyecto. Netlify detectará formularios si usas `netlify` attributes.

Siguiente paso sugerido:
- ¿Quieres que reemplace los SVG placeholders por tus fotos y que active Formspree (si me das el ID)?
- ¿O prefieres que prepare el deploy en Netlify/GitHub Pages ahora?

Actualizar el logo con la imagen adjunta
--------------------------------------

Si quieres que el sitio se vea exactamente como el segundo mockup que adjuntaste, coloca la imagen que me enviaste en la carpeta `assets/` con el nombre `logo.png`.

Pasos:

1. Guarda la imagen adjunta como `assets/img/logo.png` en el proyecto (reemplaza si existe).
2. He actualizado las cabeceras para usar `assets/img/logo.png` y centrar el logo en la cabecera. Verifica en `index.html`, `plans-nuqui.html` y `detail.html` que el `img` apunta a `assets/img/logo.png`.
3. Sirve el sitio localmente y confirma la apariencia (puede que necesites ajustar el recorte de la imagen si el peso vertical es mayor).

Si prefieres, puedo:
- redimensionarla automáticamente y crear versiones `logo@2x.png` y `logo-small.png` para mejorar responsividad (necesito que subas la imagen o me des permiso para generar archivos),
- o convertirla a SVG (si la imagen original es vectorial) para mejor nitidez.


Confirmaciones por correo (SendGrid)
----------------------------------

Si quieres que las reservas generen automáticamente un correo de confirmación al cliente y una notificación al administrador, puedes usar SendGrid. He añadido una función serverless `netlify/functions/send-confirmation.js` que envía el email cuando se le hace POST con los datos de la reserva.

Variables de entorno necesarias en Netlify:

- `SENDGRID_API_KEY` = tu API Key de SendGrid (v3)
- `FROM_EMAIL` = email remitente (ej.: reservas@tuagencia.co)
- `ADMIN_EMAIL` = (opcional) email donde recibir notificaciones internas

Cómo funciona en el flujo actual:

- Al enviar la reserva a `/.netlify/functions/create-reservation`, la función intentará guardar la reserva en Airtable.
- Después de crear el registro en Airtable la función intentará llamar a `/.netlify/functions/send-confirmation` si tu variable `SITE_URL` está configurada con la URL pública del sitio (por ejemplo `https://tu-sitio.netlify.app`).
- Si no proporcionas `SITE_URL` pero sí `SENDGRID_API_KEY` y `FROM_EMAIL`, `create-reservation` enviará el correo directamente como fallback.

Pasos para activar:

1. Añade en Netlify las variables de entorno: `AIRTABLE_API_KEY`, `AIRTABLE_BASE`, `AIRTABLE_TABLE`, `SENDGRID_API_KEY`, `FROM_EMAIL` y `ADMIN_EMAIL` (opcional).
2. Despliega el repositorio en Netlify.
3. Opcional: configura `SITE_URL` en las variables de entorno con la URL pública (p.ej. `https://mi-sitio.netlify.app`) para que `create-reservation` invoque específicamente la función `send-confirmation`.

Con esto, cuando un usuario haga una reserva recibirán un email automático y tú recibirás la notificación interna con los detalles.