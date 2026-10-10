import type { StoreApi } from 'zustand';
import { RESET_STORES } from './storeRegistry';

// The state of each store in the registry when this module was first imported,
// before any test modified it.
const initialStates = Object.entries(RESET_STORES).map(([name, store]) => ({ name, store, state: store.getState() }));

/** Puts every store in RESET_STORES (tests/helpers/storeRegistry.ts) back to its initial state. */
export function resetAllStores(): void {
  for (const { store, state } of initialStates) store.setState(state, true);
}

/**
 * Tests routinely seed a store with a partially-populated slice of state,
 * including partial nested objects (e.g. only `settings.time_format`). The
 * store's own setState wants the exact field types, so seeding accepts a
 * deep-partial view and casts at the boundary.
 *
 * Typed against zustand's own StoreApi rather than a hand-written
 * `{ setState: ... }` shape: as of v5 setState is an overload pair (partial +
 * replace?: false, full state + replace: true), and no single signature is
 * assignable to it.
 */
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export function seedStore<T extends object>(store: Pick<StoreApi<T>, 'setState'>, state: DeepPartial<T>): void {
  store.setState(state as Partial<T>);
}
