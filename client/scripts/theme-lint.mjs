#!/usr/bin/env node
/*
 * theme:lint — guards the appearance token system.
 *
 * Flags styling that bypasses the design tokens and therefore won't follow a
 * user's chosen scheme / transparency / text-size:
 *   - inline color literals  (color: '#111', background: 'rgba(...)', boxShadow: '...rgba...')
 *   - inline numeric fontSize (fontSize: 13)
 *   - arbitrary-value Tailwind color classes (bg-[#..], text-[rgba(..)])
 *
 * ALLOWED (never flagged): var(--token) inline styles, bg-[var(--..)] classes,
 * and genuinely dynamic values (data-driven colors, computed sizes/positions).
 *
 * Mirrors the i18n:parity gate. Default mode reports a baseline and exits 0;
 * `--strict` exits non-zero when any violations remain (for once the backlog is
 * burned down, or wired to changed files only). Add `theme-lint-disable` in a
 * line comment to suppress an intentional exception (map/PDF/brand colors).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

let SRC = new URL('../src', import.meta.url).pathname;
if (process.platform === 'win32' && SRC.startsWith('/')) SRC = SRC.slice(1);

// Surfaces where CSS variables genuinely cannot reach (injected map HTML, WebGL
// paint, standalone PDF documents) — colors there must stay literal.
const EXEMPT = [
  /Mapbox/i, /placePopup/i, /marker/i, /popup/i, /TripPDF/, /JourneyBookPDF/,
  /MapViewGL/, /MapView\./, /JourneyMapGL/, /reservationsMapbox/, /useAtlas/,
  /ReservationOverlay/, /\.test\./, /\.spec\./,
];

const ARB_CLASS = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|divide|caret)-\[\s*(?:#|rgba?\(|hsla?\(|oklch\()/;
const INLINE_COLOR = /(?:color|background|backgroundColor|borderColor|border|borderTop|borderBottom|borderLeft|borderRight|boxShadow|fill|stroke|outline|textDecorationColor)\s*:\s*['"`]?\s*(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\()/;
const INLINE_FONTSIZE = /fontSize\s*:\s*['"`]?\d/;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

const strict = process.argv.includes('--strict');
const offenders = [];
let total = 0;

for (const f of walk(SRC)) {
  if (EXEMPT.some((re) => re.test(f))) continue;
  let count = 0;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (line.includes('theme-lint-disable')) continue;
    if (ARB_CLASS.test(line) || INLINE_COLOR.test(line) || INLINE_FONTSIZE.test(line)) count++;
  }
  if (count) {
    offenders.push([relative(SRC, f).replace(/\\/g, '/'), count]);
    total += count;
  }
}

offenders.sort((a, b) => b[1] - a[1]);
console.log(`theme:lint — ${total} hardcoded-style hits across ${offenders.length} files (map/PDF excluded).`);
for (const [f, c] of offenders.slice(0, 20)) console.log(`  ${String(c).padStart(4)}  ${f}`);
if (offenders.length > 20) console.log(`  … and ${offenders.length - 20} more files.`);
console.log('\nNew/changed code must use tokens (bg-surface / text-content / bg-accent / var(--..)) and the');
console.log('text-title/subtitle/body/caption tiers — never inline #hex, never bg-[#..]. See src/theme/README.md.');

if (strict && total > 0) {
  console.error(`\n✖ theme:lint:strict — ${total} violations remain.`);
  process.exit(1);
}
