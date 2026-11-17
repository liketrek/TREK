// FE-STORE-TRIPTAGS-001 to FE-STORE-TRIPTAGS-006: the tags of the open trip in the store,
// and what a tag renamed or deleted elsewhere does to the places that carry it.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildAssignment, buildPlace, buildTag, buildTrip } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import { clearAll } from '../../db/offlineDb';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { useTripStore } from '../tripStore';

const monument = buildTag({ id: 7, trip_id: 5, name: 'Monument', color: '#6366f1' });
const zone = buildTag({ id: 8, trip_id: 5, name: 'Zone', color: '#10b981' });

function setOnline(online: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: online, writable: true, configurable: true });
}

/** What the server lists as the tags of trip 5. */
function serve(tags: unknown[]): void {
  server.use(http.get('/api/trips/5/tags', () => HttpResponse.json({ tags })));
}

beforeEach(async () => {
  await clearAll();
  resetAllStores();
  setOnline(true);
  useTripStore.setState({ trip: buildTrip({ id: 5 }) });
});

afterEach(() => {
  setOnline(true);
});

describe('tripTagsSlice', () => {
  it('FE-STORE-TRIPTAGS-001: reads the tags of the open trip, and drops an answer for a trip that is no longer open', async () => {
    serve([monument, zone]);
    await useTripStore.getState().loadTripTags(5);
    expect(useTripStore.getState().tripTags.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);

    server.use(
      http.get('/api/trips/6/tags', () => HttpResponse.json({ tags: [buildTag({ id: 9, name: 'Other trip' })] }))
    );
    await useTripStore.getState().loadTripTags(6);
    expect(useTripStore.getState().tripTags.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);
  });

  it('FE-STORE-TRIPTAGS-002: a tag renamed or deleted elsewhere is taken into the places and visits that carry it', async () => {
    const tagged = buildPlace({
      id: 21,
      trip_id: 5,
      tags: [
        { id: 7, name: 'Monument', color: '#6366f1' },
        { id: 8, name: 'Zone' },
      ],
    });
    const untouched = buildPlace({ id: 22, trip_id: 5, tags: [{ id: 50, name: 'Hidden gem' }] });
    const visit = buildAssignment({ id: 31, place: { ...tagged } });
    const otherVisit = buildAssignment({ id: 32, place: { ...untouched } });
    useTripStore.setState({
      tripTags: [monument, zone],
      places: [tagged, untouched],
      assignments: { '11': [visit, otherVisit] },
      placesCategoryFilter: new Set(['4', 'tag:7', 'tag:8']),
    });
    serve([{ ...monument, name: 'Landmark', color: '#ef4444' }]);

    await useTripStore.getState().loadTripTags(5);

    const state = useTripStore.getState();
    expect(state.tripTags.map((tag) => tag.name)).toEqual(['Landmark']);
    expect(state.places[0].tags).toEqual([{ id: 7, name: 'Landmark', color: '#ef4444' }]);
    expect(state.assignments['11'][0].place.tags).toEqual([{ id: 7, name: 'Landmark', color: '#ef4444' }]);
    // What carries none of the changed tags is the same object as before.
    expect(state.places[1]).toBe(untouched);
    expect(state.assignments['11'][1]).toBe(otherVisit);
    // The deleted tag no longer filters; the renamed one and the category still do.
    expect([...state.placesCategoryFilter]).toEqual(['4', 'tag:7']);
  });

  it('FE-STORE-TRIPTAGS-003: a reading that changes no tag on a place leaves the places and the filter as they are', async () => {
    const tagged = buildPlace({ id: 21, trip_id: 5, tags: [{ id: 7, name: 'Monument', color: '#6366f1' }] });
    const filter = new Set(['tag:7']);
    const assignments = { '11': [buildAssignment({ id: 31, place: { ...tagged } })] };
    useTripStore.setState({ tripTags: [monument], places: [tagged], assignments, placesCategoryFilter: filter });
    serve([monument, zone]);

    await useTripStore.getState().loadTripTags(5);

    const state = useTripStore.getState();
    expect(state.tripTags).toHaveLength(2);
    expect(state.places[0]).toBe(tagged);
    expect(state.assignments).toBe(assignments);
    expect(state.placesCategoryFilter).toBe(filter);
  });

  it('FE-STORE-TRIPTAGS-004: a reading the server refuses keeps the tags on screen', async () => {
    useTripStore.setState({ tripTags: [monument] });
    server.use(http.get('/api/trips/5/tags', () => HttpResponse.json({ error: 'Trip not found' }, { status: 404 })));

    await useTripStore.getState().loadTripTags(5);

    expect(useTripStore.getState().tripTags).toEqual([monument]);
  });

  it('FE-STORE-TRIPTAGS-005: a new tag joins the list by name, and the one the trip has already is not listed twice', async () => {
    useTripStore.setState({ tripTags: [zone] });
    let sent: unknown;
    server.use(
      http.post('/api/trips/5/tags', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ tag: monument }, { status: 201 });
      })
    );

    expect(await useTripStore.getState().addTripTag(5, { name: 'Monument', color: '#6366f1' })).toEqual(monument);
    expect(sent).toEqual({ name: 'Monument', color: '#6366f1' });
    expect(useTripStore.getState().tripTags.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);

    await useTripStore.getState().addTripTag(5, { name: 'monument' });
    expect(useTripStore.getState().tripTags.map((tag) => tag.id)).toEqual([7, 8]);
  });

  it('FE-STORE-TRIPTAGS-006: without a connection a new tag is refused and the list stays; another trip starts without tags', async () => {
    useTripStore.setState({ tripTags: [zone] });
    setOnline(false);

    await expect(useTripStore.getState().addTripTag(5, { name: 'Monument' })).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(useTripStore.getState().tripTags).toEqual([zone]);

    useTripStore.getState().resetTrip();
    expect(useTripStore.getState().tripTags).toEqual([]);
  });
});
