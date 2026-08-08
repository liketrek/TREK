import { createZodDto } from 'nestjs-zod';
import { tripInviteLinkCreateRequestSchema } from '@trek/shared';

/**
 * Server-side createZodDto wrapper over the @trek/shared trip-invite contract.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any
 * @Body() parameter typed with this class by metatype — the Zod schema in
 * shared/ remains the single source of truth for the wire contract.
 */
export class TripInviteLinkCreateDto extends createZodDto(tripInviteLinkCreateRequestSchema) {}
