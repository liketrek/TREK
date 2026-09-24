/**
 * The ISO 4217 codes this runtime knows. Node ships full ICU, so this is the
 * complete list; a build without `Intl.supportedValuesOf` leaves it empty and
 * `toIsoCurrency` then settles for the shape of a code.
 */
const ISO_CURRENCIES: ReadonlySet<string> = new Set(
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('currency') : [],
);

/** A symbol standing on its own. `$` alone is read as USD, as the extractor does. */
const SYMBOLS: ReadonlyMap<string, string> = new Map([
  ['€', 'EUR'],
  ['£', 'GBP'],
  ['¥', 'JPY'],
  ['$', 'USD'],
]);

/**
 * The currency an AI answer named, as an ISO 4217 code, or undefined when it
 * names none.
 *
 * A model's `priceCurrency` is whatever it made of the document: `EUR`, `eur`,
 * `€`, `Euros`, and once `EURials` (#2477). That value used to reach the cost
 * form untouched. It is read as an exact code in any case first, then as the
 * code it starts with when those three letters are a real code (`EURials` and
 * `Euros` are EUR, `LEK` is nothing, since the lek is ALL), then as a lone
 * currency symbol. Anything else is undefined, so the caller can fall back to
 * the document or drop the field instead of passing on a currency nobody can
 * convert.
 */
export function toIsoCurrency(raw: unknown, known: ReadonlySet<string> = ISO_CURRENCIES): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().toUpperCase();
  if (!value) return undefined;
  const isCode = (code: string) => (known.size > 0 ? known.has(code) : /^[A-Z]{3}$/.test(code));
  if (isCode(value)) return value;
  const prefix = /^[A-Z]{3}/.exec(value)?.[0];
  if (prefix && isCode(prefix)) return prefix;
  return SYMBOLS.get(value);
}
