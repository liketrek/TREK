import { tourActivityAssignRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourActivityAssignDto extends createZodDto(tourActivityAssignRequestSchema) {}
