/**
 * wayra-data.js
 * Carga centralizada de datos desde los JSON del proyecto.
 * Usado por index.html, experiencias.html y hoteles.html.
 *
 * Siempre lee la versión más fresca del archivo (cache: 'no-store').
 */

/** Detecta si estamos dentro de /admin/ o en la raíz */
const DATA_PATH = (() => {
  const path = window.location.pathname;
  if (path.includes('/admin/')) return '../data/';
  return 'data/';
})();

/**
 * fetch con caché desactivado. Añade ?_t=timestamp para
 * que el navegador nunca devuelva una versión cacheada.
 */
function freshFetch(url) {
  return fetch(url + '?_t=' + Date.now(), { cache: 'no-store' });
}

/* ════════════════════════════════════════════════════
   EXPERIENCES
════════════════════════════════════════════════════ */
function loadExperiences(callback) {
  freshFetch(DATA_PATH + 'experiences.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => callback(json.experiences || []))
    .catch(err => { console.warn('[wayra-data] experiences.json:', err.message); callback(null); });
}

/* ════════════════════════════════════════════════════
   HOTELS
════════════════════════════════════════════════════ */
function loadHotels(callback) {
  freshFetch(DATA_PATH + 'hotels.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => callback(json.hotels || []))
    .catch(err => { console.warn('[wayra-data] hotels.json:', err.message); callback(null); });
}

/* ════════════════════════════════════════════════════
   PLANES TURÍSTICOS
════════════════════════════════════════════════════ */
function loadPlanes(callback) {
  freshFetch(DATA_PATH + 'planes.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => callback((json.planes || []).filter(p => p.active !== false)))
    .catch(err => { console.warn('[wayra-data] planes.json:', err.message); callback(null); });
}

/* ════════════════════════════════════════════════════
   CONFIG GENERAL (hero, textos, contacto)
════════════════════════════════════════════════════ */
function loadConfig(callback) {
  freshFetch(DATA_PATH + 'config.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => callback(json.config || {}))
    .catch(err => { console.warn('[wayra-data] config.json:', err.message); callback(null); });
}

/* ════════════════════════════════════════════════════
   RENDER: 3 tarjetas destacadas en index.html
════════════════════════════════════════════════════ */
function renderExperienceCards(experiences, containerId, maxCards) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const list = maxCards ? experiences.slice(0, maxCards) : experiences;
  if (!list.length) {
    container.innerHTML = '<p class="muted" style="text-align:center;grid-column:1/-1;">No hay experiencias disponibles.</p>';
    return;
  }
  container.innerHTML = list.map(exp => {
    const bg = exp.image ? `url('${exp.image}')` : 'linear-gradient(135deg,#2d6a4f,#1a4030)';
    return `<article class="card act-card">
        <div class="card-image act-img" style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.28)),${bg};background-size:cover;background-position:center;">
          ${exp.badge ? `<span class="act-badge">${exp.badge}</span>` : ''}
        </div>
        <div class="act-body">
          <h3>${exp.title || ''}</h3>
          <p>${exp.description || ''}</p>
          <a class="btn-outline" href="detail.html?type=exp&id=${exp.id}">Ver experiencia →</a>
        </div>
      </article>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   RENDER: Modal "Ver todas las actividades"
════════════════════════════════════════════════════ */
function renderModalActividades(experiences, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = experiences.map(exp => {
    const bg = exp.image ? `url('${exp.image}')` : 'linear-gradient(135deg,#2d6a4f,#1a4030)';
    return `<article class="act-modal-card">
        <div class="act-modal-img" style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.3)),${bg};background-size:cover;background-position:center;">
          ${exp.badge ? `<span class="act-badge">${exp.badge}</span>` : ''}
        </div>
        <div class="act-body">
          <h3>${exp.title || ''}</h3>
          <p>${exp.description || ''}</p>
        </div>
      </article>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   RENDER: Página completa experiencias.html
════════════════════════════════════════════════════ */
function renderExperienciasPage(experiences, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!experiences || !experiences.length) {
    container.innerHTML = '<p class="muted" style="grid-column:1/-1;text-align:center;padding:40px;">No hay experiencias registradas aún.</p>';
    return;
  }
  container.innerHTML = experiences.map(exp => {
    const bg = exp.image ? `url('${exp.image}')` : 'linear-gradient(135deg,#2d6a4f,#1a4030)';
    return `<article class="card">
        <div class="card-image" style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.3)),${bg};height:200px;background-size:cover;background-position:center;">
          ${exp.badge ? `<span class="act-badge">${exp.badge}</span>` : ''}
        </div>
        <div class="card-body" style="padding:20px;">
          <h3 style="margin:0 0 8px;font-size:17px;">${exp.title || ''}</h3>
          <p style="font-size:14px;color:var(--text-muted,#666);line-height:1.6;margin:0 0 16px;">${exp.description || ''}</p>
          <a class="btn-outline" href="detail.html?type=exp&id=${exp.id}" style="font-size:13px;">Ver experiencia →</a>
        </div>
      </article>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   RENDER: Grid de planes turísticos (index.html)
════════════════════════════════════════════════════ */
function renderPlanes(planes, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!planes || !planes.length) {
    container.innerHTML = '<p class="muted" style="text-align:center;grid-column:1/-1;padding:30px;">No hay planes disponibles.</p>';
    return;
  }
  container.innerHTML = planes.map(plan => {
    const bg = plan.image ? `url('${plan.image}')` : 'linear-gradient(135deg,#1a4030,#0d2118)';
    return `<article class="plan-card">
        <div class="plan-image" style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.12)),${bg};background-size:cover;background-position:center;"></div>
        <div class="plan-header">
          <h3>${plan.title || ''}</h3>
          <div class="price">${plan.price || ''}</div>
        </div>
        <p class="muted">${plan.duration || ''}${plan.subtitle ? ' · ' + plan.subtitle : ''}</p>
        <p>${plan.description || ''}</p>
        <div class="plan-actions">
          <a href="detail.html?type=plan&id=${plan.id}" class="btn-outline btn-plan"
            data-plan-title="${plan.title}" data-plan-price="${plan.price}"
            data-plan-duration="${plan.duration}" data-plan-desc="${plan.description}"
            data-plan-image="${plan.image || ''}">Ver plan</a>
          <a href="#" class="btn-whatsapp open-reserve"
            data-plan-id="${plan.id}" data-plan-title="${plan.title}"
            data-plan-price="${plan.price}" data-plan-image="${plan.image || ''}">Reservar</a>
        </div>
      </article>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   APPLY CONFIG: aplica config.json al DOM
════════════════════════════════════════════════════ */
function applyConfig(cfg) {
  if (!cfg) return;
  // Hero
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroCTA = document.getElementById('hero-cta');
  const heroSection = document.querySelector('.hero');
  if (heroTitle && cfg.heroTitle) heroTitle.textContent = cfg.heroTitle;
  if (heroSubtitle && cfg.heroSubtitle) heroSubtitle.textContent = cfg.heroSubtitle;
  if (heroCTA && cfg.heroCTA) heroCTA.textContent = cfg.heroCTA;
  if (heroSection && cfg.heroImage) heroSection.style.backgroundImage = `url('${cfg.heroImage}')`;
  // WhatsApp links
  if (cfg.whatsapp) {
    const wa = encodeURIComponent(cfg.whatsappMessage || 'Hola, quiero información');
    document.querySelectorAll('[data-wa-link]').forEach(el => {
      el.href = `https://wa.me/${cfg.whatsapp}?text=${wa}`;
    });
  }
  // Textos "Por qué Nuquí"
  const pnTitle = document.getElementById('porque-nuqui-title');
  const pnText = document.getElementById('porque-nuqui-text');
  if (pnTitle && cfg.porqueNuquiTitle) pnTitle.textContent = cfg.porqueNuquiTitle;
  if (pnText && cfg.porqueNuquiText) pnText.textContent = cfg.porqueNuquiText;
  // Quiénes somos
  const qsText = document.getElementById('quienes-somos-text');
  if (qsText && cfg.quienesSomosText) qsText.textContent = cfg.quienesSomosText;
}
