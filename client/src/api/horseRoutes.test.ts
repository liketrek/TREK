// FE-API-HORSE-001 to FE-API-HORSE-002
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../tests/helpers/msw/server';
import { horseRoutesApi } from './horseRoutes';

const reply = { routes: [], truncated: false, source: 'openstreetmap', attribution: '© OpenStreetMap contributors' };
const BBOX = '47.10000,11.20000,47.30000,11.50000';

describe('horseRoutesApi.list', () => {
  it('FE-API-HORSE-001: asks GET /api/trips/:tripId/tours/horse-routes with the view and returns the body', async () => {
    let url = '';
    server.use(
      http.get('/api/trips/7/tours/horse-routes', ({ request }) => {
        url = request.url;
        return HttpResponse.json(reply);
      })
    );

    await expect(horseRoutesApi.list(7, BBOX)).resolves.toEqual(reply);
    expect(new URL(url).searchParams.get('bbox')).toBe(BBOX);
  });

  it('FE-API-HORSE-002: no Overpass mirror answering (502) rejects', async () => {
    server.use(
      http.get('/api/trips/7/tours/horse-routes', () =>
        HttpResponse.json({ error: 'Horse route data is unavailable right now' }, { status: 502 })
      )
    );

    await expect(horseRoutesApi.list(7, BBOX)).rejects.toBeTruthy();
  });
});
