import { travelPlanRevisionRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The revise body: what to change, and optionally which version it is based on. */
export class CreateTravelPlanRevisionDto extends createZodDto(travelPlanRevisionRequestSchema) {}
