import { createZodDto } from 'nestjs-zod';
import {
  reservationCreateRequestSchema,
  reservationUpdateRequestSchema,
  reservationPositionsRequestSchema,
  reservationTravelersRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared reservation
 * contracts. The global ZodValidationPipe (APP_PIPE in app.module.ts)
 * validates any @Body() parameter typed with one of these classes by
 * metatype — the Zod schemas in shared/ remain the single source of truth
 * for the wire contract. Create/update stay open records on purpose: the
 * legacy route accepted the whole Reservation shape as an arbitrary
 * partial, and parity forbids tightening it here.
 */
export class ReservationCreateDto extends createZodDto(reservationCreateRequestSchema) {}
export class ReservationUpdateDto extends createZodDto(reservationUpdateRequestSchema) {}
export class ReservationPositionsDto extends createZodDto(reservationPositionsRequestSchema) {}
export class ReservationTravelersDto extends createZodDto(reservationTravelersRequestSchema) {}
