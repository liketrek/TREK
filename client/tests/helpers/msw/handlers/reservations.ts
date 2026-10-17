import { reservationCreateRequestSchema, reservationSchema, reservationUpdateRequestSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildReservation } from '../../factories';
import { contractHandler } from '../contract';

const reservationResponse = z.object({ reservation: reservationSchema });

export const reservationsHandlers = [
  contractHandler(
    'get',
    '/api/trips/:id/reservations',
    { response: z.object({ reservations: z.array(reservationSchema) }) },
    ({ params }) => ({ reservations: [buildReservation({ trip_id: Number(params.id) })] })
  ),

  contractHandler(
    'post',
    '/api/trips/:id/reservations',
    { request: reservationCreateRequestSchema, response: reservationResponse },
    ({ params, body }) => ({ reservation: buildReservation({ trip_id: Number(params.id), ...body }) })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/reservations/:reservationId',
    { request: reservationUpdateRequestSchema, response: reservationResponse },
    ({ params, body }) => ({
      reservation: buildReservation({ id: Number(params.reservationId), trip_id: Number(params.id), ...body }),
    })
  ),

  contractHandler('delete', '/api/trips/:id/reservations/:reservationId', {}, () =>
    HttpResponse.json({ success: true })
  ),
];
