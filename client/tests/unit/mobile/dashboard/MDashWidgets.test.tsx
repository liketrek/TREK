import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import {
  resolveMobileDashOrder, useMobileDashOrder, useMobileDashVisibility, MobileDashWidget,
} from '../../../../src/mobile/screens/dashboard/MDashWidgets';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useAddonStore } from '../../../../src/store/addonStore';
import type { UpcomingReservation } from '../../../../src/pages/dashboard/dashboardModel';

// FE-MOB-DWID-001 onwards

const RATES = [
  { date: '2026-07-01', base: 'EUR', quote: 'USD', rate: 1.1 },
  { date: '2026-07-01', base: 'EUR', quote: 'CHF', rate: 0.95 },
];

function fxHandler(body: unknown = RATES) {
  server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json(body)));
}

function collectionsHandler(collections: unknown[]) {
  server.use(http.get('/api/addons/collections', () => HttpResponse.json({ collections })));
}

function LocationEcho() {
  const location = useLocation();
  return <span data-testid="loc">{location.pathname}</span>;
}

function enableCollectionsAddon(enabled: boolean) {
  useAddonStore.setState({
    addons: [{ id: 'collections', name: 'Collections', type: 'global', icon: 'bookmark', enabled }],
    loaded: true,
  } as never);
}

beforeEach(() => {
  resetAllStores();
  fxHandler();
  collectionsHandler([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveMobileDashOrder', () => {
  it('FE-MOB-DWID-001: falls back to the built-in order without a stored one', () => {
    expect(resolveMobileDashOrder(undefined)).toEqual([
      'trips', 'currency', 'collections', 'timezones', 'upcomingReservations',
    ]);
  });

  it('FE-MOB-DWID-002: keeps the stored order and appends the missing blocks', () => {
    expect(resolveMobileDashOrder(['timezones', 'trips'])).toEqual([
      'timezones', 'trips', 'currency', 'collections', 'upcomingReservations',
    ]);
  });

  it('FE-MOB-DWID-003: drops unknown and duplicated tokens', () => {
    expect(resolveMobileDashOrder(['currency', 'nope', 'currency', 'trips'])).toEqual([
      'currency', 'trips', 'collections', 'timezones', 'upcomingReservations',
    ]);
  });
});

describe('mobile dashboard order + visibility hooks', () => {
  it('FE-MOB-DWID-004: useMobileDashOrder reads the appearance blob', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({
        appearance: { dashboard: { mobileOrder: ['upcomingReservations', 'trips'] } },
      } as never),
    });

    const { result } = renderHook(() => useMobileDashOrder());

    expect(result.current[0]).toBe('upcomingReservations');
    expect(result.current[1]).toBe('trips');
  });

  it('FE-MOB-DWID-005: trips is always visible, widgets follow their flags', () => {
    enableCollectionsAddon(true);
    seedStore(useSettingsStore, {
      settings: buildSettings({
        appearance: { dashboard: { mobile: { currency: false, collections: true, timezones: true, upcomingReservations: false } } },
      } as never),
    });

    const { result } = renderHook(() => useMobileDashVisibility());

    expect(result.current).toEqual({
      trips: true,
      currency: false,
      collections: true,
      timezones: true,
      upcomingReservations: false,
    });
  });

  it('FE-MOB-DWID-006: collections stays hidden while the addon is off', () => {
    enableCollectionsAddon(false);

    const { result } = renderHook(() => useMobileDashVisibility());

    expect(result.current.collections).toBe(false);
    expect(result.current.currency).toBe(true);
  });
});

