// FE-JRN-DETHOOK-001 to FE-JRN-DETHOOK-029
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { useLocation } from 'react-router';
import { delay, http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import { addListener, removeListener } from '../../api/websocket';
import { useJourneyStore } from '../../store/journeyStore';
import type { JourneyDetail, JourneyEntry } from '../../store/journeyStore';
import type { JourneyTrack } from '@trek/shared';
import { useJourneyDetail } from './useJourneyDetail';

let routeParams: { id?: string } = { id: '7' };
const mockNavigate = vi.fn();
let mockIsMobile = false;

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useParams: () => routeParams, useNavigate: () => mockNavigate };
});

vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => mockIsMobile }));

type AddToast = NonNullable<typeof window.__addToast>;
let addToast: Mock<AddToast>;

const journeyStoreInitial = useJourneyStore.getState();

// ── Fixtures ─────────────────────────────────────────────────────────────────

function buildEntry(over: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 1, journey_id: 7, author_id: 1, type: 'entry', title: 'Arrival', story: null,
    entry_date: '2026-05-01', entry_time: null, location_name: 'Tokyo',
    location_lat: 35.6, location_lng: 139.7, mood: 'good', weather: null,
    tags: [], pros_cons: null, visibility: 'private', sort_order: 0, photos: [],
    created_at: 0, updated_at: 0,
    ...over,
  };
}

function buildDetail(over: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 7, user_id: 1, title: 'Japan 2026', subtitle: null, cover_gradient: null,
    cover_image: null, status: 'active', created_at: 0, updated_at: 0,
    entries: [buildEntry(), buildEntry({ id: 2, title: 'Kyoto', entry_date: '2026-05-02' })],
    gallery: [], trips: [], contributors: [],
    stats: { entries: 2, photos: 0, places: 0 },
    ...over,
  };
}

function serveJourney(detail: JourneyDetail | Record<string, unknown>): void {
  server.use(http.get('/api/journeys/7', () => HttpResponse.json(detail)));
}

function buildTrack(over: Partial<JourneyTrack> = {}): JourneyTrack {
  return { place_id: 4, trip_id: 2, name: 'Ridge walk', color: '#ff0000', points: [[47.1, 11.2], [47.2, 11.3]], ...over };
}

/** Counts what the map's geometry endpoint is actually asked for. */
function serveTracks(journeyId: number, tracks: JourneyTrack[] = []) {
  const asked = vi.fn();
  server.use(http.get(`/api/journeys/${journeyId}/tracks`, () => {
    asked();
    return HttpResponse.json({ tracks });
  }));
  return asked;
}

// ── Harness ──────────────────────────────────────────────────────────────────

type HookState = ReturnType<typeof useJourneyDetail>;
let latest: HookState;

function Harness({ renderEntries = true }: { renderEntries?: boolean }) {
  const state = useJourneyDetail();
  latest = state;
  const location = useLocation();
  return (
    <div>
      <span data-testid="search">{location.search}</span>
      <div ref={state.feedRef} data-testid="feed">
        {renderEntries && (state.current?.entries ?? []).map(e => (
          <div key={e.id} data-entry-id={String(e.id)} data-testid={`entry-${e.id}`}>{e.title}</div>
        ))}
        {renderEntries && <div data-entry-id="" data-testid="entry-blank" />}
      </div>
    </div>
  );
}

function setup(options: { search?: string; renderEntries?: boolean } = {}) {
  return render(<Harness renderEntries={options.renderEntries} />, {
    initialEntries: [`/journey/7${options.search ?? ''}`],
  });
}

/** Feed the layout numbers commitWinner reads out of the DOM. */
function stubRects(tops: Record<string, number>): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const key = this.getAttribute('data-entry-id') ?? 'feed';
    const top = tops[key] ?? 0;
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
}

beforeEach(() => {
  routeParams = { id: '7' };
  mockIsMobile = false;
  vi.clearAllMocks();
  addToast = vi.fn<AddToast>(() => 0);
  window.__addToast = addToast;
  useJourneyStore.setState(journeyStoreInitial, true);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  serveJourney(buildDetail());
});

