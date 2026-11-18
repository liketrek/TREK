import { travelPlanCreateRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The create body: structured fields plus the traveller's optional sentence. */
export class CreateTravelPlanDto extends createZodDto(travelPlanCreateRequestSchema) {}
