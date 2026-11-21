/* Accesibilidad de modales de la tienda (WCAG 2.1 AA).
   Añade foco inicial, focus trap y cierre con Escape a los diálogos que
   aún no lo implementan. No interfiere con los modales de site-privacy.js. */
(function () {
  'use strict';
  var SELECTOR = '#checkoutModal, #cartDrawer, #productModal, #accountModal';
  var focoPrevio = null;
  var abierto = null;

  function focusables(modal) {
    return Array.prototype.slice.call(
      modal.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
    ).filter(function (n) {
      return !n.disabled && n.tabIndex !== -1 && n.offsetParent !== null;
    });
  }

  function esVisible(modal) {
    return modal.classList.contains('open') &&
      modal.getAttribute('aria-hidden') !== 'true' &&
      getComputedStyle(modal).display !== 'none';
  }

  function abrir(modal) {
    if (abierto === modal) return;
    if (!abierto && !focoPrevio) focoPrevio = document.activeElement;
    abierto = modal;
    var primero = focusables(modal)[0];
    if (primero) window.setTimeout(function () { primero.focus({ preventScroll: true }); }, 60);
  }

  function cerrar(modal) {
    if (abierto === modal) abierto = null;
    if (focoPrevio && document.contains(focoPrevio)) {
      var anterior = focoPrevio;
      focoPrevio = null;
      window.setTimeout(function () { anterior.focus({ preventScroll: true }); }, 30);
    }
  }

  document.addEventListener('keydown', function (e) {
    var modal = abierto;
    if (!modal || !esVisible(modal)) {
      var visibles = Array.prototype.slice.call(document.querySelectorAll(SELECTOR)).filter(esVisible);
      modal = visibles[visibles.length - 1] || null;
      if (modal) abrir(modal);
    }
    if (!modal || !esVisible(modal)) return;

    if (e.key === 'Escape') {
      var botonCerrar = modal.querySelector('[aria-label="Cerrar"], [data-close], .modal-close');
      if (botonCerrar) { botonCerrar.click(); return; }
      if (typeof window.closeCheckout === 'function' && modal.id === 'checkoutModal') { window.closeCheckout(); return; }
      if (typeof window.closeProductModal === 'function' && modal.id === 'productModal') { window.closeProductModal(); return; }
      if (typeof window.closeAccountModal === 'function' && modal.id === 'accountModal') { window.closeAccountModal(); return; }
      if (typeof window.toggleCart === 'function' && modal.id === 'cartDrawer') { window.toggleCart(false); return; }
      return;
    }

    if (e.key !== 'Tab') return;
    var nodos = focusables(modal);
    if (!nodos.length) return;
    var primero = nodos[0];
    var ultimo = nodos[nodos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  function observar() {
    Array.prototype.slice.call(document.querySelectorAll(SELECTOR)).forEach(function (modal) {
      if (modal.dataset.a11yBound) return;
      modal.dataset.a11yBound = '1';
      var observer = new MutationObserver(function () {
        if (esVisible(modal)) abrir(modal);
        else if (abierto === modal) cerrar(modal);
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
      if (esVisible(modal)) abrir(modal);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar);
  else observar();
})();
