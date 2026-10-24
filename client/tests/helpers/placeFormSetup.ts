import { vi } from 'vitest';

import { useAuthStore } from '../../src/store/authStore';
import { useTripStore } from '../../src/store/tripStore';
import { buildTrip, buildUser } from './factories';
import { seedStore } from './store';

/** The props an open place form gets when a test sets none: a new place in trip 1. */
export const placeFormProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  place: null,
  prefillCoords: null,
  tripId: 1,
  categories: [],
  onCategoryCreated: vi.fn(),
  assignmentId: null,
  dayAssignments: [],
};

/** A signed-in user without a maps key, in trip 1: what the form reads before it renders. */
export function seedPlaceFormStores() {
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true, hasMapsKey: false });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
}
