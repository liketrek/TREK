// FE-API-JOURNEY-MAP-001
//
// JRN-04: both reads pin their path and hand back what the server answered.
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { journeyMapApi } from './journeyMap';

describe('journeyMapApi', () => {
  it('FE-API-JOURNEY-MAP-001: reads the layers of a journey and those of a share link', async () => {
    const layers = { places: { status: 'withheld' } };
    const paths: string[] = [];
    server.use(
      http.get('/api/journeys/7/map-layers', ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json(layers);
      }),
      http.get('/api/public/journey/:token/map-layers', ({ request }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json(layers);
      })
    );
    expect(await journeyMapApi.layers(7)).toEqual(layers);
    expect(await journeyMapApi.publicLayers('a/b')).toEqual(layers);
    expect(paths).toEqual(['/api/journeys/7/map-layers', '/api/public/journey/a%2Fb/map-layers']);
  });
});
