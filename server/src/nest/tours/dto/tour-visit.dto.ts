import { tourVisitUpdateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourVisitUpdateDto extends createZodDto(tourVisitUpdateRequestSchema) {}
