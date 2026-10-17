import {
  compare,
  countUntranslated,
  isExcused,
  isInvariant,
  lowered,
  readBaseline,
  serialize,
  // @ts-expect-error: plain .mjs script with no .d.ts; import as JS module.
} from '../../scripts/i18n-untranslated.mjs';

import { describe, it, expect } from 'vitest';

/**
 * The untranslated-strings ratchet (scripts/i18n-untranslated.mjs). The
 * fixtures under scripts/fixtures/ hold a two-locale table with one marked
 * fallback, two unmarked English copies and the invariant strings the rule
 * excuses; i18n-words/ holds the one-word cases per script.
 */
const FIXTURES = new URL('../../scripts/fixtures/', import.meta.url);
const ROOT = new URL('i18n/', FIXTURES);

type Counts = Record<string, Record<string, { marked: number; identical: number }>>;

describe('i18n untranslated ratchet', () => {
  it('excuses placeholders, codes, units and names, never an ordinary word or a phrase', () => {
    for (const same of [
      '{count} km',
      '{minutes} min',
      'GPX',
      'OAuth',
      'Google Maps',
      'Atlas',
      'Mapbox (3D)',
      'Dawarich {version}',
      'PDF · {size}',
      'https://ntfy.sh',
      'your@email.com',
      '<b>{name}</b>',
    ]) {
      expect([same, isInvariant(same)]).toEqual([same, true]);
    }
    for (const copy of [
      'Settings',
      'Appearance',
      'Readability',
      'Budget',
      'Check-in',
      'Atlases',
      'Name (A\u2013Z)',
      'Update → v{version}',
      'Trip settings',
      'Remove {count} items',
      'Open in Google Maps',
      'Source code',
      'Made with TREK',
    ]) {
      expect([copy, isInvariant(copy)]).toEqual([copy, false]);
    }
  });

  it('honours // same-as-en in a Latin-script locale only, and refuses an unlisted locale', () => {
    expect(isExcused('Status', true, 'de')).toBe(true);
    expect(isExcused('Status: {state}', true, 'de')).toBe(true);
    expect(isExcused('Delete this trip and all its places permanently', true, 'de')).toBe(false);
    expect(isExcused('Source code', true, 'de')).toBe(false);
    expect(isExcused('Status', false, 'de')).toBe(false);
    expect(isExcused('Status', true, 'ja')).toBe(false);
    expect(isExcused('GPX', false, 'ja')).toBe(true);
    expect(() => isExcused('Status', true, 'xx')).toThrow(/neither LATIN_LOCALES nor NON_LATIN_LOCALES/);
  });

  it('counts a one-word English copy: Settings in fr, Appearance in ja', () => {
    expect(countUntranslated(new URL('i18n-words/', FIXTURES))).toEqual({
      // The copied sentence carries // same-as-en, which only a single word earns.
      de: { 'a.ts': { marked: 0, identical: 1 } },
      fr: { 'a.ts': { marked: 0, identical: 2 } },
      ja: { 'a.ts': { marked: 0, identical: 2 } },
    });
  });

  it('counts a plural form en has no key for when it holds any of en’s forms', () => {
    // ru copies en's general form into the base and `few`, and en's `one` into `many`.
    expect(countUntranslated(new URL('i18n-plural/', FIXTURES))).toEqual({
      ru: { 'a.ts': { marked: 0, identical: 3 } },
    });
  });

  it('fails closed on a locale folder on neither script list', () => {
    expect(() => countUntranslated(new URL('i18n-unlisted/', FIXTURES))).toThrow(/locale xx is on neither/);
  });

  it('counts marked fallbacks and unmarked English copies per locale and file', () => {
    expect(countUntranslated(ROOT)).toEqual({ de: { 'a.ts': { marked: 1, identical: 2 } } });
  });

  it('fails when a count grows past its entry and when a file without one has any', () => {
    const counts: Counts = { de: { 'a.ts': { marked: 1, identical: 3 } }, fr: { 'b.ts': { marked: 1, identical: 0 } } };
    const baseline: Counts = { de: { 'a.ts': { marked: 2, identical: 2 } } };
    const { grown, lowerable } = compare(counts, baseline);
    expect(grown).toEqual([
      { locale: 'de', file: 'a.ts', kind: 'identical', now: 3, allowed: 2 },
      { locale: 'fr', file: 'b.ts', kind: 'marked', now: 1, allowed: 0 },
    ]);
    expect(lowerable).toBe(1);
  });

  it('refuses a marker deleted without translating the string', () => {
    const before: Counts = { de: { 'a.ts': { marked: 1, identical: 2 } } };
    const markerDropped: Counts = { de: { 'a.ts': { marked: 0, identical: 3 } } };
    expect(compare(markerDropped, before).grown).toHaveLength(1);
  });

  it('only ever lowers the baseline on --update and drops entries that reach zero', () => {
    const baseline: Counts = {
      de: { 'a.ts': { marked: 2, identical: 2 }, 'b.ts': { marked: 1, identical: 0 } },
    };
    const counts: Counts = { de: { 'a.ts': { marked: 3, identical: 1 } } };
    expect(lowered(counts, baseline)).toEqual({ de: { 'a.ts': { marked: 2, identical: 1 } } });
  });

  it('writes one line per file and reads back what it wrote', () => {
    const baseline: Counts = { de: { 'a.ts': { marked: 2, identical: 1 } } };
    const text = serialize(baseline);
    expect(text).toBe('{\n  "de": {\n    "a.ts": { "marked": 2, "identical": 1 }\n  }\n}\n');
    expect(JSON.parse(text)).toEqual(baseline);
  });

  it('fails closed on a missing, unparsable or misshapen baseline', () => {
    expect(() => readBaseline(new URL('missing.json', FIXTURES))).toThrow(/cannot be read/);
    expect(() => readBaseline(new URL('baseline-broken.json', FIXTURES))).toThrow(/cannot be read/);
    expect(() => readBaseline(new URL('baseline-shape.json', FIXTURES))).toThrow(/whole numbers/);
  });

  it('fails closed on a locale that lacks one of en’s files', () => {
    expect(() => countUntranslated(new URL('i18n-missing/', FIXTURES))).toThrow(/fr\/a\.ts is missing/);
  });

  it('holds the real locales at the committed baseline', () => {
    expect(compare(countUntranslated(), readBaseline()).grown).toEqual([]);
  });
});
