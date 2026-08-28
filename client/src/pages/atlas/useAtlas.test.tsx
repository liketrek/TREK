import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, act, waitFor } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildSettings } from '../../../tests/helpers/factories';
import { useSettingsStore } from '../../store/settingsStore';
import L from 'leaflet';
import { A2_TO_A3 } from './atlasModel';
import { useAtlas } from './useAtlas';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';

// FE-HOOK-ATLAS-001 to FE-HOOK-ATLAS-035

interface MockGeoJson {
  data: { features?: Record<string, unknown>[] };
  options: Record<string, unknown>;
  entries: { feature: Record<string, unknown>; layer: MockLayer }[];
  styles: Record<string, unknown>[];
  /** Whether this layer is on the map right now: built is not the same as shown. */
  attached: boolean;
}

interface MockLayer {
  handlers: Record<string, (e: unknown) => void>;
  bindTooltip: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
  getBounds: ReturnType<typeof vi.fn>;
}

const lf = vi.hoisted(() => ({
  mapHandlers: {} as Record<string, ((e?: unknown) => void)[]>,
  geoJson: [] as unknown[],
  panes: {} as Record<string, { style: Record<string, string> }>,
  zoom: 3,
  intersects: true,
  // The country codes the viewport is over, when a test needs to be selective about it.
  // null falls back to the blanket `intersects` answer.
  intersectsOnly: null as string[] | null,
  hasLayer: true,
  boundsThrows: false,
  mapsCreated: 0,
  mapsRemoved: 0,
  markers: 0,
  map: null as null | { setView: ReturnType<typeof vi.fn> },
  reset() {
    this.mapHandlers = {};
    this.geoJson = [];
    this.panes = { overlayPane: { style: {} } };
    this.zoom = 3;
    this.intersects = true;
    this.intersectsOnly = null;
    this.hasLayer = true;
    this.boundsThrows = false;
    this.mapsCreated = 0;
    this.mapsRemoved = 0;
    this.markers = 0;
  },
}));

// maplibre-gl-leaflet hangs the vector basemap into Leaflet's tile pane. The mock
// only has to be callable and hand back a layer with the three methods the callers
// use, since nothing here renders WebGL.
vi.mock('@maplibre/maplibre-gl-leaflet', () => ({
  maplibreGL: vi.fn(() => {
    // One GL map per layer, kept stable: a fresh object per call would hand the
    // assertions a different spy than the code just used.
    const gl = {
      setStyle: vi.fn(), on: vi.fn(), isStyleLoaded: () => false,
      getStyle: () => ({ layers: [] }), setLayoutProperty: vi.fn(),
    }
    const layer: Record<string, unknown> = { remove: vi.fn(), getMaplibreMap: vi.fn(() => gl) }
    layer.addTo = vi.fn(() => layer)
    return layer
  }),
}));
vi.mock('../../components/Map/engines/maplibre', () => ({ default: {} }));

vi.mock('leaflet', () => {
  // The bounds a country layer reports carry its own code, so the map's bounds can
  // answer `intersects` per country instead of all-or-nothing.
  const makeLayer = (feature?: { properties?: Record<string, unknown> }) => {
    const code = typeof feature?.properties?.ISO_A2 === 'string' ? feature.properties.ISO_A2 : null;
    const handlers: Record<string, (e: unknown) => void> = {};
    const layer = {
      handlers,
      bindTooltip: vi.fn(() => layer),
      on: vi.fn((event: string, cb: (e: unknown) => void) => { handlers[event] = cb; return layer; }),
      setStyle: vi.fn(),
      getBounds: vi.fn(() => {
        if (lf.boundsThrows) throw new Error('no bounds');
        return { isValid: () => true, code };
      }),
    };
    return layer;
  };

  const map = {
    setView: vi.fn(() => map),
    on: vi.fn((event: string, cb: () => void) => { (lf.mapHandlers[event] ||= []).push(cb); return map; }),
    off: vi.fn(() => map),
    remove: vi.fn(() => { lf.mapsRemoved += 1; }),
    fitBounds: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn((layer?: { record?: { attached: boolean } }) => {
      if (layer?.record) layer.record.attached = false;
    }),
    getZoom: vi.fn(() => lf.zoom),
    getCenter: vi.fn(() => ({ lat: 25, lng: 0 })),
    getBounds: vi.fn(() => ({
      intersects: (other?: { code?: string | null }) => (
        lf.intersectsOnly ? !!other?.code && lf.intersectsOnly.includes(other.code) : lf.intersects
      ),
    })),
    hasLayer: vi.fn(() => lf.hasLayer),
    createPane: vi.fn((name: string) => { lf.panes[name] = { style: {} }; }),
    getPane: vi.fn((name: string) => lf.panes[name]),
  };
  // Published so a test can assert the map actually moved (place search flies
  // there before the region lookup returns).
  lf.map = map;

  const L = {
    map: vi.fn(() => { lf.mapsCreated += 1; return map; }),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(), setUrl: vi.fn() })),
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
    canvas: vi.fn(() => ({})),
    svg: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => {
      lf.markers += 1;
      return { bindTooltip: vi.fn(() => ({})) };
    }),
    layerGroup: vi.fn(() => ({ addTo: vi.fn(() => ({})) })),
    geoJSON: vi.fn((data: { features?: Record<string, unknown>[] }, options: Record<string, unknown>) => {
      const record = { data, options, entries: [] as unknown[], styles: [] as unknown[], attached: false };
      const style = options?.style as ((f: unknown) => unknown) | undefined;
      const onEachFeature = options?.onEachFeature as ((f: unknown, l: unknown) => void) | undefined;
      for (const feature of data?.features ?? []) {
        if (style) record.styles.push(style(feature));
        if (onEachFeature) {
          const layer = makeLayer(feature as { properties?: Record<string, unknown> });
          onEachFeature(feature, layer);
          record.entries.push({ feature, layer });
        }
      }
      lf.geoJson.push(record);
      const result = {
        record,
        addTo: vi.fn(() => { record.attached = true; return result; }),
        removeFrom: vi.fn(() => { record.attached = false; }),
        remove: vi.fn(() => { record.attached = false; }),
        clearLayers: vi.fn(),
        resetStyle: vi.fn(),
      };
      return result;
    }),
  };
  return { default: L, ...L };
});

const statsResponse = {
  countries: [
    { code: 'FR', tripCount: 2, placeCount: 5, firstVisit: '2023-01-01', lastVisit: '2024-06-01' },
    { code: 'IT', tripCount: 0, placeCount: 0, firstVisit: null, lastVisit: null },
  ],
  stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 2, totalDays: 14, totalCities: 3 },
  continents: { Europe: 2 },
  lastTrip: null,
  streak: 1,
  tripsThisYear: 1,
};

