/**
 * The amount inside a price as the store writes it ("4,90 €", "$4.99",
 * "CHF 12.90", "1.290 ₽"), and a way to write another amount the same way: the
 * same currency, the same decimal mark, the same digit grouping. The plan picker
 * counts a price up to its new value with it, and turns a yearly price into what
 * it makes a month, without knowing the store's locale.
 */
interface Amount {
  /** The amount as a number, in the price's own unit (4.9 for "4,90 €"). */
  value: number;
  /** The price written for another amount, in the same format. */
  render(value: number): string;
}

// Digits with the marks stores put between them: . , any space (\s takes the
// no-break ones too) and the apostrophes Swiss formats group thousands with.
const NUMBER = /\d[\d.,\s'’]*\d|\d/;

export function amountIn(label: string): Amount | null {
  const match = NUMBER.exec(label);
  if (!match) return null;
  const raw = match[0];
  // The decimal mark is the last . or , followed by one or two digits to the end.
  const decimal = /([.,])(\d{1,2})$/.exec(raw);
  const decimals = decimal ? decimal[2].length : 0;
  const mark = decimal ? decimal[1] : '';
  const whole = decimal ? raw.slice(0, raw.length - decimal[0].length) : raw;
  const group = /[.,\s'’]/.exec(whole)?.[0] ?? '';
  const digits = whole.replace(/\D/g, '') + (decimal ? `.${decimal[2]}` : '');
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  const before = label.slice(0, match.index);
  const after = label.slice(match.index + raw.length);
  return {
    value,
    render(next: number) {
      const fixed = Math.max(0, next).toFixed(decimals);
      const [int, frac] = fixed.split('.');
      const grouped = group ? int.replace(/\B(?=(\d{3})+(?!\d))/g, group) : int;
      return `${before}${grouped}${frac !== undefined ? mark + frac : ''}${after}`;
    },
  };
}
