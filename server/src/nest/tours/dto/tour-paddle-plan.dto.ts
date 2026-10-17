import { tourPaddlePlanRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourPaddlePlanDto extends createZodDto(tourPaddlePlanRequestSchema) {}
