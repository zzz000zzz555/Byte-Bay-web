
(function(){
  const PREFS_KEY = 'bytebay_user_fx_prefs';
  const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{"fx":true,"music":false,"perf":false}');
  function savePrefs(){ localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }

  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.id = 'atmosphereCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;opacity:1;transition:opacity .3s ease;';
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
  const maxParticles = reducedMotion ? 10 : (isMobile ? 20 : 60);

  // Particle factory
  function createParticle(type){
    const w = window.innerWidth, h = window.innerHeight;
    if(type==='snow'){
      return { x: Math.random()*w, y: Math.random()*-h, r: 1+Math.random()*3, vy: 0.5+Math.random()*1.5, vx: -0.5+Math.random()*1, opacity: 0.4+Math.random()*0.6, type };
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
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
    if(running) return;
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

  // Audio (Web Audio API simple ambient drone)
  let audioCtx = null;
  let audioPlaying = false;
  let audioGain = null;
  function ensureAudio(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    audioGain = audioCtx.createGain();
    audioGain.gain.value = 0.15;
    audioGain.connect(audioCtx.destination);
  }
  function playAudio(){
    if(audioPlaying) return;
    ensureAudio();
    if(audioCtx.state==='suspended') audioCtx.resume();
    // simple ambient tone
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220;
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(audioGain);
    osc.start();
    lfo.start();
    audioPlaying = true;
    // store for stop
    window.__atmosphereAudio = {osc, lfo};
  }
  function stopAudio(){
    if(!audioPlaying) return;
    if(window.__atmosphereAudio){
      try{ window.__atmosphereAudio.osc.stop(); window.__atmosphereAudio.lfo.stop(); }catch(e){}
    }
    audioPlaying = false;
  }
  function setVolume(v){
    if(audioGain) audioGain.gain.value = v;
  }

  // Widget UI
  const widget = document.createElement('div');
  widget.id = 'atmosphereWidget';
  widget.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:90;background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.3);';
  widget.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:#fff;font-size:12px;font-weight:600;">
      <span style="font-size:16px;">❄️</span> Personalizar ambiente
    </div>
    <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;font-size:12px;cursor:pointer;">
      <input type="checkbox" id="fxToggle" ${prefs.fx?'checked':''}> Efectos visuales
    </label>
    <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;font-size:12px;cursor:pointer;">
      <input type="checkbox" id="musicToggle" ${prefs.music?'checked':''}> Música ambiental
    </label>
    <div id="volRow" style="display:${prefs.music?'flex':'none'};align-items:center;gap:8px;">
      <input type="range" id="volSlider" min="0" max="1" step="0.1" value="0.15" style="width:100%;">
    </div>
    <label style="display:flex;align-items:center;gap:8px;color:#cbd5e1;font-size:12px;cursor:pointer;">
      <input type="checkbox" id="perfToggle" ${prefs.perf?'checked':''}> Modo rendimiento (sin lag)
    </label>
  `;
  document.body.appendChild(widget);

  // Event handlers
  const fxToggle = document.querySelector('#fxToggle');
  const musicToggle = document.querySelector('#musicToggle');
  const volSlider = document.querySelector('#volSlider');
  const perfToggle = document.querySelector('#perfToggle');

  fxToggle.addEventListener('change', e => {
    prefs.fx = e.target.checked;
    savePrefs();
    if(prefs.fx && !prefs.perf){ startParticles(); } else { stopParticles(); }
  });
  musicToggle.addEventListener('change', e => {
    prefs.music = e.target.checked;
    savePrefs();
    document.querySelector('#volRow').style.display = prefs.music ? 'flex' : 'none';
    if(prefs.music){ playAudio(); } else { stopAudio(); }
  });
  volSlider.addEventListener('input', e => { setVolume(parseFloat(e.target.value)); });
  perfToggle.addEventListener('change', e => {
    prefs.perf = e.target.checked;
    savePrefs();
    if(prefs.perf){ stopParticles(); } else if(prefs.fx){ startParticles(); }
  });

  // pause on hidden
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ if(running) stopParticles(); if(audioPlaying) stopAudio(); }
    else { if(prefs.fx && !prefs.perf) startParticles(); if(prefs.music) playAudio(); }
  });

  // initial state
  if(prefs.fx && !prefs.perf && !reducedMotion){ startParticles(); }
  if(prefs.music){ playAudio(); }

  // toggle widget collapse
  const header = widget.querySelector('div');
  let collapsed = false;
  header.style.cursor = 'pointer';
  header.addEventListener('click', () => {
    collapsed = !collapsed;
    widget.querySelectorAll('label, #volRow').forEach(el => el.style.display = collapsed ? 'none' : '');
  });
})();
