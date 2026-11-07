/// <reference types="vite/client" />
import type { TranslationStrings } from './types';

import { describe, expect, it } from 'vitest';

/**
 * The strings of the app's own first screens (client/native-shell: welcome,
 * the server address, TREK Cloud, the plans) carry no dash as punctuation in
 * any language: no em dash, no en dash, no spaced hyphen. A pause is a colon,
 * a comma or a new sentence. These screens are the first thing a new user
 * reads, and the style is held here because a re-translation can bring a dash
 * back without any other check noticing.
 */
const nativeModules = import.meta.glob<{ default: TranslationStrings }>('./*/native.ts', { eager: true });

const DASH = /[‒–—―]| - /;

describe('native shell wording', () => {
  it('I18N-NATIVE-DASH-001: every locale has its native strings', () => {
    expect(Object.keys(nativeModules).length).toBeGreaterThanOrEqual(27);
  });

  it('I18N-NATIVE-DASH-002: no native string uses a dash as punctuation, in any locale', () => {
    const offenders: string[] = [];
    for (const [file, mod] of Object.entries(nativeModules)) {
      for (const [key, value] of Object.entries(mod.default)) {
        if (typeof value === 'string' && DASH.test(value)) offenders.push(`${file} ${key}: ${value}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
