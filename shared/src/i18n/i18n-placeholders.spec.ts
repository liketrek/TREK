import ar from './ar';
import br from './br';
import ca from './ca';
import cs from './cs';
import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import gr from './gr';
import hu from './hu';
import id from './id';
import itIT from './it';
import ja from './ja';
import ko from './ko';
import nl from './nl';
import pl from './pl';
import ru from './ru';
import sv from './sv';
import tr from './tr';
import type { TranslationStrings } from './types';
import uk from './uk';
import vi from './vi';
import zh from './zh';
import zhTW from './zh-TW';

import { describe, it, expect } from 'vitest';

/**
 * Placeholder parity: every `{placeholder}` present in an EN string must also
 * appear (untranslated) in each locale's translation of that key.
 *
 * This guards against the class of bug behind issue #1611's "Failed to connect
 * to Immich" report: locales that hardcoded a provider name where EN uses
 * `{provider_name}`, so the Synology banner showed "Immich". It also catches
 * translated placeholder names (e.g. `{versiyon}`), which render literally.
 *
 * Only keys the locale actually translates are checked — missing keys are
 * key-set drift, handled (as unenforced data) by i18n-parity.spec.ts.
 */
const LOCALES: Record<string, TranslationStrings> = {
  ar,
  br,
  ca,
  cs,
  de,
  es,
  fr,
  gr,
  hu,
  id,
  it: itIT,
  ja,
  ko,
  nl,
  pl,
  ru,
  sv,
  tr,
  uk,
  vi,
  zh,
  'zh-TW': zhTW,
};

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;

describe('i18n placeholder parity', () => {
  it('every EN placeholder appears in each locale translation of the same key', () => {
    const violations: string[] = [];

    for (const [enKey, enValue] of Object.entries(en)) {
      // A few catalog entries are structured data, not strings
      // (e.g. packing.suggestions.items) — placeholders only apply to strings.
      if (typeof enValue !== 'string') continue;
      const placeholders = enValue.match(PLACEHOLDER_RE);
      if (!placeholders) continue;

      for (const [locale, catalog] of Object.entries(LOCALES)) {
        const translated = catalog[enKey];
        if (typeof translated !== 'string') continue;
        for (const placeholder of new Set(placeholders)) {
          if (!translated.includes(placeholder)) {
            violations.push(`${locale} ${enKey}: missing ${placeholder} in ${JSON.stringify(translated)}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
