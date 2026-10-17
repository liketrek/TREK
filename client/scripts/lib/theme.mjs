/*
 * The matching and the comparison behind theme:lint (scripts/theme-lint.mjs).
 */
import { join } from 'node:path';
import {
  countMap,
  listFiles,
  lowerCounts,
  readBaseline,
  readText,
  reportStale,
  staleCounts,
  TEST_FILE,
  toKey,
  writeBaseline,
} from './ratchet.mjs';
import { markedInComment, withoutComments } from './source.mjs';

export const DISABLE = 'theme-lint-disable';

// A Tailwind variant prefix (dark:, hover:, md:, group-hover:) and the important mark.
const VARIANT = String.raw`(?<![\w-])(?:[\w-]+:)*!?`;
const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTILITY = String.raw`bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|divide|outline|decoration|placeholder|caret|accent|shadow`;

/**
 * The z-index steps in src/index.css start at 60 (--z-bar). A literal above
 * Tailwind's own z-50 is a fixed surface placing itself by a number of its own
 * instead of docking onto a step; z-0 to z-50 stay free for stacking inside a
 * component.
 */
export const Z_LITERAL_ABOVE = 50;

/**
 * Each rule of the contract in src/theme/README.md the check can see in source,
 * with the fix its failure message names. A rule returns the offending matches
 * in one line of code (comments already blanked out).
 */
