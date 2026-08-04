import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, fireEvent } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { buildAtlasController, buildAtlasData, type VisitedRegions } from '../../../helpers/atlas';
import MAtlasCountryPopup from '../../../../src/mobile/screens/atlas/MAtlasCountryPopup';
import type { AtlasController } from '../../../../src/mobile/screens/atlas/atlasController';
import type { AtlasData } from '../../../../src/pages/atlas/atlasModel';

// FE-MOB-ATLASPOP-001 to FE-MOB-ATLASPOP-026

type ConfirmAction = AtlasController['confirmAction'];

const toast = vi.fn(() => 0);

function renderPopup(over: Record<string, unknown> = {}) {
  const atlas = buildAtlasController(over);
  const view = render(<MAtlasCountryPopup atlas={atlas} />);
  return { atlas, view };
}

function chooseAction(over: Partial<NonNullable<ConfirmAction>> = {}): ConfirmAction {
  return { type: 'choose', code: 'DE', name: 'Germany', ...over } as ConfirmAction;
}

beforeEach(() => {
  toast.mockClear();
  window.__addToast = toast;
  server.use(
    http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ success: true })),
    http.post('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ success: true })),
    http.delete('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ success: true })),
    http.post('/api/addons/atlas/bucket-list', () =>
      HttpResponse.json({ item: { id: 42, name: 'Germany', country_code: 'DE', lat: null, lng: null, notes: null, target_date: '2027-05' } }),
    ),
  );
});

