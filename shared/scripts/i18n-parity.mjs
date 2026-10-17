#!/usr/bin/env node
// i18n parity check — keeps Julien's "every locale = same files + keys as en"
// DoD honest over time.
//
// What it checks per non-en locale:
//   1. File set parity: every domain file that exists in en/ must exist in this
//      locale's dir; no extra domain files allowed.
//   2. Key set parity: for each shared domain file, the top-level translation
//      keys must match exactly (no missing, no extra).
//
// Output: structured report grouped by locale, plus a `--strict` flag that
// returns exit-code 1 when any drift is present (intended for CI). Without
// `--strict` the script exits 0 and prints, so it can also run as a non-blocking
// audit during translation work.
//   3. Plural forms: a count-bearing string (`key` or `key.other`, plus at
//      least one of `key.zero|one|two|few|many` in en) is a plural group. Its
//      category keys are not compared with en's, since Russian needs `.few`
//      and `.many` and Japanese needs none. Instead every locale must spell
//      out each category whole counts reach in its language, and may not
//      carry one its language never selects. The rules come from
//      `Intl.PluralRules`, through the same helpers the client resolves with.
//   4. Count strings: an en string carrying {count} or {n} (the two params
//      `t()` picks a plural form by) must be a plural group, so every
//      language gets the forms it needs. So must one carrying a quantity
//      under another name ({days}, {minutes}, {objects}, QUANTITY_PARAMS),
//      which no form is picked by: it is renamed to {count}. The exceptions
//      are NOT_PLURAL: a number that is never a quantity ("Day {n}", a step,
//      a multiplier), or one followed only by a unit symbol.
//   5. Untranslated strings: the marked `// en-fallback` and unmarked English
//      copies per locale and file may only shrink (i18n-untranslated.mjs,
//      which also lowers the baseline with --update).
//
// Limitations: we only parse *top-level* string keys (those declared as the
// first column of the file, matching the regex below). Nested objects, function
// bodies, and inline comments are ignored. This matches how `t(key)` calls
// resolve at runtime in TranslationContext.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getIntlLanguage } from '../src/i18n/languages.ts';
import { allPluralCategories, integerPluralCategories, pluralFormOf, pluralGroups } from '../src/i18n/plural.ts';
import { I18N_ROOT, listDomainFiles, listLocales, readCatalog } from './i18n-catalog.mjs';
import { compare, countUntranslated, formatGrown, readBaseline } from './i18n-untranslated.mjs';

// Match a top-level translation key declaration: leading whitespace, then a
// quoted key (must start with a lowercase letter), then a colon. This is the
// exact pattern every domain file uses. Keys may hold a colon themselves
// (admin.plugins.perm.db:read:trips); without it in the class those keys were
// never compared, and two locales lacked dozens of them unnoticed.
const TOP_LEVEL_KEY_RE = /^\s*'([a-z][a-zA-Z0-9.\-_:]*)'\s*:/gm;

function extractKeys(locale, file) {
  const content = readFileSync(join(I18N_ROOT, locale, file), 'utf8');
  const keys = new Set();
  for (const match of content.matchAll(TOP_LEVEL_KEY_RE)) {
    keys.add(match[1]);
  }
  return keys;
}

function withoutVariants(keys, groups) {
  return new Set([...keys].filter((k) => !pluralFormOf(k, groups)));
}

/** What one locale owes the plural groups of one file. */
function checkPluralForms(locale, keys, groups) {
  const intl = getIntlLanguage(locale);
  const required = integerPluralCategories(intl).filter((c) => c !== 'other');
  const allowed = new Set(allPluralCategories(intl));
  const missing = [];
  const invalid = [];
  for (const base of groups) {
    for (const c of required) if (!keys.has(`${base}.${c}`)) missing.push(`${base}.${c}`);
  }
  for (const key of keys) {
    const form = pluralFormOf(key, groups);
    if (form && !allowed.has(form.category)) invalid.push(key);
  }
  return { missing, invalid };
}

/**
 * en strings that carry {count} or {n} without being a quantity of
 * something, so no word in any language agrees with the number. Everything
 * else with a count is a plural group. An entry that stops matching an
 * ungrouped count string fails the check, so the list cannot go stale.
 */
