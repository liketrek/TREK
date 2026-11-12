/**
 * The amount in a store price string such as "9,99 €", "$9.99" or "¥1,500", in
 * hundredths; null when it cannot be read with confidence. Only ever compared
 * with another price of the same store, never shown.
 */
export function priceValue(label: string | undefined): number | null {
  if (!label) return null;
  const digits = label.replace(/[^\d.,]/g, '');
  const match = /^(\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,](\d{1,2}))?$/.exec(digits);
  if (!match) return null;
  const whole = Number(match[1].replace(/[.,]/g, ''));
  const fraction = match[2] ? Number(match[2].padEnd(2, '0')) : 0;
  return Number.isFinite(whole) ? whole * 100 + fraction : null;
}
