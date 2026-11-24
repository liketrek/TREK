import { tripCalendarQuerySchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/**
 * Query DTO of every route that serves a trip calendar: the download in the
 * trips controller and the two public feeds. The global ZodValidationPipe
 * validates it by metatype, like the body DTOs.
 */
export class TripCalendarQueryDto extends createZodDto(tripCalendarQuerySchema) {}
