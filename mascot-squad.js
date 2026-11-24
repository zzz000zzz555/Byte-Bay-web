/* Byte · ecosistema multi-mascota.
   MascotEntity (física/arrastre/capas SVG) → MascotManager (estado y orquestación)
   → SocialDirector (interacciones) → WardrobeUI (vestidor localStorage).
   Byte se adapta mediante ByteEntityAdapter: su chat, voz, carrito y
   actividades siguen being gestionados por byte-companion.js sin duplicarlos. */
(function () {
  'use strict';

  var KEY_WARDROBE = 'bytebay_wardrobe_v1';
  var KEY_VOICE = 'bytebay_mascot_voice';
  var KEY_POS_PREFIX = 'bytebay_squad_pos_';
  var FIXED_STEP = 1 / 240;
  var MAX_SUBSTEPS = 8;
  var DRAG_THRESHOLD = 5;
  var MEET_DISTANCE = 155;
  var MEET_COOLDOWN = 6500;
  var PETS = ['byte', 'pixel', 'nano'];
  var SQUADS = ['byte', 'byte+pixel', 'full'];

  var SKINS = {
    classic: { label: 'Celeste clásico', c1: '#38FEDC', c2: '#00C7E8', accent: '#00E5FF', mark: '<path d="M30 72q6-3 12 0t12 0t12 0" fill="none" stroke="var(--sq-2)" stroke-width="2" stroke-linecap="round" opacity=".45"/>' },
    space:   { label: 'Blanco espacial', c1: '#F4FAFF', c2: '#9FBDD0', accent: '#DFF6FF', mark: '<circle cx="34" cy="73" r="2" fill="var(--sq-2)" opacity=".5"/><circle cx="62" cy="73" r="2" fill="var(--sq-2)" opacity=".5"/>' },
    carbon:  { label: 'Negro carbón', c1: '#3A3F4B', c2: '#151821', accent: '#8E9BAA', mark: '<path d="M30 88h10 M56 88h10" stroke="var(--sq-2)" stroke-width="2" stroke-linecap="round" opacity=".6"/>' },
    cyber:   { label: 'Rosa cyber', c1: '#FF6FCF', c2: '#B833FF', accent: '#FF9FE5', mark: '<path d="M34 68l1.4 3.6 3.6 1.4-3.6 1.4L34 78l-1.4-3.6-3.6-1.4 3.6-1.4z M62 68l1.4 3.6 3.6 1.4-3.6 1.4L62 78l-1.4-3.6-3.6-1.4 3.6-1.4z" fill="var(--sq-2)" opacity=".6"/>' },
    mint:    { label: 'Verde menta', c1: '#8BFFC8', c2: '#2FD39B', accent: '#B9FFE1', mark: '<circle cx="34" cy="72" r="2" fill="var(--sq-2)" opacity=".5"/><circle cx="48" cy="72" r="2" fill="var(--sq-2)" opacity=".5"/><circle cx="62" cy="72" r="2" fill="var(--sq-2)" opacity=".5"/>' },
    vip:     { label: 'Dorado VIP', c1: '#FFE082', c2: '#F5A623', accent: '#FFD54F', mark: '<path d="M30 72h10 M56 72h10 M30 88h10 M56 88h10" stroke="var(--sq-2)" stroke-width="2" stroke-linecap="round" opacity=".55"/>' }
  };

  var HATS = {
    none: '',
    crown: '<g data-part="hat-crown"><path d="M30 10 L33 3 L40 8 L48 2 L56 8 L63 3 L66 10 Z" fill="#FFD54F" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><rect x="29" y="9" width="38" height="7" rx="3" fill="#FFB300" stroke="#061316" stroke-width="2.5"/><circle cx="48" cy="12.5" r="2" fill="#FFF3C4"/></g>',
    cap: '<g data-part="hat-cap"><path d="M25 18 Q27 7 48 7 Q69 7 71 18 Z" fill="var(--sq-accent)" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><path d="M68 17 Q82 17 84 21 Q70 25 60 20 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="2.5"/><circle cx="48" cy="8" r="2" fill="#061316"/></g>',
    cat: '<g data-part="hat-cat"><path d="M25 40 A24 27 0 0 1 71 40" fill="none" stroke="#12202A" stroke-width="5" stroke-linecap="round"/><rect x="19" y="34" width="10" height="18" rx="5" fill="var(--sq-accent)" stroke="#061316" stroke-width="2.5"/><rect x="67" y="34" width="10" height="18" rx="5" fill="var(--sq-accent)" stroke="#061316" stroke-width="2.5"/><path d="M22 34l3-10 4 9 M71 33l4-9 3 10" fill="var(--sq-accent)" stroke="#061316" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="43" r="2" fill="#FF4FB8"/><circle cx="72" cy="43" r="2" fill="#FF4FB8"/></g>',
    wifi: '<g data-part="hat-wifi"><path d="M48 13V3" stroke="var(--sq-accent)" stroke-width="3" stroke-linecap="round"/><circle cx="48" cy="3" r="3" fill="var(--sq-accent)"/><path d="M40 10a12 12 0 0 1 16 0 M36 6a18 18 0 0 1 24 0" fill="none" stroke="var(--sq-accent)" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>',
    party: '<g data-part="hat-party"><path d="M38 16 L48 0 L58 16 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><ellipse cx="48" cy="17" rx="22" ry="5" fill="var(--sq-accent)" stroke="#061316" stroke-width="2.5"/><circle cx="48" cy="1" r="3" fill="#FFD54F"/></g>',
    helmet: '<g data-part="hat-helmet"><circle cx="48" cy="46" r="35" fill="#BFF4FF" fill-opacity=".16" stroke="#BFF4FF" stroke-width="2.5" opacity=".9"/><path d="M22 32a35 35 0 0 1 52 0" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/><rect x="42" y="9" width="12" height="5" rx="2" fill="#12202A" stroke="#061316" stroke-width="2"/></g>'
  };

  var OUTFITS = {
    none: '',
    tie: '<g data-part="outfit-tie"><path d="M44 68 L52 68 L55 74 L48 80 L41 74 Z" fill="var(--sq-accent)" stroke="#061316" stroke-width="2.2" stroke-linejoin="round"/><path d="M48 80 L52 92 L48 96 L44 92 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="2.2" stroke-linejoin="round"/><path d="M42 67q6 5 12 0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>',
    cape: '<path data-part="outfit-cape" d="M20 30 Q48 22 76 30 L84 88 Q66 96 48 94 Q30 96 12 88 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="3.5" stroke-linejoin="round" opacity=".9"/>',
    scarf: '<g data-part="outfit-scarf"><path d="M26 66 Q48 74 70 66 L70 73 Q48 82 26 73 Z" fill="var(--sq-accent)" stroke="#061316" stroke-width="2.8" stroke-linejoin="round"/><path d="M60 73 L68 90 L60 91 L54 76 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="2.8" stroke-linejoin="round"/><path d="M30 69q18 6 36 0" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".5"/></g>',
    vest: '<g data-part="outfit-vest"><path d="M28 66 Q48 60 68 66 L72 92 Q48 98 24 92 Z" fill="var(--sq-2)" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><path d="M42 65 L48 76 L54 65" fill="none" stroke="#DFFFFB" stroke-width="2.4"/><rect x="52" y="78" width="14" height="12" rx="2" fill="#DFFFFB" stroke="#061316" stroke-width="1.8"/><path d="M55 83h8 M55 86h5" stroke="#0A4A6B" stroke-width="1.4" stroke-linecap="round"/></g>',
    chain: '<g data-part="outfit-chain"><path d="M32 68 Q48 88 64 68" fill="none" stroke="#FFD54F" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="80" r="6" fill="#FFD54F" stroke="#B8860B" stroke-width="2"/><path d="M45 80h6" stroke="#B8860B" stroke-width="1.6" stroke-linecap="round"/></g>'
  };

  var VISORS = {
    normal: '',
    sunglasses: '<g data-part="visor-sunglasses"><rect x="27" y="42" width="20" height="13" rx="5" fill="#0B1B2B" stroke="#061316" stroke-width="2" opacity=".92"/><rect x="49" y="42" width="20" height="13" rx="5" fill="#0B1B2B" stroke="#061316" stroke-width="2" opacity=".92"/><path d="M47 47h2" stroke="#061316" stroke-width="2.5" stroke-linecap="round"/><path d="M30 45l5-1 M52 45l5-1" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></g>',
    monocle: '<g data-part="visor-monocle"><circle cx="57" cy="50" r="9" fill="#CFF6FF" fill-opacity=".2" stroke="#FFD54F" stroke-width="2.6"/><path d="M66 55 Q72 68 62 75" fill="none" stroke="#FFD54F" stroke-width="2" stroke-linecap="round"/><path d="M50 45l4-2" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g>',
    laser: '<g data-part="visor-laser"><rect x="26" y="40" width="44" height="14" rx="6" fill="none" stroke="#FF3D6E" stroke-width="2.4" opacity=".95"/><path d="M26 47h44" stroke="#FF3D6E" stroke-width="1.6" opacity=".9"/><path d="M26 43v-3h5 M70 51v3h-5" fill="none" stroke="#DFFFFB" stroke-width="1.6"/></g>'
  };

  var AURAS = {
    none: '',
    stars: '<g data-part="aura-stars" class="bb-sq-aura-item" fill="var(--sq-accent)" opacity=".85"><path d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4Z" transform="translate(14 26)"/><path d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4Z" transform="translate(82 24) scale(.8)"/><path d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4Z" transform="translate(10 78) scale(.7)"/><path d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4Z" transform="translate(86 82) scale(.9)"/></g>',
    hearts: '<g data-part="aura-hearts" class="bb-sq-aura-item" fill="var(--sq-accent)" opacity=".75"><path d="M16 40c-4-3-5-5-4-7 1-2 4-1 4 1 0-2 3-3 4-1 1 2 0 4-4 7z"/><path d="M80 38c-4-3-5-5-4-7 1-2 4-1 4 1 0-2 3-3 4-1 1 2 0 4-4 7z"/><path d="M20 88c-4-3-5-5-4-7 1-2 4-1 4 1 0-2 3-3 4-1 1 2 0 4-4 7z"/></g>',
    drone: '<g data-part="aura-drone" class="bb-sq-aura-item bb-sq-aura-drone"><rect x="70" y="16" width="20" height="9" rx="4" fill="#12202A" stroke="#061316" stroke-width="2.2"/><circle cx="75" cy="20" r="2" fill="var(--sq-accent)"/><circle cx="85" cy="20" r="2" fill="var(--sq-accent)"/><path d="M68 16l-4-3 M92 16l4-3" stroke="#061316" stroke-width="2" stroke-linecap="round"/><path d="M72 25v4 M88 25v4" stroke="var(--sq-accent)" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>',
    binary: '<g data-part="aura-binary" class="bb-sq-aura-item" fill="var(--sq-accent)" opacity=".8" font-family="monospace" font-size="9" font-weight="700"><text x="8" y="32">0</text><text x="80" y="30">1</text><text x="12" y="84">1</text><text x="82" y="88">0</text><text x="42" y="12">1</text></g>'
  };

  var CATALOG = { skin: SKINS, hat: HATS, outfit: OUTFITS, visor: VISORS, aura: AURAS };
  var LABELS = {
    hat: { none: 'Sin sombrero', crown: 'Corona real', cap: 'Gorra tech', cat: 'Orejas de gato', wifi: 'Antena WiFi', party: 'Sombrero de fiesta', helmet: 'Casco espacial' },
    outfit: { none: 'Sin ropa', tie: 'Corbata', cape: 'Capa', scarf: 'Bufanda', vest: 'Chaleco técnico', chain: 'Cadena dorada' },
    visor: { normal: 'Visor clásico', sunglasses: 'Gafas de sol', monocle: 'Monóculo', laser: 'Visor láser' },
    aura: { none: 'Sin aura', stars: 'Estrellas', hearts: 'Corazones', drone: 'Dron compañero', binary: 'Código binario' }
  };
  var DEFAULTS = {
    v: 1,
    squad: 'byte',
    byId: {
      byte:  { skin: 'classic', hat: 'none',   outfit: 'none',    visor: 'normal', aura: 'none' },
      pixel: { skin: 'cyber',   hat: 'cat',    outfit: 'scarf',   visor: 'laser',  aura: 'stars' },
      nano:  { skin: 'vip',     hat: 'wifi',   outfit: 'vest',    visor: 'sunglasses', aura: 'binary' }
    },
    updatedAt: 0
  };

  var SVG_TEMPLATE = '<div class="bb-squad__motion"><span class="bb-squad__figure"><svg class="bb-squad__svg" viewBox="0 0 96 108" focusable="false" aria-hidden="true">' +
    '<defs>' +
      '<linearGradient id="{uid}-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--sq-1)"/><stop offset=".45" stop-color="var(--sq-1)"/><stop offset="1" stop-color="var(--sq-2)"/></linearGradient>' +
      '<linearGradient id="{uid}-visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2FFFF"/><stop offset=".45" stop-color="#A9EEFF"/><stop offset="1" stop-color="#4FB8E8"/></linearGradient>' +
      '<radialGradient id="{uid}-core" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="var(--sq-1)"/><stop offset="1" stop-color="var(--sq-2)"/></radialGradient>' +
      '<clipPath id="{uid}-visorClip"><rect x="23" y="35" width="51" height="31" rx="15"/></clipPath>' +
    '</defs>' +
    '<ellipse class="bb-squad__shadow" cx="49" cy="102" rx="25" ry="4" fill="#140A22" opacity=".2"/>' +
    '<g id="layer-aura" class="bb-squad__layer" data-slot="aura"></g>' +
    '<g id="layer-back" class="bb-squad__layer" data-slot="back"><g data-slot="back-extra"></g>' +
      '<g data-part="pack-base"><rect x="5" y="41" width="19" height="35" rx="8" fill="var(--sq-2)" stroke="#120A1C" stroke-width="3.5"/><rect x="9" y="49" width="11" height="9" rx="3" fill="var(--sq-1)" opacity=".75"/><path d="M10 68h10" stroke="#0B1620" stroke-width="3" stroke-linecap="round"/></g></g>' +
    '<g id="layer-body" class="bb-squad__layer" data-slot="body">' +
      '<path class="bb-squad__antenna" d="M48 13V5" fill="none" stroke="#120A1C" stroke-width="3.5" stroke-linecap="round"/>' +
      '<circle class="bb-squad__antenna-dot" cx="48" cy="4" r="3.2" fill="url(#{uid}-core)" stroke="#120A1C" stroke-width="2"/>' +
      '<path class="bb-squad__body" d="M48 11 C29 11 17 25 15 44 C13 63 15 82 25 91 C32 98 43 101 51 101 C62 101 74 97 80 88 C87 77 86 59 82 43 C78 25 67 11 48 11 Z" fill="url(#{uid}-body)" stroke="#120A1C" stroke-width="4.2" stroke-linejoin="round"/>' +
      '<path d="M27 29 Q41 15 60 18" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity=".45"/>' +
      '<circle class="bb-squad__core" cx="49" cy="80" r="5.5" fill="url(#{uid}-core)" stroke="#0B1620" stroke-width="1.6"/>' +
      '<path d="M42 80a7 7 0 0 0 14 0" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>' +
      '<g class="bb-squad__skin-mark" data-slot="skin-mark"></g>' +
      '<g fill="var(--sq-2)" stroke="#120A1C" stroke-width="3.2" stroke-linejoin="round"><path d="M31 88 L27 100 Q26 104 31 104 L38 104 Q41 104 40 100 L40 89 Z"/><path d="M60 89 L60 100 Q59 104 63 104 L70 104 Q74 104 72 100 L68 88 Z"/></g>' +
    '</g>' +
    '<g id="layer-outfit" class="bb-squad__layer" data-slot="outfit"></g>' +
    '<g id="layer-visor" class="bb-squad__layer" data-slot="visor">' +
      '<rect class="bb-squad__visor" x="23" y="35" width="51" height="31" rx="15" fill="url(#{uid}-visor)" stroke="#120A1C" stroke-width="3.4"/>' +
      '<g class="bb-squad__eyes" clip-path="url(#{uid}-visorClip)">' +
        '<ellipse class="bb-squad__eye" cx="42" cy="51" rx="3.1" ry="4.4" fill="#2A1240" opacity=".78"/>' +
        '<ellipse class="bb-squad__eye bb-squad__eye--right" cx="57" cy="51" rx="3.1" ry="4.4" fill="#2A1240" opacity=".78"/>' +
        '<ellipse class="bb-squad__glint" cx="37" cy="42" rx="18" ry="7" fill="#FFFFFF" opacity=".66"/>' +
        '<ellipse cx="66" cy="59" rx="7" ry="3" fill="#FFFFFF" opacity=".32"/>' +
        '<ellipse class="bb-squad__cheek bb-squad__cheek--left" cx="33" cy="59" rx="4.5" ry="2.4"/>' +
        '<ellipse class="bb-squad__cheek bb-squad__cheek--right" cx="64" cy="59" rx="4.5" ry="2.4"/>' +
        '<path class="bb-squad__mouth" d="M45 59q4 4 8 0"/>' +
        '<rect class="bb-squad__scan" x="23" y="35" width="51" height="31" rx="15"/>' +
      '</g>' +
      '<g data-slot="visor-fx"></g>' +
    '</g>' +
    '<g id="layer-hat" class="bb-squad__layer" data-slot="hat"></g>' +
    '<g id="layer-hands" class="bb-squad__layer" data-slot="hands">' +
      '<g class="bb-squad__hand bb-squad__hand--left"><path d="M14 66c-5 0-9 4-9 9s4 9 9 9c3 0 6-1 7-4l2-4c1-2 0-5-2-6-2-1-4-4-7-4z" fill="var(--sq-1)" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><circle cx="9" cy="73" r="2.4" fill="#FFFFFF" opacity=".55"/></g>' +
      '<g class="bb-squad__hand bb-squad__hand--right"><path d="M82 66c5 0 9 4 9 9s-4 9-9 9c-3 0-6-1-7-4l-2-4c-1-2 0-5 2-6 2-1 4-4 7-4z" fill="var(--sq-1)" stroke="#061316" stroke-width="3" stroke-linejoin="round"/><circle cx="87" cy="73" r="2.4" fill="#FFFFFF" opacity=".55"/></g>' +
      '<g data-slot="prop"><g class="bb-squad__ball" data-part="prop-ball"><circle cx="88" cy="76" r="6" fill="var(--sq-1)" stroke="#061316" stroke-width="2.5"/><path d="M85 73q3-2 6 0" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity=".8"/></g>' +
        '<g class="bb-squad__glass" data-part="prop-glass"><circle cx="74" cy="50" r="8" fill="#CFF6FF" fill-opacity=".24" stroke="var(--sq-accent)" stroke-width="2.4"/><path d="M80 56l8 8" stroke="var(--sq-accent)" stroke-width="3" stroke-linecap="round"/></g></g>' +
    '</g>' +
    '<g id="layer-jet" class="bb-squad__layer" data-slot="jet">' +
      '<g class="bb-squad__jet-pack"><rect x="6" y="70" width="14" height="15" rx="5" fill="#12202A" stroke="#061316" stroke-width="3"/><rect x="76" y="70" width="14" height="15" rx="5" fill="#12202A" stroke="#061316" stroke-width="3"/><rect x="9" y="74" width="8" height="4" rx="2" fill="var(--sq-accent)" opacity=".8"/><rect x="79" y="74" width="8" height="4" rx="2" fill="var(--sq-accent)" opacity=".8"/></g>' +
      '<g class="bb-squad__flame"><path class="bb-squad__flame-core" d="M9 84 Q7 95 15 107 Q23 95 21 84 Z" fill="var(--sq-accent)" opacity=".9"/><path class="bb-squad__flame-core" d="M12 84 Q11 92 15 99 Q19 92 18 84 Z" fill="#FFFFFF" opacity=".85"/></g>' +
      '<g class="bb-squad__flame"><path class="bb-squad__flame-core" d="M75 84 Q73 95 81 107 Q89 95 87 84 Z" fill="var(--sq-accent)" opacity=".9"/><path class="bb-squad__flame-core" d="M78 84 Q77 92 81 99 Q85 92 84 84 Z" fill="#FFFFFF" opacity=".85"/></g>' +
    '</g></svg></span></div>';

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function now() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }
  function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
  function readFlag(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === 'true' || raw === '1' || raw === 'false' || raw === '0' ? raw === 'true' || raw === '1' : fallback;
    } catch (error) { return fallback; }
  }
  function readJSON(key) {
    try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (error) { return null; }
  }
  function saveJSON(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* Sin almacenamiento. */ }
  }
  function clearNode(node) { if (node) while (node.firstChild) node.removeChild(node.firstChild); }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ---------- Persistencia del vestidor ---------- */
  function loadWardrobe() {
    var raw = readJSON(KEY_WARDROBE);
    var out = deepCopy(DEFAULTS);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.v !== 1) return out;
    if (SQUADS.indexOf(raw.squad) >= 0) out.squad = raw.squad;
    if (raw.byId && typeof raw.byId === 'object' && !Array.isArray(raw.byId)) {
      PETS.forEach(function (pet) {
        var src = raw.byId[pet];
        if (!src || typeof src !== 'object' || Array.isArray(src)) return;
        Object.keys(CATALOG).forEach(function (cat) {
          if (typeof src[cat] === 'string' && CATALOG[cat][src[cat]] !== undefined) out.byId[pet][cat] = src[cat];
        });
      });
    }
    if (Number.isFinite(raw.updatedAt) && raw.updatedAt >= 0) out.updatedAt = raw.updatedAt;
    return out;
  }

  function saveWardrobe(state) {
    var clean = loadWardrobe();
    if (SQUADS.indexOf(state.squad) >= 0) clean.squad = state.squad;
    PETS.forEach(function (pet) {
      Object.keys(CATALOG).forEach(function (cat) {
        var value = state.byId && state.byId[pet] && state.byId[pet][cat];
        if (typeof value === 'string' && CATALOG[cat][value] !== undefined) clean.byId[pet][cat] = value;
      });
    });
    clean.updatedAt = Date.now();
    saveJSON(KEY_WARDROBE, clean);
    return clean;
  }

  /* ---------- SVG con namespaces únicos ---------- */
  var mountSeq = 0;
  function mountSvg(scope) {
    var uid = (scope === 'live' ? 'bb-live-' : 'bb-prev-') + (++mountSeq).toString(36);
    var holder = document.createElement('div');
    holder.innerHTML = SVG_TEMPLATE.replace(/\{uid\}/g, uid);
    var root = holder.firstChild;
    return {
      uid: uid,
      root: root,
      slot: function (name) { return root.querySelector('[data-slot="' + name + '"]'); }
    };
  }

  function renameIds(root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll('[id]'));
    var map = {};
    nodes.forEach(function (node) { map[node.id] = 'preview-' + node.id; });
    nodes.forEach(function (node) { node.id = map[node.id]; });
    var swap = function (value) {
      return String(value).replace(/url\(\s*['"]?#([^'")]+)['"]?\s*\)/g, function (_, id) {
        return 'url(#' + (map[id] || id) + ')';
      });
    };
    var attrs = ['fill', 'stroke', 'clip-path', 'mask', 'filter', 'href', 'style'];
    Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function (node) {
      attrs.forEach(function (attr) {
        var value = node.getAttribute(attr);
        if (!value || value.indexOf('#') < 0) return;
        var next = swap(value);
        if (next !== value) node.setAttribute(attr, next);
      });
    });
  }

  function injectLook(svg, look, host) {
    var skin = SKINS[look.skin] || SKINS.classic;
    if (host) {
      host.style.setProperty('--sq-1', skin.c1);
      host.style.setProperty('--sq-2', skin.c2);
      host.style.setProperty('--sq-accent', skin.accent);
      host.dataset.skin = look.skin;
      host.dataset.visor = look.visor;
      host.dataset.hat = look.hat;
      host.dataset.aura = look.aura;
      host.dataset.antenna = (look.hat === 'crown' || look.hat === 'party') ? 'hide' : 'show';
    } else {
      Array.prototype.slice.call(svg.querySelectorAll('[id$="-body"] stop')).forEach(function (stop, index) {
        stop.setAttribute('stop-color', index === 2 ? skin.c2 : skin.c1);
      });
      Array.prototype.slice.call(svg.querySelectorAll('[id$="-core"] stop')).forEach(function (stop, index) {
        stop.setAttribute('stop-color', index === 0 ? '#FFFFFF' : (index === 1 ? skin.c1 : skin.c2));
      });
    }
    var slots = {
      'skin-mark': skin.mark,
      hat: HATS[look.hat] || '',
      outfit: OUTFITS[look.outfit] || '',
      'back-extra': look.outfit === 'cape' ? OUTFITS.cape : '',
      'visor-fx': VISORS[look.visor] || '',
      aura: AURAS[look.aura] || ''
    };
    Object.keys(slots).forEach(function (name) {
      var slot = svg.querySelector('[data-slot="' + name + '"]');
      if (slot) slot.innerHTML = slots[name];
    });
    if (look.visor === 'laser' || look.visor === 'sunglasses') {
      var eyes = svg.querySelector('.bb-squad__eyes');
      if (eyes) eyes.style.opacity = look.visor === 'laser' ? '.7' : '.35';
    } else {
      var eyes2 = svg.querySelector('.bb-squad__eyes');
      if (eyes2) eyes2.style.opacity = '';
    }
  }

  /* ---------- MascotEntity ---------- */
  class MascotEntity {
    constructor(manager, id, host, look) {
      this.manager = manager;
      this.id = id;
      this.host = host;
      this.label = id === 'pixel' ? 'Pixel' : 'Nano';
      this.keyPos = KEY_POS_PREFIX + id;
      this.mounted = mountSvg('live-' + id);
      if (host && !host.querySelector('.bb-squad__motion')) host.appendChild(this.mounted.root);
      this.motion = host ? host.querySelector('.bb-squad__motion') : null;
      this.bubble = host ? host.querySelector('.bb-squad__bubble') : null;
      this.mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.smallScreen = window.matchMedia ? window.matchMedia('(max-width: 479px)') : null;
      this.active = false;
      this.timers = {};
      this.audio = null;
      this.rafId = 0;
      this.visible = false;
      this.size = { w: 78, h: 84 };
      this.center = { x: 0, y: 0 };
      this.state = { dragging: false, lastTap: 0, lastJet: 0 };
      this.physics = {
        current: { x: 0, y: 0 }, target: { x: 0, y: 0 }, velocity: { x: 0, y: 0 },
        tilt: 0, tiltTarget: 0, tiltVelocity: 0,
        look: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 },
        lastTime: now(), accumulator: 0
      };
      this.drag = { active: false, moved: false, pointerId: null, startX: 0, startY: 0, lastX: 0, lastY: 0, lastT: 0, baseX: 0, baseY: 0 };
      this.applyLook(look);
      this.initPosition();
      this.bindEvents();
    }

    initPosition() {
      this.measure();
      var saved = readJSON(this.keyPos);
      var point = saved && isFinite(saved.x) && isFinite(saved.y)
        ? this.clampPoint(saved.x, saved.y)
        : this.computeDefaultPosition();
      this.physics.current.x = point.x;
      this.physics.current.y = point.y;
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      this.refreshCenter();
      this.render();
    }

    measure() {
      if (!this.host) return;
      var w = this.host.offsetWidth;
      var h = this.host.offsetHeight;
      if (w > 0 && h > 0) this.size = { w: w, h: h };
    }

    computeDefaultPosition() {
      var compact = window.innerWidth < 768;
      if (this.id === 'pixel') {
        return { x: compact ? 12 : 24, y: compact ? 118 : 126 };
      }
      return { x: Math.max(12, window.innerWidth - this.size.w - (compact ? 12 : 24)), y: compact ? 118 : 126 };
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
      this.host.classList.toggle('is-near-left', this.physics.current.x < 100);
      this.host.classList.toggle('is-near-right', this.physics.current.x + this.size.w > window.innerWidth - 100);
      this.host.classList.toggle('is-top', this.physics.current.y < 110);
    }

    normalizePosition() {
      this.measure();
      var point = this.clampPoint(this.physics.target.x, this.physics.target.y);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      var current = this.clampPoint(this.physics.current.x, this.physics.current.y);
      this.physics.current.x = current.x;
      this.physics.current.y = current.y;
      if (this.motionOff()) { this.physics.current.x = point.x; this.physics.current.y = point.y; }
      this.refreshCenter();
      this.render();
    }

    motionOff() {
      var fx = document.documentElement.getAttribute('data-season-fx');
      return document.body.classList.contains('bb-mascot-inactive') || fx === 'off' || fx === 'reduced' ||
        Boolean(this.mediaQuery && this.mediaQuery.matches);
    }

    setVisible(on) {
      this.active = Boolean(on);
      this.visible = this.active && !(this.smallScreen && this.smallScreen.matches);
      this.host.dataset.active = this.active ? 'true' : 'false';
      if (!this.visible) this.hideBubble();
      else this.measure();
      this.refreshCenter();
    }

    applyLook(look) {
      this.look = deepCopy(look);
      var svg = this.motion ? this.motion.querySelector('svg') : this.mounted.root.querySelector('svg');
      if (svg) injectLook(svg, this.look, this.host);
    }

    bindEvents() {
      var self = this;
      this.host.addEventListener('pointerdown', function (event) { self.onPointerDown(event); });
      document.addEventListener('pointermove', function (event) { self.onPointerMove(event); }, { passive: false });
      document.addEventListener('pointerup', function (event) { self.endDrag(event, false); });
      document.addEventListener('pointercancel', function (event) { self.endDrag(event, true); });
      this.host.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); self.activate(); }
      });
      window.addEventListener('resize', function () { self.normalizePosition(); }, { passive: true });
      if (this.smallScreen) {
        var onScreenChange = function () { self.setVisible(self.active); };
        if (typeof this.smallScreen.addEventListener === 'function') this.smallScreen.addEventListener('change', onScreenChange);
        else if (typeof this.smallScreen.addListener === 'function') this.smallScreen.addListener(onScreenChange);
      }
      this.scheduleBlink();
    }

    onPointerMove(event) {
      if (!this.visible) return;
      this.onDragMove(event);
      if (this.state.dragging) return;
      var nx = (event.clientX - this.center.x) / Math.max(1, window.innerWidth / 2);
      var ny = (event.clientY - this.center.y) / Math.max(1, window.innerHeight / 2);
      this.physics.lookTarget.x = clamp(nx, -1, 1) * 2.2;
      this.physics.lookTarget.y = clamp(ny, -1, 1) * 1.8;
    }

    onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (!this.visible || document.body.classList.contains('bb-mascot-hidden')) return;
      if (event.target && typeof event.target.closest === 'function' && event.target.closest('.bb-squad__bubble')) return;
      this.ensureAudio();
      this.playTone('grab');
      this.drag.active = true;
      this.drag.moved = false;
      this.drag.pointerId = event.pointerId === undefined ? null : event.pointerId;
      this.drag.startX = event.clientX;
      this.drag.startY = event.clientY;
      this.drag.lastX = event.clientX;
      this.drag.lastY = event.clientY;
      this.drag.lastT = now();
      this.drag.baseX = this.physics.current.x;
      this.drag.baseY = this.physics.current.y;
      this.physics.target.x = this.physics.current.x;
      this.physics.target.y = this.physics.current.y;
      this.physics.velocity.x = 0;
      this.physics.velocity.y = 0;
      if (typeof this.host.setPointerCapture === 'function' && this.drag.pointerId !== null) {
        try { this.host.setPointerCapture(this.drag.pointerId); } catch (error) { /* Sin captura. */ }
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
        this.host.classList.add('is-dragging');
        document.body.classList.add('bb-squad-dragging');
        this.hideBubble();
        if (this.manager) this.manager.abortSocial();
      }
      var point = this.clampPoint(this.drag.baseX + dx, this.drag.baseY + dy);
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      this.physics.tiltTarget = clamp((event.clientX - this.drag.lastX) * 1.2, -14, 14);

      var stamp = now();
      var elapsed = Math.max(8, stamp - this.drag.lastT);
      var velocityY = (event.clientY - this.drag.lastY) / elapsed;
      this.drag.lastY = event.clientY;
      this.drag.lastT = stamp;
      if (event.buttons && velocityY < -0.55) {
        var power = clamp((-velocityY - 0.35) / 1.1, 0, 1);
        this.host.classList.add('is-jetpack');
        this.host.style.setProperty('--sq-jet-power', power.toFixed(2));
        this.state.lastJet = stamp;
      } else if (stamp - this.state.lastJet > 120) {
        this.releaseJet();
      }
    }

    releaseJet() {
      this.host.classList.remove('is-jetpack');
      this.host.style.setProperty('--sq-jet-power', '0');
    }

    endDrag(event, cancelled) {
      if (!this.drag.active) return;
      if (this.drag.pointerId !== null && event && event.pointerId !== undefined && event.pointerId !== this.drag.pointerId) return;
      this.drag.active = false;
      this.releaseJet();
      if (typeof this.host.releasePointerCapture === 'function' && this.drag.pointerId !== null) {
        try {
          if (typeof this.host.hasPointerCapture !== 'function' || this.host.hasPointerCapture(this.drag.pointerId)) {
            this.host.releasePointerCapture(this.drag.pointerId);
          }
        } catch (error) { /* Captura ya liberada. */ }
      }
      var moved = this.drag.moved;
      this.drag.moved = false;
      this.drag.pointerId = null;
      this.state.dragging = false;
      this.physics.tiltTarget = 0;
      this.host.classList.remove('is-dragging');
      document.body.classList.remove('bb-squad-dragging');
      if (moved) {
        var point = { x: this.physics.target.x, y: this.physics.target.y };
        if (point.x < 40) point.x = 0;
        else if (window.innerWidth - (point.x + this.size.w) < 40) point.x = Math.max(0, window.innerWidth - this.size.w);
        this.physics.target.x = point.x;
        this.physics.target.y = point.y;
        if (this.motionOff()) { this.physics.current.x = point.x; this.physics.current.y = point.y; }
        saveJSON(this.keyPos, { x: Math.round(point.x), y: Math.round(point.y) });
        this.playClass('is-landing', 500);
        this.playTone('drop');
      } else if (!cancelled) {
        this.activate();
      }
    }

    integrate(frames) {
      var p = this.physics;
      if (this.motionOff()) {
        p.current.x = p.target.x; p.current.y = p.target.y;
        p.velocity.x = 0; p.velocity.y = 0;
        p.tilt = 0; p.tiltTarget = 0; p.tiltVelocity = 0;
        p.look.x = 0; p.look.y = 0;
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
      this.physics.accumulator += Math.min(elapsed, 0.1);
      var steps = 0;
      while (this.physics.accumulator >= FIXED_STEP && steps < MAX_SUBSTEPS) {
        this.integrate(FIXED_STEP * 60);
        this.physics.accumulator -= FIXED_STEP;
        steps += 1;
      }
      if (steps === MAX_SUBSTEPS) this.physics.accumulator = 0;
      if (steps) this.refreshCenter();
      this.render();
    }

    render() {
      if (!this.visible) return;
      var p = this.physics;
      this.host.style.transform = 'translate3d(' + p.current.x.toFixed(2) + 'px,' + p.current.y.toFixed(2) + 'px,0)';
      if (this.motion) {
        this.motion.style.setProperty('--sq-tilt', p.tilt.toFixed(2) + 'deg');
        this.motion.style.setProperty('--sq-scale', this.motionOff() ? '1' : '1');
      }
      this.host.style.setProperty('--sq-look-x', p.look.x.toFixed(2) + 'px');
      this.host.style.setProperty('--sq-look-y', p.look.y.toFixed(2) + 'px');
    }

    playClass(className, ms) {
      if (this.motionOff()) return;
      if (this.timers[className]) window.clearTimeout(this.timers[className]);
      var host = this.host;
      host.classList.remove(className);
      void host.offsetWidth;
      host.classList.add(className);
      this.timers[className] = window.setTimeout(function () { host.classList.remove(className); }, ms || 900);
    }

    scheduleBlink() {
      var self = this;
      var next = function () {
        window.setTimeout(function () {
          self.playClass('is-blinking', 220);
          next();
        }, 2800 + Math.random() * 4200);
      };
      next();
    }

    showBubble(text, ms) {
      if (!this.bubble || !this.visible) return;
      clearNode(this.bubble);
      var span = document.createElement('span');
      span.textContent = String(text || '');
      this.bubble.appendChild(span);
      var self = this;
      this.host.classList.add('has-bubble');
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      this.timers.bubble = window.setTimeout(function () { self.hideBubble(); }, ms || 2200);
    }

    hideBubble() {
      if (this.timers.bubble) window.clearTimeout(this.timers.bubble);
      this.timers.bubble = null;
      this.host.classList.remove('has-bubble');
      clearNode(this.bubble);
    }

    lookAt(x, y) {
      var dx = x - this.center.x;
      var dy = y - this.center.y;
      var magnitude = Math.max(1, Math.hypot(dx, dy));
      this.physics.lookTarget.x = clamp(dx / magnitude * 2.6, -2.6, 2.6);
      this.physics.lookTarget.y = clamp(dy / magnitude * 2.2, -2.2, 2.2);
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

    playTone(kind) {
      var context = this.ensureAudio();
      if (!context) return;
      var tones = { grab: [380, 290, .06], drop: [290, 470, .07], social: [540, 980, .075], ball: [620, 420, .06] };
      var spec = tones[kind] || tones.social;
      try {
        var start = context.currentTime;
        var osc = context.createOscillator();
        var gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(spec[0], start);
        osc.frequency.exponentialRampToValueAtTime(spec[1], start + spec[2]);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(.12, start + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, start + spec[2]);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(start);
        osc.stop(start + spec[2] + .01);
      } catch (error) { /* Audio opcional. */ }
    }

    activate() {
      var stamp = Date.now();
      var doubleTap = stamp - this.state.lastTap < 360;
      this.state.lastTap = stamp;
      var lines = this.id === 'pixel'
        ? ['Soy Pixel, siempre explorando novedades', '¿Viste los productos nuevos?', 'Doble toque: voy a explorar']
        : ['¡Nano al rescate!', 'Las ofertas me recargan', 'Doble toque: energía máxima'];
      this.showBubble(lines[Math.floor(Math.random() * lines.length)], 2500);
      this.playClass(doubleTap ? 'is-dance' : 'is-happy', doubleTap ? 1500 : 950);
      this.playTone('social');
      if (doubleTap && this.manager) this.manager.celebrate();
    }

    resetPosition() {
      saveJSON(this.keyPos, null);
      try { window.localStorage.removeItem(this.keyPos); } catch (error) { /* Sin almacenamiento. */ }
      var point = this.computeDefaultPosition();
      this.physics.target.x = point.x;
      this.physics.target.y = point.y;
      if (this.motionOff()) { this.physics.current.x = point.x; this.physics.current.y = point.y; }
      this.refreshCenter();
      this.render();
    }
  }

  /* ---------- Adaptador de Byte ---------- */
  class ByteEntityAdapter {
    constructor(manager) {
      this.manager = manager;
      this.id = 'byte';
      this.label = 'Byte';
      this.host = document.querySelector('#bbMascot');
      this.delegate = window.ByteBayCompanion;
      this.fallbackCenter = { x: 0, y: 0 };
      this.fallbackSize = { w: 78, h: 84 };
      this.byteSlots = null;
      this.applyLook(manager.wardrobe.byId.byte);
    }

    get center() { return this.delegate && this.delegate.center ? this.delegate.center : this.fallbackCenter; }
    get size() { return this.delegate && typeof this.delegate.metrics === 'function' ? this.delegate.metrics() : this.fallbackSize; }
    get visible() {
      return Boolean(this.host && !document.body.classList.contains('bb-mascot-hidden') &&
        !document.body.classList.contains('bb-wardrobe-open'));
    }
    motionOff() { return !this.delegate || (typeof this.delegate.motionOff === 'function' ? this.delegate.motionOff() : false); }
    setVisible() { /* Byte siempre está activo; bb-mascot-hidden lo gestiona byte-companion.js. */ }
    tick() { /* Byte ya ejecuta su propio bucle a 240 Hz. */ }
    integrate() {}
    render() {}
    normalizePosition() { if (this.delegate && typeof this.delegate.normalizePosition === 'function') this.delegate.normalizePosition(); }
    playClass(name, ms) { if (this.delegate && typeof this.delegate.playClass === 'function') this.delegate.playClass(name, ms); }
    showBubble(text, ms, options) { if (this.delegate && typeof this.delegate.showBubble === 'function') this.delegate.showBubble(text, ms, options); }
    hideBubble() { if (this.delegate && typeof this.delegate.hideBubble === 'function') this.delegate.hideBubble(); }
    playTone(kind) { if (this.delegate && typeof this.delegate.playTone === 'function') this.delegate.playTone(kind); }
    flashHands(ms) { if (this.delegate && typeof this.delegate.flashHands === 'function') this.delegate.flashHands(ms); }
    lookAt(x, y) {
      if (!this.delegate || !this.host) return;
      var dx = x - this.center.x;
      var dy = y - this.center.y;
      var magnitude = Math.max(1, Math.hypot(dx, dy));
      this.host.style.setProperty('--bb-look-x', (dx / magnitude * 2.4).toFixed(2) + 'px');
      this.host.style.setProperty('--bb-look-y', (dy / magnitude * 2).toFixed(2) + 'px');
    }
    resetPosition() { if (this.delegate && typeof this.delegate.resetPosition === 'function') this.delegate.resetPosition(); }

    ensureByteSlots() {
      if (!this.host || this.byteSlots) return this.byteSlots;
      var svg = this.host.querySelector('svg');
      if (!svg) return null;
      var make = function (id, slot) {
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('id', id);
        group.setAttribute('data-slot', slot);
        return group;
      };
      var aura = make('layer-aura', 'aura');
      var backExtra = make('layer-back-extra', 'back-extra');
      var outfit = make('layer-outfit', 'outfit');
      var visorFx = make('layer-visor-fx', 'visor-fx');
      var hat = make('layer-hat', 'hat');
      var mark = make('layer-skin-mark', 'skin-mark');
      Array.prototype.slice.call(svg.querySelectorAll('[data-slot]')).forEach(function (node) { node.remove(); });
      var insertBefore = function (node, reference) {
        if (reference && reference.parentNode) reference.parentNode.insertBefore(node, reference);
        else svg.appendChild(node);
      };
      var shadow = svg.querySelector('ellipse');
      insertBefore(aura, shadow && shadow.nextSibling);
      var pack = svg.querySelector('.bb-mascot__pack');
      insertBefore(backExtra, pack);
      var visorRect = svg.querySelector('rect[x="23"][y="35"]');
      insertBefore(outfit, visorRect);
      var core = svg.querySelector('.bb-mascot__core');
      insertBefore(mark, core && core.nextSibling);
      svg.appendChild(visorFx);
      svg.appendChild(hat);
      this.byteSlots = { aura: aura, 'back-extra': backExtra, outfit: outfit, 'visor-fx': visorFx, hat: hat, 'skin-mark': mark };
      return this.byteSlots;
    }

    applyLook(look) {
      this.look = deepCopy(look);
      if (!this.host) return;
      var slots = this.ensureByteSlots();
      if (!slots) return;
      var skin = SKINS[this.look.skin] || SKINS.classic;
      var svg = this.host.querySelector('svg');
      if (svg) {
        var bodyStops = svg.querySelectorAll('#bbMascotBody stop');
        if (bodyStops[0]) bodyStops[0].setAttribute('stop-color', skin.c1);
        if (bodyStops[1]) bodyStops[1].setAttribute('stop-color', skin.c1);
        if (bodyStops[2]) bodyStops[2].setAttribute('stop-color', skin.c2);
        if (bodyStops[3]) bodyStops[3].setAttribute('stop-color', skin.c2);
        var coreStops = svg.querySelectorAll('#bbMascotCore stop');
        if (coreStops[1]) coreStops[1].setAttribute('stop-color', skin.c1);
        if (coreStops[2]) coreStops[2].setAttribute('stop-color', skin.c2);
        Array.prototype.slice.call(svg.querySelectorAll('.bb-mascot__hand path')).forEach(function (path) { path.setAttribute('fill', skin.c1); });
        var packRect = svg.querySelector('.bb-mascot__pack rect');
        if (packRect) packRect.setAttribute('fill', skin.c2);
      }
      this.host.style.setProperty('--sq-1', skin.c1);
      this.host.style.setProperty('--sq-2', skin.c2);
      this.host.style.setProperty('--sq-accent', skin.accent);
      var parts = {
        'skin-mark': skin.mark,
        hat: HATS[this.look.hat] || '',
        outfit: OUTFITS[this.look.outfit] || '',
        'back-extra': this.look.outfit === 'cape' ? OUTFITS.cape : '',
        'visor-fx': VISORS[this.look.visor] || '',
        aura: AURAS[this.look.aura] || ''
      };
      Object.keys(parts).forEach(function (name) {
        if (slots[name]) slots[name].innerHTML = parts[name];
      });
      this.host.dataset.skin = this.look.skin;
      this.host.dataset.hat = this.look.hat;
      this.host.dataset.visor = this.look.visor;
      this.host.dataset.aura = this.look.aura;
      this.host.dataset.antenna = (this.look.hat === 'crown' || this.look.hat === 'party') ? 'hide' : 'show';
    }
  }

  /* ---------- Director social ---------- */
  class SocialDirector {
    constructor(manager) {
      this.manager = manager;
      this.lastMeet = 0;
      this.lastByKind = {};
      this.suppressUntil = 0;
      this.active = null;
      this.timers = [];
      var self = this;
      window.addEventListener('bytebay:streak-meet', function () {
        self.lastMeet = Date.now();
        self.suppressUntil = self.lastMeet + MEET_COOLDOWN;
        self.abort();
      }, true);
    }

    abort() {
      this.timers.forEach(function (timer) { window.clearTimeout(timer); });
      this.timers = [];
      this.active = null;
      this.manager.entities.forEach(function (entity) {
        if (entity.id === 'byte') return;
        entity.host.classList.remove('is-highfive', 'is-ball', 'is-chat', 'is-curious', 'has-hands');
        entity.host.style.removeProperty('--sq-ball-x');
        entity.host.style.removeProperty('--sq-ball-y');
      });
    }

    burst(x, y) {
      if (document.body.classList.contains('bb-mascot-inactive')) return;
      var node = document.createElement('span');
      node.className = 'bb-social-burst';
      node.setAttribute('aria-hidden', 'true');
      node.style.left = Math.round(x) + 'px';
      node.style.top = Math.round(y) + 'px';
      for (var i = 0; i < 10; i += 1) {
        var particle = document.createElement('span');
        particle.style.setProperty('--i', String(i));
        node.appendChild(particle);
      }
      document.body.appendChild(node);
      var timer = window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1200);
      this.timers.push(timer);
    }

    chatTags(x, y) {
      var list = ['Tech', 'Oferta', 'Me gusta', 'Explora'];
      var self = this;
      list.forEach(function (label, index) {
        var node = document.createElement('span');
        node.className = 'bb-social-tag';
        node.textContent = label;
        node.style.left = Math.round(x + (index - 1.5) * 16) + 'px';
        node.style.top = Math.round(y) + 'px';
        node.style.setProperty('--ex', ((index % 2 ? 1 : -1) * (12 + index * 4)) + 'px');
        node.style.animationDelay = (index * 90) + 'ms';
        document.body.appendChild(node);
        var timer = window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1800);
        self.timers.push(timer);
      });
    }

    canStart(kind) {
      if (this.active || document.visibilityState === 'hidden') return false;
      if (document.body.classList.contains('bb-mascot-hidden') ||
          document.body.classList.contains('bb-wardrobe-open') ||
          document.body.classList.contains('bb-mascot-inactive')) return false;
      var companion = window.ByteBayCompanion;
      if (companion && companion.state && (companion.state.thinking || companion.state.quiet || companion.state.dragging)) return false;
      var stamp = Date.now();
      if (stamp < this.suppressUntil || stamp - this.lastMeet < MEET_COOLDOWN) return false;
      var cooldowns = { highfive: 9000, ball: 11000, chat: 15000 };
      return stamp - (this.lastByKind[kind] || 0) >= (cooldowns[kind] || 9000);
    }

    tick() {
      if (!this.canStart('chat')) return;
      var visible = this.manager.entities.filter(function (entity) {
        return entity.visible && entity.host && isFinite(entity.center.x) && isFinite(entity.center.y);
      });
      for (var i = 0; i < visible.length; i += 1) {
        for (var j = i + 1; j < visible.length; j += 1) {
          var a = visible[i];
          var b = visible[j];
          var distance = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
          var nearByte = a.id === 'byte' || b.id === 'byte';
          var kind = null;
          if (distance >= 60 && distance < (nearByte ? 150 : 180)) kind = nearByte ? 'highfive' : 'ball';
          else if (distance > 20 && distance < MEET_DISTANCE) kind = 'chat';
          if (kind && this.canStart(kind)) { this.start(kind, a, b); return; }
        }
      }
    }

    trigger(kind, aId, bId) {
      if (['highfive', 'ball', 'chat'].indexOf(kind) < 0) return false;
      if (document.body.classList.contains('bb-mascot-hidden') || document.body.classList.contains('bb-wardrobe-open')) return false;
      var a = this.manager.entity(aId);
      var b = this.manager.entity(bId);
      if (!a || !b || a === b || !a.visible || !b.visible) return false;
      this.abort();
      this.start(kind, a, b);
      return true;
    }

    start(kind, a, b) {
      if (this.active) this.abort();
      var stamp = Date.now();
      this.lastMeet = stamp;
      this.lastByKind[kind] = stamp;
      this.active = kind;
      var x = (a.center.x + b.center.x) / 2;
      var y = (a.center.y + b.center.y) / 2;
      var self = this;
      var other = function (entity) { return entity === a ? b : a; };
      var showHands = function (entity) {
        if (entity.id !== 'byte') entity.host.classList.add('has-hands');
      };
      [a, b].forEach(function (entity) {
        var target = other(entity);
        entity.lookAt(target.center.x, target.center.y);
      });

      if (kind === 'highfive') {
        [a, b].forEach(function (entity) {
          showHands(entity);
          entity.playClass('is-highfive', 1400);
          if (entity.id === 'byte') {
            entity.flashHands(900);
            entity.playClass('is-wave', 900);
          } else {
            entity.playTone('social');
          }
        });
        this.burst(x, y);
        this.finish(1600, ['is-highfive'], [a, b]);
      } else if (kind === 'ball') {
        [a, b].forEach(function (entity) {
          showHands(entity);
          entity.playClass('is-ball', 3200);
          entity.playTone('ball');
        });
        var byteEntity = this.manager.entity('byte');
        if (byteEntity && byteEntity.visible) {
          byteEntity.playClass('is-happy', 900);
          byteEntity.showBubble('¡Pásala!', 1400, { silent: true });
        }
        [0, 1, 2, 3].forEach(function (step, index) {
          var timer = window.setTimeout(function () {
            var from = step % 2 === 0 ? a : b;
            var to = step % 2 === 0 ? b : a;
            from.host.style.setProperty('--sq-ball-x', '0px');
            to.host.style.setProperty('--sq-ball-x', (from.center.x < to.center.x ? 34 : -34) + 'px');
            to.host.style.setProperty('--sq-ball-y', '-18px');
          }, 420 + index * 620);
          self.timers.push(timer);
        });
        this.burst(x, y);
        this.finish(3400, ['is-ball'], [a, b]);
      } else {
        [a, b].forEach(function (entity) {
          entity.playClass('is-chat', 2200);
          entity.showBubble(['¡Dato!', '¿Viste esto?', 'Me encanta', 'Exploremos'][Math.floor(Math.random() * 4)], 1800,
            entity.id === 'byte' ? { silent: true } : undefined);
        });
        this.chatTags(x, y);
        this.finish(2300, ['is-chat'], [a, b]);
      }
      window.dispatchEvent(new CustomEvent('bytebay:social-interaction', { detail: { kind: kind, a: a.id, b: b.id } }));
    }

    finish(ms, classes, pair) {
      var entities = pair || this.manager.entities;
      var self = this;
      var timer = window.setTimeout(function () {
        entities.forEach(function (entity) {
          classes.forEach(function (name) { entity.host.classList.remove(name); });
          if (entity.id !== 'byte') {
            entity.host.classList.remove('has-hands');
            if (classes.indexOf('is-ball') >= 0) {
              entity.host.style.setProperty('--sq-ball-x', '0px');
              entity.host.style.setProperty('--sq-ball-y', '0px');
            }
          }
        });
        self.active = null;
      }, ms);
      this.timers.push(timer);
    }
  }

  /* ---------- Manager ---------- */
  class MascotManager {
    constructor() {
      this.wardrobe = loadWardrobe();
      this.entities = [];
      this.social = new SocialDirector(this);
      this.lastTime = now();
      this.rafId = 0;
      this.intervalId = 0;
      this.ready = false;
      this.init();
    }

    init() {
      var byteHost = document.querySelector('#bbMascot');
      if (!byteHost) return;
      this.entities.push(new ByteEntityAdapter(this));
      ['pixel', 'nano'].forEach(function (id) {
        var host = document.createElement('div');
        host.id = 'bb' + id.charAt(0).toUpperCase() + id.slice(1);
        host.className = 'bb-squad';
        host.setAttribute('data-mascot', id);
        host.setAttribute('data-active', 'false');
        host.setAttribute('role', 'button');
        host.setAttribute('tabindex', '0');
        host.setAttribute('aria-label', (id === 'pixel' ? 'Pixel' : 'Nano') + ', compañero de Byte. Arrástralo o toca para interactuar.');
        host.setAttribute('aria-describedby', host.id + 'Tooltip');
        host.innerHTML = '<span class="bb-squad__tooltip" id="' + host.id + 'Tooltip" role="tooltip"></span>' +
          '<span class="bb-squad__badge" aria-hidden="true">' + (id === 'pixel' ? 'Pixel' : 'Nano') + '</span>' +
          '<span class="bb-squad__bubble" role="status" aria-live="polite"></span>';
        document.body.appendChild(host);
        return host;
      }.bind(this));

      var self = this;
      ['pixel', 'nano'].forEach(function (id, index) {
        var host = document.querySelector('#bb' + id.charAt(0).toUpperCase() + id.slice(1));
        if (host) self.entities.push(new MascotEntity(self, id, host, self.wardrobe.byId[id]));
      });

      this.entities.forEach(function (entity) {
        if (entity.host) {
          var tooltip = entity.host.querySelector('.bb-squad__tooltip');
          if (tooltip && entity.id !== 'byte') {
            tooltip.textContent = entity.id === 'pixel' ? 'Pixel explora productos contigo' : 'Nano se energiza con ofertas y carritos';
          }
        }
      });

      this.applySquad(this.wardrobe.squad, false);
      document.body.classList.add('bb-squad-ready');
      this.bindStoreEvents();
      this.startLoop();
      this.ready = true;
      window.dispatchEvent(new CustomEvent('bytebay:squad-ready', { detail: { squad: this.wardrobe.squad } }));
    }

    entity(id) {
      for (var i = 0; i < this.entities.length; i += 1) if (this.entities[i].id === id) return this.entities[i];
      return null;
    }

    activeIds() {
      return this.wardrobe.squad === 'byte' ? ['byte']
        : this.wardrobe.squad === 'byte+pixel' ? ['byte', 'pixel'] : ['byte', 'pixel', 'nano'];
    }

    applySquad(mode, persist) {
      if (SQUADS.indexOf(mode) < 0) mode = 'byte';
      this.wardrobe.squad = mode;
      var active = this.activeIds();
      this.entities.forEach(function (entity) { entity.setVisible(active.indexOf(entity.id) >= 0); });
      if (persist) this.wardrobe = saveWardrobe(this.wardrobe);
      window.dispatchEvent(new CustomEvent('bytebay:squad-changed', { detail: { squad: mode, active: active } }));
      return active;
    }

    setSquad(mode) { return this.applySquad(mode, true); }

    abortSocial() { this.social.abort(); }

    celebrate() {
      this.entities.forEach(function (entity) {
        if (!entity.visible) return;
        entity.playClass('is-dance', 1500);
        if (entity.id !== 'byte') entity.showBubble('¡Baile de celebración!', 1500);
      });
    }

    reactToCart() {
      var nano = this.entity('nano');
      var pixel = this.entity('pixel');
      if (nano && nano.visible) {
        nano.playClass('is-happy', 1100);
        nano.showBubble('¡Excelente elección!', 1800);
        nano.playTone('social');
      }
      if (pixel && pixel.visible) pixel.playClass('is-curious', 1100);
    }

    reactToSearch() {
      var pixel = this.entity('pixel');
      if (!pixel || !pixel.visible) return;
      pixel.playClass('is-scan', 2200);
      pixel.showBubble('Voy a explorar eso', 1700);
    }

    reactToFilter() {
      this.celebrate();
      var nano = this.entity('nano');
      if (nano && nano.visible) nano.showBubble('¡Filtro aplicado!', 1400);
    }

    bindStoreEvents() {
      var self = this;
      document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function' || event.__bbSquadHandled) return;
        var add = target.closest('.add, #modalAddToCart, .add-to-cart, [data-add-to-cart]');
        if (add && !add.disabled && add.getAttribute('aria-disabled') !== 'true') {
          event.__bbSquadHandled = true;
          window.setTimeout(function () { self.reactToCart(); }, 60);
        } else if (target.closest('#cartOpen')) {
          window.setTimeout(function () { self.celebrate(); }, 80);
        } else if (target.closest('.filter-chip, #clearCatalogFilters')) {
          window.setTimeout(function () { self.reactToFilter(); }, 80);
        }
      }, true);
      document.addEventListener('change', function (event) {
        if (event.target && typeof event.target.closest === 'function' &&
            event.target.closest('#catalogPriceFilter, #catalogCategoryFilter, #catalogOfferFilter')) {
          self.reactToFilter();
        }
      }, true);
      document.querySelector('#searchForm')?.addEventListener('submit', function () { self.reactToSearch(); });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') self.abortSocial();
      });
    }

    startLoop() {
      var self = this;
      var frame = function (time) {
        if (self.intervalId) return;
        if (document.visibilityState !== 'hidden') {
          self.entities.forEach(function (entity) { if (entity.id !== 'byte') entity.tick(time); });
          self.social.tick();
        }
        self.rafId = window.requestAnimationFrame(frame);
      };
      this.lastTime = now();
      if (typeof window.requestAnimationFrame === 'function') {
        this.rafId = window.requestAnimationFrame(frame);
        window.setTimeout(function () {
          if (!self.rafId && !self.intervalId) {
            self.intervalId = window.setInterval(function () {
              self.entities.forEach(function (entity) { if (entity.id !== 'byte') entity.tick(now()); });
              self.social.tick();
            }, 16);
          }
        }, 300);
      } else {
        this.intervalId = window.setInterval(function () {
          self.entities.forEach(function (entity) { if (entity.id !== 'byte') entity.tick(now()); });
          self.social.tick();
        }, 16);
      }
    }

    saveLook(id, look) {
      if (!this.wardrobe.byId[id]) this.wardrobe.byId[id] = deepCopy(DEFAULTS.byId[id] || DEFAULTS.byId.byte);
      Object.keys(CATALOG).forEach(function (cat) {
        if (typeof look[cat] === 'string' && CATALOG[cat][look[cat]] !== undefined) this.wardrobe.byId[id][cat] = look[cat];
      }, this);
      this.wardrobe = saveWardrobe(this.wardrobe);
      var entity = this.entity(id);
      if (entity && typeof entity.applyLook === 'function') entity.applyLook(this.wardrobe.byId[id]);
      window.dispatchEvent(new CustomEvent('bytebay:wardrobe-saved', { detail: { id: id, look: deepCopy(this.wardrobe.byId[id]) } }));
      return deepCopy(this.wardrobe.byId[id]);
    }

    randomLook(id) {
      var look = {};
      Object.keys(CATALOG).forEach(function (cat) {
        var keys = Object.keys(CATALOG[cat]);
        look[cat] = keys[Math.floor(Math.random() * keys.length)];
      });
      return this.saveLook(id, look);
    }
  }

  /* ---------- WardrobeUI ---------- */
  class WardrobeUI {
    constructor(manager) {
      this.manager = manager;
      this.current = 'byte';
      this.draft = {};
      this.modal = document.querySelector('#bbWardrobe');
      if (!this.modal) this.createModal();
      this.cache();
      this.bind();
    }

    createModal() {
      var tabs = PETS.map(function (id) {
        var color = id === 'byte' ? '#38FEDC' : id === 'pixel' ? '#B833FF' : '#FF9F1C';
        var label = id === 'byte' ? 'Byte' : id === 'pixel' ? 'Pixel' : 'Nano';
        return '<button class="bb-wardrobe__tab" type="button" role="tab" data-pet="' + id + '" aria-selected="false" style="--tab-color:' + color + '"><span class="bb-wardrobe__dot" aria-hidden="true"></span>' + label + '</button>';
      }).join('');
      var categories = [
        ['skin', 'Colores / Skins'], ['hat', 'Sombreros / Cabeza'], ['outfit', 'Ropa / Trajes'],
        ['visor', 'Visor / Lentes'], ['aura', 'Aura / Decoración']
      ].map(function (entry) {
        var chips = Object.keys(CATALOG[entry[0]]).map(function (key) {
          var label = (LABELS[entry[0]] && LABELS[entry[0]][key]) || CATALOG[entry[0]][key].label || key;
          var swatch = entry[0] === 'skin' ? '<span class="bb-wardrobe__swatch" style="--swatch:' + CATALOG.skin[key].c1 + '"></span>' : '';
          return '<button class="bb-wardrobe__chip" type="button" data-cat="' + entry[0] + '" data-value="' + key + '" aria-pressed="false">' + swatch + escapeHTML(label) + '</button>';
        }).join('');
        return '<section class="bb-wardrobe__cat"><h4>' + entry[1] + '</h4><div class="bb-wardrobe__chips">' + chips + '</div></section>';
      }).join('');
      var squadButtons = SQUADS.map(function (mode) {
        var label = mode === 'byte' ? 'Solo Byte' : mode === 'byte+pixel' ? 'Byte + Pixel' : 'Escuadrón completo';
        return '<button class="bb-wardrobe__tabbtn" type="button" data-wardrobe-squad="' + mode + '" aria-pressed="false">' + label + '</button>';
      }).join('');
      var node = document.createElement('div');
      node.id = 'bbWardrobe';
      node.className = 'bb-wardrobe';
      node.hidden = true;
      node.setAttribute('role', 'dialog');
      node.setAttribute('aria-modal', 'true');
      node.setAttribute('aria-labelledby', 'bbWardrobeTitle');
      node.innerHTML = '<div class="bb-wardrobe__card">' +
        '<header class="bb-wardrobe__head"><div><span class="bb-wardrobe__kicker">BYTE BAY · ESTUDIO DE PERSONALIZACIÓN</span>' +
          '<h2 class="bb-wardrobe__title" id="bbWardrobeTitle">Vestidor de mascotas</h2>' +
          '<p class="bb-wardrobe__subtitle">Elige a tu compañero, cámbiale el look y guarda el estilo.</p></div>' +
          '<button class="bb-wardrobe__close" id="bbWardrobeClose" type="button" aria-label="Cerrar vestidor">×</button></header>' +
        '<div class="bb-wardrobe__tabs" role="tablist" aria-label="Seleccionar mascota">' + tabs + '</div>' +
        '<div class="bb-wardrobe__body"><div class="bb-wardrobe__stage"><div class="bb-wardrobe__preview" id="bbWardrobePreview"></div>' +
          '<span class="bb-wardrobe__name" id="bbWardrobeName">Byte</span></div>' +
          '<div class="bb-wardrobe__panel">' + categories + '</div></div>' +
        '<footer class="bb-wardrobe__foot"><div class="bb-wardrobe__squad"><span>Mostrar en pantalla</span>' + squadButtons + '</div>' +
          '<div class="bb-wardrobe__actions"><button class="bb-wardrobe__action" id="bbWardrobeRandom" type="button">Aleatorio</button>' +
          '<button class="bb-wardrobe__action is-primary" id="bbWardrobeSave" type="button">Guardar look</button></div>' +
          '<span class="bb-wardrobe__status" id="bbWardrobeStatus" role="status"></span></footer></div>';
      document.body.appendChild(node);
      this.modal = node;
    }

    cache() {
      this.preview = this.modal.querySelector('#bbWardrobePreview');
      this.nameNode = this.modal.querySelector('#bbWardrobeName');
      this.status = this.modal.querySelector('#bbWardrobeStatus');
      this.closeButton = this.modal.querySelector('#bbWardrobeClose');
      this.saveButton = this.modal.querySelector('#bbWardrobeSave');
      this.randomButton = this.modal.querySelector('#bbWardrobeRandom');
    }

    bind() {
      var self = this;
      this.modal.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        var pet = target.closest('[data-pet]');
        if (pet) { self.select(pet.dataset.pet); return; }
        var chip = target.closest('[data-cat][data-value]');
        if (chip) { self.choose(chip.dataset.cat, chip.dataset.value); return; }
        var squad = target.closest('[data-wardrobe-squad]');
        if (squad) {
          self.manager.setSquad(squad.dataset.wardrobeSquad);
          self.syncSquad();
          self.flash('Escuadrón actualizado');
          return;
        }
        if (target.closest('#bbWardrobeClose')) self.close();
        else if (target.closest('#bbWardrobeSave')) self.save();
        else if (target.closest('#bbWardrobeRandom')) self.random();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !self.modal.hidden) self.close();
      });
      document.addEventListener('click', function (event) {
        if (event.target === self.modal) self.close();
      });
      var opener = document.querySelector('#bbWardrobeOpen');
      if (opener) opener.addEventListener('click', function () { self.open('byte'); });
      var settingsOpener = document.querySelector('#settingsWardrobeOpen');
      if (settingsOpener) settingsOpener.addEventListener('click', function () { self.open('byte'); });
    }

    open(id) {
      this.returnFocus = document.activeElement;
      this.manager.abortSocial();
      this.select(id && PETS.indexOf(id) >= 0 ? id : 'byte');
      this.syncSquad();
      this.modal.hidden = false;
      window.requestAnimationFrame(function () { this.modal.classList.add('is-open'); }.bind(this));
      document.body.classList.add('bb-wardrobe-open');
      this.closeButton.focus();
    }

    close() {
      this.modal.classList.remove('is-open');
      document.body.classList.remove('bb-wardrobe-open');
      var self = this;
      window.setTimeout(function () { if (!self.modal.classList.contains('is-open')) self.modal.hidden = true; }, 200);
      if (this.returnFocus && typeof this.returnFocus.focus === 'function') this.returnFocus.focus();
      this.returnFocus = null;
    }

    select(id) {
      if (PETS.indexOf(id) < 0) id = 'byte';
      this.current = id;
      this.draft = deepCopy(this.manager.wardrobe.byId[id]);
      this.renderPreview();
      Array.prototype.slice.call(this.modal.querySelectorAll('[data-pet]')).forEach(function (tab) {
        tab.setAttribute('aria-selected', tab.dataset.pet === id ? 'true' : 'false');
      });
      if (this.nameNode) this.nameNode.textContent = id === 'byte' ? 'Byte' : id === 'pixel' ? 'Pixel' : 'Nano';
    }

    renderPreview() {
      if (!this.preview) return;
      clearNode(this.preview);
      this.preview.className = 'bb-wardrobe__preview bb-wardrobe-look';
      var mounted = mountSvg('preview');
      renameIds(mounted.root.querySelector('svg'));
      injectLook(mounted.root.querySelector('svg'), this.draft, null);
      var skin = SKINS[this.draft.skin] || SKINS.classic;
      this.preview.style.setProperty('--sq-1', skin.c1);
      this.preview.style.setProperty('--sq-2', skin.c2);
      this.preview.style.setProperty('--sq-accent', skin.accent);
      this.preview.dataset.antenna = (this.draft.hat === 'crown' || this.draft.hat === 'party') ? 'hide' : 'show';
      this.preview.appendChild(mounted.root);
      this.preview.classList.add('is-changing');
      var node = this.preview;
      window.setTimeout(function () { node.classList.remove('is-changing'); }, 430);
      Array.prototype.slice.call(this.modal.querySelectorAll('[data-cat][data-value]')).forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.dataset.value === this.draft[chip.dataset.cat] ? 'true' : 'false');
      }, this);
    }

    choose(category, value) {
      if (!CATALOG[category] || CATALOG[category][value] === undefined) return;
      this.draft[category] = value;
      this.renderPreview();
    }

    save() {
      this.manager.saveLook(this.current, this.draft);
      this.flash('Look guardado en este dispositivo');
    }

    random() {
      var look = {};
      Object.keys(CATALOG).forEach(function (cat) {
        var keys = Object.keys(CATALOG[cat]);
        look[cat] = keys[Math.floor(Math.random() * keys.length)];
      });
      this.draft = look;
      this.renderPreview();
      this.flash('Nuevo look aleatorio');
    }

    syncSquad() {
      Array.prototype.slice.call(this.modal.querySelectorAll('[data-wardrobe-squad]')).forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.wardrobeSquad === this.manager.wardrobe.squad ? 'true' : 'false');
      }, this);
    }

    flash(text) {
      if (!this.status) return;
      this.status.textContent = text;
      var node = this.status;
      window.clearTimeout(this.statusTimer);
      this.statusTimer = window.setTimeout(function () { node.textContent = ''; }, 2600);
    }
  }

  /* ---------- Bootstrap ---------- */
  var manager = null;
  var wardrobeUI = null;
  function bootstrap() {
    if (manager) return;
    manager = new MascotManager();
    if (!manager.ready) return;
    wardrobeUI = new WardrobeUI(manager);
    var api = {
      VERSION: '2',
      manager: manager,
      ui: wardrobeUI,
      entities: manager.entities,
      get: function (id) { return manager.entity(id); },
      setSquad: manager.setSquad.bind(manager),
      setVisible: function (id, on) {
        if (id === 'byte') return manager.activeIds();
        var active = manager.activeIds();
        var index = active.indexOf(id);
        if (on && index < 0) active.push(id);
        if (!on && index >= 0) active.splice(index, 1);
        var mode = active.indexOf('nano') >= 0 ? 'full' : active.indexOf('pixel') >= 0 ? 'byte+pixel' : 'byte';
        return manager.setSquad(mode);
      },
      celebrate: manager.celebrate.bind(manager),
      reactStore: function (type) {
        if (type === 'cart-add') manager.reactToCart();
        else if (type === 'cart-open') manager.celebrate();
        else if (type === 'filter') manager.reactToFilter();
        else if (type === 'search') manager.reactToSearch();
        else return false;
        return true;
      },
      highFive: function (a, b) { return manager.social.trigger('highfive', a || 'pixel', b || 'byte'); },
      passBall: function (a, b) { return manager.social.trigger('ball', a || 'pixel', b || 'nano'); },
      emojiChat: function (a, b) { return manager.social.trigger('chat', a || 'pixel', b || 'byte'); },
      abortSocial: manager.abortSocial.bind(manager),
      getLook: function (id) { return deepCopy(manager.wardrobe.byId[id] || DEFAULTS.byId.byte); },
      applyLook: manager.saveLook.bind(manager),
      randomLook: manager.randomLook.bind(manager),
      openWardrobe: wardrobeUI.open.bind(wardrobeUI),
      closeWardrobe: wardrobeUI.close.bind(wardrobeUI),
      get state() { return manager.wardrobe; }
    };
    window.ByteBaySquad = api;
    window.ByteBayMascots = api;
    window.MascotEntity = MascotEntity;
    window.MascotManager = MascotManager;
    window.WardrobeUI = WardrobeUI;
    window.dispatchEvent(new CustomEvent('bytebay:squad-ui-ready', {}));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}());
