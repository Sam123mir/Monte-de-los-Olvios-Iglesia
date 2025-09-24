/**
 * MONTE DE LOS OLIVOS - SCRIPT PRINCIPAL
 * Arquitectura profesional basada en el HTML proporcionado.
 * Incluye: navegación, eventos, galerías, formularios, donaciones, accesibilidad, y más.
 * Autor: Sammir Contreras
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
  /**
   * Ejecuta una función después de un tiempo de espera, reiniciando el temporizador en cada llamada.
   */
  static debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Limita la frecuencia de ejecución de una función.
   */
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

  /**
   * Formatea una fecha en formato legible.
   */
  static formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Valida un correo electrónico.
   */
  static validateEmail(email) {
    return CONFIG.forms.emailRegex.test(email);
  }

  /**
   * Valida un número de teléfono español.
   */
  static validatePhone(phone) {
    return CONFIG.forms.phoneRegex.test(phone);
  }

  /**
   * Muestra una notificación al usuario.
   */
  static showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="Cerrar notificación">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
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

  /**
   * Desplaza la página hasta un elemento específico.
   */
  static scrollToElement(element, offset = CONFIG.scroll.offset) {
    window.scrollTo({
      top: element.offsetTop - offset,
      behavior: CONFIG.scroll.behavior
    });
  }

  /**
   * Atrapa el foco dentro de un contenedor (para modales).
   */
  static trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Devolver función para limpiar el event listener
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
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
// GESTIÓN DE GALERÍA
// =====================================================
class Gallery extends BaseModule {
  init() {
    this.selectors.tabButtons = document.querySelectorAll('.tab-btn');
    this.selectors.tabPanels = document.querySelectorAll('.galeria-grid');
    this.setupTabs();
    this.setupImageModal();
    this.setupLazyLoading();
  }

  setupTabs() {
    this.selectors.tabButtons.forEach(button => {
      this.addEventListener(button, 'click', () => {
        const tabName = button.getAttribute('data-tab');
        this.switchTab(tabName);
      });

      // Navegación con teclado
      this.addEventListener(button, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  switchTab(tabName) {
    // Actualizar botones
    this.selectors.tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-selected', 'true');

    // Actualizar paneles
    this.selectors.tabPanels.forEach(panel => {
      panel.classList.add('hidden');
      panel.setAttribute('aria-hidden', 'true');
    });

    const activePanel = document.getElementById(`galeria-${tabName}`);
    activePanel.classList.remove('hidden');
    activePanel.setAttribute('aria-hidden', 'false');

    AppState.currentGalleryTab = tabName;

    // Animación suave
    activePanel.style.opacity = '0';
    activePanel.style.transform = 'translateY(20px)';

    setTimeout(() => {
      activePanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      activePanel.style.opacity = '1';
      activePanel.style.transform = 'translateY(0)';
    }, 50);
  }

  setupImageModal() {
    const galleryImages = document.querySelectorAll('.galeria-img');
    galleryImages.forEach(img => {
      this.addEventListener(img, 'click', () => this.openImageModal(img));
      this.addEventListener(img, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openImageModal(img);
        }
      });
      // Hacer las imágenes focusables
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Abrir imagen en modal');
    });
  }

  openImageModal(img) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Imagen ampliada');
    modal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <button class="modal-close" aria-label="Cerrar modal">
            <i class="fas fa-times"></i>
          </button>
          <img src="${img.src}" alt="${img.alt}" class="modal-image">
          <div class="modal-caption">
            ${img.alt}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Cerrar modal
    const closeModal = () => {
      modal.classList.add('fade-out');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
      }, 300);
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });

    // Cerrar con Escape
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Focus management
    modal.querySelector('.modal-close').focus();
    Utils.trapFocus(modal.querySelector('.modal-content'));
  }

  setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

