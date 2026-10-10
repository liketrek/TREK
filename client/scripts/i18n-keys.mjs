/*
 * lint:i18n-keys: every translation key the client names exists in en.
 *
 * `t()` takes any string and returns the key itself when en has no such
 * entry, so a typo or a key deleted from the locales renders as raw
 * "budget.addCategory" text and nothing fails. Locale parity cannot see it:
 * it compares the locales with en, not en with the code. This check reads
 * src/ (tests aside) and resolves what it finds against shared/src/i18n/en:
 *
 *   t('x.y'), tHtml('x.y'), tr('x.y')   every string literal in the first
 *                                       argument, so both sides of a
 *                                       `cond ? 'a.b' : 'c.d'` are checked
 *   <TransHtml html="x.y" />            the markup variant
 *   translateApiError(t, err, 'x.y')    the fallback key
 *   labelKey: 'x.y', titleKey="x.y"     any property or prop named *Key that
 *                                       holds a dotted key, the tables
 *                                       components feed to t() later
 *   const guideKey = (id) => `help.${id}`  a key builder (help/registry.ts):
 *                                       a template returned by a const
 *                                       named *Key, read as a template key
 *
 * A key exists when en declares it, or declares `key.other` (a plural group
 * whose general form is spelled out). A template whose interpolations can
 * only produce string literals (t(`roadtrip.window.${a ? 'onRoute' : 'atStop'}`))
 * is expanded into those keys and each is checked like a literal one; a
 * literal fallback beside data (`${role ?? 'editor'}`) is checked as a key
 * too. Any other template literal key such as
 * t(`budget.category.${id}`), or a prefix with the rest appended
 * (t('costs.filter.' + f)), cannot be resolved. It is read as a pattern in
 * which each interpolation stands for one key segment (no dot), and it passes
 * on its own only when that pattern is narrow: it matches at least one en key
 * and at most MAX_IMPLICIT_MATCHES of them, the size of an enum such as the
 * docsync error codes. A pattern that matches nothing fails. A wider one
 * (`settings.${mode}` reaches every settings key, so a wrong suffix would
 * pass unseen) and one without a fixed dotted prefix need an entry in
 * DYNAMIC_ALLOWED, keyed by file and template, saying what bounds the value.
 * Listing every narrow template instead would be well over a hundred entries
 * restating their own prefix, and nothing in an entry would be checked that
 * the bound does not already check. What the bound cannot see is a runtime
 * value with no key under a narrow prefix: that needs the value's type, which
 * this text scan does not have, and is the price of not listing them.
 * A key held in a variable (`t(opt.label)`) is out of reach unless the table
 * names it in a *Key property.
 *
 * The en keys nothing reaches are a ratchet. Besides src/, the search for
 * references reads server/src (system notice and notification channel keys
 * the server sends, *Key properties in its registries) and plugin-sdk/src, so
 * a key the server uses does not read as dead; those references only count as
 * reached, they are not held to the rules above. The unused keys per en
 * domain file may not rise above scripts/i18n-unused-baseline.json, and an
 * entry above its count fails until --update lowers it. A key reached only
 * through a variable the scan cannot follow is reached by naming it: in a
 * *Key property of the table, or as a literal t() where the table is read.
 *
 *   npm run lint:i18n-keys              check (CI)
 *   npm run lint:i18n-keys -- --unused  also list en keys no literal or pattern reaches
 *   npm run lint:i18n-keys -- --update  lower the unused-key baseline; it never raises an entry
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Plain paths rather than `new URL(..., import.meta.url)`: under the test runner's DOM environment URL is
// jsdom's, which fileURLToPath refuses.
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');
const SHARED_SCRIPTS = join(HERE, '..', '..', 'shared', 'scripts');
const UNUSED_BASELINE = join(HERE, 'i18n-unused-baseline.json');

/**
 * Where else a translation key can be named: the server sends keys for the
 * client to translate (system notices, notification channels), and the plugin
 * SDK names the ones plugin surfaces use. Read only to find which en keys are
 * reached.
 */
export const REFERENCE_ROOTS = [join(HERE, '..', '..', 'server', 'src'), join(HERE, '..', '..', 'plugin-sdk', 'src')];

/** How many en keys a template may reach and still pass without an entry below. */
export const MAX_IMPLICIT_MATCHES = 30;

