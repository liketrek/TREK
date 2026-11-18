import { z } from 'zod';

/**
 * Primitive, domain-agnostic building blocks shared by every contract.
 * Domain schemas (trips, places, ...) live in their own folders and reuse these.
 */

/** TREK uses auto-increment integer primary keys. */
export const idSchema = z.number().int().positive();
export type Id = z.infer<typeof idSchema>;

/**
 * Numeric id coming from a URL param / query string. Express hands these over
 * as strings, so a string must be decimal digits before it becomes a number,
 * then a positive safe integer. A plain coercion read '0x5', '5e0', '5.0',
 * '+5' and ' 5' as 5, spellings no client sends that the server's toRowId
 * refuses; this keeps the two the same rule.
 */
export const idParamSchema = z
  .union([z.number().int(), z.string().regex(/^\d+$/)])
  .pipe(z.coerce.number().int().positive());

/**
 * A row id written as text: decimal digits naming a safe integer, kept as the
 * string it arrived as (a multipart field is always text). The server reads it
 * with toRowId. '0x5', '5e0', '5.0', '+5', ' 5', '5_0' and a number past 2^53
 * are refused here: bound to SQL they match nothing on SQLite, Postgres 14 and
 * 15 refuse the cast and 16 and later read hex and underscores as a number.
 */
export const rowIdStringSchema = z
  .string()
  .regex(/^\d+$/, 'Invalid id')
  .refine((digits) => Number.isSafeInteger(Number(digits)), 'Invalid id');

/**
 * A row id in a request body: a safe integer, or its decimal digits as a
 * string from a client that sends text. Kept as sent, so a field that took
 * `number | string` keeps its type; the server reads it with toRowId. Refuses
 * the spellings rowIdStringSchema refuses, and 1.5 and 1e20, each as
 * `<field>: Invalid id`.
 */
export const rowIdInputSchema = z.union([z.number().int('Invalid id'), rowIdStringSchema], { error: 'Invalid id' });

/** Non-empty, trimmed string. */
export const nonEmptyString = z.string().trim().min(1);

/** ISO-8601 timestamp string (the shape TREK serialises dates as in JSON). */
export const isoDateTime = z.string().datetime({ offset: true });

/** The `{ success: true }` body a write answers with when it has nothing else to say. */
export const successResponseSchema = z.object({ success: z.literal(true) });
export type SuccessResponse = z.infer<typeof successResponseSchema>;

/** A 204 answer: the handler returns nothing, so no body goes out. */
export const emptyResponseSchema = z.undefined();
