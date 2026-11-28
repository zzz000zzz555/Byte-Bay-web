/* Protección básica de formularios públicos: señuelo anti-bots y límite de envíos.
   Se registra en fase capture para actuar antes de los manejadores de cada formulario. */
(function () {
  'use strict';

  var LIMITS = { claimsForm: 10000, productCommentForm: 6000, notifyForm: 4000, aiAssistantForm: 1000 };
  var DEFAULT_LIMIT = 3000;
  var MESSAGE = 'Envía nuevamente en unos segundos.';

  function notify(form, message) {
    var status = form.querySelector('.legal-status, .claims-status, .notify-status, [role="status"], [aria-live="polite"]');
    if (status && 'textContent' in status) {
      status.textContent = message;
      if (status.setAttribute) status.setAttribute('data-error', 'true');
    } else if (window.showToast) {
      window.showToast(message);
    }
  }

  function lastSentKey(form) {
    return 'bytebay_form_guard_' + (form.id || form.name || 'sin_id');
  }

  function prepare(form) {
    if (form.dataset.publicFormReady) return;
    form.dataset.publicFormReady = 'true';
    var honeypot = form.querySelector('input[name="website"]');
    if (!honeypot) {
      var label = document.createElement('label');
      label.className = 'bb-honeypot';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = 'No completar este campo';
      honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.tabIndex = -1;
      honeypot.autocomplete = 'off';
      label.appendChild(honeypot);
      form.insertBefore(label, form.firstChild);
    }
  }

  // Captura en document: se ejecuta antes de los manejadores definidos con
  // onsubmit o addEventListener directamente en cada formulario.
  document.addEventListener('submit', function (event) {
    var form = event.target && event.target.closest ? event.target.closest('form[data-public-form]') : null;
    if (!form) return;
    prepare(form);
    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && String(honeypot.value || '').trim()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    var now = Date.now();
    var limit = LIMITS[form.id] || DEFAULT_LIMIT;
    var last = 0;
    try { last = Number(localStorage.getItem(lastSentKey(form)) || 0); } catch (error) {}
    if (last && now - last < limit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      notify(form, MESSAGE);
      return;
    }
    try { localStorage.setItem(lastSentKey(form), String(now)); } catch (error) {}
  }, true);

  document.querySelectorAll('form[data-public-form]').forEach(prepare);
})();