// =====================================================
// GESTIÓN DE EVENTOS Y CALENDARIO
// =====================================================
class EventManager extends BaseModule {
  init() {
    this.selectors.events = document.querySelectorAll('.evento');
    this.setupEventModal();
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
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-labelledby', 'modal-event-title');
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
                <p><i class="fas fa-clock" aria-hidden="true"></i> <span id="modal-event-time">${eventTime}</span></p>
                <p><i class="fas fa-map-marker-alt" aria-hidden="true"></i> <span id="modal-event-location">${eventLocation}</span></p>
                ${eventDescription ? `<p class="event-description">${eventDescription}</p>` : ''}
              </div>
              <div class="event-actions">
                <button class="btn-primario" id="add-to-calendar">
                  <i class="fas fa-calendar-plus" aria-hidden="true"></i> Agregar al Calendario
                </button>
                <button class="btn-secundario" id="share-event">
                  <i class="fas fa-share" aria-hidden="true"></i> Compartir
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
      if (descriptionElement) {
        descriptionElement.textContent = eventDescription;
      } else if (eventDescription) {
        const descriptionHTML = `<p class="event-description">${eventDescription}</p>`;
        this.modal.querySelector('.event-details').insertAdjacentHTML('beforeend', descriptionHTML);
      }
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
        document.dispatchEvent(new CustomEvent('modal-closed'));
      }, 300);
    };

    this.modal.querySelector('.modal-close').onclick = closeModal;
    this.modal.querySelector('.modal-backdrop').onclick = (e) => {
      if (e.target === e.currentTarget) closeModal();
    };

    // Cerrar con Escape
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Focus management
    this.modal.querySelector('.modal-close').focus();
    const untrapFocus = Utils.trapFocus(this.modal.querySelector('.modal-content'));
    document.dispatchEvent(new CustomEvent('modal-opened', { detail: { modal: this.modal } }));

    // Limpiar trap focus al cerrar
    this.modal.querySelector('.modal-close').addEventListener('click', untrapFocus);
    this.modal.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) untrapFocus();
    });
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
}

// =====================================================
// GESTIÓN DE DONACIONES
// =====================================================
class DonationManager extends BaseModule {
  init() {
    this.selectors.donationButtons = document.querySelectorAll('.btn-donar');
    this.setupDonationButtons();
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
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
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
                <p><i class="fas fa-phone" aria-hidden="true"></i> +34 670 72 72 47</p>
                <p><i class="fas fa-envelope" aria-hidden="true"></i> montelosolivo@gmail.com</p>
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
        document.dispatchEvent(new CustomEvent('modal-closed'));
      }, 300);
    };

    this.modal.querySelector('.modal-close').onclick = closeModal;
    this.modal.querySelector('.modal-backdrop').onclick = (e) => {
      if (e.target === e.currentTarget) closeModal();
    };

    // Cerrar con Escape
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Focus management
    this.modal.querySelector('.modal-close').focus();
    const untrapFocus = Utils.trapFocus(this.modal.querySelector('.modal-content'));
    document.dispatchEvent(new CustomEvent('modal-opened', { detail: { modal: this.modal } }));

    // Limpiar trap focus al cerrar
    this.modal.querySelector('.modal-close').addEventListener('click', untrapFocus);
    this.modal.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) untrapFocus();
    });
  }
}

// =====================================================
// GESTIÓN DE FORMULARIOS
// =====================================================
class Forms extends BaseModule {
  init() {
    this.setupContactForm();
    this.setupTestimonioForm();
    this.setupNewsletterForm();
  }

  setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    this.addEventListener(form, 'submit', async (e) => {
      e.preventDefault();
      if (this.validateContactForm(form)) {
        await this.submitContactForm(form);
      }
    });

