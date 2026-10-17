// FE-TP-COVER-001 to FE-TP-COVER-002
//
// The cover update the trip form hands back, on the desktop planner and the phone trip
// sheets alike.
import { buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import { applyTripCoverUpdate } from './tripCover';

describe('applyTripCoverUpdate', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('FE-TP-COVER-001: patches the new cover into the loaded trip and keeps the rest', () => {
    seedStore(useTripStore, {
      trip: buildTrip({ id: 1, title: 'Japan 2026', cover_image: '/uploads/covers/old.jpg' }),
    });
    applyTripCoverUpdate(1, '/uploads/covers/new.jpg');
    expect(useTripStore.getState().trip).toMatchObject({ title: 'Japan 2026', cover_image: '/uploads/covers/new.jpg' });

    applyTripCoverUpdate(1, null);
    expect(useTripStore.getState().trip?.cover_image).toBeNull();
  });

  it('FE-TP-COVER-002: leaves the store alone without a loaded trip', () => {
    seedStore(useTripStore, { trip: null });
    applyTripCoverUpdate(1, '/uploads/covers/new.jpg');
    expect(useTripStore.getState().trip).toBeNull();
  });
});
