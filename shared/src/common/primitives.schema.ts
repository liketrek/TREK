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
 * as strings, so we coerce, then enforce a positive integer.
 */
export const idParamSchema = z.coerce.number().int().positive();

/** Non-empty, trimmed string. */
export const nonEmptyString = z.string().trim().min(1);

/** ISO-8601 timestamp string (the shape TREK serialises dates as in JSON). */
export const isoDateTime = z.string().datetime({ offset: true });
