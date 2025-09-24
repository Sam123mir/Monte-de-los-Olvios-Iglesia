/**
 * MONTE DE LOS OLIVOS - APLICACIÓN WEB
 * Arquitectura mejorada con clases ES6, optimización de rendimiento y accesibilidad.
 * Autor: Sammir Contreras (Full-Stack para Iglesias)
 * Fecha: 2025
 */

'use strict';

// =====================================================
// CONFIGURACIÓN GLOBAL
// =====================================================
const CONFIG = {
  animations: {
    duration: 300,
    easing: 'ease-in-out'
  },
  scroll: {
    offset: 80,
    behavior: 'smooth'
  },
  forms: {
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneRegex: /^(\+34|0034|34)?[ -]*(6|7)[ -]*([0-9][ -]*){8}$/
  },
  versiculos: [
    { texto: "Todo lo puedo en Cristo que me fortalece.", cita: "Filipenses 4:13" },
    { texto: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.", cita: "Jeremías 29:11" },
    { texto: "Confía en Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.", cita: "Proverbios 3:5" },
    { texto: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.", cita: "Romanos 8:28" },
    { texto: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.", cita: "Mateo 6:33" },
    { texto: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.", cita: "Isaías 41:10" }
  ]
};

// =====================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =====================================================
const AppState = {
  currentGalleryTab: 'comunidad',
  isMenuOpen: false,
  isLoading: false,
  testimonios: [],
  comentarios: [],
  lastFocusedElement: null
};

// =====================================================
// CLASE BASE PARA MÓDULOS
// =====================================================
class BaseModule {
  constructor() {
    this.selectors = {};
    this.eventListeners = [];
  }

  // Registrar event listeners para limpieza posterior
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  // Limpiar event listeners al destruir el módulo
  destroy() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

// =====================================================
// UTILIDADES GLOBALES
// =====================================================
class Utils {
  static debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  static validateEmail(email) {
    return CONFIG.forms.emailRegex.test(email);
  }

  static validatePhone(phone) {
    return CONFIG.forms.phoneRegex.test(phone);
  }

  static scrollToElement(element, offset = CONFIG.scroll.offset) {
    window.scrollTo({
      top: element.offsetTop - offset,
      behavior: CONFIG.scroll.behavior
    });
  }

  static showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="Cerrar notificación">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(notification);

    // Auto-remover
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Cerrar manualmente
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    });
  }

  static trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    });
  }
}

// =====================================================
// GESTIÓN DE SCROLL Y ANIMACIONES
// =====================================================
class ScrollManager extends BaseModule {
  init() {
    this.setupScrollToTop();
    this.setupScrollAnimations();
    this.setupParallaxEffects();
  }

  setupScrollToTop() {
    this.selectors.scrollButton = document.getElementById('scroll-to-top');
    if (!this.selectors.scrollButton) return;

    const toggleScrollButton = Utils.throttle(() => {
      this.selectors.scrollButton.classList.toggle('visible', window.scrollY > 300);
    }, 100);

    this.addEventListener(window, 'scroll', toggleScrollButton);
    this.addEventListener(this.selectors.scrollButton, 'click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Navegación con teclado
    this.addEventListener(this.selectors.scrollButton, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.selectors.scrollButton.click();
      }
    });
  }

  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in:not(.animated)');
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
          entry.target.style.animationDelay = `${index * 0.1}s`;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => observer.observe(el));
  }

  setupParallaxEffects() {
    if (window.innerWidth <= 768) return;

    this.selectors.parallaxElements = document.querySelectorAll('.header, .versiculo-dia');
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.scrollY;
      this.selectors.parallaxElements.forEach(el => {
        el.style.transform = `translateY(${scrolled * -0.5}px)`;
      });
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    this.addEventListener(window, 'scroll', handleScroll);
  }
}

// =====================================================
// GESTIÓN DE EVENTOS Y CALENDARIO
// =====================================================
class EventManager extends BaseModule {
  init() {
    this.selectors.eventFilters = document.querySelectorAll('.event-filter');
    this.selectors.events = document.querySelectorAll('.evento');
    this.setupEventFilters();
    this.setupEventModal();
    this.loadUpcomingEvents();
  }

  setupEventFilters() {
    this.selectors.eventFilters.forEach(filter => {
      this.addEventListener(filter, 'click', (e) => {
        const filterType = e.target.dataset.filter;
        this.filterEvents(filterType);
      });
    });
  }

