/* ============================================================
   AVTOKVEST 40 — brand identity generator
   Emits fully vector-outlined SVG assets (no font dependency).
   Run:  node tools/build.js   then  bash tools/render.sh
   ============================================================ */
const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const H = process.env.HOME + '/Library/Fonts/';

/* ---------------- fonts ---------------- */
const FONTS = {
  uniXB: path.join(ROOT, 'tools/fonts/Unbounded-ExtraBold.ttf'),
  uniB: path.join(ROOT, 'tools/fonts/Unbounded-Bold.ttf'),
  uniM: path.join(ROOT, 'tools/fonts/Unbounded-Medium.ttf'),
  textReg: H + 'Golos-Text_Regular.ttf',
  textMed: H + 'Golos-Text_Medium.ttf',
  textDemi: H + 'Golos-Text_DemiBold.ttf',
  textBold: H + 'Golos-Text_Bold.ttf',
};
const _cache = {};
const ff = (k) => (_cache[k] ? _cache[k] : (_cache[k] = opentype.loadSync(FONTS[k])));

/* ---------------- palette ---------------- */
const C = {
  night: '#0A0F26',
  ink: '#05081A',
  night2: '#141C42',
  night3: '#243070',
  volt: '#C6FF3D',
  voltDeep: '#9BE000',
  cyan: '#25E3D4',
  pink: '#FF3D7F',
  amber: '#FFC24B',
  paper: '#F5F7FF',
  fog: '#9AA6CC',
  fogDark: '#5C6790',
  white: '#FFFFFF',
};

