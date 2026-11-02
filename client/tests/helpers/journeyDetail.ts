import { useAddonStore } from '../../src/store/addonStore';
import { useAuthStore } from '../../src/store/authStore';
import { usePermissionsStore } from '../../src/store/permissionsStore';
import type { User } from '../../src/types';
import { seedStore } from './store';

/**
 * The install the journey page suite runs on: the owner is signed in with full
 * rights, and a photo provider is on, so the entry editor offers External photos.
 */
export function seedJourneyOwner(user: User): void {
  seedStore(useAuthStore, { isAuthenticated: true, user });
  seedStore(usePermissionsStore, { level: 'owner' } as never);
  seedStore(useAddonStore, {
    addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true } as never],
  });
}
