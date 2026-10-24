// @ts-expect-error: plain .mjs script with no .d.ts; import as JS module.
import { listDomainFiles, listLocales, parseCatalog, readCatalog } from '../../scripts/i18n-catalog.mjs';

import { describe, it, expect } from 'vitest';

/**
 * The reader the i18n scripts (parity, the untranslated ratchet, the client's
 * key check) share. It reads the tables as text, so it sees the
 * `// en-fallback` markers, and it refuses what it cannot read rather than
 * skipping it.
 */
const ROOT = new URL('../../scripts/fixtures/i18n/', import.meta.url);

type Entry = { key: string; value: string; marked: boolean; same: boolean; line: number };

describe('i18n catalogue reader', () => {
  it('reads single-line, wrapped, double-quoted and escaped values with their markers', () => {
    const entries = parseCatalog(
      [
        "  'a.one': 'One',",
        "  'a.two':",
        "    'Two, wrapped', // en-fallback",
        `  'a.three': "It's",`,
        "  'a.four': 'Don\\'t \\u00e9',",
        "  'a.five': 'Status', // same-as-en",
      ].join('\r\n'),
    );
    expect(entries.map((e: Entry) => [e.key, e.value, e.marked, e.same])).toEqual([
      ['a.one', 'One', false, false],
      ['a.two', 'Two, wrapped', true, false],
      ['a.three', "It's", false, false],
      ['a.four', "Don't é", false, false],
      ['a.five', 'Status', false, true],
    ]);
  });

  it('refuses a value that is not one string literal instead of skipping it', () => {
    expect(() => parseCatalog("  'a.one': 'One' + 'Two',", 'x.ts')).toThrow(
      /x\.ts:1: 'a\.one' is not a single string literal/,
    );
    expect(() => parseCatalog("  'a.one': `One`,", 'x.ts')).toThrow(/not a single string literal/);
    expect(() => parseCatalog("  'a.one': 'unterminated,", 'x.ts')).toThrow(/not a single string literal/);
  });

  it('lists locales and domain files and reads a table from disk', () => {
    expect(listLocales(ROOT).sort()).toEqual(['de', 'en']);
    expect(listDomainFiles('en', ROOT)).toEqual(['a.ts']);
    const de: Entry[] = readCatalog('de', 'a.ts', ROOT);
    expect(de.find((e) => e.key === 'a.lone')).toMatchObject({ value: 'Remove {count} items', marked: true });
    expect(de.find((e) => e.key === 'a.multi')).toMatchObject({
      value: 'A long sentence that wraps onto the next line',
    });
  });

  it('reads every real locale table', () => {
    for (const locale of listLocales()) {
      for (const file of listDomainFiles(locale)) expect(() => readCatalog(locale, file)).not.toThrow();
    }
  });
});