export const NOT_PLURAL = [
  { key: 'collab.polls.optionPlaceholder', because: 'the position of a poll option ("Option 3")' },
  { key: 'collections.importOnDay', because: 'the number of the day a place is planned on' },
  { key: 'dashboard.atlas.aroundEquator', because: 'a decimal multiplier ("≈ 1.37×"), not a count of things' },
  { key: 'dayplan.dayN', because: 'the number of a day in the trip' },
  { key: 'planner.dayN', because: 'the number of a day in the trip' },
  { key: 'help.center.step', because: 'the position of a step in a guide' },
  { key: 'help.center.stepOf', because: 'the position of a step in a guide' },
  { key: 'help.center.imageAlt', because: 'the position of a step in a guide' },
  { key: 'system_notice.pager.goto', because: 'the position of a notice in the pager' },
  { key: 'tours.addedToDay', because: 'the number of the day a tour was added to' },
  { key: 'tours.planner.waypointLabel', because: 'the position of a waypoint on the tour' },
  { key: 'dawarich.duration.minutes', because: 'a duration in a unit symbol (min), the same for any number' },
  { key: 'dawarich.duration.hours', because: 'a duration in a unit symbol (h), the same for any number' },
  { key: 'dawarich.duration.hoursMinutes', because: 'a duration in unit symbols (h, min), the same for any number' },
  { key: 'files.uploadErrorSize', because: 'a size limit in a unit symbol (MB), the same for any number' },
];

/**
 * Param names that hold a quantity of something but are not the ones `t()`
 * picks a plural form by. A string using one keeps a single form in every
 * language ("Все {days} дней" for 2 days), so it is held like {count}: rename
 * the param to {count} and make the string a plural group.
 */
export const QUANTITY_PARAMS = [
  'days',
  'nights',
  'weeks',
  'months',
  'years',
  'hours',
  'minutes',
  'seconds',
  'items',
  'objects',
  'max',
];

const COUNT_PARAM_RE = new RegExp(`\\{(?:count|n|${QUANTITY_PARAMS.join('|')})\\}`);

/**
 * en strings carrying a count or quantity param outside any plural group,
 * and NOT_PLURAL entries that no longer name such a string.
 */
function checkCountStrings(enFiles, notPlural = NOT_PLURAL, root = I18N_ROOT) {
  const allowed = new Set(notPlural.map((e) => e.key));
  const ungrouped = [];
  const seen = new Set();
  for (const file of enFiles) {
    const entries = readCatalog('en', file, root);
    const groups = pluralGroups(entries.map((e) => e.key));
    for (const { key, value } of entries) {
      if (!COUNT_PARAM_RE.test(value) || groups.has(key) || pluralFormOf(key, groups)) continue;
      if (key.endsWith('.other') && groups.has(key.slice(0, -'.other'.length))) continue;
      if (allowed.has(key)) seen.add(key);
      else ungrouped.push({ file, key });
    }
  }
  return { ungrouped, stale: [...allowed].filter((key) => !seen.has(key)) };
}

/** The untranslated ratchet's verdict, with a reading error reported rather than thrown. */
function checkUntranslated() {
  try {
    const { grown, lowerable } = compare(countUntranslated(), readBaseline());
    return { error: null, grown, lowerable };
  } catch (err) {
    return { error: err.message, grown: [], lowerable: 0 };
  }
}

function diffSets(reference, candidate) {
  const missing = [];
  const extra = [];
  for (const k of reference) if (!candidate.has(k)) missing.push(k);
  for (const k of candidate) if (!reference.has(k)) extra.push(k);
  return { missing, extra };
}

function checkParity() {
  const locales = listLocales();
  if (!locales.includes('en')) {
    throw new Error('shared/src/i18n/en is required as the reference locale');
  }
  const enFiles = listDomainFiles('en');
  const enKeysByDomain = new Map();
  for (const f of enFiles) enKeysByDomain.set(f, extractKeys('en', f));

  const report = { fileDrift: [], keyDrift: [], pluralDrift: [] };
  const groupsByDomain = new Map();
  for (const f of enFiles) {
    const groups = pluralGroups(enKeysByDomain.get(f));
    groupsByDomain.set(f, groups);
    const { missing, invalid } = checkPluralForms('en', enKeysByDomain.get(f), groups);
    if (missing.length || invalid.length) report.pluralDrift.push({ locale: 'en', file: f, missing, invalid });
  }

  for (const locale of locales) {
    if (locale === 'en') continue;

    const localeFiles = listDomainFiles(locale);
    const { missing: missingFiles, extra: extraFiles } = diffSets(
      new Set(enFiles),
      new Set(localeFiles),
    );

    if (missingFiles.length || extraFiles.length) {
      report.fileDrift.push({ locale, missing: missingFiles, extra: extraFiles });
    }

    for (const file of enFiles) {
      if (!localeFiles.includes(file)) continue;
      const localeKeys = extractKeys(locale, file);
      const groups = groupsByDomain.get(file);
      const { missing, extra } = diffSets(
        withoutVariants(enKeysByDomain.get(file), groups),
        withoutVariants(localeKeys, groups),
      );
      if (missing.length || extra.length) {
        report.keyDrift.push({ locale, file, missing, extra });
      }
      const plural = checkPluralForms(locale, localeKeys, groups);
      if (plural.missing.length || plural.invalid.length) {
        report.pluralDrift.push({ locale, file, ...plural });
      }
    }
  }

  report.countDrift = checkCountStrings(enFiles);
  report.untranslated = checkUntranslated();
  return report;
}

