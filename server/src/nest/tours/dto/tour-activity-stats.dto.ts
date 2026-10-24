import { tourActivityExclusionRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TourActivityExclusionDto extends createZodDto(tourActivityExclusionRequestSchema) {}