    // Validación en tiempo real
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      this.addEventListener(input, 'blur', () => this.validateField(input));
      this.addEventListener(input, 'input', () => this.clearErrors(input));
    });
  }

  validateContactForm(form) {
    let isValid = true;
    const formData = new FormData(form);

    // Validar nombre
    const nombre = formData.get('nombre')?.trim();
    if (!nombre) {
      this.showFieldError('contact-nombre', 'El nombre es obligatorio');
      isValid = false;
    } else if (nombre.length < 2) {
      this.showFieldError('contact-nombre', 'El nombre debe tener al menos 2 caracteres');
      isValid = false;
    }

    // Validar email
    const email = formData.get('email')?.trim();
    if (!email) {
      this.showFieldError('contact-email', 'El email es obligatorio');
      isValid = false;
    } else if (!Utils.validateEmail(email)) {
      this.showFieldError('contact-email', 'Por favor, introduce un email válido');
      isValid = false;
    }

    // Validar teléfono (opcional)
    const telefono = formData.get('telefono')?.trim();
    if (telefono && !Utils.validatePhone(telefono)) {
      this.showFieldError('contact-telefono', 'Por favor, introduce un teléfono válido');
      isValid = false;
    }

    // Validar tema
    const tema = formData.get('tema');
    if (!tema) {
      this.showFieldError('contact-tema', 'Por favor, selecciona un tema');
      isValid = false;
    }

    // Validar mensaje
    const mensaje = formData.get('mensaje')?.trim();
    if (!mensaje) {
      this.showFieldError('contact-mensaje', 'El mensaje es obligatorio');
      isValid = false;
    } else if (mensaje.length < 10) {
      this.showFieldError('contact-mensaje', 'El mensaje debe tener al menos 10 caracteres');
      isValid = false;
    }

    // Validar privacidad
    const privacidad = formData.get('privacidad');
    if (!privacidad) {
      this.showFieldError('contact-privacidad', 'Debes aceptar la política de privacidad');
      isValid = false;
    }

    return isValid;
  }

  async submitContactForm(form) {
    const submitBtn = form.querySelector('.btn-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Mostrar loading
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
      // Simular envío (aquí integrarías con tu backend)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mostrar mensaje de éxito
      this.showSuccessMessage();
      form.reset();
      Utils.showNotification('¡Mensaje enviado correctamente! Te responderemos pronto.', 'success');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      Utils.showNotification('Error al enviar el mensaje. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      // Ocultar loading
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      submitBtn.disabled = false;
    }
  }

  setupTestimonioForm() {
    const form = document.getElementById('testimonioForm');
    if (!form) return;

    this.addEventListener(form, 'submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const testimonio = {
        nombre: formData.get('nombre')?.trim() || 'Anónimo',
        texto: formData.get('testimonio')?.trim(),
        fecha: new Date().toISOString()
      };
      if (testimonio.texto && testimonio.texto.length >= 10) {
        this.addTestimonio(testimonio);
        form.reset();
        Utils.showNotification('¡Gracias por compartir tu testimonio!', 'success');
      } else {
        Utils.showNotification('Por favor, escribe un testimonio de al menos 10 caracteres.', 'error');
      }
    });
  }

  addTestimonio(testimonio) {
    AppState.testimonios.push(testimonio);
    console.log('Nuevo testimonio:', testimonio);

    // Guardar en localStorage como backup
    try {
      localStorage.setItem('testimonios_monte_olivos', JSON.stringify(AppState.testimonios));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  setupNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    this.addEventListener(form, 'submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const errorSpan = form.querySelector('.error-message');

      if (!email) {
        this.showInlineError(errorSpan, 'El email es obligatorio');
        return;
      }

      if (!Utils.validateEmail(email)) {
        this.showInlineError(errorSpan, 'Por favor, introduce un email válido');
        return;
      }

      const submitBtn = form.querySelector('.btn-newsletter');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suscribiendo...';
      submitBtn.disabled = true;

      try {
        // Simular suscripción
        await new Promise(resolve => setTimeout(resolve, 1500));
        Utils.showNotification('¡Te has suscrito correctamente al boletín!', 'success');
        form.reset();
        this.clearInlineError(errorSpan);
      } catch (error) {
        Utils.showNotification('Error al suscribirse. Inténtalo de nuevo.', 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.required;

    this.clearErrors(field);
    if (required && !value) {
      this.showFieldError(field.id, 'Este campo es obligatorio');
      return false;
    }
    if (type === 'email' && value && !Utils.validateEmail(value)) {
      this.showFieldError(field.id, 'Por favor, introduce un email válido');
      return false;
    }
    if (type === 'tel' && value && !Utils.validatePhone(value)) {
      this.showFieldError(field.id, 'Por favor, introduce un teléfono válido');
      return false;
    }
    return true;
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId.replace('contact-', '')}-error`);

    if (field) {
      field.classList.add('error');
      field.setAttribute('aria-invalid', 'true');
    }

    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.setAttribute('aria-live', 'polite');
    }
  }

  clearErrors(field) {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');

    const fieldId = field.id;
    const errorSpan = document.getElementById(`${fieldId.replace('contact-', '')}-error`);

    if (errorSpan) {
      errorSpan.textContent = '';
    }
  }

  showInlineError(errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearInlineError(errorElement) {
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  showSuccessMessage() {
    const existingMessage = document.getElementById('mensaje-confirmacion');
    if (existingMessage) {
      existingMessage.classList.remove('hidden');
      setTimeout(() => {
        existingMessage.classList.add('hidden');
      }, 5000);
    }
  }
}

// =====================================================
// GESTIÓN DE RECURSOS ESPIRITUALES
// =====================================================
class RecursosEspirituales extends BaseModule {
  init() {
    this.setupVersiculoDelDia();
    this.setupRecursoButtons();
  }

  setupVersiculoDelDia() {
    const botonNuevoVersiculo = document.getElementById('nuevo-versiculo');
    if (botonNuevoVersiculo) {
      this.addEventListener(botonNuevoVersiculo, 'click', () => {
        this.cambiarVersiculo();
      });
    }
    // Cambiar versículo automáticamente cada día
    this.verificarVersiculoDiario();
  }

  cambiarVersiculo() {
    const versiculoTexto = document.getElementById('versiculo-texto');
    const versiculoCita = document.querySelector('#recursos cite');
    if (!versiculoTexto || !versiculoCita) return;

    const versiculoRandom = CONFIG.versiculos[Math.floor(Math.random() * CONFIG.versiculos.length)];

    // Animación de cambio
    versiculoTexto.style.opacity = '0';
    versiculoCita.style.opacity = '0';

    setTimeout(() => {
      versiculoTexto.textContent = versiculoRandom.texto;
      versiculoCita.textContent = `— ${versiculoRandom.cita}`;

      versiculoTexto.style.transition = 'opacity 0.5s ease';
      versiculoCita.style.transition = 'opacity 0.5s ease';
      versiculoTexto.style.opacity = '1';
      versiculoCita.style.opacity = '1';
    }, 250);

    // Guardar último versículo y fecha
    try {
      localStorage.setItem('ultimo_versiculo', JSON.stringify({
        versiculo: versiculoRandom,
        fecha: new Date().toDateString()
      }));
    } catch (e) {
      console.warn('No se pudo guardar el versículo:', e);
    }
  }

  verificarVersiculoDiario() {
    try {
      const ultimoVersiculo = localStorage.getItem('ultimo_versiculo');
      if (ultimoVersiculo) {
        const data = JSON.parse(ultimoVersiculo);
        const fechaHoy = new Date().toDateString();

        // Si es un nuevo día, cambiar el versículo
        if (data.fecha !== fechaHoy) {
          this.cambiarVersiculo();
        }
      }
    } catch (e) {
      console.warn('Error al verificar versículo diario:', e);
    }
  }

  setupRecursoButtons() {
    const recursoButtons = document.querySelectorAll('.btn-recurso');
    recursoButtons.forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        const buttonText = button.textContent.trim().toLowerCase();
        if (buttonText.includes('escuchar')) {
          this.handleSermonesClick();
        } else if (buttonText.includes('descargar')) {
          this.handleEstudiosClick();
        } else if (buttonText.includes('ver plan')) {
          this.handleLecturaClick();
        } else if (buttonText.includes('enviar')) {
          this.handleOracionClick();
        }
      });
    });
  }

  handleSermonesClick() {
    Utils.showNotification('Próximamente tendremos sermones disponibles para escuchar online.', 'info');
  }

  handleEstudiosClick() {
    Utils.showNotification('Los materiales de estudio estarán disponibles próximamente.', 'info');
  }

  handleLecturaClick() {
    Utils.showNotification('Plan de lectura bíblica en desarrollo. ¡Pronto estará disponible!', 'info');
  }

  handleOracionClick() {
    Utils.scrollToElement(document.getElementById('contacto'));
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
      Utils.trapFocus(modal.querySelector('.modal-content'));
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
      this.modules.push(new Navigation());
      this.modules.push(new ScrollManager());
      this.modules.push(new Gallery());
      this.modules.push(new EventManager());
      this.modules.push(new DonationManager());
      this.modules.push(new Forms());
      this.modules.push(new RecursosEspirituales());
      this.modules.push(new AccessibilityManager());

      this.modules.forEach(module => module.init());

      // Configuración adicional
      this.setupErrorHandling();
      this.setupOfflineSupport();
      this.restoreUserPreferences();

      this.isInitialized = true;
      console.log('✅ Monte de los Olivos App inicializada correctamente');

      // Ocultar loading después de un breve delay
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
window.addToCalendar = (title, time) => {
  if (window.EventManager) window.EventManager.addToCalendar(title, time);
};
window.shareEvent = (title) => {
  if (window.EventManager) window.EventManager.shareEvent(title);
};
window.cambiarVersiculo = () => {
  if (window.RecursosEspirituales) window.RecursosEspirituales.cambiarVersiculo();
};

// =====================================================
// GESTIÓN DE COOKIES Y CONSENTIMIENTO (ACTUALIZADO)
// =====================================================
class CookieManager extends BaseModule {
  constructor() {
    super();
    this.cookieBanner = document.getElementById('cookie-consent-banner');
    this.cookieSettingsModal = document.getElementById('cookie-settings-modal');
    this.cookieSettingsBtn = document.getElementById('cookie-settings-btn');
    this.cookieAcceptBtn = document.getElementById('cookie-accept-btn');
    this.cookieRejectBtn = document.getElementById('cookie-reject-btn');
    this.cookieSaveSettingsBtn = document.getElementById('cookie-save-settings');
    this.cookieModalCloseBtn = this.cookieSettingsModal?.querySelector('.modal-close');
    this.gtmLoaded = false;
    this.hotjarLoaded = false;
  }

  // ... (métodos anteriores como init, loadCookiePreferences, etc.)

  /**
   * Aplica las preferencias de cookies y carga scripts externos según el consentimiento.
   */
  applyCookiePreferences(preferences) {
    console.log('Aplicando preferencias de cookies:', preferences);

    // Google Tag Manager (GTM)
    if (preferences.performance && !this.gtmLoaded) {
      this.loadGTM();
      this.gtmLoaded = true;
    }

    // Hotjar
    if (preferences.performance && !this.hotjarLoaded) {
      this.loadHotjar();
      this.hotjarLoaded = true;
    }
  }

  /**
   * Carga Google Tag Manager dinámicamente.
   */
  loadGTM() {
    // Cargar el script de GTM
    const gtmScript = document.createElement('script');
    gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXX'; // Reemplaza GTM-XXXXXX con tu ID de GTM
    gtmScript.async = true;
    document.head.appendChild(gtmScript);

    // Configurar el dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID'); // Reemplaza con tu ID de Google Analytics si lo usas

    console.log('Google Tag Manager cargado');
  }

  /**
   * Carga Hotjar dinámicamente.
   */
  loadHotjar() {
    // Script de Hotjar
    const hotjarScript = document.createElement('script');
    hotjarScript.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:XXXXXX,hjsv:6}; // Reemplaza XXXXXX con tu ID de Hotjar
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(hotjarScript);

    console.log('Hotjar cargado');
  }

  // ... (resto de los métodos)
}
