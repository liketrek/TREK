import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../helpers/render';
import { buildAtlasController, buildAtlasData, buildBucketItem, buildCountryDetail } from '../../../helpers/atlas';
import type { AtlasController } from '../../../../src/mobile/screens/atlas/atlasController';
import type { CountryDetail } from '../../../../src/pages/atlas/atlasModel';
import MAtlas from '../../../../src/mobile/screens/atlas/MAtlas';

// FE-MOB-ATLASSCR-001 to FE-MOB-ATLASSCR-020

const mocks = vi.hoisted(() => ({ atlas: {} as AtlasController }));

vi.mock('../../../../src/pages/atlas/useAtlas', () => ({
  useAtlas: () => mocks.atlas,
}));

function setAtlas(over: Record<string, unknown> = {}): AtlasController {
  mocks.atlas = buildAtlasController(over);
  return mocks.atlas;
}

beforeEach(() => {
  setAtlas();
});

describe('MAtlas', () => {
  it('FE-MOB-ATLASSCR-001: shows only a spinner while the atlas is loading', () => {
    setAtlas({ loading: true });
    render(<MAtlas />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('atlas.bucketTab')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-002: renders the map container, the bucket header and the stats card', () => {
    setAtlas({
      data: buildAtlasData({ stats: { totalTrips: 4, totalPlaces: 21, totalCountries: 7, totalDays: 30, totalCities: 9 } }),
    });
    render(<MAtlas />);

    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'atlas.bucketTab' })).toBeInTheDocument();
    // Stats card labels come from the real translations via useTranslation.
    expect(screen.getByText('Countries')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-003: the header button opens the bucket-list sheet', () => {
    setAtlas({ bucketList: [buildBucketItem({ id: 1, name: 'Kyoto', country_code: 'JP' })] });
    render(<MAtlas />);

    expect(screen.queryByText('Kyoto')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'atlas.bucketTab' }));

    expect(screen.getByText('Kyoto')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-004: the ?search=1 hand-off opens the search overlay and clears the param', async () => {
    setAtlas({ atlas_country_options: [{ code: 'JP', label: 'Japan' }] });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    const input = await screen.findByPlaceholderText('Search a country...');
    expect(input).toBeInTheDocument();

    // The param is consumed once — closing and reopening is up to the user again.
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByPlaceholderText('Search a country...')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-005: no search param leaves the overlay closed', () => {
    render(<MAtlas />);
    expect(screen.queryByPlaceholderText('Search a country...')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-006: picking a country from the search flies the map there and closes the overlay', async () => {
    const atlas = setAtlas({
      atlas_country_options: [{ code: 'JP', label: 'Japan' }, { code: 'FR', label: 'France' }],
    });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    const input = await screen.findByPlaceholderText('Search a country...');
    fireEvent.change(input, { target: { value: 'jap' } });
    fireEvent.click(screen.getByText('Japan'));

    expect(atlas.select_country_from_search).toHaveBeenCalledWith('JP');
    await waitFor(() => expect(screen.queryByPlaceholderText('Search a country...')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-007: suggestions list visited countries newest first, then bucket countries', async () => {
    setAtlas({
      data: buildAtlasData({
        countries: [
          { code: 'FR', tripCount: 1, placeCount: 1, lastVisit: '2022-01-01' },
          { code: 'JP', tripCount: 1, placeCount: 1, lastVisit: '2025-08-01' },
        ],
      }),
      bucketList: [
        buildBucketItem({ id: 1, name: 'Lima', country_code: 'PE' }),
        buildBucketItem({ id: 2, name: 'Kyoto', country_code: 'JP' }),
        buildBucketItem({ id: 3, name: 'Andes', country_code: null }),
        buildBucketItem({ id: 4, name: 'Machu Picchu', country_code: 'PER' }),
      ],
    });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    await screen.findByPlaceholderText('Search a country...');
    const rows = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    expect(rows.map((r) => r.textContent)).toEqual(['JapanVisited', 'FranceVisited', 'PeruBucket List']);
  });

  it('FE-MOB-ATLASSCR-008: suggestions are capped at five entries', async () => {
    setAtlas({
      data: buildAtlasData({
        countries: ['FR', 'JP', 'IT', 'ES', 'DE', 'US'].map((code, i) => ({
          code, tripCount: 1, placeCount: 1, lastVisit: `202${i}-01-01`,
        })),
      }),
    });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    await screen.findByPlaceholderText('Search a country...');
    expect(screen.getAllByRole('button').filter((b) => b.querySelector('img'))).toHaveLength(5);
  });

  it('FE-MOB-ATLASSCR-009: loading a country detail opens the detail sheet with its counts', async () => {
    setAtlas({
      selectedCountry: 'JP',
      countryDetail: buildCountryDetail({
        places: [{ id: 1 }, { id: 2 }] as unknown as CountryDetail['places'],
        trips: [{ id: 11, title: 'Kansai' }, { id: 12, title: 'Hokkaido' }],
      }),
    });
    render(<MAtlas />);

    expect(await screen.findByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('2 atlas.places · 2 atlas.trips')).toBeInTheDocument();
    expect(screen.getByText('Kansai')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-010: a trip chip navigates to the trip planner', async () => {
    const atlas = setAtlas({
      selectedCountry: 'JP',
      countryDetail: buildCountryDetail({ trips: [{ id: 11, title: 'Kansai' }] }),
    });
    render(<MAtlas />);

    fireEvent.click(await screen.findByText('Kansai'));

    expect(atlas.navigate).toHaveBeenCalledWith('/trips/11');
  });

  it('FE-MOB-ATLASSCR-011: a manually marked country offers the remove action and closes the sheet', async () => {
    const atlas = setAtlas({
      selectedCountry: 'JP',
      countryDetail: buildCountryDetail({ manually_marked: true }),
    });
    render(<MAtlas />);

    fireEvent.click(await screen.findByText('atlas.unmark'));

    expect(atlas.handleUnmarkCountry).toHaveBeenCalledWith('JP');
    await waitFor(() => expect(screen.queryByText('atlas.unmark')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-012: a country derived from real trips has no remove action', async () => {
    setAtlas({
      selectedCountry: 'JP',
      countryDetail: buildCountryDetail({ trips: [{ id: 11, title: 'Kansai' }] }),
    });
    render(<MAtlas />);

    await screen.findByText('Japan');
    expect(screen.queryByText('atlas.unmark')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-013: the detail sheet closes via its close button', async () => {
    setAtlas({ selectedCountry: 'JP', countryDetail: buildCountryDetail() });
    render(<MAtlas />);

    fireEvent.click(await screen.findByRole('button', { name: 'common.close' }));

    await waitFor(() => expect(screen.queryByText('Japan')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-014: the detail sheet also closes on Escape', async () => {
    setAtlas({ selectedCountry: 'JP', countryDetail: buildCountryDetail() });
    render(<MAtlas />);

    await screen.findByText('Japan');
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByText('Japan')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-015: the bucket sheet closes again from its own close button', async () => {
    setAtlas({ bucketList: [buildBucketItem({ id: 1, name: 'Kyoto', country_code: 'JP' })] });
    render(<MAtlas />);

    fireEvent.click(screen.getByRole('button', { name: 'atlas.bucketTab' }));
    expect(screen.getByText('Kyoto')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));

    await waitFor(() => expect(screen.queryByText('Kyoto')).not.toBeInTheDocument());
  });

  it('FE-MOB-ATLASSCR-016: duplicate and never-visited countries collapse into one suggestion each', async () => {
    setAtlas({
      data: buildAtlasData({
        countries: [
          { code: 'FR', tripCount: 1, placeCount: 1 },
          { code: 'FR', tripCount: 2, placeCount: 3 },
          { code: 'JP', tripCount: 1, placeCount: 1 },
        ],
      }),
    });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    await screen.findByPlaceholderText('Search a country...');
    const rows = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    expect(rows.map((r) => r.textContent)).toEqual(['FranceVisited', 'JapanVisited']);
  });

  it('FE-MOB-ATLASSCR-017: the planned pill stays away while nothing is planned', () => {
    render(<MAtlas />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText('atlas.planned')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASSCR-018: a planned country brings up the pill and its switch flips the layer', () => {
    const atlas = setAtlas({
      data: buildAtlasData({
        stats: { totalTrips: 4, totalPlaces: 21, totalCountries: 7, totalDays: 30, totalCities: 9, totalCountriesPlanned: 2 },
      }),
    });
    render(<MAtlas />);

    expect(screen.getByText('atlas.planned')).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'atlas.showPlanned' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(atlas.togglePlanned).toHaveBeenCalled();
  });

  it('FE-MOB-ATLASSCR-019: suggestions rank the countries you have been to above the planned ones', async () => {
    setAtlas({
      data: buildAtlasData({
        countries: [
          { code: 'JP', tripCount: 1, placeCount: 0, lastVisit: '2099-08-01', status: 'planned' },
          { code: 'FR', tripCount: 1, placeCount: 1, lastVisit: '2022-01-01', status: 'visited' },
        ],
        stats: { totalTrips: 2, totalPlaces: 1, totalCountries: 1, totalDays: 4, totalCountriesPlanned: 1 },
      }),
    });
    render(<MAtlas />, { initialEntries: ['/atlas?search=1'] });

    await screen.findByPlaceholderText('Search a country...');
    const rows = screen.getAllByRole('button').filter((b) => b.querySelector('img'));
    // Japan has the later date but is only planned, so France leads and keeps "Visited".
    expect(rows.map((r) => r.textContent)).toEqual(['FranceVisited', 'JapanPlanned']);
  });

  it('FE-MOB-ATLASSCR-020: the screen measures itself, not the shell', () => {
    // #1809: the shell scrolls with the document now and hands down no definite
    // height. A map on a percentage of an auto-height parent collapses to zero.
    const { container, rerender } = render(<MAtlas />);
    expect(container.firstElementChild).toHaveClass('h-dvh');

    setAtlas({ loading: true });
    rerender(<MAtlas />);
    expect(container.firstElementChild).toHaveClass('h-dvh');
  });
});
