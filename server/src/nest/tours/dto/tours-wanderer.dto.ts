import { wandererImportRequestSchema, wandererSearchRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The trip-side wanderer routes' bodies, validated by the global Zod pipe against the shared contracts. */
export class WandererSearchDto extends createZodDto(wandererSearchRequestSchema) {}
export class WandererImportDto extends createZodDto(wandererImportRequestSchema) {}
