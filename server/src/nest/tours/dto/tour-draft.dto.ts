import { tourDraftPutRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourDraftPutDto extends createZodDto(tourDraftPutRequestSchema) {}
