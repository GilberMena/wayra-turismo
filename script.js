// script.js — manejo de formulario, smooth scroll y menú móvil
document.addEventListener('DOMContentLoaded', function(){
  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor){
    anchor.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // close mobile nav if open
        const nav = document.querySelector('.main-nav');
        if(nav.classList.contains('open')) nav.classList.remove('open');
      }
    });
  });

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if(navToggle){
    navToggle.addEventListener('click', function(){
      nav.classList.toggle('open');
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
    'nuqui-fotografico': { title: 'Nuquí Fotografico', price: '$1.750.000', image: 'assets/card2.svg' },
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
      showContactChooser({ id: id, title: p.title || '', price: p.price || '', email: 'vivewayra@gmail.com', phone: whatsappNumber }, rect);
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
  const serverlessReservationUrl = '/.netlify/functions/create-reservation';

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

  // Cuando se presiona 'Reservar' en un plan: mostrar un selector con opciones (WhatsApp / Correo / Llamar)
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
        <button id="chooserClose" aria-label="Cerrar" style="background:transparent;border:0;font-size:18px">×</button>
      </div>
      <div class="chooser-actions">
        <a id="chooserWhatsapp" class="btn-whatsapp" href="#" target="_blank">WhatsApp</a>
        <a id="chooserMail" class="btn-primary" href="#">Enviar por correo</a>
        <a id="chooserCall" class="btn-outline" href="#">Llamar</a>
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
    const call = chooser.querySelector('#chooserCall');

    const title = opts.title || '';
    const price = opts.price || '';
    const id = opts.id || '';
    const phoneForCall = opts.phone || whatsappNumber;
  const emailTarget = opts.email || 'vivewayra@gmail.com';

    const message = `Hola, estoy interesado en reservar *${title}* ${price ? `(${price})` : ''}. ¿Podrían confirmarme disponibilidad y pasos para reservar? Referencia: ${id}`;
    wa.href = whatsappUrlFor(message);

    const subject = `Solicitud de reserva: ${title}`;
    const body = `Plan: ${title}\nPrecio estimado: ${price}\nReferencia: ${id}\n\nPor favor confirmen disponibilidad y pasos para reservar.`;
    mail.href = `mailto:${emailTarget}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    call.href = `tel:${phoneForCall}`;

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
  document.querySelectorAll('.open-reserve').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      // Evitar que el click burbujee al document y cierre inmediatamente el chooser
      e.stopPropagation();
      const title = this.dataset.planTitle || this.getAttribute('data-plan-title') || this.textContent || '';
      const price = this.dataset.planPrice || this.getAttribute('data-plan-price') || '';
      const id = this.dataset.planId || this.getAttribute('data-plan-id') || '';
      const rect = this.getBoundingClientRect();
      showContactChooser({id:id, title:title, price:price}, rect);
    });
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
    btnWhatsappReserve.addEventListener('click', function(){
      const d = collectReserveData();
      const text = `Solicitud de reserva: ${d.title}\nNombre: ${d.name}\nTeléfono: ${d.phone}\nEmail: ${d.email}\nFechas: ${d.start} - ${d.end}\nPersonas: ${d.guests}\nComentarios: ${d.comments}\n\nPor favor confirme disponibilidad y pasos para confirmar la reserva.`;
      window.open(whatsappUrlFor(text), '_blank');
    });
  }

  if(btnReserveMail){
    btnReserveMail.addEventListener('click', function(){
      const d = collectReserveData();
      if(!d.name || !d.phone){
        showToast('Por favor completa tu nombre y teléfono antes de enviar la solicitud.', 'error');
        return;
      }
      const subject = `Solicitud de reserva: ${d.title} - ${d.name}`;
      const body = `Plan: ${d.title}\nPrecio estimado: ${d.price}\nNombre: ${d.name}\nTeléfono: ${d.phone}\nEmail: ${d.email}\nFechas: ${d.start} - ${d.end}\nPersonas: ${d.guests}\nComentarios:\n${d.comments}`;
  window.location.href = `mailto:vivewayra@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // ------------ Helpers: toast y guardado local -------------
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
  const mailto = `mailto:vivewayra@gmail.com?subject=${subject}&body=${body}`;
      window.location.href = mailto;
      // también preparar mensaje para WhatsApp en caso que el usuario quiera usarlo
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
  const modal = document.getElementById('modal-quienes-somos');
  if (modal) {
    modal.setAttribute('aria-hidden', 'false');
  }
}

function cerrarQuienesSomos() {
  const modal = document.getElementById('modal-quienes-somos');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
  }
}
