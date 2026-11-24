/* Byte · mascota de racha. Se muestra solo con cuenta validada; la racha se
   guarda en Supabase mediante bb_registrar_racha (la sesión se valida allí). */
(function () {
  'use strict';

  var KEY_POS = 'bytebay_streak_pos';
  var KEY_VOICE = 'bytebay_mascot_voice';
  var CACHE_PREFIX = 'bytebay_streak_cache_';
  var DRAG_THRESHOLD = 5;
  var MEET_DISTANCE = 155;
  var MEET_COOLDOWN = 5500;
  var TIERS = [
    { max: 6, name: 'Chispa', label: 'Chispa de racha' },
    { max: 13, name: 'Brasa', label: 'Brasa de racha' },
    { max: 29, name: 'Llama', label: 'Llama de racha' },
    { max: Infinity, name: 'Leyenda', label: 'Racha legendaria' }
  ];

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

  function readJSON(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Sin almacenamiento: la mascota sigue funcionando en la sesión. */
    }
  }

  function readFlag(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === 'true' || raw === '1' || raw === 'false' || raw === '0'
        ? raw === 'true' || raw === '1'
        : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function dayKey(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function previousDay(key) {
    var parts = key.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() - 1);
    return dayKey(date);
  }

  function tierFor(days) {
    for (var i = 0; i < TIERS.length; i += 1) {
      if (days <= TIERS[i].max) return i + 1;
    }
    return TIERS.length;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = window.setTimeout(function () {
        if (!done) resolve(null);
      }, ms);
      Promise.resolve(promise).then(function (value) {
        if (!done) {
          done = true;
          window.clearTimeout(timer);
          resolve(value);
        }
      }, function () {
        if (!done) {
          done = true;
          window.clearTimeout(timer);
          resolve(null);
        }
      });
    });
  }

  class StreakCompanion {
    constructor() {
      this.mascot = document.querySelector('#bbStreak');
      this.bubble = document.querySelector('#bbStreakBubble');
      this.badge = document.querySelector('#bbStreakBadge');
      if (!this.mascot || !this.bubble || !this.badge) return;

      this.tooltip = document.querySelector('#bbStreakTooltip');
      this.motion = this.mascot.querySelector('.bb-streak__motion');
      this.mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.timers = {};
      this.audio = null;
      this.rafId = 0;
      this.intervalId = 0;
      this.refreshing = false;
      this.visible = false;

      this.state = {
        days: 0,
        best: 0,
        tier: 0,
        customerId: 0,
        preview: false,
        dragging: false,
        quiet: false,
        lastMeet: 0,
        lastRefreshDay: ''
      };

      this.physics = {
        current: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        tilt: 0,
        tiltTarget: 0,
        tiltVelocity: 0,
        lastTime: now(),
        everTicked: false
      };

      this.drag = {
        active: false, moved: false, pointerId: null,
        startX: 0, startY: 0, lastX: 0, baseX: 0, baseY: 0
      };
      this.center = { x: 0, y: 0 };

      this.init();
    }

    init() {
      this.defaultPos = this.computeDefaultPosition();
      var saved = readJSON(KEY_POS);
      var start = saved && isFinite(saved.x) && isFinite(saved.y)
        ? this.clampPoint(saved.x, saved.y)
        : this.defaultPos;
      this.physics.current.x = start.x;
      this.physics.current.y = start.y;
      this.physics.target.x = start.x;
      this.physics.target.y = start.y;
      this.refreshCenter();
      this.render();
      this.bindEvents();
      this.startLoop();
      this.refresh();
    }

    bindEvents() {
      var self = this;
      this.mascot.addEventListener('pointerdown', function (event) { self.onPointerDown(event); });
      document.addEventListener('pointermove', function (event) { self.onDragMove(event); }, { passive: false });
      document.addEventListener('pointerup', function (event) { self.endDrag(event, false); });
      document.addEventListener('pointercancel', function (event) { self.endDrag(event, true); });
      this.mascot.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          self.activate();
        }
      });
      window.addEventListener('resize', function () { self.normalizePosition(); }, { passive: true });
      window.addEventListener('bb:account-updated', function () { self.refresh(true); });
      window.addEventListener('bb:privacy-updated', function () { self.refresh(); });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') self.refresh();
        else self.stopAudio();
      });
    }

    motionOff() {
      var fx = document.documentElement.getAttribute('data-season-fx');
      var active = readFlag('bytebay_mascot_active', true);
      return !active || fx === 'off' || fx === 'reduced' ||
        Boolean(this.mediaQuery && this.mediaQuery.matches);
    }

    /* ---------- Sesión y racha ---------- */

    async refresh(force) {
      if (this.refreshing) return;
      var today = dayKey(new Date());
      if (!force && this.state.lastRefreshDay === today && this.visible) return;
      this.refreshing = true;
      try {
        var session = null;
        if (window.BBPrivacy && typeof window.BBPrivacy.obtenerSesionCliente === 'function') {
          session = await withTimeout(window.BBPrivacy.obtenerSesionCliente(), 4500);
          if (session && session.ok === false) session = null;
        }
        if (session && session.customer_id) {
          this.state.customerId = Number(session.customer_id);
          var result = await this.registerServer(session);
          if (result && result.ok) {
            this.state.preview = false;
            this.apply(result.dias_racha, result.mejor_racha, true);
            this.state.lastRefreshDay = today;
            return;
          }
        }
        var account = readJSON('beruAccount');
        if (account && account.verified && Number(account.id) > 0) {
          this.state.customerId = Number(account.id);
          var cached = this.registerLocal(this.state.customerId, today);
          this.apply(cached.dias_racha, cached.mejor_racha, false);
          this.state.lastRefreshDay = today;
          return;
        }
        this.hide();
      } finally {
        this.refreshing = false;
      }
    }

    async registerServer(session) {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;
      try {
        var response = await withTimeout(
          supabaseClient.rpc('bb_registrar_racha', { p_access_token: session.access_token }),
          6000
        );
        if (!response || response.error || !response.data || response.data.ok !== true) return null;
        var data = response.data;
        var days = Number(data.dias_racha);
        var best = Number(data.mejor_racha);
        if (!isFinite(days) || days < 1) return null;
        saveJSON(CACHE_PREFIX + this.state.customerId, {
          dias: days,
          mejor: isFinite(best) ? best : days,
          fecha: String(data.fecha || dayKey(new Date()))
        });
        return { ok: true, dias_racha: days, mejor_racha: isFinite(best) ? best : days };
      } catch (error) {
        return null;
      }
    }

    registerLocal(customerId, today) {
      var key = CACHE_PREFIX + customerId;
      var cache = readJSON(key);
      if (!cache || !isFinite(Number(cache.dias))) {
        cache = { dias: 3, mejor: 3, fecha: today };
      } else {
        cache = {
          dias: clamp(Number(cache.dias), 1, 3650),
          mejor: clamp(Number(cache.mejor) || Number(cache.dias), 1, 3650),
          fecha: String(cache.fecha || today)
        };
        if (cache.fecha !== today) {
          cache.dias = cache.fecha === previousDay(today) ? clamp(cache.dias + 1, 1, 3650) : 1;
          cache.mejor = Math.max(cache.mejor, cache.dias);
          cache.fecha = today;
        }
      }
      saveJSON(key, cache);
      return { dias_racha: cache.dias, mejor_racha: cache.mejor };
    }

    apply(days, best, fromServer) {
      days = clamp(Number(days) || 3, 1, 3650);
      best = clamp(Number(best) || days, days, 3650);
      var tier = tierFor(days);
      var leveled = this.visible && this.state.tier && tier > this.state.tier;
      var increased = this.visible && days > this.state.days;

      this.state.days = days;
      this.state.best = best;
      this.state.tier = tier;
      this.mascot.dataset.tier = String(tier);
      this.mascot.setAttribute('aria-label',
        'Mascota de racha: ' + days + ' días consecutivos, ' + TIERS[tier - 1].label +
        '. Arrástrala o toca para interactuar.');
      this.badge.textContent = days + ' días';
      if (this.tooltip) {
        this.tooltip.textContent = TIERS[tier - 1].label + ' · ' + days + ' días seguidos. ¡Sigue así!';
      }
      this.show();

      if (leveled) {
        this.playClass('is-levelup', 1500);
        this.showBubble('¡Nueva forma! Ya soy ' + TIERS[tier - 1].label.toLowerCase() + ' 🔥', 2600);
        this.burst(this.center.x, this.center.y);
        this.playTone('level');
      } else if (increased && !fromServer) {
        this.playClass('is-happy', 900);
      }
    }

    show() {
      this.visible = true;
      document.body.classList.add('bb-streak-ready');
      this.mascot.classList.add('is-visible');
      this.refreshCenter();
      this.render();
    }

    hide() {
      this.visible = false;
      document.body.classList.remove('bb-streak-ready');
      this.mascot.classList.remove('is-visible', 'is-meet', 'is-happy', 'is-levelup', 'has-bubble');
      clearNode(this.bubble);
    }

    preview(days) {
      this.state.preview = true;
      var value = clamp(Number(days) || 3, 1, 3650);
      this.apply(value, Math.max(value, this.state.best), true);
      return { days: value, tier: this.state.tier };
    }

    /* ---------- Física y arrastre ---------- */

    metrics() {
      var rect = this.mascot.getBoundingClientRect();
      return { w: rect.width || 72, h: rect.height || 80 };
    }

    computeDefaultPosition() {
      var size = this.metrics();
      var inset = window.innerWidth < 768 ? 12 : 24;
      return {
        x: inset,
        y: Math.max(0, window.innerHeight - size.h - Math.max(inset, 86))
      };
    }

    clampPoint(x, y) {
      var size = this.metrics();
      return {
        x: clamp(x, 0, Math.max(0, window.innerWidth - size.w)),
        y: clamp(y, 0, Math.max(0, window.innerHeight - size.h))
      };
    }

    refreshCenter() {
      var size = this.metrics();
      this.center.x = this.physics.current.x + size.w / 2;
      this.center.y = this.physics.current.y + size.h / 2;
      this.mascot.classList.toggle('is-near-left', this.physics.current.x < 90);
      this.mascot.classList.toggle('is-near-right',
        this.physics.current.x + size.w > window.innerWidth - 90);
    }

    normalizePosition() {
      this.defaultPos = this.computeDefaultPosition();
      var point = this.clampPoint(this.physics.target.x, this.physics.target.y);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      var current = this.clampPoint(this.physics.current.x, this.physics.current.y);
      this.physics.current.x = current.x;
      this.physics.current.y = current.y;
      if (this.motionOff()) {
        this.physics.current.x = point.x;
        this.physics.current.y = point.y;
      }
      this.refreshCenter();
      this.render();
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
        window.setTimeout(function () {
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

    tick(time) {
      var stamp = typeof time === 'number' ? time : now();
      var delta = (stamp - this.physics.lastTime) / 16.6667;
      this.physics.lastTime = stamp;
      if (!isFinite(delta) || delta <= 0) delta = 1;
      delta = clamp(delta, 0.5, 6);
      this.physics.everTicked = true;
      this.refreshCenter();

      var p = this.physics;
      if (this.motionOff()) {
        p.current.x = p.target.x;
        p.current.y = p.target.y;
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.tilt = 0;
        p.tiltTarget = 0;
        p.tiltVelocity = 0;
      } else {
        p.velocity.x = (p.velocity.x + (p.target.x - p.current.x) * 0.17 * delta) * Math.pow(0.74, delta);
        p.velocity.y = (p.velocity.y + (p.target.y - p.current.y) * 0.17 * delta) * Math.pow(0.74, delta);
        p.current.x += p.velocity.x * delta;
        p.current.y += p.velocity.y * delta;
        p.tiltTarget *= Math.pow(0.86, delta);
        p.tiltVelocity = (p.tiltVelocity + (p.tiltTarget - p.tilt) * 0.18 * delta) * Math.pow(0.76, delta);
        p.tilt = clamp(p.tilt + p.tiltVelocity * delta, -14, 14);
      }
      this.checkMeet();
      this.render();
    }

    render() {
      var x = this.physics.current.x;
      this.mascot.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' +
        this.physics.current.y.toFixed(2) + 'px,0)';
      if (this.motion) this.motion.style.setProperty('--st-tilt', this.physics.tilt.toFixed(2) + 'deg');
    }

    onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (!this.visible || document.body.classList.contains('bb-mascot-hidden')) return;
      if (event.target && typeof event.target.closest === 'function' &&
          event.target.closest('.bb-streak__bubble')) return;
      var rect = this.mascot.getBoundingClientRect();
      if (!rect.width) return;
      this.ensureAudio();
      this.playTone('grab');
      this.drag.active = true;
      this.drag.moved = false;
      this.drag.pointerId = event.pointerId === undefined ? null : event.pointerId;
      this.drag.startX = event.clientX;
      this.drag.startY = event.clientY;
      this.drag.lastX = event.clientX;
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
        document.body.classList.add('bb-streak-dragging');
        this.hideBubble();
      }
      var point = this.clampPoint(this.drag.baseX + dx, this.drag.baseY + dy);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      this.physics.tiltTarget = clamp((event.clientX - this.drag.lastX) * 1.2, -14, 14);
      this.drag.lastX = event.clientX;
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
      this.mascot.classList.remove('is-dragging');
      document.body.classList.remove('bb-streak-dragging');

      if (wasMoved) {
        var size = this.metrics();
        var point = { x: this.physics.target.x, y: this.physics.target.y };
        if (point.x < 40) point.x = 0;
        else if (window.innerWidth - (point.x + size.w) < 40) point.x = Math.max(0, window.innerWidth - size.w);
        this.physics.target.x = point.x;
        this.physics.target.y = point.y;
        if (this.motionOff()) {
          this.physics.current.x = point.x;
          this.physics.current.y = point.y;
        }
        saveJSON(KEY_POS, { x: Math.round(point.x), y: Math.round(point.y) });
        this.playClass('is-landing', 500);
        this.playTone('drop');
      } else if (!cancelled) {
        this.activate();
      }
    }

    /* ---------- Interacción y animaciones ---------- */

    playClass(className, ms) {
      if (this.motionOff()) return;
      if (this.timers[className]) window.clearTimeout(this.timers[className]);
      var mascot = this.mascot;
      mascot.classList.remove(className);
      void mascot.offsetWidth;
      mascot.classList.add(className);
      this.timers[className] = window.setTimeout(function () {
        mascot.classList.remove(className);
      }, ms || 900);
    }

    showBubble(text, ms) {
      if (!this.visible) return;
      clearNode(this.bubble);
      var self = this;
      var label = document.createElement('span');
      label.className = 'bb-streak__bubble-text';
      label.textContent = String(text || '');
      this.bubble.appendChild(label);
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'bb-streak__bubble-close';
      close.setAttribute('aria-label', 'Cerrar mensaje de la racha');
      close.addEventListener('click', function (event) {
        event.stopPropagation();
        self.hideBubble();
      });
      this.bubble.appendChild(close);
      this.mascot.classList.add('has-bubble');
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      this.timers.bubble = window.setTimeout(function () { self.hideBubble(); }, ms || 2200);
    }

    hideBubble() {
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      this.timers.bubble = null;
      this.mascot.classList.remove('has-bubble');
      clearNode(this.bubble);
    }

    activate() {
      if (!this.visible) return;
      this.playClass('is-happy', 950);
      var messages = [
        'Llevas ' + this.state.days + ' días seguidos 🔥',
        'Tu racha es ' + TIERS[this.state.tier - 1].label.toLowerCase() + '. ¡No la pierdas!',
        'Vuelve mañana y la racha sigue subiendo ✨'
      ];
      this.showBubble(messages[Math.floor(Math.random() * messages.length)], 2800);
      this.playTone('bubble');
    }

    ensureAudio() {
      if (!readFlag(KEY_VOICE, true)) return null;
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

    stopAudio() {
      if (!this.audio) return;
      try { this.audio.suspend(); } catch (error) { /* Audio opcional. */ }
    }

    playTone(kind) {
      var context = this.ensureAudio();
      if (!context) return;
      var tones = {
        grab: [420, 300, 0.06],
        drop: [300, 480, 0.07],
        bubble: [560, 720, 0.06],
        meet: [520, 980, 0.075],
        level: [620, 1100, 0.08]
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
        /* Audio opcional. */
      }
    }

    checkMeet() {
      if (!this.visible || this.state.dragging || this.motionOff() ||
          document.body.classList.contains('bb-mascot-hidden') ||
          document.visibilityState === 'hidden') return;
      var byte = document.querySelector('#bbMascot');
      if (!byte || !document.body.classList.contains('bb-mascot-ready')) return;
      var rect = byte.getBoundingClientRect();
      if (!rect.width) return;
      var bx = rect.left + rect.width / 2;
      var by = rect.top + rect.height / 2;
      var distance = Math.hypot(bx - this.center.x, by - this.center.y);
      if (distance < MEET_DISTANCE && Date.now() - this.state.lastMeet > MEET_COOLDOWN) {
        this.meet((bx + this.center.x) / 2, (by + this.center.y) / 2);
      }
    }

    meet(x, y) {
      this.state.lastMeet = Date.now();
      this.playClass('is-meet', 1600);
      this.showBubble('¡Hola, Byte! 🔥', 2200);
      this.burst(x, y);
      this.playTone('meet');
      window.dispatchEvent(new CustomEvent('bytebay:streak-meet', {
        detail: { dias: this.state.days, tier: this.state.tier }
      }));
    }

    burst(x, y) {
      if (this.motionOff()) return;
      var burst = document.createElement('span');
      burst.className = 'bb-meet-burst';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = Math.round(x) + 'px';
      burst.style.top = Math.round(y) + 'px';
      for (var i = 0; i < 8; i += 1) {
        var particle = document.createElement('span');
        particle.className = 'bb-meet-burst__p';
        particle.style.setProperty('--i', String(i));
        particle.textContent = i % 2 ? '✦' : '💛';
        burst.appendChild(particle);
      }
      document.body.appendChild(burst);
      window.setTimeout(function () {
        if (burst.parentNode) burst.parentNode.removeChild(burst);
      }, 1200);
    }
  }

  var companion = new StreakCompanion();
  window.StreakCompanion = StreakCompanion;
  if (companion) {
    window.ByteBayStreak = {
      refresh: companion.refresh.bind(companion),
      preview: companion.preview.bind(companion),
      setDays: function (days) { companion.apply(days, days, true); },
      hide: companion.hide.bind(companion),
      bubble: companion.showBubble.bind(companion),
      meet: companion.meet.bind(companion),
      state: companion.state
    };
  }
}());
