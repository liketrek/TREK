import userEvent from '@testing-library/user-event';
import type { TourListItem, WandererImportPreview, WandererTrailSummary } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../tests/helpers/msw/server';
import { render, screen, waitFor, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { useWandererBrowser, type WandererBrowser } from './useWandererBrowser';
import WandererBrowserRail from './WandererBrowserRail';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

function trail(overrides: Partial<WandererTrailSummary> = {}): WandererTrailSummary {
  return {
    id: 'abc',
    name: 'Partnachklamm',
    description: 'Through the gorge',
    location: 'Garmisch-Partenkirchen',
    distanceM: 19_700,
    durationS: 18_000,
    elevationGainM: 929,
    elevationLossM: 929,
    difficulty: 'moderate',
    public: true,
    author: 'maurice',
    line: [
      [47.4, 11.1],
      [47.41, 11.11],
    ],
    externalUrl: 'https://wanderer.test/trail/view/@maurice/abc',
    importedAs: [],
    ...overrides,
  };
}

function preview(overrides: Partial<WandererImportPreview> = {}): WandererImportPreview {
  return {
    trail: trail(),
    distanceKm: 19.8,
    elevationGainM: 1152,
    elevationLossM: 1152,
    hasElevation: true,
    points: 812,
    line: [
      [47.4, 11.1],
      [47.42, 11.12],
    ],
    contentHash: '0123456789abcdef0123',
    state: 'new',
    snapshot: null,
    changes: [],
    ...overrides,
  } as WandererImportPreview;
}

const imported = { place_id: 70, name: 'Partnachklamm', caution: false } as TourListItem;

function Harness({
  onImported = vi.fn(),
  onOpenTour = vi.fn(),
  expose,
}: {
  onImported?: (tour: TourListItem) => void;
  onOpenTour?: (placeId: number) => void;
  expose?: (browser: WandererBrowser) => void;
}) {
  const browser = useWandererBrowser({ tripId: 3, enabled: true, onImported, onOpenTour });
  useEffect(() => {
    expose?.(browser);
  });
  return browser.open ? (
    <WandererBrowserRail browser={browser} />
  ) : (
    <button type="button" onClick={browser.openBrowser}>
      open
    </button>
  );
}

let searches: unknown[];
beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
  searches = [];
  server.use(
    http.post('/api/trips/3/tours/wanderer/search', async ({ request }) => {
      searches.push(await request.json());
      return HttpResponse.json({
        instance: 'https://wanderer.test',
        page: 1,
        pageSize: 20,
        total: 2,
        trails: [
          trail(),
          trail({ id: 'def', name: 'Kramerplateauweg', public: false, importedAs: [7], difficulty: 'easy' }),
        ],
      });
    }),
    http.get('/api/trips/3/tours/wanderer/trails/:id', () => HttpResponse.json(preview()))
  );
});

