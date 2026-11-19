
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
    }catch(e){console.warn('theme load',e);}
  }
  // wait for store ready
  if(window.BBStore){ loadTheme(); }
  else { window.addEventListener('bb:store-ready', loadTheme, {once:true}); }
})();
