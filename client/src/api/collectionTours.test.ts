// FE-API-COLLECTION-TOURS-001 to FE-API-COLLECTION-TOURS-002
//
// LIB-03: every method pins its verb, its path and its body, and hands back what
// the server answered.
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { collectionToursApi } from './collectionTours';

const BASE = '/api/addons/collections/3/tours';

let calls: Array<{ method: string; path: string; body: unknown }> = [];

beforeEach(() => {
  calls = [];
});

function record(data: JsonBodyType | null) {
  return async ({ request }: { request: Request }) => {
    const text = await request.text();
    calls.push({ method: request.method, path: new URL(request.url).pathname, body: text ? JSON.parse(text) : null });
    return data === null ? new HttpResponse(null, { status: 200 }) : HttpResponse.json(data);
  };
}

describe('collectionToursApi', () => {
  it('FE-API-COLLECTION-TOURS-001: lists, reads, keeps and removes the tours of a collection', async () => {
    server.use(
      http.get(BASE, record({ tours: [] })),
      http.get(`${BASE}/4`, record({ tour: { id: 4 }, line: [], points: [], trips: [] })),
      http.post(BASE, record({ tour: { id: 5 } })),
      http.delete(`${BASE}/4`, record({ success: true }))
    );
    expect(await collectionToursApi.list(3)).toEqual({ tours: [] });
    expect((await collectionToursApi.detail(3, 4)).tour).toEqual({ id: 4 });
    expect(await collectionToursApi.save(3, { source_trip_id: 2, source_place_id: 7, name: 'Kept' })).toEqual({
      tour: { id: 5 },
    });
    expect(await collectionToursApi.remove(3, 4)).toBeUndefined();
    expect(calls).toEqual([
      { method: 'GET', path: BASE, body: null },
      { method: 'GET', path: `${BASE}/4`, body: null },
      { method: 'POST', path: BASE, body: { source_trip_id: 2, source_place_id: 7, name: 'Kept' } },
      { method: 'DELETE', path: `${BASE}/4`, body: null },
    ]);
  });

  it('FE-API-COLLECTION-TOURS-002: takes a kept tour into a trip with the choice about its points', async () => {
    server.use(http.post('/api/trips/6/tours/from-collection', record({ tour: { place_id: 9 }, waypoints: [] })));
    const body = { collection_id: 3, collection_tour_id: 4, include_waypoints: false };
    expect((await collectionToursApi.takeOver(6, body)).tour).toEqual({ place_id: 9 });
    expect(calls).toEqual([{ method: 'POST', path: '/api/trips/6/tours/from-collection', body }]);
  });
});
