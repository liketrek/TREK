/**
 * Server-side createZodDto wrappers over the @trek/shared AirTrail contracts,
 * so the global ZodValidationPipe (APP_PIPE) validates bodies by metatype —
 * the shared Zod schemas stay the single source of truth.
 */
import { createZodDto } from 'nestjs-zod';
import { airtrailImportSchema, airtrailSettingsSchema } from '@trek/shared';

export class AirtrailSettingsDto extends createZodDto(airtrailSettingsSchema) {}
export class AirtrailImportDto extends createZodDto(airtrailImportSchema) {}
