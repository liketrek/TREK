import { travelPlanUndoRequestSchema } from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/** The undo body: an optional reason, kept in the audit trail. */
export class UndoTravelPlanDto extends createZodDto(travelPlanUndoRequestSchema) {}