export const RULES = [
  {
    name: 'arbitrary-color',
    fix: 'a token utility (bg-surface*, text-content*, border-edge*, bg-accent) or bg-[var(--token)]',
    re: new RegExp(
      String.raw`\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|divide|caret)-\[\s*(?:#|rgba?\(|hsla?\(|oklch\()[^\]]*\]`,
      'g'
    ),
  },
  {
    name: 'inline-color',
    fix: 'var(--token) in the style, or the token utility as a class',
    re: /(?:color|background|backgroundColor|borderColor|border|borderTop|borderBottom|borderLeft|borderRight|boxShadow|fill|stroke|outline|textDecorationColor)\s*:\s*['"`]?\s*(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\()/g,
  },
  {
    name: 'inline-font-size',
    fix: 'a type tier (text-title, text-subtitle, text-body, text-caption)',
    re: /fontSize\s*:\s*['"`]?\d/g,
  },
  {
    name: 'palette-class',
    fix: 'a token utility: bg-surface*, text-content*, border-edge*, bg-accent with text-accent-text, or a status color',
    re: new RegExp(
      `${VARIANT}(?:${COLOR_UTILITY})-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?:\\/\\d{1,3})?(?![\\w-])`,
      'g'
    ),
  },
  {
    name: 'raw-text-size',
    fix: 'a type tier (text-title, text-subtitle, text-body, text-caption), which follows the text size setting',
    // The named sizes and the arbitrary ones (text-[13px], text-[0.8rem]) alike.
    re: new RegExp(`${VARIANT}text-(?:xs|sm|base|lg|xl|[2-9]xl|\\[\\d*\\.?\\d+(?:px|rem|em)\\])(?![\\w-])`, 'g'),
  },
  {
    name: 'z-index-literal',
    fix: 'a step of the layering scale: z-[var(--z-modal)] as a class, zIndex: "var(--z-modal)" inline',
    match: (code) => {
      const found = [];
      const add = (m, n) => {
        if (Math.abs(Number(n)) > Z_LITERAL_ABOVE) found.push(m.trim());
      };
      for (const m of code.matchAll(new RegExp(`${VARIANT}-?z-(?:\\[(-?\\d+)\\]|(\\d+))(?![\\w-])`, 'g')))
        add(m[0], m[1] ?? m[2]);
      for (const m of code.matchAll(/\b(?:zIndex\s*:|z-index\s*:)\s*['"`]?\s*(-?\d+)/g)) add(m[0], m[1]);
      return found;
    },
  },
  {
    name: 'dark-mode-read',
    fix: 'the .dark class (useIsDark, dark: variants); only applyAppearance reads the setting',
    re: /\??\.dark_mode\b/g,
  },
];

const matchesOf = (rule, code) => (rule.match ? rule.match(code) : [...code.matchAll(rule.re)].map((m) => m[0].trim()));

/**
 * One file read once: every hit as `line: rule: match`, skipping the lines
 * that carry the marker in a comment, and how many lines carry it.
 */
export function inspect(source, file) {
  const hits = [];
  let markers = 0;
  const lines = source.split('\n');
  withoutComments(source, file)
    .split('\n')
    .forEach((code, i) => {
      if (markedInComment(lines[i], code, DISABLE)) {
        markers++;
        return;
      }
      for (const rule of RULES) for (const m of matchesOf(rule, code)) hits.push(`${i + 1}: ${rule.name}: ${m}`);
    });
  return { hits, markers };
}

/** The hits and markers per file under root/src (tests excluded), keyed by the path from src/. */
export function scan(root) {
  const counts = {};
  const listed = {};
  const markers = {};
  const accept = (key) => /\.tsx?$/.test(key) && !TEST_FILE.test(key);
  for (const path of listFiles(root, ['src'], accept)) {
    const found = inspect(readText(path), path);
    const key = toKey(join(root, 'src'), path);
    if (found.hits.length) {
      counts[key] = found.hits.length;
      listed[key] = found.hits;
    }
    if (found.markers) markers[key] = found.markers;
  }
  return { counts, listed, markers };
}

const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);

/**
 * Runs the check against theme-baseline.json (hits per file) and
 * theme-disable-baseline.json (marked lines per file). Returns the exit code.
 */
export function check({
  root,
  baselinePath = join(root, 'scripts/theme-baseline.json'),
  disableBaselinePath = join(root, 'scripts/theme-disable-baseline.json'),
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const { counts, listed, markers } = scan(root);
  let baseline = readBaseline(baselinePath, countMap);
  let allowedMarkers = readBaseline(disableBaselinePath, countMap);

  if (list) {
    for (const [file, hits] of Object.entries(listed).sort()) {
      log(`${file} (${hits.length}, baseline ${baseline[file] ?? 0})`);
      for (const hit of hits) log(`  ${hit}`);
    }
  }

  if (update) {
    baseline = lowerCounts(baseline, counts);
    allowedMarkers = lowerCounts(allowedMarkers, markers);
    writeBaseline(baselinePath, baseline);
    writeBaseline(disableBaselinePath, allowedMarkers);
  }

  const grown = Object.entries(counts).filter(([file, n]) => n > (baseline[file] ?? 0));
  const marked = Object.entries(markers).filter(([file, n]) => n > (allowedMarkers[file] ?? 0));
  const stale = staleCounts(baseline, counts);
  const staleMarkers = staleCounts(allowedMarkers, markers);

  for (const [file, n] of grown) {
    const rules = [...new Set(listed[file].map((hit) => hit.split(': ')[1]))];
    error(`FAIL  ${file}: ${n} styling bypass(es) of the theme tokens, baseline ${baseline[file] ?? 0}.`);
    for (const name of rules) error(`        ${name}: use ${RULES.find((rule) => rule.name === name).fix}.`);
  }
  if (grown.length) {
    error(
      `Run npm run theme:lint -- --list to see each hit. A colour CSS variables cannot reach (map paint, PDF, ` +
        `brand) is marked with ${DISABLE} in a comment on its line. See src/theme/README.md.`
    );
  }
  for (const [file, n] of marked) {
    error(
      `FAIL  ${file}: ${n} line(s) marked ${DISABLE}, scripts/theme-disable-baseline.json allows ` +
        `${allowedMarkers[file] ?? 0}. Use a token where one reaches; a surface it cannot reach (map paint, PDF, ` +
        'brand colours) needs a reviewer to raise the entry by hand.'
    );
  }
  reportStale(stale, { file: 'theme-baseline.json', command: 'theme:lint', root: join(root, 'src'), error });
  reportStale(staleMarkers, {
    file: 'theme-disable-baseline.json',
    command: 'theme:lint',
    root: join(root, 'src'),
    error,
  });
  log(
    `theme: ${sum(counts)} styling bypass(es) in ${Object.keys(counts).length} file(s), baseline allows ${sum(baseline)}; ` +
      `${sum(markers)} line(s) marked ${DISABLE}, baseline allows ${sum(allowedMarkers)}`
  );
  return grown.length || marked.length || stale.length || staleMarkers.length ? 1 : 0;
}