/**
 * Template keys the check cannot bound by itself: wider than
 * MAX_IMPLICIT_MATCHES, or without a fixed dotted prefix. Each names the file
 * it sits in and why the interpolated value can only be a real key; one with
 * no fixed prefix also lists the keys it resolves to, which must exist. An
 * entry nothing uses any more fails, so the list cannot rot.
 */
export const DYNAMIC_ALLOWED = [
  {
    file: 'components/Trips/TripShareDialog.tsx',
    template: '${opt.label}Hint',
    because:
      'TripShareDialog appends Hint to each SHARE_OPTIONS label (useTripShare.ts); share.optTravelOnlyHint ' +
      'and share.optHideImagesHint exist, and the template has no fixed part to match them by',
    resolves: ['share.optTravelOnlyHint', 'share.optHideImagesHint'],
  },
  ...[
    'help.ctx.${id}.${part}',
    'help.ctx.${id}.bullet.${n}',
    'help.guide.${id}.${part}',
    'help.guide.${id}.step.${n}',
    'help.guide.${id}.tip.${n}',
  ].map((template) => ({
    file: 'help/registry.ts',
    template,
    because:
      'a key builder over the registered help contexts and guides; src/help/registry.test.ts resolves every ' +
      'key of every registered entry against en',
  })),
  {
    file: 'mobile/screens/dashboard/MUserMenu.tsx',
    template: 'settings.${mode}',
    because: "mode is a ThemeMode from resolveMode(), 'light' | 'dark' | 'auto', and settings.light/dark/auto exist",
  },
  ...['components/Studio/StudioElementsPanel.tsx', 'components/Studio/StudioInspector.tsx'].map((file) => ({
    file,
    template: 'journey.studio.${key}',
    because: 'key comes from an `as const` tuple of frame and stroke styles written beside the call, typed literals',
  })),
  {
    file: 'mobile/screens/trip/sheets/MBookingFields.tsx',
    template: 'reservations.${s}',
    because: "s iterates the literal ['pending', 'confirmed'] as const; reservations.pending/confirmed exist",
  },
  ...['components/Admin/AdminPluginsPanel.tsx', 'mobile/screens/admin/MAdminPluginsPanel.tsx'].map((file) => ({
    file,
    template: 'admin.plugins.perm.${perm}',
    because:
      'PermLabel translates a permission only when PERM_KEYS (generated PLUGIN_PERMISSIONS) holds it and shows ' +
      'the raw code otherwise; the plugin-facts gate keeps the permission keys in step with en',
  })),
  ...['components/Settings/PhotoProvidersSection.tsx', 'mobile/screens/settings/MPhotoProvidersSection.tsx'].flatMap(
    (file) =>
      ['memories.${field.label}', 'memories.${field.hint}'].map((template) => ({
        file,
        template,
        because:
          'field label and hint names come from the provider field rows PhotoProviderSeeder writes, each a ' +
          'memories.* key in en',
      }))
  ),
  {
    file: 'components/Tours/planner/TourPlannerPanels.tsx',
    template: 'tours.planner.${role}',
    because: "roleLabel takes role: 'start' | 'via' | 'end', and tours.planner.start/via/end exist",
  },
];

const KEY_RE = /^[a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_:-]+)+$/;
const PREFIX_RE = /^[a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_:-]+)*\.$/;
const CALL_RE = /(?<![\w$.])(?:t|tHtml|tr)\(|(?<=[\w$]\.)(?:t|tHtml)\(/g;
const HTML_PROP_RE = /<TransHtml\b[^>]*?\bhtml=(["'])([^"'\n]+)\1/g;
const API_ERROR_RE = /\btranslateApiError\(\s*t\s*,[^,()]*(?:\([^()]*\))?[^,()]*,\s*(['"])([^'"\n]+)\1/g;
const KEY_BUILDER_RE = /\bconst\s+[a-zA-Z]*Key\s*=\s*\([^)]*\)\s*(?::\s*[^=]+?)?=>\s*`((?:\\.|\$\{[^}]*\}|[^`\\])*)`/g;
const KEY_PROP_RE = /\b[a-zA-Z]*Key\s*(?::|=\{?)\s*(['"])([a-z][a-zA-Z0-9_]*\.[^'"\s]+)\1/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.tsx?$/.test(name) && !/\.(?:test|spec)\./.test(name) && !name.endsWith('.d.ts')) files.push(path);
  }
  return files;
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

/**
 * The source of the first argument of the call whose `(` sits at `open`:
 * everything up to the top-level comma or the closing parenthesis, with
 * strings, template literals and nested brackets skipped as units.
 */
export function firstArgument(text, open) {
  let depth = 0;
  for (let i = open + 1; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < text.length && text[i] !== c; i++) {
        if (text[i] === '\\') i++;
        else if (c === '`' && text[i] === '$' && text[i + 1] === '{') {
          // Skip the interpolation, counting its braces.
          let braces = 0;
          for (; i < text.length; i++) {
            if (text[i] === '{') braces++;
            else if (text[i] === '}' && --braces === 0) break;
          }
        }
      }
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) return text.slice(open + 1, i);
      depth--;
    } else if (c === ',' && depth === 0) return text.slice(open + 1, i);
  }
  return text.slice(open + 1);
}