describe('MAtlasCountryPopup', () => {
  it('FE-MOB-ATLASPOP-001: renders nothing while there is no pending action', () => {
    renderPopup({ confirmAction: null });
    expect(screen.queryByText('atlas.markVisited')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASPOP-002: a country choice shows the flag image and both option rows', () => {
    renderPopup({ confirmAction: chooseAction() });

    const flag = document.querySelector('img') as HTMLImageElement | null;
    expect(flag?.src).toContain('flagcdn.com/w80/de.png');
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('atlas.markVisited')).toBeInTheDocument();
    expect(screen.getByText('atlas.markVisitedHint')).toBeInTheDocument();
    expect(screen.getByText('atlas.addToBucket')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASPOP-003: a non-ISO2 code falls back to a placeholder instead of an image', () => {
    renderPopup({ confirmAction: chooseAction({ code: 'DEU', name: 'Germany' }) });
    expect(document.querySelector('img')).toBeNull();
    // No flag is available for alpha-3, but the slot must not stay empty.
    expect(document.querySelector('.lucide-map-pin')).not.toBeNull();
  });

  it('FE-MOB-ATLASPOP-004: marking a country appends it to the atlas data and closes the sheet', async () => {
    const { atlas } = renderPopup({ confirmAction: chooseAction(), data: buildAtlasData() });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    const data = atlas.data as AtlasData;
    expect(data.countries.map((c) => c.code)).toEqual(['FR', 'DE']);
    expect(data.stats.totalCountries).toBe(2);
    expect(data.continents?.Europe).toBe(2);
  });

  it('FE-MOB-ATLASPOP-005: marking a country already in the list leaves the data untouched', async () => {
    const { atlas } = renderPopup({ confirmAction: chooseAction({ code: 'FR', name: 'France' }) });
    const before = atlas.data;

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect(atlas.data).toBe(before);
  });

  it('FE-MOB-ATLASPOP-006: a failing mark request surfaces a toast and still closes', async () => {
    server.use(
      http.post('/api/addons/atlas/country/:code/mark', () =>
        HttpResponse.json({ error: 'Country locked' }, { status: 400 }),
      ),
    );
    const { atlas } = renderPopup({ confirmAction: chooseAction() });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Country locked', 'error', undefined));
    expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ATLASPOP-007: the bucket option switches the pending action to the bucket step', () => {
    const action = chooseAction();
    const { atlas } = renderPopup({ confirmAction: action });

    fireEvent.click(screen.getByText('atlas.addToBucket'));

    expect(atlas.setConfirmAction).toHaveBeenCalledWith({ ...action, type: 'bucket' });
  });

  it('FE-MOB-ATLASPOP-008: a region choice shows the parent country and the region hint', () => {
    renderPopup({
      confirmAction: { type: 'choose-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE', countryName: 'France' },
    });

    expect(screen.getByText('Bretagne')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('atlas.markRegionVisitedHint')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASPOP-009: marking a region records it and adds the country when it is new', async () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA', countryName: 'Spain' },
    });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    const regions = atlas.visitedRegions as VisitedRegions;
    expect(regions.ES).toEqual([{ code: 'ES-GA', name: 'Galicia', placeCount: 0, status: 'visited', manuallyMarked: true }]);
    const data = atlas.data as AtlasData;
    expect(data.countries.map((c) => c.code)).toContain('ES');
    expect(data.stats.totalCountries).toBe(2);
  });

  it('FE-MOB-ATLASPOP-010: marking an already-recorded region keeps the region list as is', async () => {
    const existing: VisitedRegions = { FR: [{ code: 'FR-BRE', name: 'Bretagne', placeCount: 2 }] };
    const { atlas } = renderPopup({
      confirmAction: { type: 'choose-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE', countryName: 'France' },
      visitedRegions: existing,
    });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect(atlas.visitedRegions).toBe(existing);
  });

  it('FE-MOB-ATLASPOP-011: a failing region mark reports the error', async () => {
    server.use(
      http.post('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ error: 'Bad region' }, { status: 422 })),
    );
    renderPopup({
      confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA', countryName: 'Spain' },
    });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Bad region', 'error', undefined));
  });

  it('FE-MOB-ATLASPOP-012: removing the last region of an unvisited-otherwise country drops the country too', async () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62', countryName: 'Italy' },
      visitedRegions: { IT: [{ code: 'IT-62', name: 'Lazio', placeCount: 0, manuallyMarked: true }] } as VisitedRegions,
      data: buildAtlasData({
        countries: [
          { code: 'FR', tripCount: 2, placeCount: 5 },
          { code: 'IT', tripCount: 0, placeCount: 0 },
        ],
        stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 2, totalDays: 14 },
        continents: { Europe: 2 },
      }),
    });

    expect(screen.getByText('atlas.confirmUnmarkRegion')).toBeInTheDocument();
    fireEvent.click(screen.getByText('atlas.unmark'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect(atlas.visitedRegions).toEqual({});
    const data = atlas.data as AtlasData;
    expect(data.countries.map((c) => c.code)).toEqual(['FR']);
    expect(data.stats.totalCountries).toBe(1);
    expect(data.continents?.Europe).toBe(1);
  });

  it('FE-MOB-ATLASPOP-013: a country with real places survives removing one of its regions', async () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'unmark-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE', countryName: 'France' },
      visitedRegions: {
        FR: [
          { code: 'FR-BRE', name: 'Bretagne', placeCount: 1 },
          { code: 'FR-IDF', name: 'Ile-de-France', placeCount: 4 },
        ],
      } as VisitedRegions,
    });

    fireEvent.click(screen.getByText('atlas.unmark'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    const regions = atlas.visitedRegions as VisitedRegions;
    expect(regions.FR.map((r) => r.code)).toEqual(['FR-IDF']);
    expect((atlas.data as AtlasData).countries.map((c) => c.code)).toEqual(['FR']);
  });

  it('FE-MOB-ATLASPOP-014: a failing region removal reports the error', async () => {
    server.use(
      http.delete('/api/addons/atlas/region/:code/mark', () => HttpResponse.json({ error: 'Nope' }, { status: 500 })),
    );
    renderPopup({
      confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62', countryName: 'Italy' },
    });

    fireEvent.click(screen.getByText('atlas.unmark'));

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Nope', 'error', undefined));
  });

  it('FE-MOB-ATLASPOP-015: the bucket step posts the chosen target month and prepends the item', async () => {
    let body: unknown = null;
    server.use(
      http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ item: { id: 42, name: 'Germany', country_code: 'DE', lat: null, lng: null, notes: null, target_date: '2027-05' } });
      }),
    );
    const { atlas } = renderPopup({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });

    const monthInput = document.querySelector('input[type="month"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '2027-05' } });
    expect(monthInput.value).toBe('2027-05');

    fireEvent.click(screen.getByText('atlas.addToBucket'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect(body).toEqual({ name: 'Germany', country_code: 'DE', target_date: '2027-05' });
    expect(atlas.bucketList).toEqual([
      { id: 42, name: 'Germany', country_code: 'DE', lat: null, lng: null, notes: null, target_date: '2027-05' },
    ]);
  });

  it('FE-MOB-ATLASPOP-016: back from the bucket step returns to the region choice when a region is pending', () => {
    const action = { type: 'bucket', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE' } as ConfirmAction;
    const { atlas } = renderPopup({ confirmAction: action });

    fireEvent.click(screen.getByText('common.back'));

    expect(atlas.setConfirmAction).toHaveBeenCalledWith({ ...action, type: 'choose-region' });
  });

  it('FE-MOB-ATLASPOP-017: a failing bucket post reports the error', async () => {
    server.use(
      http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'Full' }, { status: 400 })),
    );
    renderPopup({ confirmAction: { type: 'bucket', code: 'DE', name: 'Germany' } });

    fireEvent.click(screen.getByText('atlas.addToBucket'));

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Full', 'error', undefined));
  });

  it('FE-MOB-ATLASPOP-018: mark and unmark confirmations delegate to the shared executor', () => {
    const { atlas } = renderPopup({ confirmAction: { type: 'mark', code: 'DE', name: 'Germany' } });

    expect(screen.getByText('atlas.confirmMark')).toBeInTheDocument();
    fireEvent.click(screen.getByText('atlas.markVisited'));
    expect(atlas.executeConfirmAction).toHaveBeenCalled();

    fireEvent.click(screen.getByText('common.cancel'));
    expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ATLASPOP-019: the unmark confirmation offers cancel and the destructive confirm', () => {
    const { atlas } = renderPopup({ confirmAction: { type: 'unmark', code: 'FR', name: 'France' } });

    expect(screen.getByText('atlas.confirmUnmark')).toBeInTheDocument();
    fireEvent.click(screen.getByText('common.cancel'));
    expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByText('atlas.unmark'));
    expect(atlas.executeConfirmAction).toHaveBeenCalled();
  });

  it('FE-MOB-ATLASPOP-020: the region removal confirmation can be cancelled', () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62' },
    });

    fireEvent.click(screen.getByText('common.cancel'));
    expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ATLASPOP-021: the region choice can be moved to the bucket step', () => {
    const action = { type: 'choose-region', code: 'ES', name: 'Galicia', regionCode: 'ES-GA' } as ConfirmAction;
    const { atlas } = renderPopup({ confirmAction: action });

    fireEvent.click(screen.getByText('atlas.addToBucket'));

    expect(atlas.setConfirmAction).toHaveBeenCalledWith({ ...action, type: 'bucket' });
  });

  it('FE-MOB-ATLASPOP-022: a region action without a region code performs no request', async () => {
    const markSpy = vi.fn();
    const deleteSpy = vi.fn();
    server.use(
      http.post('/api/addons/atlas/region/:code/mark', () => { markSpy(); return HttpResponse.json({}); }),
      http.delete('/api/addons/atlas/region/:code/mark', () => { deleteSpy(); return HttpResponse.json({}); }),
    );
    const choose = renderPopup({ confirmAction: { type: 'choose-region', code: 'ES', name: 'Galicia' } });
    fireEvent.click(screen.getByText('atlas.markVisited'));

    const unmark = renderPopup({ confirmAction: { type: 'unmark-region', code: 'ES', name: 'Galicia' } });
    fireEvent.click(screen.getAllByText('atlas.unmark')[0]);

    await waitFor(() => expect(choose.atlas.setVisitedRegions).not.toHaveBeenCalled());
    expect(unmark.atlas.setVisitedRegions).not.toHaveBeenCalled();
    expect(markSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('FE-MOB-ATLASPOP-023: a region removal keeps the country while another manual region remains', async () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62' },
      visitedRegions: {
        IT: [
          { code: 'IT-62', name: 'Lazio', placeCount: 0, manuallyMarked: true },
          { code: 'IT-25', name: 'Lombardia', placeCount: 0, manuallyMarked: true },
        ],
      } as VisitedRegions,
      data: buildAtlasData({
        countries: [{ code: 'IT', tripCount: 0, placeCount: 0 }],
        stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
      }),
    });

    fireEvent.click(screen.getByText('atlas.unmark'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect((atlas.data as AtlasData).countries).toHaveLength(1);
  });

  it('FE-MOB-ATLASPOP-024: mark and bucket actions cope with atlas data that never loaded', async () => {
    const { atlas } = renderPopup({ confirmAction: chooseAction(), data: null });

    fireEvent.click(screen.getByText('atlas.markVisited'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect(atlas.data).toBeNull();
  });

  it('FE-MOB-ATLASPOP-025: dismissing the sheet clears the pending action', () => {
    const { atlas } = renderPopup({ confirmAction: chooseAction() });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(atlas.setConfirmAction).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-ATLASPOP-026: a place-derived region left behind keeps the country, as on desktop', async () => {
    const { atlas } = renderPopup({
      confirmAction: { type: 'unmark-region', code: 'IT', name: 'Lazio', regionCode: 'IT-62' },
      visitedRegions: {
        IT: [
          { code: 'IT-62', name: 'Lazio', placeCount: 0, manuallyMarked: true },
          { code: 'IT-25', name: 'Lombardia', placeCount: 2 },
        ],
      } as VisitedRegions,
      data: buildAtlasData({
        countries: [{ code: 'IT', tripCount: 0, placeCount: 0 }],
        stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
      }),
    });

    fireEvent.click(screen.getByText('atlas.unmark'));

    await waitFor(() => expect(atlas.setConfirmAction).toHaveBeenCalledWith(null));
    expect((atlas.data as AtlasData).countries.map((c) => c.code)).toEqual(['IT']);
  });
});
