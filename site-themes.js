/* Carga el tema activo desde Supabase y sincroniza:
   - clase body.theme-* (motor de estilos y decoración)
   - data-theme en <html> y bb-theme en localStorage (anti-FOUC)
   - evento bb:theme-changed para el AtmosphereEngine */
(async function () {
  const SUPABASE_URL = 'https://inwugycvtaaceugvtfpv.supabase.co';
  const KEY = 'sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
  const THEMES = [
    'default', 'navidad', 'halloween', 'ano_nuevo', 'black_friday',
    'cyber_days', 'san_valentin', 'dia_madre_padre', 'fiestas_patrias', 'vuelta_clases'
  ];
  let sb = window.BBStore && window.BBStore.client;
  if (!sb && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, KEY);
  }

  function normalize(clave) {
    const key = String(clave || 'default').toLowerCase().trim().replace(/-/g, '_').replace(/\s+/g, '_');
    if (THEMES.indexOf(key) > -1) return key;
    if (key.indexOf('navidad') > -1) return 'navidad';
    if (key.indexOf('halloween') > -1) return 'halloween';
    if (key.indexOf('nuevo') > -1 || key.indexOf('ano_new') > -1) return 'ano_nuevo';
    if (key.indexOf('black') > -1) return 'black_friday';
    if (key.indexOf('cyber') > -1) return 'cyber_days';
    if (key.indexOf('valentin') > -1) return 'san_valentin';
    if (key.indexOf('madre') > -1 || key.indexOf('padre') > -1) return 'dia_madre_padre';
    if (key.indexOf('patria') > -1) return 'fiestas_patrias';
    if (key.indexOf('clases') > -1 || key.indexOf('escuela') > -1) return 'vuelta_clases';
    return 'default';
  }

  async function loadTheme() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('site_themes').select('*').eq('activo', true).limit(1);
      if (error || !data || !data.length) return;
      const t = data[0];
      const key = normalize(t.clave);

      THEMES.forEach(k => document.body.classList.remove('theme-' + k));
      document.body.classList.add('theme-' + key);

      // Un tema festivo desplaza al modo oscuro para evitar conflictos de color.
      if (key !== 'default') document.documentElement.classList.remove('dark-mode');

      document.documentElement.setAttribute('data-theme', key);
      try { localStorage.setItem('bb-theme', key); } catch (e) {}

      const vars = t.css_vars || {};
      Object.entries(vars).forEach(([k, v]) => {
        if (typeof k === 'string' && k.indexOf('--') === 0 && typeof v === 'string') {
          document.documentElement.style.setProperty(k, v);
        }
      });

      window.dispatchEvent(new CustomEvent('bb:theme-changed', { detail: { clave: key, theme: t } }));
    } catch (e) {
      console.warn('theme load', e);
    }
  }

  if (window.BBStore) loadTheme();
  else window.addEventListener('bb:store-ready', loadTheme, { once: true });
})();
