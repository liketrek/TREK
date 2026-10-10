import {
  assignmentCreateRequestSchema,
  assignmentMoveRequestSchema,
  assignmentReorderRequestSchema,
  assignmentSchema,
} from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildAssignment, buildPlace } from '../../factories';
import { contractHandler } from '../contract';

export const assignmentsHandlers = [
  contractHandler(
    'post',
    '/api/trips/:id/days/:dayId/assignments',
    { request: assignmentCreateRequestSchema, response: z.object({ assignment: assignmentSchema }) },
    ({ params, body }) => {
      const placeId = Number(body.place_id);
      const place = buildPlace({ id: placeId, trip_id: Number(params.id) });
      const assignment = buildAssignment({ day_id: Number(params.dayId), place_id: placeId, place, order_index: 0 });
      return { assignment };
    }
  ),

  contractHandler('delete', '/api/trips/:id/days/:dayId/assignments/:assignmentId', {}, () =>
    HttpResponse.json({ success: true })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/days/:dayId/assignments/reorder',
    { request: assignmentReorderRequestSchema },
    () => ({
      success: true,
    })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/assignments/:assignmentId/move',
    { request: assignmentMoveRequestSchema },
    () => ({
      success: true,
    })
  ),
];
