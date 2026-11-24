/* Byte · mascota de racha. Se muestra solo con cuenta validada; la racha y su
   nombre viven en Supabase (bb_registrar_racha / bb_renombrar_racha).
   Motor con paso fijo de 240 Hz: idéntico a 60, 120, 144 o 1000 Hz. */
(function () {
  'use strict';

  var KEY_POS = 'bytebay_streak_pos';
  var KEY_VOICE = 'bytebay_mascot_voice';
  var CACHE_PREFIX = 'bytebay_streak_cache_';
  var DRAG_THRESHOLD = 5;
  var MEET_DISTANCE = 165;
  var MEET_COOLDOWN = 5500;
  var FIXED_STEP = 1 / 240;
  var MAX_SUBSTEPS = 8;
  var DEFAULT_NAME = 'Chispa';
  var NAME_MAX = 24;
  var HATCH_DAYS = 3;
  var EGG_NAME = 'Huevo';
  var EGG_LABEL = 'Huevo de racha';
  var EGG_TIER = 0;
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

  function sanitizeName(value) {
    var text = String(value == null ? '' : value)
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return DEFAULT_NAME;
    var chars = Array.from(text);
    return (chars.length > NAME_MAX ? chars.slice(0, NAME_MAX) : chars).join('');
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
    if (days < HATCH_DAYS) return EGG_TIER;
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
      if (!this.mascot || !this.bubble) return;

      this.tooltip = document.querySelector('#bbStreakTooltip');
      this.nameNode = document.querySelector('#bbStreakName');
      this.daysNode = document.querySelector('#bbStreakDays');
      this.editButton = document.querySelector('#bbStreakEdit');
      this.editor = document.querySelector('#bbStreakNameEditor');
      this.nameInput = document.querySelector('#bbStreakNameInput');
      this.nameSave = document.querySelector('#bbStreakNameSave');
      this.nameCancel = document.querySelector('#bbStreakNameCancel');
      this.nameError = document.querySelector('#bbStreakNameError');
      this.motion = this.mascot.querySelector('.bb-streak__motion');
      this.mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.timers = {};
      this.audio = null;
      this.rafId = 0;
      this.intervalId = 0;
      this.refreshing = false;
      this.visible = false;
      this.session = null;
      this.size = { w: 72, h: 80 };

      this.state = {
        days: 0,
        best: 0,
        tier: 0,
        stage: 'egg',
        name: DEFAULT_NAME,
        customerId: 0,
        preview: false,
        dragging: false,
        quiet: false,
        lastMeet: 0,
        lastRefreshDay: '',
        lastTap: 0
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

      this.drag = {
        active: false, moved: false, pointerId: null,
        startX: 0, startY: 0, lastX: 0, baseX: 0, baseY: 0
      };
      this.center = { x: 0, y: 0 };

      this.init();
    }

    init() {
      this.measure();
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
      this.scheduleBlink();
      this.refresh();
    }

    bindEvents() {
      var self = this;
      this.mascot.addEventListener('pointerdown', function (event) { self.onPointerDown(event); });
      document.addEventListener('pointermove', function (event) {
        self.onDragMove(event);
        self.onPointerMove(event);
      }, { passive: false });
      document.addEventListener('pointerup', function (event) { self.endDrag(event, false); });
      document.addEventListener('pointercancel', function (event) { self.endDrag(event, true); });
      this.mascot.addEventListener('keydown', function (event) {
        if (event.target && typeof event.target.closest === 'function' &&
            event.target.closest('button,input')) return;
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

      if (this.editButton) {
        this.editButton.addEventListener('click', function (event) {
          event.stopPropagation();
          self.openEditor();
        });
      }
      if (this.nameSave) {
        this.nameSave.addEventListener('click', function (event) {
          event.stopPropagation();
          self.commitName();
        });
      }
      if (this.nameCancel) {
        this.nameCancel.addEventListener('click', function (event) {
          event.stopPropagation();
          self.closeEditor();
        });
      }
      if (this.nameInput) {
        this.nameInput.addEventListener('keydown', function (event) {
          event.stopPropagation();
          if (event.key === 'Enter') {
            event.preventDefault();
            self.commitName();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            self.closeEditor();
          }
        });
      }
      document.addEventListener('pointerdown', function (event) {
        if (self.editor && !self.editor.hidden && !self.mascot.contains(event.target)) self.closeEditor();
      }, true);
    }

    motionOff() {
      var fx = document.documentElement.getAttribute('data-season-fx');
      return document.body.classList.contains('bb-mascot-inactive') ||
        fx === 'off' || fx === 'reduced' ||
        Boolean(this.mediaQuery && this.mediaQuery.matches);
    }

    /* ---------- Sesión, racha y nombre ---------- */

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
        this.session = session && session.access_token ? session : null;
        if (this.session && session.customer_id) {
          this.state.customerId = Number(session.customer_id);
          var result = await this.registerServer(this.session);
          if (result && result.ok) {
            this.state.preview = false;
            this.apply(result.dias_racha, result.mejor_racha, true, result.nombre);
            this.state.lastRefreshDay = today;
            return;
          }
        }
        var account = readJSON('beruAccount');
        if (account && account.verified && Number(account.id) > 0) {
          this.state.customerId = Number(account.id);
          var cached = this.registerLocal(this.state.customerId, today);
          this.apply(cached.dias_racha, cached.mejor_racha, false, cached.nombre);
          this.state.lastRefreshDay = today;
          return;
        }
        this.session = null;
        this.closeEditor();
        if (this.state.preview) return;
        this.hide();
      } finally {
        this.refreshing = false;
      }
    }

    cacheKey(customerId) {
      return CACHE_PREFIX + (customerId || this.state.customerId || 0);
    }

    saveCache(customerId, days, best, name, fecha) {
      saveJSON(this.cacheKey(customerId), {
        dias: days,
        mejor: best,
        nombre: sanitizeName(name || this.state.name),
        fecha: String(fecha || dayKey(new Date()))
      });
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
        var name = sanitizeName(data.nombre || this.state.name);
        this.saveCache(this.state.customerId, days, isFinite(best) ? best : days, name, data.fecha);
        return {
          ok: true,
          dias_racha: days,
          mejor_racha: isFinite(best) ? best : days,
          nombre: name
        };
      } catch (error) {
        return null;
      }
    }

    registerLocal(customerId, today) {
      var cache = readJSON(this.cacheKey(customerId));
      if (!cache || !isFinite(Number(cache.dias))) {
        cache = { dias: 1, mejor: 1, nombre: DEFAULT_NAME, fecha: today };
      } else {
        cache = {
          dias: clamp(Number(cache.dias), 1, 3650),
          mejor: clamp(Number(cache.mejor) || Number(cache.dias), 1, 3650),
          nombre: sanitizeName(cache.nombre),
          fecha: String(cache.fecha || today)
        };
        if (cache.fecha !== today) {
          cache.dias = cache.fecha === previousDay(today) ? clamp(cache.dias + 1, 1, 3650) : 1;
          cache.mejor = Math.max(cache.mejor, cache.dias);
          cache.fecha = today;
        }
      }
      this.saveCache(customerId, cache.dias, cache.mejor, cache.nombre, cache.fecha);
      return { dias_racha: cache.dias, mejor_racha: cache.mejor, nombre: cache.nombre };
    }

    apply(days, best, fromServer, name) {
      days = clamp(Number(days) || 1, 1, 3650);
      best = clamp(Number(best) || days, days, 3650);
      var nextName = sanitizeName(name == null ? this.state.name : name);
      var tier = tierFor(days);
      var stage = tier === EGG_TIER ? 'egg' : 'hatched';
      var label = tier === EGG_TIER ? EGG_LABEL : TIERS[tier - 1].label;
      var wasEgg = this.visible && this.state.stage === 'egg';
      var hatching = wasEgg && stage === 'hatched';
      var leveled = this.visible && this.state.tier && tier > this.state.tier && !hatching;
      var increased = this.visible && days > this.state.days;
      var renamed = this.visible && nextName !== this.state.name;

      this.state.days = days;
      this.state.best = best;
      this.state.tier = tier;
      this.state.stage = stage;
      this.state.name = nextName;
      this.mascot.dataset.tier = String(tier);
      this.mascot.dataset.stage = stage;
      this.mascot.dataset.eggDays = String(stage === 'egg' ? days : HATCH_DAYS);
      if (stage === 'egg') {
        this.mascot.setAttribute('aria-label',
          EGG_NAME + ': llevas ' + days + ' de ' + HATCH_DAYS +
          ' días seguidos. Eclosiona al llegar a ' + HATCH_DAYS + '. Arrástralo o toca para interactuar.');
      } else {
        this.mascot.setAttribute('aria-label',
          nextName + ': ' + days + ' días consecutivos, ' + label +
          '. Arrástrala o toca para interactuar.');
      }
      if (this.badge) this.badge.textContent = days + (days === 1 ? ' día' : ' días');
      this.renderName();
      if (this.tooltip) {
        this.tooltip.textContent = stage === 'egg'
          ? EGG_NAME + ' · ' + EGG_LABEL + ' · ' + days + ' de ' + HATCH_DAYS + ' días para eclosionar.'
          : nextName + ' · ' + label + ' · ' + days + ' días seguidos.';
      }
      this.show();

      if (hatching) {
        this.playClass('is-hatching', 1250);
        this.showBubble('¡Eclosionó! Ahora soy ' + label.toLowerCase(), 2800);
        this.burst(this.center.x, this.center.y);
        this.playTone('level');
      } else if (leveled) {
        this.playClass('is-levelup', 1500);
        this.showBubble('¡Nueva forma! Ya soy ' + label.toLowerCase(), 2600);
        this.burst(this.center.x, this.center.y);
        this.playTone('level');
      } else if (renamed && !fromServer) {
        this.playClass('is-levelup', 900);
      } else if (increased && !fromServer) {
        this.playClass('is-happy', 900);
      }
    }

    renderName() {
      if (this.nameNode) {
        this.nameNode.textContent = this.state.stage === 'egg' ? EGG_NAME : this.state.name;
      }
      if (this.daysNode) {
        this.daysNode.textContent = this.state.days + (this.state.days === 1 ? ' día' : ' días');
      }
      if (this.nameInput && this.nameInput !== document.activeElement) {
        this.nameInput.value = this.state.name;
      }
    }

    show() {
      this.visible = true;
      document.body.classList.add('bb-streak-ready');
      this.mascot.classList.add('is-visible');
      this.measure();
      this.refreshCenter();
      this.render();
    }

    hide() {
      this.visible = false;
      document.body.classList.remove('bb-streak-ready');
      this.mascot.classList.remove('is-visible', 'is-meet', 'is-happy', 'is-levelup', 'is-landing', 'is-hatching', 'has-bubble');
      clearNode(this.bubble);
    }

    preview(days, name) {
      this.state.preview = true;
      var value = clamp(Number(days) || 1, 1, 3650);
      this.apply(value, Math.max(value, this.state.best), true, name);
      return { days: value, tier: this.state.tier, name: this.state.name };
    }

    /* ---------- Editor de nombre ---------- */

    openEditor() {
      if (!this.visible || !this.editor || !this.nameInput) return;
      this.editor.hidden = false;
      this.mascot.classList.add('is-editing');
      this.hideBubble();
      if (this.nameError) this.nameError.textContent = '';
      this.nameInput.value = this.state.name;
      this.nameInput.focus();
      this.nameInput.select();
    }

    closeEditor() {
      if (!this.editor) return;
      this.editor.hidden = true;
      this.mascot.classList.remove('is-editing');
      if (this.nameError) this.nameError.textContent = '';
    }

    async commitName() {
      if (!this.visible || !this.nameInput) return;
      var name = sanitizeName(this.nameInput.value);
      if (this.nameError) this.nameError.textContent = '';
      this.closeEditor();
      if (name === this.state.name) {
        this.showBubble('Tu racha ya se llama "' + name + '"', 1800);
        return;
      }

      var previous = this.state.name;
      this.state.name = name;
      this.renderName();
      this.saveCache(this.state.customerId, this.state.days, this.state.best, name, dayKey(new Date()));
      this.playClass('is-levelup', 950);
      this.showBubble('¡Desde ahora me llamo ' + name + '!', 2300);
      this.playTone('level');
      window.dispatchEvent(new CustomEvent('bytebay:streak-renamed', { detail: { nombre: name } }));

      if (!this.session || typeof supabaseClient === 'undefined' || !supabaseClient) return;
      try {
        var response = await withTimeout(
          supabaseClient.rpc('bb_renombrar_racha', {
            p_access_token: this.session.access_token,
            p_nombre: name
          }),
          6000
        );
        if (response && !response.error && response.data && response.data.ok === true) {
          var confirmed = sanitizeName(response.data.nombre);
          this.state.name = confirmed;
          this.renderName();
          this.saveCache(this.state.customerId, this.state.days, this.state.best, confirmed, dayKey(new Date()));
          return;
        }
      } catch (error) {
        /* Se conserva el nombre local; el RPC puede no estar aplicado aún. */
      }
      this.state.name = previous;
      this.renderName();
      this.saveCache(this.state.customerId, this.state.days, this.state.best, previous, dayKey(new Date()));
      if (this.nameError) this.nameError.textContent = 'No se pudo guardar en la nube.';
      this.showBubble('Guardé "' + name + '" en este dispositivo; sincroniza más tarde.', 3200);
    }

    /* ---------- Física y arrastre ---------- */

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
      var size = this.size;
      var inset = window.innerWidth < 768 ? 12 : 24;
      return {
        x: inset,
        y: Math.max(0, window.innerHeight - size.h - Math.max(inset, 86))
      };
    }

    clampPoint(x, y) {
      return {
        x: clamp(x, 0, Math.max(0, window.innerWidth - this.size.w)),
        y: clamp(y, 0, Math.max(0, window.innerHeight - this.size.h - 32))
      };
    }

    refreshCenter() {
      this.center.x = this.physics.current.x + this.size.w / 2;
      this.center.y = this.physics.current.y + this.size.h / 2;
      this.mascot.classList.toggle('is-near-left', this.physics.current.x < 100);
      this.mascot.classList.toggle('is-near-right',
        this.physics.current.x + this.size.w > window.innerWidth - 100);
      this.mascot.classList.toggle('is-top', this.physics.current.y < 110);
    }

    normalizePosition() {
      this.measure();
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
      var frame = function (time) {
        if (self.intervalId) return;
        self.tick(time);
        self.rafId = window.requestAnimationFrame(frame);
      };
      if (typeof window.requestAnimationFrame === 'function') {
        this.rafId = window.requestAnimationFrame(frame);
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
      var lerp = 1 - Math.pow(0.82, frames);
      p.look.x += (p.lookTarget.x - p.look.x) * lerp;
      p.look.y += (p.lookTarget.y - p.look.y) * lerp;
    }

    tick(time) {
      var stamp = typeof time === 'number' ? time : now();
      var elapsed = (stamp - this.physics.lastTime) / 1000;
      this.physics.lastTime = stamp;
      if (!isFinite(elapsed) || elapsed <= 0) elapsed = FIXED_STEP;
      elapsed = Math.min(elapsed, 0.1);
      this.physics.accumulator += elapsed;
      this.physics.everTicked = true;

      var steps = 0;
      while (this.physics.accumulator >= FIXED_STEP && steps < MAX_SUBSTEPS) {
        this.integrate(FIXED_STEP * 60);
        this.physics.accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === MAX_SUBSTEPS) this.physics.accumulator = 0;
      if (steps) this.refreshCenter();
      this.checkMeet();
      this.render();
    }

    render() {
      var p = this.physics;
      this.mascot.style.transform = 'translate3d(' + p.current.x.toFixed(2) + 'px,' +
        p.current.y.toFixed(2) + 'px,0)';
      if (this.motion) {
        this.motion.style.setProperty('--st-tilt', p.tilt.toFixed(2) + 'deg');
        this.motion.style.setProperty('--st-look-x', p.look.x.toFixed(2) + 'px');
        this.motion.style.setProperty('--st-look-y', p.look.y.toFixed(2) + 'px');
      }
    }

    onPointerMove(event) {
      if (!this.visible || this.state.dragging) return;
      var nx = (event.clientX - this.center.x) / Math.max(1, window.innerWidth / 2);
      var ny = (event.clientY - this.center.y) / Math.max(1, window.innerHeight / 2);
      this.physics.lookTarget.x = clamp(nx, -1, 1) * 2.2;
      this.physics.lookTarget.y = clamp(ny, -1, 1) * 1.8;
    }

    onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (!this.visible || document.body.classList.contains('bb-mascot-hidden')) return;
      if (event.target && typeof event.target.closest === 'function' &&
          event.target.closest('.bb-streak__bubble,.bb-streak__editor,.bb-streak__edit')) return;
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
        this.closeEditor();
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
        var point = { x: this.physics.target.x, y: this.physics.target.y };
        if (point.x < 40) point.x = 0;
        else if (window.innerWidth - (point.x + this.size.w) < 40) {
          point.x = Math.max(0, window.innerWidth - this.size.w);
        }
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

    scheduleBlink() {
      var self = this;
      var next = function () {
        var delay = 2600 + Math.random() * 4200;
        self.timers.blink = window.setTimeout(function () {
          self.playClass('is-blinking', 220);
          next();
        }, delay);
      };
      next();
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
      var stamp = Date.now();
      var doubleTap = stamp - this.state.lastTap < 360;
      this.state.lastTap = stamp;
      this.playClass(doubleTap ? 'is-levelup' : 'is-happy', doubleTap ? 1100 : 950);
      var messages = this.state.stage === 'egg'
        ? [
          EGG_NAME + ' lleva ' + this.state.days + ' de ' + HATCH_DAYS + ' días',
          'Eclosiona al llegar a ' + HATCH_DAYS + ' días seguidos',
          'Vuelve mañana para seguir incubando',
          'Toca el lápiz para elegir su nombre al eclosionar'
        ]
        : [
          this.state.name + ' lleva ' + this.state.days + ' días seguidos',
          TIERS[this.state.tier - 1].label + ' · ' + this.state.best + ' días como máximo',
          'Vuelve mañana y ' + this.state.name + ' sigue creciendo',
          'Toca el lápiz para cambiar el nombre de tu racha'
        ];
      this.showBubble(messages[Math.floor(Math.random() * messages.length)], 2900);
      this.playTone(doubleTap ? 'level' : 'bubble');
      if (doubleTap) this.burst(this.center.x, this.center.y);
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
      if (!document.body.classList.contains('bb-mascot-ready')) return;
      var byte = window.ByteBayCompanion;
      var bx, by;
      if (byte && byte.center && isFinite(byte.center.x) && isFinite(byte.center.y)) {
        bx = byte.center.x;
        by = byte.center.y;
      } else {
        var node = document.querySelector('#bbMascot');
        if (!node) return;
        var rect = node.getBoundingClientRect();
        if (!rect.width) return;
        bx = rect.left + rect.width / 2;
        by = rect.top + rect.height / 2;
      }
      var distance = Math.hypot(bx - this.center.x, by - this.center.y);
      if (distance < MEET_DISTANCE && Date.now() - this.state.lastMeet > MEET_COOLDOWN) {
        this.meet((bx + this.center.x) / 2, (by + this.center.y) / 2);
      }
    }

    meet(x, y) {
      this.state.lastMeet = Date.now();
      this.playClass('is-meet', 1600);
      this.showBubble('¡Hola, Byte! Soy ' + this.state.name, 2300);
      this.burst(x, y);
      this.playTone('meet');
      window.dispatchEvent(new CustomEvent('bytebay:streak-meet', {
        detail: {
          dias: this.state.days,
          tier: this.state.tier,
          nombre: this.state.name
        }
      }));
    }

    burst(x, y) {
      if (this.motionOff()) return;
      var burst = document.createElement('span');
      burst.className = 'bb-meet-burst';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = Math.round(x) + 'px';
      burst.style.top = Math.round(y) + 'px';
      for (var i = 0; i < 12; i += 1) {
        var particle = document.createElement('span');
        particle.className = 'bb-meet-burst__p';
        particle.style.setProperty('--i', String(i));
        burst.appendChild(particle);
      }
      document.body.appendChild(burst);
      window.setTimeout(function () {
        if (burst.parentNode) burst.parentNode.removeChild(burst);
      }, 1300);
    }
  }

  var companion = new StreakCompanion();
  window.StreakCompanion = StreakCompanion;
  if (companion) {
    window.ByteBayStreak = {
      refresh: companion.refresh.bind(companion),
      preview: companion.preview.bind(companion),
      setDays: function (days) { companion.apply(days, days, true); },
      setName: function (nombre) {
        if (companion.nameInput) companion.nameInput.value = nombre;
        return companion.commitName();
      },
      openNameEditor: companion.openEditor.bind(companion),
      hide: companion.hide.bind(companion),
      bubble: companion.showBubble.bind(companion),
      meet: companion.meet.bind(companion),
      hatchDays: HATCH_DAYS,
      instance: companion,
      state: companion.state
    };
  }
}());
