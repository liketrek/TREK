import { useAuthStore } from '../../src/store/authStore';
import { useTripStore } from '../../src/store/tripStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useVacayStore } from '../../src/store/vacayStore';
import { useAddonStore } from '../../src/store/addonStore';
import { useInAppNotificationStore } from '../../src/store/inAppNotificationStore';
import { usePermissionsStore } from '../../src/store/permissionsStore';
// Journey store is reset individually in journey tests to avoid circular import issues

// Capture initial states at import time (before any test modifies them)
const initialAuthState = useAuthStore.getState();
const initialTripState = useTripStore.getState();
const initialSettingsState = useSettingsStore.getState();
const initialVacayState = useVacayStore.getState();
const initialAddonState = useAddonStore.getState();
const initialNotifState = useInAppNotificationStore.getState();
const initialPermsState = usePermissionsStore.getState();
export function resetAllStores(): void {
  useAuthStore.setState(initialAuthState, true);
  useTripStore.setState(initialTripState, true);
  useSettingsStore.setState(initialSettingsState, true);
  useVacayStore.setState(initialVacayState, true);
  useAddonStore.setState(initialAddonState, true);
  useInAppNotificationStore.setState(initialNotifState, true);
  usePermissionsStore.setState(initialPermsState, true);
}

/**
 * Tests routinely seed a store with a partially-populated slice of state,
 * including partial nested objects (e.g. only `settings.time_format`). The
 * store's own setState wants the exact field types, so seeding accepts a
 * deep-partial view and casts at the boundary.
 */
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export function seedStore<T extends object>(
  store: { setState: (partial: Partial<T>, replace?: boolean) => void },
  state: DeepPartial<T>,
): void {
  store.setState(state as Partial<T>);
}
