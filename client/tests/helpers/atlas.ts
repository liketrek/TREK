import { vi } from 'vitest';
import type { AtlasController } from '../../src/mobile/screens/atlas/atlasController';
import type { VisitStatus } from '@trek/shared';
import type { AtlasData, BucketItem, CountryDetail } from '../../src/pages/atlas/atlasModel';

/**
 * Fixtures for the atlas surfaces. Desktop page, mobile screen, bucket sheet
 * and country popup all consume the same useAtlas() controller, so tests build
 * one object here instead of mounting the hook with a Leaflet map behind it.
 *
 * The state setters are spies that also write the new value back onto the
 * controller (including updater callbacks), so a test can assert both "the
 * setter was called" and "this is the state it produced".
 */

export type VisitedRegions = Record<
  string,
  { code: string; name: string; placeCount: number; manuallyMarked?: boolean; status?: VisitStatus }[]
>;

const echoT = (key: string, params?: Record<string, string | number>): string =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

export function buildAtlasData(over: Partial<AtlasData> = {}): AtlasData {
  return {
    countries: [{ code: 'FR', tripCount: 2, placeCount: 5, firstVisit: '2023-01-01', lastVisit: '2024-06-01', status: 'visited' }],
    stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 1, totalDays: 14, totalCities: 3, totalCountriesPlanned: 0, totalCountriesIdea: 0 },
    mostVisited: null,
    continents: { Europe: 1 },
    continentsPlanned: {},
    lastTrip: { id: 7, title: 'Paris Trip', countryCode: 'FR' },
    nextTrip: null,
    streak: 2,
    firstYear: 2022,
    tripsThisYear: 1,
    ...over,
  };
}

export function buildBucketItem(over: Partial<BucketItem> = {}): BucketItem {
  return {
    id: 1,
    name: 'Kyoto',
    lat: null,
    lng: null,
    country_code: 'JP',
    notes: null,
    target_date: null,
    ...over,
  };
}

export function buildCountryDetail(over: Partial<CountryDetail> = {}): CountryDetail {
  return {
    places: [],
    trips: [],
    manually_marked: false,
    status: 'visited',
    ...over,
  };
}

/** state field → its setter on the controller. */
const SETTERS: Record<string, string> = {
  data: 'setData',
  visitedRegions: 'setVisitedRegions',
  bucketList: 'setBucketList',
  confirmAction: 'setConfirmAction',
  bucketForm: 'setBucketForm',
  bucketSearch: 'setBucketSearch',
  bucketSearchResults: 'setBucketSearchResults',
  showBucketAdd: 'setShowBucketAdd',
  bucketTab: 'setBucketTab',
  bucketMonth: 'setBucketMonth',
  bucketYear: 'setBucketYear',
  bucketPoiMonth: 'setBucketPoiMonth',
  bucketPoiYear: 'setBucketPoiYear',
  atlas_country_search: 'set_atlas_country_search',
  atlas_country_results: 'set_atlas_country_results',
  atlas_country_open: 'set_atlas_country_open',
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', DE: 'Germany', ES: 'Spain', FR: 'France', GR: 'Greece',
  IT: 'Italy', JP: 'Japan', PE: 'Peru', PT: 'Portugal', US: 'United States',
};

export function buildAtlasController(over: Record<string, unknown> = {}): AtlasController {
  const base: Record<string, unknown> = {
    t: echoT,
    language: 'en',
    navigate: vi.fn(() => undefined),
    resolveName: (code: string) => COUNTRY_NAMES[code] ?? code,
    dark: false,
    loading: false,

    mapRef: { current: null },
    regionTooltipRef: { current: null },
    panelRef: { current: null },
    glareRef: { current: null },
    borderGlareRef: { current: null },
    handlePanelMouseMove: vi.fn(() => undefined),
    handlePanelMouseLeave: vi.fn(() => undefined),

    data: buildAtlasData(),
    stats: buildAtlasData().stats,
    countries: buildAtlasData().countries,
    visitedCountries: buildAtlasData().countries,
    visibleCountries: buildAtlasData().countries,
    showPlanned: false,
    togglePlanned: vi.fn(() => undefined),
    selectedCountry: null,
    countryDetail: null,
    loadCountryDetail: vi.fn(async () => undefined),
    handleUnmarkCountry: vi.fn(() => undefined),
    select_country_from_search: vi.fn(() => undefined),
    visitedRegions: {} as VisitedRegions,

    atlas_country_search: '',
    atlas_country_results: [],
    atlas_country_open: false,
    atlas_country_options: [],

    confirmAction: null,
    executeConfirmAction: vi.fn(async () => undefined),

    bucketMonth: 0,
    bucketYear: 0,
    bucketList: [] as BucketItem[],
    bucketTab: 'stats',
    showBucketAdd: false,
    bucketForm: { name: '', notes: '', lat: '', lng: '', target_date: '' },
    handleAddBucketItem: vi.fn(async () => undefined),
    handleDeleteBucketItem: vi.fn(async () => undefined),
    handleBucketPoiSearch: vi.fn(async () => undefined),
    handleSelectBucketPoi: vi.fn(() => undefined),
    bucketSearchResults: [],
    bucketPoiMonth: 0,
    bucketPoiYear: 0,
    bucketSearching: false,
    bucketSearch: '',
  };

  const ctrl: Record<string, unknown> = { ...base, ...over };

  for (const [field, setter] of Object.entries(SETTERS)) {
    if (setter in over) continue;
    ctrl[setter] = vi.fn((next: unknown) => {
      ctrl[field] = typeof next === 'function' ? (next as (prev: unknown) => unknown)(ctrl[field]) : next;
    });
  }

  // stats/countries mirror data unless a test pinned them explicitly.
  const data = ctrl.data as AtlasData | null;
  if (!('stats' in over)) ctrl.stats = data?.stats ?? { totalTrips: 0, totalPlaces: 0, totalCountries: 0, totalDays: 0 };
  if (!('countries' in over)) ctrl.countries = data?.countries ?? [];
  // The hook derives these from data + showPlanned; mirror that so a test that only
  // sets `data` still gets a consistent controller.
  const all = (ctrl.countries ?? []) as AtlasData['countries'];
  if (!('visitedCountries' in over)) ctrl.visitedCountries = all.filter(c => (c.status ?? 'visited') === 'visited');
  if (!('visibleCountries' in over)) {
    ctrl.visibleCountries = ctrl.showPlanned ? all : all.filter(c => (c.status ?? 'visited') === 'visited');
  }

  return ctrl as unknown as AtlasController;
}
