import { z } from 'zod';

/**
 * The bounds a model's reading of a receipt is held to. The answer comes from a
 * photo anyone on the trip can take, of paper anyone can print, so it is never
 * trusted to be short or sane: a name longer than a till prints, more lines
 * than one expense is split into, or an amount no receipt carries is cut or
 * dropped before it reaches the expense editor.
 */
export const RECEIPT_TEXT_MAX = 200;
export const RECEIPT_LINES_MAX = 100;
/**
 * Above any receipt in any currency, the weakest included, and far enough
 * under 2^53 for the integer cent maths of a split.
 */
export const RECEIPT_AMOUNT_MAX = 10_000_000_000;

/**
 * A photographed receipt, as the AI model read it for the Costs tab.
 *
 * It only pre-fills the expense editor: nothing is saved until the person saves
 * the expense there, so every field may be missing and each is checked by eye.
 * There is no category: which kind of spending it was is the person's call.
 */
export const receiptLineSchema = z.object({
  name: z.string().min(1).max(RECEIPT_TEXT_MAX),
  /**
   * What the line cost in total, quantity included, in the receipt's currency.
   * Positive: a discount or a free line would leave the Ticket split unable to
   * save, which takes only priced lines, so it is not a line here. The total
   * already counts it.
   */
  price: z.number().positive().max(RECEIPT_AMOUNT_MAX),
});
export type ReceiptLine = z.infer<typeof receiptLineSchema>;

export const receiptReadSchema = z.object({
  /** The business, which becomes the expense name. */
  merchant: z.string().min(1).max(RECEIPT_TEXT_MAX).nullable(),
  /** YYYY-MM-DD. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  /** The grand total paid. */
  total: z.number().positive().max(RECEIPT_AMOUNT_MAX).nullable(),
  /** ISO 4217. */
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  /** The itemized lines, which seed the Ticket split. */
  items: z.array(receiptLineSchema).max(RECEIPT_LINES_MAX),
});
export type ReceiptRead = z.infer<typeof receiptReadSchema>;

/** What a finished receipt scan job answers: the read, or null with the reason in `warnings`. */
export const receiptScanResultSchema = z.object({
  receipt: receiptReadSchema.nullable(),
  warnings: z.array(z.string()),
});
export type ReceiptScanResult = z.infer<typeof receiptScanResultSchema>;

/** POST /api/trips/:tripId/budget/receipt-scan: the background job reading the photo. */
export const receiptScanStartResponseSchema = z.object({ jobId: z.string().min(1) });
export type ReceiptScanStartResponse = z.infer<typeof receiptScanStartResponseSchema>;
