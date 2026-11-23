// FE-TP-TRIPADDONS-001 to FE-TP-TRIPADDONS-005
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TripAddon } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { buildTrip, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { makeActions } from '../../../tests/helpers/plannerActions';
import { resetAllStores, seedInstanceAddons, seedStore } from '../../../tests/helpers/store';
import { airtrailApi, authApi, healthApi, tripsApi } from '../../api/client';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore';
import { usePluginStore } from '../../store/pluginStore';
import { useTripAddonsStore } from '../../store/tripAddonsStore';
import { type TripStoreState, useTripStore } from '../../store/tripStore';
import { useTripPlanner } from './useTripPlanner';

/**
 * The trip owner switches addons for one trip, both ways: the planner's tabs,
 * dock, rail and More sheet all come from TRIP_TABS, so they follow the trip's
 * own list, at once when the owner switches while the trip is open.
 */

let searchParams = new URLSearchParams();

vi.mock('react-router', () => ({
  useParams: () => ({ id: '42' }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [searchParams, vi.fn()],
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

const addon = (id: string, enabled: boolean, instanceEnabled: boolean): TripAddon => ({
  id,
  name: id,
  icon: null,
  enabled,
  instanceEnabled,
  overridden: enabled !== instanceEnabled,
});

/** GET /api/trips/42/addons answers this list. */
function tripHas(addons: TripAddon[]) {
  server.use(http.get('/api/trips/42/addons', () => HttpResponse.json({ tripId: 42, addons })));
}

async function renderPlanner() {
  const rendered = renderHook(() => useTripPlanner(), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return rendered;
}

const tabIds = (result: { current: ReturnType<typeof useTripPlanner> }) => result.current.TRIP_TABS.map((t) => t.id);

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
  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue({});
  vi.spyOn(healthApi, 'features').mockResolvedValue({ bookingImport: false, aiParsing: false });
  vi.spyOn(tripsApi, 'getMembers').mockResolvedValue({ owner: null, members: [] });
  vi.spyOn(airtrailApi, 'sync').mockResolvedValue({ changed: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTripPlanner — the trip’s own addons', () => {
  it('FE-TP-TRIPADDONS-001: a trip switches Costs on while the instance has it off', async () => {
    seedInstanceAddons(['packing']);
    tripHas([addon('packing', true, true), addon('budget', true, false)]);

    const { result } = await renderPlanner();

    await waitFor(() => expect(tabIds(result)).toContain('finanzplan'));
    expect(result.current.enabledAddons.budget).toBe(true);
  });

  it('FE-TP-TRIPADDONS-002: a trip switches Lists off while the instance has it on, and its open tab falls back to the plan', async () => {
    seedInstanceAddons(['packing', 'budget']);
    sessionStorage.setItem('trip-tab-42', 'listen');
    tripHas([addon('packing', false, true), addon('budget', true, true)]);

    const { result } = await renderPlanner();

    await waitFor(() => expect(result.current.activeTab).toBe('plan'));
    expect(tabIds(result)).not.toContain('listen');
    expect(tabIds(result)).toContain('finanzplan');
  });

  it('FE-TP-TRIPADDONS-003: the owner switching Tours on while the trip is open turns the tours on at once', async () => {
    seedInstanceAddons([]);
    tripHas([addon('tours', false, false)]);
    const { result } = await renderPlanner();
    await waitFor(() => expect(useTripAddonsStore.getState().trips['1:42']?.status).toBe('ready'));
    expect(result.current.toursEnabled).toBe(false);

    act(() => useTripAddonsStore.getState().publish(42, [addon('tours', true, false)]));

    expect(result.current.toursEnabled).toBe(true);
    expect(tabIds(result)).toContain('tour-planner');
  });

  it('FE-TP-TRIPADDONS-004: a plugin page that replaces Costs stays while the trip has Costs off', async () => {
    seedInstanceAddons(['budget']);
    usePluginStore.setState({
      plugins: [
        { id: 'ledger', name: 'Ledger', type: 'trip-page', tripPage: { replaces: ['finanzplan'] } },
        { id: 'notes', name: 'Notes', type: 'trip-page' },
      ] as never,
      loaded: true,
    });
    tripHas([addon('budget', false, true)]);

    const { result } = await renderPlanner();

    await waitFor(() => expect(useTripAddonsStore.getState().trips['1:42']?.status).toBe('ready'));
    expect(tabIds(result)).toContain('plugin:ledger');
    expect(tabIds(result)).toContain('plugin:notes');
    expect(tabIds(result)).not.toContain('finanzplan');
  });

  it('FE-TP-TRIPADDONS-005: a list that cannot be read leaves the instance switches in charge', async () => {
    seedInstanceAddons(['documents']);
    server.use(http.get('/api/trips/42/addons', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));

    const { result } = await renderPlanner();

    await waitFor(() => expect(useTripAddonsStore.getState().trips['1:42']?.status).toBe('failed'));
    expect(tabIds(result)).toContain('dateien');
    expect(result.current.collabFeatures).toEqual({
      chat: true,
      notes: true,
      links: true,
      polls: true,
      whatsnext: true,
    });
  });
});
