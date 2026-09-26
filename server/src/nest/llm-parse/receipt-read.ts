import {
  RECEIPT_AMOUNT_MAX,
  RECEIPT_LINES_MAX,
  RECEIPT_TEXT_MAX,
  receiptReadSchema,
  type ReceiptLine,
  type ReceiptRead,
} from '@trek/shared';
import { toIsoCurrency } from './currency-code';
import { parseAmount } from './clients/nuextract';

/**
 * Reading a photographed receipt for the Costs tab: the prompt, the schema the
 * answer is held to, and the step that turns the answer into a `ReceiptRead`.
 * Pure, so every piece is testable without a model.
 *
 * The field list is flat and short on purpose. A till roll is printed small and
 * photographed under bad light, and a small local model fills a handful of named
 * fields far more reliably than the nested schema.org shape bookings use.
 */

/** Key the cloud clients read the answer's array under (`{ receipts: [...] }`). */
export const RECEIPT_ROOT_KEY = 'receipts';

export const RECEIPT_USER_TEXT = 'Read the receipt in the attached photo.';

/** One receipt, flat. Ollama compiles it to a grammar, so the answer has this shape or none. */
export const RECEIPT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    merchant: { type: 'string' },
    date: { type: 'string' },
    total: { type: 'number' },
    currency: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, price: { type: 'number' } },
        required: ['name', 'price'],
      },
    },
  },
  // Every field is required. Ollama's grammar lets a small model skip an
  // optional key, and it does: qwen3.5:4b answered the total and the lines of a
  // receipt printing both its name and its date, and nothing else. A field the
  // receipt does not show comes back empty, which toReceiptRead reads as absent.
  required: ['merchant', 'date', 'total', 'currency', 'items'],
} as const;

/** The same receipt wrapped in the list the cloud clients' structured output returns. */
export const RECEIPT_LIST_JSON_SCHEMA = {
  type: 'object',
  properties: { [RECEIPT_ROOT_KEY]: { type: 'array', items: RECEIPT_JSON_SCHEMA } },
  required: [RECEIPT_ROOT_KEY],
} as const;

/** One receipt as the prompt spells it out, empty the way an unread field is answered. */
const RECEIPT_SHAPE = '{ "merchant": "", "date": "", "total": 0, "currency": "", "items": [ { "name": "", "price": 0 } ] }';

/**
 * The instructions for one receipt. `listed` is the cloud form, whose answer is
 * wrapped as `{ "receipts": [...] }`. The prompt states that shape itself: a
 * server that turns the schema down falls back to `json_object` or to no format
 * at all, and then the prompt is all the model goes by, and `json_object` mode
 * wants the word JSON in it. Without the wrapper a flat answer came back, which
 * the cloud clients read as no receipt.
 */
export function buildReceiptPrompt(today: Date = new Date(), listed = false): string {
  const todayIso = today.toISOString().slice(0, 10);
  const shape = listed ? `{ "${RECEIPT_ROOT_KEY}": [ ${RECEIPT_SHAPE} ] }, with the one receipt in the list` : RECEIPT_SHAPE;
  return [
    'You read a photographed receipt, bill or invoice: often a paper till roll, possibly crumpled, skewed or in a foreign language.',
    `Return ONLY a JSON object of the form ${shape}. No prose, no markdown.`,
    'Fill "total" with the grand total actually paid, after tax and tip: the final TOTAL or AMOUNT DUE line, not a subtotal.',
    'Fill "currency" with its ISO 4217 code, from the symbol and the country when the code is not printed.',
    'Fill "merchant" with the business name printed at the top, and "date" as YYYY-MM-DD.',
    // A till roll prints "26-08-23" and means one of three dates. The merchant's
    // country settles day/month order; nothing on the paper settles which pair is
    // the year, and a receipt is scanned soon after it is paid.
    `Today is ${todayIso}. When a date could be read several ways, take the reading nearest to today and never one in the future.`,
    'Fill "items" with the purchased lines as printed, each with its line total as "price". Leave out subtotal, tax, discount, tip and total lines.',
    'Never invent a value: when the receipt does not show a field, answer an empty string for it (0 for "total", [] for "items"). Numbers are plain numbers: 12.5, not "12,50 €".',
  ].join('\n');
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Text as a name the editor takes: trimmed, and cut at the length the contract allows. */
function toName(value: unknown): string | null {
  const text = toText(value);
  return text ? text.slice(0, RECEIPT_TEXT_MAX).trim() : null;
}

/** A real calendar date as YYYY-MM-DD, or null. */
function toDate(value: unknown): string | null {
  const s = toText(value);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

/** The hyphen a till prints, and the typographic minus sign a model may write instead. */
const MINUS_SIGNS = ['-', String.fromCodePoint(0x2212)];

/**
 * An amount as parseAmount reads it, with the sign parseAmount strips from text:
 * a till prints a discount as "-2,00" or "2,00-", and read without its sign it
 * would become a charge of 2. A Swiss till writes a whole amount as "45.-" or
 * "45,-", where the dash stands for the cents and is no sign.
 */
function toAmount(value: unknown): number | null {
  const amount = parseAmount(value);
  if (amount === null || typeof value !== 'string') return amount;
  const first = value.search(/\d/);
  let last = value.length - 1;
  while (last > first && !isDigit(value.charCodeAt(last))) last--;
  const tail = value.slice(last + 1);
  const wholeMark = /^[.,]\s*[-−]/.exec(tail);
  const outside = value.slice(0, first) + (wholeMark ? tail.slice(wholeMark[0].length) : tail);
  return MINUS_SIGNS.some((sign) => outside.includes(sign)) ? -amount : amount;
}

/** An amount a receipt can carry: above zero and within the contract's ceiling. */
function inRange(amount: number | null): amount is number {
  return amount !== null && amount > 0 && amount <= RECEIPT_AMOUNT_MAX;
}

/**
 * The model's answer as a `ReceiptRead`, or null when it holds nothing a person
 * could use: no total, no merchant and no line. Each field is kept only when it
 * reads as what it claims to be, so a garbled one is left for the person to fill
 * rather than saved wrong.
 *
 * A line is kept only with a price above zero. A discount, a deposit returned
 * or a free item would leave the Ticket split unable to save, since it takes
 * priced lines only; the total already counts it. Names are cut to the length
 * the contract allows and the list to its first lines, rather than losing the
 * whole reading over one of them.
 */
export function toReceiptRead(raw: unknown): ReceiptRead | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const node = raw as Record<string, unknown>;
  const total = toAmount(node.total);
  const items: ReceiptLine[] = [];
  if (Array.isArray(node.items)) {
    for (const line of node.items) {
      if (items.length === RECEIPT_LINES_MAX) break;
      if (!line || typeof line !== 'object') continue;
      const name = toName((line as Record<string, unknown>).name);
      const price = toAmount((line as Record<string, unknown>).price);
      if (name && inRange(price)) items.push({ name, price });
    }
  }
  const read = {
    merchant: toName(node.merchant),
    date: toDate(node.date),
    total: inRange(total) ? total : null,
    currency: toIsoCurrency(node.currency) ?? null,
    items,
  };
  if (read.total === null && read.merchant === null && items.length === 0) return null;
  const parsed = receiptReadSchema.safeParse(read);
  return parsed.success ? parsed.data : null;
}