// FR has already happened, DE is a trip that starts next month, JP has no dates at all.
// totalCountries counts the visited ones only — that split is the whole point of #1048.
const plannedStatsResponse = {
  ...statsResponse,
  countries: [
    { code: 'FR', tripCount: 2, placeCount: 5, firstVisit: '2023-01-01', lastVisit: '2024-06-01', status: 'visited' },
    { code: 'DE', tripCount: 1, placeCount: 0, firstVisit: '2099-05-01', lastVisit: '2099-05-08', status: 'planned' },
    { code: 'JP', tripCount: 1, placeCount: 0, firstVisit: null, lastVisit: null, status: 'idea' },
  ],
  stats: { totalTrips: 3, totalPlaces: 10, totalCountries: 1, totalDays: 14, totalCities: 3, totalCountriesPlanned: 1, totalCountriesIdea: 1 },
  continents: { Europe: 1 },
  continentsPlanned: { Europe: 1, Asia: 1 },
};

const feature = (props: Record<string, unknown>) => ({ type: 'Feature', properties: props, geometry: null });

const geoCountries = {
  type: 'FeatureCollection',
  features: [
    feature({ ISO_A2: 'FR', ADM0_A3: 'FRA', ISO_A3: 'FRA', NAME: 'France', ADMIN: 'France' }),
    feature({ ISO_A2: 'IT', ADM0_A3: 'ITA', ISO_A3: 'ITA', NAME: 'Italy', ADMIN: 'Italy' }),
    feature({ ISO_A2: 'DE', ADM0_A3: 'DEU', ISO_A3: 'DEU', NAME: 'Germany', ADMIN: 'Germany' }),
  ],
};

type Atlas = ReturnType<typeof useAtlas>;

let atlas: Atlas;

function Harness({ withPanel = true }: { withPanel?: boolean }): React.ReactElement {
  atlas = useAtlas();
  if (!withPanel) return <div ref={atlas.mapRef} />;
  return (
    <div>
      <div ref={atlas.mapRef} />
      <div ref={atlas.regionTooltipRef} data-testid="region-tooltip" />
      <div ref={atlas.panelRef} data-testid="panel" />
      <div ref={atlas.glareRef} data-testid="glare" />
      <div ref={atlas.borderGlareRef} data-testid="border-glare" />
    </div>
  );
}

function useAtlasHandlers(over: Partial<Record<string, unknown>> = {}) {
  server.use(
    http.get('/api/addons/atlas/stats', () => HttpResponse.json(over.stats ?? statsResponse)),
    http.get('/api/addons/atlas/bucket-list', () => HttpResponse.json({ items: over.bucket ?? [] })),
    http.get('/api/addons/atlas/regions', () => HttpResponse.json({ regions: over.regions ?? {} })),
    http.get('/api/addons/atlas/countries/geo', () => HttpResponse.json(over.geo ?? { type: 'FeatureCollection', features: [] })),
    http.get('/api/addons/atlas/regions/geo', () => HttpResponse.json(over.regionGeo ?? { features: [] })),
    http.get('/api/atlas-layers', () => HttpResponse.json({ layers: over.layers ?? [] })),
  );
}

/** The country layer is the only GeoJSON drawn without a dedicated pane. */
function countryLayers(): MockGeoJson[] {
  return (lf.geoJson as MockGeoJson[]).filter((g) => g.options.pane === undefined);
}

/** Every region layer ever built, oldest first: one record per rebuild. */
function regionLayers(): MockGeoJson[] {
  return (lf.geoJson as MockGeoJson[]).filter((g) => g.options.pane === 'regionPane');
}

function newestRegionLayer(): MockGeoJson | undefined {
  const layers = regionLayers();
  return layers[layers.length - 1];
}

function regionCodesOf(layer: MockGeoJson | undefined): string[] {
  return (layer?.data.features ?? []).map((f) => (f.properties as Record<string, string>).iso_3166_2);
}

async function mountAtlas(over: Partial<Record<string, unknown>> = {}, props: { withPanel?: boolean } = {}) {
  useAtlasHandlers(over);
  const view = render(<Harness {...props} />);
  await waitFor(() => expect(atlas.loading).toBe(false));
  return view;
}

beforeEach(() => {
  lf.reset();
  resetAllStores();
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.__addToast;
});

