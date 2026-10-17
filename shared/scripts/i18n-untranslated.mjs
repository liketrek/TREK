#!/usr/bin/env node
/**
 * i18n:untranslated: English left in the other locales may only shrink.
 *
 * Parity proves every locale has every key, not that the key holds the
 * locale's own language: a copied en string passes it. Two kinds of copy are
 * counted per locale and domain file:
 *
 *   marked     a declaration carrying `// en-fallback`, the marker a
 *              translator leaves on a string they could not translate yet
 *   identical  an unmarked value equal to en's, unless the rule in
 *              `isInvariant` says the text reads the same in every language,
 *              or a translator confirmed a single word with `// same-as-en`
 *              in a Latin-script locale (`isExcused`). A plural form en has
 *              no key for (a Russian `.few` or `.many`) is compared with
 *              every form en spells out for its group (`enReference`).
 *
 * Both counts are held at scripts/i18n-untranslated-baseline.json. The check
 * fails when either grows past its entry (a file without one may hold none),
 * so a feature can no longer ship 26 English copies of a new string. Lowering
 * is a separate, explicit step:
 *
 *   node scripts/i18n-untranslated.mjs            check against the baseline (CI, via i18n-parity --strict)
 *   node scripts/i18n-untranslated.mjs --update   lower the baseline to today's counts; it never raises an
 *                                                 entry and drops the ones that reach zero
 *
 * The two counts are separate on purpose: deleting a marker without
 * translating the string moves it from `marked` to `identical`, and the
 * identical count refuses it.
 *
 * Fails closed: a missing or malformed baseline, a locale lacking one of en's
 * files, or a value the catalogue reader cannot parse is an error, never a
 * pass.
 */
import { pluralFormOf, pluralGroups } from '../src/i18n/plural.ts';
import { asPath, I18N_ROOT, listDomainFiles, listLocales, readCatalog } from './i18n-catalog.mjs';

import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASELINE = join(dirname(fileURLToPath(import.meta.url)), 'i18n-untranslated-baseline.json');

/**
 * Product and service names, which read the same in every language. A value
 * is excused for them, never for an ordinary word: German "Status" or French
 * "Transport" are the locale's own words only by coincidence, and a one-word
 * label copied from en ("Appearance", "Settings") is the commonest untranslated
 * string there is. Names with an inner capital (MapLibre, OpenStreetMap) and
 * acronyms need no entry, the word rule below already skips them.
 */
export const BRAND_NAMES = [
  'Amap',
  'Anthropic',
  'Apple Maps',
  'Atlas',
  'Dawarich',
  'Discord',
  'Docker',
  'Google',
  'Google Maps',
  'Google Places',
  'Home Assistant',
  'Immich',
  'Mapbox',
  'Ntfy',
  'Organic Maps',
  'Polaroid',
  'Synology',
  'Synology Photos',
  'Vacay',
  'Webhook',
  'wanderer',
];

/** Unit symbols, short codes rather than words: "{count} km", "{minutes} min". */
export const UNITS = ['km', 'mi', 'ft', 'min'];

/**
 * Locales written in a script other than Latin. A Latin word left in one of
 * them is English whatever the word, so `// same-as-en` is not honoured
 * there. Every locale folder must be listed in exactly one of the two lists,
 * so a new locale cannot slip past this rule unclassified.
 */
