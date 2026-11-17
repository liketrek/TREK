import { currencyDecimals, toMinor } from '@trek/shared';

/**
 * A price from a mail as whole hundredths, or null when it cannot be read to
 * the cent without guessing. A number is taken as it is. A text decides its
 * decimal mark by itself: with both a dot and a comma the last one is the
 * decimal mark; with one of them, two digits after it make it the decimal
 * mark, three are a thousands group or a third decimal, so the reading is
 * left alone. More decimals than the currency has are no price either.
 */
export function parsePriceMinor(value: unknown, currency: string | null): number | null {
  const decimals = currency ? currencyDecimals(currency) : 2;
  if (typeof value === 'number') return Number.isFinite(value) ? toMinor(value) : null;
  if (typeof value !== 'string') return null;
  const text = value.replace(/[^\d.,]/g, '');
  const parts = splitAmount(text);
  if (!parts) return null;
  const [whole, fraction] = parts;
  if (fraction.length > decimals) return null;
  return toMinor(Number(`${whole}.${fraction || '0'}`));
}

/** The whole and the fractional digits of an amount, or null when its separators are ambiguous. */
function splitAmount(text: string): [string, string] | null {
  if (/^\d+$/.test(text)) return [text, ''];
  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalAt = Math.max(lastDot, lastComma);
    const thousands = text[Math.min(lastDot, lastComma)];
    const whole = text.slice(0, decimalAt);
    return grouped(whole, thousands) ? [digits(whole), text.slice(decimalAt + 1)] : null;
  }
  const mark = lastDot >= 0 ? '.' : ',';
  const pieces = text.split(mark);
  if (pieces.length > 2) return grouped(text, mark) ? [digits(text), ''] : null;
  const [whole, fraction] = pieces;
  if (!/^\d+$/.test(whole) || !/^\d+$/.test(fraction) || fraction.length === 3) return null;
  return [whole, fraction];
}

/** Whether `text` is digits in groups of three behind its first group, split by `separator`. */
function grouped(text: string, separator: string): boolean {
  const [head, ...groups] = text.split(separator);
  return /^\d{1,3}$/.test(head) && groups.length > 0 && groups.every((group) => /^\d{3}$/.test(group));
}

function digits(text: string): string {
  return text.replace(/\D/g, '');
}
