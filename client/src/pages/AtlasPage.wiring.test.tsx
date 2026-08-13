import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor } from '../../tests/helpers/render';
import { server } from '../../tests/helpers/msw/server';
import { buildAtlasController, buildAtlasData, buildBucketItem, buildCountryDetail, type VisitedRegions } from '../../tests/helpers/atlas';
import type { AtlasController } from '../mobile/screens/atlas/atlasController';
import type { AtlasData, CountryDetail } from './atlas/atlasModel';
import AtlasPage from './AtlasPage';

// FE-PAGE-ATLASW-001 to FE-PAGE-ATLASW-034
//
// AtlasPage is a wiring container around useAtlas: the hook is mocked here so the
// confirm popup and the sidebar can be driven into every state directly, which the
// map-click driven suite in AtlasPage.test.tsx cannot reach.

const mocks = vi.hoisted(() => ({ atlas: {} as AtlasController }));

vi.mock('./atlas/useAtlas', () => ({ useAtlas: () => mocks.atlas }));
vi.mock('../components/Layout/Navbar', () => ({
  default: () => React.createElement('nav', { 'data-testid': 'navbar' }),
}));

const toast = vi.fn(() => 0);

function setAtlas(over: Record<string, unknown> = {}): AtlasController {
  mocks.atlas = buildAtlasController(over);
  return mocks.atlas;
}

/** The two CustomSelect triggers in a popup both render the "—" placeholder option. */
function selectTriggers(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => b.textContent?.trim() === '—');
}

