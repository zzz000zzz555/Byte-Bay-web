/* ==========================================================================
   BYTE BAY — ATMOSPHERE ENGINE
   Decoración estacional + partículas por tema. Sin dependencias.
   - Prefs: bytebay_ux_prefs (migra bytebay_user_fx_prefs).
   - 0 RAF cuando está apagado, oculto o en modo rendimiento.
   - data-season-fx = on | off | reduced gobierna la capa CSS.
   ========================================================================== */
(function () {
  'use strict';

  var NEW_KEY = 'bytebay_ux_prefs';
  var OLD_KEY = 'bytebay_user_fx_prefs';
  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reducedMotion = reduceQuery.matches;

  /* ---------- Preferencias ---------- */
  function persist(p) {
    try { localStorage.setItem(NEW_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function loadPrefs() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(NEW_KEY) || 'null') || {}; } catch (e) {}
    if (!Object.prototype.hasOwnProperty.call(p, 'fx')) {
      var old = {};
      var hadOld = false;
      try {
        var raw = localStorage.getItem(OLD_KEY);
        hadOld = !!raw;
        old = JSON.parse(raw || 'null') || {};
      } catch (e) {}
      // Por defecto el ambiente se ve y se anima; se respeta la decisión previa.
      p = {
        fx: hadOld ? old.fx === true : !reducedMotion,
        perf: hadOld ? old.perf === true : false,
        density: old.density || 'normal'
      };
      delete p.music;
      persist(p);
    }
    return {
      fx: p.fx === true,
      perf: p.perf === true,
      density: ['low', 'normal', 'high'].indexOf(p.density) > -1 ? p.density : 'normal'
    };
  }
  var prefs = loadPrefs();

  function applyFxFlag() {
    var active = prefs.fx && !prefs.perf;
    root.setAttribute('data-season-fx', reducedMotion ? 'reduced' : (active ? 'on' : 'off'));
  }
  applyFxFlag();

  /* ---------- Tema activo ---------- */
  var THEME_CLASSES = [
    'default', 'black_friday', 'navidad', 'halloween', 'ano_nuevo',
    'cyber_days', 'san_valentin', 'dia_madre_padre', 'fiestas_patrias', 'vuelta_clases'
  ];
  function activeTheme() {
    for (var i = 0; i < THEME_CLASSES.length; i++) {
      if (document.body.classList.contains('theme-' + THEME_CLASSES[i])) return THEME_CLASSES[i];
    }
    var cls = document.body.className || '';
    for (var j = 0; j < THEME_CLASSES.length; j++) {
      if (cls.indexOf('theme-' + THEME_CLASSES[j].replace(/_/g, '-')) > -1) return THEME_CLASSES[j];
    }
    return 'default';
  }

  /* ---------- SVG base reutilizable ---------- */
  function webMarkup() {
    var s = '', i, a, r, d;
    for (i = 0; i <= 6; i++) {
      a = (Math.PI / 2) * (i / 6);
      s += '<path d="M0 0 L' + (150 * Math.cos(a)).toFixed(1) + ' ' + (150 * Math.sin(a)).toFixed(1) + '"/>';
    }
    for (r = 30; r <= 150; r += 30) {
      d = 'M' + r + ' 0';
      for (i = 1; i <= 6; i++) {
        a = (Math.PI / 2) * (i / 6);
        d += ' Q' + (r * Math.cos(a / 2) * 1.06).toFixed(1) + ' ' + (r * Math.sin(a / 2) * 1.06).toFixed(1) +
             ' ' + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1);
      }
      s += '<path d="' + d + '"/>';
    }
    return s;
  }
  function injectDefs() {
    if (document.getElementById('bbSvgDefs')) return;
    var defs = document.createElement('div');
    defs.id = 'bbSvgDefs';
    defs.className = 'bb-svg-defs';
    defs.setAttribute('aria-hidden', 'true');
    defs.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
        '<symbol id="bb-sprig" viewBox="0 0 52 34">' +
          '<path d="M26 34V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M26 31 10 17M26 27 13 11M26 22 16 5M26 31 42 17M26 27 39 11M26 22 36 5" ' +
            'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>' +
          '<path d="M26 18 19 12M26 18 33 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
        '</symbol>' +
        '<symbol id="bb-bat" viewBox="0 0 64 34">' +
          '<path d="M32 13c-6-7-12-6-15-1-6-5-14-2-17 6 8-4 13-1 17 4 3-3 8-1 15 4 7-5 12-7 15-4 4-5 9-8 17-4-3-8-11-11-17-6-3-5-9-6-15 1z"/>' +
        '</symbol>' +
        '<symbol id="bb-heart" viewBox="0 0 24 24">' +
          '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>' +
        '</symbol>' +
        '<symbol id="bb-web" viewBox="0 0 150 150">' + webMarkup() + '</symbol>' +
      '</defs></svg>';
    document.body.appendChild(defs);
  }

  /* ---------- Montaje de capas ---------- */
  var stage, headerDecor, heroDecor;
  function buildScaffold() {
    injectDefs();

    stage = document.createElement('div');
    stage.className = 'bb-season-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML =
      '<div class="bb-drift bb-drift--back"></div>' +
      '<div class="bb-drift"></div>' +
      '<div class="bb-vignette"></div>';
    document.body.appendChild(stage);

    headerDecor = document.createElement('div');
    headerDecor.className = 'bb-season-header';
    headerDecor.setAttribute('aria-hidden', 'true');
    var headerEl = document.querySelector('.header');
    if (headerEl) headerEl.appendChild(headerDecor);
    else document.body.appendChild(headerDecor);

    heroDecor = document.createElement('div');
    heroDecor.className = 'bb-season-hero bb-hero-decor';
    heroDecor.setAttribute('aria-hidden', 'true');
    var heroEl = document.querySelector('.hero');
    if (heroEl) heroEl.appendChild(heroDecor);
  }

  function garlandMarkup() {
    var i, bulbs = '', sprigs = '';
    for (i = 0; i < 16; i++) bulbs += '<span class="bb-bulb" style="--i:' + i + '"></span>';
    for (i = 0; i < 20; i++) {
      sprigs += '<svg class="bb-sprig" style="--i:' + i + '" viewBox="0 0 52 34" aria-hidden="true"><use href="#bb-sprig"/></svg>';
    }
    return '<div class="bb-garland">' +
      '<span class="bb-garland__cord"></span>' +
      '<div class="bb-garland__sprigs">' + sprigs + '</div>' +
      '<div class="bb-garland__bulbs">' + bulbs + '</div>' +
      '</div>';
  }

  function seal(text) {
    return '<div class="bb-seal">' + text + '</div>';
  }
  function heroMarkup(theme) {
    var html = '', i;
    if (theme === 'navidad') {
      html += '<div class="bb-frost"></div>' + seal('Feliz<br>Navidad');
      var colors = ['red', 'gold', 'green', 'gold', 'red'];
      for (i = 0; i < colors.length; i++) {
        html += '<span class="bb-bauble bb-bauble--' + colors[i] + '" style="--i:' + i + ';left:' + (36 + i * 12) + '%">' +
          '<span class="bb-bauble__string"></span><span class="bb-bauble__cap"></span><span class="bb-bauble__glass"></span></span>';
      }
      html += '<span class="bb-script">Feliz Navidad</span>';
    } else if (theme === 'halloween') {
      html += '<span class="bb-moon"></span>' +
        '<span class="bb-web bb-web--tl"><svg viewBox="0 0 150 150"><use href="#bb-web"/></svg></span>' +
        '<span class="bb-web bb-web--br"><svg viewBox="0 0 150 150"><use href="#bb-web"/></svg></span>' +
        '<span class="bb-lantern"></span>' + seal('Halloween');
      for (i = 0; i < 4; i++) {
        html += '<span class="bb-bat' + (i > 1 ? ' bb-bat--far' : '') + '" style="--i:' + i + ';top:' + (12 + i * 13) + '%">' +
          '<svg viewBox="0 0 64 34"><use href="#bb-bat"/></svg></span>';
      }
      html += '<span class="bb-script">Halloween</span>';
    } else if (theme === 'ano_nuevo') {
      html += '<span class="bb-burst bb-burst--a"></span><span class="bb-burst bb-burst--b"></span>' +
        seal('Feliz<br>Año Nuevo') + '<span class="bb-script">Feliz Año Nuevo</span>';
    } else if (theme === 'black_friday' || theme === 'cyber_days') {
      html += '<span class="bb-shine"></span>' + seal(theme === 'black_friday' ? 'Black<br>Friday' : 'Cyber<br>Days') +
        '<span class="bb-script">' + (theme === 'black_friday' ? 'Black Friday' : 'Cyber Days') + '</span>';
    } else if (theme === 'san_valentin' || theme === 'dia_madre_padre') {
      for (i = 0; i < 5; i++) {
        html += '<span class="bb-heart" style="--i:' + i + ';left:' + (10 + i * 19) + '%">' +
          '<svg viewBox="0 0 24 24"><use href="#bb-heart"/></svg></span>';
      }
      html += seal(theme === 'san_valentin' ? 'San<br>Valentín' : 'Madre<br>y Padre') +
        '<span class="bb-script">' + (theme === 'san_valentin' ? 'Con amor' : 'Gracias, mamá y papá') + '</span>';
    } else if (theme === 'fiestas_patrias') {
      var flags = '', f;
      for (f = 0; f < 14; f++) flags += '<span class="bb-flag" style="--i:' + f + '"></span>';
      html += '<div class="bb-bunting">' + flags + '</div>' + seal('Fiestas<br>Patrias') + '<span class="bb-script">Viva el Perú</span>';
    } else if (theme === 'vuelta_clases') {
      html += '<div class="bb-paper"></div>' + seal('Vuelta<br>a clases') + '<span class="bb-script">Vuelta a clases</span>';
    } else {
      html += '<span class="bb-shine"></span>';
    }
    return html;
  }

  function renderDecor() {
    var theme = activeTheme();
    if (!stage) return;
    var festive = theme !== 'default';
    stage.style.display = festive ? '' : 'none';
    if (headerDecor) headerDecor.innerHTML = festive ? garlandMarkup() : '';
    if (heroDecor) heroDecor.innerHTML = festive ? heroMarkup(theme) : '';
    stage.querySelector('.bb-vignette').style.setProperty('--vignette',
      theme === 'navidad' ? 'rgb(127 29 29 / .10)' :
      theme === 'halloween' || theme === 'black_friday' || theme === 'cyber_days' || theme === 'ano_nuevo'
        ? 'rgb(0 0 0 / .24)' : 'rgb(15 23 42 / .12)');
  }

  /* ---------- Canvas de partículas ---------- */
  var canvas = document.createElement('canvas');
  canvas.id = 'atmosphereCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:none;opacity:.9;transition:opacity .2s ease;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', function () { resize(); initParticles(); }, { passive: true });
  resize();

  var sprites = {};
  function sprite(key, paint) {
    if (sprites[key]) return sprites[key];
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    paint(x);
    sprites[key] = c;
    return c;
  }
  var snowSprite = sprite('snow', function (x) {
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.28, 'rgba(191,219,254,.96)');
    g.addColorStop(.72, 'rgba(147,197,253,.5)');
    g.addColorStop(.9, 'rgba(30,41,59,.22)');
    g.addColorStop(1, 'rgba(30,41,59,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
  var emberSprite = sprite('ember', function (x) {
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,237,213,1)');
    g.addColorStop(.25, 'rgba(251,146,60,.9)');
    g.addColorStop(.65, 'rgba(249,115,22,.35)');
    g.addColorStop(1, 'rgba(249,115,22,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
  var fogSprite = sprite('fog', function (x) {
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(203,213,225,.5)');
    g.addColorStop(1, 'rgba(203,213,225,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
  var heartSprite = sprite('heart', function (x) {
    x.fillStyle = '#fb7185';
    x.beginPath();
    x.moveTo(32, 52);
    x.bezierCurveTo(4, 34, 8, 12, 25, 14);
    x.bezierCurveTo(30, 15, 32, 19, 32, 19);
    x.bezierCurveTo(32, 19, 34, 15, 39, 14);
    x.bezierCurveTo(56, 12, 60, 34, 32, 52);
    x.fill();
  });

  var particles = [], bats = [], fogs = [], rockets = [], sparks = [];
  var rafId = null, running = false, frame = 0;

  function density() { return prefs.density === 'low' ? .5 : prefs.density === 'high' ? 1.7 : 1; }
  function count(base) { return Math.max(4, Math.round(base * (w < 768 ? .55 : 1) * density())); }

  function makeSnow(seedTop) {
    var depth = Math.random();
    return {
      x: Math.random() * w,
      y: seedTop ? Math.random() * -h : -12,
      r: 3 + depth * 8,
      vy: .35 + depth * 1.15,
      sway: .25 + depth * .85,
      phase: Math.random() * Math.PI * 2,
      alpha: .45 + depth * .5
    };
  }
  function makeEmber() {
    return { x: Math.random() * w, y: h + Math.random() * 40, r: 3 + Math.random() * 7, vy: -.35 - Math.random() * .9, sway: .3 + Math.random() * .8, phase: Math.random() * 6.28, alpha: .35 + Math.random() * .5 };
  }
  function makeBat() {
    return { x: -70, y: 40 + Math.random() * (h * .35), vx: .9 + Math.random() * 1.6, r: 14 + Math.random() * 14, phase: Math.random() * 6.28 };
  }
  function makeConfetti() {
    var gold = ['#fbbf24', '#f59e0b', '#dc2626', '#f8fafc', '#a78bfa'];
    return { x: Math.random() * w, y: Math.random() * -h, r: 3 + Math.random() * 5, vy: .8 + Math.random() * 1.6, vx: -.5 + Math.random(), rot: Math.random() * 360, rs: -2 + Math.random() * 4, color: gold[(Math.random() * gold.length) | 0], flip: Math.random() * 6.28 };
  }
  function makeHeart() {
    return { x: Math.random() * w, y: h + Math.random() * 60, r: 6 + Math.random() * 10, vy: -.4 - Math.random() * .7, sway: .4 + Math.random() * .9, phase: Math.random() * 6.28, alpha: .35 + Math.random() * .45 };
  }
  function makeRocket() {
    var tx = w * (.12 + Math.random() * .76);
    var ty = h * (.12 + Math.random() * .32);
    var x = tx + (Math.random() - .5) * w * .28;
    return { x: x, y: h + 10, tx: tx, ty: ty, vx: (tx - x) / 52, vy: (ty - h) / 52, trail: [], color: ['#fbbf24', '#f472b6', '#a78bfa', '#f8fafc'][(Math.random() * 4) | 0] };
  }

  function initParticles() {
    particles = []; bats = []; fogs = []; rockets = []; sparks = [];
    var theme = activeTheme();
    if (theme === 'navidad') {
      for (var i = 0; i < count(46); i++) particles.push(makeSnow(true));
    } else if (theme === 'halloween') {
      for (var j = 0; j < count(22); j++) particles.push(makeEmber());
      for (var k = 0; k < 3; k++) fogs.push({ x: Math.random() * w, y: h * (.55 + Math.random() * .3), r: 180 + Math.random() * 160, vx: .12 + Math.random() * .2 });
      for (var b = 0; b < (w < 768 ? 1 : 3); b++) bats.push(makeBat());
    } else if (theme === 'ano_nuevo') {
      for (var f = 0; f < 3; f++) rockets.push(makeRocket());
    } else if (theme === 'san_valentin' || theme === 'dia_madre_padre') {
      for (var hh = 0; hh < count(16); hh++) particles.push(makeHeart());
    } else if (theme === 'black_friday' || theme === 'cyber_days' || theme === 'fiestas_patrias' || theme === 'vuelta_clases') {
      for (var c = 0; c < count(30); c++) particles.push(makeConfetti());
    }
    canvas.style.opacity = theme === 'default' ? '0' : '.9';
  }

  function explode(r) {
    var n = w < 768 ? 16 : 26;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + Math.random() * .15;
      var sp = 1.3 + Math.random() * 2.9;
      sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 42 + Math.random() * 28, max: 70, color: r.color });
    }
  }

  function draw(time) {
    frame++;
    ctx.clearRect(0, 0, w, h);
    var theme = activeTheme();

    if (theme === 'navidad') {
      ctx.globalCompositeOperation = 'source-over';
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y += p.vy;
        p.x += Math.sin(time * .0011 + p.phase) * p.sway;
        if (p.y > h + 14) { p.y = -14; p.x = Math.random() * w; }
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(snowSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    } else if (theme === 'halloween') {
      ctx.globalCompositeOperation = 'lighter';
      for (var e = 0; e < particles.length; e++) {
        var em = particles[e];
        em.y += em.vy;
        em.x += Math.sin(time * .0016 + em.phase) * em.sway;
        if (em.y < -14) { em.y = h + 14; em.x = Math.random() * w; }
        ctx.globalAlpha = em.alpha * (.7 + .3 * Math.sin(time * .01 + em.phase));
        ctx.drawImage(emberSprite, em.x - em.r, em.y - em.r, em.r * 2, em.r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (var g = 0; g < fogs.length; g++) {
        var fg = fogs[g];
        fg.x += fg.vx;
        if (fg.x - fg.r > w) fg.x = -fg.r;
        ctx.globalAlpha = .12;
        ctx.drawImage(fogSprite, fg.x - fg.r, fg.y - fg.r * .45, fg.r * 2, fg.r * .9);
      }
      for (var bi = 0; bi < bats.length; bi++) {
        var bt = bats[bi];
        bt.x += bt.vx;
        if (bt.x > w + 90) { bt.x = -90; bt.y = 40 + Math.random() * (h * .35); }
        var flap = .55 + .45 * Math.abs(Math.sin(time * .009 + bt.phase));
        ctx.save();
        ctx.translate(bt.x, bt.y + Math.sin(time * .002 + bt.phase) * 14);
        ctx.scale(1, flap);
        ctx.globalAlpha = .78;
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-bt.r * .35, -bt.r * .55, -bt.r * .8, -bt.r * .3, -bt.r, 0);
        ctx.bezierCurveTo(-bt.r * .6, -bt.r * .1, -bt.r * .5, bt.r * .2, 0, bt.r * .22);
        ctx.bezierCurveTo(bt.r * .5, bt.r * .2, bt.r * .6, -bt.r * .1, bt.r, 0);
        ctx.bezierCurveTo(bt.r * .8, -bt.r * .3, bt.r * .35, -bt.r * .55, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    } else if (theme === 'ano_nuevo') {
      ctx.globalCompositeOperation = 'lighter';
      if (rockets.length < 4 && Math.random() < .012) rockets.push(makeRocket());
      for (var ri = rockets.length - 1; ri >= 0; ri--) {
        var rk = rockets[ri];
        rk.trail.push({ x: rk.x, y: rk.y });
        if (rk.trail.length > 9) rk.trail.shift();
        rk.x += rk.vx; rk.y += rk.vy; rk.vy += .012;
        for (var t = 0; t < rk.trail.length; t++) {
          ctx.globalAlpha = (t / rk.trail.length) * .7;
          ctx.fillStyle = rk.color;
          ctx.beginPath();
          ctx.arc(rk.trail[t].x, rk.trail[t].y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff7ed';
        ctx.beginPath(); ctx.arc(rk.x, rk.y, 2.6, 0, Math.PI * 2); ctx.fill();
        if (rk.y <= rk.ty + 6 || rk.vy > 0) { explode(rk); rockets.splice(ri, 1); }
      }
      for (var si = sparks.length - 1; si >= 0; si--) {
        var sp = sparks[si];
        sp.x += sp.vx; sp.y += sp.vy; sp.vy += .028; sp.vx *= .992; sp.life--;
        ctx.globalAlpha = Math.max(0, sp.life / sp.max);
        ctx.fillStyle = sp.color;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.7, 0, Math.PI * 2); ctx.fill();
        if (sp.life <= 0) sparks.splice(si, 1);
      }
    } else if (theme === 'san_valentin' || theme === 'dia_madre_padre') {
      ctx.globalCompositeOperation = 'source-over';
      for (var hi = 0; hi < particles.length; hi++) {
        var hp = particles[hi];
        hp.y += hp.vy;
        hp.x += Math.sin(time * .0014 + hp.phase) * hp.sway;
        if (hp.y < -20) { hp.y = h + 20; hp.x = Math.random() * w; }
        ctx.globalAlpha = hp.alpha;
        ctx.drawImage(heartSprite, hp.x - hp.r, hp.y - hp.r, hp.r * 2, hp.r * 2);
      }
    } else if (theme === 'black_friday' || theme === 'cyber_days' || theme === 'fiestas_patrias' || theme === 'vuelta_clases') {
      ctx.globalCompositeOperation = 'source-over';
      for (var ci = 0; ci < particles.length; ci++) {
        var cf = particles[ci];
        cf.y += cf.vy; cf.x += cf.vx; cf.rot += cf.rs; cf.flip += .06;
        if (cf.y > h + 12) { cf.y = -12; cf.x = Math.random() * w; }
        ctx.save();
        ctx.translate(cf.x, cf.y);
        ctx.rotate(cf.rot * Math.PI / 180);
        ctx.scale(1, Math.abs(Math.cos(cf.flip)) * .7 + .3);
        ctx.globalAlpha = .78;
        ctx.fillStyle = cf.color;
        ctx.fillRect(-cf.r, -cf.r * .38, cf.r * 2, cf.r * .76);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    rafId = requestAnimationFrame(draw);
  }

  function startParticles() {
    var active = prefs.fx && !prefs.perf && !reducedMotion && !document.hidden;
    if (!active || running) return;
    running = true;
    initParticles();
    rafId = requestAnimationFrame(draw);
  }
  function stopParticles() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, w, h);
  }

  /* ---------- Panel del cliente ---------- */
  var widget = document.createElement('div');
  widget.id = 'atmosphereWidget';
  widget.setAttribute('aria-label', 'Preferencias de movimiento y efectos');
  widget.innerHTML =
    '<button class="atmosphere-toggle" type="button" aria-expanded="false" aria-controls="atmosphereOptions">' +
      '<span>Movimiento y efectos</span><span class="atmosphere-chevron" aria-hidden="true"></span>' +
    '</button>' +
    '<div class="atmosphere-options" id="atmosphereOptions" hidden>' +
      '<label><input type="checkbox" id="fxToggle"' + (prefs.fx ? ' checked' : '') + '> Efectos estacionales</label>' +
      '<label><input type="checkbox" id="perfToggle"' + (prefs.perf ? ' checked' : '') + '> Reducir animación y uso de recursos</label>' +
      '<label class="bb-density-label">Densidad de efectos' +
        '<select id="fxDensity">' +
          '<option value="low"' + (prefs.density === 'low' ? ' selected' : '') + '>Ligera</option>' +
          '<option value="normal"' + (prefs.density === 'normal' ? ' selected' : '') + '>Equilibrada</option>' +
          '<option value="high"' + (prefs.density === 'high' ? ' selected' : '') + '>Completa</option>' +
        '</select>' +
      '</label>' +
      '<p class="bb-fx-note">Si tu sistema solicita menos movimiento, la decoración se muestra quieta.</p>' +
    '</div>';
  var settingsBody = document.querySelector('.settings-body');
  (settingsBody || document.body).appendChild(widget);

  var fxToggle = widget.querySelector('#fxToggle');
  var perfToggle = widget.querySelector('#perfToggle');
  var densitySelect = widget.querySelector('#fxDensity');
  var toggleBtn = widget.querySelector('.atmosphere-toggle');
  var options = widget.querySelector('#atmosphereOptions');

  toggleBtn.addEventListener('click', function () {
    var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
    options.hidden = expanded;
  });
  fxToggle.addEventListener('change', function (e) {
    prefs.fx = e.target.checked; persist(prefs); applyFxFlag();
    if (prefs.fx && !prefs.perf) startParticles(); else stopParticles();
  });
  perfToggle.addEventListener('change', function (e) {
    prefs.perf = e.target.checked; persist(prefs); applyFxFlag();
    if (prefs.perf) stopParticles(); else if (prefs.fx) startParticles();
  });
  densitySelect.addEventListener('change', function (e) {
    prefs.density = e.target.value; persist(prefs); initParticles();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopParticles();
    else if (prefs.fx && !prefs.perf) startParticles();
  });
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener('change', function (e) {
      reducedMotion = e.matches; applyFxFlag();
      if (reducedMotion) stopParticles(); else startParticles();
    });
  }

  var lastTheme = activeTheme();
  function onThemeChange() {
    var theme = activeTheme();
    if (theme === lastTheme) return;
    lastTheme = theme;
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('bb-theme', theme); } catch (e) {}
    renderDecor();
    stopParticles();
    startParticles();
  }
  window.addEventListener('bb:theme-changed', function (e) {
    if (e && e.detail && e.detail.clave) {
      var key = String(e.detail.clave).replace(/-/g, '_');
      if (THEME_CLASSES.indexOf(key) > -1) {
        root.setAttribute('data-theme', key);
        try { localStorage.setItem('bb-theme', key); } catch (err) {}
      }
    }
    setTimeout(onThemeChange, 0);
  });
  var observer = new MutationObserver(function () { onThemeChange(); });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Arranque ---------- */
  buildScaffold();
  renderDecor();
  if (prefs.fx && !prefs.perf && !reducedMotion) setTimeout(startParticles, 500);
})();