describe('MobileDashWidget', () => {
  it('FE-MOB-DWID-007: renders nothing for the trips block', () => {
    const { container } = render(<MobileDashWidget id="trips" upcoming={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('MCurrencyWidget', () => {
  it('FE-MOB-DWID-008: converts the amount with the fetched rate', async () => {
    render(<MobileDashWidget id="currency" upcoming={[]} />);

    expect(screen.getByText('Currency')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('1 EUR = 1.1000 USD')).toBeInTheDocument());
    // 100 (default amount) * 1.1
    expect(screen.getByText('110.00')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '250,5' } });
    expect(screen.getByText('275.55')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-009: a non-array response leaves the rate unavailable', async () => {
    fxHandler({ error: 'nope' });
    render(<MobileDashWidget id="currency" upcoming={[]} />);

    await waitFor(() => expect(screen.getByText('Rate unavailable')).toBeInTheDocument());
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-010: a failed request leaves the rate unavailable', async () => {
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.error()));
    render(<MobileDashWidget id="currency" upcoming={[]} />);

    await waitFor(() => expect(screen.getByText('Rate unavailable')).toBeInTheDocument());
  });

  it('FE-MOB-DWID-011: swapping writes the reversed pair to the settings store', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_fx_from: 'EUR', dashboard_fx_to: 'USD' }) });
    render(<MobileDashWidget id="currency" upcoming={[]} />);
    await waitFor(() => expect(screen.getByText('1 EUR = 1.1000 USD')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Swap currencies' }));

    await waitFor(() => {
      const s = useSettingsStore.getState().settings;
      expect(s.dashboard_fx_from).toBe('USD');
      expect(s.dashboard_fx_to).toBe('EUR');
    });
  });

  it('FE-MOB-DWID-012: the native picker writes the chosen currency', async () => {
    render(<MobileDashWidget id="currency" upcoming={[]} />);
    await waitFor(() => expect(screen.getByText('1 EUR = 1.1000 USD')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('USD'), { target: { value: 'CHF' } });

    await waitFor(() => expect(useSettingsStore.getState().settings.dashboard_fx_to).toBe('CHF'));
  });

  it('FE-MOB-DWID-013: refresh re-requests the rates', async () => {
    let calls = 0;
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => { calls++; return HttpResponse.json(RATES); }));
    render(<MobileDashWidget id="currency" upcoming={[]} />);
    await waitFor(() => expect(calls).toBe(1));

    fireEvent.click(screen.getByRole('button', { name: 'Refresh rates' }));

    await waitFor(() => expect(calls).toBe(2));
  });

  it('FE-MOB-DWID-014: migrates the legacy fx keys into settings once', async () => {
    localStorage.setItem('trek_fx_from', 'CAD');
    localStorage.setItem('trek_fx_to', 'CHF');
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="currency" upcoming={[]} />);

    await waitFor(() => {
      expect(localStorage.getItem('trek_fx_from')).toBeNull();
      expect(localStorage.getItem('trek_fx_to')).toBeNull();
    });
    expect(useSettingsStore.getState().settings.dashboard_fx_from).toBe('CAD');
  });

  it('FE-MOB-DWID-015: keeps the legacy fx keys when the write fails', async () => {
    server.use(
      http.put('/api/settings', () => new HttpResponse(null, { status: 500 })),
      http.post('/api/settings/bulk', () => new HttpResponse(null, { status: 500 })),
    );
    localStorage.setItem('trek_fx_from', 'CAD');
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="currency" upcoming={[]} />);

    await waitFor(() => expect(useSettingsStore.getState().settings.dashboard_fx_from).toBe('CAD'));
    expect(localStorage.getItem('trek_fx_from')).toBe('CAD');
  });
});

