import { tripAddonsResponseSchema, tripAddonUpdateRequestSchema } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { contractHandler } from '../contract';

export const addonHandlers = [
  // Whose AI model reads images: off unless a test says otherwise, so no photo picker shows by default.
  http.get('/api/llm/capabilities', () => HttpResponse.json({ images: false })),
  http.get('/api/addons', () => {
    return HttpResponse.json({
      bagTracking: false,
      addons: [
        { id: 'vacay', name: 'Vacay', type: 'feature', icon: 'calendar', enabled: true },
        { id: 'atlas', name: 'Atlas', type: 'feature', icon: 'map', enabled: true },
      ],
    });
  }),
  // A trip that names no addon of its own: every addon follows the instance switch, as before per-trip addons.
  contractHandler('get', '/api/trips/:tripId/addons', { response: tripAddonsResponseSchema }, ({ params }) => ({
    tripId: Number(params.tripId),
    addons: [],
  })),
  contractHandler(
    'put',
    '/api/trips/:tripId/addons/:addonId',
    { request: tripAddonUpdateRequestSchema, response: tripAddonsResponseSchema },
    ({ params, body }) => ({
      tripId: Number(params.tripId),
      addons: [
        {
          id: String(params.addonId),
          name: String(params.addonId),
          icon: null,
          enabled: body.enabled ?? true,
          instanceEnabled: true,
          overridden: body.enabled !== null,
        },
      ],
    })
  ),
];