beforeEach(() => {
  toast.mockClear();
  window.__addToast = toast;
  setAtlas();
  server.use(
    http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ success: true })),
    http.post('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ success: true })),
    http.delete('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ success: true })),
    http.post('/api/addons/atlas/bucket-list', () =>
      HttpResponse.json({ item: buildBucketItem({ id: 99, name: 'Germany', country_code: 'DE' }) }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AtlasPage wiring', () => {
  it('FE-PAGE-ATLASW-002: shows navbar and spinner while the atlas is loading', () => {
    setAtlas({ loading: true });
    render(<AtlasPage />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  describe('country popup', () => {
    it('FE-PAGE-ATLASW-003: the choose popup marks a country and updates the local atlas data', async () => {
      const atlas = setAtlas({ confirmAction: { type: 'choose', code: 'DE', name: 'Germany' } });
      render(<AtlasPage />);

      const flag = document.querySelector('img[alt="DE"]') as HTMLImageElement;
      expect(flag.src).toContain('flagcdn.com/w80/de.png');

      const markBtn = screen.getByText('atlas.markVisited').closest('button') as HTMLButtonElement;
      fireEvent.mouseEnter(markBtn);
      expect(markBtn.style.background).toBe('var(--bg-secondary)');
      fireEvent.mouseLeave(markBtn);
      expect(markBtn.style.background).toBe('none');

      fireEvent.click(markBtn);

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      const data = atlas.data as AtlasData;
      expect(data.countries.map((c) => c.code)).toEqual(['FR', 'DE']);
      expect(data.stats.totalCountries).toBe(2);
      expect(data.continents?.Europe).toBe(2);
    });

    it('FE-PAGE-ATLASW-004: a failing mark shows the server error as a toast', async () => {
      setAtlas({ confirmAction: { type: 'choose', code: 'DE', name: 'Germany' } });
      server.use(
        http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ error: 'Locked' }, { status: 400 })),
      );
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));

      await waitFor(() => expect(toast).toHaveBeenCalledWith('Locked', 'error', undefined));
    });

    it('FE-PAGE-ATLASW-005: the bucket option and the backdrop drive the pending action', () => {
      const action = { type: 'choose', code: 'DE', name: 'Germany' } as AtlasController['confirmAction'];
      const atlas = setAtlas({ confirmAction: action });
      render(<AtlasPage />);

      const bucketBtn = screen.getByText('atlas.addToBucket').closest('button') as HTMLButtonElement;
      fireEvent.mouseEnter(bucketBtn);
      fireEvent.mouseLeave(bucketBtn);
      fireEvent.click(bucketBtn);
      expect(atlas.setConfirmAction).toHaveBeenCalledWith({ ...action, type: 'bucket' });

      fireEvent.click(screen.getByText('Germany').closest('div[style*="z-index: 1000"]') as HTMLElement);
      expect(atlas.setConfirmAction).toHaveBeenLastCalledWith(null);
    });

    it('FE-PAGE-ATLASW-006: a three-letter code falls back to the flag glyph', () => {
      setAtlas({ confirmAction: { type: 'choose', code: 'DEU', name: 'Germany' } });
      render(<AtlasPage />);

      expect(document.querySelector('img[alt="DEU"]')).toBeNull();
      expect(screen.getByText('Germany')).toBeInTheDocument();
    });

    it('FE-PAGE-ATLASW-007: the region popup marks a region and adopts its country', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA', countryName: 'Spain' },
      });
      render(<AtlasPage />);

      expect(screen.getByText('Spain')).toBeInTheDocument();
      const markBtn = screen.getByText('atlas.markVisited').closest('button') as HTMLButtonElement;
      fireEvent.mouseEnter(markBtn);
      fireEvent.mouseLeave(markBtn);
      fireEvent.click(markBtn);

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      expect((atlas.visitedRegions as VisitedRegions).ES).toEqual([
        { code: 'ES-GA', name: 'Galicia', placeCount: 0, manuallyMarked: true },
      ]);
      expect((atlas.data as AtlasData).countries.map((c) => c.code)).toContain('ES');
    });

    it('FE-PAGE-ATLASW-008: an already recorded region is not added twice and the country stays put', async () => {
      const regions: VisitedRegions = { FR: [{ code: 'FR-BRE', name: 'Bretagne', placeCount: 2 }] };
      const atlas = setAtlas({
        confirmAction: { type: 'choose-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE', countryName: 'France' },
        visitedRegions: regions,
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      expect(atlas.visitedRegions).toBe(regions);
      expect((atlas.data as AtlasData).countries).toHaveLength(1);
    });

    it('FE-PAGE-ATLASW-009: a failing region mark shows the error toast', async () => {
      setAtlas({ confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' } });
      server.use(
        http.post('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ error: 'Nope' }, { status: 422 })),
      );
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));

      await waitFor(() => expect(toast).toHaveBeenCalledWith('Nope', 'error', undefined));
    });

    it('FE-PAGE-ATLASW-010: a region popup without a region code cannot be confirmed', async () => {
      const atlas = setAtlas({ confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));
      fireEvent.click(screen.getByText('atlas.addToBucket'));

      expect(atlas.setVisitedRegions).not.toHaveBeenCalled();
      expect(atlas.setConfirmAction).toHaveBeenCalledWith({ type: 'bucket', code: 'ES', name: 'Galicia' });
    });

    it('FE-PAGE-ATLASW-010b: the region bucket option highlights on hover', () => {
      const action = { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' } as AtlasController['confirmAction'];
      const atlas = setAtlas({ confirmAction: action });
      render(<AtlasPage />);

      const bucketBtn = screen.getByText('atlas.addToBucket').closest('button') as HTMLButtonElement;
      fireEvent.mouseEnter(bucketBtn);
      expect(bucketBtn.style.background).toBe('var(--bg-secondary)');
      fireEvent.mouseLeave(bucketBtn);
      expect(bucketBtn.style.background).toBe('none');

      fireEvent.click(bucketBtn);
      expect(atlas.setConfirmAction).toHaveBeenCalledWith({ ...action, type: 'bucket' });
    });

    it('FE-PAGE-ATLASW-010c: a region removal without a region code performs no request', async () => {
      const deleteSpy = vi.fn();
      server.use(
        http.delete('/api/addons/atlas/region/:code/mark', () => { deleteSpy(); return HttpResponse.json({}); }),
      );
      const atlas = setAtlas({ confirmAction: { type: 'unmark-region', code: 'ES', name: 'Galicia' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(atlas.setVisitedRegions).not.toHaveBeenCalled());
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-010d: marking a country that is already known leaves the totals alone', async () => {
      const atlas = setAtlas({ confirmAction: { type: 'choose', code: 'FR', name: 'France' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      expect((atlas.data as AtlasData).stats.totalCountries).toBe(1);
    });

    it('FE-PAGE-ATLASW-010e: region actions cope with atlas data that never loaded', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'unmark-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' },
        data: null,
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      expect(atlas.data).toBeNull();
    });

    it('FE-PAGE-ATLASW-011: the unmark popup cancels or delegates to the shared executor', () => {
      const atlas = setAtlas({ confirmAction: { type: 'unmark', code: 'FR', name: 'France' } });
      render(<AtlasPage />);

      expect(screen.getByText('atlas.confirmUnmark')).toBeInTheDocument();
      fireEvent.click(screen.getByText('common.cancel'));
      expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);

      fireEvent.click(screen.getByText('atlas.unmark'));
      expect(atlas.executeConfirmAction).toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-012: the mark confirmation cancels or delegates to the shared executor', () => {
      const atlas = setAtlas({ confirmAction: { type: 'mark', code: 'DE', name: 'Germany' } });
      render(<AtlasPage />);

      expect(screen.getByText('atlas.confirmMark')).toBeInTheDocument();
      fireEvent.click(screen.getByText('common.cancel'));
      expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);

      fireEvent.click(screen.getByText('atlas.markVisited'));
      expect(atlas.executeConfirmAction).toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-013: removing the last region of a data-free country drops the country as well', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62', countryName: 'Italy' },
        visitedRegions: { IT: [{ code: 'IT-62', name: 'Lazio', placeCount: 0 }] } as VisitedRegions,
        data: buildAtlasData({
          countries: [
            { code: 'FR', tripCount: 2, placeCount: 5 },
            { code: 'IT', tripCount: 0, placeCount: 0 },
          ],
          stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 2, totalDays: 14 },
          continents: { Europe: 2 },
        }),
      });
      render(<AtlasPage />);

      expect(screen.getByText('Italy')).toBeInTheDocument();
      expect(screen.getByText('atlas.confirmUnmarkRegion')).toBeInTheDocument();
      fireEvent.click(screen.getByText('common.cancel'));
      expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenLastCalledWith(null));
      expect(atlas.visitedRegions).toEqual({});
      const data = atlas.data as AtlasData;
      expect(data.countries.map((c) => c.code)).toEqual(['FR']);
      expect(data.stats.totalCountries).toBe(1);
      expect(data.continents?.Europe).toBe(1);
    });

    it('FE-PAGE-ATLASW-014: a country with other regions left keeps its entry', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62' },
        visitedRegions: {
          IT: [
            { code: 'IT-62', name: 'Lazio', placeCount: 0 },
            { code: 'IT-25', name: 'Lombardia', placeCount: 0 },
          ],
        } as VisitedRegions,
        data: buildAtlasData({
          countries: [{ code: 'IT', tripCount: 0, placeCount: 0 }],
          stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
        }),
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      expect((atlas.visitedRegions as VisitedRegions).IT.map((r) => r.code)).toEqual(['IT-25']);
      expect((atlas.data as AtlasData).countries).toHaveLength(1);
    });

    it('FE-PAGE-ATLASW-015: a failing region removal shows the error toast', async () => {
      setAtlas({ confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62' } });
      server.use(
        http.delete('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ error: 'Boom' }, { status: 500 })),
      );
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(toast).toHaveBeenCalledWith('Boom', 'error', undefined));
    });

    it('FE-PAGE-ATLASW-016: the bucket step offers a month and a year picker', () => {
      const atlas = setAtlas({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });
      render(<AtlasPage />);

      expect(screen.getByText('atlas.bucketWhen')).toBeInTheDocument();

      const [monthTrigger, yearTrigger] = selectTriggers();
      fireEvent.click(monthTrigger);
      fireEvent.click(screen.getByText('March'));
      expect(atlas.setBucketMonth).toHaveBeenCalledWith(3);

      const nextYear = String(new Date().getFullYear() + 1);
      fireEvent.click(yearTrigger);
      fireEvent.click(screen.getByText(nextYear));
      expect(atlas.setBucketYear).toHaveBeenCalledWith(Number(nextYear));
    });

    it('FE-PAGE-ATLASW-016b: a chosen month and year is posted as the target date and reset afterwards', async () => {
      let body: unknown = null;
      server.use(
        http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ item: buildBucketItem({ id: 99, name: 'Germany', country_code: 'DE', target_date: '2027-05' }) });
        }),
      );
      const atlas = setAtlas({
        confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' },
        bucketMonth: 5,
        bucketYear: 2027,
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.addToBucket'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenLastCalledWith(null));
      expect(body).toEqual({ name: 'Germany', country_code: 'DE', target_date: '2027-05' });
      expect(atlas.bucketList as unknown[]).toHaveLength(1);
      expect(atlas.setBucketMonth).toHaveBeenLastCalledWith(0);
      expect(atlas.setBucketYear).toHaveBeenLastCalledWith(0);
    });

    it('FE-PAGE-ATLASW-017: without a month and year the bucket item is posted open-ended', async () => {
      let body: unknown = null;
      server.use(
        http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ item: buildBucketItem({ id: 100, name: 'Bretagne' }) });
        }),
      );
      const atlas = setAtlas({ confirmAction: { type: 'bucket', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('common.back'));
      expect(atlas.setConfirmAction).toHaveBeenCalledWith({
        type: 'choose-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE',
      });

      fireEvent.click(screen.getByText('atlas.addToBucket'));

      await waitFor(() => expect(body).toEqual({ name: 'Bretagne', country_code: 'FR', target_date: null }));
    });

    it('FE-PAGE-ATLASW-018b: a country already wishlisted for that date is not posted again (#1898)', async () => {
      const post = vi.fn();
      server.use(http.post('/api/addons/atlas/bucket-list', () => {
        post();
        return HttpResponse.json({ item: buildBucketItem({ id: 99, name: 'Germany', country_code: 'DE' }) });
      }));
      const atlas = setAtlas({
        confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' },
        bucketList: [buildBucketItem({ id: 7, name: 'Germany', country_code: 'DE' })],
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.addToBucket'));

      await waitFor(() => expect(toast).toHaveBeenCalledWith('atlas.bucketDuplicate', 'error', undefined));
      expect(post).not.toHaveBeenCalled();
      // The popup stays open on the date step so another month can be picked.
      expect(atlas.setConfirmAction).not.toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-018: a failing bucket post shows the error toast', async () => {
      server.use(
        http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'Full' }, { status: 400 })),
      );
      setAtlas({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.addToBucket'));

      await waitFor(() => expect(toast).toHaveBeenCalledWith('Full', 'error', undefined));
    });
  });

  describe('sidebar', () => {
    it('FE-PAGE-ATLASW-019: the stats tab lists totals and continents ordered by size', () => {
      const atlas = setAtlas({
        data: buildAtlasData({
          continents: { Europe: 3, Asia: 5, Africa: 1 },
          stats: { totalTrips: 6, totalPlaces: 40, totalCountries: 9, totalDays: 55, totalCities: 12 },
          streak: 1,
          tripsThisYear: 1,
        }),
      });
      render(<AtlasPage />);

      // Every total shows twice: once in the mobile bar, once in the desktop panel.
      expect(screen.getAllByText('9')).toHaveLength(2);
      expect(screen.getAllByText('40')).toHaveLength(2);
      expect(screen.getByText('atlas.europe')).toBeInTheDocument();
      // Singular labels are picked when streak / tripsThisYear are 1.
      expect(screen.getByText('atlas.yearInRow')).toBeInTheDocument();
      expect(screen.getByText(/atlas\.tripIn/)).toBeInTheDocument();

      // The last-trip tile used to sit in this row; the row is stats only now.
      expect(screen.queryByText('Paris Trip')).not.toBeInTheDocument();
    });

    it('FE-PAGE-ATLASW-020: an empty atlas shows the mascot empty state instead of the stats', () => {
      setAtlas({ data: buildAtlasData({ countries: [], lastTrip: null, continents: {} }) });
      render(<AtlasPage />);

      expect(screen.getByText('atlas.noData')).toBeInTheDocument();
    });

    it('FE-PAGE-ATLASW-021: the country detail overlay lists trips and offers the manual unmark', () => {
      const atlas = setAtlas({
        selectedCountry: 'FR',
        countryDetail: buildCountryDetail({
          places: [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as CountryDetail['places'],
          trips: [
            { id: 11, title: 'Paris' },
            { id: 12, title: 'Nice' },
            { id: 13, title: 'Lyon' },
            { id: 14, title: 'Brest' },
          ],
          manually_marked: true,
        }),
      });
      render(<AtlasPage />);

      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('3 atlas.places · 4 atlas.tripPlural')).toBeInTheDocument();
      // Only the first three trips are shown.
      expect(screen.queryByText('Brest')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Nice'));
      expect(atlas.navigate).toHaveBeenCalledWith('/trips/12');

      fireEvent.click(screen.getByText('atlas.unmark'));
      expect(atlas.handleUnmarkCountry).toHaveBeenCalledWith('FR');
    });

    it('FE-PAGE-ATLASW-022: the stats panel measures itself through a ResizeObserver', () => {
      const observeSpy = vi.fn();
      const disconnectSpy = vi.fn();
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe = observeSpy;
          unobserve = vi.fn();
          disconnect = disconnectSpy;
          constructor(cb: ResizeObserverCallback) {
            cb([], this as unknown as ResizeObserver);
          }
        },
      );
      const { unmount } = render(<AtlasPage />);

      expect(observeSpy).toHaveBeenCalled();
      unmount();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-023: the bucket tab renders items with target month, notes and a delete action', () => {
      const atlas = setAtlas({
        bucketTab: 'bucket',
        bucketList: [
          buildBucketItem({ id: 1, name: 'Kyoto', country_code: 'JPN', target_date: '2027-04' }),
          buildBucketItem({ id: 2, name: 'Patagonia', country_code: null, notes: 'road trip' }),
          buildBucketItem({ id: 3, name: 'Lisbon', country_code: 'PT', target_date: '2030' }),
        ],
      });
      render(<AtlasPage />);

      expect(screen.getByText('Kyoto')).toBeInTheDocument();
      expect(screen.getByText('Apr 2027')).toBeInTheDocument();
      expect(screen.getByText('road trip')).toBeInTheDocument();
      expect(screen.getByText('2030')).toBeInTheDocument();
      expect((document.querySelector('img[alt="JP"]') as HTMLImageElement).src).toContain('flagcdn.com/w40/jp.png');

      const deleteBtn = screen.getByText('Patagonia').closest('div')?.querySelector('button') as HTMLButtonElement;
      fireEvent.click(deleteBtn);
      expect(atlas.handleDeleteBucketItem).toHaveBeenCalledWith(2);

      fireEvent.click(screen.getByText('atlas.addPoi'));
      expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(true);
    });

    it('FE-PAGE-ATLASW-024: the bucket add form searches, picks a result and submits', () => {
      const atlas = setAtlas({
        bucketTab: 'bucket',
        showBucketAdd: true,
        bucketSearch: 'kyo',
        bucketSearchResults: [{ name: 'Kyoto', address: 'Japan' }],
      });
      render(<AtlasPage />);

      const nameInput = screen.getByPlaceholderText('atlas.bucketNamePlaceholder');
      expect(nameInput).toHaveValue('kyo');
      fireEvent.change(nameInput, { target: { value: 'kyot' } });
      expect(atlas.setBucketSearch).toHaveBeenCalledWith('kyot');

      fireEvent.keyDown(nameInput, { key: 'Enter' });
      expect(atlas.handleBucketPoiSearch).toHaveBeenCalled();

      fireEvent.click(screen.getByText('Kyoto'));
      expect(atlas.handleSelectBucketPoi).toHaveBeenCalledWith({ name: 'Kyoto', address: 'Japan' });

      const [monthTrigger, yearTrigger] = selectTriggers();
      fireEvent.click(monthTrigger);
      fireEvent.click(screen.getByText('Mar'));
      expect(atlas.setBucketPoiMonth).toHaveBeenCalledWith(3);

      const nextYear = String(new Date().getFullYear() + 2);
      fireEvent.click(yearTrigger);
      fireEvent.click(screen.getByText(nextYear));
      expect(atlas.setBucketPoiYear).toHaveBeenCalledWith(Number(nextYear));

      fireEvent.click(screen.getByText('common.cancel'));
      expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(false);
      expect(atlas.setBucketForm).toHaveBeenCalledWith({ name: '', notes: '', lat: '', lng: '', target_date: '' });
    });

    it('FE-PAGE-ATLASW-025: a picked place shows its coordinates and can be cleared again', () => {
      const atlas = setAtlas({
        bucketTab: 'bucket',
        showBucketAdd: true,
        bucketForm: { name: 'Kyoto', notes: '', lat: '35.0116', lng: '135.7681', target_date: '' },
      });
      render(<AtlasPage />);

      expect(screen.getByText(/35\.0116, 135\.7681/)).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('atlas.bucketNamePlaceholder');
      fireEvent.change(nameInput, { target: { value: 'Kyoto old town' } });
      expect(atlas.setBucketForm).toHaveBeenCalledWith({
        name: 'Kyoto old town', notes: '', lat: '35.0116', lng: '135.7681', target_date: '',
      });

      fireEvent.keyDown(nameInput, { key: 'Enter' });
      expect(atlas.handleAddBucketItem).toHaveBeenCalled();
      fireEvent.keyDown(nameInput, { key: 'Escape' });
      expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(false);

      const clearBtn = nameInput.parentElement?.querySelector('button') as HTMLButtonElement;
      fireEvent.click(clearBtn);
      expect(atlas.setBucketForm).toHaveBeenLastCalledWith({
        name: '', notes: '', lat: '', lng: '', target_date: '',
      });

      fireEvent.click(screen.getByText('common.add'));
      expect(atlas.handleAddBucketItem).toHaveBeenCalledTimes(2);
    });

    it('FE-PAGE-ATLASW-026: the tab bar switches between stats and bucket list', () => {
      const atlas = setAtlas({ bucketList: [] });
      render(<AtlasPage />);

      expect(screen.getByText('atlas.bucketEmptyHint')).toBeInTheDocument();
      fireEvent.click(screen.getByText('atlas.bucketTab'));
      expect(atlas.setBucketTab).toHaveBeenCalledWith('bucket');
      fireEvent.click(screen.getByText('atlas.statsTab'));
      expect(atlas.setBucketTab).toHaveBeenCalledWith('stats');
    });
  });

  describe('appearance', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('data-no-transparency');
    });

    it('FE-PAGE-ATLASW-027: the no-transparency setting paints the tooltip and the panel opaque', () => {
      document.documentElement.setAttribute('data-no-transparency', '');
      const atlas = setAtlas();
      const { unmount } = render(<AtlasPage />);

      const tooltip = atlas.regionTooltipRef.current as HTMLElement;
      const panel = atlas.panelRef.current as HTMLElement;
      expect(tooltip.style.background).toBe('rgb(255, 255, 255)');
      expect(panel.style.background).toBe('rgb(255, 255, 255)');
      unmount();

      const darkAtlas = setAtlas({ dark: true });
      render(<AtlasPage />);
      expect((darkAtlas.regionTooltipRef.current as HTMLElement).style.background).toBe('rgb(15, 15, 20)');
      expect((darkAtlas.panelRef.current as HTMLElement).style.background).toBe('rgb(21, 21, 28)');
    });

    it('FE-PAGE-ATLASW-028: without the setting both surfaces stay translucent', () => {
      const atlas = setAtlas();
      render(<AtlasPage />);

      expect((atlas.regionTooltipRef.current as HTMLElement).style.background).toBe('rgba(255, 255, 255, 0.96)');
      expect((atlas.panelRef.current as HTMLElement).style.background).toBe('rgba(255, 255, 255, 0.2)');
    });
  });

  describe('continent bookkeeping', () => {
    it('FE-PAGE-ATLASW-029: marking a region on a new continent starts that continent at one', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'choose-region', code: 'JP', name: 'Kansai', regionCode: 'JP-27' },
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.markVisited'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      const data = atlas.data as AtlasData;
      // Europe was the only known continent; Asia is added from zero.
      expect(data.continents).toEqual({ Europe: 1, Asia: 1 });
      expect(data.stats.totalCountries).toBe(2);
    });

    it('FE-PAGE-ATLASW-030: removing a country that has no recorded regions clamps its continent at zero', async () => {
      const atlas = setAtlas({
        confirmAction: { type: 'unmark-region', code: 'JP', name: 'Kansai', regionCode: 'JP-27' },
        visitedRegions: {} as VisitedRegions,
        data: buildAtlasData({
          countries: [{ code: 'JP', tripCount: 0, placeCount: 0, firstVisit: null, lastVisit: null }],
          stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
          continents: { Europe: 1 },
        }),
      });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('atlas.unmark'));

      await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
      const data = atlas.data as AtlasData;
      expect(data.countries).toHaveLength(0);
      expect(data.stats.totalCountries).toBe(0);
      // Asia was never counted, so the decrement floors at 0 instead of going negative.
      expect(data.continents).toEqual({ Europe: 1, Asia: 0 });
    });

    it('FE-PAGE-ATLASW-031: backing out of the bucket step returns to the country chooser', () => {
      const atlas = setAtlas({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });
      render(<AtlasPage />);

      fireEvent.click(screen.getByText('common.back'));
      expect(atlas.setConfirmAction).toHaveBeenCalledWith({ type: 'choose', code: 'DE', name: 'Germany' });
    });
  });

  describe('planned countries (#1048)', () => {
    const withPlanned = (totalCountriesPlanned: number) =>
      buildAtlasData({
        stats: { totalTrips: 6, totalPlaces: 40, totalCountries: 9, totalDays: 55, totalCities: 12, totalCountriesPlanned },
      });

    it('FE-PAGE-ATLASW-032: the panel only mentions planned countries once there are some', () => {
      setAtlas({ data: withPlanned(0) });
      const { unmount } = render(<AtlasPage />);

      expect(screen.queryByText(/atlas\.planned/)).not.toBeInTheDocument();
      unmount();

      setAtlas({ data: withPlanned(3) });
      render(<AtlasPage />);

      expect(screen.getByText('+3 atlas.planned')).toBeInTheDocument();
    });

    it('FE-PAGE-ATLASW-033: the layer toggle rides on the same count and flips the planned layer', () => {
      setAtlas({ data: withPlanned(0) });
      const { unmount } = render(<AtlasPage />);

      expect(screen.queryByRole('button', { name: 'atlas.showPlanned' })).not.toBeInTheDocument();
      unmount();

      const atlas = setAtlas({ data: withPlanned(3) });
      render(<AtlasPage />);

      fireEvent.click(screen.getByRole('button', { name: 'atlas.showPlanned' }));
      expect(atlas.togglePlanned).toHaveBeenCalled();
    });

    it('FE-PAGE-ATLASW-034: the country detail badges a country you have not reached yet', () => {
      setAtlas({ selectedCountry: 'FR', countryDetail: buildCountryDetail({ status: 'planned' }) });
      const { unmount } = render(<AtlasPage />);

      expect(screen.getByText('atlas.planned')).toBeInTheDocument();
      unmount();

      setAtlas({ selectedCountry: 'FR', countryDetail: buildCountryDetail({ status: 'visited' }) });
      render(<AtlasPage />);

      expect(screen.queryByText('atlas.planned')).not.toBeInTheDocument();
    });
  });
});
