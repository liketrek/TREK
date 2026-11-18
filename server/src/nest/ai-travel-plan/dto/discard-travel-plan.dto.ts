import { travelPlanDiscardRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The discard body: an optional reason, kept in the audit trail. */
export class DiscardTravelPlanDto extends createZodDto(travelPlanDiscardRequestSchema) {}
