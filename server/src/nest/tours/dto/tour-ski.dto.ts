import { tourSkiClassificationRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourSkiClassificationDto extends createZodDto(tourSkiClassificationRequestSchema) {}
