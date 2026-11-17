/// <reference types="node" />
import type { TranslationStrings } from './types';

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The strings of the app's own first screens (client/native-shell: welcome,
 * the server address, TREK Cloud, the plans) carry no dash as punctuation in
 * any language: no em dash, no en dash, no spaced hyphen. A pause is a colon,
 * a comma or a new sentence. These screens are the first thing a new user
 * reads, and the style is held here because a re-translation can bring a dash
 * back without any other check noticing.
 */
const here = dirname(fileURLToPath(import.meta.url));
const locales = readdirSync(here, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(here, entry.name, 'native.ts')))
  .map((entry) => entry.name);
const nativeModules: Record<string, { default: TranslationStrings }> = Object.fromEntries(
  await Promise.all(
    locales.map(async (locale) => [
      `./${locale}/native.ts`,
      (await import(`./${locale}/native.ts`)) as { default: TranslationStrings },
    ]),
  ),
);

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
