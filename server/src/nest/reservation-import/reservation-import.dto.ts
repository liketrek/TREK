import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Server-side createZodDto wrappers for the booking-import bodies.
 *
 * Confirm asserts that `items` is an array of objects, and nothing more.
 *
 * Two things pushed it there. `bookingImportConfirmRequestSchema` declares
 * `.min(1)`, and the pipe reports a rejection as `field: message`, so adopting
 * it verbatim would replace the endpoint's own
 * `{ error: 'items must be a non-empty array' }`. And validating each item
 * against `bookingImportPreviewItemSchema` demanded fields the service never
 * reads, such as `source`: a caller assembling items itself rather than echoing
 * a preview used to get a 201 and now got a 400 about a field nobody uses.
 *
 * Preview and its async twin carry a multipart body, so every field arrives as a
 * string and the real payload is the files. `mode` is described here for the
 * type, and deliberately not narrowed to the mode enum: `validateImport` parses
 * it with `bookingImportModeSchema` and owns the `Invalid mode` response. The
 * object is not strict, because a multipart form may carry fields the browser
 * adds and the handler ignores.
 */
export class BookingImportConfirmDto extends createZodDto(
  z.object({ items: z.array(z.looseObject({})).optional() }),
) {}

export class BookingImportPreviewDto extends createZodDto(
  z.object({ mode: z.string().optional() }),
) {}
