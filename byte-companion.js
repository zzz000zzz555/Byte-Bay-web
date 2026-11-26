/* Byte Companion: física spring, voz, chat y actividades espontáneas en reposo.
   Toda la posición se resuelve con transform: translate3d(); el SVG viaja con el contenedor. */
(function () {
  'use strict';

  var KEY_VOICE = 'bytebay_mascot_voice';
  var BUSY_EVENT = 'bytebay:companion-busy';
  var KEY_ACTIVE = 'bytebay_mascot_active';
  var KEY_POCKET = 'bytebay_mascot_pocket';
  var KEY_POS = 'byte_mascot_pos';
  var GREETING = '¡Hola! Soy Byte, tu asistente en Byte-Bay. ¿En qué te ayudo?';
  var CURIOUS_TEXT = '¿Dudas con algún producto?';
  var CART_TEXT = '¡Excelente elección!';
  var DRAG_TEXTS = ['¡Wiii!', '¡A volar!'];
  var DRAG_THRESHOLD = 5;
  /* Byte es la mascota de la tienda; la racha mantiene su propio espacio. */
  var PERSONAL_SPACE = 180;
  var CURIOUS_AFTER = 15000;
  var SLEEP_AFTER = 90000;
  var ACTIVITY_MIN = 18000;
  var ACTIVITY_MAX = 30000;
  var FIXED_STEP = 1 / 240;
  var MAX_SUBSTEPS = 8;
  var SVG_ATTRS = 'viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON_VOICE_ON = '<svg ' + SVG_ATTRS + '><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="M16 9a4 4 0 0 1 0 6"></path><path d="M19 6a8 8 0 0 1 0 12"></path></svg>';
  var ICON_VOICE_OFF = '<svg ' + SVG_ATTRS + '><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="m17 9 4 6M21 9l-4 6"></path></svg>';
  var ICON_ACTIVE_ON = '<svg ' + SVG_ATTRS + '><rect x="4" y="7" width="16" height="12" rx="3"></rect><path d="M12 7V4"></path><circle cx="9" cy="13" r="1"></circle><circle cx="15" cy="13" r="1"></circle><path d="M9 16h6"></path></svg>';
  var ICON_ACTIVE_OFF = '<svg ' + SVG_ATTRS + '><rect x="4" y="7" width="16" height="12" rx="3"></rect><path d="M12 7V4"></path><path d="m5 3 14 18"></path></svg>';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function now() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

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
      /* Sin almacenamiento: Byte sigue funcionando durante la sesión. */
    }
  }

  function readPosition() {
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

  function savePosition(position) {
    try {
      window.localStorage.setItem(KEY_POS, JSON.stringify({
        x: Math.round(position.x),
        y: Math.round(position.y)
      }));
    } catch (error) {
      /* Posición no persistida: el arrastre sigue activo. */
    }
  }

  function clearPosition() {
    try {
      window.localStorage.removeItem(KEY_POS);
    } catch (error) {
      /* Sin almacenamiento disponible. */
    }
  }

  /* Mini-actividades: 18-30 s de espera, 4-7 s de duración y abort inmediato. */
  class IdleActivityManager {
    constructor(host) {
      this.host = host;
      this.options = ['ball', 'coffee', 'wave', 'console', 'dance'];
      this.current = null;
      this.last = '';
      this.startedAt = 0;
      this.duration = 0;
      this.timer = null;
      this.ball = { x: 0, y: -12, vy: -3.4, bounces: 0 };
    }

    schedule() {
      this.clearTimer();
      if (!this.host.state.active || this.host.state.quiet) return;
      var delay = ACTIVITY_MIN + Math.random() * (ACTIVITY_MAX - ACTIVITY_MIN);
      var self = this;
      this.timer = window.setTimeout(function () { self.trigger(); }, delay);
    }

    clearTimer() {
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = null;
    }

    enable() {
      this.schedule();
    }

    disable() {
      this.abort();
      this.clearTimer();
    }

    pick() {
      var cell = this.host.center;
      var pointer = this.host.pointer;
      if (pointer.active && Math.hypot(pointer.x - cell.x, pointer.y - cell.y) < 170 &&
          Date.now() - this.host.state.lastUserClick > 1200) {
        return 'wave';
      }
      var choices = this.options.filter(function (name) { return name !== this.last; }, this);
      return choices[Math.floor(Math.random() * choices.length)];
    }

    trigger() {
      this.clearTimer();
      if (!this.host.canPlay()) {
        this.schedule();
        return;
      }
      this.start(this.pick());
    }

    start(name) {
      if (this.current) this.abort();
      var host = this.host;
      var mascot = host.mascot;
      if (name === 'wave') {
        host.showBubble('¡Hola! Qué gusto verte', 1500, { countIgnored: true });
      }
      this.current = name;
      this.last = name;
      this.startedAt = Date.now();
      this.duration = 4000 + Math.random() * 3000;
      mascot.classList.add('is-activity', 'has-hands', 'is-' + name);
      if (name === 'ball') {
        this.ball = { x: 0, y: -12, vy: -3.4, bounces: 0 };
        this.writeBall();
      }
    }

    tick(time, delta) {
      if (!this.current) return;
      if (!this.host.canPlay()) {
        this.abort();
        return;
      }
      if (Date.now() - this.startedAt >= this.duration) {
        this.abort();
        this.schedule();
        return;
      }
      if (this.current === 'ball') this.updateBall(time, delta);
    }

    updateBall(time, delta) {
      var ball = this.ball;
      ball.vy += 0.26 * delta;
      ball.y += ball.vy * delta;
      ball.x = Math.sin(time / 110) * 5;
      if (ball.y > 2) {
        ball.y = 2;
        ball.vy = -Math.max(2.6, Math.abs(ball.vy) * 0.82);
        ball.bounces += 1;
      }
      this.writeBall();
    }

    writeBall() {
      var side = this.host.bounds.right ? -1 : 1;
      var mascot = this.host.mascot;
      mascot.style.setProperty('--bb-ball-x', (side * this.ball.x).toFixed(1) + 'px');
      mascot.style.setProperty('--bb-ball-y', this.ball.y.toFixed(1) + 'px');
    }

    abort() {
      var mascot = this.host.mascot;
      mascot.classList.remove('is-activity', 'has-hands', 'is-ball', 'is-coffee', 'is-wave', 'is-console', 'is-dance', 'is-meet');
      mascot.style.removeProperty('--bb-ball-x');
      mascot.style.removeProperty('--bb-ball-y');
      this.current = null;
      this.clearTimer();
    }

    onUserInteraction() {
      this.abort();
      this.schedule();
    }
  }

  class ByteCompanion {
    constructor() {
      this.mascot = document.querySelector('#bbMascot');
      this.trigger = document.querySelector('#aiAssistantToggle');
      this.panel = document.querySelector('#aiAssistantPanel');
      if (!this.mascot || !this.trigger || !this.panel) return;

      this.closeButton = document.querySelector('#aiAssistantClose');
      this.voiceButton = document.querySelector('#bbMascotVoiceToggle');
      this.activeButton = document.querySelector('#bbMascotActiveToggle');
      this.resetButton = document.querySelector('#bbMascotResetPos');
      this.pocketButton = document.querySelector('#bbMascotPocketToggle');
      this.bubble = document.querySelector('#bbMascotBubble');
      this.input = document.querySelector('#aiAssistantInput');
      this.form = document.querySelector('#aiAssistantForm');
      this.synth = window.speechSynthesis || null;
      this.mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

      this.state = {
        voice: readFlag(KEY_VOICE, true),
        active: readFlag(KEY_ACTIVE, true),
        pocket: readFlag(KEY_POCKET, false),
        pocketPreview: false,
        quiet: false,
        lastGreeting: 0,
        lastActivity: Date.now(),
        lastDecision: 0,
        lastUserClick: 0,
        lastTap: 0,
        lastCelebration: 0,
        nextProactiveAt: Date.now() + 5000,
        curiousShown: false,
        sleeping: false,
        dragging: false,
        thinking: false,
        listening: false,
        dockSide: null,
        bubbleIgnored: 0,
        bubbleActionable: false
      };

      this.physics = {
        current: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        tilt: 0,
        tiltTarget: 0,
        tiltVelocity: 0,
        look: { x: 0, y: 0 },
        lookTarget: { x: 0, y: 0 },
        lastTime: now(),
        accumulator: 0,
        everTicked: false
      };
      this.size = { w: 78, h: 84 };

      this.drag = {
        active: false, moved: false, pointerId: null,
        startX: 0, startY: 0, lastX: 0, lastY: 0, baseX: 0, baseY: 0
      };
      this.center = { x: 0, y: 0 };
      this.pointer = { x: 0, y: 0, active: false };
      this.bounds = { left: false, right: false, top: false, bottom: false };
      this.scroll = {
        lastY: window.scrollY || document.documentElement.scrollTop || 0,
        lastAt: Date.now(), lastDir: 0, reversals: 0
      };
      this.hover = { card: null, timer: null };
      this.timers = {};
      this.audio = null;
      this.rafId = 0;
      this.intervalId = 0;
      this.watchdog = null;
      this.blocked = null;
      this.activities = new IdleActivityManager(this);

      this.init();
    }

    init() {
      this.ensureDom();
      document.body.classList.add('bb-mascot-ready');
      this.measure();
      this.defaultPos = this.computeDefaultPosition();
      var saved = readPosition();
      var start = saved ? this.clampPoint(saved.x, saved.y) : this.defaultPos;
      this.physics.current.x = start.x;
      this.physics.current.y = start.y;
      this.physics.target.x = start.x;
      this.physics.target.y = start.y;
      this.center.x = start.x + this.metrics().w / 2;
      this.center.y = start.y + this.metrics().h / 2;

      this.applyPreferences();
      this.syncBusyState();
      this.refreshBoundsAndCenter();
      this.render();
      this.bindEvents();
      this.startLoop();
      this.activities.enable();
      this.scheduleBlink();
    }

    ensureDom() {
      var motion = this.mascot.querySelector('.bb-mascot__motion');
      if (!motion) {
        var figure = this.mascot.querySelector('.bb-mascot__figure');
        if (figure) {
          motion = document.createElement('span');
          motion.className = 'bb-mascot__motion';
          figure.parentNode.insertBefore(motion, figure);
          motion.appendChild(figure);
        }
      }
      this.motion = motion || this.mascot.querySelector('.bb-mascot__figure');
      this.figure = this.mascot.querySelector('.bb-mascot__figure');
      this.glint = this.mascot.querySelector('.bb-mascot__glint');
      this.leftHand = document.querySelector('#byte-left-hand');
      this.rightHand = document.querySelector('#byte-right-hand');
      this.ballElement = document.querySelector('#byte-ball');
      this.cupElement = document.querySelector('#byte-cup');
      this.consoleElement = document.querySelector('#byte-console');

      if (!this.mascot.querySelector('.bb-mascot__spark')) {
        for (var i = 0; i < 8; i += 1) {
          var spark = document.createElement('span');
          spark.className = 'bb-mascot__spark';
          spark.setAttribute('aria-hidden', 'true');
          spark.style.setProperty('--i', String(i));
          this.mascot.appendChild(spark);
        }
      }
    }

    bindEvents() {
      var self = this;
      this.mascot.addEventListener('pointerdown', function (event) { self.onPointerDown(event); });
      document.addEventListener('pointermove', function (event) { self.onDragMove(event); }, { passive: false });
      document.addEventListener('pointerup', function (event) { self.endDrag(event, false); });
      document.addEventListener('pointercancel', function (event) { self.endDrag(event, true); });
      document.addEventListener('pointermove', function (event) { self.onLookMove(event); }, { passive: true });
      this.mascot.addEventListener('pointerenter', function () {
        if (self.state.pocket) {
          self.state.pocketPreview = true;
          self.render();
        }
      });
      this.mascot.addEventListener('pointerleave', function () {
        if (self.state.pocket) {
          self.state.pocketPreview = false;
          self.render();
        }
      });
      this.mascot.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          self.activate();
        }
      });
      this.mascot.addEventListener('dblclick', function (event) {
        event.preventDefault();
        self.userTouched();
        self.celebrate();
      });
      document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        var add = target.closest('.add, #modalAddToCart, .add-to-cart, [data-add-to-cart]');
        if (!add || add.disabled || add.getAttribute('aria-disabled') === 'true') return;
        self.userTouched();
        self.noteDecision();
        self.reactToCart();
      }, true);

      if (this.closeButton) this.closeButton.addEventListener('click', function () { self.stopSpeaking(); });
      if (this.voiceButton) this.voiceButton.addEventListener('click', function () {
        self.userTouched();
        self.state.voice = !self.state.voice;
        saveFlag(KEY_VOICE, self.state.voice);
        self.applyPreferences();
      });
      if (this.activeButton) this.activeButton.addEventListener('click', function () {
        self.userTouched();
        self.state.active = !self.state.active;
        saveFlag(KEY_ACTIVE, self.state.active);
        self.applyPreferences();
      });
      if (this.resetButton) this.resetButton.addEventListener('click', function () {
        self.userTouched();
        self.resetPosition();
      });
      if (this.pocketButton) this.pocketButton.addEventListener('click', function () {
        self.userTouched();
        self.setPocket(!self.state.pocket);
      });
      if (this.input) {
        this.input.addEventListener('focus', function () {
          self.state.listening = true;
          self.mascot.classList.add('is-listening');
        });
        this.input.addEventListener('blur', function () {
          if (!self.state.thinking) {
            self.state.listening = false;
            self.mascot.classList.remove('is-listening');
          }
        });
      }

      document.addEventListener('pointerover', function (event) { self.onProductHoverStart(event); });
      document.addEventListener('pointerout', function (event) { self.onProductHoverEnd(event); });
      document.addEventListener('scroll', function () { self.onScroll(); }, { passive: true });
      window.addEventListener('resize', function () { self.normalizePosition(); }, { passive: true });
      window.addEventListener('scroll', function () { self.refreshBoundsAndCenter(); }, { passive: true });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          self.abortActivity();
          self.stopSpeaking();
        }
      });

      document.addEventListener('bytebay:ai-thinking', function () {
        self.userTouched();
        self.setThinking(true);
      });
      document.addEventListener('bytebay:ai-done', function () { self.setThinking(false); });
      window.addEventListener('bytebay:streak-meet', function (event) { self.onStreakMeet(event); });
      window.addEventListener('bytebay:streak-renamed', function (event) {
        var nombre = event && event.detail ? event.detail.nombre : '';
        if (nombre) self.showBubble('¡Qué buen nombre, ' + nombre + '! Queda guardado.', 1900);
      });
      window.addEventListener('bytebay:streak-rename-failed', function (event) {
        var nombre = event && event.detail ? event.detail.nombre : '';
        if (nombre) self.showBubble('Guardé "' + nombre + '" en este dispositivo; aún no sincroniza.', 1900);
      });
      document.addEventListener('bytebay:ai-response', function (event) {
        if (event.detail && event.detail.respuesta && !self.panel.classList.contains('hidden')) {
          self.speak(event.detail.respuesta);
        }
      });
      this.idleTimer = window.setInterval(function () { self.checkIdle(); }, 1000);

      if (typeof window.MutationObserver === 'function') {
        var observer = new window.MutationObserver(function () { self.syncBusyState(); });
        var observed = [
          this.panel, document.body,
          document.querySelector('#productModal'), document.querySelector('#accountModal'),
          document.querySelector('#checkoutModal'), document.querySelector('#cartDrawer'),
          document.querySelector('#claimsModal'),
          document.querySelector('#ordersModal'), document.querySelector('#settingsDrawer'),
          document.querySelector('#settingsBackdrop'), document.querySelector('#personalizationConsent'),
          document.querySelector('.cookie-banner'), document.querySelector('dialog')
        ];
        observed.forEach(function (element) {
          if (element) observer.observe(element, { attributes: true, attributeFilter: ['class', 'hidden', 'open'] });
        });
      }
    }

    motionOff() {
      var fx = document.documentElement.getAttribute('data-season-fx');
      return !this.state.active || fx === 'off' || fx === 'reduced' ||
        Boolean(this.mediaQuery && this.mediaQuery.matches);
    }

    canPlay() {
      return this.state.active && !this.motionOff() && !this.state.dragging && !this.state.quiet &&
        this.panel.classList.contains('hidden') &&
        !document.body.classList.contains('bb-mascot-hidden') &&
        document.visibilityState !== 'hidden' && Boolean(this.mascot.offsetWidth);
    }

    canShowProactive() {
      return this.canShowProactiveBase() && Date.now() >= this.state.nextProactiveAt;
    }

    canShowProactiveBase() {
      return this.state.active && !this.state.dragging && !this.activities.current &&
        this.panel.classList.contains('hidden') &&
        !document.body.classList.contains('bb-mascot-hidden') && !this.state.quiet;
    }

    measure() {
      if (!this.mascot) return;
      var w = this.mascot.offsetWidth;
      var h = this.mascot.offsetHeight;
      if (w > 0 && h > 0) this.size = { w: w, h: h };
    }

    metrics() {
      return this.size;
    }

    computeDefaultPosition() {
      var size = this.metrics();
      var inset = window.innerWidth < 768 ? 16 : 24;
      return {
        x: Math.max(0, window.innerWidth - size.w - inset),
        y: Math.max(0, window.innerHeight - size.h - inset)
      };
    }

    clampPoint(x, y) {
      var size = this.metrics();
      var maxX = Math.max(0, window.innerWidth - size.w);
      var maxY = Math.max(0, window.innerHeight - size.h);
      return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
    }

    refreshBoundsAndCenter() {
      var size = this.metrics();
      var x = this.physics.current.x;
      var y = this.physics.current.y;
      this.center.x = x + size.w / 2;
      this.center.y = y + size.h / 2;
      this.bounds.left = x < 90;
      this.bounds.right = x + size.w > window.innerWidth - 90;
      this.bounds.top = y < 110;
      this.bounds.bottom = y + size.h > window.innerHeight - 20;
      this.mascot.classList.toggle('is-near-left', this.bounds.left);
      this.mascot.classList.toggle('is-near-right', this.bounds.right);
      this.mascot.classList.toggle('is-top', this.bounds.top);
      this.mascot.classList.toggle('is-bottom', this.bounds.bottom);
      this.mascot.style.setProperty('--bb-ball-base-x', this.bounds.right ? '-72px' : '0px');
      this.mascot.style.setProperty('--bb-cup-base-x', this.bounds.right ? '-50px' : '0px');
    }

    /* La racha es otra mascota: si se acercan demasiado, Byte se aparta. */
    streakCenter() {
      if (document.body.classList.contains('bb-mascot-hidden')) return null;
      var streak = window.ByteBayStreak;
      var instance = streak && streak.instance;
      if (instance && instance.center && isFinite(instance.center.x) && isFinite(instance.center.y)) {
        return { x: instance.center.x, y: instance.center.y };
      }
      var node = document.querySelector('#bbStreak');
      if (!node || !node.offsetWidth || !document.body.classList.contains('bb-streak-ready')) return null;
      var rect = node.getBoundingClientRect();
      if (!rect.width) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    separate() {
      var other = this.streakCenter();
      if (!other) return;
      var dx = this.center.x - other.x;
      var dy = this.center.y - other.y;
      var distance = Math.hypot(dx, dy);
      if (distance >= PERSONAL_SPACE) return;
      if (distance < 1) {
        dx = this.physics.current.x <= other.x ? -1 : 1;
        dy = 0;
        distance = 1;
      }
      var push = (PERSONAL_SPACE - distance) / distance;
      var point = this.clampPoint(
        this.physics.current.x + dx * push,
        this.physics.current.y + dy * push
      );
      this.physics.current.x = point.x;
      this.physics.current.y = point.y;
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      this.physics.velocity.x = 0;
      this.physics.velocity.y = 0;
      this.refreshBoundsAndCenter();
    }

    setClass(name, on) {
      this.mascot.classList.toggle(name, Boolean(on));
    }

    setControl(button, onIcon, offIcon, onLabel, offLabel, isOn, iconAttribute) {
      if (!button) return;
      var icon = button.querySelector('[' + iconAttribute + ']');
      if (icon) icon.innerHTML = isOn ? onIcon : offIcon;
      var label = isOn ? onLabel : offLabel;
      button.setAttribute('aria-pressed', String(isOn));
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('data-tooltip', label);
    }

    applyPreferences() {
      document.body.classList.toggle('bb-mascot-inactive', !this.state.active);
      this.setControl(this.voiceButton, ICON_VOICE_ON, ICON_VOICE_OFF, 'Silenciar voz de Byte', 'Activar voz de Byte', this.state.voice, 'data-mascot-icon');
      this.setControl(this.activeButton, ICON_ACTIVE_ON, ICON_ACTIVE_OFF, 'Desactivar animaciones de Byte', 'Activar animaciones de Byte', this.state.active, 'data-mascot-icon');
      this.setControl(this.pocketButton, '⇤', '⇥', 'Mostrar Byte completo', 'Minimizar Byte al borde', this.state.pocket, 'data-mascot-pocket-icon');
      this.mascot.classList.toggle('is-pocket', this.state.pocket);
      if (!this.state.voice) this.stopSpeaking();
      if (!this.state.active) {
        this.state.sleeping = true;
        this.mascot.classList.add('is-sleeping');
        this.mascot.classList.remove('is-curious');
        this.state.curiousShown = false;
        this.activities.disable();
        this.cancelBlink();
      } else {
        this.noteActivity();
        this.activities.enable();
        this.scheduleBlink();
      }
    }

    syncBusyState() {
      var expanded = !this.panel.classList.contains('hidden');
      this.trigger.setAttribute('aria-expanded', String(expanded));
      this.mascot.setAttribute('aria-expanded', String(expanded));
      var consentVisible = Boolean(document.querySelector('.cookie-banner:not(.hidden), .bb-consent-banner:not(.hidden)'));
      var blocking = document.body.classList.contains('checkout-open') ||
        document.body.classList.contains('bb-wardrobe-open') || expanded ||
        Boolean(document.querySelector('.modal.open, .account-modal.open, .info-modal.open, .bb-modal.open, .claims-modal.open, .orders-modal.open, .cart-drawer.open, .settings-drawer.is-open, .settings-backdrop.is-open, dialog[open]'));
      var previouslyBlocked = this.blocked;
      document.body.classList.toggle('bb-mascot-hidden', blocking || consentVisible);
      document.body.classList.toggle('ui-blocking', blocking || consentVisible);
      this.blocked = blocking;
      if (previouslyBlocked !== blocking) {
        window.dispatchEvent(new CustomEvent(BUSY_EVENT, { detail: { blocking: blocking } }));
      }
      if (blocking) {
        this.hideBubble();
        this.mascot.classList.remove('is-curious', 'is-happy', 'is-landing');
        this.state.curiousShown = false;
        if (this.activities.current) this.abortActivity();
      }
    }

    noteActivity() {
      this.state.lastActivity = Date.now();
      if (this.state.curiousShown) {
        this.mascot.classList.remove('is-curious');
        this.state.curiousShown = false;
      }
      if (this.state.sleeping && this.state.active) {
        this.state.sleeping = false;
        this.mascot.classList.remove('is-sleeping');
      }
    }

    checkIdle() {
      if (!this.state.active || this.state.dragging || this.state.thinking ||
          this.state.quiet || !this.panel.classList.contains('hidden') ||
          document.body.classList.contains('bb-mascot-hidden')) return;
      var idle = Date.now() - this.state.lastActivity;
      if (idle >= SLEEP_AFTER) {
        if (!this.state.sleeping) {
          this.state.sleeping = true;
          this.mascot.classList.add('is-sleeping');
        }
        this.mascot.classList.remove('is-curious');
        this.state.curiousShown = false;
        return;
      }
      if (idle >= CURIOUS_AFTER && !this.state.curiousShown && !this.state.sleeping &&
          !this.activities.current && Date.now() >= this.state.nextProactiveAt) {
        this.state.curiousShown = true;
        this.mascot.classList.add('is-curious');
        this.showIdleCurious();
      }
    }

    noteDecision() {
      this.state.lastDecision = Date.now();
      this.scroll.reversals = 0;
      if (this.hover.timer) window.clearTimeout(this.hover.timer);
      this.hover.timer = null;
      this.hover.card = null;
    }

    userTouched() {
      this.state.lastUserClick = Date.now();
      if (this.activities.current) this.abortActivity();
    }

    abortActivity() {
      this.activities.abort();
      this.mascot.classList.remove('has-hands');
      if (this.timers.hands) window.clearTimeout(this.timers.hands);
      this.timers.hands = null;
      this.activities.schedule();
    }

    flashHands(ms) {
      if (this.motionOff()) return;
      this.mascot.classList.add('has-hands');
      if (this.timers.hands) window.clearTimeout(this.timers.hands);
      var self = this;
      this.timers.hands = window.setTimeout(function () {
        if (!self.activities.current) self.mascot.classList.remove('has-hands');
      }, ms || 900);
    }

    playClass(className, ms) {
      if (this.motionOff()) return;
      if (this.timers[className]) window.clearTimeout(this.timers[className]);
      var mascot = this.mascot;
      mascot.classList.remove(className);
      void mascot.offsetWidth;
      mascot.classList.add(className);
      this.timers[className] = window.setTimeout(function () {
        mascot.classList.remove(className);
      }, ms);
    }

    scheduleBlink() {
      if (this.timers.blink) window.clearTimeout(this.timers.blink);
      if (this.motionOff()) return;
      var self = this;
      this.timers.blink = window.setTimeout(function () {
        if (self.motionOff()) return;
        self.mascot.classList.add('is-blinking');
        window.setTimeout(function () { self.mascot.classList.remove('is-blinking'); }, 180);
        self.scheduleBlink();
      }, 3000 + Math.random() * 3000);
    }

    cancelBlink() {
      if (this.timers.blink) window.clearTimeout(this.timers.blink);
      this.timers.blink = null;
      this.mascot.classList.remove('is-blinking');
    }

    /* Web Audio: pop tecnológico de <80 ms, sin archivos y supeditado al control de silencio. */
    ensureAudio() {
      if (!this.state.voice) return null;
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      if (!this.audio) {
        try { this.audio = new AudioCtor(); } catch (error) { return null; }
      }
      if (this.audio.state === 'suspended') {
        try { this.audio.resume().catch(function () {}); } catch (error) { /* Autoplay bloqueado. */ }
      }
      return this.audio;
    }

    playTone(kind) {
      var context = this.ensureAudio();
      if (!context) return;
      var tones = {
        grab: [520, 360, 0.065],
        drop: [380, 620, 0.075],
        bubble: [640, 820, 0.07]
      };
      var spec = tones[kind] || tones.bubble;
      try {
        var start = context.currentTime;
        var oscillator = context.createOscillator();
        var gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(spec[0], start);
        oscillator.frequency.exponentialRampToValueAtTime(spec[1], start + spec[2]);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + spec[2]);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + spec[2] + 0.01);
      } catch (error) {
        /* Audio opcional: la interacción continúa si falla. */
      }
    }

    stopSpeaking() {
      if (this.synth) {
        try { this.synth.cancel(); } catch (error) { /* Navegador sin soporte estable. */ }
      }
      this.mascot.classList.remove('is-speaking');
    }

    pickVoice(lang) {
      if (!this.synth || typeof this.synth.getVoices !== 'function') return null;
      try {
        var voices = this.synth.getVoices() || [];
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

    cleanForSpeech(text) {
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

    speak(text) {
      if (!this.state.voice || !this.synth || typeof window.SpeechSynthesisUtterance !== 'function') return;
      var clean = this.cleanForSpeech(text);
      if (!clean) return;
      try {
        this.stopSpeaking();
        var utterance = new window.SpeechSynthesisUtterance(clean);
        var locale = String(window.navigator.language || '').toLowerCase();
        var lang = locale.indexOf('es-mx') === 0 || locale.indexOf('es-419') === 0 ? 'es-MX' : 'es-ES';
        utterance.lang = lang;
        utterance.rate = 1;
        utterance.pitch = 1.05;
        utterance.volume = 0.9;
        var voice = this.pickVoice(lang);
        if (voice) utterance.voice = voice;
        var self = this;
        utterance.onstart = function () { self.mascot.classList.add('is-speaking'); };
        utterance.onend = function () { self.mascot.classList.remove('is-speaking'); };
        utterance.onerror = function () { self.mascot.classList.remove('is-speaking'); };
        this.synth.speak(utterance);
      } catch (error) {
        this.mascot.classList.remove('is-speaking');
      }
    }

    setThinking(on) {
      this.state.thinking = Boolean(on);
      this.setClass('is-thinking', this.state.thinking);
      if (!this.state.thinking) {
        this.state.listening = false;
        this.mascot.classList.remove('is-listening');
      }
    }

    enableQuietMode() {
      if (this.state.quiet) return;
      this.state.quiet = true;
      this.state.bubbleIgnored = 0;
      this.state.nextProactiveAt = Infinity;
      if (this.activities.current) this.abortActivity();
    }

    hideBubble(options) {
      var count = Boolean(options && options.count && this.state.bubbleActionable);
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      this.timers.bubble = null;
      this.mascot.classList.remove('has-bubble');
      clearNode(this.bubble);
      this.state.bubbleActionable = false;
      if (count) {
        this.state.bubbleIgnored += 1;
        if (this.state.bubbleIgnored >= 2) this.enableQuietMode();
      }
    }

    showBubble(text, ms, options) {
      options = options || {};
      if (!this.bubble || (options.proactive && !this.canShowProactive())) return;
      clearNode(this.bubble);
      var label = document.createElement('span');
      label.className = 'bb-mascot__bubble-text';
      label.textContent = String(text || '');
      this.bubble.appendChild(label);

      var actions = options.actions || [];
      if (actions.length) {
        var row = document.createElement('span');
        row.className = 'bb-mascot__bubble-actions';
        var self = this;
        actions.forEach(function (action) {
          var button = document.createElement('button');
          button.type = 'button';
          button.className = 'bb-mascot__bubble-action';
          button.textContent = action.label;
          button.addEventListener('click', function (event) {
            event.stopPropagation();
            self.state.bubbleIgnored = 0;
            self.hideBubble();
            action.onClick();
          });
          row.appendChild(button);
        });
        this.bubble.appendChild(row);
      }

      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'bb-mascot__bubble-close';
      close.setAttribute('aria-label', 'Cerrar mensaje de Byte');
      var host = this;
      close.addEventListener('click', function (event) {
        event.stopPropagation();
        host.hideBubble({ count: true });
      });
      this.bubble.appendChild(close);

      this.mascot.classList.add('has-bubble');
      this.state.bubbleActionable = Boolean(options.countIgnored);
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      var bubbleHost = this;
      this.timers.bubble = window.setTimeout(function () {
        bubbleHost.hideBubble({ count: true });
      }, ms || 1200);
      if (options.proactive) this.state.nextProactiveAt = Date.now() + 8000;
      if (!options.silent) this.playTone('bubble');
    }

    askChat(question) {
      if (!question) return;
      this.userTouched();
      this.noteDecision();
      this.hideBubble();
      this.trigger.click();
      if (this.input) this.input.value = String(question);
      if (this.form) {
        if (typeof this.form.requestSubmit === 'function') this.form.requestSubmit();
        else this.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
      this.setThinking(true);
    }

    /* Saludo explícito desde la API de racha: Byte saluda sin desplazarse. */
    onStreakMeet(event) {
      if (document.body.classList.contains('bb-mascot-hidden')) return;
      var detail = event && event.detail ? event.detail : {};
      var days = Number(detail.dias) || 0;
      var name = typeof detail.nombre === 'string' && detail.nombre ? detail.nombre : 'tu racha';
      this.playClass('is-meet', 1200);
      this.showBubble(days > 0
        ? '¡Vas ' + days + ' días con ' + name + '!'
        : '¡Hola, ' + name + '!', 2100);
      this.playTone('bubble');
    }

    reactToCart() {
      if (!this.state.active) return;
      if (this.activities.current) this.abortActivity();
      this.flashHands(900);
      this.playClass('is-happy', 740);
      this.showBubble(CART_TEXT, 1400);
    }

    celebrate() {
      var stamp = Date.now();
      if (stamp - this.state.lastCelebration < 700) return;
      this.state.lastCelebration = stamp;
      if (this.activities.current) this.abortActivity();
      this.flashHands(900);
      this.playClass('is-celebrating', 760);
      this.showBubble('¡Yay!', 900);
      this.noteActivity();
    }

    openChatAndGreet() {
      this.userTouched();
      this.trigger.click();
      this.flashHands(1100);
      this.playClass('is-wave', 900);
      var stamp = Date.now();
      if (stamp - this.state.lastGreeting > 900) {
        this.state.lastGreeting = stamp;
        this.speak(GREETING);
      }
      this.noteActivity();
    }

    activate() {
      this.userTouched();
      var stamp = Date.now();
      if (stamp - this.state.lastTap < 320) {
        if (this.timers.click) window.clearTimeout(this.timers.click);
        this.timers.click = null;
        this.state.lastTap = 0;
        this.celebrate();
        return;
      }
      this.state.lastTap = stamp;
      if (this.timers.click) window.clearTimeout(this.timers.click);
      var self = this;
      this.timers.click = window.setTimeout(function () {
        self.timers.click = null;
        self.openChatAndGreet();
      }, 230);
    }

    onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (document.body.classList.contains('bb-mascot-hidden')) return;
      if (event.target && typeof event.target.closest === 'function' &&
          event.target.closest('.bb-mascot__bubble')) return;
      var rect = this.mascot.getBoundingClientRect();
      if (!rect.width) return;
      this.userTouched();
      this.ensureAudio();
      this.hideBubble();
      if (this.state.pocket) this.state.pocketPreview = true;
      this.noteActivity();
      this.drag.active = true;
      this.drag.moved = false;
      this.drag.pointerId = event.pointerId === undefined ? null : event.pointerId;
      this.drag.startX = event.clientX;
      this.drag.startY = event.clientY;
      this.drag.lastX = event.clientX;
      this.drag.lastY = event.clientY;
      this.drag.baseX = this.physics.current.x;
      this.drag.baseY = this.physics.current.y;
      this.physics.target.x = this.physics.current.x;
      this.physics.target.y = this.physics.current.y;
      this.physics.velocity.x = 0;
      this.physics.velocity.y = 0;
      if (typeof this.mascot.setPointerCapture === 'function' && this.drag.pointerId !== null) {
        try { this.mascot.setPointerCapture(this.drag.pointerId); } catch (error) { /* Sin captura. */ }
      }
    }

    onDragMove(event) {
      if (!this.drag.active) return;
      if (this.drag.pointerId !== null && event.pointerId !== this.drag.pointerId) return;
      var dx = event.clientX - this.drag.startX;
      var dy = event.clientY - this.drag.startY;
      if (!this.drag.moved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      event.preventDefault();
      if (!this.drag.moved) {
        this.drag.moved = true;
        this.state.dragging = true;
        this.mascot.classList.add('is-dragging');
        this.mascot.classList.remove('is-curious', 'is-sleeping', 'is-happy', 'is-landing');
        this.state.curiousShown = false;
        document.body.classList.add('bb-mascot-dragging');
        this.showBubble(DRAG_TEXTS[Math.floor(Math.random() * DRAG_TEXTS.length)], 1600);
        this.playTone('grab');
      }
      var point = this.clampPoint(this.drag.baseX + dx, this.drag.baseY + dy);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      var velocityX = event.clientX - this.drag.lastX;
      this.physics.tiltTarget = clamp(velocityX * 1.4 + (point.x - this.drag.baseX) * 0.02, -14, 14);
      this.drag.lastX = event.clientX;
      this.drag.lastY = event.clientY;
    }

    endDrag(event, cancelled) {
      if (!this.drag.active) return;
      if (this.drag.pointerId !== null && event && event.pointerId !== undefined &&
          event.pointerId !== this.drag.pointerId) return;
      this.drag.active = false;
      if (typeof this.mascot.releasePointerCapture === 'function' && this.drag.pointerId !== null) {
        try {
          if (typeof this.mascot.hasPointerCapture !== 'function' ||
              this.mascot.hasPointerCapture(this.drag.pointerId)) {
            this.mascot.releasePointerCapture(this.drag.pointerId);
          }
        } catch (error) { /* Captura ya liberada. */ }
      }
      var wasMoved = this.drag.moved;
      this.drag.moved = false;
      this.drag.pointerId = null;
      this.state.dragging = false;
      this.physics.tiltTarget = 0;
      var self = this;
      if (wasMoved) {
        var size = this.metrics();
        var point = { x: this.physics.target.x, y: this.physics.target.y };
        var side = null;
        if (point.x < 40) {
          point.x = 0;
          side = 'left';
        } else if (window.innerWidth - (point.x + size.w) < 40) {
          point.x = Math.max(0, window.innerWidth - size.w);
          side = 'right';
        }
        this.state.dockSide = side;
        this.physics.target.x = point.x;
        this.physics.target.y = point.y;
        if (this.motionOff()) {
          this.physics.current.x = point.x;
          this.physics.current.y = point.y;
        }
        savePosition(point);
        this.mascot.classList.remove('is-dragging');
        document.body.classList.remove('bb-mascot-dragging');
        this.playTone('drop');
        this.playClass('is-landing', 460);
        this.noteActivity();
        this.activities.onUserInteraction();
        if (this.state.pocket) {
          window.setTimeout(function () {
            if (self.state.pocket && !self.mascot.matches(':hover')) {
              self.state.pocketPreview = false;
              self.render();
            }
          }, 900);
        }
      } else if (!cancelled) {
        this.activate();
      }
    }

    onLookMove(event) {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
      this.noteActivity();
    }

    updateLookTarget() {
      if (this.motionOff()) {
        this.physics.lookTarget.x = 0;
        this.physics.lookTarget.y = 0;
        return;
      }
      if (this.state.dockSide && !this.drag.active) {
        var nx = (window.innerWidth / 2 - this.center.x) / Math.max(1, window.innerWidth / 2);
        this.physics.lookTarget.x = clamp(nx, -1, 1) * 5;
        this.physics.lookTarget.y = 0;
        return;
      }
      if (!this.pointer.active) {
        this.physics.lookTarget.x = 0;
        this.physics.lookTarget.y = 0;
        return;
      }
      var px = (this.pointer.x - this.center.x) / Math.max(1, window.innerWidth / 2);
      var py = (this.pointer.y - this.center.y) / Math.max(1, window.innerHeight / 2);
      this.physics.lookTarget.x = clamp(px, -1, 1) * 5;
      this.physics.lookTarget.y = clamp(py, -1, 1) * 4;
    }

    startLoop() {
      this.physics.lastTime = now();
      var self = this;
      var step = function (time) {
        if (self.intervalId) return;
        self.tick(time);
        self.rafId = window.requestAnimationFrame(step);
      };
      if (typeof window.requestAnimationFrame === 'function') {
        this.rafId = window.requestAnimationFrame(step);
        this.watchdog = window.setTimeout(function () {
          if (!self.physics.everTicked && !self.intervalId) {
            window.cancelAnimationFrame(self.rafId);
            self.rafId = 0;
            self.intervalId = window.setInterval(function () { self.tick(now()); }, 16);
          }
        }, 250);
      } else {
        this.intervalId = window.setInterval(function () { self.tick(now()); }, 16);
      }
    }

    integrate(frames) {
      var p = this.physics;
      if (this.motionOff()) {
        p.current.x = p.target.x;
        p.current.y = p.target.y;
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.tilt = 0;
        p.tiltTarget = 0;
        p.tiltVelocity = 0;
        p.look.x = 0;
        p.look.y = 0;
        return;
      }
      p.velocity.x = (p.velocity.x + (p.target.x - p.current.x) * 0.17 * frames) * Math.pow(0.74, frames);
      p.velocity.y = (p.velocity.y + (p.target.y - p.current.y) * 0.17 * frames) * Math.pow(0.74, frames);
      p.current.x += p.velocity.x * frames;
      p.current.y += p.velocity.y * frames;
      p.tiltTarget *= Math.pow(0.86, frames);
      p.tiltVelocity = (p.tiltVelocity + (p.tiltTarget - p.tilt) * 0.18 * frames) * Math.pow(0.76, frames);
      p.tilt = clamp(p.tilt + p.tiltVelocity * frames, -14, 14);
      var lookLerp = 1 - Math.pow(0.82, frames);
      p.look.x += (p.lookTarget.x - p.look.x) * lookLerp;
      p.look.y += (p.lookTarget.y - p.look.y) * lookLerp;
    }

    tick(time) {
      if (this.watchdog && this.physics.everTicked) {
        window.clearTimeout(this.watchdog);
        this.watchdog = null;
      }
      var stamp = typeof time === 'number' ? time : now();
      var elapsed = (stamp - this.physics.lastTime) / 1000;
      this.physics.lastTime = stamp;
      if (!isFinite(elapsed) || elapsed <= 0) elapsed = FIXED_STEP;
      elapsed = Math.min(elapsed, 0.1);
      this.physics.accumulator += elapsed;
      this.physics.everTicked = true;
      this.updateLookTarget();

      var steps = 0;
      while (this.physics.accumulator >= FIXED_STEP && steps < MAX_SUBSTEPS) {
        this.integrate(FIXED_STEP * 60);
        this.physics.accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === MAX_SUBSTEPS) this.physics.accumulator = 0;
      if (steps) this.refreshBoundsAndCenter();
      this.separate();
      this.activities.tick(stamp, steps * FIXED_STEP * 60);
      this.render();
    }

    render() {
      var size = this.metrics();
      var x = this.physics.current.x;
      if (this.state.pocket && !this.state.pocketPreview) {
        var side = this.center.x < window.innerWidth / 2 ? 'left' : 'right';
        this.state.pocketSide = side;
        x += side === 'left' ? -size.w * 0.62 : size.w * 0.62;
      }
      this.mascot.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' +
        this.physics.current.y.toFixed(2) + 'px,0)';
      if (this.motion) this.motion.style.setProperty('--bb-tilt', this.physics.tilt.toFixed(2) + 'deg');
      var lookX = this.physics.look.x.toFixed(2) + 'px';
      var lookY = this.physics.look.y.toFixed(2) + 'px';
      this.mascot.style.setProperty('--bb-look-x', lookX);
      this.mascot.style.setProperty('--bb-look-y', lookY);
      if (this.glint) this.glint.style.transform = 'translate(' + lookX + ',' + lookY + ')';
    }

    normalizePosition() {
      this.measure();
      this.defaultPos = this.computeDefaultPosition();
      var point = this.clampPoint(this.physics.target.x, this.physics.target.y);
      if (this.state.dockSide === 'left') point.x = 0;
      if (this.state.dockSide === 'right') point.x = Math.max(0, window.innerWidth - this.metrics().w);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      var current = this.clampPoint(this.physics.current.x, this.physics.current.y);
      if (this.state.dockSide) current.x = point.x;
      this.physics.current.x = current.x;
      this.physics.current.y = current.y;
      if (this.motionOff()) {
        this.physics.current.x = point.x;
        this.physics.current.y = point.y;
      }
      this.refreshBoundsAndCenter();
      this.render();
    }

    setPocket(on) {
      this.state.pocket = Boolean(on);
      this.state.pocketPreview = false;
      saveFlag(KEY_POCKET, this.state.pocket);
      this.setControl(this.pocketButton, '⇤', '⇥', 'Mostrar Byte completo', 'Minimizar Byte al borde', this.state.pocket, 'data-mascot-pocket-icon');
      this.mascot.classList.toggle('is-pocket', this.state.pocket);
      this.noteActivity();
      this.render();
    }

    resetPosition() {
      clearPosition();
      this.state.dockSide = null;
      this.setPocket(false);
      if (this.activities.current) this.abortActivity();
      this.physics.target.x = this.defaultPos.x;
      this.physics.target.y = this.defaultPos.y;
      if (this.motionOff()) {
        this.physics.current.x = this.defaultPos.x;
        this.physics.current.y = this.defaultPos.y;
      }
      this.physics.velocity.x = 0;
      this.physics.velocity.y = 0;
      this.physics.tilt = 0;
      this.physics.tiltTarget = 0;
      this.playClass('is-landing', 460);
      this.noteActivity();
      this.refreshBoundsAndCenter();
      this.render();
    }

    onProductHoverStart(event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      var card = target.closest('.product-card');
      if (!card || card === this.hover.card) return;
      if (this.hover.timer) window.clearTimeout(this.hover.timer);
      this.hover.card = card;
      var host = this;
      this.hover.timer = window.setTimeout(function () { host.onProductLongHover(card); }, 3500);
    }

    onProductHoverEnd(event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      var card = target.closest('.product-card');
      if (!card || card !== this.hover.card) return;
      if (event.relatedTarget && card.contains(event.relatedTarget)) return;
      if (this.hover.timer) window.clearTimeout(this.hover.timer);
      this.hover.timer = null;
      this.hover.card = null;
    }

    onProductLongHover(card) {
      if (!this.canShowProactive()) return;
      var nameNode = card.querySelector('h3, [data-product-name], .product-name');
      var name = String(nameNode && nameNode.textContent || '').trim().slice(0, 48);
      if (!name) return;
      var category = String(card.getAttribute('data-category') ||
        (card.querySelector('.product-meta') && card.querySelector('.product-meta').textContent) || '').trim().slice(0, 32);
      var question = 'Cuéntame más sobre ' + name + (category ? ' (' + category + ')' : '');
      var self = this;
      this.showBubble('¿Quieres saber más sobre ' + name + '?', 3600, {
        proactive: true,
        countIgnored: true,
        actions: [{ label: 'Preguntar', onClick: function () { self.askChat(question); } }]
      });
    }

    onScroll() {
      if (!this.canShowProactive()) return;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var stamp = Date.now();
      var delta = y - this.scroll.lastY;
      if (Math.abs(delta) < 40) return;
      var direction = delta > 0 ? 1 : -1;
      if (this.scroll.lastDir && direction !== this.scroll.lastDir && stamp - this.scroll.lastAt > 400) {
        this.scroll.reversals += 1;
        if (this.scroll.reversals >= 4 && stamp - this.state.lastDecision > 6000) {
          this.scroll.reversals = 0;
          this.showScrollHint();
        }
      }
      this.scroll.lastDir = direction;
      this.scroll.lastY = y;
      this.scroll.lastAt = stamp;
    }

    showScrollHint() {
      var self = this;
      this.showBubble('¿Buscas algo en especial? Te ayudo a filtrar', 3600, {
        proactive: true,
        countIgnored: true,
        actions: [{ label: 'Filtrar', onClick: function () { self.askChat('Ayúdame a filtrar productos en Byte-Bay'); } }]
      });
    }

    showIdleCurious() {
      var self = this;
      this.showBubble(CURIOUS_TEXT, 2800, {
        proactive: true,
        countIgnored: true,
        actions: [{ label: 'Preguntar', onClick: function () { self.askChat('¿Qué productos me recomiendas?'); } }]
      });
    }
  }

  var companion = new ByteCompanion();
  window.ByteCompanion = ByteCompanion;
  if (companion) {
    window.ByteBayCompanion = companion;
    window.ByteBayMascot = {
      speak: companion.speak.bind(companion),
      stop: companion.stopSpeaking.bind(companion),
      celebrate: companion.celebrate.bind(companion),
      resetPosition: companion.resetPosition.bind(companion),
      abortActivity: companion.abortActivity.bind(companion),
      ask: companion.askChat.bind(companion),
      pocket: companion.setPocket.bind(companion),
      activities: companion.activities,
      preferences: companion.state
    };
  }
}());
