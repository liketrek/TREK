import { createZodDto } from 'nestjs-zod';
import {
  markRegionRequestSchema,
  createBucketItemRequestSchema,
  updateBucketItemRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared atlas contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class AtlasMarkRegionDto extends createZodDto(markRegionRequestSchema) {}
export class AtlasCreateBucketItemDto extends createZodDto(createBucketItemRequestSchema) {}
export class AtlasUpdateBucketItemDto extends createZodDto(updateBucketItemRequestSchema) {}
