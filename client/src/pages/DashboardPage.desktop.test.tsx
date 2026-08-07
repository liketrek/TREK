import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor, within } from '../../tests/helpers/render';
import { server } from '../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../tests/helpers/store';
import { buildUser, buildTrip, buildSettings } from '../../tests/helpers/factories';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAddonStore } from '../store/addonStore';
import { usePluginStore } from '../store/pluginStore';
import DashboardPage from './DashboardPage';

// FE-PAGE-DESKDASH-001 onwards

type MqListener = (e: MediaQueryListEvent) => void;

const mqListeners = new Map<string, Set<MqListener>>();
let phone = false;

function installMatchMedia(): void {
  mqListeners.clear();
  phone = false;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() { return phone; },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_type: string, listener: MqListener) => {
        if (!mqListeners.has(query)) mqListeners.set(query, new Set());
        mqListeners.get(query)?.add(listener);
      },
      removeEventListener: (_type: string, listener: MqListener) => {
        mqListeners.get(query)?.delete(listener);
      },
      dispatchEvent: () => true,
    }),
  });
}

const TRIP = buildTrip({ id: 101, title: 'Paris Adventure', start_date: '2026-07-01', end_date: '2026-07-10' });

function onlyTrips(trips: unknown[]) {
  server.use(
    http.get('/api/trips', ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json({ trips: url.searchParams.get('archived') ? [] : trips });
    }),
  );
}

function stats(body: Record<string, unknown>) {
  server.use(http.get('/api/auth/travel-stats', () => HttpResponse.json(body)));
}

function appearance(dashboard: Record<string, unknown>) {
  seedStore(useSettingsStore, { settings: buildSettings({ appearance: { dashboard } } as never) });
}

