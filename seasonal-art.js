/* ==========================================================================
   BYTE BAY — ARTE ESTACIONAL
   Símbolos SVG y composición de escena por tema. Sin dependencias.
   Expone window.BBSeasonalArt = { defs, scene(theme), garland(theme) }.
   ========================================================================== */
(function () {
  'use strict';

  var V = {
    tree: '0 0 200 300', 'cookie-man': '0 0 64 96', 'cookie-house': '0 0 120 104',
    'cookie-star': '0 0 64 64', cane: '0 0 64 88', gift: '0 0 80 80',
    stocking: '0 0 60 96', snowman: '0 0 96 140', bell: '0 0 60 72',
    pumpkin: '0 0 100 92', ghost: '0 0 80 100', grave: '0 0 70 90',
    cauldron: '0 0 110 80', rose: '0 0 64 88', flower: '0 0 60 90',
    tag: '0 0 80 80', bag: '0 0 80 90', pencil: '0 0 100 30',
    book: '0 0 80 64', horn: '0 0 80 60', glass: '0 0 50 90',
    clock: '0 0 80 80', empanada: '0 0 100 70', flag: '0 0 80 60'
  };

  var S = {};

  /* ---------------------------- NAVIDAD ---------------------------- */
  S.tree =
    '<symbol id="bb-tree" viewBox="0 0 200 300">' +
      '<ellipse cx="100" cy="288" rx="82" ry="11" fill="rgb(15 23 42 / .18)"/>' +
      '<path d="M90 242h20v46H90z" fill="#7b4a24"/>' +
      '<path d="M90 242h20v46H90z" fill="none" stroke="#5a3417" stroke-width="2"/>' +
      '<path d="M100 12C110 40 128 58 148 80c-14-6-22 2-36-3-8 7-16 7-24 0-14 5-22-3-36 3 20-22 38-40 48-68Z" fill="#15803d"/>' +
      '<path d="M100 52C114 88 142 112 168 140c-18-7-28 4-44-3-14 9-34 9-48 0-16 7-26-4-44 3 26-28 54-52 68-88Z" fill="#166534"/>' +
      '<path d="M100 96C118 138 152 166 186 202c-22-7-34 6-54-3-16 11-48 11-64 0-20 9-32-4-54 3 34-36 68-64 86-106Z" fill="#14532d"/>' +
      '<g fill="#f8fafc" opacity=".86">' +
        '<ellipse cx="52" cy="80" rx="13" ry="4"/><ellipse cx="88" cy="77" rx="11" ry="3.4"/>' +
        '<ellipse cx="112" cy="77" rx="11" ry="3.4"/><ellipse cx="148" cy="80" rx="13" ry="4"/>' +
        '<ellipse cx="32" cy="140" rx="15" ry="4.4"/><ellipse cx="76" cy="137" rx="14" ry="4"/>' +
        '<ellipse cx="124" cy="137" rx="14" ry="4"/><ellipse cx="168" cy="140" rx="15" ry="4.4"/>' +
        '<ellipse cx="14" cy="202" rx="16" ry="4.6"/><ellipse cx="68" cy="199" rx="15" ry="4.4"/>' +
        '<ellipse cx="132" cy="199" rx="15" ry="4.4"/><ellipse cx="186" cy="202" rx="16" ry="4.6"/>' +
        '<ellipse cx="100" cy="242" rx="26" ry="5"/>' +
      '</g>' +
      '<path d="M60 190q32-24 62-8 30 14 22-30-6-32-38-40-26-8-10-42" fill="none" stroke="#fde68a" stroke-width="2" opacity=".85"/>' +
      '<g fill="#fef08a"><circle cx="60" cy="190" r="3"/><circle cx="122" cy="182" r="3"/><circle cx="144" cy="152" r="3"/><circle cx="106" cy="112" r="3"/><circle cx="96" cy="70" r="3"/></g>' +
      '<g>' +
        '<circle cx="62" cy="128" r="8" fill="#dc2626"/><circle cx="59" cy="125" r="2.2" fill="#fff" opacity=".8"/>' +
        '<circle cx="138" cy="110" r="7" fill="#eab308"/><circle cx="136" cy="107" r="2" fill="#fff" opacity=".8"/>' +
        '<circle cx="100" cy="168" r="8" fill="#b91c1c"/><circle cx="97" cy="165" r="2.2" fill="#fff" opacity=".8"/>' +
        '<circle cx="150" cy="180" r="7" fill="#15803d"/><circle cx="148" cy="177" r="2" fill="#fff" opacity=".8"/>' +
        '<circle cx="46" cy="174" r="7" fill="#eab308"/><circle cx="44" cy="171" r="2" fill="#fff" opacity=".8"/>' +
      '</g>' +
      '<circle cx="100" cy="22" r="19" fill="#fde047" opacity=".22"/>' +
      '<path d="M100 2l6.5 13 14.5 2-10.5 10.2 2.5 14.4L100 34.5 87.5 41.6l2.5-14.4L79.5 17l14.5-2Z" fill="#fde047" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"/>' +
    '</symbol>';

  S['cookie-man'] =
    '<symbol id="bb-cookie-man" viewBox="0 0 64 96">' +
      '<g fill="#b57625" stroke="#8a5413" stroke-width="2" stroke-linejoin="round">' +
        '<circle cx="32" cy="15" r="12"/>' +
        '<path d="M20 30q12-5 24 0l10 14-7 6-9-10v22l8 24-10 3-4-19-4 19-10-3 8-24V40l-9 10-7-6Z"/>' +
      '</g>' +
      '<g fill="none" stroke="#fff7ed" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".95">' +
        '<path d="M12 43l4-3 3 4 4-3 3 4"/><path d="M52 43l-4-3-3 4-4-3-3 4"/>' +
        '<path d="M21 87l4-3 3 4 3-3"/><path d="M43 87l-4-3-3 4-3-3"/>' +
        '<path d="M25 21q7 4 14 0"/>' +
      '</g>' +
      '<circle cx="27" cy="14" r="1.9" fill="#422006"/><circle cx="37" cy="14" r="1.9" fill="#422006"/>' +
      '<path d="M28 19q4 4 8 0" fill="none" stroke="#422006" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="32" cy="44" r="2.8" fill="#dc2626"/><circle cx="32" cy="57" r="2.8" fill="#16a34a"/>' +
    '</symbol>';

  S['cookie-house'] =
    '<symbol id="bb-cookie-house" viewBox="0 0 120 104">' +
      '<path d="M12 48 60 10l48 38Z" fill="#9a5f18" stroke="#7c4a11" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M12 48 60 10l48 38-9 5-39-27-39 27Z" fill="#fff7ed" opacity=".94"/>' +
      '<rect x="24" y="48" width="72" height="50" rx="4" fill="#b57625" stroke="#8a5413" stroke-width="2"/>' +
      '<path d="M50 98V72a10 10 0 0 1 20 0v26Z" fill="#713f12"/>' +
      '<rect x="31" y="59" width="15" height="15" rx="2" fill="#fde68a" stroke="#fff7ed" stroke-width="2.4"/>' +
      '<rect x="74" y="59" width="15" height="15" rx="2" fill="#fde68a" stroke="#fff7ed" stroke-width="2.4"/>' +
      '<path d="M24 96h72M24 52h72" stroke="#fff7ed" stroke-width="4" stroke-linecap="round" opacity=".9"/>' +
      '<circle cx="60" cy="34" r="4" fill="#dc2626" stroke="#fff7ed" stroke-width="1.6"/>' +
    '</symbol>';

  S['cookie-star'] =
    '<symbol id="bb-cookie-star" viewBox="0 0 64 64">' +
      '<path d="M32 4l7 19 20 1-15 13 5 20-17-11-17 11 5-20L5 24l20-1Z" fill="#d9972c" stroke="#fff7ed" stroke-width="3.4" stroke-linejoin="round"/>' +
      '<circle cx="32" cy="29" r="2.3" fill="#dc2626"/><circle cx="25" cy="35" r="1.7" fill="#16a34a"/><circle cx="39" cy="35" r="1.7" fill="#dc2626"/>' +
    '</symbol>';

  S.cane =
    '<symbol id="bb-cane" viewBox="0 0 64 88">' +
      '<path d="M16 82V38a16 16 0 0 1 32 0" fill="none" stroke="#fff7ed" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M16 82V38a16 16 0 0 1 32 0" fill="none" stroke="#dc2626" stroke-width="13" stroke-dasharray="11 11"/>' +
    '</symbol>';

  S.gift =
    '<symbol id="bb-gift" viewBox="0 0 80 80">' +
      '<rect x="12" y="30" width="56" height="44" rx="4" fill="#b91c1c"/>' +
      '<rect x="8" y="22" width="64" height="14" rx="3" fill="#dc2626"/>' +
      '<path d="M40 22v52M8 36h64" stroke="#fde68a" stroke-width="8"/>' +
      '<path d="M40 22C30 6 16 10 22 20c3 5 11 6 18 2Z" fill="#fcd34d"/>' +
      '<path d="M40 22C50 6 64 10 58 20c-3 5-11 6-18 2Z" fill="#fcd34d"/>' +
      '<circle cx="40" cy="21" r="4" fill="#f59e0b"/>' +
    '</symbol>';

  S.stocking =
    '<symbol id="bb-stocking" viewBox="0 0 60 96">' +
      '<path d="M14 14h32v32c0 18 6 28 14 34-8 8-24 10-34 2-8-6-12-16-12-30V14Z" fill="#b91c1c"/>' +
      '<rect x="8" y="8" width="44" height="16" rx="6" fill="#fff7ed"/>' +
      '<path d="M44 80c8 2 14 0 18-6" fill="none" stroke="#fff7ed" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M18 84c8 4 18 4 26 0" fill="none" stroke="#fff7ed" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M30 8c0-6 10-6 10 0" fill="none" stroke="#d8b45f" stroke-width="3"/>' +
    '</symbol>';

  S.snowman =
    '<symbol id="bb-snowman" viewBox="0 0 96 140">' +
      '<ellipse cx="48" cy="134" rx="36" ry="6" fill="rgb(15 23 42 / .16)"/>' +
      '<circle cx="48" cy="102" r="30" fill="#f8fafc" stroke="#dbeafe" stroke-width="2"/>' +
      '<circle cx="48" cy="60" r="22" fill="#fff" stroke="#dbeafe" stroke-width="2"/>' +
      '<circle cx="48" cy="26" r="16" fill="#fff" stroke="#dbeafe" stroke-width="2"/>' +
      '<path d="M30 44h36l-4 10H34Z" fill="#b91c1c"/>' +
      '<path d="M52 52l12 20-6 4-12-20Z" fill="#dc2626"/>' +
      '<path d="M22 68 4 56M74 68l18-14" stroke="#7c4a21" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 25l16 5-16 4Z" fill="#f97316"/>' +
      '<circle cx="42" cy="22" r="2" fill="#1f2937"/><circle cx="53" cy="22" r="2" fill="#1f2937"/>' +
      '<circle cx="48" cy="90" r="3" fill="#1f2937"/><circle cx="48" cy="104" r="3" fill="#1f2937"/>' +
      '<rect x="33" y="12" width="30" height="5" rx="2" fill="#1f2937"/>' +
      '<path d="M38 12V0h20v12Z" fill="#1f2937"/>' +
    '</symbol>';

  S.bell =
    '<symbol id="bb-bell" viewBox="0 0 60 72">' +
      '<path d="M30 8c-11 0-18 9-18 22 0 14-4 22-8 28h52c-4-6-8-14-8-28C48 17 41 8 30 8Z" fill="#eab308" stroke="#a16207" stroke-width="2"/>' +
      '<path d="M18 46h24" stroke="#fef08a" stroke-width="3" opacity=".7"/>' +
      '<circle cx="30" cy="62" r="5" fill="#a16207"/>' +
      '<path d="M30 8c0-4 3-6 6-5" fill="none" stroke="#a16207" stroke-width="2"/>' +
    '</symbol>';

  /* --------------------------- HALLOWEEN --------------------------- */
  S.pumpkin =
    '<symbol id="bb-pumpkin" viewBox="0 0 100 92">' +
      '<ellipse cx="50" cy="86" rx="42" ry="6" fill="rgb(0 0 0 / .3)"/>' +
      '<path d="M46 18c-6-10-18-12-22-6-3 5 2 10 8 13" fill="#4d7c0f"/>' +
      '<ellipse cx="50" cy="52" rx="44" ry="34" fill="#ea580c"/>' +
      '<ellipse cx="28" cy="52" rx="18" ry="32" fill="#f97316" opacity=".65"/>' +
      '<ellipse cx="72" cy="52" rx="18" ry="32" fill="#f97316" opacity=".65"/>' +
      '<path d="M28 42l14 7-14 5Z" fill="#1c1917"/><path d="M72 42 58 49l14 5Z" fill="#1c1917"/>' +
      '<path d="M50 54l-5 9h10Z" fill="#1c1917"/>' +
      '<path d="M33 66q17 15 34 0-4 18-17 18T33 66Z" fill="#1c1917"/>' +
      '<path d="M38 69h5v5h-5zM52 67h5v5h-5z" fill="#fde047"/>' +
    '</symbol>';

  S.ghost =
    '<symbol id="bb-ghost" viewBox="0 0 80 100">' +
      '<path d="M40 6c-19 0-30 15-30 36v46l10-8 10 8 10-8 10 8 10-8 10 8V42C70 21 59 6 40 6Z" fill="#f8fafc" opacity=".94"/>' +
      '<ellipse cx="30" cy="42" rx="5" ry="7" fill="#1c1917"/><ellipse cx="50" cy="42" rx="5" ry="7" fill="#1c1917"/>' +
      '<ellipse cx="40" cy="61" rx="7" ry="9" fill="#1c1917"/>' +
    '</symbol>';

  S.grave =
    '<symbol id="bb-grave" viewBox="0 0 70 90">' +
      '<path d="M8 86V36a27 27 0 0 1 54 0v50Z" fill="#78716c" stroke="#57534e" stroke-width="2"/>' +
      '<path d="M22 47h26M35 34v28M26 63h18" stroke="#57534e" stroke-width="4" stroke-linecap="round"/>' +
    '</symbol>';

  S.cauldron =
    '<symbol id="bb-cauldron" viewBox="0 0 110 80">' +
      '<ellipse cx="55" cy="32" rx="42" ry="14" fill="#84cc16"/>' +
      '<path d="M13 32h84c0 26-18 42-42 42S13 58 13 32Z" fill="#1c1917"/>' +
      '<ellipse cx="55" cy="32" rx="42" ry="12" fill="#1c1917"/>' +
      '<ellipse cx="55" cy="34" rx="36" ry="9" fill="#65a30d"/>' +
      '<circle cx="40" cy="30" r="4" fill="#bef264"/><circle cx="66" cy="28" r="3" fill="#bef264"/>' +
      '<path d="M8 44 2 56M102 44l6 12" stroke="#292524" stroke-width="6" stroke-linecap="round"/>' +
    '</symbol>';

  /* ----------------------------- RESTO ----------------------------- */
  S.rose =
    '<symbol id="bb-rose" viewBox="0 0 64 88">' +
      '<path d="M32 86V42" stroke="#166534" stroke-width="4"/>' +
      '<path d="M32 66c-14-10-22-6-20 2 4 8 14 8 20-2Z" fill="#15803d"/>' +
      '<path d="M32 59c14-10 22-6 20 2-4 8-14 8-20-2Z" fill="#16a34a"/>' +
      '<circle cx="32" cy="26" r="20" fill="#e11d48"/>' +
      '<path d="M32 10c10 4 14 14 8 22-4 6-14 6-18 0-5-8 0-18 10-22Z" fill="#f43f5e"/>' +
      '<path d="M32 18c5 4 6 12 1 16-5-2-7-10-1-16Z" fill="#be123c"/>' +
    '</symbol>';

  S.flower =
    '<symbol id="bb-flower" viewBox="0 0 60 90">' +
      '<path d="M30 86V36" stroke="#15803d" stroke-width="3"/>' +
      '<path d="M30 66c-12-8-18-4-17 2 3 6 11 7 17-2Z" fill="#16a34a"/>' +
      '<g fill="#fda4af">' +
        '<ellipse cx="30" cy="12" rx="6" ry="11"/><ellipse cx="30" cy="38" rx="6" ry="11"/>' +
        '<ellipse cx="16" cy="25" rx="11" ry="6"/><ellipse cx="44" cy="25" rx="11" ry="6"/>' +
        '<ellipse cx="20" cy="15" rx="6" ry="10" transform="rotate(-45 20 15)"/>' +
        '<ellipse cx="40" cy="15" rx="6" ry="10" transform="rotate(45 40 15)"/>' +
        '<ellipse cx="20" cy="35" rx="6" ry="10" transform="rotate(45 20 35)"/>' +
        '<ellipse cx="40" cy="35" rx="6" ry="10" transform="rotate(-45 40 35)"/>' +
      '</g>' +
      '<circle cx="30" cy="25" r="8" fill="#facc15"/>' +
    '</symbol>';

  S.tag =
    '<symbol id="bb-tag" viewBox="0 0 80 80">' +
      '<path d="M8 8h30l34 34-30 30L8 38Z" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>' +
      '<circle cx="22" cy="22" r="4" fill="#fff7ed"/>' +
      '<path d="m34 52 18-18M38 34h.1M52 48h.1" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>' +
    '</symbol>';

  S.bag =
    '<symbol id="bb-bag" viewBox="0 0 80 90">' +
      '<path d="M12 28h56l6 58H6Z" fill="#b91c1c"/>' +
      '<path d="M26 32V22a14 14 0 0 1 28 0v10" fill="none" stroke="#7f1d1d" stroke-width="5"/>' +
      '<path d="M20 50h40" stroke="#fde68a" stroke-width="3" opacity=".75"/>' +
    '</symbol>';

  S.pencil =
    '<symbol id="bb-pencil" viewBox="0 0 100 30">' +
      '<path d="M6 15 22 4h66v22H22Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>' +
      '<path d="M6 15 22 4v22Z" fill="#fcd9b6"/>' +
      '<path d="m6 15 8-2-8 2 8 2Z" fill="#1f2937"/>' +
      '<rect x="72" y="4" width="12" height="22" fill="#f9a8d4"/>' +
      '<rect x="84" y="4" width="4" height="22" fill="#e5e7eb"/>' +
    '</symbol>';

  S.book =
    '<symbol id="bb-book" viewBox="0 0 80 64">' +
      '<path d="M8 12h28c4 0 6 2 6 6v42c0-4-3-6-6-6H8Z" fill="#2563eb"/>' +
      '<path d="M72 12H44c-4 0-6 2-6 6v42c0-4 3-6 6-6h28Z" fill="#1d4ed8"/>' +
      '<path d="M40 18v42" stroke="#bfdbfe" stroke-width="2"/>' +
      '<path d="M14 24h18M14 32h18M48 24h18M48 32h18" stroke="#bfdbfe" stroke-width="2"/>' +
    '</symbol>';

  S.horn =
    '<symbol id="bb-horn" viewBox="0 0 80 60">' +
      '<path d="M8 26 46 12v36L8 34Z" fill="#a78bfa"/>' +
      '<path d="M14 30h30" stroke="#7c3aed" stroke-width="3"/>' +
      '<path d="M48 20c8-6 18-6 26 0M48 32c10-4 18-2 24 4" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
    '</symbol>';

  S.glass =
    '<symbol id="bb-glass" viewBox="0 0 50 90">' +
      '<path d="M8 8h34L28 48v28h6v6H16v-6h6V48Z" fill="#e0f2fe" opacity=".75" stroke="#bae6fd" stroke-width="2"/>' +
      '<path d="M12 14h26L28 44H22Z" fill="#fde68a"/>' +
      '<circle cx="24" cy="24" r="2" fill="#fff"/>' +
    '</symbol>';

  S.clock =
    '<symbol id="bb-clock" viewBox="0 0 80 80">' +
      '<circle cx="40" cy="40" r="36" fill="#fef3c7" stroke="#d97706" stroke-width="4"/>' +
      '<circle cx="40" cy="40" r="29" fill="none" stroke="#f59e0b" stroke-width="1"/>' +
      '<path d="M40 16v5M40 59v5M16 40h5M59 40h5" stroke="#92400e" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M40 40V22M40 40h-11" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="40" cy="40" r="3.4" fill="#b45309"/>' +
      '<path d="M40 2l-5 8h10Z" fill="#fbbf24"/>' +
    '</symbol>';

  S.empanada =
    '<symbol id="bb-empanada" viewBox="0 0 100 70">' +
      '<ellipse cx="50" cy="62" rx="44" ry="6" fill="rgb(120 53 15 / .22)"/>' +
      '<path d="M8 50C10 24 28 10 50 10s40 14 42 40c-16 8-68 8-84 0Z" fill="#e0a33a" stroke="#b9751d" stroke-width="2"/>' +
      '<path d="M8 50c16 8 68 8 84 0-4 10-18 16-42 16S12 60 8 50Z" fill="#c98826" stroke="#a56517" stroke-width="2"/>' +
      '<path d="M14 48q6-6 12 0t12 0 12 0 12 0 12 0 12 0" fill="none" stroke="#f6d27a" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="36" cy="28" rx="8" ry="4" fill="#f3c46b" opacity=".7"/>' +
      '<ellipse cx="66" cy="34" rx="6" ry="3" fill="#f3c46b" opacity=".6"/>' +
    '</symbol>';

  S.flag =
    '<symbol id="bb-flag" viewBox="0 0 80 60">' +
      '<path d="M10 6h60v48H10Z" fill="#fff"/>' +
      '<path d="M10 6h60v16H10ZM10 38h60v16H10Z" fill="#dc2626"/>' +
      '<path d="M40 22h.1M36 30l4 4 4-4M40 34v4" stroke="#b45309" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
      '<path d="M8 4v54" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="8" cy="4" r="3" fill="#d97706"/>' +
    '</symbol>';

  /* --------------------------- Composición --------------------------- */
  function defsMarkup() {
    return Object.keys(S).map(function (k) { return S[k]; }).join('');
  }

  function prop(kind, name, opts) {
    opts = opts || {};
    var style = '--x:' + (opts.x || '0%') + ';--y:' + (opts.y || '0%') +
      ';--w:' + (opts.w || '80px') + ';--i:' + (opts.i || 0);
    if (opts.rot) style += ';--rot:' + opts.rot + 'deg';
    if (opts.op) style += ';--op:' + opts.op;
    var cls = 'bb-prop bb-' + kind + (opts.opt ? ' bb-prop--opt' : '') + (opts.extra ? ' ' + opts.extra : '');
    return '<span class="' + cls + '" style="' + style + '">' +
      '<svg viewBox="' + V[name] + '" aria-hidden="true"><use href="#bb-' + name + '"/></svg></span>';
  }

  function scene(theme) {
    var p = [];
    if (theme === 'navidad') {
      p.push('<div class="bb-ground bb-ground--snow"></div>');
      p.push(prop('tree', 'tree', { x: '2%', y: '-8%', w: '250px', i: 0 }));
      p.push(prop('tree', 'tree', { x: '17%', y: '-19%', w: '150px', i: 2, op: .55, opt: true }));
      p.push(prop('tree', 'tree', { x: '74%', y: '-20%', w: '185px', i: 1, op: .5 }));
      p.push(prop('snowman', 'snowman', { x: '84%', y: '-6%', w: '92px', i: 3 }));
      p.push(prop('gift', 'gift', { x: '31%', y: '-6%', w: '66px', i: 4 }));
      p.push(prop('gift', 'gift', { x: '39%', y: '-3%', w: '48px', i: 5, extra: 'bb-prop--tilt' }));
      p.push(prop('cane', 'cane', { x: '5%', y: '30%', w: '34px', i: 1, extra: 'bb-prop--hang', opt: true }));
      p.push(prop('cane', 'cane', { x: '92%', y: '34%', w: '30px', i: 3, extra: 'bb-prop--hang bb-prop--flip', opt: true }));
      p.push(prop('cookie', 'cookie-star', { x: '26%', y: '13%', w: '44px', i: 0 }));
      p.push(prop('cookie', 'cookie-man', { x: '46%', y: '8%', w: '40px', i: 2 }));
      p.push(prop('cookie', 'cookie-house', { x: '62%', y: '15%', w: '72px', i: 1, opt: true }));
      p.push(prop('cookie', 'cookie-star', { x: '80%', y: '9%', w: '34px', i: 4, opt: true }));
      p.push(prop('bell', 'bell', { x: '12%', y: '9%', w: '34px', i: 2, extra: 'bb-prop--hang' }));
      p.push(prop('bell', 'bell', { x: '56%', y: '5%', w: '28px', i: 4, extra: 'bb-prop--hang' }));
    } else if (theme === 'halloween') {
      p.push('<div class="bb-ground bb-ground--dark"></div>');
      p.push(prop('grave', 'grave', { x: '4%', y: '-7%', w: '76px', i: 0 }));
      p.push(prop('grave', 'grave', { x: '13%', y: '-12%', w: '58px', i: 2, op: .7, opt: true }));
      p.push(prop('pumpkin', 'pumpkin', { x: '27%', y: '-6%', w: '96px', i: 1 }));
      p.push(prop('pumpkin', 'pumpkin', { x: '39%', y: '-3%', w: '58px', i: 3, extra: 'bb-prop--tilt', opt: true }));
      p.push(prop('cauldron', 'cauldron', { x: '69%', y: '-9%', w: '130px', i: 2 }));
      p.push(prop('ghost', 'ghost', { x: '84%', y: '22%', w: '66px', i: 0 }));
      p.push(prop('ghost', 'ghost', { x: '55%', y: '12%', w: '42px', i: 3, op: .5, extra: 'bb-prop--float', opt: true }));
    } else if (theme === 'ano_nuevo') {
      p.push('<div class="bb-ground bb-ground--gold"></div>');
      p.push(prop('glass', 'glass', { x: '9%', y: '-7%', w: '52px', i: 0, extra: 'bb-prop--clink' }));
      p.push(prop('glass', 'glass', { x: '18%', y: '-7%', w: '48px', i: 2, extra: 'bb-prop--clink' }));
      p.push(prop('clock', 'clock', { x: '50%', y: '5%', w: '60px', i: 0, extra: 'bb-prop--hang' }));
      p.push(prop('horn', 'horn', { x: '30%', y: '12%', w: '60px', i: 1, extra: 'bb-prop--tilt' }));
      p.push(prop('horn', 'horn', { x: '80%', y: '16%', w: '52px', i: 3, extra: 'bb-prop--flip', opt: true }));
      p.push(prop('gift', 'gift', { x: '70%', y: '-5%', w: '64px', i: 4, opt: true }));
    } else if (theme === 'san_valentin' || theme === 'dia_madre_padre') {
      var flower = theme === 'san_valentin' ? 'rose' : 'flower';
      p.push(prop('bloom', flower, { x: '6%', y: '-10%', w: '82px', i: 0 }));
      p.push(prop('bloom', flower, { x: '18%', y: '-17%', w: '60px', i: 2, op: .65, extra: 'bb-prop--tilt' }));
      p.push(prop('bloom', flower, { x: '82%', y: '-12%', w: '74px', i: 1, extra: 'bb-prop--flip' }));
      p.push(prop('gift', 'gift', { x: '68%', y: '-4%', w: '58px', i: 3, opt: true }));
      p.push(prop('bloom', flower, { x: '46%', y: '11%', w: '38px', i: 4, opt: true }));
    } else if (theme === 'fiestas_patrias') {
      p.push(prop('empanada', 'empanada', { x: '10%', y: '-5%', w: '96px', i: 0 }));
      p.push(prop('flag', 'flag', { x: '88%', y: '12%', w: '56px', i: 2, extra: 'bb-prop--hang' }));
      p.push(prop('empanada', 'empanada', { x: '30%', y: '-14%', w: '70px', i: 3, op: .65, opt: true }));
      p.push(prop('bag', 'bag', { x: '74%', y: '-6%', w: '70px', i: 1, opt: true }));
    } else if (theme === 'vuelta_clases') {
      p.push(prop('pencil', 'pencil', { x: '6%', y: '18%', w: '92px', i: 0, extra: 'bb-prop--tilt' }));
      p.push(prop('book', 'book', { x: '18%', y: '-6%', w: '82px', i: 1 }));
      p.push(prop('pencil', 'pencil', { x: '80%', y: '14%', w: '84px', i: 2, extra: 'bb-prop--flip', opt: true }));
      p.push(prop('book', 'book', { x: '70%', y: '-7%', w: '66px', i: 3, extra: 'bb-prop--tilt', opt: true }));
    } else if (theme === 'black_friday' || theme === 'cyber_days') {
      p.push(prop('tag', 'tag', { x: '7%', y: '13%', w: '60px', i: 0, extra: 'bb-prop--tilt' }));
      p.push(prop('tag', 'tag', { x: '86%', y: '17%', w: '52px', i: 2, extra: 'bb-prop--flip' }));
      p.push(prop('bag', 'bag', { x: '78%', y: '-6%', w: '84px', i: 1 }));
      p.push(prop('tag', 'tag', { x: '26%', y: '26%', w: '40px', i: 4, opt: true }));
    }
    return '<div class="bb-scene bb-scene--' + theme + '">' + p.join('') + '</div>';
  }

  function garland(theme) {
    var h = '', i;
    if (theme === 'navidad') {
      for (i = 0; i < 4; i++) {
        h += prop('stocking', 'stocking', { x: (12 + i * 25) + '%', y: '0', w: '42px', i: i, extra: 'bb-hanger' });
      }
      h += prop('bell', 'bell', { x: '3%', y: '0', w: '30px', i: 1, extra: 'bb-hanger' });
      h += prop('bell', 'bell', { x: '94%', y: '0', w: '30px', i: 3, extra: 'bb-hanger' });
    } else if (theme === 'halloween') {
      for (i = 0; i < 5; i++) {
        h += prop('pumpkin', 'pumpkin', { x: (8 + i * 21) + '%', y: '0', w: '38px', i: i, extra: 'bb-hanger', opt: i > 2 });
      }
    } else if (theme === 'fiestas_patrias') {
      for (i = 0; i < 5; i++) {
        h += prop('bell', 'bell', { x: (8 + i * 21) + '%', y: '0', w: '28px', i: i, extra: 'bb-hanger' });
      }
    }
    return '<div class="bb-garland__extras">' + h + '</div>';
  }

  window.BBSeasonalArt = { defs: defsMarkup, scene: scene, garland: garland };
})();
