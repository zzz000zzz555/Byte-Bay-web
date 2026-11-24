/* Consentimiento de cookies y almacenamiento local.
   La decisión se guarda en bytebay_cookie_consent_v1 y no depende del inicio de sesión.
   El banner aparece cuando ya se resolvió el aviso de personalización de BBPrivacy,
   para que nunca se superponga con él ni con las mascotas. */
(function () {
  'use strict';

  var KEY = 'bytebay_cookie_consent_v1';
  var banner = document.getElementById('cookieConsent');
  if (!banner) return;

  var personalization = document.getElementById('personalizationConsent');
  var configPanel = document.getElementById('cookieConfigPanel');
  var analyticsToggle = document.getElementById('cookieAnalyticsToggle');

  function readConsent() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveConsent(analytics) {
    var value = {
      esenciales: true,
      analiticas: Boolean(analytics),
      guardado_en: new Date().toISOString()
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch (error) {
      /* Sin almacenamiento local la decisión dura solo esta sesión. */
    }
    return value;
  }

  function hide() {
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
    if (configPanel) configPanel.hidden = true;
  }

  function show() {
    banner.classList.remove('hidden');
    banner.setAttribute('aria-hidden', 'false');
  }

  function personalizationVisible() {
    return Boolean(personalization && !personalization.classList.contains('hidden'));
  }

  function maybeShow() {
    if (readConsent() || personalizationVisible() || document.body.classList.contains('checkout-open')) {
      hide();
      return;
    }
    show();
  }

  function bind(id, handler) {
    var node = document.getElementById(id);
    if (node) node.addEventListener('click', handler);
  }

  bind('cookieAccept', function () { saveConsent(true); hide(); });
  bind('cookieEssential', function () { saveConsent(false); hide(); });
  bind('cookieConfigure', function () {
    if (!configPanel) return;
    configPanel.hidden = !configPanel.hidden;
    if (!configPanel.hidden && analyticsToggle) analyticsToggle.focus();
  });
  bind('cookieSave', function () {
    saveConsent(Boolean(analyticsToggle && analyticsToggle.checked));
    hide();
  });

  if (personalization && window.MutationObserver) {
    new MutationObserver(maybeShow).observe(personalization, { attributes: true, attributeFilter: ['class'] });
  }
  [250, 900, 2500].forEach(function (delay) { window.setTimeout(maybeShow, delay); });

  window.ByteBayCookieConsent = {
    get: readConsent,
    clear: function () {
      try { localStorage.removeItem(KEY); } catch (error) {}
      maybeShow();
    }
  };
})();