afterEach(() => {
  delete window.__addToast;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useJourneyStore.setState(journeyStoreInitial, true);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useJourneyDetail', () => {
  it('FE-JRN-DETHOOK-001: loads the journey named in the route', async () => {
    setup();
    await waitFor(() => expect(latest.current?.title).toBe('Japan 2026'));
    expect(latest.loading).toBe(false);
    expect(latest.id).toBe('7');
  });

  it('FE-JRN-DETHOOK-002: a missing route id skips the load', async () => {
    routeParams = {};
    setup();
    await waitFor(() => expect(latest.current).toBeNull());
    expect(addListener).not.toHaveBeenCalled();
  });

  it('FE-JRN-DETHOOK-003: ?create=entry opens a draft entry and drops the parameter', async () => {
    setup({ search: '?create=entry' });
    await waitFor(() => expect(latest.editingEntry).not.toBeNull());
    expect(latest.editingEntry).toMatchObject({ id: 0, journey_id: 7, type: 'entry', visibility: 'private' });
    expect(screen.getByTestId('search')).toHaveTextContent('');
  });

  it('FE-JRN-DETHOOK-004: a viewer never gets the draft editor', async () => {
    serveJourney({ ...buildDetail(), my_role: 'viewer' });
    setup({ search: '?create=entry' });
    await waitFor(() => expect(latest.current).not.toBeNull());
    expect(latest.canEditEntries).toBe(false);
    expect(latest.canEditJourney).toBe(false);
    expect(latest.editingEntry).toBeNull();
  });

  it('FE-JRN-DETHOOK-005: an editor may edit entries but not the journey itself', async () => {
    serveJourney({ ...buildDetail(), my_role: 'editor' });
    setup();
    await waitFor(() => expect(latest.myRole).toBe('editor'));
    expect(latest.canEditEntries).toBe(true);
    expect(latest.canEditJourney).toBe(false);
  });

  it('FE-JRN-DETHOOK-006: the stored hide_skeletons preference seeds the toggle', async () => {
    serveJourney({ ...buildDetail(), hide_skeletons: true });
    setup();
    await waitFor(() => expect(latest.hideSkeletons).toBe(true));
  });

  it('FE-JRN-DETHOOK-007: a 404 reports it and returns to the journey list', async () => {
    server.use(http.get('/api/journeys/7', () => HttpResponse.json({ error: 'gone' }, { status: 404 })));
    setup();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/journey'));
    expect(addToast).toHaveBeenCalledWith('Journey not found', 'error', undefined);
  });

  it('FE-JRN-DETHOOK-008: a websocket journey event for this journey triggers a reload', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const handler = vi.mocked(addListener).mock.calls[0][0] as (e: Record<string, unknown>) => void;

    serveJourney(buildDetail({ title: 'Japan renamed' }));
    handler({ type: 'journey:entry_created', journeyId: 7 });
    await waitFor(() => expect(latest.current?.title).toBe('Japan renamed'));
  });

  it('FE-JRN-DETHOOK-009: events of another type or another journey are ignored', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const handler = vi.mocked(addListener).mock.calls[0][0] as (e: Record<string, unknown>) => void;

    serveJourney(buildDetail({ title: 'Should not appear' }));
    handler({ type: 'trip:updated', journeyId: 7 });
    handler({ type: 'journey:entry_created', journeyId: 99 });
    handler({ journeyId: 7 });
    await new Promise(r => setTimeout(r, 20));
    expect(latest.current?.title).toBe('Japan 2026');
  });

  it('FE-JRN-DETHOOK-010: the websocket listener is detached on unmount', async () => {
    const { unmount } = setup();
    await waitFor(() => expect(addListener).toHaveBeenCalled());
    unmount();
    expect(removeListener).toHaveBeenCalledWith(vi.mocked(addListener).mock.calls[0][0]);
  });

  it('FE-JRN-DETHOOK-011: scroll sync selects the last entry above the reference line', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    stubRects({ '1': -50, '2': -10, feed: 0 });

    fireEvent.scroll(screen.getByTestId('feed'));
    await waitFor(() => expect(latest.activeEntryId).toBe('2'));
  });

  it('FE-JRN-DETHOOK-012: with every entry below the line the closest one wins', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    stubRects({ '1': 300, '2': 120, feed: 0 });

    fireEvent.scroll(screen.getByTestId('feed'));
    await waitFor(() => expect(latest.activeEntryId).toBe('2'));
  });

  it('FE-JRN-DETHOOK-013: a feed without entry nodes leaves the selection empty', async () => {
    setup({ renderEntries: false });
    await waitFor(() => expect(latest.current).not.toBeNull());
    fireEvent.scroll(screen.getByTestId('feed'));
    await new Promise(r => setTimeout(r, 20));
    expect(latest.activeEntryId).toBeNull();
  });

  it('FE-JRN-DETHOOK-014: clicking a marker pins the entry and suppresses the scroll sync', async () => {
    vi.useFakeTimers();
    try {
      setup();
      await vi.waitFor(() => expect(latest.current).not.toBeNull());
      const el = screen.getByTestId('entry-2');
      const scrollIntoView = vi.spyOn(el, 'scrollIntoView');

      latest.handleMarkerClick('2');
      await vi.waitFor(() => expect(latest.activeEntryId).toBe('2'));
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

      // While suppressed a scroll must not move the selection elsewhere.
      stubRects({ '1': -50, '2': 400, feed: 0 });
      fireEvent.scroll(screen.getByTestId('feed'));
      expect(latest.activeEntryId).toBe('2');

      vi.advanceTimersByTime(800);
      fireEvent.scroll(screen.getByTestId('feed'));
      await vi.waitFor(() => expect(latest.activeEntryId).toBe('1'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-JRN-DETHOOK-015: a pending animation frame is cancelled when the feed unmounts', async () => {
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', () => 42);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { unmount } = setup();
    // The sync attaches 300ms after the entries land and primes the selection.
    await waitFor(() => expect(latest.activeEntryId).not.toBeNull());

    fireEvent.scroll(screen.getByTestId('feed'));
    unmount();
    expect(cancel).toHaveBeenCalledWith(42);
  });

  it('FE-JRN-DETHOOK-016: handleLocationClick records the clicked location', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    latest.handleLocationClick('loc-3');
    await waitFor(() => expect(latest.activeLocationId).toBe('loc-3'));
  });

  it('FE-JRN-DETHOOK-017: only located, non-skeleton entries reach the map', async () => {
    serveJourney(buildDetail({
      entries: [
        buildEntry({ id: 1 }),
        buildEntry({ id: 2, title: 'Gallery' }),
        buildEntry({ id: 3, title: '[Trip Photos]' }),
        buildEntry({ id: 4, type: 'skeleton', title: 'Suggested' }),
        buildEntry({ id: 5, title: 'No GPS', location_lat: null, location_lng: null }),
        buildEntry({ id: 6, title: 'Later', entry_date: '2026-05-02' }),
      ],
    }));
    setup();
    await waitFor(() => expect(latest.mapEntries).toHaveLength(2));
    expect(latest.mapEntries.map(e => e.id)).toEqual([1, 6]);
    expect(latest.sidebarMapItems.map(m => m.id)).toEqual(['1', '6']);
    expect(latest.sidebarMapItems[0].dayLabel).toBe(1);
    expect(latest.sidebarMapItems[0].dayColor).not.toBe(latest.sidebarMapItems[1].dayColor);
  });

  it('FE-JRN-DETHOOK-018: two entries on one day get consecutive day labels and one colour', async () => {
    serveJourney(buildDetail({
      entries: [buildEntry({ id: 1 }), buildEntry({ id: 2, title: 'Second stop' })],
    }));
    setup();
    await waitFor(() => expect(latest.sidebarMapItems).toHaveLength(2));
    expect(latest.sidebarMapItems.map(m => m.dayLabel)).toEqual([1, 2]);
    expect(latest.sidebarMapItems[0].dayColor).toBe(latest.sidebarMapItems[1].dayColor);
  });

  it('FE-JRN-DETHOOK-019: tripDates expands linked trips and skips half-dated ones', async () => {
    serveJourney(buildDetail({
      trips: [
        { trip_id: 1, added_at: 0, title: 'Tokyo', start_date: '2026-05-01', end_date: '2026-05-03', cover_image: null, currency: 'EUR', place_count: 0 },
        { trip_id: 2, added_at: 0, title: 'Open ended', start_date: '2026-06-01', end_date: null, cover_image: null, currency: 'EUR', place_count: 0 },
      ],
    }));
    setup();
    // Three days for the closed trip, nothing for the open-ended one. The keys are local
    // dates, so they match the trip's own start/end regardless of the runner's timezone.
    await waitFor(() => expect(latest.tripDates.size).toBe(3));
    expect([...latest.tripDates].sort()).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
  });

  it('FE-JRN-DETHOOK-020: the desktop two-pane layout locks body scroll and restores it', async () => {
    document.body.style.overflow = 'auto';
    const { unmount } = setup();
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('FE-JRN-DETHOOK-021: on mobile the body keeps scrolling', async () => {
    mockIsMobile = true;
    document.body.style.overflow = 'auto';
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    expect(latest.isMobile).toBe(true);
    expect(document.body.style.overflow).toBe('auto');
  });

  it('FE-JRN-DETHOOK-022: switching the view re-measures the sidebar map', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const invalidateSize = vi.fn();
    latest.mapRef.current = { invalidateSize, highlightMarker: vi.fn(), focusMarker: vi.fn() } as never;

    fireEvent.click(document.body);
    latest.setView('gallery');
    await waitFor(() => expect(invalidateSize).toHaveBeenCalled());
    expect(latest.view).toBe('gallery');
  });

  // ── Jump to top / to the last entry (#1088) ────────────────────────────────

  /** jsdom has no layout, so hand the feed the numbers a real scrollport would report. */
  function stubFeedScroll(metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
    const feed = screen.getByTestId('feed');
    for (const [prop, value] of Object.entries(metrics)) {
      Object.defineProperty(feed, prop, { value, configurable: true });
    }
    return feed;
  }

  it('FE-JRN-DETHOOK-023: a feed short enough to read in one go offers no jump', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const feed = stubFeedScroll({ scrollTop: 0, scrollHeight: 900, clientHeight: 800 });

    fireEvent.scroll(feed);
    await waitFor(() => expect(latest.feedEdge).toEqual({ atTop: true, atBottom: true }));
  });

  it('FE-JRN-DETHOOK-024: deep in a long journal both directions are offered', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const feed = stubFeedScroll({ scrollTop: 3000, scrollHeight: 9000, clientHeight: 800 });

    fireEvent.scroll(feed);
    await waitFor(() => expect(latest.feedEdge).toEqual({ atTop: false, atBottom: false }));

    // Back at the bottom only the way up is left.
    Object.defineProperty(feed, 'scrollTop', { value: 8200, configurable: true });
    fireEvent.scroll(feed);
    await waitFor(() => expect(latest.feedEdge).toEqual({ atTop: false, atBottom: true }));
  });

  it('FE-JRN-DETHOOK-025: the jumps scroll the feed, not the window', async () => {
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    const feed = stubFeedScroll({ scrollTop: 3000, scrollHeight: 9000, clientHeight: 800 });
    const scrollTo = vi.fn();
    Object.defineProperty(feed, 'scrollTo', { value: scrollTo, configurable: true });

    latest.scrollFeedTo('top');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    latest.scrollFeedTo('bottom');
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 9000, behavior: 'smooth' });
  });

  // ── Trip GPX tracks (#2194) ────────────────────────────────────────────────
  // The switch gates the request, not the drawing: the endpoint ships unthinned
  // geometry, megabytes of it for a trip with a season of recorded drives.

  it('FE-JRN-DETHOOK-026: a journey with the switch off never asks for the geometry', async () => {
    const asked = serveTracks(7, [buildTrack()]);
    setup();
    await waitFor(() => expect(latest.current).not.toBeNull());
    await new Promise(r => setTimeout(r, 20));

    expect(asked).not.toHaveBeenCalled();
    expect(latest.tracks).toEqual([]);
  });

  it('FE-JRN-DETHOOK-027: with the switch on the tracks are fetched and handed on', async () => {
    // The column is INTEGER, so what arrives over the wire is 1, not true.
    serveJourney(buildDetail({ show_trip_tracks: 1 }));
    const asked = serveTracks(7, [buildTrack()]);
    setup();

    await waitFor(() => expect(latest.tracks).toHaveLength(1));
    expect(latest.tracks[0].name).toBe('Ridge walk');
    expect(asked).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DETHOOK-028: the geometry follows the route id, not the journey still on screen', async () => {
    // loadJourney leaves the previous journey in place while the next one loads, so an
    // unguarded read of the flag would fetch journey B's tracks off journey A's setting.
    routeParams = { id: '8' };
    useJourneyStore.setState({ current: buildDetail({ show_trip_tracks: 1 }) });
    const asked = serveTracks(8, [buildTrack()]);
    server.use(http.get('/api/journeys/8', async () => {
      await delay(20);
      return HttpResponse.json(buildDetail({ id: 8, title: 'Norway 2027' }));
    }));
    setup();

    await waitFor(() => expect(latest.current?.id).toBe(8));
    expect(asked).not.toHaveBeenCalled();
    expect(latest.tracks).toEqual([]);
  });

  it('FE-JRN-DETHOOK-029: a failed geometry lookup costs the map its lines, not the page', async () => {
    serveJourney(buildDetail({ show_trip_tracks: 1 }));
    server.use(http.get('/api/journeys/7/tracks', () => new HttpResponse(null, { status: 500 })));
    setup();

    await waitFor(() => expect(latest.current?.title).toBe('Japan 2026'));
    await new Promise(r => setTimeout(r, 20));
    expect(latest.tracks).toEqual([]);
    expect(addToast).not.toHaveBeenCalled();
  });
});
