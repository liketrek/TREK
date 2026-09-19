import { z } from 'zod';

export const roadtripDayBoundarySchema = z
  .object({
    day_number: z.number().int().min(1).max(366),
    from_assignment_id: z.number().int().positive(),
    to_assignment_id: z.number().int().positive().nullable(),
    fraction: z.number().min(0).max(1),
  })
  .refine((b) => b.to_assignment_id !== b.from_assignment_id, 'A boundary needs two different stops');

export const roadtripDayBoundaryListSchema = z.object({
  boundaries: z.array(roadtripDayBoundarySchema),
});
export type RoadtripDayBoundary = z.infer<typeof roadtripDayBoundarySchema>;
