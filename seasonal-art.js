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
    clock: '0 0 80 80', empanada: '0 0 100 70', flag: '0 0 80 60',
    wreath: '0 0 100 100', reindeer: '0 0 140 110', candle: '0 0 50 90', holly: '0 0 60 40',
    sleigh: '0 0 150 96', star: '0 0 40 40',
    shamrock: '0 0 80 80', pot: '0 0 100 80', hat: '0 0 90 70', rainbow: '0 0 200 110',
    shield: '0 0 80 90', laurel: '0 0 100 90', ribbon: '0 0 120 50',
    hammer: '0 0 100 80', gear: '0 0 80 80', medal: '0 0 70 90',
    balloon: '0 0 50 110', bear: '0 0 90 100', kite: '0 0 80 110',
    butterfly: '0 0 80 70', leaf: '0 0 80 90', acorn: '0 0 50 70',
    sun: '0 0 100 100', palm: '0 0 100 90', icecream: '0 0 70 100',
    skull: '0 0 80 90', marigold: '0 0 70 80', chocolate: '0 0 70 60', arrow: '0 0 100 40'
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

  /* --------------------- Detalles navideños extra --------------------- */
  S.wreath =
    '<symbol id="bb-wreath" viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="33" fill="none" stroke="#14532d" stroke-width="17"/>' +
      '<circle cx="50" cy="50" r="33" fill="none" stroke="#16a34a" stroke-width="9" opacity=".75"/>' +
      '<g fill="#15803d">' +
        '<ellipse cx="22" cy="32" rx="12" ry="6.5" transform="rotate(-32 22 32)"/>' +
        '<ellipse cx="50" cy="17" rx="12" ry="6.5" transform="rotate(-8 50 17)"/>' +
        '<ellipse cx="78" cy="32" rx="12" ry="6.5" transform="rotate(32 78 32)"/>' +
        '<ellipse cx="24" cy="70" rx="12" ry="6.5" transform="rotate(28 24 70)"/>' +
        '<ellipse cx="76" cy="70" rx="12" ry="6.5" transform="rotate(-28 76 70)"/>' +
      '</g>' +
      '<g fill="#dc2626"><circle cx="30" cy="28" r="4.2"/><circle cx="68" cy="28" r="4.2"/>' +
        '<circle cx="50" cy="80" r="4"/><circle cx="21" cy="54" r="3.6"/><circle cx="79" cy="54" r="3.6"/></g>' +
      '<path d="M50 84c-11-8-21-4-19 4 2 7 12 7 19 1Z" fill="#b91c1c"/>' +
      '<path d="M50 84c11-8 21-4 19 4-2 7-12 7-19 1Z" fill="#dc2626"/>' +
      '<circle cx="50" cy="87" r="4.2" fill="#fde68a"/>' +
    '</symbol>';

  S.reindeer =
    '<symbol id="bb-reindeer" viewBox="0 0 140 110">' +
      /* Astas: salen de la parte alta de la cabeza y se ramifican hacia arriba */
      '<g fill="none" stroke="#6b4423" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M38 25Q34 12 27 5"/>' +
        '<path d="M34 15Q26 13 21 7M31 9Q26 5 24 1M37 18Q44 12 46 5"/>' +
        '<path d="M45 25Q46 12 53 6M47 15Q55 12 59 7"/>' +
      '</g>' +
      /* Cola: una sola, atrás */
      '<path d="M116 50q11-9 14 1-7 8-14-1Z" fill="#a16a35"/>' +
      /* Patas y pezuñas */
      '<path d="M56 74v30M68 76v28M98 76v28M110 74v30" stroke="#6b4423" stroke-width="7" stroke-linecap="round"/>' +
      '<g fill="#3f2a17">' +
        '<ellipse cx="56" cy="105" rx="5.5" ry="3"/><ellipse cx="68" cy="105" rx="5.5" ry="3"/>' +
        '<ellipse cx="98" cy="105" rx="5.5" ry="3"/><ellipse cx="110" cy="105" rx="5.5" ry="3"/>' +
      '</g>' +
      /* Cuerpo, cuello y oreja */
      '<ellipse cx="84" cy="58" rx="34" ry="22" fill="#8b5a2b"/>' +
      '<path d="M50 58a34 22 0 0 1 68 0Z" fill="#a16a35" opacity=".5"/>' +
      '<path d="M70 50Q58 32 42 28L34 44Q48 52 56 68Z" fill="#8b5a2b"/>' +
      '<path d="M44 27Q52 17 57 23Q51 31 44 27Z" fill="#7c4a21"/>' +
      /* Cabeza, hocico y cara */
      '<ellipse cx="36" cy="33" rx="15" ry="10" transform="rotate(-12 36 33)" fill="#9a6633"/>' +
      '<ellipse cx="23" cy="38" rx="9" ry="6" transform="rotate(-8 23 38)" fill="#c89a63"/>' +
      '<circle cx="17" cy="38" r="8" fill="#fca5a5" opacity=".28"/>' +
      '<circle cx="17" cy="38" r="4" fill="#dc2626"/>' +
      '<circle cx="15.5" cy="36.5" r="1.3" fill="#fca5a5"/>' +
      '<circle cx="34" cy="30" r="2.4" fill="#1c1917"/>' +
      '<circle cx="33.3" cy="29.3" r=".8" fill="#fff"/>' +
      /* Arnés que conecta con el trineo y cascabel */
      '<path d="M52 58Q80 42 136 48" fill="none" stroke="#7c4a21" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M56 62Q68 70 80 62" fill="none" stroke="#b91c1c" stroke-width="4"/>' +
      '<circle cx="68" cy="68" r="3.4" fill="#eab308"/>' +
    '</symbol>';

  S.candle =
    '<symbol id="bb-candle" viewBox="0 0 50 90">' +
      '<ellipse cx="25" cy="84" rx="20" ry="5" fill="rgb(15 23 42 / .18)"/>' +
      '<path d="M14 34h22v46H14Z" fill="#f8fafc"/>' +
      '<path d="M14 34h22v10H14Z" fill="#dc2626"/>' +
      '<path d="M20 46v34M30 46v34" stroke="#fca5a5" stroke-width="3" opacity=".7"/>' +
      '<path d="M25 34c-6-8 0-14 0-20 6 6 10 12 0 20Z" fill="#fde047"/>' +
      '<path d="M25 30c-3-4 0-8 0-11 3 3 5 7 0 11Z" fill="#fb923c"/>' +
      '<ellipse cx="25" cy="82" rx="16" ry="5" fill="#d8b45f"/>' +
    '</symbol>';

  S.holly =
    '<symbol id="bb-holly" viewBox="0 0 60 40">' +
      '<path d="M28 26C14 34 4 26 8 16c8-8 18 0 20 10Z" fill="#166534"/>' +
      '<path d="M32 26c14 8 24 0 20-10-8-8-18 0-20 10Z" fill="#15803d"/>' +
      '<path d="m28 26-6 12m10-12 6 12" stroke="#166534" stroke-width="2"/>' +
      '<circle cx="24" cy="22" r="4" fill="#dc2626"/><circle cx="36" cy="22" r="4" fill="#dc2626"/>' +
      '<circle cx="30" cy="28" r="3.5" fill="#b91c1c"/>' +
    '</symbol>';

  S.sleigh =
    '<symbol id="bb-sleigh" viewBox="0 0 150 96">' +
      '<ellipse cx="76" cy="90" rx="66" ry="6" fill="rgb(15 23 42 / .18)"/>' +
      '<path d="M18 22h100l-8 46H34Z" fill="#9f1239" stroke="#7f1d1d" stroke-width="2"/>' +
      '<path d="M18 22h100l-2 10H20Z" fill="#be123c"/>' +
      '<path d="M34 68h76l-4 8H30Z" fill="#7f1d1d"/>' +
      '<path d="M24 26c-14 6-18 22-8 34 4 5 10 4 12-2-6-10-6-20-4-32Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>' +
      '<path d="M26 76c-16 0-22 8-18 14h112c2-8-8-14-24-14" fill="none" stroke="#b45309" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M104 76c14 0 22 6 20 14" fill="none" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M42 34h56M40 44h60" stroke="#fda4af" stroke-width="2.4" opacity=".7"/>' +
      '<rect x="48" y="48" width="30" height="18" rx="3" fill="#15803d"/>' +
      '<path d="M63 48v18M48 57h30" stroke="#fde68a" stroke-width="4"/>' +
      '<rect x="86" y="46" width="22" height="22" rx="3" fill="#f59e0b"/>' +
      '<path d="M97 46v22M86 57h22" stroke="#fff7ed" stroke-width="3"/>' +
    '</symbol>';

  S.star =
    '<symbol id="bb-star" viewBox="0 0 40 40">' +
      '<path d="M20 1c1 12 6 17 19 19-13 2-18 7-19 19-1-12-6-17-19-19 13-2 18-7 19-19Z" fill="#fff7d6"/>' +
      '<circle cx="20" cy="20" r="2.6" fill="#fde047"/>' +
    '</symbol>';

  /* -------------------- Festividades adicionales -------------------- */
  S.shamrock =
    '<symbol id="bb-shamrock" viewBox="0 0 80 80">' +
      '<path d="M40 76V42" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M40 46C22 50 10 38 15 25c9-11 23-5 25 9Z" fill="#16a34a"/>' +
      '<path d="M40 46c18 4 30-8 25-21-9-11-23-5-25 9Z" fill="#22c55e"/>' +
      '<path d="M40 42C31 27 38 12 49 12c11 5 10 20-9 30Z" fill="#15803d"/>' +
      '<circle cx="27" cy="31" r="2" fill="#bbf7d0"/><circle cx="53" cy="31" r="2" fill="#bbf7d0"/>' +
    '</symbol>';

  S.pot =
    '<symbol id="bb-pot" viewBox="0 0 100 80">' +
      '<ellipse cx="50" cy="74" rx="38" ry="5" fill="rgb(0 0 0 / .25)"/>' +
      '<path d="M14 34h72c0 24-16 38-36 38S14 58 14 34Z" fill="#1c1917"/>' +
      '<ellipse cx="50" cy="34" rx="36" ry="10" fill="#292524"/>' +
      '<ellipse cx="50" cy="37" rx="30" ry="7" fill="#fbbf24"/>' +
      '<g fill="#fde047"><circle cx="38" cy="34" r="3"/><circle cx="52" cy="36" r="3.4"/><circle cx="63" cy="33" r="2.6"/></g>' +
      '<path d="M86 44c11 0 14 9 9 17" fill="none" stroke="#1c1917" stroke-width="5" stroke-linecap="round"/>' +
    '</symbol>';

  S.hat =
    '<symbol id="bb-hat" viewBox="0 0 90 70">' +
      '<ellipse cx="45" cy="63" rx="42" ry="6" fill="#14532d"/>' +
      '<path d="M18 60V27q27-13 54 0v33Z" fill="#16a34a"/>' +
      '<path d="M12 25h66v9H12Z" fill="#15803d"/>' +
      '<rect x="34" y="29" width="22" height="17" rx="2" fill="#facc15"/>' +
      '<rect x="40" y="32" width="10" height="11" rx="1" fill="#14532d"/>' +
    '</symbol>';

  S.rainbow =
    '<symbol id="bb-rainbow" viewBox="0 0 200 110">' +
      '<path d="M12 104a88 88 0 0 1 176 0" fill="none" stroke="#ef4444" stroke-width="10"/>' +
      '<path d="M23 104a77 77 0 0 1 154 0" fill="none" stroke="#fb923c" stroke-width="10"/>' +
      '<path d="M34 104a66 66 0 0 1 132 0" fill="none" stroke="#facc15" stroke-width="10"/>' +
      '<path d="M45 104a55 55 0 0 1 110 0" fill="none" stroke="#4ade80" stroke-width="10"/>' +
      '<path d="M56 104a44 44 0 0 1 88 0" fill="none" stroke="#60a5fa" stroke-width="10"/>' +
    '</symbol>';

  S.shield =
    '<symbol id="bb-shield" viewBox="0 0 80 90">' +
      '<path d="M40 4h36v44c0 18-16 30-36 38C20 78 4 66 4 48V4Z" fill="#dc2626" stroke="#d8b45f" stroke-width="3"/>' +
      '<path d="M40 10v66" stroke="#fff" stroke-width="12" opacity=".92"/>' +
      '<circle cx="40" cy="40" r="9" fill="#fde047"/>' +
      '<path d="m40 28 1.8 4.4 4.7.4-3.6 3 1.2 4.6L40 38l-4.1 2.4 1.2-4.6-3.6-3 4.7-.4Z" fill="#b45309"/>' +
    '</symbol>';

  S.laurel =
    '<symbol id="bb-laurel" viewBox="0 0 100 90">' +
      '<path d="M50 86C20 70 12 40 24 12M50 86c30-16 38-46 26-74" fill="none" stroke="#166534" stroke-width="3"/>' +
      '<g fill="#16a34a">' +
        '<ellipse cx="26" cy="22" rx="10" ry="5" transform="rotate(-35 26 22)"/>' +
        '<ellipse cx="20" cy="38" rx="10" ry="5" transform="rotate(-15 20 38)"/>' +
        '<ellipse cx="22" cy="54" rx="10" ry="5" transform="rotate(15 22 54)"/>' +
        '<ellipse cx="30" cy="68" rx="10" ry="5" transform="rotate(35 30 68)"/>' +
        '<ellipse cx="74" cy="22" rx="10" ry="5" transform="rotate(35 74 22)"/>' +
        '<ellipse cx="80" cy="38" rx="10" ry="5" transform="rotate(15 80 38)"/>' +
        '<ellipse cx="78" cy="54" rx="10" ry="5" transform="rotate(-15 78 54)"/>' +
        '<ellipse cx="70" cy="68" rx="10" ry="5" transform="rotate(-35 70 68)"/>' +
      '</g>' +
      '<circle cx="50" cy="80" r="5" fill="#d8b45f"/>' +
    '</symbol>';

  S.ribbon =
    '<symbol id="bb-ribbon" viewBox="0 0 120 50">' +
      '<path d="m4 25 26-14v28Zm112 0-26-14v28Z" fill="#b91c1c"/>' +
      '<rect x="24" y="8" width="72" height="34" rx="3" fill="#dc2626"/>' +
      '<rect x="24" y="8" width="72" height="11" fill="#fff"/>' +
      '<rect x="24" y="31" width="72" height="11" fill="#fff"/>' +
    '</symbol>';

  S.hammer =
    '<symbol id="bb-hammer" viewBox="0 0 100 80">' +
      '<path d="M16 12h56v22H16Z" fill="#78716c" stroke="#57534e" stroke-width="2"/>' +
      '<path d="M54 34h12v42H54Z" fill="#a16207" stroke="#78350f" stroke-width="2"/>' +
      '<path d="M16 12h10v22H16Z" fill="#a8a29e"/>' +
    '</symbol>';

  S.gear =
    '<symbol id="bb-gear" viewBox="0 0 80 80">' +
      '<g fill="#94a3b8">' +
        '<circle cx="40" cy="40" r="24"/>' +
        '<rect x="35" y="4" width="10" height="14" rx="2"/><rect x="35" y="62" width="10" height="14" rx="2"/>' +
        '<rect x="4" y="35" width="14" height="10" rx="2"/><rect x="62" y="35" width="14" height="10" rx="2"/>' +
        '<rect x="14" y="14" width="14" height="10" rx="2" transform="rotate(45 21 19)"/>' +
        '<rect x="52" y="56" width="14" height="10" rx="2" transform="rotate(45 59 61)"/>' +
      '</g>' +
      '<circle cx="40" cy="40" r="11" fill="#e2e8f0"/>' +
      '<circle cx="40" cy="40" r="5" fill="#94a3b8"/>' +
    '</symbol>';

  S.medal =
    '<symbol id="bb-medal" viewBox="0 0 70 90">' +
      '<path d="M20 6l15 30 15-30" fill="none" stroke="#dc2626" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="35" cy="60" r="22" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>' +
      '<circle cx="35" cy="60" r="15" fill="#fde68a"/>' +
      '<path d="m35 48 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#b45309"/>' +
    '</symbol>';

  S.balloon =
    '<symbol id="bb-balloon" viewBox="0 0 50 110">' +
      '<ellipse cx="25" cy="30" rx="19" ry="25" fill="#f43f5e"/>' +
      '<path d="M25 6c-8 6-10 16-6 24" fill="none" stroke="#fda4af" stroke-width="3" opacity=".7"/>' +
      '<path d="m25 54-5 8h10Z" fill="#be123c"/>' +
      '<path d="M25 62c-3 16 6 22 0 44" fill="none" stroke="#78716c" stroke-width="2"/>' +
    '</symbol>';

  S.bear =
    '<symbol id="bb-bear" viewBox="0 0 90 100">' +
      '<circle cx="24" cy="24" r="13" fill="#a16207"/><circle cx="66" cy="24" r="13" fill="#a16207"/>' +
      '<circle cx="24" cy="24" r="6" fill="#d97706"/><circle cx="66" cy="24" r="6" fill="#d97706"/>' +
      '<circle cx="45" cy="52" r="30" fill="#b45309"/>' +
      '<ellipse cx="45" cy="60" rx="14" ry="11" fill="#f5d0a9"/>' +
      '<circle cx="35" cy="46" r="2.6" fill="#1c1917"/><circle cx="55" cy="46" r="2.6" fill="#1c1917"/>' +
      '<ellipse cx="45" cy="57" rx="4" ry="3" fill="#1c1917"/>' +
      '<path d="M45 60v4m-7 2q7 6 14 0" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>' +
    '</symbol>';

  S.kite =
    '<symbol id="bb-kite" viewBox="0 0 80 110">' +
      '<path d="M40 4 76 40 40 76 4 40Z" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2"/>' +
      '<path d="M40 4v72M4 40h72" stroke="#ddd6fe" stroke-width="2"/>' +
      '<path d="M40 76c-8 14 6 18-2 30" fill="none" stroke="#f59e0b" stroke-width="2"/>' +
      '<path d="m30 84 6 6m14 6 6 6m-24 4 6-6" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>' +
    '</symbol>';

  S.butterfly =
    '<symbol id="bb-butterfly" viewBox="0 0 80 70">' +
      '<ellipse cx="25" cy="24" rx="15" ry="19" transform="rotate(-25 25 24)" fill="#f472b6"/>' +
      '<ellipse cx="55" cy="24" rx="15" ry="19" transform="rotate(25 55 24)" fill="#f9a8d4"/>' +
      '<ellipse cx="28" cy="49" rx="10" ry="12" fill="#fb7185"/>' +
      '<ellipse cx="52" cy="49" rx="10" ry="12" fill="#fda4af"/>' +
      '<path d="M40 18v38" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M40 18c-4-8-10-10-14-8m14 8c4-8 10-10 14-8" fill="none" stroke="#7c2d12" stroke-width="2"/>' +
    '</symbol>';

  S.leaf =
    '<symbol id="bb-leaf" viewBox="0 0 80 90">' +
      '<path d="M40 4 49 25 70 18 59 37 78 49 55 51 60 74 40 62 20 74 25 51 2 49 21 37 10 18 31 25Z" fill="#ea580c"/>' +
      '<path d="M40 62V22" stroke="#9a3412" stroke-width="2"/>' +
    '</symbol>';

  S.acorn =
    '<symbol id="bb-acorn" viewBox="0 0 50 70">' +
      '<path d="M12 30h26v22c0 12-6 18-13 18S12 64 12 52Z" fill="#d97706"/>' +
      '<path d="M6 30h38v9H6Z" fill="#92400e"/>' +
      '<path d="M25 39v27" stroke="#b45309" stroke-width="2"/>' +
      '<path d="M25 4v12" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>' +
    '</symbol>';

  S.sun =
    '<symbol id="bb-sun" viewBox="0 0 100 100">' +
      '<g stroke="#f59e0b" stroke-width="5" stroke-linecap="round">' +
        '<path d="M50 4v12M50 84v12M4 50h12M84 50h12M17 17l9 9M74 74l9 9M83 17l-9 9M26 74l-9 9"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="25" fill="#fde047"/>' +
      '<circle cx="42" cy="45" r="2.5" fill="#92400e"/><circle cx="58" cy="45" r="2.5" fill="#92400e"/>' +
      '<path d="M41 57q9 8 18 0" fill="none" stroke="#92400e" stroke-width="2.5" stroke-linecap="round"/>' +
    '</symbol>';

  S.palm =
    '<symbol id="bb-palm" viewBox="0 0 100 90">' +
      '<path d="M52 88C46 60 48 36 54 18" fill="none" stroke="#a16207" stroke-width="6" stroke-linecap="round"/>' +
      '<g fill="#16a34a">' +
        '<path d="M54 18C36 8 18 12 8 26c20-6 36-4 46-8Z"/>' +
        '<path d="M54 18c18-10 36-6 46 8-20-6-36-4-46-8Z"/>' +
        '<path d="M54 18C34 20 20 32 16 48c16-14 30-20 38-30Z"/>' +
        '<path d="M54 18c20 2 34 14 38 30-16-14-30-20-38-30Z"/>' +
        '<path d="M54 18c-6 18-4 36 2 50 2-18 2-34-2-50Z"/>' +
      '</g>' +
    '</symbol>';

  S.icecream =
    '<symbol id="bb-icecream" viewBox="0 0 70 100">' +
      '<path d="M18 38h34l-9 56H27Z" fill="#e9a23b" stroke="#c2410c" stroke-width="2"/>' +
      '<path d="M24 50h22M22 62h26M20 74h30" stroke="#c2410c" stroke-width="2" opacity=".6"/>' +
      '<circle cx="26" cy="30" r="13" fill="#fda4af"/>' +
      '<circle cx="44" cy="30" r="13" fill="#fbcfe8"/>' +
      '<circle cx="35" cy="19" r="12" fill="#fff7ed"/>' +
      '<circle cx="35" cy="8" r="3" fill="#dc2626"/>' +
    '</symbol>';

  S.skull =
    '<symbol id="bb-skull" viewBox="0 0 80 90">' +
      '<path d="M14 44a26 26 0 0 1 52 0v20H14Z" fill="#f5f5f4"/>' +
      '<path d="M22 64h36v16H22Z" fill="#e7e5e4"/>' +
      '<circle cx="29" cy="44" r="7" fill="#1c1917"/><circle cx="51" cy="44" r="7" fill="#1c1917"/>' +
      '<circle cx="27" cy="42" r="2" fill="#fbbf24"/><circle cx="49" cy="42" r="2" fill="#fbbf24"/>' +
      '<path d="m40 52-5 8h10Z" fill="#78716c"/>' +
      '<path d="M28 64v16M36 64v16M44 64v16M52 64v16" stroke="#a8a29e" stroke-width="2"/>' +
    '</symbol>';

  S.marigold =
    '<symbol id="bb-marigold" viewBox="0 0 70 80">' +
      '<path d="M35 78V42" stroke="#15803d" stroke-width="3"/>' +
      '<g fill="#f97316">' +
        '<ellipse cx="35" cy="12" rx="9" ry="14"/><ellipse cx="35" cy="48" rx="9" ry="14"/>' +
        '<ellipse cx="17" cy="30" rx="14" ry="9"/><ellipse cx="53" cy="30" rx="14" ry="9"/>' +
        '<ellipse cx="22" cy="17" rx="9" ry="13" transform="rotate(-45 22 17)"/>' +
        '<ellipse cx="48" cy="17" rx="9" ry="13" transform="rotate(45 48 17)"/>' +
        '<ellipse cx="22" cy="43" rx="9" ry="13" transform="rotate(45 22 43)"/>' +
        '<ellipse cx="48" cy="43" rx="9" ry="13" transform="rotate(-45 48 43)"/>' +
      '</g>' +
      '<circle cx="35" cy="30" r="10" fill="#fbbf24"/>' +
    '</symbol>';

  S.chocolate =
    '<symbol id="bb-chocolate" viewBox="0 0 70 60">' +
      '<rect x="6" y="10" width="58" height="40" rx="4" fill="#78350f" stroke="#451a03" stroke-width="2"/>' +
      '<g stroke="#92400e" stroke-width="2"><path d="M25 10v40M45 10v40M6 24h58M6 38h58"/></g>' +
      '<path d="M10 14h12v8H10Z" fill="#a16207" opacity=".5"/>' +
    '</symbol>';

  S.arrow =
    '<symbol id="bb-arrow" viewBox="0 0 100 40">' +
      '<path d="M6 20h84" stroke="#b91c1c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="m94 20-14-9v18Z" fill="#dc2626"/>' +
      '<path d="M6 20c-4-9-14-6-6 2 3 3 6 3 8 0" fill="#f472b6"/>' +
    '</symbol>';

  /* --------------------------- Composición --------------------------- */
  function defsMarkup() {
    return Object.keys(S).map(function (k) { return S[k]; }).join('');
  }

  var DEPTH = {
    tree: .3, snowman: .5, gift: .6, cane: .85, cookie: 1.15, bell: .9,
    pumpkin: .55, grave: .35, cauldron: .5, ghost: 1.05, glass: .7,
    horn: .95, bloom: .8, tag: 1, bag: .6, pencil: 1, book: .65,
    clock: .9, empanada: .6, flag: 1, wreath: .8, reindeer: .45,
    candle: .7, holly: 1, sleigh: .4, star: .12,
    shamrock: .8, pot: .55, hat: .85, rainbow: .12,
    shield: .6, laurel: .5, ribbon: .95,
    hammer: .7, gear: .6, medal: .7,
    balloon: 1.1, bear: .6, kite: 1.05,
    butterfly: 1.15, leaf: 1, acorn: .9,
    sun: .15, palm: .5, icecream: .7,
    skull: .6, marigold: .8, chocolate: .9, arrow: 1
  };

  function prop(kind, name, opts) {
    opts = opts || {};
    var style = '--x:' + (opts.x || '0%') + ';--y:' + (opts.y || '0%') +
      ';--w:' + (opts.w || '80px') + ';--i:' + (opts.i || 0) +
      ';--depth:' + (DEPTH[kind] || .7);
    if (opts.op) style += ';--op:' + opts.op;
    var cls = 'bb-prop bb-' + kind + (opts.far ? ' bb-prop--far' : '') +
      (opts.opt ? ' bb-prop--opt' : '') + (opts.extra ? ' ' + opts.extra : '');
    return '<span class="' + cls + '" style="' + style + '">' +
      '<span class="bb-prop__tilt"><span class="bb-prop__in">' +
        '<svg viewBox="' + V[name] + '" aria-hidden="true"><use href="#bb-' + name + '"/></svg>' +
      '</span></span></span>';
  }

  function fairy(x, y, i) {
    return '<span class="bb-fairy" style="--x:' + x + ';--y:' + y + ';--i:' + i + '"></span>';
  }

  /* Cielo estrellado: puntos fijos y deterministas, solo brillo y escala. */
  function stars(n) {
    var xs = [6, 14, 22, 29, 37, 45, 53, 61, 69, 77, 84, 91, 96, 33, 73];
    var ys = [12, 26, 8, 34, 18, 6, 30, 14, 24, 9, 36, 20, 15, 43, 42];
    var h = '<div class="bb-stars">';
    for (var i = 0; i < n; i++) {
      h += '<span class="bb-star" style="--x:' + xs[i % xs.length] + '%;--y:' + ys[i % ys.length] + '%;--i:' + i + '"></span>';
    }
    return h + '</div>';
  }

  /* Árbol principal + luces titilantes ancladas a sus ramas (misma capa de profundidad). */
  function treeCluster() {
    var pts = [
      [50, 7], [31, 25], [69, 23], [18, 43], [43, 39], [80, 46],
      [27, 61], [62, 58], [10, 72], [50, 74], [88, 68], [38, 86]
    ];
    var lights = pts.map(function (p, i) { return fairy(p[0] + '%', p[1] + '%', i); }).join('');
    return '<span class="bb-tree-cluster">' +
      prop('tree', 'tree', { x: '50%', y: '0%', w: '250px', i: 0 }) + lights +
      '</span>';
  }

  function scene(theme) {
    var p = [];
    if (theme === 'navidad') {
      p.push('<div class="bb-ground bb-ground--snow"></div>');
      p.push(stars(15));
      p.push(treeCluster());
      p.push(prop('tree', 'tree', { x: '17%', y: '-19%', w: '150px', i: 2, op: .5, far: true, opt: true }));
      p.push(prop('tree', 'tree', { x: '74%', y: '-20%', w: '185px', i: 1, op: .48, far: true }));
      p.push(prop('snowman', 'snowman', { x: '84%', y: '-6%', w: '92px', i: 3 }));
      p.push(prop('gift', 'gift', { x: '31%', y: '-6%', w: '66px', i: 4 }));
      p.push(prop('gift', 'gift', { x: '39%', y: '-3%', w: '48px', i: 5, extra: 'bb-prop--tilt' }));
      p.push(prop('cane', 'cane', { x: '5%', y: '30%', w: '34px', i: 1, extra: 'bb-prop--hang', opt: true }));
      p.push(prop('cane', 'cane', { x: '92%', y: '34%', w: '30px', i: 3, extra: 'bb-prop--hang bb-prop--flip', opt: true }));
      p.push(prop('cookie', 'cookie-star', { x: '26%', y: '13%', w: '44px', i: 0 }));
      p.push(prop('cookie', 'cookie-man', { x: '46%', y: '8%', w: '40px', i: 2 }));
      p.push(prop('cookie', 'cookie-house', { x: '62%', y: '15%', w: '72px', i: 1, opt: true }));
      p.push(prop('cookie', 'cookie-star', { x: '80%', y: '9%', w: '34px', i: 4, opt: true }));
      p.push(prop('sleigh', 'sleigh', { x: '69%', y: '-3%', w: '124px', i: 1, op: .92 }));
      p.push(prop('reindeer', 'reindeer', { x: '56%', y: '-4%', w: '112px', i: 2, op: .9 }));
      p.push(prop('candle', 'candle', { x: '43%', y: '-3%', w: '40px', i: 5 }));
      p.push(prop('candle', 'candle', { x: '48%', y: '-2%', w: '32px', i: 6, opt: true }));
      p.push(prop('bell', 'bell', { x: '12%', y: '9%', w: '34px', i: 2, extra: 'bb-prop--hang' }));
      p.push(prop('bell', 'bell', { x: '56%', y: '5%', w: '28px', i: 4, extra: 'bb-prop--hang' }));
      p.push('<div class="bb-snow-crest"></div>');
    } else if (theme === 'halloween') {
      p.push('<div class="bb-ground bb-ground--dark"></div>');
      p.push(prop('grave', 'grave', { x: '4%', y: '-7%', w: '76px', i: 0 }));
      p.push(prop('grave', 'grave', { x: '13%', y: '-12%', w: '58px', i: 2, op: .62, far: true, opt: true }));
      p.push(prop('pumpkin', 'pumpkin', { x: '27%', y: '-6%', w: '96px', i: 1 }));
      p.push(prop('pumpkin', 'pumpkin', { x: '39%', y: '-3%', w: '58px', i: 3, extra: 'bb-prop--tilt', opt: true }));
      p.push(prop('cauldron', 'cauldron', { x: '69%', y: '-9%', w: '130px', i: 2 }));
      p.push(prop('ghost', 'ghost', { x: '84%', y: '22%', w: '66px', i: 0 }));
      p.push(prop('ghost', 'ghost', { x: '55%', y: '12%', w: '42px', i: 3, op: .45, far: true, extra: 'bb-prop--float', opt: true }));
    } else if (theme === 'ano_nuevo') {
      p.push('<div class="bb-ground bb-ground--gold"></div>');
      p.push(stars(12));
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
      if (theme === 'san_valentin') {
        p.push(prop('arrow', 'arrow', { x: '28%', y: '20%', w: '88px', i: 1, extra: 'bb-prop--tilt' }));
        p.push(prop('chocolate', 'chocolate', { x: '58%', y: '-4%', w: '56px', i: 2 }));
      }
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
    } else if (theme === 'san_patricio') {
      p.push(prop('rainbow', 'rainbow', { x: '50%', y: '-2%', w: '300px', i: 0, op: .55, far: true }));
      p.push(prop('pot', 'pot', { x: '18%', y: '-5%', w: '110px', i: 1 }));
      p.push(prop('hat', 'hat', { x: '80%', y: '-5%', w: '88px', i: 2 }));
      p.push(prop('shamrock', 'shamrock', { x: '34%', y: '12%', w: '54px', i: 3 }));
      p.push(prop('shamrock', 'shamrock', { x: '64%', y: '16%', w: '44px', i: 4, extra: 'bb-prop--tilt', opt: true }));
      p.push(prop('shamrock', 'shamrock', { x: '8%', y: '20%', w: '38px', i: 5, opt: true }));
    } else if (theme === 'dia_de_la_bandera') {
      p.push(prop('laurel', 'laurel', { x: '8%', y: '-6%', w: '110px', i: 0, far: true }));
      p.push(prop('laurel', 'laurel', { x: '92%', y: '-6%', w: '110px', i: 1, far: true, extra: 'bb-prop--flip' }));
      p.push(prop('shield', 'shield', { x: '50%', y: '-4%', w: '96px', i: 2 }));
      p.push(prop('ribbon', 'ribbon', { x: '50%', y: '12%', w: '150px', i: 3 }));
      p.push(prop('flag', 'flag', { x: '24%', y: '14%', w: '54px', i: 4, extra: 'bb-prop--hang' }));
      p.push(prop('flag', 'flag', { x: '76%', y: '14%', w: '54px', i: 5, extra: 'bb-prop--hang' }));
    } else if (theme === 'dia_del_trabajo') {
      p.push(prop('gear', 'gear', { x: '10%', y: '-8%', w: '96px', i: 0, op: .6, far: true }));
      p.push(prop('gear', 'gear', { x: '88%', y: '-12%', w: '70px', i: 2, op: .45, far: true }));
      p.push(prop('hammer', 'hammer', { x: '32%', y: '-4%', w: '90px', i: 1, extra: 'bb-prop--tilt' }));
      p.push(prop('hammer', 'hammer', { x: '64%', y: '-4%', w: '90px', i: 3, extra: 'bb-prop--flip bb-prop--tilt', opt: true }));
      p.push(prop('medal', 'medal', { x: '50%', y: '4%', w: '72px', i: 4, extra: 'bb-prop--hang' }));
    } else if (theme === 'dia_del_nino') {
      p.push(prop('balloon', 'balloon', { x: '12%', y: '3%', w: '56px', i: 0, extra: 'bb-prop--float' }));
      p.push(prop('balloon', 'balloon', { x: '24%', y: '10%', w: '46px', i: 2, extra: 'bb-prop--float' }));
      p.push(prop('balloon', 'balloon', { x: '86%', y: '4%', w: '52px', i: 3, extra: 'bb-prop--float' }));
      p.push(prop('bear', 'bear', { x: '50%', y: '-6%', w: '96px', i: 1 }));
      p.push(prop('kite', 'kite', { x: '72%', y: '14%', w: '58px', i: 4, extra: 'bb-prop--tilt', opt: true }));
    } else if (theme === 'primavera') {
      p.push(prop('flower', 'flower', { x: '10%', y: '-8%', w: '86px', i: 0 }));
      p.push(prop('flower', 'flower', { x: '84%', y: '-10%', w: '74px', i: 2, extra: 'bb-prop--flip' }));
      p.push(prop('flower', 'flower', { x: '28%', y: '-14%', w: '58px', i: 3, op: .7, far: true, opt: true }));
      p.push(prop('butterfly', 'butterfly', { x: '46%', y: '16%', w: '62px', i: 1, extra: 'bb-prop--float' }));
      p.push(prop('butterfly', 'butterfly', { x: '66%', y: '24%', w: '44px', i: 4, extra: 'bb-prop--float', opt: true }));
    } else if (theme === 'verano') {
      p.push(prop('sun', 'sun', { x: '78%', y: '8%', w: '120px', i: 0, extra: 'bb-prop--sun' }));
      p.push(prop('palm', 'palm', { x: '10%', y: '-8%', w: '130px', i: 1, far: true }));
      p.push(prop('palm', 'palm', { x: '92%', y: '-10%', w: '96px', i: 2, far: true, extra: 'bb-prop--flip', opt: true }));
      p.push(prop('icecream', 'icecream', { x: '42%', y: '-5%', w: '70px', i: 3 }));
    } else if (theme === 'otonio') {
      p.push(prop('leaf', 'leaf', { x: '10%', y: '10%', w: '62px', i: 0, extra: 'bb-prop--float' }));
      p.push(prop('leaf', 'leaf', { x: '30%', y: '-6%', w: '78px', i: 2, extra: 'bb-prop--tilt' }));
      p.push(prop('leaf', 'leaf', { x: '78%', y: '14%', w: '58px', i: 3, extra: 'bb-prop--float' }));
      p.push(prop('acorn', 'acorn', { x: '60%', y: '-4%', w: '48px', i: 4 }));
      p.push(prop('acorn', 'acorn', { x: '88%', y: '-3%', w: '38px', i: 1, opt: true }));
    } else if (theme === 'dia_de_muertos') {
      p.push(prop('marigold', 'marigold', { x: '8%', y: '-6%', w: '80px', i: 0 }));
      p.push(prop('marigold', 'marigold', { x: '90%', y: '-8%', w: '72px', i: 2, extra: 'bb-prop--flip' }));
      p.push(prop('skull', 'skull', { x: '50%', y: '-4%', w: '94px', i: 1 }));
      p.push(prop('candle', 'candle', { x: '34%', y: '-3%', w: '44px', i: 3, opt: true }));
      p.push(prop('candle', 'candle', { x: '66%', y: '-3%', w: '44px', i: 4, opt: true }));
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
      h += prop('wreath', 'wreath', { x: '50%', y: '0', w: '48px', i: 0, extra: 'bb-hanger', opt: true });
      h += prop('holly', 'holly', { x: '27%', y: '0', w: '30px', i: 2, extra: 'bb-hanger', opt: true });
      h += prop('holly', 'holly', { x: '73%', y: '0', w: '30px', i: 4, extra: 'bb-hanger', opt: true });
    } else if (theme === 'halloween') {
      for (i = 0; i < 5; i++) {
        h += prop('pumpkin', 'pumpkin', { x: (8 + i * 21) + '%', y: '0', w: '38px', i: i, extra: 'bb-hanger', opt: i > 2 });
      }
    } else if (theme === 'fiestas_patrias' || theme === 'dia_de_la_bandera') {
      for (i = 0; i < 5; i++) {
        h += prop('flag', 'flag', { x: (8 + i * 21) + '%', y: '0', w: '30px', i: i, extra: 'bb-hanger' });
      }
    } else if (theme === 'san_patricio') {
      for (i = 0; i < 5; i++) {
        h += prop('shamrock', 'shamrock', { x: (8 + i * 21) + '%', y: '0', w: '32px', i: i, extra: 'bb-hanger', opt: i > 2 });
      }
    } else if (theme === 'dia_del_nino') {
      for (i = 0; i < 4; i++) {
        h += prop('balloon', 'balloon', { x: (14 + i * 24) + '%', y: '0', w: '30px', i: i, extra: 'bb-hanger' });
      }
    } else if (theme === 'primavera' || theme === 'dia_madre_padre') {
      for (i = 0; i < 5; i++) {
        h += prop('flower', 'flower', { x: (8 + i * 21) + '%', y: '0', w: '30px', i: i, extra: 'bb-hanger' });
      }
    } else if (theme === 'otonio') {
      for (i = 0; i < 5; i++) {
        h += prop('leaf', 'leaf', { x: (8 + i * 21) + '%', y: '0', w: '30px', i: i, extra: 'bb-hanger', opt: i > 2 });
      }
    } else if (theme === 'dia_de_muertos') {
      for (i = 0; i < 5; i++) {
        h += prop('marigold', 'marigold', { x: (8 + i * 21) + '%', y: '0', w: '30px', i: i, extra: 'bb-hanger' });
      }
    }
    return '<div class="bb-garland__extras">' + h + '</div>';
  }

  window.BBSeasonalArt = { defs: defsMarkup, scene: scene, garland: garland };
})();
