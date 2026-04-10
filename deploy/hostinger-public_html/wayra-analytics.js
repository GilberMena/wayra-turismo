// wayra-analytics.js — Sistema de tracking de visitas y eventos
// Incluir este script en todas las páginas para capturar analytics

(function() {
  'use strict';

  const BACKEND_BASE_URL = (window.WAYRA_BACKEND_BASE_URL || 'https://wayra-turismo-git-main-gilbermenas-projects.vercel.app').replace(/\/$/, '');
  const ANALYTICS_ENDPOINT = `${BACKEND_BASE_URL}/api/track-event`;
  const SESSION_KEY = 'wayra_session';
  const VISITOR_KEY = 'wayra_visitor_id';
  const CONSENT_KEY = 'wayra_cookie_consent';
  let analyticsStarted = false;

  function readCookieConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      if (raw === 'accepted') return { analytics: true, legacy: true };
      if (raw === 'essential') return { analytics: false, legacy: true };
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.analytics !== 'boolean') return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function analyticsAllowed() {
    const consent = readCookieConsent();
    return !!(consent && consent.analytics === true);
  }

  function maybeInit() {
    if (analyticsStarted) return;
    if (document.readyState === 'loading') return;
    if (!analyticsAllowed()) return;
    analyticsStarted = true;
    init();
  }

  // Si el usuario acepta después, inicializamos sin recargar.
  window.addEventListener('WAYRA:cookie-consent', function () {
    maybeInit();
  });

  // Generar ID único
  function generateId() {
    return 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Obtener o crear ID de visitante (persistente)
  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  // Obtener o crear sesión (expira en 30 min de inactividad)
  function getSession() {
    const now = Date.now();
    let session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    
    if (!session || (now - session.lastActivity) > 30 * 60 * 1000) {
      session = {
        id: 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        started: now,
        lastActivity: now,
        pageviews: 0,
        referrer: document.referrer || 'direct',
        landingPage: window.location.pathname
      };
    }
    
    session.lastActivity = now;
    session.pageviews++;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return session;
  }

  // Detectar tipo de dispositivo
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Detectar fuente de tráfico
  function getTrafficSource() {
    const referrer = document.referrer;
    const params = new URLSearchParams(window.location.search);
    
    // UTM parameters
    if (params.has('utm_source')) {
      return {
        source: params.get('utm_source'),
        medium: params.get('utm_medium') || 'unknown',
        campaign: params.get('utm_campaign') || ''
      };
    }
    
    if (!referrer || referrer === '') {
      return { source: 'direct', medium: 'none', campaign: '' };
    }
    
    try {
      const refUrl = new URL(referrer);
      const hostname = refUrl.hostname.toLowerCase();
      
      // Social media
      if (hostname.includes('facebook') || hostname.includes('fb.')) {
        return { source: 'facebook', medium: 'social', campaign: '' };
      }
      if (hostname.includes('instagram')) {
        return { source: 'instagram', medium: 'social', campaign: '' };
      }
      if (hostname.includes('twitter') || hostname.includes('t.co')) {
        return { source: 'twitter', medium: 'social', campaign: '' };
      }
      if (hostname.includes('wa.me') || hostname.includes('whatsapp')) {
        return { source: 'whatsapp', medium: 'social', campaign: '' };
      }
      
      // Search engines
      if (hostname.includes('google')) {
        return { source: 'google', medium: 'organic', campaign: '' };
      }
      if (hostname.includes('bing')) {
        return { source: 'bing', medium: 'organic', campaign: '' };
      }
      
      return { source: hostname, medium: 'referral', campaign: '' };
    } catch (e) {
      return { source: 'unknown', medium: 'unknown', campaign: '' };
    }
  }

  // Enviar evento al servidor
  async function trackEvent(eventType, eventData = {}) {
    if (!analyticsAllowed()) return;
    const session = getSession();
    const traffic = getTrafficSource();
    
    const payload = {
      // Identificadores
      visitorId: getVisitorId(),
      sessionId: session.id,
      
      // Evento
      eventType: eventType,
      eventData: eventData,
      
      // Página
      page: window.location.pathname,
      pageTitle: document.title,
      
      // Contexto
      referrer: session.referrer,
      landingPage: session.landingPage,
      trafficSource: traffic.source,
      trafficMedium: traffic.medium,
      trafficCampaign: traffic.campaign,
      
      // Dispositivo
      deviceType: getDeviceType(),
      screenWidth: window.innerWidth,
      
      // Tiempo
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - session.started,
      pageviewsInSession: session.pageviews
    };

    // Enviar de forma no bloqueante
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
      } else {
        fetch(ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Silently fail
    }

    // También guardar localmente para el panel offline
    saveLocalAnalytics(payload);
  }

  // Guardar analytics localmente
  function saveLocalAnalytics(payload) {
    const key = 'wayra_analytics';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push(payload);
    // Mantener solo últimos 500 eventos
    if (stored.length > 500) stored.shift();
    localStorage.setItem(key, JSON.stringify(stored));
  }

  // ============================================
  // AUTO-TRACKING DE EVENTOS
  // ============================================

  // Track pageview
  function trackPageview() {
    trackEvent('pageview', {
      path: window.location.pathname,
      hash: window.location.hash
    });
  }

  // Track clicks en botones de reserva
  function trackReserveClicks() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-reserve], .btn-reservar, [href*="reserve"], .plan-btn-primary');
      if (target) {
        const planName = target.dataset.planName || 
                         target.closest('[data-plan-name]')?.dataset.planName ||
                         target.closest('.plan-card')?.querySelector('h3')?.textContent ||
                         'unknown';
        trackEvent('reserve_click', {
          plan: planName,
          buttonText: target.textContent?.trim(),
          location: window.location.pathname
        });
      }
    });
  }

  // Track envío de formularios de contacto/reserva
  function trackFormSubmissions() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.classList.contains('contact-form') || 
          form.classList.contains('reserve-form') ||
          form.id === 'reservaForm') {
        trackEvent('form_submit', {
          formId: form.id || form.className,
          page: window.location.pathname
        });
      }
    });
  }

  // Track clics en WhatsApp
  function trackWhatsAppClicks() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[href*="wa.me"], [data-wa-link]');
      if (target) {
        trackEvent('whatsapp_click', {
          href: target.href,
          location: window.location.pathname
        });
      }
    });
  }

  // Track vistas de planes específicos
  function trackPlanViews() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const planName = card.dataset.planName || 
                           card.querySelector('h3')?.textContent ||
                           'unknown';
          trackEvent('plan_view', {
            plan: planName,
            page: window.location.pathname
          });
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.plan-card, .experience-card, [data-track-view]').forEach(card => {
      observer.observe(card);
    });
  }

  // Track scroll depth
  function trackScrollDepth() {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90];
    const triggered = new Set();

    function checkScroll() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      
      const percent = Math.round((window.scrollY / scrollHeight) * 100);
      
      if (percent > maxScroll) {
        maxScroll = percent;
        thresholds.forEach(threshold => {
          if (percent >= threshold && !triggered.has(threshold)) {
            triggered.add(threshold);
            trackEvent('scroll_depth', {
              depth: threshold,
              page: window.location.pathname
            });
          }
        });
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
  }

  // Track tiempo en página (al salir)
  function trackTimeOnPage() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackEvent('page_exit', {
        timeSpentSeconds: timeSpent,
        page: window.location.pathname
      });
    });
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  
  // Exponer API global para tracking manual
  window.WayraAnalytics = {
    track: trackEvent,
    getVisitorId: getVisitorId,
    getSession: getSession
  };

  // Auto-track cuando DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInit);
  } else {
    maybeInit();
  }

  function init() {
    trackPageview();
    trackReserveClicks();
    trackFormSubmissions();
    trackWhatsAppClicks();
    trackScrollDepth();
    trackTimeOnPage();
    
    // Delay para dar tiempo a que se renderice el contenido dinámico
    setTimeout(trackPlanViews, 1000);
  }

})();

