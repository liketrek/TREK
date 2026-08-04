import { createZodDto } from 'nestjs-zod';
import {
  mapsSearchRequestSchema,
  mapsAutocompleteRequestSchema,
  mapsResolveUrlRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared maps contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class MapsSearchDto extends createZodDto(mapsSearchRequestSchema) {}
export class MapsAutocompleteDto extends createZodDto(mapsAutocompleteRequestSchema) {}
export class MapsResolveUrlDto extends createZodDto(mapsResolveUrlRequestSchema) {}
