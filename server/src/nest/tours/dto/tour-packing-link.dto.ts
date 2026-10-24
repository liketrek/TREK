import { tourPackingLinkRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourPackingLinkDto extends createZodDto(tourPackingLinkRequestSchema) {}
