import { placeCreateRequestSchema, placeSchema, placeUpdateRequestSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildPlace } from '../../factories';
import { contractHandler } from '../contract';

const placeResponse = z.object({ place: placeSchema });

export const placesHandlers = [
  contractHandler(
    'get',
    '/api/trips/:id/places',
    { response: z.object({ places: z.array(placeSchema) }) },
    ({ params }) => {
      const tripId = Number(params.id);
      return { places: [buildPlace({ trip_id: tripId }), buildPlace({ trip_id: tripId })] };
    }
  ),

  contractHandler(
    'post',
    '/api/trips/:id/places',
    { request: placeCreateRequestSchema, response: placeResponse },
    ({ params, body }) => ({
      place: buildPlace({ trip_id: Number(params.id), ...body }),
    })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/places/:placeId',
    { request: placeUpdateRequestSchema, response: placeResponse },
    ({ params, body }) => ({
      place: buildPlace({ id: Number(params.placeId), trip_id: Number(params.id), ...body }),
    })
  ),

  // A multipart upload: no JSON body to hold to a schema, only the answer.
  contractHandler('post', '/api/trips/:id/places/:placeId/image', { response: placeResponse }, ({ params }) => ({
    place: buildPlace({
      id: Number(params.placeId),
      trip_id: Number(params.id),
      image_url: '/uploads/places/mock.jpg',
    }),
  })),

  contractHandler('delete', '/api/trips/:id/places/:placeId', {}, () => HttpResponse.json({ success: true })),
];
