/**
 * WAYRA — Cookie Consent Banner
 * Banner moderno y amigable. Guarda el consentimiento en localStorage y
 * notifica cambios con el evento `WAYRA:cookie-consent`.
 *
 * Uso: <script src="cookie-banner.js" defer></script> en todas las páginas.
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'wayra_cookie_consent';
  if (readConsent()) return; // Ya decidió

  var css = `
    :root {
      --WAYRA-cb-bg: rgba(255, 255, 255, 0.92);
      --WAYRA-cb-text: #0f172a;
      --WAYRA-cb-muted: rgba(15, 23, 42, 0.72);
      --WAYRA-cb-border: rgba(15, 23, 42, 0.12);
      --WAYRA-cb-shadow: 0 18px 60px rgba(2, 8, 23, 0.25);
      --WAYRA-cb-primary: #16a34a;
      --WAYRA-cb-primary2: #22c55e;
    }

    #WAYRA-cookie-banner {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      max-width: 720px;
      margin: 0 auto;
      background: var(--WAYRA-cb-bg);
      color: var(--WAYRA-cb-text);
      border: 1px solid var(--WAYRA-cb-border);
      border-radius: 18px;
      box-shadow: var(--WAYRA-cb-shadow);
      z-index: 9999;
      font-family: Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      overflow: hidden;

      transform: translateY(24px);
      opacity: 0;
      transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 260ms ease;
    }
    #WAYRA-cookie-banner.visible {
      transform: translateY(0);
      opacity: 1;
    }

    #WAYRA-cookie-banner .cb-inner {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 14px;
      padding: 16px 16px 14px 16px;
      align-items: start;
    }
    #WAYRA-cookie-banner .cb-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
      font-size: 14px;
      line-height: 1.1;
    }
    #WAYRA-cookie-banner .cb-desc {
      margin: 0;
      font-size: 13px;
      line-height: 1.45;
      color: var(--WAYRA-cb-muted);
    }
    #WAYRA-cookie-banner .cb-links {
      margin-top: 8px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    #WAYRA-cookie-banner a.cb-link {
      color: rgba(3, 105, 161, 0.95);
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
    }
    #WAYRA-cookie-banner a.cb-link:hover { text-decoration: underline; }

    #WAYRA-cookie-banner .cb-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      padding-top: 2px;
    }
    #WAYRA-cookie-banner button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 800;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      font-family: inherit;
    }
    #WAYRA-cookie-banner button.cb-primary {
      color: #fff;
      background: linear-gradient(135deg, var(--WAYRA-cb-primary), var(--WAYRA-cb-primary2));
      box-shadow: 0 10px 24px rgba(34, 197, 94, 0.22);
    }
    #WAYRA-cookie-banner button.cb-secondary {
      color: rgba(15, 23, 42, 0.92);
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(15, 23, 42, 0.16);
    }
    #WAYRA-cookie-banner button.cb-tertiary {
      color: rgba(15, 23, 42, 0.78);
      background: transparent;
      padding-left: 10px;
      padding-right: 10px;
    }

    #WAYRA-cookie-banner button.cb-primary:hover { filter: brightness(1.03); }
    #WAYRA-cookie-banner button.cb-secondary:hover { background: rgba(255, 255, 255, 0.72); }
    #WAYRA-cookie-banner button.cb-tertiary:hover { text-decoration: underline; }

    #WAYRA-cookie-banner button:focus-visible,
    #WAYRA-cookie-banner a:focus-visible,
    #WAYRA-cookie-banner input:focus-visible {
      outline: 3px solid rgba(22, 163, 74, 0.38);
      outline-offset: 2px;
    }

    #WAYRA-cookie-banner .cb-prefs {
      border-top: 1px solid rgba(15, 23, 42, 0.08);
      padding: 12px 16px 14px 16px;
      display: none;
      background: rgba(255, 255, 255, 0.55);
    }
    #WAYRA-cookie-banner.prefs-open .cb-prefs { display: block; }

    #WAYRA-cookie-banner .cb-prefs h4 {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.92);
    }
    #WAYRA-cookie-banner .cb-prefs .cb-opt {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      align-items: start;
      padding: 10px 0;
    }
    #WAYRA-cookie-banner .cb-prefs .cb-opt + .cb-opt {
      border-top: 1px solid rgba(15, 23, 42, 0.08);
    }
    #WAYRA-cookie-banner .cb-prefs .cb-opt label {
      font-weight: 900;
      font-size: 13px;
      color: rgba(15, 23, 42, 0.92);
      cursor: pointer;
    }
    #WAYRA-cookie-banner .cb-prefs .cb-opt p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: var(--WAYRA-cb-muted);
      line-height: 1.4;
    }
    #WAYRA-cookie-banner .cb-prefs .cb-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 560px) {
      #WAYRA-cookie-banner .cb-inner { grid-template-columns: 1fr; }
      #WAYRA-cookie-banner .cb-actions { justify-content: flex-start; }
      #WAYRA-cookie-banner button { width: 100%; justify-content: center; }
      #WAYRA-cookie-banner button.cb-tertiary { width: auto; }
    }

    @media (prefers-reduced-motion: reduce) {
      #WAYRA-cookie-banner { transition: none; }
    }
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var banner = document.createElement('section');
  banner.id = 'WAYRA-cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'true');
  banner.setAttribute('aria-labelledby', 'WAYRA-cb-title');
  banner.setAttribute('aria-describedby', 'WAYRA-cb-desc');
  banner.innerHTML = `
    <div class="cb-inner">
      <div class="cb-content">
        <div class="cb-title" id="WAYRA-cb-title">
          <span aria-hidden="true">🍪</span>
          Tu privacidad, primero
        </div>
        <p class="cb-desc" id="WAYRA-cb-desc">
          Usamos cookies esenciales para que el sitio funcione. Con tu permiso, también usamos cookies de analítica para entender qué funciona mejor y mejorar tu experiencia.
        </p>
        <div class="cb-links">
          <a class="cb-link" href="/politicas.html">Ver política</a>
        </div>
      </div>
      <div class="cb-actions" aria-label="Opciones de cookies">
        <button class="cb-secondary" type="button" id="cb-essential-btn">Solo esenciales</button>
        <button class="cb-primary" type="button" id="cb-accept-btn">Aceptar</button>
        <button class="cb-tertiary" type="button" id="cb-prefs-btn" aria-expanded="false" aria-controls="WAYRA-cb-prefs">Preferencias</button>
      </div>
    </div>

    <div class="cb-prefs" id="WAYRA-cb-prefs" aria-label="Preferencias de cookies">
      <h4>Preferencias</h4>

      <div class="cb-opt">
        <input type="checkbox" id="cb-opt-essential" checked disabled aria-describedby="cb-opt-essential-desc" />
        <div>
          <label for="cb-opt-essential">Esenciales</label>
          <p id="cb-opt-essential-desc">Necesarias para el funcionamiento del sitio (no se pueden desactivar).</p>
        </div>
      </div>

      <div class="cb-opt">
        <input type="checkbox" id="cb-opt-analytics" aria-describedby="cb-opt-analytics-desc" />
        <div>
          <label for="cb-opt-analytics">Analítica</label>
          <p id="cb-opt-analytics-desc">Nos ayuda a medir visitas y mejorar el contenido. Solo si nos das permiso.</p>
        </div>
      </div>

      <div class="cb-footer">
        <button class="cb-secondary" type="button" id="cb-save-essential-btn">Guardar solo esenciales</button>
        <button class="cb-primary" type="button" id="cb-save-btn">Guardar preferencias</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  setTimeout(function () {
    banner.classList.add('visible');
  }, 250);

  var acceptBtn = document.getElementById('cb-accept-btn');
  var essentialBtn = document.getElementById('cb-essential-btn');
  var prefsBtn = document.getElementById('cb-prefs-btn');
  var analyticsOpt = document.getElementById('cb-opt-analytics');
  var saveBtn = document.getElementById('cb-save-btn');
  var saveEssentialBtn = document.getElementById('cb-save-essential-btn');

  analyticsOpt.checked = false; // analítica apagada por defecto

  acceptBtn.addEventListener('click', function () {
    writeConsent({ analytics: true });
    hideBanner();
  });

  essentialBtn.addEventListener('click', function () {
    writeConsent({ analytics: false });
    hideBanner();
  });

  prefsBtn.addEventListener('click', function () {
    var open = banner.classList.toggle('prefs-open');
    prefsBtn.setAttribute('aria-expanded', String(open));
    if (open) analyticsOpt.focus();
  });

  saveBtn.addEventListener('click', function () {
    writeConsent({ analytics: !!analyticsOpt.checked });
    hideBanner();
  });

  saveEssentialBtn.addEventListener('click', function () {
    writeConsent({ analytics: false });
    hideBanner();
  });

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      if (raw === 'accepted') return { analytics: true, legacy: true };
      if (raw === 'essential') return { analytics: false, legacy: true };
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.analytics !== 'boolean') return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(consent) {
    var payload = {
      v: 1,
      analytics: !!consent.analytics,
      ts: new Date().toISOString()
    };

    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    } catch (e) {
      try {
        localStorage.setItem(CONSENT_KEY, payload.analytics ? 'accepted' : 'essential');
      } catch (e2) {}
    }

    try {
      window.dispatchEvent(new CustomEvent('WAYRA:cookie-consent', { detail: payload }));
    } catch (e3) {}
  }

  function hideBanner() {
    banner.classList.remove('visible');
    setTimeout(function () {
      banner.remove();
    }, 260);
  }
})();