/** The quoted literals and template literals of an argument's source. */
export function literalsIn(arg) {
  const quoted = [];
  const templates = [];
  for (const m of arg.matchAll(/(['"])((?:\\.|(?!\1)[^\\\n])*)\1|`((?:\\.|\$\{[^}]*\}|[^`\\])*)`/g)) {
    if (m[3] !== undefined) templates.push(m[3]);
    else quoted.push(m[2]);
  }
  return { quoted, templates };
}

/**
 * A template literal's key pattern: its fixed parts, one key segment (no dot)
 * for each interpolation. Null when it has no fixed dotted prefix.
 */
export function templatePattern(template) {
  const parts = template.split(/\$\{[^}]*\}/);
  if (!/^[a-z][a-zA-Z0-9_]*\./.test(parts[0] ?? '')) return null;
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${parts.map(escape).join('[^.]+')}$`);
}

/**
 * The top-level operator positions of an expression: ternary `?` and `:`,
 * and the `??` and `||` fallbacks. Strings and brackets are skipped as units,
 * `?.` is optional chaining.
 */
function topLevelOperators(expr) {
  const ops = [];
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < expr.length && expr[i] !== c; i++) if (expr[i] === '\\') i++;
    } else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth > 0) continue;
    else if ((c === '?' && expr[i + 1] === '?') || (c === '|' && expr[i + 1] === '|')) ops.push({ op: c + c, at: i++ });
    else if (c === '?' && expr[i + 1] !== '.') ops.push({ op: '?', at: i });
    else if (c === ':') ops.push({ op: ':', at: i });
  }
  return ops;
}

const QUOTED_RE = /^(['"])((?:\\.|(?!\1)[^\\\n])*)\1$/;

/** Whether `e` is one parenthesized expression, its first `(` closing at its last character. */
function wrapsWhole(e) {
  if (!e.startsWith('(') || !e.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < e.length && e[i] !== c; i++) if (e[i] === '\\') i++;
    } else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i === e.length - 1;
  }
  return false;
}

/**
 * The string literals an interpolated expression can produce, and whether
 * those are all it can produce. `x ? 'a' : y ? 'b' : 'c'` gives a, b and c,
 * complete; `role ?? 'editor'` gives editor, incomplete (role is data);
 * `phase` gives nothing. A literal in a condition (`phase === 'start'`) is
 * never a result.
 */
export function interpolationResults(expr) {
  let e = expr.trim();
  while (wrapsWhole(e)) e = e.slice(1, -1).trim();
  const ops = topLevelOperators(e);
  const q = ops.findIndex((o) => o.op === '?');
  if (q >= 0) {
    // The matching `:` of the first `?`: nested ternaries in the consequent raise the count.
    let open = 0;
    for (const o of ops.slice(q + 1)) {
      if (o.op === '?') open++;
      else if (o.op === ':' && open-- === 0) {
        const a = interpolationResults(e.slice(ops[q].at + 1, o.at));
        const b = interpolationResults(e.slice(o.at + 1));
        return { literals: [...a.literals, ...b.literals], complete: a.complete && b.complete };
      }
    }
    return { literals: [], complete: false };
  }
  const fallback = ops.filter((o) => o.op === '??' || o.op === '||');
  if (fallback.length) {
    const operands = [];
    let from = 0;
    for (const o of fallback) {
      operands.push(e.slice(from, o.at));
      from = o.at + 2;
    }
    operands.push(e.slice(from));
    // The left operands are tested values; only the literal ones among them could be produced.
    const literals = operands.flatMap((x) => interpolationResults(x).literals);
    return { literals, complete: false };
  }
  const m = QUOTED_RE.exec(e);
  return m ? { literals: [m[2]], complete: true } : { literals: [], complete: false };
}

/** How many keys a template with only literal choices may expand to before it is read as a pattern instead. */
const MAX_EXPANSION = 64;

/**
 * The references one template literal makes. Interpolations that can only
 * produce string literals (`${open ? 'a' : 'b'}`) are expanded, so each
 * branch is checked as a literal key and a typo in one fails. When some
 * interpolation is data, the template stays a pattern, and each literal an
 * interpolation can still produce (`${role ?? 'editor'}`) is checked with
 * that interpolation fixed, under the original template's allow-list site.
 */
function templateRefs(file, line, template) {
  const parts = template.split(/\$\{([^}]*)\}/);
  const fixed = parts.filter((_, i) => i % 2 === 0);
  const results = parts.filter((_, i) => i % 2 === 1).map(interpolationResults);
  const literal = [];
  const dynamic = [];
  const build = (choices) => fixed.map((f, i) => f + (i < choices.length ? choices[i] : '')).join('');
  const size = results.reduce((n, r) => n * Math.max(r.literals.length, 1), 1);
  if (results.every((r) => r.complete) && size <= MAX_EXPANSION) {
    let keys = [''];
    results.forEach((r, i) => {
      keys = keys.flatMap((k) => r.literals.map((lit) => k + fixed[i] + lit));
    });
    for (const k of keys) literal.push({ file, line, key: k + fixed[fixed.length - 1] });
    return { literal, dynamic };
  }
  dynamic.push({ file, line, template, pattern: templatePattern(template) });
  const raw = parts.filter((_, i) => i % 2 === 1).map((x) => `\${${x}}`);
  results.forEach((r, i) => {
    for (const lit of r.literals) {
      const choices = raw.map((x, j) => (j === i ? lit : x));
      const derived = build(choices);
      if (!derived.includes('${')) literal.push({ file, line, key: derived });
      else dynamic.push({ file, line, template: derived, pattern: templatePattern(derived), site: template });
    }
  });
  return { literal, dynamic };
}

/** Every key reference in one file's source. */
export function scanSource(text, file = '<source>') {
  const literal = [];
  const dynamic = [];
  for (const m of text.matchAll(CALL_RE)) {
    const open = m.index + m[0].length - 1;
    const { quoted, templates } = literalsIn(firstArgument(text, open));
    const line = lineAt(text, m.index);
    for (const key of quoted) {
      if (KEY_RE.test(key)) literal.push({ file, line, key });
      // t('costs.filter.' + f): a prefix with the rest appended, read like a template.
      else if (PREFIX_RE.test(key))
        dynamic.push({ file, line, template: `${key}\${…}`, pattern: templatePattern(`${key}\${…}`) });
    }
    for (const template of templates) {
      if (!template.includes('${')) {
        if (KEY_RE.test(template)) literal.push({ file, line, key: template });
        continue;
      }
      const refs = templateRefs(file, line, template);
      literal.push(...refs.literal);
      dynamic.push(...refs.dynamic);
    }
  }
  for (const m of text.matchAll(KEY_BUILDER_RE)) {
    // Builders of other strings (cache keys) have no fixed dotted prefix and are not translation keys.
    const pattern = templatePattern(m[1]);
    if (pattern) dynamic.push({ file, line: lineAt(text, m.index), template: m[1], pattern });
  }
  for (const re of [HTML_PROP_RE, API_ERROR_RE, KEY_PROP_RE]) {
    for (const m of text.matchAll(re)) {
      if (KEY_RE.test(m[2])) literal.push({ file, line: lineAt(text, m.index), key: m[2] });
    }
  }
  return { literal, dynamic };
}

/** en's keys with the domain file each sits in, read with the shared parity tooling's reader. */
export async function readEnKeyFiles() {
  const { listDomainFiles, readCatalog } = await import(pathToFileURL(join(SHARED_SCRIPTS, 'i18n-catalog.mjs')).href);
  const files = new Map();
  for (const file of listDomainFiles('en')) for (const { key } of readCatalog('en', file)) files.set(key, file);
  if (files.size === 0) throw new Error('shared/src/i18n/en holds no keys: the reader or the path is broken');
  return files;
}

/** en's keys, read from the locale sources with the shared parity tooling's reader. */
export async function readEnKeys() {
  return new Set((await readEnKeyFiles()).keys());
}

export const hasKey = (enKeys, key) => enKeys.has(key) || enKeys.has(`${key}.other`);

const base = (k) => k.replace(/\.(?:zero|one|two|few|many|other)$/, '');

/** How many en keys a pattern reaches, a plural group counted once. */
export function countMatches(pattern, enKeys) {
  const reached = new Set();
  for (const k of enKeys) {
    if (pattern.test(k)) reached.add(k);
    else if (pattern.test(base(k))) reached.add(base(k));
  }
  return reached.size;
}

/**
 * The verdict over a scan: literal keys en lacks, template keys no en key
 * matches, templates too wide to pass without an allow-list entry,
 * allow-list entries that no file uses any more or that the check no longer
 * needs, and the en keys nothing reaches. elsewhere holds the references
 * outside src/ (scanElsewhere), which only count as reaching keys.
 *
 * @param {ReturnType<typeof scanElsewhere>} [elsewhere]
 */
export function evaluate(scan, enKeys, allowed = DYNAMIC_ALLOWED, elsewhere = { literal: [], dynamic: [] }) {
  const missing = scan.literal.filter(({ key }) => !hasKey(enKeys, key));
  const site = (file, template) => `${file}\n${template}`;
  const allowedSites = new Set(allowed.map((a) => site(a.file, a.template)));
  const counts = new Map();
  const reach = (template, pattern) => {
    if (!counts.has(template)) counts.set(template, pattern ? countMatches(pattern, enKeys) : null);
    return counts.get(template);
  };
  const unmatched = [];
  const broad = [];
  for (const d of scan.dynamic) {
    const n = reach(d.template, d.pattern);
    const isAllowed = allowedSites.has(site(d.file, d.site ?? d.template));
    if (n === 0 || (n === null && !isAllowed)) unmatched.push(d);
    else if (n > MAX_IMPLICIT_MATCHES && !isAllowed) broad.push({ ...d, matches: n });
  }
  const usedSites = new Set(scan.dynamic.map((d) => site(d.file, d.site ?? d.template)));
  const stale = allowed.filter((a) => {
    if (!usedSites.has(site(a.file, a.template))) return true;
    if ((a.resolves ?? []).some((k) => !hasKey(enKeys, k))) return true;
    // An entry for a template narrow enough to pass by itself only lengthens the list.
    const n = reach(a.template, templatePattern(a.template));
    return n !== null && n <= MAX_IMPLICIT_MATCHES;
  });
  // References outside src/ (see REFERENCE_ROOTS) only mark keys as reached.
  const reached = new Set([
    ...scan.literal.map((l) => l.key),
    ...elsewhere.literal.map((l) => l.key),
    ...allowed.flatMap((a) => a.resolves ?? []),
  ]);
  const patterns = [...scan.dynamic, ...elsewhere.dynamic].map((d) => d.pattern).filter(Boolean);
  const unused = [...enKeys].filter(
    (k) => !reached.has(k) && !reached.has(base(k)) && !patterns.some((p) => p.test(k) || p.test(base(k)))
  );
  return { missing, unmatched, broad, stale, unused };
}

export function scanTree(root = SRC) {
  if (!existsSync(root)) throw new Error(`${root} does not exist`);
  const scan = { literal: [], dynamic: [] };
  for (const path of walk(root)) {
    const found = scanSource(readFileSync(path, 'utf8'), relative(root, path).split('\\').join('/'));
    scan.literal.push(...found.literal);
    scan.dynamic.push(...found.dynamic);
  }
  if (scan.literal.length === 0) throw new Error(`no translation key found under ${root}: the scanner is broken`);
  return scan;
}

/**
 * Every key reference under the reference roots, for the unused count. A root
 * that is missing or names no key at all is fine here: these are extra places
 * to look, not the code the check is about.
 *
 * @param {string[]} [roots]
 * @returns {{ literal: { file: string, line: number, key: string }[], dynamic: { file: string, line: number, template: string, pattern: RegExp | null, site?: string }[] }}
 */
export function scanElsewhere(roots = REFERENCE_ROOTS) {
  const scan = { literal: [], dynamic: [] };
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const path of walk(root)) {
      const found = scanSource(readFileSync(path, 'utf8'), relative(root, path).split('\\').join('/'));
      scan.literal.push(...found.literal);
      scan.dynamic.push(...found.dynamic);
    }
  }
  return scan;
}

/** The unused keys per en domain file. */
export function unusedPerFile(unused, keyFiles) {
  const counts = {};
  for (const key of unused) {
    const file = keyFiles.get(key);
    if (file) counts[file] = (counts[file] ?? 0) + 1;
  }
  return counts;
}

/**
 * The unused counts held against the baseline: the files that gained unused
 * keys, the entries above their count (or for a file that is gone), and the
 * baseline lowered to today, which --update writes. An entry never rises and
 * a file without one holds no unused key.
 */
export function compareUnused(baseline, counts) {
  const grown = Object.entries(counts).filter(([file, n]) => n > (baseline[file] ?? 0));
  const lowered = {};
  for (const [file, allowed] of Object.entries(baseline)) {
    const now = counts[file] ?? 0;
    if (now > 0) lowered[file] = Math.min(allowed, now);
  }
  const stale = Object.entries(baseline)
    .filter(([file, allowed]) => lowered[file] !== allowed)
    .map(([file, allowed]) => ({ file, allowed, now: counts[file] ?? 0 }));
  return { grown, stale, lowered };
}

/** The committed baseline, which fails closed: a missing or malformed file is an error, never empty. */
export function readUnusedBaseline(path = UNUSED_BASELINE) {
  let value;
  try {
    value = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/i18n-unused-baseline.json cannot be read (${err.message}); restore it from git`);
  }
  const ok =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((n) => Number.isInteger(n) && n > 0);
  if (!ok)
    throw new Error('scripts/i18n-unused-baseline.json is not an object of file → positive count; restore it from git');
  return value;
}

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const scan = scanTree();
    const keyFiles = await readEnKeyFiles();
    const enKeys = new Set(keyFiles.keys());
    const { missing, unmatched, broad, stale, unused } = evaluate(scan, enKeys, DYNAMIC_ALLOWED, scanElsewhere());
    const unusedCounts = unusedPerFile(unused, keyFiles);
    let unusedBaseline = readUnusedBaseline();
    if (process.argv.includes('--update')) {
      unusedBaseline = compareUnused(unusedBaseline, unusedCounts).lowered;
      const sorted = Object.fromEntries(Object.entries(unusedBaseline).sort(([a], [b]) => (a < b ? -1 : 1)));
      writeFileSync(UNUSED_BASELINE, JSON.stringify(sorted, null, 2) + '\n');
    }
    const unusedVerdict = compareUnused(unusedBaseline, unusedCounts);
    for (const { file, line, key } of missing) {
      console.error(`FAIL  ${file}:${line}: '${key}' is not a key in shared/src/i18n/en`);
    }
    for (const { file, line, template } of unmatched) {
      console.error(`FAIL  ${file}:${line}: \`${template}\` matches no key in shared/src/i18n/en`);
    }
    for (const { file, line, template, matches } of broad) {
      console.error(
        `FAIL  ${file}:${line}: \`${template}\` reaches ${matches} en keys, more than ${MAX_IMPLICIT_MATCHES}: ` +
          'narrow the prefix, or add a DYNAMIC_ALLOWED entry saying what bounds the value'
      );
    }
    for (const { file, template } of stale) {
      console.error(
        `FAIL  DYNAMIC_ALLOWED lists \`${template}\` in ${file}, which that file no longer uses, whose keys en ` +
          'lacks, or which is narrow enough to pass without it: remove or fix the entry'
      );
    }
    for (const [file, n] of unusedVerdict.grown) {
      const keys = unused.filter((k) => keyFiles.get(k) === file).slice(0, 5);
      console.error(
        `FAIL  en/${file}: ${n} key(s) nothing in client, server or plugin-sdk reaches, baseline ` +
          `${unusedBaseline[file] ?? 0} (${keys.join(', ')}). Use the key, or delete it from every locale.`
      );
    }
    for (const { file, allowed, now } of unusedVerdict.stale) {
      console.error(
        `FAIL  en/${file} is held at ${allowed} in scripts/i18n-unused-baseline.json, but ${now} key(s) are unused ` +
          'now. Run npm run lint:i18n-keys -- --update to lower it.'
      );
    }
    if (process.argv.includes('--unused')) for (const key of unused.sort()) console.log(`unused  ${key}`);
    console.log(
      `i18n keys: ${new Set(scan.literal.map((l) => l.key)).size} literal and ${scan.dynamic.length} template ` +
        `reference(s) checked against ${enKeys.size} en keys; ${unused.length} en key(s) reached by neither, ` +
        `baseline allows ${Object.values(unusedBaseline).reduce((a, b) => a + b, 0)} (--unused lists them)`
    );
    if (
      missing.length ||
      unmatched.length ||
      broad.length ||
      stale.length ||
      unusedVerdict.grown.length ||
      unusedVerdict.stale.length
    )
      process.exit(1);
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exit(1);
  }
}