  filterEvents(filterType) {
    this.selectors.events.forEach(event => {
      const shouldShow = filterType === 'all' || event.dataset.category === filterType;
      event.style.display = shouldShow ? 'flex' : 'none';
      if (shouldShow) event.classList.add('fade-in');
    });
  }

  setupEventModal() {
    this.selectors.events.forEach(event => {
      event.setAttribute('tabindex', '0');
      event.setAttribute('role', 'button');

      this.addEventListener(event, 'click', () => this.openEventModal(event));
      this.addEventListener(event, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openEventModal(event);
        }
      });
    });
  }

  openEventModal(eventElement) {
    const eventTitle = eventElement.querySelector('h3').textContent;
    const eventTime = eventElement.querySelector('p:first-of-type').textContent;
    const eventLocation = eventElement.querySelector('p:nth-of-type(2)').textContent;
    const eventDescription = eventElement.querySelector('.evento-descripcion')?.textContent || '';

    // Crear modal si no existe
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.className = 'event-modal';
      this.modal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-event-title">${eventTitle}</h3>
              <button class="modal-close" aria-label="Cerrar modal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="event-details">
                <p><i class="fas fa-clock"></i> <span id="modal-event-time">${eventTime}</span></p>
                <p><i class="fas fa-map-marker-alt"></i> <span id="modal-event-location">${eventLocation}</span></p>
                ${eventDescription ? `<p class="event-description">${eventDescription}</p>` : ''}
              </div>
              <div class="event-actions">
                <button class="btn-primario" id="add-to-calendar">
                  <i class="fas fa-calendar-plus"></i> Agregar al Calendario
                </button>
                <button class="btn-secundario" id="share-event">
                  <i class="fas fa-share"></i> Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.modal);
    } else {
      // Actualizar contenido existente
      this.modal.querySelector('#modal-event-title').textContent = eventTitle;
      this.modal.querySelector('#modal-event-time').textContent = eventTime;
      this.modal.querySelector('#modal-event-location').textContent = eventLocation;
      const descriptionElement = this.modal.querySelector('.event-description');
      if (descriptionElement) descriptionElement.textContent = eventDescription;
    }

    // Mostrar modal
    document.body.style.overflow = 'hidden';
    this.modal.style.display = 'block';
    setTimeout(() => this.modal.classList.add('visible'), 10);

    // Configurar acciones
    this.modal.querySelector('#add-to-calendar').onclick = () => this.addToCalendar(eventTitle, eventTime);
    this.modal.querySelector('#share-event').onclick = () => this.shareEvent(eventTitle);

    // Cerrar modal
    const closeModal = () => {
      this.modal.classList.remove('visible');
      setTimeout(() => {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
    };

    this.modal.querySelector('.modal-close').onclick = closeModal;
    this.modal.querySelector('.modal-backdrop').onclick = (e) => {
      if (e.target === e.currentTarget) closeModal();
    };

    // Focus management
    this.modal.querySelector('.modal-close').focus();
    Utils.trapFocus(this.modal.querySelector('.modal-content'));
  }

  addToCalendar(title, time) {
    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(`Evento en Monte de los Olivos - ${time}`);
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDetails}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    Utils.showNotification('Abriendo Google Calendar...', 'info');
  }

  shareEvent(title) {
    const shareText = `Te invito al evento "${title}" en Monte de los Olivos - ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: `Evento: ${title}`,
        text: shareText,
        url: window.location.href
      }).catch(() => this.fallbackShare(shareText));
    } else {
      this.fallbackShare(shareText);
    }
  }

  fallbackShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        Utils.showNotification('Enlace copiado al portapapeles', 'success');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Utils.showNotification('Enlace copiado', 'success');
    }
  }

  loadUpcomingEvents() {
    console.log('Cargando próximos eventos...');
    // Aquí integrarías una llamada a una API real
  }
}

// =====================================================
// GESTIÓN DE DONACIONES
// =====================================================
class DonationManager extends BaseModule {
  init() {
    this.selectors.donationButtons = document.querySelectorAll('.btn-donar');
    this.setupDonationButtons();
    this.setupDonationTracking();
  }

  setupDonationButtons() {
    this.selectors.donationButtons.forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        const method = this.getDonationMethod(button);
        this.handleDonation(method, button);
      });
    });
  }

  getDonationMethod(button) {
    const parentCard = button.closest('.donacion-metodo');
    const title = parentCard.querySelector('h3').textContent.toLowerCase();
    if (title.includes('bizum')) return 'bizum';
    if (title.includes('paypal')) return 'paypal';
    if (title.includes('transferencia')) return 'bank';
    return 'unknown';
  }

  handleDonation(method, button) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'donation_click', { method, currency: 'EUR' });
    }

    switch (method) {
      case 'bizum': this.handleBizumDonation(); break;
      case 'paypal': this.handlePaypalDonation(); break;
      case 'bank': this.handleBankDonation(); break;
      default: Utils.showNotification('Método de donación no disponible', 'error');
    }
  }

  handleBizumDonation() {
    this.createDonationModal('bizum');
    Utils.showNotification('Información de Bizum mostrada', 'info');
  }

  handlePaypalDonation() {
    window.open('https://paypal.me/montelosolivo', '_blank', 'noopener,noreferrer');
    Utils.showNotification('Abriendo PayPal...', 'info');
  }

  handleBankDonation() {
    this.createDonationModal('bank');
  }

  createDonationModal(type) {
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.className = 'donation-modal';
      document.body.appendChild(this.modal);
    }

    let content = '';
    switch (type) {
      case 'bizum':
        content = `
          <div class="modal-header">
            <h3>Donación por Bizum</h3>
            <button class="modal-close" aria-label="Cerrar modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="bizum-info">
              <p>Para donar por Bizum:</p>
              <ol>
                <li>Abre tu app bancaria</li>
                <li>Selecciona "Enviar Bizum"</li>
                <li>Introduce el número: <strong>+34 670 72 72 47</strong></li>
                <li>Añade el concepto: "Donación Monte de los Olivos"</li>
                <li>Confirma la donación</li>
              </ol>
              <div class="qr-code">
                <p>O escanea este código QR:</p>
                <div class="qr-placeholder">[Código QR de Bizum]</div>
              </div>
            </div>
          </div>
        `;
        break;
      case 'bank':
        content = `
          <div class="modal-header">
            <h3>Transferencia Bancaria</h3>
            <button class="modal-close" aria-label="Cerrar modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="bank-info">
              <p>Para solicitar los datos bancarios, por favor contacta con nosotros:</p>
              <div class="contact-options">
                <p><i class="fas fa-phone"></i> +34 670 72 72 47</p>
                <p><i class="fas fa-envelope"></i> montelosolivo@gmail.com</p>
              </div>
              <p class="note">Te proporcionaremos todos los datos necesarios para realizar la transferencia de forma segura.</p>
            </div>
          </div>
        `;
        break;
    }

    this.modal.innerHTML = `<div class="modal-backdrop"><div class="modal-content">${content}</div></div>`;
    this.modal.style.display = 'block';
    setTimeout(() => this.modal.classList.add('visible'), 10);
    document.body.style.overflow = 'hidden';

    // Cerrar modal
    const closeModal = () => {
      this.modal.classList.remove('visible');
      setTimeout(() => {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
    };

    this.modal.querySelector('.modal-close').onclick = closeModal;
    this.modal.querySelector('.modal-backdrop').onclick = (e) => {
      if (e.target === e.currentTarget) closeModal();
    };

    // Focus management
    this.modal.querySelector('.modal-close').focus();
    Utils.trapFocus(this.modal.querySelector('.modal-content'));
  }

  setupDonationTracking() {
    console.log('Tracking de donaciones configurado');
  }
}

// =====================================================
// GESTIÓN DE ACCESIBILIDAD
// =====================================================
class AccessibilityManager extends BaseModule {
  init() {
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.setupColorContrastToggle();
  }

  setupKeyboardNavigation() {
    // Navegación con Tab
    this.addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    this.addEventListener(document, 'mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Atajos de teclado
    this.addEventListener(document, 'keydown', (e) => {
      if (e.altKey) {
        switch (e.key) {
          case 'm': // Menú
            e.preventDefault();
            document.querySelector('.mobile-menu-toggle')?.click();
            break;
          case 't': // Scroll to top
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
          case 'c': // Contacto
            e.preventDefault();
            const contactSection = document.getElementById('contacto');
            if (contactSection) Utils.scrollToElement(contactSection);
            break;
        }
      }
    });
  }

  setupScreenReaderSupport() {
    // Agregar landmarks ARIA
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) main.setAttribute('role', 'main');

    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) nav.setAttribute('role', 'navigation');

    // Crear región live para anuncios
    this.createLiveRegion();
  }

  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);

    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => liveRegion.textContent = '', 1000);
    };
  }

  setupFocusManagement() {
    // Guardar último elemento enfocado
    this.addEventListener(document, 'modal-opened', (e) => {
      AppState.lastFocusedElement = document.activeElement;
      const modal = e.detail.modal;
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) focusableElements[0].focus();
      Utils.trapFocus(modal, focusableElements);
    });

    // Restaurar foco al cerrar modal
    this.addEventListener(document, 'modal-closed', () => {
      if (AppState.lastFocusedElement) {
        AppState.lastFocusedElement.focus();
        AppState.lastFocusedElement = null;
      }
    });
  }

  setupColorContrastToggle() {
    const contrastToggle = document.getElementById('contrast-toggle');
    if (!contrastToggle) return;

    this.addEventListener(contrastToggle, 'click', () => {
      document.body.classList.toggle('high-contrast');
      const isHighContrast = document.body.classList.contains('high-contrast');
      localStorage.setItem('high-contrast', isHighContrast);
      Utils.showNotification(
        isHighContrast ? 'Modo alto contraste activado' : 'Modo alto contraste desactivado',
        'info'
      );
    });

    // Restaurar preferencia
    if (localStorage.getItem('high-contrast') === 'true') {
      document.body.classList.add('high-contrast');
    }
  }
}

// =====================================================
// GESTIÓN DE NAVEGACIÓN
// =====================================================
class Navigation extends BaseModule {
  init() {
    this.selectors.toggleButton = document.querySelector('.mobile-menu-toggle');
    this.selectors.menu = document.querySelector('.menu-horizontal');
    this.setupMenuToggle();
    this.setupMenuItems();
    this.setupScrollSpy();
    this.setupSmoothScroll();
  }

  setupMenuToggle() {
    if (!this.selectors.toggleButton || !this.selectors.menu) return;

    this.addEventListener(this.selectors.toggleButton, 'click', () => this.toggleMenu());

    // Cerrar menú al hacer clic fuera
    this.addEventListener(document, 'click', (e) => {
      if (!this.selectors.menu.contains(e.target) && !this.selectors.toggleButton.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Cerrar menú con Escape
    this.addEventListener(document, 'keydown', (e) => {
      if (e.key === 'Escape' && AppState.isMenuOpen) {
        this.closeMenu();
        this.selectors.toggleButton.focus();
      }
    });
  }

  toggleMenu() {
    const icon = this.selectors.toggleButton.querySelector('i');
    AppState.isMenuOpen = !AppState.isMenuOpen;
    this.selectors.menu.classList.toggle('active');
    this.selectors.toggleButton.setAttribute('aria-expanded', AppState.isMenuOpen);

    if (AppState.isMenuOpen) {
      icon.className = 'fas fa-times';
      document.body.style.overflow = 'hidden';
    } else {
      icon.className = 'fas fa-bars';
      document.body.style.overflow = '';
    }
  }

  closeMenu() {
    if (!AppState.isMenuOpen) return;
    AppState.isMenuOpen = false;
    this.selectors.menu.classList.remove('active');
    this.selectors.toggleButton.setAttribute('aria-expanded', false);
    this.selectors.toggleButton.querySelector('i').className = 'fas fa-bars';
    document.body.style.overflow = '';
  }

  setupMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      this.addEventListener(item, 'click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-target');
        const targetElement = document.querySelector(target);
        if (targetElement) {
          Utils.scrollToElement(targetElement);
          if (window.innerWidth <= 768) this.closeMenu();
          this.updateActiveMenuItem(item);
        }
      });

      // Navegación con teclado
      this.addEventListener(item, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  updateActiveMenuItem(activeItem) {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    activeItem.classList.add('active');
  }

  setupScrollSpy() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const menuItems = document.querySelectorAll('.menu-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentSection = entry.target.id;
          const activeMenuItem = document.querySelector(`[data-target="#${currentSection}"]`);
          if (activeMenuItem) {
            menuItems.forEach(item => item.classList.remove('active'));
            activeMenuItem.classList.add('active');
          }
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -80px 0px' });

    sections.forEach(section => observer.observe(section));
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      this.addEventListener(link, 'click', (e) => {
        const href = link.getAttribute('href');
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          Utils.scrollToElement(targetElement);
        }
      });
    });
  }
}

// =====================================================
// CLASE PRINCIPAL DE LA APLICACIÓN
// =====================================================
class MonteOlivosApp {
  constructor() {
    this.modules = [];
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.showInitialLoading();

    try {
      // Inicializar módulos
      this.modules.push(new ScrollManager());
      this.modules.push(new EventManager());
      this.modules.push(new DonationManager());
      this.modules.push(new AccessibilityManager());
      this.modules.push(new Navigation());

      this.modules.forEach(module => module.init());

      // Configuración adicional
      this.setupErrorHandling();
      this.setupOfflineSupport();
      this.restoreUserPreferences();

      this.isInitialized = true;
      console.log('✅ Monte de los Olivos App inicializada correctamente');

      // Ocultar loading
      setTimeout(() => this.hideInitialLoading(), 1000);
    } catch (error) {
      console.error('❌ Error al inicializar la aplicación:', error);
      this.handleInitializationError(error);
    }
  }

  showInitialLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
  }

  hideInitialLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.style.opacity = '0';
      setTimeout(() => loadingSpinner.style.display = 'none', 300);
    }
  }

  setupErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Error global capturado:', e.error);
      if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
          description: e.error.message,
          fatal: false
        });
      }
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promise rechazada:', e.reason);
      e.preventDefault();
    });
  }

  setupOfflineSupport() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);
      Utils.showNotification(
        isOnline ? 'Conexión restaurada' : 'Sin conexión a Internet. Algunas funciones pueden no estar disponibles.',
        isOnline ? 'success' : 'warning'
      );
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  restoreUserPreferences() {
    try {
      // Restaurar testimonios
      const savedTestimonios = localStorage.getItem('testimonios_monte_olivos');
      if (savedTestimonios) AppState.testimonios = JSON.parse(savedTestimonios);

      // Restaurar tema
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) document.body.classList.add(savedTheme);
    } catch (error) {
      console.warn('Error al restaurar preferencias:', error);
    }
  }

  handleInitializationError(error) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'initialization-error';
    errorMessage.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error de Inicialización</h3>
        <p>Hubo un problema al cargar la página. Por favor, recarga la página.</p>
        <button onclick="window.location.reload()" class="btn-primario">
          <i class="fas fa-redo"></i> Recargar Página
        </button>
      </div>
    `;
    document.body.appendChild(errorMessage);
    this.hideInitialLoading();
  }

  destroy() {
    this.modules.forEach(module => module.destroy());
    this.isInitialized = false;
    console.log('App destruida');
  }
}

