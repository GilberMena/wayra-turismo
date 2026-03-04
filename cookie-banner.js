/**
 * WAYRA – Cookie Consent Banner
 * Agrega automáticamente un banner de cookies al DOM si el usuario
 * aún no ha dado su consentimiento. Cumple con políticas básicas de
 * privacidad (RGPD-like, Ley 1581/2012 Colombia).
 *
 * Uso: <script src="cookie-banner.js" defer></script> en todas las páginas.
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'wayra_cookie_consent';
  var consent = localStorage.getItem(CONSENT_KEY);
  if (consent) return; // Ya decidió

  // ─── ESTILOS ──────────────────────────────────────────────────────────────
  var css = `
    #wayra-cookie-banner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #0a2a1e;
      color: rgba(255,255,255,.9);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
      z-index: 9999;
      font-family: Montserrat, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      border-top: 2px solid rgba(127,255,212,.3);
      box-shadow: 0 -4px 24px rgba(0,0,0,.4);
      transform: translateY(100%);
      transition: transform .4s cubic-bezier(.34,1.2,.64,1);
    }
    #wayra-cookie-banner.visible {
      transform: translateY(0);
    }
    #wayra-cookie-banner .cb-text {
      flex: 1; min-width: 240px;
    }
    #wayra-cookie-banner .cb-text strong {
      color: #7fffd4; display: block; margin-bottom: 2px;
    }
    #wayra-cookie-banner .cb-text a {
      color: #7fffd4; text-decoration: underline;
    }
    #wayra-cookie-banner .cb-btns {
      display: flex; gap: 10px; flex-shrink: 0; align-items: center;
    }
    #wayra-cookie-banner .cb-accept {
      background: linear-gradient(135deg, #1a5040, #25a060);
      color: #fff; border: none; padding: 9px 22px; border-radius: 24px;
      font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap;
      font-family: Montserrat, sans-serif;
    }
    #wayra-cookie-banner .cb-reject {
      background: transparent;
      color: rgba(255,255,255,.6); border: 1.5px solid rgba(255,255,255,.3);
      padding: 8px 18px; border-radius: 24px;
      font-size: 12px; cursor: pointer; white-space: nowrap;
      font-family: Montserrat, sans-serif;
    }
    #wayra-cookie-banner .cb-accept:hover { filter: brightness(1.1); }
    #wayra-cookie-banner .cb-reject:hover { border-color: rgba(255,255,255,.6); color: #fff; }
    @media (max-width: 480px) {
      #wayra-cookie-banner { flex-direction: column; align-items: flex-start; }
      #wayra-cookie-banner .cb-btns { width: 100%; }
      #wayra-cookie-banner .cb-accept, #wayra-cookie-banner .cb-reject { flex: 1; text-align: center; }
    }
  `;

  // ─── INYECTAR ESTILOS ─────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ─── CREAR BANNER ─────────────────────────────────────────────────────────
  var banner = document.createElement('div');
  banner.id = 'wayra-cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.innerHTML = `
    <div class="cb-text">
      <strong>🍪 Usamos cookies</strong>
      Usamos cookies propias para mejorar tu experiencia y analizar el tráfico del sitio.
      Al continuar navegando, aceptas su uso según nuestra
      <a href="/politicas.html">Política de Privacidad</a>.
    </div>
    <div class="cb-btns">
      <button class="cb-reject" id="cb-reject-btn">Solo esenciales</button>
      <button class="cb-accept" id="cb-accept-btn">✅ Aceptar cookies</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Animar entrada
  setTimeout(function () {
    banner.classList.add('visible');
  }, 800);

  // ─── LÓGICA DE BOTONES ────────────────────────────────────────────────────
  document.getElementById('cb-accept-btn').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    hideBanner();
    // Aquí se pueden activar scripts de analytics posteriores
  });

  document.getElementById('cb-reject-btn').addEventListener('click', function () {
    localStorage.setItem(CONSENT_KEY, 'essential');
    hideBanner();
  });

  function hideBanner() {
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 400);
  }
})();
