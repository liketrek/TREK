/**
 * Server-side createZodDto wrappers over the @trek/shared Dawarich contracts,
 * so the global ZodValidationPipe (APP_PIPE) validates bodies by metatype —
 * the shared Zod schemas stay the single source of truth.
 */
import { createZodDto } from 'nestjs-zod';
import {
  dawarichAcceptSchema,
  dawarichAtlasAcceptSchema,
  dawarichBucketConfirmSchema,
  dawarichSettingsSchema,
  dawarichSuggestionStateSchemaBody,
} from '@trek/shared';

export class DawarichSettingsDto extends createZodDto(dawarichSettingsSchema) {}
export class DawarichAcceptDto extends createZodDto(dawarichAcceptSchema) {}
export class DawarichSuggestionStateDto extends createZodDto(dawarichSuggestionStateSchemaBody) {}
export class DawarichBucketConfirmDto extends createZodDto(dawarichBucketConfirmSchema) {}
export class DawarichAtlasAcceptDto extends createZodDto(dawarichAtlasAcceptSchema) {}