export const NON_LATIN_LOCALES = ['ar', 'gr', 'ja', 'ko', 'ru', 'th', 'uk', 'zh', 'zh-TW'];
export const LATIN_LOCALES = [
  'az',
  'br',
  'ca',
  'cs',
  'de',
  'en',
  'es',
  'et',
  'fr',
  'hu',
  'id',
  'it',
  'nl',
  'pl',
  'sk',
  'sv',
  'tr',
  'vi',
];

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;
const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
// A URL, an e-mail address or a path: anything with a slash or an at sign in it.
const ADDRESS_RE = /\S*[/@]\S*/g;
// Hyphens join a word: "Check-in", "Wi-Fi" and "Auto-Backup" are one each.
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first, so "Google Maps" goes as one name before "Google" could split it.
const NAME_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${[...BRAND_NAMES, ...UNITS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join('|')})(?![\\p{L}\\p{N}])`,
  'gu',
);

/**
 * A word in the sense of the rule: two letters or more and no capital after
 * the first. Single letters (the A and Z of a sort label, the v of
 * "v{version}"), acronyms (GPX, URLs, 2FA) and names with an inner capital
 * (OAuth, AirTrail) are not words here.
 */
export const isPlainWord = (word) => word.length >= 2 && !/\p{Lu}/u.test(word.slice(1));

/**
 * Whether a value equal to en's is legitimately the same text in every
 * language. True when, after dropping placeholders, markup, addresses, the
 * names in BRAND_NAMES and the UNITS, no plain word is left: "{count} km",
 * "OAuth", "GPX", "Google Maps", "Atlas", "PDF · {size}". A single plain word
 * is counted like a phrase: "Budget" and "Status" may be the locale's word too,
 * and that is for a translator to confirm, not for the rule to assume.
 */
export function isInvariant(value) {
  return plainWords(value).length === 0;
}

/** The plain words `value` holds once placeholders, markup, addresses, names and units are dropped. */
export function plainWords(value) {
  const text = value.replace(PLACEHOLDER_RE, ' ').replace(TAG_RE, ' ').replace(ADDRESS_RE, ' ').replace(NAME_RE, ' ');
  return (text.match(WORD_RE) ?? []).filter(isPlainWord);
}

/** Whether `locale` is written in Latin script. Throws for a locale on neither list. */
export function isLatinLocale(locale) {
  if (LATIN_LOCALES.includes(locale)) return true;
  if (NON_LATIN_LOCALES.includes(locale)) return false;
  throw new Error(
    `locale ${locale} is on neither LATIN_LOCALES nor NON_LATIN_LOCALES in scripts/i18n-untranslated.mjs`,
  );
}

/**
 * Whether an unmarked value equal to en's is excused: it is invariant, or a
 * translator marked it `// same-as-en` in a Latin-script locale and it holds
 * one plain word. The marker is for a word that really is the locale's own
 * (German "Status"); a phrase that reads the same as en's is a copy, and the
 * marker on it is ignored rather than trusted.
 */
export const isExcused = (value, same, locale) => {
  const words = plainWords(value);
  return words.length === 0 || (same && isLatinLocale(locale) && words.length === 1);
};

/**
 * Every en value a locale's `key` may not repeat. A key en declares has its
 * en value. A form of a plural group that en does not declare (Russian
 * `.few`, Arabic `.two`) has every form en spells out for the group, since
 * it has no en counterpart of its own and a copy of any of them is English.
 * A form en declares keeps the exact comparison: Italian "{count} file" for
 * en's general "{count} files" is the Italian plural, not en's `.one`.
 */
export function enReference(en, groups) {
  const forms = new Map();
  for (const [key, value] of en) {
    const base = groupOf(key, groups);
    if (base !== null) {
      if (!forms.has(base)) forms.set(base, new Set());
      forms.get(base).add(value);
    }
  }
  return (key) => {
    if (en.has(key)) return new Set([en.get(key)]);
    const base = groupOf(key, groups);
    return base === null ? new Set() : (forms.get(base) ?? new Set());
  };
}

/** The plural group `key` belongs to (its base, `key.other` or a category form), else null. */
function groupOf(key, groups) {
  if (groups.has(key)) return key;
  if (key.endsWith('.other') && groups.has(key.slice(0, -'.other'.length))) return key.slice(0, -'.other'.length);
  return pluralFormOf(key, groups)?.base ?? null;
}

/**
 * Today's counts: `{ [locale]: { [file]: { marked, identical } } }`, only
 * non-zero entries. Throws on a locale missing one of en's files, a locale
 * on neither script list or a value the reader cannot parse.
 */
export function countUntranslated(root = I18N_ROOT) {
  const locales = listLocales(root);
  if (!locales.includes('en')) throw new Error(`${asPath(root)}/en is required as the reference locale`);
  const enFiles = listDomainFiles('en', root);
  const enValues = new Map(
    enFiles.map((f) => {
      const en = new Map(readCatalog('en', f, root).map((e) => [e.key, e.value]));
      return [f, enReference(en, pluralGroups(en.keys()))];
    }),
  );
  const counts = {};
  for (const locale of locales) {
    // Classify every folder first: an unlisted locale is an error, not a pass.
    isLatinLocale(locale);
    if (locale === 'en') continue;
    const files = new Set(listDomainFiles(locale, root));
    for (const file of enFiles) {
      if (!files.has(file)) throw new Error(`${locale}/${file} is missing; run i18n-parity for the file report`);
      const enValuesOf = enValues.get(file);
      let marked = 0;
      let identical = 0;
      for (const { key, value, marked: isMarked, same } of readCatalog(locale, file, root)) {
        if (isMarked) marked++;
        else if (enValuesOf(key).has(value) && !isExcused(value, same, locale)) identical++;
      }
      if (marked || identical) (counts[locale] ??= {})[file] = { marked, identical };
    }
  }
  return counts;
}

