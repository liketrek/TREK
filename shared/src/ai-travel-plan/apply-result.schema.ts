import { z } from 'zod';

/**
 * The rows one explicit apply wrote, kept on the plan (`apply_result_json`) so
 * an undo — or a person cleaning up by hand — can name exactly what to remove.
 *
 * `dayIds` covers every day the apply wrote into: days it reused and days it
 * created. The `created*` lists hold only the rows the apply itself inserted,
 * so after an apply into an existing trip nothing else is ever named.
 */
export const travelPlanApplyResultSchema = z.object({
  mode: z.enum(['new_trip', 'existing_trip']),
  tripId: z.number().int().positive(),
  dayIds: z.array(z.number().int().positive()),
  createdDayIds: z.array(z.number().int().positive()),
  createdPlaceIds: z.array(z.number().int().positive()),
  createdAssignmentIds: z.array(z.number().int().positive()),
  /** The canonical db timestamp of the commit that wrote these rows. */
  appliedAt: z.string().trim().min(1).max(40).nullable(),
});

export type TravelPlanApplyResult = z.infer<typeof travelPlanApplyResultSchema>;
