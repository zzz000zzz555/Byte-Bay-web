(function () {
  'use strict';

  var mascot = document.querySelector('#bbMascot');
  var trigger = document.querySelector('#aiAssistantToggle');
  var panel = document.querySelector('#aiAssistantPanel');
  var closeButton = document.querySelector('#aiAssistantClose');
  var voiceButton = document.querySelector('#bbMascotVoiceToggle');
  var activeButton = document.querySelector('#bbMascotActiveToggle');

  if (!mascot || !trigger || !panel) return;

  var KEY_VOICE = 'bytebay_mascot_voice';
  var KEY_ACTIVE = 'bytebay_mascot_active';
  var GREETING = '¡Hola! Bienvenido a Byte-Bay, soy tu asistente virtual. ¿Qué producto buscas hoy?';
  var synth = window.speechSynthesis || null;

  function readFlag(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      if (raw === 'true' || raw === '1') return true;
      if (raw === 'false' || raw === '0') return false;
      var value = JSON.parse(raw);
      return typeof value === 'boolean' ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveFlag(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      /* Preferencias no disponibles: la mascota sigue funcionando en esta sesión. */
    }
  }

  var state = {
    voice: readFlag(KEY_VOICE, true),
    active: readFlag(KEY_ACTIVE, true),
    lastGreeting: 0
  };

  function setControl(button, onIcon, offIcon, onLabel, offLabel, isOn) {
    if (!button) return;
    var icon = button.querySelector('[data-mascot-icon]');
    if (icon) icon.textContent = isOn ? onIcon : offIcon;
    var label = isOn ? onLabel : offLabel;
    button.setAttribute('aria-pressed', String(isOn));
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('data-tooltip', label);
  }

  function stopSpeaking() {
    if (synth) {
      try { synth.cancel(); } catch (error) { /* Navegador sin soporte estable. */ }
    }
    mascot.classList.remove('is-speaking');
  }

  function pickVoice(lang) {
    if (!synth || typeof synth.getVoices !== 'function') return null;
    try {
      var voices = synth.getVoices() || [];
      var i;
      for (i = 0; i < voices.length; i += 1) {
        if (voices[i].lang && voices[i].lang.toLowerCase() === lang.toLowerCase()) return voices[i];
      }
      for (i = 0; i < voices.length; i += 1) {
        if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('es') === 0) return voices[i];
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function cleanForSpeech(text) {
    return String(text || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(^|\n)\s{0,3}#{1,6}\s*/g, '$1')
      .replace(/(^|\n)\s{0,3}[-*+]\s+/g, '$1')
      .replace(/[*_~>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function speak(text) {
    if (!state.voice || !synth || typeof window.SpeechSynthesisUtterance !== 'function') return;
    var clean = cleanForSpeech(text);
    if (!clean) return;
    try {
      stopSpeaking();
      var utterance = new window.SpeechSynthesisUtterance(clean);
      var locale = String(window.navigator.language || '').toLowerCase();
      var lang = locale.indexOf('es-mx') === 0 || locale.indexOf('es-419') === 0 ? 'es-MX' : 'es-ES';
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      var voice = pickVoice(lang);
      if (voice) utterance.voice = voice;
      utterance.onstart = function () { mascot.classList.add('is-speaking'); };
      utterance.onend = function () { mascot.classList.remove('is-speaking'); };
      utterance.onerror = function () { mascot.classList.remove('is-speaking'); };
      synth.speak(utterance);
    } catch (error) {
      mascot.classList.remove('is-speaking');
    }
  }

  function applyPreferences() {
    document.body.classList.toggle('bb-mascot-inactive', !state.active);
    setControl(voiceButton, '🔊', '🔇', 'Silenciar voz de la mascota', 'Activar voz de la mascota', state.voice);
    setControl(activeButton, '👾', '🚫', 'Desactivar animaciones de la mascota', 'Activar animaciones de la mascota', state.active);
    if (!state.voice) stopSpeaking();
  }

  function syncBusyState() {
    var expanded = !panel.classList.contains('hidden');
    trigger.setAttribute('aria-expanded', String(expanded));
    mascot.setAttribute('aria-expanded', String(expanded));
    var blocking = document.body.classList.contains('checkout-open') ||
      expanded ||
      Boolean(document.querySelector('.modal.open, .account-modal.open, .info-modal.open, .bb-modal.open, .claims-modal.open, .orders-modal.open, .settings-drawer.is-open, .settings-backdrop.is-open, .cookie-banner:not(.hidden), .bb-consent-banner:not(.hidden), dialog[open]'));
    document.body.classList.toggle('bb-mascot-hidden', blocking);
  }

  document.body.classList.add('bb-mascot-ready');
  applyPreferences();
  syncBusyState();

  mascot.addEventListener('click', function () {
    var now = Date.now();
    trigger.click();
    if (now - state.lastGreeting > 900) {
      state.lastGreeting = now;
      speak(GREETING);
    }
  });

  if (closeButton) closeButton.addEventListener('click', stopSpeaking);

  if (voiceButton) {
    voiceButton.addEventListener('click', function () {
      state.voice = !state.voice;
      saveFlag(KEY_VOICE, state.voice);
      applyPreferences();
    });
  }

  if (activeButton) {
    activeButton.addEventListener('click', function () {
      state.active = !state.active;
      saveFlag(KEY_ACTIVE, state.active);
      applyPreferences();
    });
  }

  document.addEventListener('bytebay:ai-response', function (event) {
    if (!event.detail || !event.detail.respuesta) return;
    if (panel.classList.contains('hidden')) return;
    speak(event.detail.respuesta);
  });

  if (typeof window.MutationObserver === 'function') {
    var observer = new window.MutationObserver(syncBusyState);
    var observed = [panel, document.body, document.querySelector('#productModal'), document.querySelector('#accountModal'), document.querySelector('#checkoutModal'), document.querySelector('#claimsModal'), document.querySelector('#ordersModal'), document.querySelector('#settingsDrawer'), document.querySelector('#settingsBackdrop'), document.querySelector('#personalizationConsent'), document.querySelector('.cookie-banner'), document.querySelector('dialog')];
    var options = { attributes: true, attributeFilter: ['class', 'hidden', 'open'] };
    observed.forEach(function (element) {
      if (element) observer.observe(element, options);
    });
  }

  window.ByteBayMascot = {
    speak: speak,
    stop: stopSpeaking,
    preferences: state
  };
}());