// =====================================================
// GESTIÓN DE COOKIES Y CONSENTIMIENTO
// =====================================================
class CookieManager {
  constructor() {
    this.cookieBanner = document.getElementById('cookie-consent-banner');
    this.cookieAcceptBtn = document.getElementById('cookie-accept-btn');
    this.cookieRejectBtn = document.getElementById('cookie-reject-btn');
    this.init();
  }

  init() {
    if (!this.cookieBanner) return;

    // Configurar event listeners
    if (this.cookieAcceptBtn) {
      this.cookieAcceptBtn.addEventListener('click', () => this.acceptCookies());
    }

    if (this.cookieRejectBtn) {
      this.cookieRejectBtn.addEventListener('click', () => this.rejectCookies());
    }

    // Mostrar banner si no hay preferencias guardadas
    if (!localStorage.getItem('cookieConsent')) {
      setTimeout(() => {
        this.cookieBanner.classList.remove('hidden');
      }, 1000);
    } else {
      this.cookieBanner.classList.add('hidden');
    }
  }

  /**
   * Acepta todas las cookies.
   */
  acceptCookies() {
    const preferences = {
      accepted: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    this.hideCookieBanner();

    // Aquí puedes cargar scripts adicionales como GTM, Hotjar, etc.
    this.loadExternalScripts();
  }

  /**
   * Rechaza las cookies no esenciales.
   */
  rejectCookies() {
    const preferences = {
      accepted: false,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    this.hideCookieBanner();
  }

  /**
   * Oculta el banner de cookies.
   */
  hideCookieBanner() {
    if (this.cookieBanner) {
      this.cookieBanner.classList.add('hidden');
    }
  }

  /**
   * Carga scripts externos como GTM, Hotjar, etc.
   */
  loadExternalScripts() {
    // Aquí puedes cargar GTM, Hotjar, o cualquier otro script que requiera consentimiento
    console.log("Cargando scripts externos con consentimiento del usuario...");
  }
}

// Inicializar CookieManager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  new CookieManager();
});


// =====================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================
const MonteOlivosWebApp = new MonteOlivosApp();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MonteOlivosWebApp.init());
} else {
  MonteOlivosWebApp.init();
}

// Exportar para uso global
window.MonteOlivosApp = MonteOlivosWebApp;
window.addToCalendar = (title, time) => EventManager.addToCalendar(title, time);
window.shareEvent = (title) => EventManager.shareEvent(title);
window.cambiarVersiculo = () => RecursosEspirituales.cambiarVersiculo();
