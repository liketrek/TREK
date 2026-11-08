import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/trip-map/App';
import { fitView, project, screenPoint, visibleTiles, zoomBy } from '../../src/widgets/trip-map/mapModel';
import { TripMap } from '../../src/widgets/trip-map/TripMap';

const t = translator('en');
const TILES = {
  url: 'https://tile.example/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  max_zoom: 19,
};
const place = (id: number, lat: number, lng: number) => ({ id, name: `Place ${id}`, lat, lng, address: null });
const page = (places: unknown[], nextOffset: number | null = null, offset = 0, count = places.length) => ({
  trip_id: 4,
  place_count: count,
  offset,
  next_offset: nextOffset,
  places,
  tiles: TILES,
});

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));
afterEach(cleanup);

describe('mapModel', () => {
  it('APPS-MAP-001: projects onto the Web Mercator world in pixels', () => {
    expect(project({ lat: 0, lng: 0 }, 0)).toEqual({ x: 128, y: 128 });
    expect(project({ lat: 0, lng: 180 }, 1).x).toBe(512);
    expect(project({ lat: 90, lng: 0 }, 0).y).toBeCloseTo(0, 3);
  });

  it('APPS-MAP-002: fits the places in the box at the deepest zoom that holds them', () => {
    const lisbon = [
      { lat: 38.7, lng: -9.15 },
      { lat: 38.72, lng: -9.13 },
    ];
    const view = fitView(lisbon, 600, 320, 19);
    expect(view.zoom).toBe(13);
    const corners = lisbon.map((p) => screenPoint(p, view, 600, 320));
    for (const c of corners) {
      expect(c.left).toBeGreaterThanOrEqual(32);
      expect(c.left).toBeLessThanOrEqual(568);
      expect(c.top).toBeGreaterThanOrEqual(32);
      expect(c.top).toBeLessThanOrEqual(288);
    }
    expect(fitView([lisbon[0]], 600, 320, 12).zoom).toBe(12);
    expect(fitView([lisbon[0]], 600, 320, 19).zoom).toBe(14);
    expect(fitView([], 600, 320, 19).zoom).toBe(1);
    expect(
      fitView(
        [
          { lat: 80, lng: -170 },
          { lat: -80, lng: 170 },
        ],
        100,
        100,
        19
      ).zoom
    ).toBe(0);
  });

  it('APPS-MAP-003: zooms about the same centre within the provider’s range', () => {
    expect(zoomBy({ zoom: 3, cx: 100, cy: 50 }, 1, 19)).toEqual({ zoom: 4, cx: 200, cy: 100 });
    expect(zoomBy({ zoom: 0, cx: 100, cy: 50 }, -1, 19)).toEqual({ zoom: 0, cx: 100, cy: 50 });
    expect(zoomBy({ zoom: 19, cx: 1, cy: 1 }, 1, 19).zoom).toBe(19);
  });

  it('APPS-MAP-004: covers the box with tiles, wraps columns and skips rows off the world', () => {
    const tiles = visibleTiles({ zoom: 1, cx: 0, cy: 256 }, 512, 600, 'https://t/{z}/{x}/{y}.png');
    expect(tiles.map((tile) => tile.url).sort()).toEqual([
      'https://t/1/0/0.png',
      'https://t/1/0/1.png',
      'https://t/1/1/0.png',
      'https://t/1/1/1.png',
    ]);
    expect(tiles.find((tile) => tile.key === '1/-1/0')?.left).toBe(0);
  });
});

