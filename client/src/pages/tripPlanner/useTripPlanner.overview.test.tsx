import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { buildDay, buildPlace, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { makeActions } from '../../../tests/helpers/plannerActions';
import { resetAllStores, seedInstanceAddons, seedStore } from '../../../tests/helpers/store';
import { healthApi } from '../../api/client';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { accommodationRepo } from '../../repo/accommodationRepo';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { type TripStoreState, useTripStore } from '../../store/tripStore';
import { useTripPlanner } from './useTripPlanner';

vi.mock('../../hooks/useTripWebSocket', () => ({ useTripWebSocket: vi.fn() }));

const day = buildDay({ id: 1 });

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/trips/42']}>
      <TranslationProvider>
        <Routes>
          <Route path="/trips/:id" element={children} />
        </Routes>
      </TranslationProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  resetAllStores();
  seedInstanceAddons([]);
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true, placesPhotosEnabled: false });
  useSettingsStore.setState({ isLoaded: true });
  vi.spyOn(healthApi, 'features').mockResolvedValue({ bookingImport: false, aiParsing: false });
  vi.spyOn(accommodationRepo, 'list').mockResolvedValue({ accommodations: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPlanner(state: Partial<TripStoreState>) {
  useTripStore.setState({
    ...(makeActions() as unknown as Partial<TripStoreState>),
    trip: buildTrip({ id: 42, title: 'Kyoto' }),
    days: [day],
    isLoading: false,
    ...state,
  });
  const rendered = renderHook(useTripPlanner, { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return rendered;
}

describe('useTripPlanner: showing the whole trip', () => {
  it('leaves the day details and selection available while the desktop checks the layout', async () => {
    const { result } = await renderPlanner({ selectedDayId: day.id });

    act(() => {
      result.current.setShowDayDetail(day);
    });
    expect(result.current.showDayDetail).toBe(day);
    act(() => {
      result.current.toggleOverview();
    });
    expect(result.current.overviewActive).toBe(true);
    expect(result.current.showDayDetail).toBe(day);
    expect(result.current.selectedDayId).toBe(day.id);

    act(() => {
      result.current.toggleOverview();
    });
    expect(result.current.overviewActive).toBe(false);
    expect(result.current.showDayDetail).toBe(day);
  });

  it('does not bring the previous day details back when a place card closes', async () => {
    const place = buildPlace({ id: 70 });
    const { result } = await renderPlanner({ places: [place] });

    act(() => {
      result.current.setShowDayDetail(day);
    });
    act(() => {
      result.current.handlePlaceClick(place.id);
    });
    act(() => {
      result.current.toggleOverview();
    });
    expect(result.current.selectedPlaceId).toBe(place.id);
    act(() => {
      result.current.handlePlaceClick(null);
    });
    expect(result.current.showDayDetail).toBeNull();
  });

  it('can hide the overview without changing the selected day or toggling it back on', async () => {
    const { result } = await renderPlanner({ selectedDayId: day.id });

    act(() => {
      result.current.toggleOverview();
    });
    expect(result.current.overviewActive).toBe(true);
    act(() => {
      result.current.hideOverview();
    });
    expect(result.current.overviewActive).toBe(false);
    expect(result.current.selectedDayId).toBe(day.id);
    act(() => {
      result.current.hideOverview();
    });
    expect(result.current.overviewActive).toBe(false);
  });

  it('puts the overview away for this visit only, the remembered switch stays on and the pill brings it back', async () => {
    const { result } = await renderPlanner({ selectedDayId: day.id });
    const remembered = () => useSettingsStore.getState().settings.planner_trip_views?.['42']?.overview;

    act(() => {
      result.current.toggleOverview();
    });
    expect(remembered()).toBe(true);
    act(() => {
      result.current.hideOverview();
    });
    expect(result.current.overviewShown).toBe(false);
    expect(result.current.overviewActive).toBe(false);
    expect(remembered()).toBe(true);

    act(() => {
      result.current.toggleOverview();
    });
    expect(result.current.overviewShown).toBe(true);
    expect(result.current.overviewActive).toBe(true);
    expect(remembered()).toBe(true);
  });
});
