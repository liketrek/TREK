import { beforeEach, describe, expect, it } from 'vitest';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import type { Place } from '../../types';
import { openSaveToCollection, placeToSaveTarget } from './saveTarget';

// FE-SAVE-TARGET-001 to FE-SAVE-TARGET-003

const place = { id: 7, trip_id: 3, name: 'Ridge', lat: 47, lng: 11, google_place_id: 'g-1' } as Place;

beforeEach(() => {
  useSaveToCollectionStore.setState({ target: null, tour: null });
});

describe('openSaveToCollection', () => {
  it('FE-SAVE-TARGET-001: a plain place opens the place picker with its provenance, the tour dialog stays shut', () => {
    openSaveToCollection(place, false);
    const state = useSaveToCollectionStore.getState();
    expect(state.target).toEqual(placeToSaveTarget(place));
    expect(state.target).toMatchObject({ source_trip_id: 3, source_place_id: 7, google_place_id: 'g-1' });
    expect(state.tour).toBeNull();
  });

  it('FE-SAVE-TARGET-002: a tour opens the tour keep dialog for its trip and place, never the place picker', () => {
    openSaveToCollection(place, true);
    const state = useSaveToCollectionStore.getState();
    expect(state.tour).toEqual({ tripId: 3, placeId: 7, name: 'Ridge' });
    expect(state.target).toBeNull();
  });

  it('FE-SAVE-TARGET-003: the trip id passed in wins over the place, for rows that carry no trip id', () => {
    const embedded = { ...place, trip_id: undefined } as unknown as Place;
    openSaveToCollection(embedded, true, '12');
    expect(useSaveToCollectionStore.getState().tour).toEqual({ tripId: '12', placeId: 7, name: 'Ridge' });
    useSaveToCollectionStore.getState().closeTour();
    expect(useSaveToCollectionStore.getState().tour).toBeNull();
  });
});
