// script.js — manejo de formulario, smooth scroll y menú móvil
document.addEventListener('DOMContentLoaded', function(){
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const BACKEND_BASE_URL = (window.WAYRA_BACKEND_BASE_URL || 'https://wayra-turismo-git-main-gilbermenas-projects.vercel.app').replace(/\/$/, '');
  function backendUrl(path){
    return `${BACKEND_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  function getRecaptchaSiteKey(){
    const fromWindow = typeof window.WAYRA_RECAPTCHA_SITE_KEY === 'string' ? window.WAYRA_RECAPTCHA_SITE_KEY.trim() : '';
    if (fromWindow) return fromWindow;
    const meta = document.querySelector('meta[name="wayra-recaptcha-site-key"]');
    const fromMeta = meta && typeof meta.content === 'string' ? meta.content.trim() : '';
    return fromMeta;
  }

  let recaptchaLoadPromise = null;
  function ensureRecaptchaLoaded(siteKey){
    if (recaptchaLoadPromise) return recaptchaLoadPromise;
    recaptchaLoadPromise = new Promise(function(resolve, reject){
      if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-WAYRA-recaptcha="1"]');
      if (existing) {
        existing.addEventListener('load', function(){ resolve(); }, { once: true });
        existing.addEventListener('error', function(){ reject(new Error('recaptcha_script_load_failed')); }, { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-WAYRA-recaptcha', '1');
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('recaptcha_script_load_failed')); };
      document.head.appendChild(s);
    });
    return recaptchaLoadPromise;
  }

  async function getRecaptchaToken(action){
    const siteKey = getRecaptchaSiteKey();
    if (!siteKey) return '';
    try {
      await ensureRecaptchaLoaded(siteKey);
      dockRecaptchaBadge();
      return await new Promise(function(resolve, reject){
        window.grecaptcha.ready(function(){
          window.grecaptcha.execute(siteKey, { action: action || 'submit' })
            .then(resolve)
            .catch(reject);
        });
      });
    } catch (err) {
      console.warn('[WAYRA] No se pudo obtener token reCAPTCHA:', err);
      return '';
    }
  }

  const recaptchaFormSelector = '#quoteForm, #contact-form, #pqrs-form, #reserveForm';

  function ensureRecaptchaDockForForm(form){
    if (!form) return null;
    if (form.nextElementSibling && form.nextElementSibling.classList.contains('WAYRA-recaptcha-dock')) {
      return form.nextElementSibling;
    }
    const dock = document.createElement('div');
    dock.className = 'WAYRA-recaptcha-dock';
    dock.setAttribute('aria-label', 'Protegido por reCAPTCHA');
    form.insertAdjacentElement('afterend', dock);
    return dock;
  }

  function getRecaptchaForms(){
    return Array.prototype.slice.call(document.querySelectorAll(recaptchaFormSelector));
  }

  function isFormVisible(form){
    if (!form) return false;
    const style = window.getComputedStyle(form);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (!form.offsetParent && style.position !== 'fixed') return false;
    return true;
  }

  function pickBestRecaptchaForm(forms){
    if (!forms || !forms.length) return null;

    const visibleQuote = forms.find(function(form){
      return form.id === 'quoteForm' && isFormVisible(form);
    });
    if (visibleQuote) return visibleQuote;

    const visibleAny = forms.find(isFormVisible);
    if (visibleAny) return visibleAny;

    return forms[0];
  }

  let activeRecaptchaDock = null;
  function setActiveRecaptchaDockFromForm(form){
    const dock = ensureRecaptchaDockForForm(form);
    if (dock) activeRecaptchaDock = dock;
    return dock;
  }

  function setupRecaptchaDockListeners(){
    const forms = getRecaptchaForms();
    if (!forms.length) return;

    forms.forEach(function(form){
      ensureRecaptchaDockForForm(form);
      form.addEventListener('focusin', function(){ setActiveRecaptchaDockFromForm(form); });
      form.addEventListener('click', function(){ setActiveRecaptchaDockFromForm(form); });
      form.addEventListener('submit', function(){ setActiveRecaptchaDockFromForm(form); });
    });

    if (!activeRecaptchaDock) {
      setActiveRecaptchaDockFromForm(pickBestRecaptchaForm(forms));
    }
  }

  let recaptchaDockObserver = null;
  function dockRecaptchaBadge(){
    setupRecaptchaDockListeners();
    const forms = getRecaptchaForms();
    if (!activeRecaptchaDock || !forms.length) {
      setActiveRecaptchaDockFromForm(pickBestRecaptchaForm(forms));
    }

    if (activeRecaptchaDock) {
      const ownerForm = activeRecaptchaDock.previousElementSibling;
      if (!isFormVisible(ownerForm)) {
        setActiveRecaptchaDockFromForm(pickBestRecaptchaForm(forms));
      }
    }

    const dock = activeRecaptchaDock;
    if (!dock) return;

    const moveBadge = function(){
      const badge = document.querySelector('.grecaptcha-badge');
      if (!badge) return false;
      if (badge.parentElement !== dock) {
        dock.appendChild(badge);
      }
      return true;
    };

    if (moveBadge()) return;

    if (recaptchaDockObserver) return;
    recaptchaDockObserver = new MutationObserver(function(){
      if (moveBadge() && recaptchaDockObserver) {
        recaptchaDockObserver.disconnect();
        recaptchaDockObserver = null;
      }
    });
    recaptchaDockObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Carga temprana para mostrar el badge "Protegido por reCAPTCHA".
  const recaptchaSiteKey = getRecaptchaSiteKey();
  if (recaptchaSiteKey) {
    ensureRecaptchaLoaded(recaptchaSiteKey)
      .then(dockRecaptchaBadge)
      .catch(function(err){
        console.warn('[WAYRA] No se pudo precargar reCAPTCHA:', err);
      });

    window.addEventListener('resize', dockRecaptchaBadge, { passive: true });
    window.addEventListener('orientationchange', dockRecaptchaBadge, { passive: true });
    document.addEventListener('touchstart', function(){
      dockRecaptchaBadge();
    }, { passive: true });
  }
  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor){
    anchor.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if (!href || href === '#') {
        return;
      }

      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // close mobile nav if open
        const nav = document.querySelector('.main-nav');
        if(nav && nav.classList.contains('open')) nav.classList.remove('open');
      }
    });
  });

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  function syncMobileNavSocialLinks() {
    if (!nav) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const existing = nav.querySelector('.mobile-nav-social');
    const existingEmail = nav.querySelector('.mobile-nav-email');

    if (!isMobile) {
      if (existing) existing.remove();
      if (existingEmail) existingEmail.remove();
      return;
    }

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const socialLinks = headerActions.querySelectorAll('.social-brand-link');
    if (!socialLinks.length) return;

    const wrap = existing || document.createElement('div');
    wrap.className = 'mobile-nav-social';

    if (!existing) {
      socialLinks.forEach(function(link) {
        wrap.appendChild(link.cloneNode(true));
      });
      nav.appendChild(wrap);
    }

    if (!existingEmail) {
      const emailLink = document.createElement('a');
      emailLink.className = 'mobile-nav-email';
      emailLink.href = 'mailto:reservas@vivewayra.com.co';
      emailLink.textContent = 'reservas@vivewayra.com.co';
      emailLink.setAttribute('aria-label', 'Enviar correo a reservas@vivewayra.com.co');
      nav.appendChild(emailLink);
    }
  }

  syncMobileNavSocialLinks();
  window.addEventListener('resize', syncMobileNavSocialLinks);

  // Fuerza un icono SVG para evitar caracteres raros en algunos navegadores/dispositivos
  document.querySelectorAll('.nav-toggle').forEach(function(btn){
    btn.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span>';
  });

  if(navToggle && nav){
    navToggle.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        nav.classList.remove('open');
      });
    });

    document.addEventListener('click', function(e){
      if(!nav.classList.contains('open')) return;
      if(nav.contains(e.target) || navToggle.contains(e.target)) return;
      nav.classList.remove('open');
    });
  }

  // Cross-page behavior: si estamos en plans-nuqui.html, hacer scroll al ancla #planes-nuqui
  document.querySelectorAll('a[href*="plans-nuqui.html"]').forEach(function(link){
    link.addEventListener('click', function(e){
      const current = window.location.pathname.split('/').pop();
      // Si ya estamos en plans-nuqui.html, prevenimos la navegación y hacemos scroll al ancla
      if(current === 'plans-nuqui.html'){
        e.preventDefault();
        const target = document.getElementById('planes-nuqui');
        if(target){
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
      // En caso contrario, dejamos que el enlace navegue normalmente a plans-nuqui.html
    });
  });

  // --- Funcionalidad WhatsApp y modal de experiencias ---
  const whatsappNumber = '573225225582'; // +57 322 522 5582 (formato para wa.me)
  function whatsappUrlFor(message){
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  // Nota: los enlaces 'Ver plan' y 'Ver experiencias' ahora navegan a detail.html
  // Si venimos con ?reserve=plan-id en la URL abrimos el modal automáticamente.
  const plansData = {
    'plan-explorador': { title: 'Plan Explorador', price: '$1.250.000', image: 'assets/card1.svg' },
    'plan-fotografo': { title: 'Plan Fotógrafo', price: '$1.800.000', image: 'assets/card2.svg' },
    'plan-a-tu-medida': { title: 'Plan A tu Medida', price: 'Desde $2.200.000', image: 'assets/card3.svg' },
    'nuqui-esencial': { title: 'Nuquí Esencial', price: '$1.100.000', image: 'assets/card1.svg' },
    'nuqui-fotografico': { title: 'Nuquí Fotográfico', price: '$1.750.000', image: 'assets/card2.svg' },
    'nuqui-a-tu-medida': { title: 'Nuquí A tu Medida', price: 'Desde $2.200.000', image: 'assets/card3.svg' }
  };

  // Si la URL contiene ?reserve=plan-id abrimos el modal con esos datos
  try{
    const params = new URLSearchParams(window.location.search);
    if(params.has('reserve')){
      const id = params.get('reserve');
      const p = plansData[id] || {};
      // Intent: cuando la página recibe ?reserve=plan-id mostramos el chooser de contacto
      // en lugar del modal, para priorizar el flujo contact-first.
      // Buscamos un elemento en la página que represente ese plan para posicionar el chooser.
      let anchor = document.querySelector(`[data-plan-id="${id}"]`);
      if(!anchor){
        // fallback por compatibilidad: elemento con id 'plan-'+id o id 'plan-ballena'
        anchor = document.getElementById('plan-' + id) || document.getElementById('plan-ballena');
      }
      const rect = anchor ? anchor.getBoundingClientRect() : null;
      // mostrar chooser con los datos del plan
      showContactChooser({ id: id, title: p.title || '', price: p.price || '', email: 'reservas@vivewayra.com.co', phone: whatsappNumber }, rect);
      // limpiar el query para evitar reabrir si se navega dentro
      // (no rompemos historial, usamos replaceState)
      const url = new URL(window.location.href);
      url.searchParams.delete('reserve');
      window.history.replaceState({}, document.title, url.toString());
    }
  }catch(e){ /* ignore URL parsing errors */ }

  // Cerrar modal
  const modal = document.getElementById('experienceModal');
  if(modal){
    modal.querySelector('.modal-close').addEventListener('click', function(){
      modal.setAttribute('aria-hidden','true');
    });
    modal.addEventListener('click', function(e){
      if(e.target === modal) modal.setAttribute('aria-hidden','true');
    });
  }

  // Botón para enviar el formulario por WhatsApp
  const sendWaFromForm = document.getElementById('sendWaFromForm');
  const contactForm = document.querySelector('.contact-form');
  if(sendWaFromForm && contactForm){
    sendWaFromForm.addEventListener('click', function(){
      const name = (contactForm.querySelector('input[name="name"]')||{}).value || '';
      const email = (contactForm.querySelector('input[name="email"]')||{}).value || '';
      const message = (contactForm.querySelector('textarea[name="message"]')||{}).value || '';
      const text = `Hola, me llamo ${name}. Mi correo es ${email}. ${message}`;
      window.open(whatsappUrlFor(text), '_blank');
    });
  }

  // ----------------- Reserva (contact-only) -----------------
  // Opcional: endpoint de Formspree para recibir reservas (ej: https://formspree.io/f/xxxx)
  // En el flujo actual preferimos que el usuario nos contacte por WhatsApp, correo o teléfono.
  const formspreeEndpoint = '';
  // Endpoint serverless para guardar reservas (Netlify function). Se mantiene como opción, pero no es obligatorio.
  const serverlessReservationUrl = backendUrl('/api/create-reservation');

  // Modal de reserva (se comparte en index y plans-nuqui)
  const reserveModal = document.getElementById('reserveModal');
  function openReserveModal(opts){
    if(!reserveModal) return;
    reserveModal.setAttribute('aria-hidden','false');
    document.getElementById('reservePlanId').value = opts.id || '';
    document.getElementById('reservePlanTitle').value = opts.title || '';
    document.getElementById('reservePlanPrice').value = opts.price || '';
    // show image in modal if provided
    const ri = document.getElementById('reserveImage');
    if(ri){
      if(opts.image){ ri.style.display='block'; ri.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.08)), url('${opts.image}')`; }
      else { ri.style.display='none'; ri.style.backgroundImage='none'; }
    }
  }

  // Cuando se presiona 'Reservar' en un plan: mostrar un selector con opciones (WhatsApp / Correo)
  // Creamos dinámicamente un pequeño chooser y lo mostramos posicionado cerca del botón
  function ensureContactChooser(){
    let chooser = document.getElementById('contactChooser');
    if(chooser) return chooser;
    chooser = document.createElement('div');
    chooser.id = 'contactChooser';
    chooser.className = 'contact-chooser';
    chooser.setAttribute('aria-hidden','true');
    chooser.innerHTML = `
      <div class="chooser-header">
        <div class="chooser-title">Contactar para reservar</div>
        <button id="chooserClose" aria-label="Cerrar" style="background:transparent;border:0;font-size:18px">X</button>
      </div>
      <div class="chooser-actions">
        <a id="chooserWhatsapp" class="btn-whatsapp" href="#" target="_blank">WhatsApp</a>
        <a id="chooserMail" class="btn-primary" href="#">Enviar por correo</a>
      </div>
    `;
    document.body.appendChild(chooser);

    // Close handler
    chooser.querySelector('#chooserClose').addEventListener('click', function(){ hideContactChooser(); });
    // clicking outside chooser should close it
    document.addEventListener('click', function(e){
      if(!chooser.classList.contains('visible')) return;
      if(chooser.contains(e.target)) return;
      hideContactChooser();
    });
    return chooser;
  }

  function showContactChooser(opts, anchorRect){
    const chooser = ensureContactChooser();
    const wa = chooser.querySelector('#chooserWhatsapp');
    const mail = chooser.querySelector('#chooserMail');

    const title = opts.title || '';
    const price = opts.price || '';
    const id = opts.id || '';
    const emailTarget = opts.email || 'reservas@vivewayra.com.co';

    const message = `Hola, quiero mas informacion para reservar ${title ? `*${title}*` : 'este plan'}${price ? ` (${price})` : ''}.${id ? ` Referencia: ${id}.` : ''}`;
    wa.href = whatsappUrlFor(message);

    const subject = `Solicitud de reserva: ${title || 'Plan ViveWayra'}`;
    const body = `Hola, quiero mas informacion para reservar ${title || 'este plan'}.\n${price ? `Precio estimado: ${price}\n` : ''}${id ? `Referencia: ${id}\n` : ''}\nQuedo atento a la informacion y disponibilidad.`;
    mail.href = `mailto:${emailTarget}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Position chooser: try to place near anchorRect (below it), else center-bottom on small screens
    const cw = 300;
    if(anchorRect && window.innerWidth > 640){
      const left = Math.min(Math.max(anchorRect.left + (anchorRect.width/2) - (cw/2), 8), window.innerWidth - cw - 8);
      const top = anchorRect.bottom + 8;
      chooser.style.left = left + 'px';
      chooser.style.top = top + 'px';
      chooser.style.right = 'auto';
      chooser.style.bottom = 'auto';
    } else {
      // mobile: pinned bottom
      chooser.style.left = '8px';
      chooser.style.right = '8px';
      chooser.style.bottom = '20px';
      chooser.style.top = 'auto';
    }

    chooser.classList.add('visible');
    chooser.setAttribute('aria-hidden','false');
  }

  function hideContactChooser(){
    const chooser = document.getElementById('contactChooser');
    if(!chooser) return;
    chooser.classList.remove('visible');
    chooser.setAttribute('aria-hidden','true');
  }

  // Handler: al pulsar 'Reservar' mostrar chooser con info del plan
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.open-reserve, #btnReserveDetail, [data-reserve]');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const title = btn.dataset.planTitle || btn.getAttribute('data-plan-title') || btn.textContent || '';
    const price = btn.dataset.planPrice || btn.getAttribute('data-plan-price') || '';
    const id = btn.dataset.planId || btn.getAttribute('data-plan-id') || '';
    const email = btn.dataset.planEmail || btn.getAttribute('data-plan-email') || 'reservas@vivewayra.com.co';
    const rect = btn.getBoundingClientRect();
    showContactChooser({ id, title, price, email }, rect);
  });
  // Cerrar modal de reserva
  if(reserveModal){
    reserveModal.querySelector('.modal-close').addEventListener('click', function(){
      reserveModal.setAttribute('aria-hidden','true');
    });
    reserveModal.addEventListener('click', function(e){
      if(e.target === reserveModal) reserveModal.setAttribute('aria-hidden','true');
    });
  }

  // Acciones del modal: Contactar por WhatsApp, Enviar por correo, Llamar
  const reserveForm = document.getElementById('reserveForm');
  const btnWhatsappReserve = document.getElementById('reserveWhatsapp');
  const btnReserveMail = document.getElementById('reserveMail');

  function collectReserveData(){
    return {
      id: (document.getElementById('reservePlanId')||{}).value || '',
      title: (document.getElementById('reservePlanTitle')||{}).value || '',
      price: (document.getElementById('reservePlanPrice')||{}).value || '',
      name: (document.getElementById('reserveName')||{}).value || '',
      phone: (document.getElementById('reservePhone')||{}).value || '',
      email: (document.getElementById('reserveEmail')||{}).value || '',
      start: (document.getElementById('reserveStart')||{}).value || '',
      end: (document.getElementById('reserveEnd')||{}).value || '',
      guests: (document.getElementById('reserveGuests')||{}).value || '',
      comments: (document.getElementById('reserveComments')||{}).value || ''
    };
  }

  if(btnWhatsappReserve){
    btnWhatsappReserve.addEventListener('click', async function(){
      const d = collectReserveData();
      d.recaptchaToken = await getRecaptchaToken('reservation_submit');
      // Guardar en Airtable (backend) antes de abrir WhatsApp
      if(d.name || d.phone || d.email){
        saveLocalReservation(d);
        sendReservationToBackend(d);
      }
      const text = `Solicitud de reserva: ${d.title}\nNombre: ${d.name}\nTelefono: ${d.phone}\nEmail: ${d.email}\nFechas: ${d.start} - ${d.end}\nPersonas: ${d.guests}\nComentarios: ${d.comments}\n\nPor favor confirme disponibilidad y pasos para confirmar la reserva.`;
      window.open(whatsappUrlFor(text), '_blank');
    });
  }

  if(btnReserveMail){
    btnReserveMail.addEventListener('click', async function(){
      const d = collectReserveData();
      if(!d.name || !d.phone){
        showToast('Por favor completa tu nombre y teléfono antes de enviar la solicitud.', 'error');
        return;
      }
      d.recaptchaToken = await getRecaptchaToken('reservation_submit');
      // Guardar en servidor (Airtable) y también localmente como respaldo
      saveLocalReservation(d);
      sendReservationToBackend(d);
      const subject = `Solicitud de reserva: ${d.title} - ${d.name}`;
      const body = `Plan: ${d.title}\nPrecio estimado: ${d.price}\nNombre: ${d.name}\nTeléfono: ${d.phone}\nEmail: ${d.email}\nFechas: ${d.start} - ${d.end}\nPersonas: ${d.guests}\nComentarios:\n${d.comments}`;
      fetch('form-handler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reserve',
          plan: d.title,
          price: d.price,
          name: d.name,
          phone: d.phone,
          email: d.email,
          start: d.start,
          end: d.end,
          guests: d.guests,
          comments: d.comments,
          recaptchaToken: d.recaptchaToken || ''
        })
      }).then(function(res){
        if(res.ok){
          showToast('Solicitud enviada al correo de reservas. También puedes confirmar por correo si quieres.', 'success');
        }
      }).catch(function(){});
      window.location.href = `mailto:reservas@vivewayra.com.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // ------------ Helpers: envío a backend, toast y guardado local -------------

  /**
  * Envía los datos de reserva a la función serverless de Netlify -> Airtable.
   * No bloquea el flujo (fire-and-forget); si falla, igual funciona el mailto/WhatsApp.
   */
  function sendReservationToBackend(data){
    try{
      const payload = {
        plan:     data.id || data.title || '',
        price:    data.price || '',
        name:     data.name || '',
        phone:    data.phone || '',
        email:    data.email || '',
        start:    data.start || '',
        end:      data.end || '',
        guests:   data.guests || '',
        comments: data.comments || '',
        recaptchaToken: data.recaptchaToken || ''
      };
      fetch(serverlessReservationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res){
        if(res.ok){
          console.log('[WAYRA] Reserva guardada en servidor correctamente.');
        } else {
          console.warn('[WAYRA] El servidor devolvió error al guardar reserva:', res.status);
        }
      }).catch(function(err){
        console.warn('[WAYRA] No se pudo conectar al servidor para guardar reserva:', err);
      });
    }catch(e){
      console.warn('[WAYRA] sendReservationToBackend error:', e);
    }
  }

  function showToast(message, type){
    const t = document.createElement('div');
    t.className = `toast ${type||''}`.trim();
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(()=>{ t.classList.add('visible'); },10);
    setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=>t.remove(),300); }, 4200);
  }

  function saveLocalReservation(obj){
    try{
      const key = 'vivewayra_reservas';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(Object.assign({created_at: new Date().toISOString()}, obj));
      localStorage.setItem(key, JSON.stringify(existing));
    }catch(e){ console.warn('No se pudo guardar en localStorage', e); }
  }

  // Small helper: add/remove spinner in buttons while loading
  function setButtonLoading(btn, loading){
    if(!btn) return;
    if(loading){
      if(btn.dataset.loading === '1') return;
      btn.dataset.loading = '1';
      btn.disabled = true;
      const s = document.createElement('span');
      s.className = 'btn-spinner';
      s.innerHTML = '<svg class="spinner" viewBox="0 0 50 50" width="18" height="18" aria-hidden="true"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"></circle></svg>';
      btn.insertBefore(s, btn.firstChild);
    } else {
      delete btn.dataset.loading;
      btn.disabled = false;
      const s = btn.querySelector('.btn-spinner');
      if(s) s.remove();
    }
  }

  // Contact form: open mail client with prefilled subject/body
  const form = document.querySelector('.contact-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const name = (form.querySelector('input[name="name"]')||{}).value || '';
      const email = (form.querySelector('input[name="email"]')||{}).value || '';
      const message = (form.querySelector('textarea[name="message"]')||{}).value || '';
      const subject = encodeURIComponent('Consulta desde ViveWayra');
      const body = encodeURIComponent(`Nombre: ${name}%0AEmail: ${email}%0A%0A${message}`);
      // Open mailto
  const mailto = `mailto:reservas@vivewayra.com.co?subject=${subject}&body=${body}`;
      window.location.href = mailto;
      // también preparar mensaje para WhatsApp en caso que el usuario quiera usarlo
    });
  }

  // Formulario de cotizacion de la pagina principal (index)
  const homeQuoteForm = document.getElementById('homeQuoteForm');
  if (homeQuoteForm) {
    const homeQuoteSubmitBtn = document.getElementById('homeQuoteSubmitBtn');
    const homeQuoteSuccess = document.getElementById('homeQuoteSuccess');
    const FORM_HANDLER_URL = 'form-handler.php';

    function getTrimmedValue(id) {
      var el = document.getElementById(id);
      return el && typeof el.value === 'string' ? el.value.trim() : '';
    }

    function getValue(id) {
      var el = document.getElementById(id);
      return el && typeof el.value === 'string' ? el.value : '';
    }

    homeQuoteForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = getTrimmedValue('hqEmail');
      const nombre = getTrimmedValue('hqNombre');
      const apellidos = getTrimmedValue('hqApellidos');
      const telefono = getTrimmedValue('hqTelefono');
      const personas = getValue('hqPersonas');
      const fecha = getValue('hqFecha');
      const plan = getValue('hqPlan');
      const comentarios = getTrimmedValue('hqComentarios');

      if (!email || !nombre || !apellidos || !telefono) {
        alert('Por favor completa los campos obligatorios: E-mail, Nombre, Apellidos y Telefono.');
        return;
      }

      const fechaText = fecha || 'por definir';
      const planText = plan || 'por definir';

      const waMsg = 'Nueva cotizacion WAYRA\n\n'
        + 'Nombre: ' + nombre + ' ' + apellidos + '\n'
        + 'Email: ' + email + '\n'
        + 'Telefono: ' + telefono + '\n'
        + 'Personas: ' + personas + '\n'
        + 'Fecha aprox: ' + fechaText + '\n'
        + 'Plan/Destino: ' + planText + '\n'
        + (comentarios ? 'Comentarios: ' + comentarios : '');

      const waUrl = whatsappUrlFor(waMsg);
      const mailSubject = 'Cotizacion VIVEWAYRA - ' + planText;
      const mailBody = 'Hola, quiero solicitar una cotizacion con estos datos:\n\n'
        + 'Nombre: ' + nombre + ' ' + apellidos + '\n'
        + 'Email: ' + email + '\n'
        + 'Telefono: ' + telefono + '\n'
        + 'Numero de personas: ' + personas + '\n'
        + 'Fecha aprox: ' + fechaText + '\n'
        + 'Plan/Destino: ' + planText + '\n'
        + (comentarios ? 'Comentarios: ' + comentarios + '\n' : '');
      const mailUrl = 'mailto:reservas@vivewayra.com.co?subject=' + encodeURIComponent(mailSubject) + '&body=' + encodeURIComponent(mailBody);

      if (homeQuoteSubmitBtn) {
        homeQuoteSubmitBtn.disabled = true;
      }

      let sentToMail = false;
      const recaptchaToken = await getRecaptchaToken('quote_submit');
      fetch(FORM_HANDLER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote',
          nombre: nombre,
          apellidos: apellidos,
          email: email,
          telefono: telefono,
          personas: personas,
          fecha: fechaText,
          plan: planText,
          comentarios: comentarios || '-',
          recaptchaToken: recaptchaToken || ''
        })
      })
      .then(function (res) {
        sentToMail = res.ok;
      })
      .catch(function () {})
      .finally(function () {
        if (homeQuoteSubmitBtn) {
          homeQuoteSubmitBtn.style.display = 'none';
        }
        if (homeQuoteSuccess) {
          homeQuoteSuccess.innerHTML =
            (sentToMail
              ? 'Cotizacion enviada al correo de reservas. Si quieres acelerar la respuesta, continua por estos canales:<br><br>'
              : 'No pudimos confirmar el envio automatico al correo. Continua por uno de estos canales para no perder tu solicitud:<br><br>')
            + '<a href="' + waUrl + '" target="_blank" rel="noopener" class="btn-whatsapp" style="display:inline-block;margin:6px 8px;">Continuar por WhatsApp</a>'
            + '<a href="' + mailUrl + '" class="btn-primary" style="display:inline-block;margin:6px 8px;">Enviar por correo</a>';
          homeQuoteSuccess.style.display = 'block';
          homeQuoteSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        homeQuoteForm.querySelectorAll('input, textarea, select').forEach(function (el) {
          el.disabled = true;
        });
      });
    });
  }

  // Whatsapp buttons: ensure they have prefilled message
  document.querySelectorAll('.btn-whatsapp').forEach(function(btn){
    btn.addEventListener('click', function(e){
      // allow normal navigation if target _blank; otherwise open in new tab
      // link already prepared in HTML; nothing extra needed here
    });
  });
});

// Funciones para el modal Quiénes somos
function abrirQuienesSomos(event) {
  if (event) {
    event.preventDefault();
  }
  const nav = document.querySelector('.main-nav');
  if (nav && nav.classList.contains('open')) {
    nav.classList.remove('open');
  }
  const modal = document.getElementById('modal-quienes-somos');
  if (modal) {
    modal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('modal-open');
}

function cerrarQuienesSomos() {
  const modal = document.getElementById('modal-quienes-somos');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');
}


