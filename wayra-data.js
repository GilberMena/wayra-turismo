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
 * fetch con caché inteligente:
 * - Admin: siempre fresco (no-store + timestamp) para ver cambios al instante.
 * - Público: caché por defecto del navegador (respeta Cache-Control del servidor).
 */
function freshFetch(url) {
  const isAdmin = window.location.pathname.includes('/admin/');
  if (isAdmin) {
    return fetch(url + '?_t=' + Date.now(), { cache: 'no-store' });
  }
  return fetch(url);
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
   GALLERY
════════════════════════════════════════════════════ */
function loadGallery(callback) {
  freshFetch(DATA_PATH + 'gallery.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => callback(json.gallery || []))
    .catch(err => { console.warn('[wayra-data] gallery.json:', err.message); callback(null); });
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
          <a class="btn-outline" href="detail.html?type=exp&id=${exp.id}">Ver plan →</a>
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
          <a class="btn-outline" href="detail.html?type=exp&id=${exp.id}" style="font-size:13px;">Ver plan →</a>
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

  // Logos (Header, Footer, etc)
  if (cfg.siteLogo) {
    document.querySelectorAll('#site-logo').forEach(img => {
      img.src = cfg.siteLogo;
    });
  }
  // WhatsApp links
  if (cfg.whatsapp) {
    const wa = encodeURIComponent(cfg.whatsappMessage || 'Hola, quiero información');
    document.querySelectorAll('[data-wa-link]').forEach(el => {
      el.href = `https://wa.me/${cfg.whatsapp}?text=${wa}`;
    });
  }

  // Social & Contact links
  if (cfg.email) {
    document.querySelectorAll('[data-email-link]').forEach(el => {
      el.href = `mailto:${cfg.email}`;
    });
  }
  if (cfg.phone) {
    document.querySelectorAll('[data-phone-link]').forEach(el => {
      el.href = `tel:${cfg.phone.replace(/\s+/g, '')}`;
    });
    const phoneEl = document.getElementById('site-phone');
    if (phoneEl) phoneEl.textContent = cfg.phone;
  }
  if (cfg.instagram) {
    document.querySelectorAll('[data-ig-link]').forEach(el => {
      el.href = cfg.instagram;
    });
  }
  if (cfg.facebook) {
    document.querySelectorAll('[data-fb-link]').forEach(el => {
      el.href = cfg.facebook;
    });
  }
  // Textos "Por qué Nuquí"
  const pnTitle = document.getElementById('porque-nuqui-title');
  const pnText = document.getElementById('porque-nuqui-text');
  if (pnTitle && cfg.porqueNuquiTitle) pnTitle.textContent = cfg.porqueNuquiTitle;
  if (pnText && cfg.porqueNuquiText) pnText.textContent = cfg.porqueNuquiText;
  // Quiénes somos
  const qsTitle = document.getElementById('quienes-somos-title');
  const qsSubtitle = document.getElementById('quienes-somos-subtitle');
  const qsImg = document.getElementById('quienes-somos-img');
  const qsText = document.getElementById('quienes-somos-text');

  if (qsTitle && cfg.quienesSomosTitle) qsTitle.textContent = cfg.quienesSomosTitle;
  if (qsSubtitle && cfg.quienesSomosSubtitle) qsSubtitle.textContent = cfg.quienesSomosSubtitle;
  if (qsImg && cfg.quienesSomosImage) {
    qsImg.src = cfg.quienesSomosImage;
    qsImg.style.display = 'block';
  } else if (qsImg) {
    qsImg.style.display = 'none';
  }
  if (qsText && cfg.quienesSomosText) {
    // Si el texto tiene saltos de línea, convertirlos a párrafos o usar line-breaks
    qsText.innerHTML = cfg.quienesSomosText.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
  }

  // Vibrant Hero Area (on main page)
  const vividHero = document.getElementById('vivid-hero-section');
  if (vividHero && cfg.bannerImage) {
    vividHero.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${cfg.bannerImage}')`;
    vividHero.style.backgroundSize = 'cover';
    vividHero.style.backgroundPosition = 'center';
    vividHero.style.backgroundAttachment = 'fixed';

    const innerSecs = vividHero.querySelectorAll('section');
    innerSecs.forEach(s => {
      s.style.background = 'transparent';
      const textEls = s.querySelectorAll('h2, .subtitle, p, li, strong, h3, .razones-eyebrow, .razones-titulo');
      textEls.forEach(el => {
        if (!el.closest('.razon-card')) {
          el.style.color = '#ffffff';
          el.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }
      });
    });
  }

  // Vibrant Whale Background Area
  const vividSection = document.getElementById('vivid-whale-section');
  if (vividSection && cfg.whaleBgImage) {
    vividSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url('${cfg.whaleBgImage}')`;
    vividSection.style.backgroundSize = 'cover';
    vividSection.style.backgroundPosition = 'center';
    vividSection.style.backgroundAttachment = 'fixed';

    const innerSections = vividSection.querySelectorAll('.section');
    innerSections.forEach(s => {
      s.style.background = 'transparent';
      const textEls = s.querySelectorAll('h2, .subtitle, p, li, strong');
      textEls.forEach(el => {
        if (!el.closest('.plan-card') && !el.closest('.personalized-package-card')) {
          el.style.color = '#ffffff';
          el.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }
      });
    });
  }

  // Vibrant Planes Background Area
  const vividPlans = document.getElementById('vivid-plans-section');
  if (vividPlans && cfg.plansBgImage) {
    vividPlans.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${cfg.plansBgImage}')`;
    vividPlans.style.backgroundSize = 'cover';
    vividPlans.style.backgroundPosition = 'center';
    vividPlans.style.backgroundAttachment = 'fixed';

    const innerSections = vividPlans.querySelectorAll('.section');
    innerSections.forEach(s => {
      s.style.background = 'transparent';
      const container = s.querySelector('.container');
      if (container) {
        // Restore "Transparent Contrast" (Glassmorphism)
        container.style.background = 'rgba(255, 255, 255, 0.1)';
        container.style.backdropFilter = 'blur(10px)';
        container.style.webkitBackdropFilter = 'blur(10px)';
        container.style.padding = '40px 20px';
        container.style.borderRadius = '24px';
        container.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      }
      const textEls = s.querySelectorAll('h2, .subtitle, p, li, strong');
      textEls.forEach(el => {
        if (!el.closest('.plan-card') && !el.closest('.personalized-package-card')) {
          el.style.color = '#ffffff';
          el.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }
      });

      // Keep cards solid as requested
      const cards = s.querySelectorAll('.plan-card, .personalized-package-card');
      cards.forEach(c => {
        c.style.background = '#2b2b2b';
        c.style.backdropFilter = 'none';
        c.style.webkitBackdropFilter = 'none';
        c.style.opacity = '1';
      });
    });
  }

  // Plans Hero
  const plansHero = document.getElementById('plans-hero');
  if (plansHero && cfg.plansHeroImage) {
    plansHero.style.backgroundImage = `url('${cfg.plansHeroImage}')`;
    plansHero.style.backgroundSize = 'cover';
    plansHero.style.backgroundPosition = 'center';
    const overlay = plansHero.querySelector('.hero-overlay');
    if (overlay) overlay.style.background = 'rgba(0,0,0,0.2)';
  }

  // Experiences Hero
  const expHero = document.getElementById('experiences-hero');
  if (expHero && cfg.experiencesHeroImage) {
    expHero.style.backgroundImage = `url('${cfg.experiencesHeroImage}')`;
    expHero.style.backgroundSize = 'cover';
    expHero.style.backgroundPosition = 'center';
  }

  // Hotels Hero
  const hotelsHero = document.getElementById('hotels-hero');
  if (hotelsHero && cfg.hotelsHeroImage) {
    hotelsHero.style.backgroundImage = `url('${cfg.hotelsHeroImage}')`;
    hotelsHero.style.backgroundSize = 'cover';
    hotelsHero.style.backgroundPosition = 'center';
  }

  // Contacto Hero
  const contactHero = document.getElementById('contact-hero');
  if (contactHero && cfg.contactoHeroImage) {
    contactHero.style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.52),rgba(0,0,0,.22)), url('${cfg.contactoHeroImage}')`;
    contactHero.style.backgroundSize = 'cover';
    contactHero.style.backgroundPosition = 'center';
  }
  const contactHeroTitle = document.getElementById('contact-hero-title');
  const contactHeroSubtitle = document.getElementById('contact-hero-subtitle');
  if (contactHeroTitle && cfg.contactoHeroTitle) contactHeroTitle.textContent = cfg.contactoHeroTitle;
  if (contactHeroSubtitle && cfg.contactoHeroSubtitle) contactHeroSubtitle.textContent = cfg.contactoHeroSubtitle;

  // Contacto: dirección, teléfono, email, wa en tarjetas
  const contactAddress = document.getElementById('contact-address');
  if (contactAddress && cfg.contactoAddress) contactAddress.textContent = cfg.contactoAddress;
  const contactWaNumber = document.getElementById('contact-wa-number');
  if (contactWaNumber && cfg.phone) contactWaNumber.textContent = cfg.phone;
  const contactEmailText = document.getElementById('contact-email-text');
  if (contactEmailText && cfg.email) contactEmailText.textContent = cfg.email;

  // Site Background Color
  if (cfg.siteBgColor) {
    document.body.style.backgroundColor = cfg.siteBgColor;
    document.documentElement.style.setProperty('--bg', cfg.siteBgColor);
  }

  // Whale Section Text (if applicable)
  const actSection = document.getElementById('vid-title'); // Sometimes used for whale title
  if (actSection) {
    if (cfg.whaleSectionTitle) actSection.textContent = cfg.whaleSectionTitle;
  }
}

// Auto-load config on all pages unless we are in admin
if (!window.location.pathname.includes('/admin/')) {
  loadConfig(applyConfig);
}
