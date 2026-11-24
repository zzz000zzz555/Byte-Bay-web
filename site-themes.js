/* Carga el tema activo desde Supabase y sincroniza:
   - clase body.theme-* (motor de estilos y decoración)
   - data-theme en <html> y bb-theme en localStorage (anti-FOUC)
   - evento bb:theme-changed para el AtmosphereEngine
   ?theme=clave permite previsualizar cualquier tema sin tocar la BD. */
(async function () {
  const SUPABASE_URL = 'https://inwugycvtaaceugvtfpv.supabase.co';
  const KEY = 'sb_publishable_5cTHcYI6byM03VSffW0OlQ_JlBB8D9u';
  const THEMES = [
    'default', 'navidad', 'halloween', 'ano_nuevo', 'black_friday',
    'cyber_days', 'san_valentin', 'dia_madre_padre', 'fiestas_patrias',
    'vuelta_clases', 'san_patricio', 'dia_de_la_bandera', 'dia_del_trabajo',
    'dia_del_nino', 'primavera', 'verano', 'otonio', 'dia_de_muertos'
  ];
  const LABELS = {
    default: 'Sin tema (clásico)', navidad: 'Navidad', halloween: 'Halloween',
    ano_nuevo: 'Año Nuevo', black_friday: 'Black Friday', cyber_days: 'Cyber Days',
    san_valentin: 'San Valentín', dia_madre_padre: 'Día de la Madre y el Padre',
    fiestas_patrias: 'Fiestas Patrias', vuelta_clases: 'Vuelta a clases',
    san_patricio: 'San Patricio', dia_de_la_bandera: 'Día de la Bandera',
    dia_del_trabajo: 'Día del Trabajo', dia_del_nino: 'Día del Niño',
    primavera: 'Primavera', verano: 'Verano', otonio: 'Otoño',
    dia_de_muertos: 'Día de Muertos'
  };
  const SEASON_KEY = 'bb-season-theme';
  let sb = window.BBStore && window.BBStore.client;
  if (!sb && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, KEY);
  }

  function normalize(clave) {
    const key = String(clave || 'default').toLowerCase().trim()
      .replace(/-/g, '_').replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (THEMES.indexOf(key) > -1) return key;
    if (key.indexOf('navidad') > -1 || key.indexOf('christmas') > -1) return 'navidad';
    if (key.indexOf('halloween') > -1) return 'halloween';
    if (key.indexOf('nuevo') > -1 || key.indexOf('ano_new') > -1) return 'ano_nuevo';
    if (key.indexOf('black') > -1) return 'black_friday';
    if (key.indexOf('cyber') > -1) return 'cyber_days';
    if (key.indexOf('valentin') > -1) return 'san_valentin';
    if (key.indexOf('madre') > -1 || key.indexOf('padre') > -1) return 'dia_madre_padre';
    if (key.indexOf('patria') > -1 || key.indexOf('bandera') > -1) return key.indexOf('bandera') > -1 ? 'dia_de_la_bandera' : 'fiestas_patrias';
    if (key.indexOf('clases') > -1 || key.indexOf('escuela') > -1) return 'vuelta_clases';
    if (key.indexOf('patricio') > -1 || key.indexOf('patrick') > -1) return 'san_patricio';
    if (key.indexOf('trabajo') > -1 || key.indexOf('labor') > -1) return 'dia_del_trabajo';
    if (key.indexOf('nino') > -1 || key.indexOf('infantil') > -1) return 'dia_del_nino';
    if (key.indexOf('primavera') > -1 || key.indexOf('spring') > -1) return 'primavera';
    if (key.indexOf('verano') > -1 || key.indexOf('summer') > -1) return 'verano';
    if (key.indexOf('oton') > -1 || key.indexOf('autumn') > -1) return 'otonio';
    if (key.indexOf('muert') > -1) return 'dia_de_muertos';
    return 'default';
  }

  function previewTheme() {
    try {
      const u = new URL(window.location.href);
      const p = u.searchParams.get('theme') || u.searchParams.get('preview');
      return p ? normalize(p) : null;
    } catch (e) { return null; }
  }

  function applyTheme(key, t, persistir) {
    THEMES.forEach(k => document.body.classList.remove('theme-' + k));
    document.body.classList.add('theme-' + key);
    if (key !== 'default') document.documentElement.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', key);
    // Solo la elección persistente (tema del administrador) se guarda en bb-theme.
    // La vista previa ?theme= debe ser temporal para no colonizar la preferencia del usuario.
    if (persistir !== false) { try { localStorage.setItem('bb-theme', key); } catch (e) {} }

    const vars = (t && t.css_vars) || {};
    const CLAVES_PERMITIDAS = ['--brand', '--bg', '--text', '--accent', '--navy', '--lime', '--accent-soft'];
    Object.entries(vars).forEach(([k, v]) => {
      const valor = typeof v === 'string' ? v.trim() : '';
      const esColor = /^#[0-9a-f]{3,8}$/i.test(valor);
      if (CLAVES_PERMITIDAS.indexOf(k) > -1 && esColor) {
        document.documentElement.style.setProperty(k, valor);
      }
    });
    window.dispatchEvent(new CustomEvent('bb:theme-changed', { detail: { clave: key, theme: t || {} } }));
  }

  function localSeason() {
    try {
      var k = localStorage.getItem(SEASON_KEY);
      return k && k !== 'auto' && THEMES.indexOf(k) > -1 ? k : null;
    } catch (e) { return null; }
  }

  /* API pública para el panel del cliente (Configuración → Apariencia) */
  window.BBThemes = {
    themes: THEMES,
    labels: LABELS,
    select: function (key) {
      var k = normalize(key);
      if (THEMES.indexOf(k) < 0) k = 'default';
      try { localStorage.setItem(SEASON_KEY, k); } catch (e) {}
      applyTheme(k, null, false);
      return k;
    },
    reset: function () {
      try { localStorage.removeItem(SEASON_KEY); } catch (e) {}
    },
    current: function () {
      var m = /(?:^|\s)theme-([a-z_]+)/.exec(document.body.className || '');
      return m ? m[1] : 'default';
    }
  };

  async function loadTheme() {
    const paramOverride = previewTheme();
    const local = localSeason();
    const override = paramOverride || local;
    if (!sb) {
      if (override) applyTheme(override, null, !paramOverride);
      return;
    }
    try {
      const { data, error } = await sb.from('site_themes').select('*').eq('activo', true).limit(1);
      const t = data && data.length ? data[0] : null;
      if (error && !override) return;
      if (override) applyTheme(override, paramOverride ? t : null, !paramOverride);
      else applyTheme(t ? normalize(t.clave) : 'default', t);
    } catch (e) {
      console.warn('theme load', e);
      if (override) applyTheme(override, null, !paramOverride);
    }
  }

  if (window.BBStore) loadTheme();
  else window.addEventListener('bb:store-ready', loadTheme, { once: true });
})();
