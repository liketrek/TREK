// @ts-expect-error — plain .mjs script with no .d.ts; import as JS module.
import { checkCountStrings, checkParity, NOT_PLURAL } from '../../scripts/i18n-parity.mjs';

import { describe, it, expect } from 'vitest';

/**
 * Enforces the file-set contract for the i18n migration: every non-en locale
 * dir must contain the exact same domain files as en/.
 *
 * Key-set drift is intentionally NOT enforced here — translation work happens
 * gradually and gating CI on every newly-added EN key would block feature
 * merges. The CLI script still prints the key-drift report so translators can
 * see what they owe; only file-level drift is a structural bug.
 */
describe('i18n parity', () => {
  it('every locale has the same domain files as en', () => {
    const report = checkParity();
    expect(report.fileDrift).toEqual([]);
  });

  it('reports key drift as data (not enforced, used by the CLI tool)', () => {
    const report = checkParity();
    // We do not assert here — translation drift is expected and acceptable.
    // The shape check just confirms the report contract for tooling consumers.
    expect(Array.isArray(report.keyDrift)).toBe(true);
    for (const entry of report.keyDrift) {
      expect(typeof entry.locale).toBe('string');
      expect(typeof entry.file).toBe('string');
      expect(Array.isArray(entry.missing)).toBe(true);
      expect(Array.isArray(entry.extra)).toBe(true);
    }
  });
});

describe('i18n count strings', () => {
  const ROOT = new URL('../../scripts/fixtures/i18n/', import.meta.url);

  it('refuses an en string with {count}, {n} or a quantity param outside a plural group', () => {
    const { ungrouped, stale } = checkCountStrings(['a.ts'], [], ROOT);
    // a.stay carries its quantity as {days}, which no plural form is picked by.
    expect(ungrouped).toEqual([
      { file: 'a.ts', key: 'a.lone' },
      { file: 'a.ts', key: 'a.day' },
      { file: 'a.ts', key: 'a.stay' },
    ]);
    expect(stale).toEqual([]);
  });

  it('lets a number that is no quantity through NOT_PLURAL, and refuses a stale entry', () => {
    const allowed = [
      { key: 'a.day', because: 'a day number' },
      { key: 'a.count', because: 'a group now' },
    ];
    expect(checkCountStrings(['a.ts'], allowed, ROOT)).toEqual({
      ungrouped: [
        { file: 'a.ts', key: 'a.lone' },
        { file: 'a.ts', key: 'a.stay' },
      ],
      stale: ['a.count'],
    });
  });

  it('every NOT_PLURAL entry says why', () => {
    for (const { because } of NOT_PLURAL) expect(because.length).toBeGreaterThan(10);
  });

  it('every count-bearing en string is a plural group or on NOT_PLURAL', () => {
    const report = checkParity();
    expect(report.countDrift).toEqual({ ungrouped: [], stale: [] });
    expect(report.untranslated.error).toBeNull();
    expect(report.untranslated.grown).toEqual([]);
  });
});
