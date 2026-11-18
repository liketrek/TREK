import { travelPlanApplyRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The apply body: a new trip or an existing one (`tripId` required for the latter). */
export class ApplyTravelPlanDto extends createZodDto(travelPlanApplyRequestSchema) {}
