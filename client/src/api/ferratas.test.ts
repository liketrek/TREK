// FE-API-FERRATAS-001 to FE-API-FERRATAS-002
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../tests/helpers/msw/server';
import { ferratasApi } from './ferratas';

const reply = { ferratas: [], truncated: false, source: 'openstreetmap', attribution: '© OpenStreetMap contributors' };

describe('ferratasApi.list', () => {
  it('FE-API-FERRATAS-001: asks GET /api/trips/:tripId/ferratas with the bbox and returns the body', async () => {
    let url = '';
    server.use(
      http.get('/api/trips/7/ferratas', ({ request }) => {
        url = request.url;
        return HttpResponse.json(reply);
      })
    );

    await expect(ferratasApi.list(7, '46.500,11.700,46.600,11.900')).resolves.toEqual(reply);
    expect(new URL(url).searchParams.get('bbox')).toBe('46.500,11.700,46.600,11.900');
  });

  it('FE-API-FERRATAS-002: an unreachable Overpass (502) rejects', async () => {
    server.use(
      http.get('/api/trips/7/ferratas', () =>
        HttpResponse.json({ error: 'Overpass unavailable', code: 'ferratas_unavailable' }, { status: 502 })
      )
    );

    await expect(ferratasApi.list(7, '46.500,11.700,46.600,11.900')).rejects.toBeTruthy();
  });
});
