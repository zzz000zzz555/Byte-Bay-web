(function () {
  'use strict';

  var mascot = document.querySelector('#bbMascot');
  var trigger = document.querySelector('#aiAssistantToggle');
  var panel = document.querySelector('#aiAssistantPanel');
  var closeButton = document.querySelector('#aiAssistantClose');
  var voiceButton = document.querySelector('#bbMascotVoiceToggle');
  var activeButton = document.querySelector('#bbMascotActiveToggle');
  var resetButton = document.querySelector('#bbMascotResetPos');
  var bubble = document.querySelector('#bbMascotBubble');
  var glint = document.querySelector('.bb-mascot__glint');

  if (!mascot || !trigger || !panel) return;

  var KEY_VOICE = 'bytebay_mascot_voice';
  var KEY_ACTIVE = 'bytebay_mascot_active';
  var KEY_POS = 'byte_mascot_pos';
  var GREETING = '¡Hola! Soy Byte, tu asistente en Byte-Bay. ¿En qué te ayudo?';
  var CURIOUS_TEXT = '¿Dudas con algún producto?';
  var CART_TEXT = '¡Excelente elección!';
  var DRAG_TEXTS = ['¡Wiii!', '¡A volar!'];
  var DRAG_THRESHOLD = 5;
  var CURIOUS_AFTER = 15000;
  var SLEEP_AFTER = 90000;
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
      /* Preferencias no disponibles: Byte sigue funcionando en esta sesión. */
    }
  }

  function readPos() {
    try {
      var raw = window.localStorage.getItem(KEY_POS);
      if (!raw) return null;
      var value = JSON.parse(raw);
      var x = Number(value && value.x);
      var y = Number(value && value.y);
      if (!isFinite(x) || !isFinite(y)) return null;
      return { x: x, y: y };
    } catch (error) {
      return null;
    }
  }

  function savePos(position) {
    try {
      window.localStorage.setItem(KEY_POS, JSON.stringify({ x: Math.round(position.x), y: Math.round(position.y) }));
    } catch (error) {
      /* Posición no persistida: el arrastre sigue activo en esta sesión. */
    }
  }

  function clearPos() {
    try {
      window.localStorage.removeItem(KEY_POS);
    } catch (error) {
      /* Sin almacenamiento disponible. */
    }
  }

  var state = {
    voice: readFlag(KEY_VOICE, true),
    active: readFlag(KEY_ACTIVE, true),
    lastGreeting: 0,
    lastActivity: Date.now(),
    curiousShown: false,
    sleeping: false,
    dragging: false
  };

  var bubbleTimer = null;
  var clickTimer = null;
  var lastTap = 0;
  var lastCelebration = 0;
  var lookCenter = { x: 0, y: 0 };
  var pendingLook = null;
  var drag = {
    active: false, moved: false, pointerId: null,
    startX: 0, startY: 0, lastX: 0, lastY: 0, baseX: 0, baseY: 0
  };

  function motionOff() {
    var fx = document.documentElement.getAttribute('data-season-fx');
    return document.body.classList.contains('bb-mascot-inactive') ||
      fx === 'off' || fx === 'reduced' ||
      Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

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

  function showBubble(text, ms) {
    if (!bubble) return;
    bubble.textContent = text;
    mascot.classList.add('has-bubble');
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(function () {
      mascot.classList.remove('has-bubble');
      bubble.textContent = '';
      bubbleTimer = null;
    }, ms || 1200);
  }

  function hideBubble() {
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = null;
    mascot.classList.remove('has-bubble');
    if (bubble) bubble.textContent = '';
  }

  function playClass(className, ms) {
    if (motionOff()) return;
    mascot.classList.remove(className);
    void mascot.offsetWidth;
    mascot.classList.add(className);
    window.setTimeout(function () { mascot.classList.remove(className); }, ms);
  }

  function noteActivity() {
    state.lastActivity = Date.now();
    if (state.curiousShown) {
      mascot.classList.remove('is-curious');
      state.curiousShown = false;
    }
    if (state.sleeping && state.active) {
      state.sleeping = false;
      mascot.classList.remove('is-sleeping');
    }
  }

  function applyPreferences() {
    document.body.classList.toggle('bb-mascot-inactive', !state.active);
    setControl(voiceButton, '🔊', '🔇', 'Silenciar voz de Byte', 'Activar voz de Byte', state.voice);
    setControl(activeButton, '👾', '🚫', 'Desactivar animaciones de Byte', 'Activar animaciones de Byte', state.active);
    if (!state.voice) stopSpeaking();
    if (!state.active) {
      state.sleeping = true;
      mascot.classList.add('is-sleeping');
      mascot.classList.remove('is-curious');
      state.curiousShown = false;
    } else {
      noteActivity();
    }
  }

  function syncBusyState() {
    var expanded = !panel.classList.contains('hidden');
    trigger.setAttribute('aria-expanded', String(expanded));
    mascot.setAttribute('aria-expanded', String(expanded));
    var blocking = document.body.classList.contains('checkout-open') ||
      expanded ||
      Boolean(document.querySelector('.modal.open, .account-modal.open, .info-modal.open, .bb-modal.open, .claims-modal.open, .orders-modal.open, .settings-drawer.is-open, .settings-backdrop.is-open, .cookie-banner:not(.hidden), .bb-consent-banner:not(.hidden), dialog[open]'));
    document.body.classList.toggle('bb-mascot-hidden', blocking);
    if (blocking) {
      hideBubble();
      mascot.classList.remove('is-curious');
      state.curiousShown = false;
    }
  }

  function metrics() {
    var rect = mascot.getBoundingClientRect();
    return { w: rect.width || 78, h: rect.height || 84 };
  }

  function refreshLookCenter() {
    var rect = mascot.getBoundingClientRect();
    if (!rect.width) return;
    lookCenter.x = rect.left + rect.width / 2;
    lookCenter.y = rect.top + rect.height / 2;
    mascot.classList.toggle('is-top', rect.top < 110);
    mascot.classList.toggle('is-bottom', rect.bottom > window.innerHeight - 20);
  }

  function clampPoint(x, y) {
    var size = metrics();
    var maxX = Math.max(0, window.innerWidth - size.w);
    var maxY = Math.max(0, window.innerHeight - size.h);
    return { x: Math.min(maxX, Math.max(0, x)), y: Math.min(maxY, Math.max(0, y)) };
  }

  function setPosition(x, y) {
    var point = clampPoint(x, y);
    mascot.style.left = point.x + 'px';
    mascot.style.top = point.y + 'px';
    mascot.style.right = 'auto';
    mascot.style.bottom = 'auto';
    refreshLookCenter();
    return point;
  }

  function restorePosition() {
    var saved = readPos();
    if (!saved) return;
    mascot.style.left = saved.x + 'px';
    mascot.style.top = saved.y + 'px';
    mascot.style.right = 'auto';
    mascot.style.bottom = 'auto';
    refreshLookCenter();
  }

  function normalizePosition() {
    refreshLookCenter();
    if (!mascot.style.left || !mascot.style.top) return;
    var rect = mascot.getBoundingClientRect();
    if (!rect.width) return;
    setPosition(rect.left, rect.top);
  }

  function resetPosition() {
    clearPos();
    mascot.style.left = '';
    mascot.style.top = '';
    mascot.style.right = '';
    mascot.style.bottom = '';
    mascot.style.removeProperty('--bb-tilt');
    refreshLookCenter();
    playClass('is-landing', 460);
    noteActivity();
  }

  function celebrate() {
    var now = Date.now();
    if (now - lastCelebration < 700) return;
    lastCelebration = now;
    playClass('is-celebrating', 760);
    showBubble('¡Yay!', 900);
    noteActivity();
  }

  function reactToCart() {
    if (!state.active) return;
    playClass('is-happy', 740);
    showBubble(CART_TEXT, 1400);
    noteActivity();
  }

  function openChatAndGreet() {
    trigger.click();
    var now = Date.now();
    if (now - state.lastGreeting > 900) {
      state.lastGreeting = now;
      speak(GREETING);
    }
    noteActivity();
  }

  function activate() {
    var now = Date.now();
    if (now - lastTap < 320) {
      if (clickTimer) {
        window.clearTimeout(clickTimer);
        clickTimer = null;
      }
      lastTap = 0;
      celebrate();
      return;
    }
    lastTap = now;
    if (clickTimer) window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(function () {
      clickTimer = null;
      openChatAndGreet();
    }, 230);
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (document.body.classList.contains('bb-mascot-hidden')) return;
    var rect = mascot.getBoundingClientRect();
    if (!rect.width) return;
    noteActivity();
    hideBubble();
    drag.active = true;
    drag.moved = false;
    drag.pointerId = event.pointerId === undefined ? null : event.pointerId;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.baseX = rect.left;
    drag.baseY = rect.top;
    if (typeof mascot.setPointerCapture === 'function' && drag.pointerId !== null) {
      try { mascot.setPointerCapture(drag.pointerId); } catch (error) { /* Sin captura disponible. */ }
    }
  }

  function onPointerMove(event) {
    if (!drag.active) return;
    if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return;
    var dx = event.clientX - drag.startX;
    var dy = event.clientY - drag.startY;
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
    event.preventDefault();
    if (!drag.moved) {
      drag.moved = true;
      state.dragging = true;
      mascot.classList.add('is-dragging');
      mascot.classList.remove('is-curious', 'is-sleeping', 'is-happy', 'is-landing');
      state.curiousShown = false;
      document.body.classList.add('bb-mascot-dragging');
      showBubble(DRAG_TEXTS[Math.floor(Math.random() * DRAG_TEXTS.length)], 1600);
    }
    var position = setPosition(drag.baseX + dx, drag.baseY + dy);
    var tilt = (event.clientX - drag.lastX) * 1.2 + (position.x - drag.baseX) * 0.03;
    tilt = Math.max(-12, Math.min(12, tilt));
    mascot.style.setProperty('--bb-tilt', tilt.toFixed(2) + 'deg');
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  }

  function endDrag(event, cancelled) {
    if (!drag.active) return;
    if (drag.pointerId !== null && event && event.pointerId !== undefined && event.pointerId !== drag.pointerId) return;
    drag.active = false;
    if (typeof mascot.releasePointerCapture === 'function' && drag.pointerId !== null) {
      try {
        if (typeof mascot.hasPointerCapture !== 'function' || mascot.hasPointerCapture(drag.pointerId)) {
          mascot.releasePointerCapture(drag.pointerId);
        }
      } catch (error) { /* Captura ya liberada. */ }
    }
    var wasMoved = drag.moved;
    drag.moved = false;
    state.dragging = false;
    drag.pointerId = null;
    if (wasMoved) {
      mascot.classList.remove('is-dragging');
      document.body.classList.remove('bb-mascot-dragging');
      mascot.style.setProperty('--bb-tilt', '0deg');
      var rect = mascot.getBoundingClientRect();
      savePos(setPosition(rect.left, rect.top));
      playClass('is-landing', 460);
      noteActivity();
    } else if (!cancelled) {
      activate();
    }
  }

  function updateLook() {
    var x = 0;
    var y = 0;
    if (pendingLook && !motionOff() && lookCenter.x) {
      var nx = (pendingLook.x - lookCenter.x) / Math.max(1, window.innerWidth / 2);
      var ny = (pendingLook.y - lookCenter.y) / Math.max(1, window.innerHeight / 2);
      x = Math.max(-1, Math.min(1, nx)) * 5;
      y = Math.max(-1, Math.min(1, ny)) * 4;
    }
    mascot.style.setProperty('--bb-look-x', x.toFixed(2) + 'px');
    mascot.style.setProperty('--bb-look-y', y.toFixed(2) + 'px');
    if (glint) glint.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
  }

  (function addSparks() {
    var i;
    for (i = 0; i < 8; i += 1) {
      var spark = document.createElement('span');
      spark.className = 'bb-mascot__spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.style.setProperty('--i', String(i));
      mascot.appendChild(spark);
    }
  }());

  document.body.classList.add('bb-mascot-ready');
  restorePosition();
  applyPreferences();
  syncBusyState();
  normalizePosition();

  mascot.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', function (event) { endDrag(event, false); });
  document.addEventListener('pointercancel', function (event) { endDrag(event, true); });
  mascot.addEventListener('click', function (event) {
    if (event.detail === 0) activate();
  });
  mascot.addEventListener('dblclick', function (event) {
    event.preventDefault();
    if (clickTimer) {
      window.clearTimeout(clickTimer);
      clickTimer = null;
    }
    lastTap = 0;
    celebrate();
  });

  document.addEventListener('pointermove', function (event) {
    pendingLook = { x: event.clientX, y: event.clientY };
    noteActivity();
    updateLook();
  }, { passive: true });

  window.setInterval(function () {
    if (!state.active || state.dragging || document.body.classList.contains('bb-mascot-hidden')) return;
    var idle = Date.now() - state.lastActivity;
    if (idle >= SLEEP_AFTER) {
      if (!state.sleeping) {
        state.sleeping = true;
        mascot.classList.add('is-sleeping');
      }
      mascot.classList.remove('is-curious');
      state.curiousShown = false;
      return;
    }
    if (idle >= CURIOUS_AFTER && !state.curiousShown && !state.sleeping && panel.classList.contains('hidden')) {
      state.curiousShown = true;
      mascot.classList.add('is-curious');
      showBubble(CURIOUS_TEXT, 2800);
    }
  }, 1000);

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var add = target.closest('.add, #modalAddToCart, .add-to-cart, [data-add-to-cart]');
    if (!add || add.disabled || add.getAttribute('aria-disabled') === 'true') return;
    reactToCart();
  }, true);

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

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      resetPosition();
    });
  }

  window.addEventListener('resize', normalizePosition, { passive: true });
  window.addEventListener('scroll', refreshLookCenter, { passive: true });

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
    celebrate: celebrate,
    resetPosition: resetPosition,
    preferences: state
  };
}());