describe('MCollectionsWidget', () => {
  it('FE-MOB-DWID-016: shows the empty hint when there is no list', async () => {
    render(<MobileDashWidget id="collections" upcoming={[]} />);

    expect(await screen.findByText('No saved places yet')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-017: renders at most four lists with their place counts', async () => {
    collectionsHandler([
      { id: 1, name: 'Tokyo eats', color: '#ff0000', place_count: 12 },
      { id: 2, name: 'Museums', color: null, place_count: 3 },
      { id: 3, name: 'Bars', color: null, place_count: null },
      { id: 4, name: 'Parks', color: null, place_count: 1 },
      { id: 5, name: 'Hidden', color: null, place_count: 9 },
    ]);
    render(<MobileDashWidget id="collections" upcoming={[]} />);

    expect(await screen.findByText('Tokyo eats')).toBeInTheDocument();
    expect(screen.getByText('Parks')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    // A list without a stored count renders a zero rather than blank.
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-032: the header arrow and a badge open the collections pages', async () => {
    collectionsHandler([{ id: 7, name: 'Tokyo eats', color: '#f00', place_count: 2 }]);
    render(<><MobileDashWidget id="collections" upcoming={[]} /><LocationEcho /></>);

    fireEvent.click(await screen.findByText('Tokyo eats'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/collections/7');

    fireEvent.click(screen.getByRole('button', { name: 'Collections' }));
    expect(screen.getByTestId('loc')).toHaveTextContent('/collections');
  });

  it('FE-MOB-DWID-018: a failed fetch falls back to the empty hint', async () => {
    server.use(http.get('/api/addons/collections', () => new HttpResponse(null, { status: 500 })));
    render(<MobileDashWidget id="collections" upcoming={[]} />);

    expect(await screen.findByText('No saved places yet')).toBeInTheDocument();
  });
});

describe('MTimezonesWidget', () => {
  it('FE-MOB-DWID-019: renders the stored zones with their local time', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    expect(screen.getByText('Timezones')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('FE-MOB-DWID-020: an explicitly empty list shows the empty hint', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: [] }) });
    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    expect(screen.getByText('No other timezones yet — add one with +')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-021: the edit mode adds and removes a zone', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add timezone' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Add timezone' }), { target: { value: 'Europe/Berlin' } });

    await waitFor(() =>
      expect(useSettingsStore.getState().settings.dashboard_timezones).toEqual(['Asia/Tokyo', 'Europe/Berlin']));

    fireEvent.click(screen.getByRole('button', { name: 'Add timezone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Tokyo' }));

    await waitFor(() =>
      expect(useSettingsStore.getState().settings.dashboard_timezones).toEqual(['Europe/Berlin']));
  });

  it('FE-MOB-DWID-022: picking an already-listed zone changes nothing', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add timezone' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Add timezone' }), { target: { value: '' } });

    // The picker closes again and the stored list is untouched.
    await waitFor(() => expect(screen.queryByRole('combobox', { name: 'Add timezone' })).not.toBeInTheDocument());
    expect(useSettingsStore.getState().settings.dashboard_timezones).toEqual(['Asia/Tokyo']);
  });

  it('FE-MOB-DWID-023: the clock ticks on its interval', () => {
    vi.useFakeTimers();
    const nowSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    seedStore(useSettingsStore, { settings: buildSettings({ dashboard_timezones: ['Asia/Tokyo'] }) });
    render(<MobileDashWidget id="timezones" upcoming={[]} />);
    const before = nowSpy.mock.calls.length;

    act(() => { vi.advanceTimersByTime(30000); });

    expect(nowSpy.mock.calls.length).toBeGreaterThan(before);
    nowSpy.mockRestore();
  });

  it('FE-MOB-DWID-024: migrates the legacy timezone list into settings', async () => {
    localStorage.setItem('trek_dashboard_tz', JSON.stringify(['America/New_York']));
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    await waitFor(() => expect(localStorage.getItem('trek_dashboard_tz')).toBeNull());
    expect(useSettingsStore.getState().settings.dashboard_timezones).toEqual(['America/New_York']);
  });

  it('FE-MOB-DWID-025: drops a malformed legacy timezone value', async () => {
    localStorage.setItem('trek_dashboard_tz', 'not-json');
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    await waitFor(() => expect(localStorage.getItem('trek_dashboard_tz')).toBeNull());
    expect(useSettingsStore.getState().settings.dashboard_timezones).toBeUndefined();
  });

  it('FE-MOB-DWID-026: drops a legacy value that is not a list', async () => {
    localStorage.setItem('trek_dashboard_tz', JSON.stringify({ tz: 'Asia/Tokyo' }));
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    await waitFor(() => expect(localStorage.getItem('trek_dashboard_tz')).toBeNull());
    expect(useSettingsStore.getState().settings.dashboard_timezones).toBeUndefined();
  });

  it('FE-MOB-DWID-027: keeps the legacy value when the write fails', async () => {
    server.use(
      http.put('/api/settings', () => new HttpResponse(null, { status: 500 })),
      http.post('/api/settings/bulk', () => new HttpResponse(null, { status: 500 })),
    );
    localStorage.setItem('trek_dashboard_tz', JSON.stringify(['America/New_York']));
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    await waitFor(() =>
      expect(useSettingsStore.getState().settings.dashboard_timezones).toEqual(['America/New_York']));
    expect(localStorage.getItem('trek_dashboard_tz')).toBe(JSON.stringify(['America/New_York']));
  });
});

