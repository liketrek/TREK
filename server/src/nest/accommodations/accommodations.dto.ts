import { accommodationCreateBodySchema, accommodationUpdateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class AccommodationCreateDto extends createZodDto(accommodationCreateBodySchema) {}
export class AccommodationUpdateDto extends createZodDto(accommodationUpdateRequestSchema) {}