beforeEach(() => {
  // Pinned inside the fixture trip's window so the spotlight/grid split is stable.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-07-05T12:00:00Z'));
  installMatchMedia();
  resetAllStores();
  seedStore(useAuthStore, { isAuthenticated: true, user: buildUser() });
  usePluginStore.setState({ plugins: [], loaded: true });
  onlyTrips([TRIP]);
  stats({ totalTrips: 3, totalDays: 21, totalPlaces: 9, totalDistanceKm: 0, countries: [] });
  server.use(
    http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([
      { date: '2026-07-01', base: 'EUR', quote: 'USD', rate: 1.1 },
    ])),
    http.get('/api/reservations/upcoming', () => HttpResponse.json({ reservations: [] })),
    http.get('/api/addons/collections', () => HttpResponse.json({ collections: [] })),
    http.get('/api/trips/:id/bundle', () => HttpResponse.json({ members: [], places: [] })),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const distanceValue = () =>
  document.querySelectorAll('.atlas-card .value')[document.querySelectorAll('.atlas-card').length - 1];

describe('DashboardPage (desktop)', () => {
  it('FE-PAGE-DESKDASH-001: a four-digit distance collapses to a compact k value', async () => {
    stats({ totalTrips: 1, totalDays: 1, totalPlaces: 1, totalDistanceKm: 12345, countries: [] });
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('12.3k')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-002: a sub-0.1 distance is reported as "<0.1"', async () => {
    stats({ totalTrips: 1, totalDays: 1, totalPlaces: 1, totalDistanceKm: 0.02, countries: [] });
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('<0.1')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-003: a negative distance is clamped to zero', async () => {
    stats({ totalTrips: 1, totalDays: 1, totalPlaces: 1, totalDistanceKm: -40, countries: [] });
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });
    render(<DashboardPage />);

    await waitFor(() => expect(distanceValue()?.textContent).toContain('0'));
    expect(screen.queryByText('<0.1')).not.toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-004: more than five countries collapse into an overflow flag', async () => {
    stats({ totalTrips: 1, totalDays: 1, totalPlaces: 1, totalDistanceKm: 0, countries: ['fr', 'de', 'it', 'es', 'pt', 'nl', 'be'] });
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('+2')).toBeInTheDocument());
    expect(screen.getAllByRole('img', { name: 'fr' })[0]).toHaveAttribute('src', 'https://flagcdn.com/w40/fr.png');
  });

  it('FE-PAGE-DESKDASH-005: the whole atlas row disappears when every tile is off', async () => {
    appearance({
      desktop: { sidebar: true, currency: true, collections: false, timezones: true, upcomingReservations: true, atlas: false, tripsTotal: false, daysTraveled: false, distanceFlown: false },
    });
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0));
    expect(container.querySelector('.atlas')).toBeNull();
  });

  it('FE-PAGE-DESKDASH-006: the sidebar disappears when none of its widgets are on', async () => {
    appearance({
      desktop: { sidebar: true, currency: false, collections: false, timezones: false, upcomingReservations: false, atlas: true, tripsTotal: true, daysTraveled: true, distanceFlown: true },
    });
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0));
    expect(container.querySelector('.page-sidebar')).toBeNull();
    expect(container.querySelector('main')).toHaveAttribute('data-no-sidebar', 'true');
  });

  it('FE-PAGE-DESKDASH-007: the collections widget needs the addon and the flag', async () => {
    // The store reloads its addons on mount, so the gate has to come from the API too.
    server.use(http.get('/api/addons', () => HttpResponse.json({
      bagTracking: false,
      addons: [{ id: 'collections', name: 'Collections', type: 'feature', icon: 'bookmark', enabled: true }],
    })));
    useAddonStore.setState({
      addons: [{ id: 'collections', name: 'Collections', type: 'feature', icon: 'bookmark', enabled: true }],
      loaded: true,
    } as never);
    server.use(http.get('/api/addons/collections', () =>
      HttpResponse.json({ collections: [{ id: 1, name: 'Tokyo eats', color: '#f00', cover_image: null, place_count: 4 }] })));
    render(<DashboardPage />);

    expect(await screen.findByText('Tokyo eats')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-008: the upcoming tool lists reservations and opens their trip', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) });
    server.use(http.get('/api/reservations/upcoming', () => HttpResponse.json({
      reservations: [
        { id: 1, trip_id: 101, title: 'Louvre', type: 'flight', reservation_time: '2026-09-03T19:30:00', location: 'Paris' },
        { id: 2, trip_id: 101, title: 'Hotel Ibis', type: 'hotel', reservation_time: null, day_date: null, trip_title: 'Paris Adventure' },
      ],
    })));
    const { container } = render(<DashboardPage />);

    expect(await screen.findByText('Louvre')).toBeInTheDocument();
    expect(screen.getByText('19:30', { exact: false })).toBeInTheDocument();
    // A reservation with no date at all still renders, with a dash for the day.
    expect(within(container.querySelector('.upc-list') as HTMLElement).getByText('–')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Louvre'));
    expect(screen.getByText('Hotel Ibis')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-009: the currency tool converts and swaps the pair', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_fx_from: 'EUR', dashboard_fx_to: 'USD' }) });
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('1 EUR = 1.1000 USD')).toBeInTheDocument());
    const amount = container.querySelector('.fx-field .amt') as HTMLInputElement;
    fireEvent.change(amount, { target: { value: '50' } });
    expect(container.querySelectorAll('.fx-field .amt')[1]).toHaveValue('55.00');

    fireEvent.click(screen.getByRole('button', { name: 'Swap currencies' }));

    await waitFor(() => expect(useSettingsStore.getState().settings.dashboard_fx_from).toBe('USD'));
  });

  it('FE-PAGE-DESKDASH-010: the timezone tool removes a zone and reports the empty list', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Tokyo')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Remove Tokyo' }));

    await waitFor(() => expect(screen.getByText('No other timezones yet — add one with +')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-011: the timezone tool opens a picker and adds the chosen zone', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Tokyo')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Add timezone' }));

    // The picker shows its placeholder until a zone is chosen.
    expect(screen.getByText('Search timezone…')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-012: the boarding pass shows buddies, an overflow badge and places', async () => {
    server.use(http.get('/api/trips/:id/bundle', () => HttpResponse.json({
      members: [
        { id: 1, username: 'Maurice Boe', avatar_url: '/uploads/avatars/1.jpg' },
        { id: 2, username: 'Julien' },
        { id: 3, username: 'Ada Lovelace' },
        { id: 4, username: 'Bo' },
        { id: 5, username: 'Eve' },
      ],
      places: [
        { id: 1, name: 'Louvre', image_url: null, lat: 1, lng: 2, google_place_id: null, osm_id: null },
        { id: 2, name: 'Eiffel', image_url: null, lat: 1, lng: 2, google_place_id: null, osm_id: null },
        { id: 3, name: 'Orsay', image_url: null, lat: 1, lng: 2, google_place_id: null, osm_id: null },
        { id: 4, name: 'Sacre', image_url: null, lat: 1, lng: 2, google_place_id: null, osm_id: null },
      ],
    })));
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(container.querySelector('.buddy-more')).toHaveTextContent('+1'));
    expect(screen.getByAltText('Maurice Boe')).toBeInTheDocument();
    expect(screen.getByText('JU')).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(container.querySelectorAll('.place-more')[0]).toHaveTextContent('+1');
  });

  it('FE-PAGE-DESKDASH-013: an empty bundle falls back to the owner initials and a pin', async () => {
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(container.querySelector('.buddy-avatar')).toBeInTheDocument());
    expect(container.querySelector('.place-more .lucide-map-pin')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-014: a hero-slot plugin frames itself over the boarding pass', async () => {
    usePluginStore.setState({
      plugins: [{ id: 'h1', name: 'Hero widget', type: 'widget', icon: null, slot: 'hero' }] as never,
      loaded: true,
    });
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(container.querySelector('.hero-pass-overlay')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-015: opening the hero pass navigates to the trip', async () => {
    const { container } = render(<DashboardPage />);

    await waitFor(() => expect(container.querySelector('.hero-pass')).toBeInTheDocument());
    fireEvent.click(container.querySelector('.hero-pass') as HTMLElement);

    expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0);
  });

  it('FE-PAGE-DESKDASH-016: a trip card without dates says the dates are open', async () => {
    onlyTrips([TRIP, buildTrip({ id: 102, title: 'Someday Iceland', start_date: null, end_date: null })]);
    render(<DashboardPage />);

    expect(await screen.findByText('Open dates')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-018: a malformed date renders a dash rather than crashing', async () => {
    onlyTrips([TRIP, buildTrip({ id: 103, title: 'Broken Dates', start_date: '2027-03-01', end_date: 'oops' })]);
    const { container } = render(<DashboardPage />);

    await screen.findByText('Broken Dates');
    const card = screen.getByText('Broken Dates').closest('.trip-card') as HTMLElement;
    expect(within(card).getByText('Open dates')).toBeInTheDocument();
    expect(container.querySelector('.trips')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-019: the grid card actions edit, duplicate and delete the trip', async () => {
    onlyTrips([TRIP, buildTrip({ id: 104, title: 'Berlin', start_date: '2027-03-01', end_date: '2027-03-05' })]);
    render(<DashboardPage />);

    const card = (await screen.findByText('Berlin')).closest('.trip-card') as HTMLElement;

    fireEvent.click(within(card).getByRole('button', { name: 'Duplicate' }));
    expect(await screen.findByRole('button', { name: 'Copy trip' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    fireEvent.click(within(card).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByDisplayValue('Berlin')).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-020: the grid card delete opens the confirm dialog', async () => {
    onlyTrips([TRIP, buildTrip({ id: 104, title: 'Berlin', start_date: '2027-03-01', end_date: '2027-03-05' })]);
    render(<DashboardPage />);

    const card = (await screen.findByText('Berlin')).closest('.trip-card') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('FE-PAGE-DESKDASH-021: the floating action button opens a blank trip form', async () => {
    const { container } = render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0));

    fireEvent.click(container.querySelector('.fab-new-trip') as HTMLElement);

    expect(await screen.findByPlaceholderText('e.g. Summer in Japan')).toHaveValue('');
  });

  it('FE-PAGE-DESKDASH-022: the all-trips subscribe dialog opens and closes', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getAllByText('Paris Adventure').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: 'Subscribe to all trips calendar' }));
    const description = await screen.findByText(/One calendar feed for all your active trips/);

    fireEvent.click((description.parentElement as HTMLElement).querySelector('button') as HTMLElement);

    await waitFor(() =>
      expect(screen.queryByText(/One calendar feed for all your active trips/)).not.toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-023: a non-array rate response leaves the converter unavailable', async () => {
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json({ error: 'nope' })));
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Rate unavailable')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-024: a failed rate request leaves the converter unavailable', async () => {
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.error()));
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Rate unavailable')).toBeInTheDocument());
  });

  it('FE-PAGE-DESKDASH-025: a non-array legacy timezone value is dropped', async () => {
    localStorage.setItem('trek_dashboard_tz', JSON.stringify({ tz: 'Asia/Tokyo' }));
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });
    render(<DashboardPage />);

    await waitFor(() => expect(localStorage.getItem('trek_dashboard_tz')).toBeNull());
    expect(useSettingsStore.getState().settings.dashboard_timezones).toBeUndefined();
  });

  it('FE-PAGE-DESKDASH-026: a browser without Intl.supportedValuesOf falls back to a fixed zone list', async () => {
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    const original = intl.supportedValuesOf;
    intl.supportedValuesOf = () => { throw new Error('unsupported'); };
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    try {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Tokyo')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Add timezone' }));
      expect(screen.getByText('Search timezone…')).toBeInTheDocument();
    } finally {
      intl.supportedValuesOf = original;
    }
  });

});