describe('WandererBrowserRail', () => {
  it('RS-04: lists the own trails like plan rows, with their grade on the tile and a mark for those in the trip', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));

    const list = await screen.findByRole('listbox', { name: 'wanderer' });
    const rows = within(list).getAllByRole('option');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('T2')).toBeInTheDocument();
    expect(within(rows[1]).getByText('T1')).toBeInTheDocument();
    expect(within(rows[1]).getByLabelText('In this trip')).toBeInTheDocument();
    expect(within(rows[0]).queryByLabelText('In this trip')).not.toBeInTheDocument();
    expect(screen.getByText('2 trails')).toBeInTheDocument();
    expect(searches[0]).toEqual({ q: '', page: 1 });
  });

  it('MF-02: searches the part of the map in view on request, and everywhere again on the second press', async () => {
    let browser: WandererBrowser | undefined;
    render(
      <Harness
        expose={(value) => {
          browser = value;
        }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await screen.findByRole('listbox', { name: 'wanderer' });

    browser?.onViewportChange({ south: 47, west: 11, north: 48, east: 12 });
    await userEvent.click(screen.getByRole('button', { name: 'Search this map area' }));
    await waitFor(() =>
      expect(searches[searches.length - 1]).toEqual({
        q: '',
        page: 1,
        bbox: { south: 47, west: 11, north: 48, east: 12 },
      })
    );
    expect(screen.getByText('Map area')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Searching this map area' }));
    await waitFor(() => expect(searches[searches.length - 1]).toEqual({ q: '', page: 1 }));
  });

  it('RS-04: previews a trail with its measured facts and its own visibility before anything is imported', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await userEvent.click(within(await screen.findByRole('listbox', { name: 'wanderer' })).getAllByRole('option')[0]);

    expect(await screen.findByRole('button', { name: 'Import into trip' })).toBeEnabled();
    expect(screen.getByText('Garmisch-Partenkirchen')).toBeInTheDocument();
    expect(screen.getByLabelText('Public in wanderer: everyone on your instance can see it there')).toBeInTheDocument();
    expect(screen.getByText('T2')).toBeInTheDocument();
  });

  it('RS-05: imports the previewed trail with its fingerprint and closes', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/trips/3/tours/wanderer/import', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ tour: imported });
      })
    );
    const onImported = vi.fn();
    render(<Harness onImported={onImported} />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await userEvent.click(within(await screen.findByRole('listbox', { name: 'wanderer' })).getAllByRole('option')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Import into trip' }));

    await waitFor(() => expect(onImported).toHaveBeenCalledWith(imported));
    expect(bodies).toEqual([{ trailId: 'abc', contentHash: '0123456789abcdef0123' }]);
    expect(screen.getByRole('button', { name: 'open' })).toBeInTheDocument();
  });

  it('RS-06: a trail already in the trip opens its snapshot instead of importing twice', async () => {
    server.use(
      http.get('/api/trips/3/tours/wanderer/trails/:id', () =>
        HttpResponse.json(
          preview({
            state: 'unchanged',
            snapshot: { placeId: 7, name: 'Kramerplateauweg', importedAt: '2026-10-15 10:00:00', editedLocally: false },
          })
        )
      )
    );
    const onOpenTour = vi.fn();
    render(<Harness onOpenTour={onOpenTour} />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await userEvent.click(within(await screen.findByRole('listbox', { name: 'wanderer' })).getAllByRole('option')[1]);
    await userEvent.click(await screen.findByRole('button', { name: 'Open the tour' }));
    expect(onOpenTour).toHaveBeenCalledWith(7);
  });

  it('RS-06: a changed trail can come in again as a new version beside the old one', async () => {
    server.use(
      http.get('/api/trips/3/tours/wanderer/trails/:id', () =>
        HttpResponse.json(
          preview({
            state: 'changed',
            changes: ['name', 'route'],
            snapshot: { placeId: 7, name: 'Kramerplateauweg', importedAt: '2026-10-15 10:00:00', editedLocally: true },
          })
        )
      )
    );
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await userEvent.click(within(await screen.findByRole('listbox', { name: 'wanderer' })).getAllByRole('option')[1]);
    expect(await screen.findByRole('button', { name: 'Import as new version' })).toBeInTheDocument();
  });

  it('RS-03: without a connection it points to the settings', async () => {
    server.use(
      http.post('/api/trips/3/tours/wanderer/search', () =>
        HttpResponse.json({ error: 'x', code: 'not_connected' }, { status: 409 })
      )
    );
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(await screen.findByRole('link', { name: /Connect in settings/ })).toHaveAttribute(
      'href',
      '/settings?tab=integrations'
    );
  });

  it('RS-05: a fingerprint gone stale is read again rather than imported', async () => {
    server.use(
      http.post('/api/trips/3/tours/wanderer/import', () =>
        HttpResponse.json({ error: 'x', code: 'preview_stale' }, { status: 409 })
      )
    );
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'open' }));
    await userEvent.click(within(await screen.findByRole('listbox', { name: 'wanderer' })).getAllByRole('option')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Import into trip' }));
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Import into trip' })).toBeInTheDocument();
  });
  it('RS-03: is offered only to someone who connected their own wanderer', async () => {
    let browser: WandererBrowser | undefined;
    const connection = {
      url: '',
      tokenMasked: '',
      allowInsecureTls: false,
      connected: false,
      lastCheckedAt: null,
      lastCheckOk: null,
      lastCheckError: null,
    };
    server.use(http.get('/api/integrations/wanderer/settings', () => HttpResponse.json(connection)));
    const view = render(
      <Harness
        expose={(value) => {
          browser = value;
        }}
      />
    );
    await waitFor(() => expect(browser?.enabled).toBe(false));
    view.unmount();

    server.use(
      http.get('/api/integrations/wanderer/settings', () =>
        HttpResponse.json({ ...connection, url: 'https://w.test', connected: true })
      )
    );
    render(
      <Harness
        expose={(value) => {
          browser = value;
        }}
      />
    );
    await waitFor(() => expect(browser?.enabled).toBe(true));
  });
});
