import { createZodDto } from 'nestjs-zod';
import { accommodationCreateBodySchema, accommodationUpdateRequestSchema } from '@trek/shared';

export class AccommodationCreateDto extends createZodDto(accommodationCreateBodySchema) {}
export class AccommodationUpdateDto extends createZodDto(accommodationUpdateRequestSchema) {}
