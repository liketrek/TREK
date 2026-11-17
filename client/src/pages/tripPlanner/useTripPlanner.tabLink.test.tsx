// FE-TP-TABLINK-001
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { buildTrip, buildUser } from '../../../tests/helpers/factories';
import { makeActions } from '../../../tests/helpers/plannerActions';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { addonsApi, airtrailApi, authApi, healthApi, tripsApi } from '../../api/client';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore';
import { usePluginStore } from '../../store/pluginStore';
import { type TripStoreState, useTripStore } from '../../store/tripStore';
import { useTripPlanner } from './useTripPlanner';

/**
 * A `?tab=` that arrives while the planner is already open, the way a notification
 * opens one. The planner is shared by the desktop page and the phone shell, so the
 * switch has to happen here and not in a part only one of them mounts.
 */

let searchParams = new URLSearchParams();
const setSearchParams = vi.fn((updater: (p: URLSearchParams) => URLSearchParams) => {
  const next = new URLSearchParams(searchParams);
  searchParams = typeof updater === 'function' ? updater(next) : next;
});

vi.mock('react-router', () => ({
  useParams: () => ({ id: '42' }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [searchParams, setSearchParams],
}));

vi.mock('../../hooks/useTripWebSocket', () => ({ useTripWebSocket: vi.fn() }));

vi.mock('../../hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({
    route: null,
    routeSegments: [],
    routeVias: [],
    routeInfo: null,
    setRoute: vi.fn(),
    setRouteInfo: vi.fn(),
    updateRouteForDay: vi.fn(async () => {}),
  }),
}));

vi.mock('../../hooks/useAirtrailConnection', () => ({
  useAirtrailConnection: () => ({ airtrailEnabled: false, connected: false, available: false, loading: false }),
}));

vi.mock('../../repo/accommodationRepo', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../repo/accommodationRepo')>();
  return { accommodationRepo: { ...real.accommodationRepo, list: vi.fn(async () => ({ accommodations: [] })) } };
});

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => undefined),
  fetchPhoto: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetAllStores();
  searchParams = new URLSearchParams();
  usePluginStore.setState({ plugins: [], loaded: true });
  useBackgroundTasksStore.setState({ tasks: [] });
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true, placesPhotosEnabled: false });
  useTripStore.setState({
    trip: buildTrip({ id: 42, title: 'Kyoto' }),
    isLoading: false,
    days: [],
    places: [],
    assignments: {},
    reservations: [],
    ...(makeActions() as unknown as Partial<TripStoreState>),
  } as Partial<TripStoreState>);

  vi.spyOn(addonsApi, 'enabled').mockResolvedValue({ addons: [{ id: 'collab' }] });
  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue({});
  vi.spyOn(healthApi, 'features').mockResolvedValue({ bookingImport: false, aiParsing: false });
  vi.spyOn(tripsApi, 'getMembers').mockResolvedValue({ owner: null, members: [] });
  vi.spyOn(airtrailApi, 'sync').mockResolvedValue({ changed: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTripPlanner — ?tab= while the planner is open', () => {
  it('FE-TP-TABLINK-001: a message link switches an already mounted planner to Collab and remembers the tab', async () => {
    const { result, rerender } = renderHook(() => useTripPlanner(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.TRIP_TABS.map((t) => t.id)).toContain('collab'));
    expect(result.current.activeTab).toBe('plan');

    searchParams = new URLSearchParams('tab=collab');
    rerender();

    await waitFor(() => expect(result.current.activeTab).toBe('collab'));
    expect(searchParams.has('tab')).toBe(false);
    expect(sessionStorage.getItem('trip-tab-42')).toBe('collab');
  });
});
