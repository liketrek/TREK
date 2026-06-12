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
//
// Limitations: we only parse *top-level* string keys (those declared as the
// first column of the file, matching the regex below). Nested objects, function
// bodies, and inline comments are ignored. This matches how `t(key)` calls
// resolve at runtime in TranslationContext.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const i18nRoot = join(here, '..', 'src', 'i18n');

// Match a top-level translation key declaration: leading whitespace, then a
// quoted key (must start with a lowercase letter), then a colon. This is the
// exact pattern every domain file uses.
const TOP_LEVEL_KEY_RE = /^\s*'([a-z][a-zA-Z0-9.\-_]*)'\s*:/gm;

function listLocales() {
  return readdirSync(i18nRoot)
    .filter((name) => statSync(join(i18nRoot, name)).isDirectory())
    // externalNotifications is a barrel module, not a locale.
    .filter((name) => name !== 'externalNotifications');
}

function listDomainFiles(locale) {
  return readdirSync(join(i18nRoot, locale))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
}

function extractKeys(locale, file) {
  const content = readFileSync(join(i18nRoot, locale, file), 'utf8');
  const keys = new Set();
  for (const match of content.matchAll(TOP_LEVEL_KEY_RE)) {
    keys.add(match[1]);
  }
  return keys;
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

  const report = { fileDrift: [], keyDrift: [] };

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
      const { missing, extra } = diffSets(enKeysByDomain.get(file), localeKeys);
      if (missing.length || extra.length) {
        report.keyDrift.push({ locale, file, missing, extra });
      }
    }
  }

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

  return lines.join('\n');
}

// Export a structured API for vitest. The CLI entry point only runs when
// executed directly (`node scripts/i18n-parity.mjs`), so importing this file
// from a spec does not produce side effects.
export { checkParity, formatReport };

const isCli = process.argv[1] && process.argv[1].endsWith('i18n-parity.mjs');
if (isCli) {
  const strict = process.argv.includes('--strict');
  const filesOnly = process.argv.includes('--files-only');
  const report = checkParity();
  process.stdout.write(formatReport(filesOnly ? { ...report, keyDrift: [] } : report) + '\n');

  if (strict) {
    const hasFileDrift = report.fileDrift.length > 0;
    const hasKeyDrift = filesOnly ? false : report.keyDrift.length > 0;
    if (hasFileDrift || hasKeyDrift) process.exit(1);
  }
}
