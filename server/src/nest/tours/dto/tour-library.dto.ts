import { tourLibraryQuerySchema, tourTakeOverRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourLibraryQueryDto extends createZodDto(tourLibraryQuerySchema) {}
export class TourTakeOverDto extends createZodDto(tourTakeOverRequestSchema) {}
