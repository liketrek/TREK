import { createZodDto } from 'nestjs-zod';
import {
  tripCreateRequestSchema,
  tripUpdateRequestSchema,
  tripCopyRequestSchema,
  tripAddMemberRequestSchema,
  tripTransferOwnershipRequestSchema,
  tripCreateGuestRequestSchema,
  tripRenameGuestRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared trip contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class TripCreateDto extends createZodDto(tripCreateRequestSchema) {}
export class TripUpdateDto extends createZodDto(tripUpdateRequestSchema) {}
export class TripCopyDto extends createZodDto(tripCopyRequestSchema) {}
export class TripAddMemberDto extends createZodDto(tripAddMemberRequestSchema) {}
export class TripTransferOwnershipDto extends createZodDto(tripTransferOwnershipRequestSchema) {}
export class TripCreateGuestDto extends createZodDto(tripCreateGuestRequestSchema) {}
export class TripRenameGuestDto extends createZodDto(tripRenameGuestRequestSchema) {}
