import { createZodDto } from 'nestjs-zod';
import {
  assignmentCreateRequestSchema,
  assignmentReorderRequestSchema,
  assignmentMoveRequestSchema,
  assignmentTimeRequestSchema,
  assignmentTransportRequestSchema,
  assignmentParticipantsRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared assignment
 * contracts. The global ZodValidationPipe (APP_PIPE in app.module.ts)
 * validates any @Body() parameter typed with one of these classes by
 * metatype — the Zod schemas in shared/ remain the single source of truth for
 * the wire contract.
 */
export class AssignmentCreateDto extends createZodDto(assignmentCreateRequestSchema) {}
export class AssignmentReorderDto extends createZodDto(assignmentReorderRequestSchema) {}
export class AssignmentMoveDto extends createZodDto(assignmentMoveRequestSchema) {}
export class AssignmentTimeDto extends createZodDto(assignmentTimeRequestSchema) {}
export class AssignmentTransportDto extends createZodDto(assignmentTransportRequestSchema) {}
export class AssignmentParticipantsDto extends createZodDto(assignmentParticipantsRequestSchema) {}
