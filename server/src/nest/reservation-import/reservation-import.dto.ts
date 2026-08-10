import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { bookingImportPreviewItemSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers for the booking-import bodies.
 *
 * Confirm validates each item against the shared contract but leaves `items`
 * itself optional, which is narrower than `bookingImportConfirmRequestSchema`
 * on purpose. That schema declares `.min(1)`, and the pipe reports a rejection
 * as `field: message` — so adopting it verbatim would replace the endpoint's
 * `{ error: 'items must be a non-empty array' }`. The handler keeps the check
 * that owns the message, and the DTO adds what the handler never did: per-item
 * shape validation.
 *
 * Preview and its async twin carry a multipart body, so every field arrives as a
 * string and the real payload is the files. `mode` is described here for the
 * type, and deliberately not narrowed to the mode enum: `validateImport` parses
 * it with `bookingImportModeSchema` and owns the `Invalid mode` response. The
 * object is not strict, because a multipart form may carry fields the browser
 * adds and the handler ignores.
 */
export class BookingImportConfirmDto extends createZodDto(
  z.object({ items: z.array(bookingImportPreviewItemSchema).optional() }),
) {}

export class BookingImportPreviewDto extends createZodDto(
  z.object({ mode: z.string().optional() }),
) {}
