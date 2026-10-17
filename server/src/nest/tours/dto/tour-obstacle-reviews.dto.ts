import { tourObstacleReviewsRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourObstacleReviewsDto extends createZodDto(tourObstacleReviewsRequestSchema) {}
