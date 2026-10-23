import type { StoreApi } from 'zustand';
import { useAddonStore } from '../../src/store/addonStore';
import { useAssistantHintsStore } from '../../src/store/assistantHintsStore';
import { useAuthStore } from '../../src/store/authStore';
import { useInAppNotificationStore } from '../../src/store/inAppNotificationStore';
import { usePaddleObstacleStore } from '../../src/store/paddleObstacleStore';
import { usePermissionsStore } from '../../src/store/permissionsStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTourMapViewportStore } from '../../src/store/tourMapViewportStore';
import { useTourMapVisibilityStore } from '../../src/store/tourMapVisibilityStore';
import { useTrackMarkToolStore } from '../../src/store/trackMarkToolStore';
import { useTripStore } from '../../src/store/tripStore';
import { useVacayStore } from '../../src/store/vacayStore';

/**
 * Every Zustand store in src/, and what resetAllStores does with it.
 *
 * RESET_STORES are put back to the state they had when this module was first
 * imported, before any test touched them. UNRESET_STORES are left alone, each
 * with the reason; their tests reset them on their own. The registry test
 * (tests/unit/helpers/storeRegistry.test.ts) finds every `export const
 * use…Store = create…` under src/ and fails on one that is in neither list,
 * so a new store has to be placed here instead of being forgotten by the
 * reset and leaking state from one test into the next.
 *
 * The stores are imported by name rather than through a glob: an eager glob
 * would load every store module into each of the hundreds of test files that
 * reset, including the ones that mock a store module or import it in a
 * particular order (journeyStore), and a store moved from UNRESET to RESET
 * changes what those files start from. Each such move is its own change.
 */
type ResettableStore = Pick<StoreApi<object>, 'getState' | 'setState'>;

export const RESET_STORES: Record<string, ResettableStore> = {
  useAuthStore,
  useTripStore,
  useSettingsStore,
  useVacayStore,
  useAddonStore,
  useInAppNotificationStore,
  usePermissionsStore,
  useTourMapVisibilityStore,
  useTourMapViewportStore,
  usePaddleObstacleStore,
  useTrackMarkToolStore,
  useAssistantHintsStore,
};

/** Not reset so far; moving one into RESET_STORES changes what every file that resets starts from. */
const NOT_YET = 'never reset by resetAllStores; its own tests set the state they need';

export const UNRESET_STORES: Record<string, string> = {
  useJourneyStore: 'reset in the journey tests themselves; importing it here pulls in a circular import',
  useAssistantStore:
    'the assistant chats, window and live map links; the tests that read it put back its first state themselves',
  useBackgroundTasksStore: NOT_YET,
  useCollectionStore: NOT_YET,
  useCollectionTourStore:
    'its own tests put it back with clear(); it holds one open collection and nothing else reads it',
  useDocSyncOfferStore: NOT_YET,
  useHelpStore: NOT_YET,
  usePluginStore: NOT_YET,
  useRoadtripPreferencesStore: NOT_YET,
  useSaveToCollectionStore: NOT_YET,
  useServerVersionStore: NOT_YET,
  useStudioStore: NOT_YET,
  useSystemNoticeStore: NOT_YET,
  useTourActivityCompareStore:
    'the actual track compared on the map and whether the map can draw it; the tests that read it reset both in their own beforeEach',
  useTourFerrataCrossingStore: 'set by the tour map stage; the tests that read it reset it in their own beforeEach',
  useTourPlaceToolStore: 'reset in the tour tests themselves to initialTourPlaceToolState()',
  useTourPoiStore: 'the places found along a tour; the tests that read it clear it in their own beforeEach',
  useTourRouteHighlightStore:
    'the stretches a bike card points at; the tests that read it clear it in their own beforeEach',
  useTourVisitStore: 'the visits of city walks per day; the tests that read it reset it in their own beforeEach',
  useTripJournalLinkStore: 'the journal link per trip; the tests that read it reset it in their own beforeEach',
};
