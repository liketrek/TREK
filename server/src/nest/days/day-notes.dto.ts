import { createZodDto } from 'nestjs-zod';
import { dayNoteCreateRequestSchema, dayNoteUpdateRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared day-note contracts.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any
 * @Body() parameter typed with one of these classes by metatype — the Zod
 * schemas in shared/ remain the single source of truth for the wire contract.
 */
export class DayNoteCreateDto extends createZodDto(dayNoteCreateRequestSchema) {}
export class DayNoteUpdateDto extends createZodDto(dayNoteUpdateRequestSchema) {}
