import { tourCreateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourCreateDto extends createZodDto(tourCreateRequestSchema) {}