const r = (n) => Math.round(n * 100) / 100;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------- text -> outlined path ---------------- */
function textAt(fontKey, text, opts = {}) {
  const { x = 0, y = 0, size = 72, tracking = 0, kerning = true } = opts;
  const font = ff(fontKey);
  const scale = size / font.unitsPerEm;
  const chars = [...text];
  let pen = x;
  let prev = null;
  const parts = [];
  for (const ch of chars) {
    if (ch === ' ') {
      pen += (font.charToGlyph(' ').advanceWidth || 0) * scale + tracking;
      prev = null;
      continue;
    }
    const g = font.charToGlyph(ch);
    if (prev && kerning && font.getKerningValue) pen += (font.getKerningValue(prev, g) || 0) * scale;
    parts.push(g.getPath(pen, y, size));
    pen += (g.advanceWidth || 0) * scale + tracking;
    prev = g;
  }
  const width = pen - x - (chars.length ? tracking : 0);
  let bbox = null;
  for (const p of parts) {
    if (p.commands && p.commands.length) {
      const b = p.getBoundingBox();
      bbox = bbox
        ? { x1: Math.min(bbox.x1, b.x1), y1: Math.min(bbox.y1, b.y1), x2: Math.max(bbox.x2, b.x2), y2: Math.max(bbox.y2, b.y2) }
        : { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
    }
  }
  return { d: parts.map((p) => p.toPathData(2)).join(' '), width, bbox };
}
function textCentered(fontKey, text, { cx, cy, size, tracking = 0, kerning = true } = {}) {
  const m = textAt(fontKey, text, { size, tracking, kerning });
  if (!m.bbox) return m;
  return textAt(fontKey, text, {
    x: cx - (m.bbox.x1 + m.bbox.x2) / 2,
    y: cy - (m.bbox.y1 + m.bbox.y2) / 2,
    size, tracking, kerning,
  });
}
function textLeft(fontKey, text, { left, cy, size, tracking = 0, kerning = true } = {}) {
  const m = textAt(fontKey, text, { size, tracking, kerning });
  if (!m.bbox) return m;
  return textAt(fontKey, text, { x: left - m.bbox.x1, y: cy - (m.bbox.y1 + m.bbox.y2) / 2, size, tracking, kerning });
}

/* ---------------- pin geometry (deterministic) ---------------- */
function pinPath(R, cx, cy, d, segs = 110) {
  const L = Math.sqrt(d * d - R * R);
  const px = (R * L) / d;
  const py = (R * R) / d;
  const p1 = [cx - px, cy + py];
  const p2 = [cx + px, cy + py];
  const tip = [cx, cy + d];
  const phi1 = Math.atan2(py, -px);
  const phi2 = Math.atan2(py, px);
  const end = phi2 + Math.PI * 2;
  let s = `M${r(p1[0])} ${r(p1[1])}`;
  for (let i = 1; i <= segs; i++) {
    const phi = phi1 + ((end - phi1) * i) / segs;
    s += `L${r(cx + R * Math.cos(phi))} ${r(cy + R * Math.sin(phi))}`;
  }
  s += `L${r(tip[0])} ${r(tip[1])}Z`;
  return s;
}
const PIN = { R: 34, cx: 50, cy: 39, d: 59, numSize: 45, numCy: 42 };
function pin40() {
  const outline = pinPath(PIN.R, PIN.cx, PIN.cy, PIN.d);
  const num = textCentered('textBold', '40', { cx: PIN.cx, cy: PIN.numCy, size: PIN.numSize + 7, tracking: -1 });
  return outline + ' ' + num.d;
}
function pinPlain() {
  return pinPath(PIN.R, PIN.cx, PIN.cy, PIN.d);
}

/* ---------------- compass icon (concept B) ---------------- */
function compassIcon({ mono = null } = {}) {
  const ring = mono || C.volt;
  const dash = mono || C.cyan;
  const tip = mono || C.volt;
  const base = mono || C.cyan;
  const hub = mono || C.night;
  return `
  <circle cx="50" cy="50" r="40" fill="none" stroke="${ring}" stroke-width="9"/>
  <circle cx="50" cy="50" r="26" fill="none" stroke="${dash}" stroke-width="3" stroke-dasharray="1 12" stroke-linecap="round"/>
  <path d="M71.2 28.8 L56.4 56.4 L43.6 43.6 Z" fill="${tip}"/>
  <path d="M56.4 56.4 L28.8 71.2 L43.6 43.6 Z" fill="${base}"/>
  <circle cx="50" cy="50" r="4.5" fill="${hub}"/>`;
}

/* ---------------- shared icon helpers ---------------- */
function rrPath(x, y, w, h, rad) {
  return `M${r(x + rad)} ${r(y)}H${r(x + w - rad)}A${r(rad)} ${r(rad)} 0 0 1 ${r(x + w)} ${r(y + rad)}V${r(y + h - rad)}A${r(rad)} ${r(rad)} 0 0 1 ${r(x + w - rad)} ${r(y + h)}H${r(x + rad)}A${r(rad)} ${r(rad)} 0 0 1 ${r(x)} ${r(y + h - rad)}V${r(y + rad)}A${r(rad)} ${r(rad)} 0 0 1 ${r(x + rad)} ${r(y)}Z`;
}
// combined evenodd path: rounded plate + cut-of text numbers
function plateCut({ x = 33, y = 37, w = 34, h = 26, r = 7, cx = 50, cy = 50, numSize = 16, cutColor = C.night, fill = 'url(#gMark)' } = {}) {
  const num = textCentered('uniXB', '40', { cx, cy: cy + h * 0.03, size: numSize, tracking: -1 });
  return `<path d="${rrPath(x, y, w, h, r)} ${num.d}" fill-rule="evenodd" fill="${fill}"/>`;
}
// just the «40» glyph path, centered
function numCut(cx, cy, size) {
  return textCentered('uniXB', '40', { cx, cy: cy + size * 0.02, size, tracking: -1 }).d;
}

/* ---------------- wheel icon (concept C) ---------------- */
function wheelIcon({ mono = null } = {}) {
  const rim = mono || C.volt;
  const dash = mono || C.cyan;
  const spoke = mono || C.volt;
  const num = textCentered('uniXB', '40', { cx: 50, cy: 50 + 26 * 0.03, size: 16, tracking: -1 });
  const plate = `<path d="${rrPath(33, 37, 34, 26, 7)} ${num.d}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  return `
  <circle cx="50" cy="50" r="40" fill="none" stroke="${rim}" stroke-width="10"/>
  <circle cx="50" cy="50" r="33" fill="none" stroke="${dash}" stroke-opacity="${mono ? 0.9 : 0.6}" stroke-width="2.5" stroke-dasharray="2 14" stroke-linecap="round"/>
  <line x1="50" y1="35" x2="50" y2="12" stroke="${spoke}" stroke-width="9" stroke-linecap="round"/>
  <line x1="39" y1="61" x2="17" y2="68" stroke="${spoke}" stroke-width="9" stroke-linecap="round"/>
  <line x1="61" y1="61" x2="83" y2="68" stroke="${spoke}" stroke-width="9" stroke-linecap="round"/>
  ${plate}`;
}

/* ---------------- finish-flag icon (concept D) ---------------- */
function flagIcon({ mono = null } = {}) {
  if (mono) {
    const flag = `<path d="${rrPath(52, 14, 42, 56, 6)} ${checkerCuts()}" fill-rule="evenodd" fill="${mono}"/>`;
    return `
  <line x1="49" y1="10" x2="34" y2="88" stroke="${mono}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="49" cy="10" r="3.5" fill="${mono}"/>
  ${flag}`;
  }
  const flag = `<path d="${rrPath(52, 14, 42, 56, 6)} ${checkerCuts()}" fill-rule="evenodd" fill="url(#gMark)"/>`;
  return `
  <line x1="49" y1="10" x2="34" y2="88" stroke="${C.volt}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="49" cy="10" r="3.5" fill="${C.cyan}"/>
  ${flag}`;
}
function checkerCuts() {
  const num = textCentered('uniXB', '40', { cx: 73, cy: 52, size: 24, tracking: -1 });
  let cells = '';
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 4; i++)
      if ((i + j) % 2 === 0) cells += `M${56 + i * 8} ${18 + j * 8}h8v8h-8z `;
  return cells + num.d;
}

/* ---------------- gauge icon (concept E) ---------------- */
function gaugeIcon({ mono = null } = {}) {
  const arc = mono || C.volt;
  const dash = mono || C.cyan;
  const numD = textCentered('uniXB', '40', { cx: 50, cy: 60, size: 26, tracking: -2 }).d;
  const numColor = mono || C.volt;
  const hub = mono ? null : C.night;
  return `
  <path d="M12 72A38 38 0 0 1 88 72" fill="none" stroke="${arc}" stroke-width="10" stroke-linecap="round"/>
  <path d="M21 72A29 29 0 0 1 79 72" fill="none" stroke="${dash}" stroke-opacity="${mono ? 0.9 : 0.55}" stroke-width="2.5" stroke-dasharray="2 14" stroke-linecap="round"/>
  <path d="${numD}" fill="${numColor}"/>
  <line x1="50" y1="72" x2="37" y2="50" stroke="${arc}" stroke-width="6" stroke-linecap="round"/>
  ${hub ? `<circle cx="50" cy="72" r="8" fill="${hub}" stroke="${arc}" stroke-width="3.5"/>` : `<circle cx="50" cy="72" r="8" fill="#00000000" stroke="${arc}" stroke-width="3.5"/>`}`;
}

/* ---------------- Е·Фара (свет фар) ---------------- */
function headlightIcon({ mono = null } = {}) {
  const num = numCut(50, 50, 17);
  const fill = mono || 'url(#gMark)';
  return `
  <g transform="rotate(-14 50 50)">
    <path d="${rrPath(20, 31, 60, 38, 12)} ${num}" fill-rule="evenodd" fill="${fill}"/>
  </g>
  <path d="M83 42 L97 37 M84 50 L99 50 M83 58 L97 63" stroke="${mono || C.volt}" stroke-width="4.5" stroke-linecap="round"/>`;
}

/* ---------------- Ж·Навигатор (экран с маршрутом) ---------------- */
function navIcon({ mono = null } = {}) {
  const num = numCut(62, 35, 13);
  const plate = `<path d="${rrPath(47, 22, 30, 26, 6)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  return `
  <rect x="14" y="14" width="72" height="72" rx="16" fill="${mono || '#111A3E'}" stroke="${mono || C.volt}" stroke-width="5"/>
  <path d="M30 68 C42 62 38 46 53 36" fill="none" stroke="${mono || C.cyan}" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round"/>
  <circle cx="30" cy="68" r="4.5" fill="${mono || C.volt}"/>
  ${plate}
  <circle cx="26" cy="78" r="2.5" fill="${mono || C.cyan}"/>
  <circle cx="76" cy="24" r="2.5" fill="${mono || C.cyan}"/>`;
}

/* ---------------- З·Радар (поиск цели) ---------------- */
function radarIcon({ mono = null } = {}) {
  const num = numCut(50, 50, 14);
  const plate = `<path d="${rrPath(35, 39, 30, 22, 6)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  return `
  <circle cx="50" cy="50" r="39" fill="none" stroke="${mono || C.volt}" stroke-width="7"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="${mono || C.cyan}" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="1 10" stroke-linecap="round"/>
  <line x1="50" y1="50" x2="23" y2="23" stroke="${mono || C.volt}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="27" cy="27" r="4.5" fill="${mono || C.amber}"/>
  ${plate}`;
}

/* ---------------- И·Старт (кнопка «Пуск») ---------------- */
function startIcon({ mono = null } = {}) {
  const num = numCut(66, 50, 15);
  const tri = 'M46 42 L54 50 L46 58 Z';
  return `
  <path d="${rrPath(12, 38, 72, 24, 12)} M46 42 L54 50 L46 58 Z ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>
  <circle cx="20" cy="30" r="4" fill="${mono || C.rose}"/>`;
}

/* ---------------- К·Город (ночная вывеска «40») ---------------- */
function cityIcon({ mono = null } = {}) {
  const num = numCut(50, 30, 16);
  const sign = `<path d="${rrPath(33, 20, 34, 22, 7)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  const win = mono ? '' : '<circle cx="25" cy="68" r="2" fill="#25E3D4"/><circle cx="44" cy="76" r="2" fill="#25E3D4"/><circle cx="61" cy="64" r="2" fill="#25E3D4"/><circle cx="72" cy="80" r="2" fill="#25E3D4"/>';
  return `
  ${sign}
  <path d="M12 92 L12 60 H28 L28 82 H44 V62 H58 V86 H78 V74 H88 V92 Z" fill="${mono || C.night}" stroke="${mono || C.volt}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="80" cy="27" r="9" fill="${mono || C.fog}" fill-opacity="0.9"/>
  ${win}`;
}

/* ---------------- Л·Молния (скорость) ---------------- */
function boltIcon({ mono = null } = {}) {
  const num = numCut(49, 54, 17);
  const bolt = 'M58 12 L26 52 L46 48 L36 92 L80 42 L60 46 Z';
  return `
  <path d="${bolt} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
}

/* ---------------- М·Мишень (цель) ---------------- */
function targetIcon({ mono = null } = {}) {
  const num = numCut(50, 50, 13);
  const plate = `<path d="${rrPath(37, 39, 26, 22, 6)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  const cross = mono ? '' : '<path d="M9 42 H17 M83 42 H91 M50 9 V17 M50 83 V91" stroke="#25E3D4" stroke-width="3" stroke-linecap="round"/>';
  return `
  <circle cx="50" cy="50" r="42" fill="none" stroke="${mono || C.volt}" stroke-width="4.5"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="${mono || C.cyan}" stroke-width="3" stroke-dasharray="1 10" stroke-linecap="round" stroke-opacity="0.7"/>
  <circle cx="50" cy="50" r="19" fill="none" stroke="${mono || C.fog}" stroke-width="2.5"/>
  ${cross}
  ${plate}`;
}

/* ---------------- Н·Топливо (капля) ---------------- */
function fuelIcon({ mono = null } = {}) {
  const num = numCut(50, 60, 17);
  const drop = 'M50 10 C56 34 79 48 79 64 A29 29 0 0 1 21 64 C21 48 44 34 50 10 Z';
  return `
  <path d="${drop} ${num}" fill-rule="evenodd" fill="${mono || C.amber}"/>
  <circle cx="37" cy="66" r="3" fill="${mono || C.night}" fill-opacity="0.3"/>`;
}

/* ---------------- О·Шестерня (механика) ---------------- */
function gearIcon({ mono = null } = {}) {
  const teeth = [];
  for (let i = 0; i < 8; i++) teeth.push(`<rect x="46" y="8" width="8" height="16" rx="3" fill="${mono || C.volt}" transform="rotate(${i * 45} 50 50)"/>`);
  const num = numCut(50, 50, 14);
  const hub = `<path d="${rrPath(34, 37, 32, 26, 7)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  return `${teeth.join('\n  ')}
  <circle cx="50" cy="50" r="34" fill="${mono || C.night}" stroke="${mono || C.volt}" stroke-width="6"/>
  ${hub}`;
}

/* ---------------- П·Скорость (динамические полосы) ---------------- */
function speedIcon({ mono = null } = {}) {
  const num = numCut(52, 52, 16);
  const plate = `<path d="${rrPath(35, 39, 34, 26, 7)} ${num}" fill-rule="evenodd" fill="${mono || 'url(#gMark)'}"/>`;
  return `
  <path d="M14 84 L34 84 L60 34 L40 34 Z" fill="${mono || C.volt}"/>
  <path d="M38 84 L58 84 L84 34 L64 34 Z" fill="${mono || C.cyan}"/>
  <path d="M62 84 L82 84 L98 50 L78 50 Z" fill="${mono || C.night}"/>
  ${plate}`;
}

/* ---------------- defs ---------------- */
function defsMark() {
  return `<defs><linearGradient id="gMark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.volt}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient></defs>`;
}
function defsBase() {
  return `<defs>
  <linearGradient id="gNight" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#05081A"/><stop offset="0.6" stop-color="#0A0F26"/><stop offset="1" stop-color="#141C42"/>
  </linearGradient>
  <radialGradient id="gGlow" cx="0.5" cy="0.30" r="0.85">
    <stop offset="0" stop-color="#2A3A86" stop-opacity="0.85"/><stop offset="1" stop-color="#070B1C" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gBeam" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${C.volt}" stop-opacity="0.16"/><stop offset="1" stop-color="${C.volt}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="gBeam2" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${C.cyan}" stop-opacity="0.16"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/>
  </linearGradient>
  <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" fill-opacity="0.05"/>
  </pattern>
  <linearGradient id="gMark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.volt}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
</defs>`;
}

/* ---------------- icon dispatcher ---------------- */
const COLOR_ICONS = ['compass', 'wheel', 'flag', 'gauge', 'headlight', 'nav', 'radar', 'start', 'city', 'bolt', 'target', 'fuel', 'gear', 'speed'];
function iconBlock(icon, { mono = false } = {}) {
  if (icon === 'pin') return `<path d="${pin40()}" fill-rule="evenodd" fill="url(#gMark)"/>`;
  if (icon === 'compass') return compassIcon({ mono: mono ? '#fff' : null });
  if (icon === 'wheel') return wheelIcon({ mono: mono ? '#fff' : null });
  if (icon === 'flag') return flagIcon({ mono: mono ? '#fff' : null });
  if (icon === 'gauge') return gaugeIcon({ mono: mono ? '#fff' : null });
  if (icon === 'headlight') return headlightIcon({ mono: mono ? '#fff' : null });
  if (icon === 'nav') return navIcon({ mono: mono ? '#fff' : null });
  if (icon === 'radar') return radarIcon({ mono: mono ? '#fff' : null });
  if (icon === 'start') return startIcon({ mono: mono ? '#fff' : null });
  if (icon === 'city') return cityIcon({ mono: mono ? '#fff' : null });
  if (icon === 'bolt') return boltIcon({ mono: mono ? '#fff' : null });
  if (icon === 'target') return targetIcon({ mono: mono ? '#fff' : null });
  if (icon === 'fuel') return fuelIcon({ mono: mono ? '#fff' : null });
  if (icon === 'gear') return gearIcon({ mono: mono ? '#fff' : null });
  if (icon === 'speed') return speedIcon({ mono: mono ? '#fff' : null });
  return compassIcon();
}

/* ---------------- lockup (centered) ---------------- */
function lockup({ cx, cy, iconBox, dark = true, icon = null, plate = true }) {
  const wordColor = dark ? C.white : C.night;
  const subColor = dark ? C.fog : C.fogDark;
  const plateBg = dark ? C.volt : C.night;
  const plateFg = dark ? C.night : C.volt;

  const hasIcon = !!icon;
  const s = iconBox / 100;
  const wordSize = iconBox * (hasIcon ? 0.63 : 0.78);
  const gap1 = hasIcon ? iconBox * 0.24 : 0;
  const gap2 = iconBox * 0.2;
  const plateH = iconBox * (hasIcon ? 0.6 : 0.66);
  const numSize = iconBox * (hasIcon ? 0.48 : 0.52);

  const word = textAt('uniXB', 'АВТОКВЕСТ', { size: wordSize, tracking: wordSize * 0.01 });
  const wordW = word.bbox.x2 - word.bbox.x1;
  const num = textAt('uniXB', '40', { size: numSize, tracking: -1 });
  const numW = num.bbox.x2 - num.bbox.x1;
  const plateW = numW + plateH * 0.62;
  const gap2Used = plate ? gap2 : 0;

  const iconW = hasIcon ? iconBox + gap1 : 0;
  const totalW = iconW + wordW + gap2Used + (plate ? plateW : 0);
  const left = cx - totalW / 2;

  const wordX = left + iconW;
  const wordPath = textLeft('uniXB', 'АВТОКВЕСТ', { left: wordX, cy, size: wordSize, tracking: wordSize * 0.01 });
  const plateX = wordX + wordW + gap2;
  const plateY = cy - plateH / 2;
  const numPath = textCentered('uniXB', '40', { cx: plateX + plateW / 2, cy: cy + plateH * 0.02, size: numSize, tracking: -1 });

  const iconEl = hasIcon ? `<g transform="translate(${r(left)} ${r(cy - iconBox / 2)}) scale(${r(s)})">${iconBlock(icon)}</g>` : '';

  const svg = `${iconEl}
  <path d="${wordPath.d}" fill="${wordColor}"/>
  ${plate ? `<rect x="${r(plateX)}" y="${r(plateY)}" width="${r(plateW)}" height="${r(plateH)}" rx="${r(plateH * 0.22)}" fill="${plateBg}"/>
  <path d="${numPath.d}" fill="${plateFg}"/>` : ''}`;
  return { svg, width: totalW, height: iconBox, left, subColor };
}

/* ============================================================
   LOGO FILES
   ============================================================ */
function logoHorizontal(theme, icon = null, plate = true) {
  const dark = theme === 'dark';
  const iconBox = 132;
  const lock = lockup({ cx: 0, cy: 0, iconBox, dark, icon, plate });
  const padX = 28, padY = 22;
  const W = Math.ceil(lock.width + padX * 2);
  const Hh = Math.ceil(iconBox + padY * 2);
  const moved = lock.svg.replace(/translate\(([\-\d.]+) /, (m, x) => `translate(${r(parseFloat(x) + padX)} `);
  // shift everything by re-generating lockup centered in the padded canvas
  const lock2 = lockup({ cx: W / 2, cy: Hh / 2, iconBox, dark, icon, plate });

/* ============================================================
   STYLE SHEETS
   ============================================================ */
function paletteSheet() {
  const W = 1240, Hh = 720;
  const items = [
    ['Ночь / Night', C.night, 'Основной фон, тёмные поверхности'],
    ['Чернила / Ink', C.ink, 'Глубокий фон, глубина'],
    ['Индиго / Indigo', C.night3, 'Панели, градиенты'],
    ['Вольт / Volt', C.volt, 'Главный акцент, «фары», CTA'],
    ['Циан / Cyan', C.cyan, 'Второй акцент, маршрут, ссылки'],
    ['Амбер / Amber', C.amber, 'Тёплый свет, награды'],
    ['Роуз / Rose', C.pink, 'События, «квест»'],
    ['Туман / Fog', C.fog, 'Второстепенный текст'],
    ['Бумага / Paper', C.paper, 'Светлые поверхности'],
  ];
  let y = 150;
  let out = '';
  for (const [name, hex, desc] of items) {
    out += `<rect x="70" y="${y}" width="120" height="52" rx="12" fill="${hex}" stroke="#FFFFFF" stroke-opacity="0.12"/>
    <path d="${textLeft('textBold', name, { left: 220, cy: y + 26, size: 24 }).d}" fill="${C.white}"/>
    <path d="${textLeft('textReg', desc, { left: 560, cy: y + 26, size: 21 }).d}" fill="${C.fog}"/>
    <path d="${textLeft('textMed', hex.toUpperCase(), { left: 1030, cy: y + 26, size: 21, tracking: 1 }).d}" fill="${C.volt}"/>`;
    y += 62;
  }
  const title = textLeft('uniXB', 'ПАЛИТРА', { left: 70, cy: 78, size: 54 });
  const sub = textLeft('textMed', 'Цветовая система · 60 / 30 / 10', { left: 72, cy: 118, size: 22, tracking: 1 });
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/><rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <path d="${title.d}" fill="${C.white}"/>
  <path d="${sub.d}" fill="${C.fog}"/>${out}`);
}

function typeSheet() {
  const W = 1240, Hh = 820;
  const disp = textLeft('uniXB', 'АВТОКВЕСТ 40', { left: 70, cy: 180, size: 96 });
  const disp2 = textLeft('uniB', 'Пришёл! Увидел! Вписал код!', { left: 70, cy: 268, size: 46 });
  const cond = textLeft('uniXB', 'АВТОФОТОКВЕСТ · КАЛУГА · 2026', { left: 70, cy: 356, size: 46 });
  const alphaD = textLeft('uniXB', 'АаБбВвГгДдЕе 1234567890', { left: 70, cy: 442, size: 40 });
  const body = textLeft('textReg', 'Голос Текст — рабочая гарнитура: афиши, посты, подписи, инструкции. Команда от 2 до 5 человек, ночная игра, 15 локаций.', { left: 70, cy: 520, size: 26 });
  const body2 = textLeft('textDemi', 'Голос Текст · ДемиБолд — акценты и подзаголовки', { left: 70, cy: 566, size: 26 });
  const alphaT = textLeft('textBold', 'АаБбВвГгДдЕеЁёЖжЗз 1234567890', { left: 70, cy: 620, size: 30 });
  const marks = [
    ['01 · Unbounded ExtraBold', 'Логотип, крупные заголовки'],
    ['02 · Unbounded Bold / Medium', 'Акценты, цифры, афиши'],
    ['03 · Golos Text (OFL)', 'Основной текст и интерфейс'],
  ];
  let my = 700;
  let mout = '';
  for (const [a, b] of marks) {
    mout += `<path d="${textLeft('textBold', a, { left: 70, cy: my, size: 20 }).d}" fill="${C.volt}"/>
    <path d="${textLeft('textReg', b, { left: 470, cy: my, size: 20 }).d}" fill="${C.fog}"/>`;
    my += 34;
  }
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/>
  <path d="${disp.d}" fill="${C.white}"/>
  <path d="${disp2.d}" fill="${C.volt}"/>
  <path d="${cond.d}" fill="${C.cyan}"/>
  <path d="${alphaD.d}" fill="${C.paper}"/>
  <path d="${body.d}" fill="${C.fog}"/>
  <path d="${body2.d}" fill="${C.white}"/>
  <path d="${alphaT.d}" fill="${C.fog}"/>
  <rect x="70" y="650" width="${W - 140}" height="1" fill="#FFFFFF" fill-opacity="0.12"/>
  ${mout}`);
}

function patternSheet() {
  const W = 900, Hh = 600;
  let nodes = '';
  const pts = [[70, 480], [250, 420], [430, 470], [610, 380], [790, 430]];
  for (let i = 0; i < pts.length; i++) {
    nodes += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="10" fill="none" stroke="${C.cyan}" stroke-width="3"/>
    <circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="3.5" fill="${C.volt}"/>`;
    if (i) nodes += `<line x1="${pts[i - 1][0]}" y1="${pts[i - 1][1]}" x2="${pts[i][0]}" y2="${pts[i][1]}" stroke="${C.cyan}" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="2 16" stroke-linecap="round"/>`;
  }
  const t = textLeft('uniXB', 'МАРШРУТ', { left: 70, cy: 110, size: 64 });
  const s = textLeft('textMed', 'Графический паттерн: точки, линии маршрута, метки локаций', { left: 72, cy: 158, size: 22 });
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/><rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <path d="${t.d}" fill="${C.white}"/>
  <path d="${s.d}" fill="${C.fog}"/>
  ${nodes}
  <circle cx="120" cy="300" r="60" fill="none" stroke="${C.volt}" stroke-opacity="0.3" stroke-width="2"/>
  <circle cx="120" cy="300" r="34" fill="none" stroke="${C.cyan}" stroke-opacity="0.3" stroke-width="2"/>`);
}

/* ============================================================
   SOCIAL / VK ASSETS
   ============================================================ */
function taglineBlock({ cx, cy, dark = true, scale = 1 }) {
  const t1 = textCentered('textBold', 'ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!', { cx, cy: cy - 32 * scale, size: 42 * scale, tracking: 2 });
  const t2 = textCentered('textDemi', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА · +7 953 318-69-66', { cx, cy: cy + 30 * scale, size: 25 * scale, tracking: 2 });
  return `<path d="${t1.d}" fill="${C.volt}"/><path d="${t2.d}" fill="${dark ? C.fog : C.fogDark}"/>`;
}

function ghost(text, { cx, cy, size, opacity = 0.05, color = '#FFFFFF', font = 'uniXB', tracking = 0 }) {
  const m = textCentered(font, text, { cx, cy, size, tracking });
  return `<path d="${m.d}" fill="${color}" fill-opacity="${opacity}"/>`;
}

function coverDecor(W, Hh) {
  return `<rect width="${W}" height="${Hh}" fill="url(#gNight)"/>
  <rect width="${W}" height="${Hh}" fill="url(#gGlow)"/>
  <rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <polygon points="0,${Hh} 120,${Hh} 420,60 260,40" fill="url(#gBeam)"/>
  <polygon points="${W},${Hh} ${W - 120},${Hh} ${W - 420},60 ${W - 260},40" fill="url(#gBeam2)"/>
  <line x1="0" y1="${Hh - 26}" x2="${W}" y2="${Hh - 26}" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="2" stroke-dasharray="26 22"/>
  <line x1="0" y1="${Hh - 13}" x2="${W}" y2="${Hh - 13}" stroke="#FFFFFF" stroke-opacity="0.03" stroke-width="2" stroke-dasharray="14 34"/>`;
}

function vkCover({ W = 1590, Hh = 400, guide = false, scale = 1, icon = null } = {}) {
  const cx = W / 2;
  const lock = lockup({ cx, cy: Hh * 0.36, iconBox: 128 * scale, dark: true, icon });
  const tags = taglineBlock({ cx, cy: Hh * 0.72, dark: true, scale: 0.98 * scale });
  const g = ghost('40', { cx, cy: Hh * 0.5, size: Hh * 1.5, opacity: 0.045 });
  let guides = '';
  if (guide) {
    const margin = (W - 1196) / 2;
    guides = `
  <rect x="0" y="0" width="${margin}" height="${Hh}" fill="#000000" fill-opacity="0.62"/>
  <rect x="${W - margin}" y="0" width="${margin}" height="${Hh}" fill="#000000" fill-opacity="0.62"/>
  <rect x="${margin}" y="0" width="1196" height="${Hh}" fill="none" stroke="${C.volt}" stroke-width="2" stroke-dasharray="10 8"/>
  <rect x="20" y="20" width="160" height="160" rx="16" fill="none" stroke="${C.pink}" stroke-width="2" stroke-dasharray="8 8"/>
  <path d="${textLeft('textBold', 'АВАТАР (desktop)', { left: 28, cy: 196, size: 16 }).d}" fill="${C.pink}"/>
  <path d="${textLeft('textBold', 'БЕЗОПАСНАЯ ЗОНА · 1196×400', { left: margin + 16, cy: 30, size: 18 }).d}" fill="${C.volt}"/>
  <rect x="0" y="0" width="${W}" height="${Hh}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2"/>`;
  }
  return svg(W, Hh, `${defsBase()}${coverDecor(W, Hh)}${g}${lock.svg}${tags}${guides}`);
}

function vkCoverWide() {
  return vkCover({ W: 1920, Hh: 768, scale: 1.6 });
}

function vkLivingMobile() {
  const W = 1080, Hh = 1920, cx = W / 2;
  const lock = lockup({ cx, cy: 470, iconBox: 190, dark: true });
  const head = textCentered('uniXB', 'НОЧНОЙ', { cx, cy: 880, size: 96, tracking: 3 });
  const head2 = textCentered('uniXB', 'АВТОФОТОКВЕСТ', { cx, cy: 1000, size: 70, tracking: 2 });
  const sub = textCentered('textDemi', 'ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!', { cx, cy: 1130, size: 40, tracking: 3 });
  const cta = (() => {
    const label = textCentered('textBold', 'РЕГИСТРАЦИЯ В СООБЩЕСТВЕ', { cx, cy: 1320, size: 34, tracking: 2 });
    return `<rect x="${cx - 360}" y="1276" width="720" height="90" rx="45" fill="${C.volt}"/>
    <path d="${textCentered('textBold', 'РЕГИСТРАЦИЯ В СООБЩЕСТВЕ', { cx, cy: 1322, size: 34, tracking: 2 }).d}" fill="${C.night}"/>`;
  })();
  const bot = textCentered('textMed', 'v k . c o m / a v t o k v e s t 4 0', { cx, cy: 1800, size: 30, tracking: 2 });
  const g = ghost('40', { cx, cy: 1660, size: 520, opacity: 0.06 });
  const deco = `${ghost('40', { cx, cy: 1660, size: 520, opacity: 0.05 })}`;
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/><rect width="${W}" height="${Hh}" fill="url(#gGlow)"/>
  <rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <polygon points="0,1920 220,1920 760,120 460,90" fill="url(#gBeam)"/>
  <polygon points="1080,1920 860,1920 320,120 620,90" fill="url(#gBeam2)"/>
  ${deco}
  ${lock.svg}
  <path d="${head.d}" fill="${C.white}"/>
  <path d="${head2.d}" fill="${C.volt}"/>
  <path d="${sub.d}" fill="${C.fog}"/>
  ${cta}
  <path d="${bot.d}" fill="${C.fog}"/>`);
}

function vkAvatar() {
  const size = 400, cx = size / 2;
  const lock0 = lockup({ cx: 0, cy: 0, iconBox: 100, dark: true });
  const fit = 360 / lock0.width;
  const lock = lockup({ cx, cy: size / 2, iconBox: 100 * fit, dark: true });
  return svg(size, size, `${defsBase()}
  <rect width="${size}" height="${size}" fill="url(#gNight)"/><rect width="${size}" height="${size}" fill="url(#gGlow)"/><rect width="${size}" height="${size}" fill="url(#dots)"/>
  ${lock.svg}`);
}

function postTemplate() {
  const W = 1200, Hh = 800, cx = W / 2;
  const lock = lockup({ cx: W / 2, cy: 108, iconBox: 74, dark: true });
  const kicker = textCentered('textBold', 'АНОНС · ИГРА №__', { cx, cy: 250, size: 30, tracking: 4 });
  const head = textCentered('uniXB', 'АВТОФОТОКВЕСТ', { cx, cy: 372, size: 76, tracking: 2 });
  const head2 = textCentered('textBold', '«ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!»', { cx, cy: 484, size: 38, tracking: 2 });
  const date = textCentered('textDemi', '__ ______ · __:__ · сбор у ______', { cx, cy: 600, size: 34, tracking: 1 });
  const cta = `<rect x="${cx - 250}" y="660" width="500" height="76" rx="38" fill="${C.volt}"/>
  <path d="${textCentered('textBold', 'ЗАЯВКА В КОММЕНТАРИЯХ', { cx, cy: 700, size: 28, tracking: 1 }).d}" fill="${C.night}"/>`;
  const g = ghost('40', { cx: W - 150, cy: 700, size: 420, opacity: 0.05 });
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/><rect width="${W}" height="${Hh}" fill="url(#gGlow)"/><rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <line x1="70" y1="176" x2="${W - 70}" y2="176" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
  <line x1="70" y1="636" x2="${W - 70}" y2="636" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
  ${g}${lock.svg}
  <path d="${kicker.d}" fill="${C.cyan}"/>
  <path d="${head.d}" fill="${C.white}"/>
  <path d="${head2.d}" fill="${C.volt}"/>
  <path d="${date.d}" fill="${C.fog}"/>
  ${cta}`);
}

function storyTemplate() {
  const W = 1080, Hh = 1920, cx = W / 2;
  const lock = lockup({ cx, cy: 220, iconBox: 120, dark: true });
  const big = textCentered('uniXB', '№5', { cx, cy: 620, size: 300, tracking: -6 });
  const head = textCentered('uniXB', 'НОЧНОЙ', { cx, cy: 900, size: 84, tracking: 4 });
  const head2 = textCentered('uniXB', 'АВТОФОТОКВЕСТ', { cx, cy: 990, size: 60, tracking: 3 });
  const sub = textCentered('textDemi', '15 ЛОКАЦИЙ · 13 КОМАНД · 2–5 ЧЕЛОВЕК', { cx, cy: 1170, size: 34, tracking: 2 });
  const cta = `<rect x="${cx - 400}" y="1340" width="800" height="110" rx="55" fill="${C.volt}"/>
  <path d="${textCentered('textBold', 'СМАХНИ ВВЕРХ · ЗАЯВКА', { cx, cy: 1397, size: 40, tracking: 2 }).d}" fill="${C.night}"/>`;
  const bot = textCentered('textMed', '+7 953 318-69-66 · vk.com/avtokvest40', { cx, cy: 1780, size: 32, tracking: 1 });
  return svg(W, Hh, `${defsBase()}
  <rect width="${W}" height="${Hh}" fill="url(#gNight)"/><rect width="${W}" height="${Hh}" fill="url(#gGlow)"/><rect width="${W}" height="${Hh}" fill="url(#dots)"/>
  <polygon points="0,1920 260,1920 820,140 480,110" fill="url(#gBeam)"/>
  <polygon points="1080,1920 820,1920 260,140 600,110" fill="url(#gBeam2)"/>
  ${ghost('40', { cx, cy: 1660, size: 560, opacity: 0.05 })}
  ${lock.svg}
  <path d="${big.d}" fill="${C.volt}" fill-opacity="0.92"/>
  <path d="${head.d}" fill="${C.white}"/>
  <path d="${head2.d}" fill="${C.white}"/>
  <path d="${sub.d}" fill="${C.fog}"/>
  ${cta}
  <path d="${bot.d}" fill="${C.fog}"/>`);
}

/* ============================================================
   CARRIERS (печатные носители)
   ============================================================ */
function carrierBase(W, Hh) {
  return `<rect width="${W}" height="${Hh}" fill="url(#gNight)"/>
  <rect width="${W}" height="${Hh}" fill="url(#gGlow)"/>
  <rect width="${W}" height="${Hh}" fill="url(#dots)"/>`;
}

function businessCardFront() {
  const W = 1063, Hh = 591, cx = W / 2;
  const lock = lockup({ cx, cy: 240, iconBox: 120, dark: true });
  const slogan = textCentered('textBold', 'ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!', { cx, cy: 430, size: 24, tracking: 2 });
  const desc = textLeft('textDemi', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА', { left: 54, cy: 488, size: 21, tracking: 2 });
  const phone = textLeft('uniXB', '+7 953 318-69-66', { left: 54, cy: 528, size: 23, tracking: 1 });
  const url = textLeft('textMed', 'vk.com/avtokvest40', { left: 54, cy: 560, size: 18, tracking: 1 });
  const g = ghost('40', { cx: W - 160, cy: Hh - 110, size: 260, opacity: 0.05 });
  return svg(W, Hh, `${defsBase()}${carrierBase(W, Hh)}
  ${g}${lock.svg}
  <path d="${slogan.d}" fill="${C.volt}"/>
  <path d="${desc.d}" fill="${C.fog}"/>
  <path d="${phone.d}" fill="${C.white}"/>
  <path d="${url.d}" fill="${C.cyan}"/>`);
}

function businessCardBack() {
  const W = 1063, Hh = 591, cx = W / 2;
  const lock = lockup({ cx, cy: 240, iconBox: 120, dark: true });
  const slogan = textCentered('textBold', 'ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!', { cx, cy: 452, size: 30, tracking: 3 });
  const line = textCentered('textDemi', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА · +7 953 318-69-66', { cx, cy: 512, size: 24, tracking: 2 });
  const url = textCentered('textMed', 'vk.com/avtokvest40', { cx, cy: 554, size: 22, tracking: 1 });
  return svg(W, Hh, `${defsBase()}${carrierBase(W, Hh)}
  ${lock.svg}
  <path d="${slogan.d}" fill="${C.volt}"/>
  <path d="${line.d}" fill="${C.fog}"/>
  <path d="${url.d}" fill="${C.cyan}"/>`);
}

function stickerRound() {
  const D = 1181, cx = D / 2;
  const lock = lockup({ cx, cy: 376, iconBox: 98, dark: true });
  const slogan = textCentered('textBold', 'ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!', { cx, cy: 898, size: 34, tracking: 3 });
  const url = textCentered('textMed', 'КАЛУГА · vk.com/avtokvest40', { cx, cy: 986, size: 27, tracking: 1 });
  const phone = textCentered('textMed', '+7 953 318-69-66', { cx, cy: 1030, size: 27, tracking: 1 });
  return svg(D, D, `${defsBase()}
  <circle cx="${cx}" cy="${cx}" r="${D / 2}" fill="url(#gNight)"/>
  <circle cx="${cx}" cy="${cx}" r="${D / 2}" fill="url(#gGlow)"/>
  <circle cx="${cx}" cy="${cx}" r="${D / 2}" fill="url(#dots)"/>
  <circle cx="${cx}" cy="${cx}" r="${D / 2 - 14}" fill="none" stroke="${C.volt}" stroke-width="7"/>
  <circle cx="${cx}" cy="${cx}" r="${D / 2 - 34}" fill="none" stroke="${C.cyan}" stroke-opacity="0.55" stroke-width="4" stroke-dasharray="2 20" stroke-linecap="round"/>
  ${lock.svg}
  <path d="${slogan.d}" fill="${C.volt}"/>
  <path d="${url.d}" fill="${C.fog}"/>
  <path d="${phone.d}" fill="${C.fog}"/>`);
}

function badgeTeam() {
  const W = 1050, Hh = 700, cx = W / 2;
  const lock = lockup({ cx, cy: 168, iconBox: 96, dark: true });
  const kicker = textCentered('textBold', 'УЧАСТНИК АВТОКВЕСТА', { cx, cy: 270, size: 24, tracking: 4 });
  const sep1 = `<line x1="${cx - 380}" y1="294" x2="${cx + 380}" y2="294" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>`;
  const team = textCentered('uniXB', 'КОМАНДА «___»', { cx, cy: 376, size: 58, tracking: 2 });
  const name = textCentered('textDemi', 'ИМЯ / НИК · РОЛЬ', { cx, cy: 476, size: 34, tracking: 2 });
  const num = textCentered('uniB', 'ИГРА №__', { cx, cy: 560, size: 26, tracking: 3 });
  const foot = textCentered('textMed', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА · +7 953 318-69-66', { cx, cy: 622, size: 22, tracking: 2 });
  return svg(W, Hh, `${defsBase()}${carrierBase(W, Hh)}
  <rect x="26" y="26" width="${W - 52}" height="${Hh - 52}" rx="20" fill="none" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="2"/>
  ${lock.svg}
  <path d="${kicker.d}" fill="${C.cyan}"/>
  ${sep1}
  <path d="${team.d}" fill="${C.white}"/>
  <path d="${name.d}" fill="${C.fog}"/>
  <path d="${num.d}" fill="${C.volt}"/>
  <path d="${foot.d}" fill="${C.fog}"/>`);
}

function posterA4() {
  const W = 1240, Hh = 1754, cx = W / 2;
  const lock = lockup({ cx, cy: 252, iconBox: 120, dark: true });
  const kicker = textCentered('textBold', 'АНОНС · ИГРА №__', { cx, cy: 448, size: 32, tracking: 5 });
  const title = textCentered('uniXB', 'АВТОФОТОКВЕСТ', { cx, cy: 610, size: 92, tracking: 2 });
  const slogan = textCentered('textBold', '«ПРИШЁЛ! УВИДЕЛ! ВПИСАЛ КОД!»', { cx, cy: 738, size: 46, tracking: 2 });
  const det = textCentered('textDemi', '__ ______ · __:__ · сбор у ______', { cx, cy: 842, size: 40, tracking: 2 });
  const f1 = textCentered('textMed', '15 ЛОКАЦИЙ ПО ГОРОДУ', { cx, cy: 968, size: 30, tracking: 2 });
  const f2 = textCentered('textMed', '13 КОМАНД · 2–5 ЧЕЛОВЕК', { cx, cy: 1014, size: 30, tracking: 2 });
  const cta = `<rect x="${cx - 330}" y="1108" width="660" height="104" rx="52" fill="${C.volt}"/>
  <path d="${textCentered('textBold', 'ЗАЯВКА В КОММЕНТАРИЯХ', { cx, cy: 1162, size: 34, tracking: 2 }).d}" fill="${C.night}"/>`;
  const note = textCentered('textReg', 'Участие по предварительной записи · количество команд ограничено', { cx, cy: 1262, size: 24, tracking: 1 });
  const url = textCentered('textMed', '+7 953 318-69-66 · vk.com/avtokvest40', { cx, cy: 1662, size: 30, tracking: 2 });
  const subline = textCentered('textReg', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА', { cx, cy: 1712, size: 24, tracking: 2 });
  const g = ghost('40', { cx, cy: 1540, size: 400, opacity: 0.05 });
  return svg(W, Hh, `${defsBase()}${carrierBase(W, Hh)}
  <line x1="80" y1="356" x2="${W - 80}" y2="356" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
  <line x1="80" y1="1034" x2="${W - 80}" y2="1034" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
  ${g}${lock.svg}
  <path d="${kicker.d}" fill="${C.cyan}"/>
  <path d="${title.d}" fill="${C.white}"/>
  <path d="${slogan.d}" fill="${C.volt}"/>
  <path d="${det.d}" fill="${C.fog}"/>
  <path d="${f1.d}" fill="${C.paper}"/>
  <path d="${f2.d}" fill="${C.paper}"/>
  ${cta}
  <path d="${note.d}" fill="${C.fog}"/>
  <path d="${url.d}" fill="${C.white}"/>
  <path d="${subline.d}" fill="${C.fog}"/>`);
}

function certificateSvg() {
  const W = 1240, Hh = 874, cx = W / 2;
  const frame = `<rect x="30" y="30" width="${W - 60}" height="${Hh - 60}" rx="18" fill="none" stroke="${C.fog}" stroke-opacity="0.35" stroke-width="2"/>
  <rect x="52" y="52" width="${W - 104}" height="${Hh - 104}" rx="12" fill="none" stroke="${C.volt}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="12 10"/>`;
  const lock = lockup({ cx, cy: 220, iconBox: 110, dark: true });
  const title = textCentered('uniXB', 'СЕРТИФИКАТ', { cx, cy: 392, size: 84, tracking: 6 });
  const sub = textCentered('textDemi', 'НА КОМАНДНУЮ ИГРУ «АВТОФОТОКВЕСТ»', { cx, cy: 464, size: 34, tracking: 3 });
  const amtLabel = textCentered('textBold', 'СУММА', { cx, cy: 556, size: 22, tracking: 6 });
  const amt = textCentered('uniXB', '1 000 ₽', { cx, cy: 636, size: 88, tracking: 1 });
  const note = textCentered('textMed', 'действует на любую игру сезона · оплата при регистрации', { cx, cy: 696, size: 24, tracking: 1 });
  const fields = [['ПОЛУЧАТЕЛЬ', 300], ['ДАТА', 620], ['№ СЕРТИФИКАТА', 940]];
  let fout = '';
  for (const [label, fx] of fields) {
    fout += `<path d="${textCentered('textBold', label, { cx: fx, cy: 768, size: 21, tracking: 3 }).d}" fill="${C.fog}"/>
    <line x1="${fx - 170}" y1="792" x2="${fx + 170}" y2="792" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1.5"/>`;
  }
  const foot = textCentered('textReg', 'АВТОКВЕСТЫ И КВЕСТЫ · КАЛУГА · +7 953 318-69-66 · vk.com/avtokvest40', { cx, cy: 874, size: 24, tracking: 2 });
  return svg(W, Hh, `${defsBase()}${carrierBase(W, Hh)}
  ${frame}
  ${lock.svg}
  <path d="${title.d}" fill="${C.volt}"/>
  <path d="${sub.d}" fill="${C.white}"/>
emit('brand/palette.svg', paletteSheet());
emit('brand/typography.svg', typeSheet());
emit('brand/pattern.svg', patternSheet());
emit('vk/cover-1590x400.svg', vkCover({ W: 1590, Hh: 400 }));
emit('vk/cover-1590x400-guide.svg', vkCover({ W: 1590, Hh: 400, guide: true }));
emit('vk/cover-1920x768.svg', vkCoverWide());
emit('vk/cover-living-1080x1920.svg', vkLivingMobile());
emit('vk/avatar-400x400.svg', vkAvatar());
emit('vk/post-1200x800.svg', postTemplate());
emit('vk/story-1080x1920.svg', storyTemplate());

/* носители */
emit('carriers/business-card-front.svg', businessCardFront());
emit('carriers/business-card-back.svg', businessCardBack());
emit('carriers/sticker-round.svg', stickerRound());
emit('carriers/badge-team.svg', badgeTeam());
emit('carriers/poster-a4.svg', posterA4());
emit('carriers/certificate.svg', certificateSvg());

/* brand guide html (self-contained, inlines svg) */
function inline(rel) {
  const f = files.find((x) => x.rel === rel);
  return f ? f.content.replace(/<\?xml[^>]*\?>/g, '') : `<p>missing ${rel}</p>`;
}
const guideHtml = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Автоквест 40 — Айдентика</title>
<style>
  :root{--night:#0A0F26;--volt:#C6FF3D;--cyan:#25E3D4;--fog:#9AA6CC;}
  *{box-sizing:border-box} body{margin:0;background:#0A0F26;color:#F5F7FF;font-family:-apple-system,'Golos Text',Segoe UI,Roboto,sans-serif;line-height:1.5}
  header{padding:64px 40px 40px;border-bottom:1px solid rgba(255,255,255,.1)}
  h1{font-size:44px;margin:0 0 8px} .muted{color:var(--fog)}
  main{max-width:1320px;margin:0 auto;padding:40px}
  section{margin:0 0 64px} h2{font-size:26px;color:var(--volt);margin:0 0 6px} h3{font-size:18px;margin:24px 0 8px;color:#fff} h4{font-size:15px;margin:20px 0 6px;color:var(--cyan)}
  .grid{display:grid;gap:20px} .g2{grid-template-columns:1fr 1fr} .g3{grid-template-columns:repeat(3,1fr)}
  .card{background:#0e1430;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:22px}
  .card img, .card svg{max-width:100%;height:auto;display:block}
  .light{background:#F5F7FF;border-color:#e2e6f3;color:#0A0F26}
  .swatches{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .sw{border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}
  .sw .box{height:84px}.sw .lbl{padding:10px 12px;font-size:13px}.sw b{display:block;font-size:14px}
  code{background:rgba(255,255,255,.08);padding:2px 8px;border-radius:8px;color:var(--cyan);font-size:13px}
  ul{color:var(--fog)} li{margin:4px 0} .ok{color:var(--volt)} .no{color:#FF6B9A}
  footer{padding:40px;color:var(--fog);border-top:1px solid rgba(255,255,255,.1);font-size:14px}
</style></head><body>
<header><h1>Автоквест 40 — айдентика</h1>
<div class="muted">Автоквесты и квесты · Калуга. Логотип, цвет, шрифт, паттерн и шаблоны для ВКонтакте.</div></header>
<main>
  <section><h2>01 · Логотип</h2>
    <div class="grid g2">
      <div class="card">${inline('brand/logo-horizontal-dark.svg')}<p class="muted">Горизонтальный. Тёмный фон</p></div>
      <div class="card light">${inline('brand/logo-horizontal-light.svg')}<p class="muted">Горизонтальный. Светлый фон</p></div>
    </div>
  </section>
  <section><h2>02 · Цвет</h2>
    <div class="card">${inline('brand/palette.svg')}</div>
    <div class="swatches" style="margin-top:20px">
      ${[['Ночь', '#0A0F26'], ['Вольт', '#C6FF3D'], ['Циан', '#25E3D4'], ['Амбер', '#FFC24B']].map(([n, h]) => `<div class="sw"><div class="box" style="background:${h}"></div><div class="lbl"><b>${n}</b><code>${h}</code></div></div>`).join('')}
    </div>
  </section>
  <section><h2>03 · Типографика</h2>
    <div class="card">${inline('brand/typography.svg')}</div>
    <ul>
      <li><b>Дисплей:</b> Unbounded (OFL, бесплатная) — логотип, заголовки, цифры. В логотипах и макетах текст переведён в кривые.</li>
      <li><b>Текст:</b> Golos Text (OFL, бесплатная) — посты, подписи, интерфейс.</li>
      <li>Правило: не более двух гарнитур в макете, никакого дефолтного шрифта.</li>
    </ul>
  </section>
  <section><h2>04 · Паттерн и графика</h2>
    <div class="card">${inline('brand/pattern.svg')}</div>
    <ul><li>Карта, точки локаций, пунктирный маршрут, свет фар.</li><li>Тёмный фон + один яркий акцент.</li></ul>
  </section>
  <section><h2>05 · Фирменный блок ВК</h2>
    <h3>Шапка 1590×400 (с разметкой безопасной зоны)</h3>
    <div class="card">${inline('vk/cover-1590x400-guide.svg')}</div>
    <h3>Шапка 1590×400 (чистовая)</h3>
    <div class="card">${inline('vk/cover-1590x400.svg')}</div>
    <h3>Широкая шапка 1920×768</h3>
    <div class="card">${inline('vk/cover-1920x768.svg')}</div>
    <h3>Живая обложка (мобайл) 1080×1920</h3>
    <div class="grid g3">
      <div class="card">${inline('vk/cover-living-1080x1920.svg')}</div>
      <div class="card">${inline('vk/post-1200x800.svg')}<p class="muted">Шаблон поста / афиши</p></div>
      <div class="card">${inline('vk/story-1080x1920.svg')}<p class="muted">Шаблон истории</p></div>
    </div>
    <h3>Аватар 400×400</h3>
    <div class="grid g3">
      <div class="card">${inline('brand/logo-icon-badge.svg')}</div>
    </div>
  </section>
  <section><h2>06 · Носители</h2>
    <h3>Визитка — лицо и оборот (90×50 мм)</h3>
    <div class="grid g2">
      <div class="card">${inline('carriers/business-card-front.svg')}<p class="muted">Лицо</p></div>
      <div class="card">${inline('carriers/business-card-back.svg')}<p class="muted">Оборот</p></div>
    </div>
    <h3>Наклейка на авто ⌀100 мм · бейдж команды · сертификат</h3>
    <div class="grid g3">
      <div class="card">${inline('carriers/sticker-round.svg')}<p class="muted">Наклейка круглая</p></div>
      <div class="card">${inline('carriers/badge-team.svg')}<p class="muted">Бейдж команды</p></div>
      <div class="card">${inline('carriers/certificate.svg')}<p class="muted">Сертификат на игру</p></div>
    </div>
    <h3>Афиша A4 (210×297 мм)</h3>
    <div class="card">${inline('carriers/poster-a4.svg')}</div>
  </section>
  <section><h2>07 · Правила использования</h2>
    <div class="grid g2">
      <div class="card"><h3 class="ok">Можно</h3><ul>
        <li>Давать логотипу свободное поле не меньше высоты знака.</li>
        <li>Использовать знак отдельно на аватаре и в афишах.</li>
        <li>Ставить логотип на тёмный фон, фотографию с затемнением.</li>
      </ul></div>
      <div class="card"><h3 class="no">Нельзя</h3><ul>
        <li>Менять цвет, перекрашивать градиент, добавлять обводки и тени.</li>
        <li>Растягивать, поворачивать, наклонять логотип.</li>
        <li>Размещать на пёстром фоне без подложки.</li>
        <li>Заменять «40» другим начертанием или переносить его на другую строку.</li>
      </ul></div>
    </div>
  </section>
</main>
<footer>Автоквест 40 · Калуга · +7 953 318-69-66 · vk.com/avtokvest40 — айдентика подготовлена как вектор (SVG) + PNG.</footer>
</body></html>`;
emit('brand/index.html', guideHtml);

for (const f of files) {
  const p = path.join(ROOT, f.rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, f.content);
}
console.log('Done. Generated', files.length, 'files:');
for (const f of files) console.log('  ', f.rel);
