
(function(){
  const PREFS_KEY = 'bytebay_user_fx_prefs';
  const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{"fx":false,"perf":false}');
  const hadMusicPreference = Object.prototype.hasOwnProperty.call(prefs, 'music');
  delete prefs.music;
  function savePrefs(){ localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
  if(hadMusicPreference) savePrefs();

  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.id = 'atmosphereCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:none;opacity:1;transition:opacity .3s ease;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId = null;
  let running = false;

  function resize(){
    canvas.width = window.innerWidth * (window.devicePixelRatio||1);
    canvas.height = window.innerHeight * (window.devicePixelRatio||1);
    canvas.style.width = window.innerWidth+'px';
    canvas.style.height = window.innerHeight+'px';
    ctx.setTransform(window.devicePixelRatio||1,0,0,window.devicePixelRatio||1,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  const maxParticles = reducedMotion ? 10 : (isMobile ? 25 : 80);

  // Particle factory
  function createParticle(type){
    const w = window.innerWidth, h = window.innerHeight;
    if(type==='snow'){
      return { x: Math.random()*w, y: Math.random()*-h, r: 2+Math.random()*4, vy: 1+Math.random()*2, vx: -0.8+Math.random()*1.6, opacity: 0.6+Math.random()*0.4, type };
    }
    if(type==='bat'){
      return { x: -50, y: 50+Math.random()*200, vx: 2+Math.random()*3, vy: Math.random()*0.5-0.25, r: 8+Math.random()*6, opacity: 0.7+Math.random()*0.3, type, life: 0 };
    }
    if(type==='confetti'){
      return { x: Math.random()*w, y: Math.random()*-h, r: 2+Math.random()*4, vy: 1+Math.random()*2, vx: -1+Math.random()*2, rot: Math.random()*360, rotSpeed: -3+Math.random()*6, opacity: 0.6+Math.random()*0.4, type, color: Math.random()>0.5?'#fbbf24':'#f59e0b' };
    }
    if(type==='spark'){
      return { x: Math.random()*w, y: Math.random()*h, r: 1+Math.random()*2, vy: -0.3-Math.random()*0.8, vx: -0.5+Math.random()*1, opacity: 0.5+Math.random()*0.5, type, life: 60+Math.random()*60 };
    }
    if(type==='firework'){
      return { x: w*0.2+Math.random()*w*0.6, y: h*0.1+Math.random()*h*0.3, r: 0, vy: 0, vx: 0, opacity: 1, type, life: 40+Math.random()*30, particles: [] };
    }
    return { x: Math.random()*w, y: Math.random()*h, r: 2, vy: 0, vx: 0, opacity: 0.5, type };
  }

  function getThemeType(){
    const cls = document.body.className;
    if(cls.includes('theme-navidad')) return 'snow';
    if(cls.includes('theme-halloween')) return 'halloween';
    if(cls.includes('theme-black_friday') || cls.includes('theme-cyber_days')) return 'confetti';
    if(cls.includes('theme-ano_nuevo')) return 'firework';
    return null;
  }

  function initParticles(){
    particles = [];
    const type = getThemeType();
    if(!type || !prefs.fx || prefs.perf) return;
    const count = maxParticles;
    if(type==='snow'){
      for(let i=0;i<count;i++) particles.push(createParticle('snow'));
    } else if(type==='halloween'){
      for(let i=0;i<Math.floor(count*0.6);i++) particles.push(createParticle('spark'));
      // bats occasionally
    } else if(type==='confetti'){
      for(let i=0;i<count;i++) particles.push(createParticle('confetti'));
    } else if(type==='firework'){
      for(let i=0;i<6;i++) particles.push(createParticle('firework'));
    }
  }

  function drawParticles(){
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const w = window.innerWidth, h = window.innerHeight;
    const type = getThemeType();
    if(!type || !prefs.fx || prefs.perf){ 
      rafId = requestAnimationFrame(drawParticles);
      return;
    }

    // snow
    if(type==='snow'){
      particles.forEach(p=>{
        p.y += p.vy; p.x += p.vx;
        if(p.y > h){ p.y = -10; p.x = Math.random()*w; }
        if(p.x > w) p.x = 0; if(p.x < 0) p.x = w;
        // shadow for visibility on light backgrounds
        const isNavidad = document.body.classList.contains('theme-navidad');
        const flakeColor = isNavidad ? `rgba(147,197,253,${p.opacity})` : `rgba(255,255,255,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r+1.5, 0, Math.PI*2);
        ctx.fillStyle = isNavidad ? `rgba(30,41,59,0.4)` : `rgba(100,116,139,0.3)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = flakeColor;
        ctx.fill();
      });
    }
    // halloween sparks
    else if(type==='halloween'){
      particles.forEach(p=>{
        p.life--;
        p.y += p.vy; p.x += p.vx; p.opacity -= 0.005;
        if(p.life<=0 || p.opacity<=0){
          Object.assign(p, createParticle('spark'));
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(249,115,22,${p.opacity})`;
        ctx.fill();
      });
      // occasional bat
      if(Math.random() < 0.003 && particles.length < maxParticles+5){
        particles.push(createParticle('bat'));
      }
      particles.filter(p=>p.type==='bat').forEach(p=>{
        p.x += p.vx; p.y += p.vy; p.life++;
        if(p.x > w+50){ p.x = -50; p.y = 50+Math.random()*200; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = `rgba(30,30,30,${0.8})`;
        ctx.beginPath();
        ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      });
    }
    // confetti
    else if(type==='confetti'){
      particles.forEach(p=>{
        p.y += p.vy; p.x += p.vx; p.rot += p.rotSpeed;
        if(p.y > h){ p.y = -10; p.x = Math.random()*w; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
        ctx.globalAlpha = 1;
        ctx.restore();
      });
    }
    // fireworks
    else if(type==='firework'){
      particles.forEach(p=>{
        p.life--;
        if(p.particles.length === 0 && p.life < 30){
          // explode
          for(let i=0;i<20;i++){
            p.particles.push({x:p.x,y:p.y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:20+Math.random()*20,opacity:1});
          }
        }
        if(p.particles.length>0){
          p.particles.forEach(pp=>{
            pp.x+=pp.vx; pp.y+=pp.vy; pp.vy+=0.05; pp.life--; pp.opacity-=0.03;
            if(pp.life>0 && pp.opacity>0){
              ctx.beginPath();
              ctx.arc(pp.x,pp.y,2,0,Math.PI*2);
              ctx.fillStyle=`rgba(245,158,11,${pp.opacity})`;
              ctx.fill();
            }
          });
          p.particles = p.particles.filter(pp=>pp.life>0 && pp.opacity>0);
        }
        if(p.life<=0 && p.particles.length===0){
          Object.assign(p, createParticle('firework'));
        }
      });
    }
    rafId = requestAnimationFrame(drawParticles);
  }

  function startParticles(){
    if(reducedMotion || document.hidden || running) return;
    running = true;
    initParticles();
    rafId = requestAnimationFrame(drawParticles);
  }
  function stopParticles(){
    running = false;
    if(rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
  }

  // Widget UI
  const widget = document.createElement('div');
  widget.id = 'atmosphereWidget';
  widget.setAttribute('aria-label', 'Preferencias visuales');
  widget.innerHTML = `
    <button class="atmosphere-toggle" type="button" aria-expanded="false" aria-controls="atmosphereOptions">
      <span>Preferencias visuales</span><span class="atmosphere-chevron" aria-hidden="true"></span>
    </button>
    <div class="atmosphere-options" id="atmosphereOptions" hidden>
    <label>
      <input type="checkbox" id="fxToggle" ${prefs.fx?'checked':''}> Efectos visuales
    </label>
    <label>
      <input type="checkbox" id="perfToggle" ${prefs.perf?'checked':''}> Modo rendimiento (sin lag)
    </label>
    </div>
  `;
  document.body.appendChild(widget);

  // Event handlers
  const fxToggle = document.querySelector('#fxToggle');
  const perfToggle = document.querySelector('#perfToggle');

  fxToggle.addEventListener('change', e => {
    prefs.fx = e.target.checked;
    savePrefs();
    if(prefs.fx && !prefs.perf){ startParticles(); } else { stopParticles(); }
  });
  perfToggle.addEventListener('change', e => {
    prefs.perf = e.target.checked;
    savePrefs();
    if(prefs.perf){ stopParticles(); } else if(prefs.fx){ startParticles(); }
  });

  // pause on hidden
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ if(running) stopParticles(); }
    else if(prefs.fx && !prefs.perf) startParticles();
  });

  // observe theme changes
  const themeObserver = new MutationObserver(() => {
    stopParticles();
    if(prefs.fx && !prefs.perf && !reducedMotion){ setTimeout(startParticles, 100); }
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // initial state
  if(prefs.fx && !prefs.perf && !reducedMotion){ setTimeout(startParticles, 500); }

  const widgetToggle = widget.querySelector('.atmosphere-toggle');
  const widgetOptions = widget.querySelector('.atmosphere-options');
  widgetToggle.addEventListener('click', () => {
    const expanded = widgetToggle.getAttribute('aria-expanded') === 'true';
    widgetToggle.setAttribute('aria-expanded', String(!expanded));
    widgetOptions.hidden = expanded;
  });
})();
