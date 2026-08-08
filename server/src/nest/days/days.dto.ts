import { createZodDto } from 'nestjs-zod';
import {
  dayCreateRequestSchema,
  dayReorderRequestSchema,
  dayTransportRequestSchema,
  dayUpdateRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared day contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class DayCreateDto extends createZodDto(dayCreateRequestSchema) {}
export class DayReorderDto extends createZodDto(dayReorderRequestSchema) {}
export class DayUpdateDto extends createZodDto(dayUpdateRequestSchema) {}
export class DayTransportDto extends createZodDto(dayTransportRequestSchema) {}