describe('useAtlas', () => {
  it('FE-HOOK-ATLAS-001: loads stats, bucket list and visited regions on mount', async () => {
    await mountAtlas({
      bucket: [{ id: 1, name: 'Kyoto', lat: 35, lng: 135, country_code: 'JP', notes: null, target_date: null }],
      regions: { FR: [{ code: 'FR-BRE', name: 'Bretagne', placeCount: 2 }] },
    });

    expect(atlas.stats.totalCountries).toBe(2);
    expect(atlas.countries.map((c) => c.code)).toEqual(['FR', 'IT']);
    expect(atlas.bucketList).toHaveLength(1);
    await waitFor(() => expect(atlas.visitedRegions.FR).toHaveLength(1));
    // A bucket item with coordinates becomes a map marker.
    await waitFor(() => expect(lf.markers).toBe(1));
  });

  it('FE-HOOK-ATLAS-002: a failing stats request still ends the loading state', async () => {
    useAtlasHandlers();
    server.use(http.get('/api/addons/atlas/stats', () => HttpResponse.error()));
    render(<Harness />);

    await waitFor(() => expect(atlas.loading).toBe(false));
    expect(atlas.data).toBeNull();
    expect(atlas.stats).toEqual({ totalTrips: 0, totalPlaces: 0, totalCountries: 0, totalDays: 0 });
  });

  it('FE-HOOK-ATLAS-003: the country GeoJSON augments the alpha-2 to alpha-3 table', async () => {
    await mountAtlas({
      geo: {
        type: 'FeatureCollection',
        features: [
          feature({ ISO_A2: 'ZZ', ADM0_A3: 'ZZZ', NAME: 'Testland' }),
          feature({ ISO_A2: '-99', ADM0_A3: 'FRA', NAME: 'France' }),
          feature({ ISO_A2: 'FR', ADM0_A3: 'XXX', NAME: 'France' }),
        ],
      },
    });

    await waitFor(() => expect(A2_TO_A3.ZZ).toBe('ZZZ'));
    // An existing mapping is never clobbered by a second dataset entry.
    expect(A2_TO_A3.FR).toBe('FRA');
  });

  it('FE-HOOK-ATLAS-004: the country search options dedupe, fall back to alpha-3 and sort by label', async () => {
    await mountAtlas({
      geo: {
        type: 'FeatureCollection',
        features: [
          feature({ ISO_A2: 'IT', ADM0_A3: 'ITA', NAME: 'Italy' }),
          feature({ ISO_A2: '-99', ADM0_A3: 'FRA', NAME: 'France' }),
          feature({ ISO_A2: 'IT', ADM0_A3: 'ITA', NAME: 'Italy again' }),
          feature({ ISO_A2: '-99', ADM0_A3: '-99', NAME: 'Nowhere' }),
          feature({ NAME: 'No codes at all' }),
        ],
      },
    });

    await waitFor(() => expect(atlas.atlas_country_options.length).toBeGreaterThan(0));
    expect(atlas.atlas_country_options.map((o) => o.code)).toEqual(['FR', 'IT']);
    expect(atlas.atlas_country_options.map((o) => o.label)).toEqual(['France', 'Italy']);
  });

  it('FE-HOOK-ATLAS-005: the country name resolver falls back to the raw code', async () => {
    // Intl.DisplayNames missing (older WebViews) — the hook must keep the identity resolver.
    vi.stubGlobal('Intl', new Proxy(Intl, {
      get: (target, prop, receiver) => (prop === 'DisplayNames' ? undefined : Reflect.get(target, prop, receiver)),
    }));
    await mountAtlas();

    expect(atlas.resolveName('FR')).toBe('FR');
  });

  it('FE-HOOK-ATLAS-006: an unresolvable region code resolves to itself', async () => {
    await mountAtlas();
    expect(atlas.resolveName('not-a-region')).toBe('not-a-region');
  });

  it('FE-HOOK-ATLAS-007: the panel glare handlers bail out while the refs are unmounted', async () => {
    await mountAtlas({}, { withPanel: false });

    act(() => {
      atlas.handlePanelMouseMove({ clientX: 10, clientY: 10 } as React.MouseEvent<HTMLDivElement>);
      atlas.handlePanelMouseLeave();
    });

    expect(atlas.loading).toBe(false);
  });

  it('FE-HOOK-ATLAS-007b: the panel glare follows the cursor relative to the panel', async () => {
    const view = await mountAtlas();
    const panel = view.container.querySelector('[data-testid="panel"]') as HTMLElement;
    const glare = view.container.querySelector('[data-testid="glare"]') as HTMLElement;
    const borderGlare = view.container.querySelector('[data-testid="border-glare"]') as HTMLElement;
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 10 } as DOMRect);

    act(() => {
      atlas.handlePanelMouseMove({ clientX: 120, clientY: 60 } as React.MouseEvent<HTMLDivElement>);
    });
    expect(glare.style.opacity).toBe('1');
    expect(glare.style.background).toContain('circle 300px at 100px 50px');
    expect(borderGlare.style.opacity).toBe('1');

    act(() => atlas.handlePanelMouseLeave());
    expect(glare.style.opacity).toBe('0');
    expect(borderGlare.style.opacity).toBe('0');
  });

  describe('confirm actions', () => {
    it('FE-HOOK-ATLAS-008: executing without a pending action does nothing', async () => {
      await mountAtlas();
      await act(async () => { await atlas.executeConfirmAction(); });
      expect(atlas.data?.countries).toHaveLength(2);
    });

    it('FE-HOOK-ATLAS-009: confirming a mark adds the country, its continent and the total', async () => {
      await mountAtlas();
      server.use(http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ ok: true })));

      act(() => atlas.setConfirmAction({ type: 'mark', code: 'DE', name: 'Germany' }));
      await act(async () => { await atlas.executeConfirmAction(); });

      expect(atlas.confirmAction).toBeNull();
      expect(atlas.data?.countries.map((c) => c.code)).toEqual(['FR', 'IT', 'DE']);
      expect(atlas.data?.stats.totalCountries).toBe(3);
      expect(atlas.data?.continents?.Europe).toBe(3);
    });

    it('FE-HOOK-ATLAS-010: marking a country that is already listed leaves the data alone', async () => {
      await mountAtlas();
      server.use(http.post('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ ok: true })));

      act(() => atlas.setConfirmAction({ type: 'mark', code: 'FR', name: 'France' }));
      await act(async () => { await atlas.executeConfirmAction(); });

      expect(atlas.data?.countries).toHaveLength(2);
      expect(atlas.data?.stats.totalCountries).toBe(2);
    });

    it('FE-HOOK-ATLAS-011: confirming an unmark removes the country and its regions', async () => {
      await mountAtlas({ regions: { IT: [{ code: 'IT-62', name: 'Lazio', placeCount: 0 }] } });
      server.use(http.delete('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ ok: true })));
      await waitFor(() => expect(atlas.visitedRegions.IT).toBeDefined());

      act(() => atlas.setConfirmAction({ type: 'unmark', code: 'IT', name: 'Italy' }));
      await act(async () => { await atlas.executeConfirmAction(); });

      expect(atlas.data?.countries.map((c) => c.code)).toEqual(['FR']);
      expect(atlas.data?.stats.totalCountries).toBe(1);
      expect(atlas.visitedRegions.IT).toBeUndefined();
      expect(atlas.selectedCountry).toBeNull();
    });

    it('FE-HOOK-ATLAS-011b: unmarking survives atlas data that never loaded', async () => {
      useAtlasHandlers();
      server.use(
        http.get('/api/addons/atlas/stats', () => HttpResponse.error()),
        http.delete('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ ok: true })),
      );
      render(<Harness />);
      await waitFor(() => expect(atlas.loading).toBe(false));

      act(() => atlas.setConfirmAction({ type: 'unmark', code: 'IT', name: 'Italy' }));
      await act(async () => { await atlas.executeConfirmAction(); });

      expect(atlas.data).toBeNull();
      expect(atlas.confirmAction).toBeNull();
    });

    it('FE-HOOK-ATLAS-012: a country with real places is never unmarked locally', async () => {
      await mountAtlas();
      server.use(http.delete('/api/addons/atlas/country/:code/mark', () => HttpResponse.json({ ok: true })));

      act(() => atlas.setConfirmAction({ type: 'unmark', code: 'FR', name: 'France' }));
      await act(async () => { await atlas.executeConfirmAction(); });

      expect(atlas.data?.countries.map((c) => c.code)).toEqual(['FR', 'IT']);
      expect(atlas.visitedRegions).toEqual({});
    });
  });

  describe('bucket list', () => {
    it('FE-HOOK-ATLAS-013: an empty name is not submitted', async () => {
      await mountAtlas();
      const post = vi.fn();
      server.use(http.post('/api/addons/atlas/bucket-list', () => { post(); return HttpResponse.json({ item: {} }); }));

      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(post).not.toHaveBeenCalled();
      expect(atlas.bucketList).toHaveLength(0);
    });

    it('FE-HOOK-ATLAS-014: notes, coordinates and the picker month become the posted payload', async () => {
      await mountAtlas();
      let body: unknown = null;
      server.use(
        http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ item: { id: 7, name: 'Kyoto', lat: 35, lng: 135, country_code: null, notes: 'onsen', target_date: '2027-04' } });
        }),
      );

      act(() => {
        atlas.setBucketForm({ name: '  Kyoto  ', notes: '  onsen  ', lat: '35', lng: '135', target_date: '' });
        atlas.setBucketPoiMonth(4);
        atlas.setBucketPoiYear(2027);
        atlas.setShowBucketAdd(true);
      });
      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(body).toEqual({ name: 'Kyoto', notes: 'onsen', lat: 35, lng: 135, target_date: '2027-04' });
      expect(atlas.bucketList.map((i) => i.id)).toEqual([7]);
      expect(atlas.bucketForm).toEqual({ name: '', notes: '', lat: '', lng: '', target_date: '' });
      expect(atlas.showBucketAdd).toBe(false);
      expect(atlas.bucketPoiMonth).toBe(0);
    });

    it('FE-HOOK-ATLAS-015: an explicit target date wins over the month picker', async () => {
      await mountAtlas();
      let body: unknown = null;
      server.use(
        http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ item: { id: 8 } });
        }),
      );

      act(() => {
        atlas.setBucketForm({ name: 'Lisbon', notes: '', lat: '', lng: '', target_date: '2030-01' });
        atlas.setBucketPoiMonth(4);
        atlas.setBucketPoiYear(2027);
      });
      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(body).toEqual({ name: 'Lisbon', target_date: '2030-01' });
    });

    it('FE-HOOK-ATLAS-016: a rejected add leaves the form untouched', async () => {
      await mountAtlas();
      server.use(http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));

      act(() => atlas.setBucketForm({ name: 'Lisbon', notes: '', lat: '', lng: '', target_date: '' }));
      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(atlas.bucketList).toHaveLength(0);
      expect(atlas.bucketForm.name).toBe('Lisbon');
    });

    it('FE-HOOK-ATLAS-036: an entry already on the list is not posted again (#1898)', async () => {
      await mountAtlas({ bucket: [{ id: 3, name: 'Kyoto', lat: null, lng: null, country_code: null, notes: null, target_date: null }] });
      const post = vi.fn();
      server.use(http.post('/api/addons/atlas/bucket-list', () => { post(); return HttpResponse.json({ item: { id: 4 } }); }));
      const addToast = vi.fn();
      window.__addToast = addToast as unknown as typeof window.__addToast;

      act(() => atlas.setBucketForm({ name: '  kyoto ', notes: '', lat: '', lng: '', target_date: '' }));
      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(post).not.toHaveBeenCalled();
      expect(atlas.bucketList).toHaveLength(1);
      // The form keeps what was typed so another date can be picked right away.
      expect(atlas.bucketForm.name).toBe('  kyoto ');
      expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);

      // The same place for another date is a different wish and does go out.
      act(() => atlas.setBucketForm({ name: 'Kyoto', notes: '', lat: '', lng: '', target_date: '2027-05' }));
      await act(async () => { await atlas.handleAddBucketItem(); });
      expect(post).toHaveBeenCalledTimes(1);
    });

    it('FE-HOOK-ATLAS-037: a 409 from the server surfaces as a toast instead of silence (#1898)', async () => {
      await mountAtlas();
      server.use(http.post('/api/addons/atlas/bucket-list', () => HttpResponse.json({ error: 'Already on your bucket list' }, { status: 409 })));
      const addToast = vi.fn();
      window.__addToast = addToast as unknown as typeof window.__addToast;

      act(() => atlas.setBucketForm({ name: 'Lisbon', notes: '', lat: '', lng: '', target_date: '' }));
      await act(async () => { await atlas.handleAddBucketItem(); });

      expect(atlas.bucketList).toHaveLength(0);
      expect(atlas.bucketForm.name).toBe('Lisbon');
      expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
    });

    it('FE-HOOK-ATLAS-017: deleting drops the item, a failure keeps it', async () => {
      await mountAtlas({ bucket: [{ id: 3, name: 'Kyoto', lat: null, lng: null, country_code: 'JP', notes: null, target_date: null }] });
      server.use(http.delete('/api/addons/atlas/bucket-list/:id', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));

      await act(async () => { await atlas.handleDeleteBucketItem(3); });
      expect(atlas.bucketList).toHaveLength(1);

      server.use(http.delete('/api/addons/atlas/bucket-list/:id', () => HttpResponse.json({ ok: true })));
      await act(async () => { await atlas.handleDeleteBucketItem(3); });
      expect(atlas.bucketList).toHaveLength(0);
    });

    it('FE-HOOK-ATLAS-018: the POI search skips a blank query, stores results and survives failures', async () => {
      await mountAtlas();
      const search = vi.fn();
      server.use(http.post('/api/maps/search', () => { search(); return HttpResponse.json({ places: [{ name: 'Kyoto', lat: 35, lng: 135 }] }); }));

      await act(async () => { await atlas.handleBucketPoiSearch(); });
      expect(search).not.toHaveBeenCalled();

      act(() => atlas.setBucketSearch('kyoto'));
      await act(async () => { await atlas.handleBucketPoiSearch(); });
      expect(atlas.bucketSearchResults).toHaveLength(1);
      expect(atlas.bucketSearching).toBe(false);

      vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(http.post('/api/maps/search', () => HttpResponse.error()));
      await act(async () => { await atlas.handleBucketPoiSearch(); });
      expect(atlas.bucketSearching).toBe(false);
    });

    it('FE-HOOK-ATLAS-019: picking a POI fills the form and clears the search', async () => {
      await mountAtlas();

      act(() => {
        atlas.setBucketPoiMonth(4);
        atlas.setBucketPoiYear(2027);
        atlas.setBucketSearch('kyoto');
      });
      act(() => atlas.handleSelectBucketPoi({ name: 'Kyoto', lat: 35.1, lng: 135.2 }));

      expect(atlas.bucketForm).toEqual({ name: 'Kyoto', notes: '', lat: '35.1', lng: '135.2', target_date: '2027-04' });
      expect(atlas.bucketSearch).toBe('');
      expect(atlas.bucketSearchResults).toHaveLength(0);

      act(() => atlas.setBucketSearch('fallback'));
      act(() => atlas.handleSelectBucketPoi({}));
      expect(atlas.bucketForm.name).toBe('fallback');
      expect(atlas.bucketForm.lat).toBe('');
    });
  });

  describe('country selection', () => {
    it('FE-HOOK-ATLAS-020: selecting a visited country with data loads its detail', async () => {
      await mountAtlas({ geo: geoCountries });
      server.use(http.get('/api/addons/atlas/country/:code', () => HttpResponse.json({ places: [], trips: [{ id: 1, title: 'Paris' }], manually_marked: false })));
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      await act(async () => { atlas.select_country_from_search('FR'); });

      expect(atlas.atlas_country_search).toBe(atlas.resolveName('FR'));
      expect(atlas.atlas_country_open).toBe(false);
      await waitFor(() => expect(atlas.countryDetail?.trips).toHaveLength(1));
      expect(atlas.selectedCountry).toBe('FR');
    });

    it('FE-HOOK-ATLAS-021: a failing detail request leaves the selection without a detail', async () => {
      await mountAtlas({ geo: geoCountries });
      server.use(http.get('/api/addons/atlas/country/:code', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));

      await act(async () => { await atlas.loadCountryDetail('FR'); });

      expect(atlas.selectedCountry).toBe('FR');
      expect(atlas.countryDetail).toBeNull();
    });

    it('FE-HOOK-ATLAS-022: selecting a visited but empty country offers to remove it', async () => {
      await mountAtlas({ geo: geoCountries });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      await act(async () => { atlas.select_country_from_search('IT'); });

      expect(atlas.confirmAction).toEqual({ type: 'unmark', code: 'IT', name: atlas.resolveName('IT') });
    });

    it('FE-HOOK-ATLAS-023: selecting an unvisited country opens the mark/bucket choice', async () => {
      await mountAtlas({ geo: geoCountries });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      await act(async () => { atlas.select_country_from_search('DE'); });

      expect(atlas.confirmAction).toEqual({ type: 'choose', code: 'DE', name: atlas.resolveName('DE') });
    });

    it('FE-HOOK-ATLAS-024: a layer without usable bounds does not break the fly-to', async () => {
      await mountAtlas({ geo: geoCountries });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      lf.boundsThrows = true;

      await act(async () => { atlas.select_country_from_search('DE'); });

      expect(atlas.confirmAction?.code).toBe('DE');
    });
  });

  describe('map layers', () => {
    it('FE-HOOK-ATLAS-025: country layers bind hover styling and the unmark click', async () => {
      await mountAtlas({ geo: geoCountries });
      await waitFor(() => expect(lf.geoJson.length).toBeGreaterThan(0));

      const countryLayer = lf.geoJson[0] as MockGeoJson;
      const it = countryLayer.entries.find((e) => (e.feature.properties as Record<string, string>).ISO_A2 === 'IT');
      const de = countryLayer.entries.find((e) => (e.feature.properties as Record<string, string>).ISO_A2 === 'DE');

      // Visited countries get a colour fill, unvisited ones the neutral one.
      expect((countryLayer.styles[0] as { fillOpacity: number }).fillOpacity).toBe(0.7);
      expect((countryLayer.styles[2] as { fillOpacity: number }).fillOpacity).toBe(0.3);

      act(() => it!.layer.handlers.mouseover({ target: it!.layer }));
      expect(it!.layer.setStyle).toHaveBeenCalledWith(expect.objectContaining({ fillOpacity: 0.9 }));
      act(() => it!.layer.handlers.mouseout({ target: it!.layer }));

      // IT has no trips and no places, so a click offers to remove it again.
      act(() => it!.layer.handlers.click({}));
      expect(atlas.confirmAction).toEqual({ type: 'unmark', code: 'IT', name: atlas.resolveName('IT') });

      act(() => de!.layer.handlers.mouseover({ target: de!.layer }));
      expect(de!.layer.setStyle).toHaveBeenCalledWith(expect.objectContaining({ fillOpacity: 0.5 }));
      act(() => de!.layer.handlers.mouseout({ target: de!.layer }));
      act(() => de!.layer.handlers.click({}));
      expect(atlas.confirmAction).toEqual({ type: 'choose', code: 'DE', name: 'Germany' });
    });

    it('FE-HOOK-ATLAS-025b: an unvisited country is named by the locale resolver, not the English GeoJSON name (#1789)', async () => {
      // GeoJSON only carries English names; marking an unvisited country must still use the
      // account-language name, exactly as visited countries do.
      await mountAtlas({
        geo: {
          type: 'FeatureCollection',
          features: [
            feature({ ISO_A2: 'FR', ADM0_A3: 'FRA', ISO_A3: 'FRA', NAME: 'France', ADMIN: 'France' }),
            feature({ ISO_A2: 'DE', ADM0_A3: 'DEU', ISO_A3: 'DEU', NAME: 'GERMANY_EN_ONLY', ADMIN: 'GERMANY_EN_ONLY' }),
          ],
        },
      });
      await waitFor(() => expect(lf.geoJson.length).toBeGreaterThan(0));

      const countryLayer = lf.geoJson[0] as MockGeoJson;
      const de = countryLayer.entries.find((e) => (e.feature.properties as Record<string, string>).ISO_A2 === 'DE');

      act(() => de!.layer.handlers.click({}));
      expect(atlas.confirmAction).toEqual({ type: 'choose', code: 'DE', name: atlas.resolveName('DE') });
      expect(atlas.confirmAction?.name).not.toBe('GERMANY_EN_ONLY');
    });

    it('FE-HOOK-ATLAS-026: plugin tint layers are drawn in their own pane and redrawn on theme change', async () => {
      await mountAtlas({
        geo: geoCountries,
        layers: [{ pluginId: 'p1', id: 'l1', countries: [{ code: 'FR', tone: 'success' }, { code: 'DE', tone: 'default' }] }],
      });

      const tint = await waitFor(() => {
        const hit = (lf.geoJson as MockGeoJson[]).find((g) => g.options.pane === 'atlasPluginPane');
        expect(hit).toBeTruthy();
        return hit as MockGeoJson;
      });
      expect(tint.data.features).toHaveLength(2);
      expect(lf.panes.atlasPluginPane.style.pointerEvents).toBe('none');

      const style = tint.options.style as (f: unknown) => { fillColor: string };
      expect(style(feature({ ADM0_A3: 'FRA' })).fillColor).toBe('#10b981');
      expect(style(feature({ ADM0_A3: 'DEU' })).fillColor).toBe('#4F46E5');

      const before = lf.geoJson.length;
      act(() => { seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: true }) }); });
      await waitFor(() => expect(lf.geoJson.length).toBeGreaterThan(before));
      expect(lf.mapsRemoved).toBeGreaterThan(0);
    });

    it('FE-HOOK-ATLAS-043: the basemap is a single label-free vector layer and the map is still built once', async () => {
      // Sliced from here: the mock results carry over from earlier tests.
      const madeBefore = vi.mocked(maplibreGL).mock.results.length;
      await mountAtlas({ geo: geoCountries });
      await waitFor(() => expect(lf.geoJson.length).toBeGreaterThan(0));

      // One basemap layer, not two: the second raster layer only warmed the cache
      // of neighbouring zoom levels, which a vector basemap does not need.
      const layers = await waitFor(() => {
        const made = vi.mocked(maplibreGL).mock.results.slice(madeBefore);
        expect(made.length).toBe(1);
        return made.map((r) => r.value as { getMaplibreMap: () => { setStyle: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> } });
      });
      // It is a vector style, and it is the label-free variant the country fills
      // need: OpenFreeMap has no nolabels style, so the symbol layers are switched
      // off on the live map instead, re-armed on every style.load.
      const calls = vi.mocked(maplibreGL).mock.calls;
      const call = calls[calls.length - 1]?.[0] as { style: string };
      expect(call.style).toContain('openfreemap.org');
      expect(layers[0].getMaplibreMap().on).toHaveBeenCalledWith('style.load', expect.any(Function));

      // And the map is still built once with its country layer on it: the basemap
      // swap must not reintroduce the teardown #2097 removed.
      expect(lf.mapsCreated).toBe(1);
      expect(lf.mapsRemoved).toBe(0);
      expect(lf.geoJson.length).toBeGreaterThan(0);
    });

    it('FE-HOOK-ATLAS-027: a plugin layer naming no country in the map draws nothing', async () => {
      await mountAtlas({
        geo: geoCountries,
        layers: [{ pluginId: 'p1', id: 'l1', countries: [{ code: 'JP', tone: 'warn' }] }],
      });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      expect((lf.geoJson as MockGeoJson[]).some((g) => g.options.pane === 'atlasPluginPane')).toBe(false);
    });

    it('FE-HOOK-ATLAS-028: a failing plugin request simply leaves the map untinted', async () => {
      useAtlasHandlers({ geo: geoCountries });
      server.use(http.get('/api/atlas-layers', () => HttpResponse.error()));
      render(<Harness />);
      await waitFor(() => expect(atlas.loading).toBe(false));
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      expect((lf.geoJson as MockGeoJson[]).some((g) => g.options.pane === 'atlasPluginPane')).toBe(false);
    });

    it('FE-HOOK-ATLAS-029: zooming in loads the regions in view and zooming out hides the layer', async () => {
      const regionGeo = {
        type: 'FeatureCollection',
        features: [
          feature({ iso_a2: 'fr', iso_3166_2: 'FR-BRE', name: 'Bretagne', name_en: 'Brittany', admin: 'France' }),
          feature({ iso_a2: 'fr', iso_3166_2: 'FR-IDF', name: 'Île-de-France', name_en: 'Ile-de-France', admin: 'France' }),
        ],
      };
      await mountAtlas({
        geo: geoCountries,
        regions: { FR: [{ code: 'FR-BRE', name: 'Bretagne', placeCount: 3 }] },
        regionGeo,
      });
      await waitFor(() => expect(atlas.visitedRegions.FR).toHaveLength(1));

      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));
      lf.zoom = 6;
      lf.hasLayer = false;
      act(() => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });
      expect(lf.panes.overlayPane.style.opacity).toBe('0.35');

      const regionLayer = await waitFor(() => {
        const hit = (lf.geoJson as MockGeoJson[]).find((g) => g.options.pane === 'regionPane');
        expect(hit).toBeTruthy();
        return hit as MockGeoJson;
      });

      const style = regionLayer.options.style as (f: unknown) => { fillOpacity: number };
      expect(style(regionGeo.features[0]).fillOpacity).toBe(0.85);
      expect(style(regionGeo.features[1]).fillOpacity).toBe(0.03);

      const [visited, unvisited] = regionLayer.entries;
      act(() => visited.layer.handlers.mouseover({ target: visited.layer, originalEvent: { clientX: 40, clientY: 80 } }));
      act(() => visited.layer.handlers.mousemove({ originalEvent: { clientX: 42, clientY: 82 } }));
      act(() => visited.layer.handlers.mouseout({ target: visited.layer }));

      act(() => visited.layer.handlers.click({}));
      expect(atlas.confirmAction).toEqual({
        type: 'unmark-region', code: 'FR', name: 'Bretagne', regionCode: 'FR-BRE', countryName: 'France',
      });

      act(() => unvisited.layer.handlers.mouseover({ target: unvisited.layer, originalEvent: { clientX: 10, clientY: 20 } }));
      act(() => unvisited.layer.handlers.click({}));
      expect(atlas.confirmAction).toEqual({
        type: 'choose-region', code: 'FR', name: 'Île-de-France', regionCode: 'FR-IDF', countryName: 'France',
      });

      // Zooming again re-attaches the existing layer and skips the cached countries.
      const drawn = lf.geoJson.length;
      act(() => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });
      expect(lf.geoJson.length).toBe(drawn);

      // Zooming back out removes the region layer from the map again.
      lf.zoom = 4;
      lf.hasLayer = true;
      act(() => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });
      expect(lf.panes.overlayPane.style.opacity).toBe('1');
    });

    it('FE-HOOK-ATLAS-029b: regions match by english name and countries without visits stay unvisited', async () => {
      const regionGeo = {
        type: 'FeatureCollection',
        features: [
          feature({ iso_a2: 'fr', iso_3166_2: 'FR-BRE', name: 'Bretagne', name_en: 'Brittany', admin: 'France' }),
          feature({ iso_a2: 'it', iso_3166_2: 'IT-62', name: 'Lazio', name_en: 'Latium', admin: 'Italy' }),
        ],
      };
      await mountAtlas({
        geo: geoCountries,
        // The cached region name only matches the bundle's english name.
        regions: { FR: [{ code: 'FR-UNKNOWN', name: 'Brittany', placeCount: 1 }] },
        regionGeo,
      });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      lf.zoom = 6;
      act(() => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });

      const regionLayer = await waitFor(() => {
        const hit = (lf.geoJson as MockGeoJson[]).find((g) => g.options.pane === 'regionPane');
        expect(hit).toBeTruthy();
        return hit as MockGeoJson;
      });
      const style = regionLayer.options.style as (f: unknown) => { fillOpacity: number };
      expect(style(regionGeo.features[0]).fillOpacity).toBe(0.85);
      // Italy has no visited regions at all, so its feature stays an outline.
      expect(style(regionGeo.features[1]).fillOpacity).toBe(0.03);
    });

    it('FE-HOOK-ATLAS-029c: a region response without features is ignored', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: {} });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      lf.zoom = 6;
      await act(async () => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });

      expect((lf.geoJson as MockGeoJson[]).some((g) => g.options.pane === 'regionPane')).toBe(false);
    });

    it('FE-HOOK-ATLAS-030: panning at low zoom does not refetch regions', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: { features: [] } });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      lf.zoom = 4;
      act(() => { lf.mapHandlers.moveend?.forEach((cb) => cb()); });
      lf.zoom = 6;
      lf.intersects = false;
      act(() => { lf.mapHandlers.moveend?.forEach((cb) => cb()); });

      expect((lf.geoJson as MockGeoJson[]).some((g) => g.options.pane === 'regionPane')).toBe(false);
    });

    // ── The region layer used to keep every country it had ever seen and rebuild all of
    // it, with a fresh renderer each time (#1950) ────────────────────────────────────
    const twoRegions = {
      type: 'FeatureCollection',
      features: [
        feature({ iso_a2: 'fr', iso_3166_2: 'FR-BRE', name: 'Bretagne', name_en: 'Brittany', admin: 'France' }),
        feature({ iso_a2: 'it', iso_3166_2: 'IT-62', name: 'Lazio', name_en: 'Latium', admin: 'Italy' }),
      ],
    };

    /** Zoom in far enough for regions, over the given countries. */
    const zoomTo = async (...codes: string[]) => {
      lf.zoom = 6;
      lf.intersectsOnly = codes;
      await act(async () => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });
    };

    const panTo = async (...codes: string[]) => {
      lf.intersectsOnly = codes;
      await act(async () => { lf.mapHandlers.moveend?.forEach((cb) => cb()); });
    };

    it('FE-HOOK-ATLAS-038: a map builds one canvas and one svg renderer for its whole life (#1950)', async () => {
      // Leaflet keeps a renderer as a layer of its own and leaves its container in the
      // pane when the GeoJSON layer goes, so one per redraw piles up orphaned canvases
      // that keep updating on every pan.
      const canvasBefore = vi.mocked(L.canvas).mock.calls.length;
      const svgBefore = vi.mocked(L.svg).mock.calls.length;
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      await zoomTo('FR');
      await waitFor(() => expect(regionLayers().length).toBe(1));
      // A second country lands, then the planned toggle repaints both layers.
      await panTo('FR', 'IT');
      await waitFor(() => expect(regionLayers().length).toBe(2));
      act(() => atlas.togglePlanned());
      await waitFor(() => expect(regionLayers().length).toBe(3));

      expect(lf.mapsCreated).toBe(1);
      expect(vi.mocked(L.canvas).mock.calls.length).toBe(canvasBefore + 1);
      expect(vi.mocked(L.svg).mock.calls.length).toBe(svgBefore + 1);
    });

    it('FE-HOOK-ATLAS-039: only the countries in view contribute features (#1950)', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      await zoomTo('FR', 'IT');
      await waitFor(() => expect(regionCodesOf(newestRegionLayer())).toEqual(['FR-BRE', 'IT-62']));

      // Panning off Italy leaves it in the cache but takes it out of the layer.
      await panTo('FR');
      expect(regionCodesOf(newestRegionLayer())).toEqual(['FR-BRE']);

      // Coming back draws it again straight from the cache.
      await panTo('FR', 'IT');
      expect(regionCodesOf(newestRegionLayer())).toEqual(['FR-BRE', 'IT-62']);
    });

    it('FE-HOOK-ATLAS-040: panning inside the same countries rebuilds nothing (#1950)', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      await zoomTo('FR', 'IT');
      await waitFor(() => expect(regionLayers().length).toBe(1));

      await panTo('FR', 'IT');
      expect(regionLayers().length).toBe(1);

      // Losing France from the view is a change, so that one does redraw.
      await panTo('IT');
      expect(regionLayers().length).toBe(2);
      expect(regionCodesOf(newestRegionLayer())).toEqual(['IT-62']);
    });

    it('FE-HOOK-ATLAS-041: the cache stops at a dozen countries and reloads what fell out (#1950)', async () => {
      // Fourteen countries seen one at a time: the oldest two are gone by the end, so
      // coming back to the first one has to ask the server again.
      const seen = ['FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ', 'SE', 'NO', 'DK', 'FI'];
      const geo = {
        type: 'FeatureCollection',
        // Deliberately the other way round from the visiting order: with both the same,
        // dropping the country from the front of the dataset and dropping the one seen
        // longest ago pick the same victim, and nothing below tells them apart.
        features: [...seen].reverse().map((a2) => feature({ ISO_A2: a2, ADM0_A3: A2_TO_A3[a2], ISO_A3: A2_TO_A3[a2], NAME: a2, ADMIN: a2 })),
      };
      const regionGeo = {
        type: 'FeatureCollection',
        features: seen.map((a2) => feature({ iso_a2: a2.toLowerCase(), iso_3166_2: `${a2}-01`, name: `${a2} region`, admin: a2 })),
      };
      await mountAtlas({ geo, regionGeo });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(seen.length));

      const requested: string[] = [];
      server.use(http.get('/api/addons/atlas/regions/geo', ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('countries') ?? '');
        return HttpResponse.json(regionGeo);
      }));

      lf.zoom = 6;
      for (let i = 0; i < seen.length; i++) {
        await panTo(seen[i]);
        await waitFor(() => expect(requested).toHaveLength(i + 1));
      }
      expect(requested).toEqual(seen);

      await panTo('FR');
      await waitFor(() => expect(requested).toHaveLength(seen.length + 1));
      expect(requested[requested.length - 1]).toBe('FR');

      // The country the view sat on longest is still cached, so it costs nothing.
      await panTo('FI');
      expect(regionCodesOf(newestRegionLayer())).toEqual(['FI-01']);
      expect(requested).toHaveLength(seen.length + 1);

      // And the two the view left just before that are still there as well. They sit at
      // the front of the dataset, which is the whole difference between dropping by
      // position and dropping by how long ago the country was last on screen.
      await panTo('DK');
      await panTo('NO');
      expect(requested).toHaveLength(seen.length + 1);
    });

    it('FE-HOOK-ATLAS-042: a theme change and the planned toggle still restyle the regions (#1950)', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      await zoomTo('FR');
      await waitFor(() => expect(regionLayers().length).toBe(1));

      const unvisitedFill = (layer: MockGeoJson) =>
        (layer.options.style as (f: unknown) => { fillColor: string })(twoRegions.features[0]).fillColor;
      expect(unvisitedFill(newestRegionLayer()!)).toBe('#000000');

      act(() => atlas.togglePlanned());
      await waitFor(() => expect(regionLayers().length).toBe(2));

      // Dark mode rebuilds the map itself, so the layer has to come back dark-styled
      // even though the countries in view never changed.
      act(() => { seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: true }) }); });
      await waitFor(() => expect(regionLayers().length).toBe(3));
      expect(unvisitedFill(newestRegionLayer()!)).toBe('#ffffff');
    });

    it('FE-HOOK-ATLAS-043: flying to a country from the search draws its regions (#1950)', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(atlas.atlas_country_options.length).toBe(3));

      // fitBounds puts the view on Italy alone; the zoomend that follows must not cull it.
      await act(async () => { atlas.select_country_from_search('IT'); });
      await zoomTo('IT');

      await waitFor(() => expect(regionCodesOf(newestRegionLayer())).toEqual(['IT-62']));
    });

    it('FE-HOOK-ATLAS-044: zooming out to 5 keeps the drawn regions on the map (#1950)', async () => {
      await mountAtlas({ geo: geoCountries, regionGeo: twoRegions });
      await waitFor(() => expect(lf.mapHandlers.zoomend?.length).toBeGreaterThan(0));

      // Both countries land in the cache, then the view narrows to France alone.
      await zoomTo('FR', 'IT');
      await waitFor(() => expect(regionLayers().length).toBe(1));
      await panTo('FR');
      await waitFor(() => expect(regionCodesOf(newestRegionLayer())).toEqual(['FR-BRE']));
      const shown = newestRegionLayer()!;
      expect(shown.attached).toBe(true);

      // One step out. Regions still show at zoom 5 and the country layer stops taking
      // clicks there, so the region layer is the only way to mark anything. The wider view
      // pulls Italy back in, which is exactly the change that asks for a rebuild, and the
      // map only accepts a rebuilt layer from zoom 6, so it must not happen here.
      lf.zoom = 5;
      lf.intersectsOnly = ['FR', 'IT'];
      await act(async () => { lf.mapHandlers.zoomend?.forEach((cb) => cb()); });
      await act(async () => { lf.mapHandlers.moveend?.forEach((cb) => cb()); });

      expect(lf.panes.overlayPane.style.pointerEvents).toBe('none');
      expect(shown.attached).toBe(true);
      expect(newestRegionLayer()).toBe(shown);
    });
  });

  describe('planned countries (#1048)', () => {
    it('FE-HOOK-ATLAS-031: the planned layer starts off and only lists the visited countries', async () => {
      await mountAtlas({ stats: plannedStatsResponse });

      expect(atlas.showPlanned).toBe(false);
      expect(atlas.visitedCountries.map((c) => c.code)).toEqual(['FR']);
      expect(atlas.visibleCountries.map((c) => c.code)).toEqual(['FR']);
      // countries stays the raw server list — the map picks from visibleCountries.
      expect(atlas.countries.map((c) => c.code)).toEqual(['FR', 'DE', 'JP']);
    });

    it('FE-HOOK-ATLAS-032: a stored preference brings the planned countries back on mount', async () => {
      localStorage.setItem('trek_atlas_show_planned', '1');
      await mountAtlas({ stats: plannedStatsResponse });

      expect(atlas.showPlanned).toBe(true);
      expect(atlas.visibleCountries.map((c) => c.code)).toEqual(['FR', 'DE', 'JP']);
      expect(atlas.visitedCountries.map((c) => c.code)).toEqual(['FR']);
    });

    it('FE-HOOK-ATLAS-032b: any other stored value keeps the layer off', async () => {
      localStorage.setItem('trek_atlas_show_planned', '0');
      await mountAtlas({ stats: plannedStatsResponse });

      expect(atlas.showPlanned).toBe(false);
    });

    it('FE-HOOK-ATLAS-033: toggling reveals the planned countries and remembers the choice', async () => {
      await mountAtlas({ stats: plannedStatsResponse });

      act(() => atlas.togglePlanned());
      expect(atlas.showPlanned).toBe(true);
      expect(atlas.visibleCountries.map((c) => c.code)).toEqual(['FR', 'DE', 'JP']);
      expect(localStorage.getItem('trek_atlas_show_planned')).toBe('1');

      act(() => atlas.togglePlanned());
      expect(atlas.showPlanned).toBe(false);
      expect(atlas.visibleCountries.map((c) => c.code)).toEqual(['FR']);
      expect(localStorage.getItem('trek_atlas_show_planned')).toBe('0');
    });

    it('FE-HOOK-ATLAS-034: a storage that refuses reads and writes still leaves a working toggle', async () => {
      // Safari private mode: localStorage exists but throws. The toggle must not take
      // the atlas down with it — it just forgets the choice between reloads.
      const realGet = Storage.prototype.getItem;
      const realSet = Storage.prototype.setItem;
      const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
        if (key === 'trek_atlas_show_planned') throw new DOMException('denied', 'SecurityError');
        return realGet.call(this, key);
      });
      const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        if (key === 'trek_atlas_show_planned') throw new DOMException('denied', 'SecurityError');
        realSet.call(this, key, value);
      });

      try {
        await mountAtlas({ stats: plannedStatsResponse });
        expect(atlas.showPlanned).toBe(false);

        act(() => atlas.togglePlanned());

        expect(atlas.showPlanned).toBe(true);
        expect(atlas.visibleCountries.map((c) => c.code)).toEqual(['FR', 'DE', 'JP']);
      } finally {
        getSpy.mockRestore();
        setSpy.mockRestore();
      }
    });

    it('FE-HOOK-ATLAS-035: planned countries are painted dashed and never eat a visited colour', async () => {
      await mountAtlas({ stats: plannedStatsResponse, geo: geoCountries });
      await waitFor(() => expect(countryLayers().length).toBeGreaterThan(0));
      const before = countryLayers().length;

      const styleOn = (layer: MockGeoJson, a2: string) => {
        const i = (layer.data.features ?? []).findIndex(
          (f) => (f.properties as Record<string, string>).ISO_A2 === a2,
        );
        return layer.styles[i] as { fillOpacity: number; dashArray?: string; fillColor: string };
      };
      const newestLayer = () => {
        const layers = countryLayers();
        return layers[layers.length - 1];
      };
      const frBeforeToggle = styleOn(newestLayer(), 'FR').fillColor;

      act(() => atlas.togglePlanned());
      await waitFor(() => expect(countryLayers().length).toBeGreaterThan(before));

      const styleFor = (a2: string) => styleOn(newestLayer(), a2);

      expect(styleFor('FR').dashArray).toBeUndefined();
      expect(styleFor('DE').dashArray).toBe('6 4');
      // Colours are hashed from the country code, so France keeps the same colour
      // whether or not the planned layer is on, and a planned country never takes it.
      expect(styleFor('FR').fillColor).toBe(frBeforeToggle);
      expect(styleFor('DE').fillColor).not.toBe(styleFor('FR').fillColor);
    });
  });
  // ── Place search (#1115) ───────────────────────────────────────────────────
  describe('searching for a place, not just a country', () => {
    const milan = { name: 'Milan', address: 'Milan, Lombardy, Italy', lat: 45.46, lng: 9.19 };

    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    const typeAndSettle = async (query: string) => {
      act(() => atlas.search_places(query));
      await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    };

    it('FE-HOOK-ATLAS-051: geocodes the term and offers the hits', async () => {
      await mountAtlas();
      server.use(http.post('/api/maps/search', () => HttpResponse.json({ places: [milan], source: 'osm' })));

      await typeAndSettle('milan');
      await waitFor(() => expect(atlas.atlas_place_results).toHaveLength(1));
      expect(atlas.atlas_place_results[0]).toMatchObject({ name: 'Milan', lat: 45.46, lng: 9.19 });
    });

    it('FE-HOOK-ATLAS-052: leaves the network alone for a query too short to mean anything', async () => {
      await mountAtlas();
      const hit = vi.fn(() => HttpResponse.json({ places: [milan], source: 'osm' }));
      server.use(http.post('/api/maps/search', hit));

      await typeAndSettle('mi');
      expect(hit).not.toHaveBeenCalled();
      expect(atlas.atlas_place_results).toEqual([]);
    });

    it('FE-HOOK-ATLAS-053: drops a provider hit without usable coordinates', async () => {
      await mountAtlas();
      server.use(http.post('/api/maps/search', () => HttpResponse.json({
        places: [{ name: 'No coords' }, milan],
        source: 'osm',
      })));

      await typeAndSettle('milan');
      await waitFor(() => expect(atlas.atlas_place_results).toHaveLength(1));
      expect(atlas.atlas_place_results[0].name).toBe('Milan');
    });

    it('FE-HOOK-ATLAS-054: picking a place resolves its region and offers to mark it', async () => {
      await mountAtlas();
      server.use(
        http.post('/api/maps/search', () => HttpResponse.json({ places: [milan], source: 'osm' })),
        http.get('/api/addons/atlas/locate', () => HttpResponse.json({ country_code: 'IT', region_code: 'IT-25', region_name: 'Lombardia' })),
      );

      await act(async () => { await atlas.select_place_from_search(milan); });

      expect(atlas.confirmAction).toMatchObject({ type: 'choose-region', code: 'IT', regionCode: 'IT-25', name: 'Lombardia' });
      // The map went there rather than waiting for the lookup.
      expect(lf.map!.setView).toHaveBeenCalledWith([45.46, 9.19], 7, expect.anything());
    });

    it('FE-HOOK-ATLAS-055: a region already visited offers removal instead', async () => {
      await mountAtlas({ regions: { IT: [{ code: 'IT-25', name: 'Lombardia', placeCount: 1 }] } });
      await waitFor(() => expect(atlas.visitedRegions.IT).toHaveLength(1));
      server.use(http.get('/api/addons/atlas/locate', () => HttpResponse.json({ country_code: 'IT', region_code: 'IT-25', region_name: 'Lombardia' })));

      await act(async () => { await atlas.select_place_from_search(milan); });
      expect(atlas.confirmAction).toMatchObject({ type: 'unmark-region', regionCode: 'IT-25' });
    });

    it('FE-HOOK-ATLAS-056: a country without region coverage falls back to the country flow', async () => {
      await mountAtlas();
      server.use(http.get('/api/addons/atlas/locate', () => HttpResponse.json({ country_code: 'FR', region_code: null, region_name: null })));

      await act(async () => { await atlas.select_place_from_search({ ...milan, name: 'Somewhere' }); });
      // FR is in the fixture as visited with places, so the country flow opens its detail
      // rather than the mark dialog — either way, not a region dialog.
      expect(atlas.confirmAction?.type).not.toBe('choose-region');
    });
  });
});