describe('legacy settings migration', () => {
  it('FE-MOB-DWID-033: loaded settings without legacy keys write nothing', async () => {
    seedStore(useSettingsStore, { settings: buildSettings(), isLoaded: true });

    render(<MobileDashWidget id="currency" upcoming={[]} />);
    render(<MobileDashWidget id="timezones" upcoming={[]} />);

    await waitFor(() => expect(screen.getByText('1 EUR = 1.1000 USD')).toBeInTheDocument());
    expect(useSettingsStore.getState().settings.dashboard_fx_from).toBeUndefined();
    expect(useSettingsStore.getState().settings.dashboard_timezones).toBeUndefined();
  });
});

describe('MUpcomingWidget', () => {
  const res = (over: Partial<UpcomingReservation> = {}): UpcomingReservation => ({
    id: 1, trip_id: 7, title: 'teamLab Planets', type: 'ticket',
    reservation_time: null, day_date: '2026-09-02', location: 'Toyosu',
    ...over,
  });

  it('FE-MOB-DWID-028: shows the empty hint without reservations', () => {
    render(<MobileDashWidget id="upcomingReservations" upcoming={[]} />);

    expect(screen.getByText('Upcoming reservations')).toBeInTheDocument();
    expect(screen.getByText('Nothing booked yet.')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-029: builds the subtitle from date, time and place', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) });
    render(
      <MobileDashWidget
        id="upcomingReservations"
        upcoming={[res({ reservation_time: '2026-09-03T19:30:00', location: null, place_name: 'Narita' })]}
      />,
    );

    expect(screen.getByText('Sep 3 · 19:30 · Narita')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-030: an unparseable date degrades to the remaining parts', () => {
    render(
      <MobileDashWidget
        id="upcomingReservations"
        upcoming={[res({ day_date: 'not-a-date', location: null, place_name: null, trip_title: 'Japan' })]}
      />,
    );

    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('FE-MOB-DWID-031: tapping a reservation opens its trip on the bookings tab', () => {
    render(<MobileDashWidget id="upcomingReservations" upcoming={[res({ type: 'flight' })]} />);

    fireEvent.click(screen.getByText('teamLab Planets'));

    expect(sessionStorage.getItem('trip-tab-7')).toBe('buchungen');
  });

  // #1934 — the two moments of one stay share the accommodation id, so the row
  // key has to carry the type as well.
  it('FE-MOB-DWID-034: a stay renders as a check-in and a check-out', () => {
    render(
      <MobileDashWidget
        id="upcomingReservations"
        upcoming={[
          res({ id: 9, type: 'checkin', title: 'The Plaza', day_date: '2026-09-18', location: null }),
          res({ id: 9, type: 'checkout', title: 'The Plaza', day_date: '2026-09-22', location: null }),
        ]}
      />,
    );

    expect(screen.getAllByText('The Plaza')).toHaveLength(2);
    expect(screen.getByText(/Check-in/)).toBeInTheDocument();
    expect(screen.getByText(/Check-out/)).toBeInTheDocument();
  });

  it('FE-MOB-DWID-035: an unconfirmed booking is marked, a confirmed one is not', () => {
    render(
      <MobileDashWidget
        id="upcomingReservations"
        upcoming={[
          res({ id: 1, title: 'Broadway Show', status: 'pending' }),
          res({ id: 2, title: 'Ferry', status: 'confirmed' }),
        ]}
      />,
    );

    expect(screen.getAllByText('Pending')).toHaveLength(1);
  });
});
