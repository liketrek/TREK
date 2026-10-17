import {
  daySchema,
  tripCopyRequestSchema,
  tripCreateRequestSchema,
  tripMemberSchema,
  tripSchema,
  tripUpdateRequestSchema,
} from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import {
  buildBudgetItem,
  buildDay,
  buildPackingItem,
  buildPlace,
  buildReservation,
  buildTodoItem,
  buildTrip,
  buildTripFile,
  buildUser,
} from '../../factories';
import { contractHandler } from '../contract';

const tripResponse = z.object({ trip: tripSchema });

export const tripsHandlers = [
  // List all trips (active or archived)
  contractHandler('get', '/api/trips', { response: z.object({ trips: z.array(tripSchema) }) }, ({ request }) => {
    const url = new URL(request.url);
    const archived = url.searchParams.get('archived');
    if (archived) {
      return { trips: [] };
    }
    const trip1 = buildTrip({ title: 'Paris Adventure', start_date: '2026-07-01', end_date: '2026-07-10' });
    const trip2 = buildTrip({ title: 'Tokyo Trip', start_date: '2026-09-01', end_date: '2026-09-15' });
    return { trips: [trip1, trip2] };
  }),

  contractHandler('get', '/api/trips/:id', { response: tripResponse }, ({ params }) => ({
    trip: buildTrip({ id: Number(params.id) }),
  })),

  contractHandler('get', '/api/trips/:id/days', { response: z.object({ days: z.array(daySchema) }) }, ({ params }) => {
    const tripId = Number(params.id);
    const day1 = buildDay({ trip_id: tripId, assignments: [], notes_items: [] });
    const day2 = buildDay({ trip_id: tripId, assignments: [], notes_items: [] });
    return { days: [day1, day2] };
  }),

  // The server stores is_archived as 0/1 and answers the stored row, whichever
  // form the request sent; date_shift_mode steers the update and is not a column.
  contractHandler(
    'put',
    '/api/trips/:id',
    { request: tripUpdateRequestSchema, response: tripResponse },
    ({ params, body }) => {
      const { is_archived, date_shift_mode: _mode, ...fields } = body;
      return {
        trip: buildTrip({
          id: Number(params.id),
          ...fields,
          ...(is_archived === undefined ? {} : { is_archived: Number(is_archived) }),
        }),
      };
    }
  ),

  contractHandler('post', '/api/trips', { request: tripCreateRequestSchema, response: tripResponse }, ({ body }) => ({
    trip: buildTrip({ ...body }),
  })),

  contractHandler(
    'get',
    '/api/trips/:id/members',
    { response: z.object({ owner: tripMemberSchema, members: z.array(tripMemberSchema) }) },
    () => ({ owner: buildUser(), members: [] })
  ),

  http.get('/api/trips/:id/accommodations', () => {
    return HttpResponse.json({ accommodations: [] });
  }),

  // The offline bundle has no response schema in @trek/shared yet.
  http.get('/api/trips/:id/bundle', ({ params }) => {
    const tripId = Number(params.id);
    const trip = buildTrip({ id: tripId });
    const day = buildDay({ trip_id: tripId, assignments: [], notes_items: [] });
    return HttpResponse.json({
      trip,
      days: [day],
      places: [buildPlace({ trip_id: tripId })],
      packingItems: [buildPackingItem({ trip_id: tripId })],
      todoItems: [buildTodoItem({ trip_id: tripId })],
      budgetItems: [buildBudgetItem({ trip_id: tripId })],
      reservations: [buildReservation({ trip_id: tripId })],
      files: [buildTripFile({ trip_id: tripId })],
    });
  }),

  contractHandler('delete', '/api/trips/:id', {}, () => HttpResponse.json({ success: true })),

  contractHandler(
    'post',
    '/api/trips/:id/copy',
    { request: tripCopyRequestSchema, response: tripResponse },
    ({ params, body }) => ({
      trip: buildTrip({ id: Number(params.id) + 1000, ...body }),
    })
  ),
];
