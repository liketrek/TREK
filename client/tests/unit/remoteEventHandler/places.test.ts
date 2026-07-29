import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildPlace, buildAssignment } from '../../helpers/factories';

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > places', () => {
  const seedData = () => {
    const place = buildPlace({ id: 1, name: 'Original' });
    const assignment = buildAssignment({ id: 100, place, day_id: 10 });
    useTripStore.setState({
      places: [place],
      assignments: { '10': [assignment] },
    });
  };

  it('FE-WSEVT-PLACE-001: place:created prepends new place to places array', () => {
    seedData();
    const newPlace = buildPlace({ id: 99, name: 'New Place' });
    useTripStore.getState().handleRemoteEvent({ type: 'place:created', place: newPlace });
    const { places } = useTripStore.getState();
    expect(places[0].id).toBe(99);
    expect(places).toHaveLength(2);
  });

  it('FE-WSEVT-PLACE-002: place:created is idempotent — no duplicate if same ID', () => {
    seedData();
    const duplicate = buildPlace({ id: 1, name: 'Duplicate' });
    useTripStore.getState().handleRemoteEvent({ type: 'place:created', place: duplicate });
    const { places } = useTripStore.getState();
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Original');
  });

  it('FE-WSEVT-PLACE-003: place:updated updates place in places array', () => {
    seedData();
    const updated = buildPlace({ id: 1, name: 'Updated Name' });
    useTripStore.getState().handleRemoteEvent({ type: 'place:updated', place: updated });
    const { places } = useTripStore.getState();
    expect(places[0].name).toBe('Updated Name');
  });

  it('FE-WSEVT-PLACE-004: place:updated cascades into assignments nested place', () => {
    seedData();
    const updated = buildPlace({ id: 1, name: 'Cascaded Update' });
    useTripStore.getState().handleRemoteEvent({ type: 'place:updated', place: updated });
    const { assignments } = useTripStore.getState();
    expect(assignments['10'][0].place?.name).toBe('Cascaded Update');
  });

  it('FE-WSEVT-PLACE-005: place:deleted removes place from places array', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'place:deleted', placeId: 1 });
    const { places } = useTripStore.getState();
    expect(places).toHaveLength(0);
  });

  it('FE-WSEVT-PLACE-006: place:deleted cascades — assignments referencing that place are removed', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'place:deleted', placeId: 1 });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(0);
  });

  it('FE-WSEVT-PLACE-007: place:updated leaves other places and their assignments untouched', () => {
    const one = buildPlace({ id: 1, name: 'One' });
    const two = buildPlace({ id: 2, name: 'Two' });
    useTripStore.setState({
      places: [one, two],
      assignments: {
        '10': [
          buildAssignment({ id: 100, place: one, day_id: 10 }),
          buildAssignment({ id: 200, place: two, day_id: 10 }),
        ],
      },
    });
    useTripStore.getState().handleRemoteEvent({ type: 'place:updated', place: buildPlace({ id: 2, name: 'Two renamed' }) });
    const { places, assignments } = useTripStore.getState();
    expect(places.map(p => p.name)).toEqual(['One', 'Two renamed']);
    expect(assignments['10'].map(a => a.place?.name)).toEqual(['One', 'Two renamed']);
  });

  it('FE-WSEVT-PLACE-008: place:deleted keeps assignments of the other places', () => {
    const one = buildPlace({ id: 1 });
    const two = buildPlace({ id: 2 });
    useTripStore.setState({
      places: [one, two],
      assignments: {
        '10': [
          buildAssignment({ id: 100, place: one, day_id: 10 }),
          buildAssignment({ id: 200, place: two, day_id: 10 }),
        ],
      },
    });
    useTripStore.getState().handleRemoteEvent({ type: 'place:deleted', placeId: 1 });
    const { places, assignments } = useTripStore.getState();
    expect(places.map(p => p.id)).toEqual([2]);
    expect(assignments['10'].map(a => a.id)).toEqual([200]);
  });
});
