// FE-TSLICE-PLACE-001 to FE-TSLICE-PLACE-015 (image upload, ratings, bulk ops, error paths)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildAssignment, buildPlace } from '../../../tests/helpers/factories';
import { placesApi } from '../../api/client';
import { useTripStore } from '../tripStore';
import type { Place } from '../../types';

beforeEach(() => {
  resetAllStores();
  server.resetHandlers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Rejection shaped like an axios error so getApiErrorMessage picks the server text. */
function apiError(message: string): unknown {
  return { response: { data: { error: message } } };
}

describe('placesSlice', () => {
  describe('uploadPlaceImage', () => {
    it('FE-TSLICE-PLACE-001: applies the returned place and keeps the assignment times', async () => {
      const place = buildPlace({ id: 10, trip_id: 1, image_url: null });
      const assignment = buildAssignment({
        id: 100,
        day_id: 3,
        // The override is what makes the embedded copy differ from the pool row:
        // the server projects COALESCE(assignment_time, place_time), so without
        // it these two could not disagree in the first place.
        assignment_time: '09:00',
        assignment_end_time: '10:30',
        place: { ...place, place_time: '09:00', end_time: '10:30' },
      });
      seedStore(useTripStore, { places: [place], assignments: { '3': [assignment] } });

      const uploaded: Place = { ...place, image_url: '/uploads/places/pic.jpg' };
      vi.spyOn(placesApi, 'uploadImage').mockResolvedValue({ place: uploaded });

      const result = await useTripStore
        .getState()
        .uploadPlaceImage(1, 10, new File(['x'], 'pic.jpg', { type: 'image/jpeg' }));

      expect(result.image_url).toBe('/uploads/places/pic.jpg');
      expect(useTripStore.getState().places[0].image_url).toBe('/uploads/places/pic.jpg');
      const embedded = useTripStore.getState().assignments['3'][0].place;
      expect(embedded.image_url).toBe('/uploads/places/pic.jpg');
      // The assignment owns these times, so the fresh place must not overwrite them.
      expect(embedded.place_time).toBe('09:00');
      expect(embedded.end_time).toBe('10:30');
    });

    it('FE-TSLICE-PLACE-002: leaves the assignments map alone when no day embeds the place', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      const other = buildPlace({ id: 20, trip_id: 1 });
      const assignment = buildAssignment({ id: 100, day_id: 3, place: other });
      seedStore(useTripStore, { places: [place, other], assignments: { '3': [assignment] } });
      const before = useTripStore.getState().assignments;

      vi.spyOn(placesApi, 'uploadImage').mockResolvedValue({
        place: { ...place, image_url: '/uploads/places/pic.jpg' },
      });

      await useTripStore.getState().uploadPlaceImage(1, 10, new File(['x'], 'pic.jpg'));

      expect(useTripStore.getState().assignments).toBe(before);
      expect(useTripStore.getState().places[0].image_url).toBe('/uploads/places/pic.jpg');
    });

    it('FE-TSLICE-PLACE-003: surfaces the server message on failure', async () => {
      seedStore(useTripStore, { places: [buildPlace({ id: 10, trip_id: 1 })] });
      vi.spyOn(placesApi, 'uploadImage').mockRejectedValue(apiError('Image too large'));

      await expect(
        useTripStore.getState().uploadPlaceImage(1, 10, new File(['x'], 'pic.jpg')),
      ).rejects.toThrow('Image too large');
      expect(useTripStore.getState().places[0].image_url).toBeNull();
    });
  });

  describe('ratePlace', () => {
    it('FE-TSLICE-PLACE-004: a numeric rating is PUT and the fresh average is applied', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [place] });

      let sent: number | undefined;
      server.use(
        http.put('/api/trips/1/places/10/rating', async ({ request }) => {
          const body = await request.json() as { rating: number };
          sent = body.rating;
          return HttpResponse.json({ place: { ...place, rating_avg: 4.5, rating_count: 2 } });
        }),
      );

      const result = await useTripStore.getState().ratePlace(1, 10, 5);

      expect(sent).toBe(5);
      expect(result.rating_avg).toBe(4.5);
      expect(useTripStore.getState().places[0].rating_count).toBe(2);
    });

    it('FE-TSLICE-PLACE-005: a null rating clears the vote via DELETE', async () => {
      const place = buildPlace({ id: 10, trip_id: 1, rating_avg: 4 });
      seedStore(useTripStore, { places: [place] });

      let deleted = false;
      server.use(
        http.delete('/api/trips/1/places/10/rating', () => {
          deleted = true;
          return HttpResponse.json({ place: { ...place, rating_avg: null, rating_count: 0 } });
        }),
      );

      await useTripStore.getState().ratePlace(1, 10, null);

      expect(deleted).toBe(true);
      expect(useTripStore.getState().places[0].rating_avg).toBeNull();
    });

    it('FE-TSLICE-PLACE-006: throws with the server message when rating fails', async () => {
      seedStore(useTripStore, { places: [buildPlace({ id: 10, trip_id: 1 })] });
      server.use(
        http.put('/api/trips/1/places/10/rating', () =>
          HttpResponse.json({ error: 'Rating out of range' }, { status: 422 }),
        ),
      );

      await expect(useTripStore.getState().ratePlace(1, 10, 9)).rejects.toThrow('Rating out of range');
    });
  });

  describe('deletePlace', () => {
    it('FE-TSLICE-PLACE-007: rethrows the server message and keeps the pool intact', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [place] });
      server.use(
        http.delete('/api/trips/1/places/10', () =>
          HttpResponse.json({ error: 'Place is locked' }, { status: 409 }),
        ),
      );

      await expect(useTripStore.getState().deletePlace(1, 10)).rejects.toThrow('Place is locked');
      expect(useTripStore.getState().places).toHaveLength(1);
    });
  });

  describe('deletePlacesMany', () => {
    it('FE-TSLICE-PLACE-008: removes every listed place and prunes their assignments', async () => {
      const a = buildPlace({ id: 10, trip_id: 1 });
      const b = buildPlace({ id: 20, trip_id: 1 });
      const keep = buildPlace({ id: 30, trip_id: 1 });
      seedStore(useTripStore, {
        places: [a, b, keep],
        assignments: {
          '1': [buildAssignment({ id: 100, day_id: 1, place: a }), buildAssignment({ id: 101, day_id: 1, place: keep })],
          '2': [buildAssignment({ id: 200, day_id: 2, place: keep })],
        },
      });

      let sentIds: number[] = [];
      server.use(
        http.post('/api/trips/1/places/bulk-delete', async ({ request }) => {
          const body = await request.json() as { ids: number[] };
          sentIds = body.ids;
          return HttpResponse.json({ deleted: body.ids, count: body.ids.length });
        }),
      );

      await useTripStore.getState().deletePlacesMany(1, [10, 20]);

      expect(sentIds).toEqual([10, 20]);
      expect(useTripStore.getState().places.map(p => p.id)).toEqual([30]);
      expect(useTripStore.getState().assignments['1'].map(x => x.id)).toEqual([101]);
      // Day 2 held no deleted place, so it is untouched.
      expect(useTripStore.getState().assignments['2']).toHaveLength(1);
    });

    it('FE-TSLICE-PLACE-009: an empty id list is a no-op and issues no request', async () => {
      const a = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [a] });
      let called = false;
      server.use(
        http.post('/api/trips/1/places/bulk-delete', () => {
          called = true;
          return HttpResponse.json({ deleted: [], count: 0 });
        }),
      );

      await useTripStore.getState().deletePlacesMany(1, []);

      expect(called).toBe(false);
      expect(useTripStore.getState().places).toHaveLength(1);
    });

    it('FE-TSLICE-PLACE-010: throws and keeps the pool when the bulk delete fails', async () => {
      const a = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [a] });
      server.use(
        http.post('/api/trips/1/places/bulk-delete', () =>
          HttpResponse.json({ error: 'Bulk delete refused' }, { status: 500 }),
        ),
      );

      await expect(useTripStore.getState().deletePlacesMany(1, [10])).rejects.toThrow('Bulk delete refused');
      expect(useTripStore.getState().places).toHaveLength(1);
    });
  });

  describe('updatePlacesMany', () => {
    it('FE-TSLICE-PLACE-011: leaves the days it does not touch alone', async () => {
      const a = buildPlace({ id: 10, trip_id: 1, category_id: 1 });
      const other = buildPlace({ id: 20, trip_id: 1, category_id: 1 });
      seedStore(useTripStore, {
        places: [a, other],
        assignments: { '9': [buildAssignment({ id: 900, day_id: 9, place: other })] },
      });
      const before = useTripStore.getState().assignments;

      server.use(
        http.post('/api/trips/1/places/bulk-update', () => HttpResponse.json({ updated: [10], count: 1 })),
      );

      await useTripStore.getState().updatePlacesMany(1, [10], { category_id: 7 });

      expect(useTripStore.getState().places.find(p => p.id === 10)?.category_id).toBe(7);
      expect(useTripStore.getState().assignments).toBe(before);
    });

    it('FE-TSLICE-PLACE-012: throws with the server message when the bulk update fails', async () => {
      const a = buildPlace({ id: 10, trip_id: 1, category_id: 1 });
      seedStore(useTripStore, { places: [a] });
      server.use(
        http.post('/api/trips/1/places/bulk-update', () =>
          HttpResponse.json({ error: 'Unknown category' }, { status: 400 }),
        ),
      );

      await expect(
        useTripStore.getState().updatePlacesMany(1, [10], { category_id: 99 }),
      ).rejects.toThrow('Unknown category');
      expect(useTripStore.getState().places[0].category_id).toBe(1);
    });
  });

  describe('refreshPlaces', () => {
    it('FE-TSLICE-PLACE-013: swallows a failing list request and keeps the current pool', async () => {
      const stale = buildPlace({ id: 10, trip_id: 1, name: 'Stale' });
      seedStore(useTripStore, { places: [stale] });
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(
        http.get('/api/trips/1/places', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      );

      await expect(useTripStore.getState().refreshPlaces(1)).resolves.toBeUndefined();

      expect(useTripStore.getState().places[0].name).toBe('Stale');
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('updatePlace', () => {
    it('FE-TSLICE-PLACE-015: throws the server message and leaves the pool untouched', async () => {
      const place = buildPlace({ id: 10, trip_id: 1, name: 'Louvre' });
      seedStore(useTripStore, { places: [place] });
      server.use(
        http.put('/api/trips/1/places/10', () =>
          HttpResponse.json({ error: 'Place is locked' }, { status: 409 }),
        ),
      );

      await expect(
        useTripStore.getState().updatePlace(1, 10, { name: 'Orsay' }),
      ).rejects.toThrow('Place is locked');
      expect(useTripStore.getState().places[0].name).toBe('Louvre');
    });
  });

  describe('addPlace', () => {
    it('FE-TSLICE-PLACE-014: surfaces the server message on failure', async () => {
      server.use(
        http.post('/api/trips/1/places', () =>
          HttpResponse.json({ error: 'Name required' }, { status: 422 }),
        ),
      );

      await expect(useTripStore.getState().addPlace(1, { name: '' })).rejects.toThrow('Name required');
    });
  });
});
