import {
  placeBulkDeleteRequestSchema,
  placeBulkUpdateRequestSchema,
  placeCreateRequestSchema,
  placeImportGpxRequestSchema,
  placeImportListRequestSchema,
  placeImportMapRequestSchema,
  placeExportGpxRequestSchema,
  placeRatingRequestSchema,
  placeUpdateRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/**
 * Server-side createZodDto wrappers over the @trek/shared places contracts.
 * Typing a controller parameter with one of these classes is what lets the
 * global ZodValidationPipe (APP_PIPE) validate it by metatype — the Zod
 * schemas in shared/ remain the single source of truth for the contract.
 *
 * Create/update wrap the deliberately open place body (place rows are wide and
 * provider-derived): the record passes unknown keys straight through, so the
 * handler's own length and route_color guards still see — and still reject —
 * exactly what they did before the ratchet. The two import DTOs describe
 * multipart form fields, which arrive as strings (fileUploadRequestSchema
 * precedent), so the handlers keep their own 'true'-comparison coercion.
 */

export class PlaceCreateDto extends createZodDto(placeCreateRequestSchema) {}
export class PlaceUpdateDto extends createZodDto(placeUpdateRequestSchema) {}
export class PlaceRatingDto extends createZodDto(placeRatingRequestSchema) {}
export class PlaceBulkDeleteDto extends createZodDto(placeBulkDeleteRequestSchema) {}
export class PlaceBulkUpdateDto extends createZodDto(placeBulkUpdateRequestSchema) {}
export class PlaceImportListDto extends createZodDto(placeImportListRequestSchema) {}
export class PlaceImportGpxDto extends createZodDto(placeImportGpxRequestSchema) {}
export class PlaceImportMapDto extends createZodDto(placeImportMapRequestSchema) {}
export class PlaceExportGpxDto extends createZodDto(placeExportGpxRequestSchema) {}