function formatReport(report) {
  const lines = [];

  if (report.fileDrift.length === 0) {
    lines.push('File parity: OK');
  } else {
    lines.push(`File parity: ${report.fileDrift.length} locale(s) with file drift`);
    for (const { locale, missing, extra } of report.fileDrift) {
      if (missing.length) lines.push(`  ${locale}: missing ${missing.join(', ')}`);
      if (extra.length) lines.push(`  ${locale}: extra ${extra.join(', ')}`);
    }
  }

  if (report.keyDrift.length === 0) {
    lines.push('Key parity: OK');
  } else {
    lines.push(`Key parity: ${report.keyDrift.length} domain file(s) with key drift`);
    for (const { locale, file, missing, extra } of report.keyDrift) {
      const parts = [];
      if (missing.length) parts.push(`missing ${missing.length} (e.g. ${missing.slice(0, 3).join(', ')})`);
      if (extra.length) parts.push(`extra ${extra.length} (e.g. ${extra.slice(0, 3).join(', ')})`);
      lines.push(`  ${locale}/${file}: ${parts.join('; ')}`);
    }
  }

  if (report.pluralDrift.length === 0) {
    lines.push('Plural forms: OK');
  } else {
    lines.push(`Plural forms: ${report.pluralDrift.length} domain file(s) with missing or impossible forms`);
    for (const { locale, file, missing, invalid } of report.pluralDrift) {
      const parts = [];
      if (missing.length) parts.push(`missing ${missing.join(', ')}`);
      if (invalid.length) parts.push(`never selected ${invalid.join(', ')}`);
      lines.push(`  ${locale}/${file}: ${parts.join('; ')}`);
    }
  }

  if (report.countDrift) {
    const { ungrouped, stale } = report.countDrift;
    if (ungrouped.length === 0 && stale.length === 0) {
      lines.push('Count strings: OK');
    } else {
      lines.push('Count strings: en strings with {count}, {n} or a quantity param that are no plural group');
      for (const { file, key } of ungrouped) {
        lines.push(
          `  en/${file}: ${key} (name the quantity {count} and add ${key}.one and the other forms, see shared/CLAUDE.md)`,
        );
      }
      for (const key of stale) lines.push(`  NOT_PLURAL lists ${key}, which is no ungrouped count string: remove it`);
    }
  }

  if (report.untranslated) {
    const { error, grown, lowerable } = report.untranslated;
    if (error) {
      lines.push(`Untranslated strings: cannot check, ${error}`);
    } else if (grown.length === 0) {
      lines.push(
        'Untranslated strings: OK' +
          (lowerable ? ` (${lowerable} baseline entries can come down: node scripts/i18n-untranslated.mjs --update)` : ''),
      );
    } else {
      lines.push('Untranslated strings: grew past scripts/i18n-untranslated-baseline.json');
      lines.push(...formatGrown(grown));
    }
  }

  return lines.join('\n');
}

// Export a structured API for vitest. The CLI entry point only runs when
// executed directly (`node scripts/i18n-parity.mjs`), so importing this file
// from a spec does not produce side effects.
export { checkCountStrings, checkParity, formatReport };

const isCli = process.argv[1] && process.argv[1].endsWith('i18n-parity.mjs');
if (isCli) {
  const strict = process.argv.includes('--strict');
  const filesOnly = process.argv.includes('--files-only');
  const report = checkParity();
  const shown = filesOnly ? { ...report, keyDrift: [], pluralDrift: [], countDrift: null, untranslated: null } : report;
  process.stdout.write(formatReport(shown) + '\n');

  if (strict) {
    const hasFileDrift = report.fileDrift.length > 0;
    const hasKeyDrift = filesOnly ? false : report.keyDrift.length > 0 || report.pluralDrift.length > 0;
    const hasCountDrift = !filesOnly && (report.countDrift.ungrouped.length > 0 || report.countDrift.stale.length > 0);
    const hasUntranslated = !filesOnly && (report.untranslated.error !== null || report.untranslated.grown.length > 0);
    if (hasFileDrift || hasKeyDrift || hasCountDrift || hasUntranslated) process.exit(1);
  }
}