/** The committed baseline. Throws when it is missing or not the expected shape. */
export function readBaseline(path = BASELINE) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${path} cannot be read: ${err.message}. Restore it from git before running the check again.`);
  }
  const isCount = (n) => Number.isInteger(n) && n >= 0;
  const valid =
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Object.values(parsed).every(
      (files) =>
        files !== null &&
        typeof files === 'object' &&
        Object.values(files).every(
          (entry) => entry !== null && typeof entry === 'object' && isCount(entry.marked) && isCount(entry.identical),
        ),
    );
  if (!valid) throw new Error(`${path} is not a { locale: { file: { marked, identical } } } map of whole numbers`);
  return parsed;
}

const ZERO = { marked: 0, identical: 0 };

/** Every count above its baseline entry, and how many entries could come down. */
export function compare(counts, baseline) {
  const grown = [];
  let lowerable = 0;
  for (const [locale, files] of Object.entries(counts)) {
    for (const [file, now] of Object.entries(files)) {
      const allowed = baseline[locale]?.[file] ?? ZERO;
      for (const kind of ['marked', 'identical']) {
        if (now[kind] > allowed[kind]) grown.push({ locale, file, kind, now: now[kind], allowed: allowed[kind] });
      }
    }
  }
  for (const [locale, files] of Object.entries(baseline)) {
    for (const [file, allowed] of Object.entries(files)) {
      const now = counts[locale]?.[file] ?? ZERO;
      if (now.marked < allowed.marked || now.identical < allowed.identical) lowerable++;
    }
  }
  return { grown, lowerable };
}

/** The baseline lowered to `counts`: never raised, zero entries dropped, sorted. */
export function lowered(counts, baseline) {
  const out = {};
  for (const locale of Object.keys(baseline).sort()) {
    for (const file of Object.keys(baseline[locale]).sort()) {
      const allowed = baseline[locale][file];
      const now = counts[locale]?.[file] ?? ZERO;
      const entry = {
        marked: Math.min(allowed.marked, now.marked),
        identical: Math.min(allowed.identical, now.identical),
      };
      if (entry.marked || entry.identical) (out[locale] ??= {})[file] = entry;
    }
  }
  return out;
}

/** The baseline as committed: one line per file, so a diff shows which counts came down. */
export function serialize(baseline) {
  const locales = Object.keys(baseline).map((locale) => {
    const files = Object.entries(baseline[locale]).map(
      ([file, { marked, identical }]) =>
        `    ${JSON.stringify(file)}: { "marked": ${marked}, "identical": ${identical} }`,
    );
    return `  ${JSON.stringify(locale)}: {\n${files.join(',\n')}\n  }`;
  });
  return `{\n${locales.join(',\n')}\n}\n`;
}

export function formatGrown(grown) {
  return grown.map(
    ({ locale, file, kind, now, allowed }) =>
      `  ${locale}/${file}: ${now} ${kind === 'marked' ? 'marked en-fallback' : 'unmarked English copies'}, ` +
      `the baseline allows ${allowed}`,
  );
}

const total = (map, kind) =>
  Object.values(map)
    .flatMap((files) => Object.values(files))
    .reduce((sum, e) => sum + e[kind], 0);

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const counts = countUntranslated();
    let baseline = readBaseline();
    if (process.argv.includes('--update')) {
      baseline = lowered(counts, baseline);
      writeFileSync(BASELINE, serialize(baseline));
    }
    const { grown, lowerable } = compare(counts, baseline);
    if (grown.length) {
      console.error('Untranslated strings grew past scripts/i18n-untranslated-baseline.json:');
      for (const line of formatGrown(grown)) console.error(line);
      console.error('Translate the new strings (shared/CLAUDE.md: an English placeholder is not acceptable).');
    }
    if (lowerable && !process.argv.includes('--update')) {
      console.log(
        `${lowerable} baseline entr${lowerable === 1 ? 'y is' : 'ies are'} above today's count: run with --update to lower.`,
      );
    }
    console.log(
      `untranslated: ${total(counts, 'marked')} marked en-fallback, ${total(counts, 'identical')} unmarked English copies`,
    );
    if (grown.length) process.exit(1);
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exit(1);
  }
}
