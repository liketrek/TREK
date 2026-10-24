import { tourPoiSearchRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourPoiSearchDto extends createZodDto(tourPoiSearchRequestSchema) {}
