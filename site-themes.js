
(async function(){
  const SUPABASE_URL='https://inwugycvtaaceugvtfpv.supabase.co';
  const KEY='sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
  let sb=window.BBStore?.client;
  if(!sb && window.supabase?.createClient){ sb=window.supabase.createClient(SUPABASE_URL,KEY); }
  async function loadTheme(){
    if(!sb) return;
    try{
      const {data,error}=await sb.from('site_themes').select('*').eq('activo',true).limit(1);
      if(error||!data?.length) return;
      const t=data[0];
      document.body.classList.remove('theme-default','theme-black_friday','theme-navidad','theme-halloween','theme-ano_nuevo','theme-cyber_days');
      document.body.classList.add('theme-'+t.clave);
      // disable dark mode conflict for festive themes
      if(t.clave !== 'default'){ document.documentElement.classList.remove('dark-mode'); }
      // apply css vars
      const vars=t.css_vars||{};
      Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
      // audio
      if(t.audio_url){
        let player=document.querySelector('#themeAudioPlayer');
        if(!player){
          player=document.createElement('div');
          player.id='themeAudioPlayer';
          player.style.cssText='position:fixed;bottom:16px;left:16px;z-index:90;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:8px;';
          player.innerHTML='<button id="themeAudioToggle" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;">▶</button><input id="themeAudioVol" type="range" min="0" max="1" step="0.1" value="0.3" style="width:80px;">';
          document.body.appendChild(player);
          const audio=new Audio(t.audio_url);
          audio.loop=true; audio.volume=0.3;
          const toggle=document.querySelector('#themeAudioToggle');
          toggle.onclick=()=>{ if(audio.paused){audio.play();toggle.textContent='⏸';}else{audio.pause();toggle.textContent='▶';} };
          document.querySelector('#themeAudioVol').oninput=e=>{audio.volume=parseFloat(e.target.value);};
          // persist mute state
          const muted=localStorage.getItem('themeAudioMuted')==='true';
          if(muted){audio.muted=true;toggle.textContent='▶';}
        }
      }
    }catch(e){console.warn('theme load',e);}
  }
  // wait for store ready
  if(window.BBStore){ loadTheme(); }
  else { window.addEventListener('bb:store-ready', loadTheme, {once:true}); }
})();
