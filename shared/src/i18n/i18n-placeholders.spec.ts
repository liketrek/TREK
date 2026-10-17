import ar from './ar';
import az from './az';
import br from './br';
import ca from './ca';
import cs from './cs';
import de from './de';
import en from './en';
import es from './es';
import et from './et';
import fr from './fr';
import gr from './gr';
import hu from './hu';
import id from './id';
import itIT from './it';
import ja from './ja';
import ko from './ko';
import { getIntlLanguage } from './languages';
import nl from './nl';
import pl from './pl';
import { pluralFormOf, pluralGroups, singleNumberPluralCategories } from './plural';
import ru from './ru';
import sk from './sk';
import sv from './sv';
import th from './th';
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
 * A plural form (`places.count.few`) answers to its group's general form in
 * English, since Russian's `.few` has no English counterpart. It may spell
 * the number out instead of carrying `{count}` only where its category is a
 * single number in that language: Arabic "ملف واحد" for one, but never French
 * `one`, which also covers 0, or Russian `one`, which also covers 21.
 *
 * Only keys the locale actually translates are checked — missing keys are
 * key-set drift, handled (as unenforced data) by i18n-parity.spec.ts.
 */
const LOCALES: Record<string, TranslationStrings> = {
  ar,
  az,
  br,
  ca,
  cs,
  de,
  en,
  es,
  et,
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
  sk,
  sv,
  th,
  tr,
  uk,
  vi,
  zh,
  'zh-TW': zhTW,
};

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;
const GROUPS = pluralGroups(Object.keys(en));

const placeholdersOf = (text: string) => new Set(text.match(PLACEHOLDER_RE) ?? []);

/** The English text whose placeholders `key` carries, and the count placeholder it may spell out in `language`. */
function referenceFor(key: string, language: string): { text: string; spelledOut: string | null } | null {
  const form = pluralFormOf(key, GROUPS);
  if (!form) return typeof en[key] === 'string' ? { text: en[key], spelledOut: null } : null;
  const text = en[form.base] ?? en[`${form.base}.other`];
  if (typeof text !== 'string') return null;
  const single = singleNumberPluralCategories(getIntlLanguage(language)).includes(form.category);
  const count = ['{count}', '{n}'].find((p) => placeholdersOf(text).has(p)) ?? null;
  return { text, spelledOut: single ? count : null };
}

function violationsOf(language: string, catalog: TranslationStrings): string[] {
  const violations: string[] = [];
  for (const [key, translated] of Object.entries(catalog)) {
    const reference = referenceFor(key, language);
    if (!reference || typeof translated !== 'string') continue;
    const expected = placeholdersOf(reference.text);
    for (const placeholder of expected) {
      if (placeholder === reference.spelledOut || translated.includes(placeholder)) continue;
      violations.push(`${language} ${key}: missing ${placeholder} in ${JSON.stringify(translated)}`);
    }
    if (!pluralFormOf(key, GROUPS)) continue;
    for (const placeholder of placeholdersOf(translated)) {
      if (!expected.has(placeholder))
        violations.push(`${language} ${key}: unknown ${placeholder} in ${JSON.stringify(translated)}`);
    }
  }
  return violations;
}

describe('i18n placeholder parity', () => {
  it('every EN placeholder appears in each locale translation of the same key', () => {
    const violations = Object.entries(LOCALES).flatMap(([language, catalog]) => violationsOf(language, catalog));
    expect(violations).toEqual([]);
  });

  it('a plural form spells the number out only where its category is that one number', () => {
    const catalog = {
      'places.count': '{count} lieux',
      'places.count.one': 'un lieu',
    } as unknown as TranslationStrings;
    expect(violationsOf('fr', catalog)).toEqual(['fr places.count.one: missing {count} in "un lieu"']);
    expect(violationsOf('ar', { 'places.count.one': 'مكان واحد' } as unknown as TranslationStrings)).toEqual([]);
    expect(violationsOf('ru', { 'places.count.few': '{count} места {trip}' } as unknown as TranslationStrings)).toEqual(
      ['ru places.count.few: unknown {trip} in "{count} места {trip}"'],
    );
  });
});
