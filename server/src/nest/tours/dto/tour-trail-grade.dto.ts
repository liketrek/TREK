import { tourTrailGradeRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourTrailGradeDto extends createZodDto(tourTrailGradeRequestSchema) {}