describe('TripMap', () => {
  it('APPS-MAP-005: draws the tiles and a marker per place, and names the picked one', () => {
    const onSelect = vi.fn();
    render(
      <TripMap
        data={page([place(1, 38.7, -9.15), place(2, 38.72, -9.13)])}
        locale="en"
        t={t}
        loadPage={vi.fn()}
        onSelect={onSelect}
        onExpand={vi.fn(async () => true)}
      />
    );
    expect(screen.getByText('Places on the map: 2')).toBeTruthy();
    expect(document.querySelectorAll('img.map__tile').length).toBeGreaterThan(0);
    expect((document.querySelector('img.map__tile') as HTMLImageElement).src).toMatch(/^https:\/\/tile\.example\/13\//);
    fireEvent.click(screen.getByRole('button', { name: 'Place 2' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(screen.getByRole('button', { name: 'Place 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('© OpenStreetMap contributors')).toBeTruthy();
  });

  it('APPS-MAP-006: zooms with the buttons and pans by dragging', () => {
    render(
      <TripMap
        data={page([place(1, 38.7, -9.15)])}
        locale="en"
        t={t}
        loadPage={vi.fn()}
        onSelect={vi.fn()}
        onExpand={vi.fn(async () => true)}
      />
    );
    const marker = () => screen.getByRole('button', { name: 'Place 1' }).style.transform;
    const before = marker();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect((document.querySelector('img.map__tile') as HTMLImageElement).src).toMatch(/\/13\//);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(marker()).toBe(before);
    const box = document.querySelector('.map__box') as HTMLElement;
    fireEvent.pointerDown(box, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: 130, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(box, { pointerId: 1 });
    fireEvent.pointerMove(box, { clientX: 500, clientY: 500, pointerId: 1 });
    expect(marker()).toBe('translate(330px, 150px)');
  });

  it('APPS-MAP-007: reads the further pages, and keeps what it has when one fails', async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce(page([place(2, 38.72, -9.13)], 2, 1, 3))
      .mockRejectedValueOnce(new Error('gone'));
    render(
      <TripMap
        data={page([place(1, 38.7, -9.15)], 1, 0, 3)}
        locale="en"
        t={t}
        loadPage={loadPage}
        onSelect={vi.fn()}
        onExpand={vi.fn(async () => true)}
      />
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place 2' })).toBeTruthy());
    expect(loadPage.mock.calls).toEqual([[1], [2]]);
    expect(screen.getByText('Places on the map: 3')).toBeTruthy();
  });

  it('APPS-MAP-011: follows the host out of fullscreen, and draws only the markers in view', () => {
    const props = {
      data: page([place(1, 38.7, -9.15), place(2, -33.9, 151.2)]),
      locale: 'en',
      t,
      loadPage: vi.fn(),
      onSelect: vi.fn(),
      onExpand: vi.fn(async () => true),
    };
    const { rerender } = render(<TripMap {...props} fullscreen />);
    expect(document.querySelector('.map__box--full')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
    rerender(<TripMap {...props} fullscreen={false} />);
    expect(document.querySelector('.map__box--full')).toBeNull();
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeTruthy();
    // Lisbon and Sydney do not fit one box: zoomed in on Lisbon, Sydney's marker is not drawn.
    for (let step = 0; step < 12; step += 1) fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.queryAllByRole('button', { name: /^Place / }).length).toBeLessThan(2);
  });

  it('APPS-MAP-008: goes full screen when the host allows it, and says when there is nothing to show', async () => {
    const onExpand = vi.fn(async () => true);
    const { unmount } = render(
      <TripMap
        data={page([place(1, 1, 1)])}
        locale="en"
        t={t}
        loadPage={vi.fn()}
        onSelect={vi.fn()}
        onExpand={onExpand}
      />
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Full screen' })));
    expect(document.querySelector('.map__box--full')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
    unmount();
    const { unmount: unmountEmpty } = render(
      <TripMap data={page([])} locale="en" t={t} loadPage={vi.fn()} onSelect={vi.fn()} onExpand={onExpand} />
    );
    expect(screen.getByText('No places with a location yet')).toBeTruthy();
    unmountEmpty();
    render(
      <TripMap data={{ places: 'no' }} locale="en" t={t} loadPage={vi.fn()} onSelect={vi.fn()} onExpand={onExpand} />
    );
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('trip-map App', () => {
  const withResult = (app: Record<string, unknown>, input: Record<string, unknown> | null, data: unknown) => {
    state = {
      app: app as unknown as TrekAppState['app'],
      result: { structuredContent: data, appUrl: null },
      input,
      error: null,
      locale: 'en-GB',
      t,
    };
  };

  it('APPS-MAP-009: pages through get_trip_map, tells the model the picked place, and asks for the whole screen', async () => {
    const callServerTool = vi.fn(async () => ({
      content: [],
      structuredContent: page([place(2, 38.72, -9.13)], null, 1, 2),
    }));
    const updateModelContext = vi.fn(async () => ({}));
    const requestDisplayMode = vi.fn(async () => ({ mode: 'fullscreen' }));
    withResult(
      { callServerTool, updateModelContext, requestDisplayMode },
      { tripId: 4 },
      page([place(1, 38.7, -9.15)], 1, 0, 2)
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place 2' })).toBeTruthy());
    expect(callServerTool).toHaveBeenCalledWith({ name: 'get_trip_map', arguments: { tripId: 4, offset: 1 } });
    fireEvent.click(screen.getByRole('button', { name: 'Place 1' }));
    expect(updateModelContext).toHaveBeenCalledWith({ structuredContent: { selectedPlaceId: 1 } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Full screen' })));
    expect(document.querySelector('.map__box--full')).toBeTruthy();
  });

  it('APPS-MAP-010: stays inline when the host refuses the screen, and reads no page without a trip or on a refusal', async () => {
    const callServerTool = vi.fn(async () => ({ content: [], isError: true }));
    const requestDisplayMode = vi.fn(async () => {
      throw new Error('no');
    });
    withResult({ callServerTool, requestDisplayMode }, null, page([place(1, 1, 1)], 1, 0, 2));
    const { unmount } = render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Full screen' })));
    expect(document.querySelector('.map__box--full')).toBeNull();
    expect(callServerTool).not.toHaveBeenCalled();
    unmount();
    withResult({ callServerTool, requestDisplayMode }, { tripId: 4 }, page([place(1, 1, 1)], 1, 0, 2));
    render(<App />);
    await waitFor(() => expect(callServerTool).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: 'Place 2' })).toBeNull();
  });
});
