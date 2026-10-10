/**
 * Plural forms for count-bearing strings.
 *
 * A string that depends on a number keeps its key as the general form and
 * adds one key per CLDR category the language needs: `places.count` reads
 * "{count} places", `places.count.one` reads "{count} place". Russian adds
 * `.few` and `.many`, Arabic `.zero`, `.two`, `.few` and `.many`, Japanese
 * none at all. Which category a number takes is the language's own rule, read
 * from `Intl.PluralRules`, never a `count === 1` in the caller: 21 is "one" in
 * Russian and 0 is "one" in French.
 */

export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
export type PluralCategory = (typeof PLURAL_CATEGORIES)[number];

/** The categories a key spells out as `key.<category>`; `other` is the key itself (or `key.other`). */
const FORM_CATEGORIES: readonly PluralCategory[] = ['zero', 'one', 'two', 'few', 'many'];

const rules = new Map<string, Intl.PluralRules>();

function rulesFor(intlLocale: string): Intl.PluralRules {
  let r = rules.get(intlLocale);
  if (!r) {
    r = new Intl.PluralRules(intlLocale);
    rules.set(intlLocale, r);
  }
  return r;
}

/** The CLDR category `count` takes in `intlLocale` (a BCP 47 tag, see `getIntlLanguage`). */
export function pluralCategory(count: number, intlLocale: string): PluralCategory {
  return rulesFor(intlLocale).select(count) as PluralCategory;
}

/**
 * The key a count-bearing string resolves to in `strings`: the form for the
 * count's category, else the `.other` form, else the key itself. Undefined
 * when `strings` has none of them, so the caller can fall back to another
 * locale with that locale's own rules.
 */
export function resolvePluralKey(
  strings: Readonly<Record<string, unknown>>,
  key: string,
  count: number,
  intlLocale: string,
): string | undefined {
  for (const candidate of [`${key}.${pluralCategory(count, intlLocale)}`, `${key}.other`, key]) {
    if (typeof strings[candidate] === 'string') return candidate;
  }
  return undefined;
}

/**
 * The form of a text built in code rather than looked up by key (the server's
 * mail and push texts): the form for the count's category, else `other`, the
 * general form, as the bare key is in a catalogue. A count that is not a
 * number (notification params travel as strings) takes the general form.
 */
export function pluralForm(
  count: number | string | undefined,
  intlLocale: string,
  forms: Readonly<Partial<Record<PluralCategory, string>> & { other: string }>,
): string {
  const n = typeof count === 'number' ? count : Number(count);
  if (count === undefined || count === '' || !Number.isFinite(n)) return forms.other;
  return forms[pluralCategory(n, intlLocale)] ?? forms.other;
}

/**
 * The categories whole counts from 0 to 200 reach: the forms a translation
 * has to spell out. Categories only fractions or millions reach (French
 * `many`, Russian `other`) fall back to the general form.
 */
export function integerPluralCategories(intlLocale: string): PluralCategory[] {
  const r = rulesFor(intlLocale);
  const seen = new Set<PluralCategory>();
  for (let n = 0; n <= 200; n++) seen.add(r.select(n) as PluralCategory);
  return PLURAL_CATEGORIES.filter((c) => seen.has(c));
}

/** Every category the language has at all, for refusing a form it can never select. */
export function allPluralCategories(intlLocale: string): PluralCategory[] {
  return rulesFor(intlLocale).resolvedOptions().pluralCategories as PluralCategory[];
}

/**
 * The categories exactly one whole number from 0 to 200 takes (Arabic `zero`,
 * `one` and `two`, German `one`). Only these forms may spell the number out
 * ("ملف واحد") instead of carrying the count: French `one` also covers 0 and
 * Russian `one` covers 21.
 */
export function singleNumberPluralCategories(intlLocale: string): PluralCategory[] {
  const r = rulesFor(intlLocale);
  const hits = new Map<PluralCategory, number>();
  for (let n = 0; n <= 200; n++) {
    const c = r.select(n) as PluralCategory;
    hits.set(c, (hits.get(c) ?? 0) + 1);
  }
  return PLURAL_CATEGORIES.filter((c) => hits.get(c) === 1);
}

/**
 * The plural groups a reference catalogue (English) defines: every key with a
 * general form (`key` or `key.other`) and at least one category form.
 */
export function pluralGroups(referenceKeys: Iterable<string>): Set<string> {
  const keys = new Set(referenceKeys);
  const groups = new Set<string>();
  for (const key of keys) {
    const form = splitForm(key);
    if (form && (keys.has(form.base) || keys.has(`${form.base}.other`))) groups.add(form.base);
  }
  return groups;
}

/** The group and category `key` spells out, or null when it is not a category form of one of `groups`. */
export function pluralFormOf(
  key: string,
  groups: ReadonlySet<string>,
): { base: string; category: PluralCategory } | null {
  const form = splitForm(key);
  return form && groups.has(form.base) ? form : null;
}

function splitForm(key: string): { base: string; category: PluralCategory } | null {
  const dot = key.lastIndexOf('.');
  if (dot < 0) return null;
  const category = key.slice(dot + 1) as PluralCategory;
  return FORM_CATEGORIES.includes(category) ? { base: key.slice(0, dot), category } : null;
}
