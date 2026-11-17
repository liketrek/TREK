/**
 * The trip map offline (FE-COMP-MAPAUTO-OFFLINE-*).
 *
 * Whatever basemap the user picked, offline the map never goes grey: a basemap
 * with nothing stored switches to the stored OpenFreeMap one, with the same
 * markers and routes, and says so.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { OFM_DARK, OFM_POSITRON } from '../../constants/mapDefaults';
import { useSettingsStore } from '../../store/settingsStore';
import { resetWebGLProbe } from '../../utils/webgl';
import { MapViewAuto } from './MapViewAuto';

const env = vi.hoisted(() => ({ offline: false, dark: false, tileStore: false }));
const seen = vi.hoisted(() => ({
  leaflet: null as null | { tileUrl?: string },
  gl: null as null | { engine: string; glProvider?: string; styleOverride?: string },
}));

vi.mock('./MapView', () => ({
  MapView: (props: { tileUrl?: string }) => {
    seen.leaflet = props;
    return <div data-testid="leaflet-map" />;
  },
}));
vi.mock('./glLazy', () => ({
  MapViewGLMaplibre: (props: { glProvider?: string; styleOverride?: string }) => {
    seen.gl = { engine: 'maplibre', ...props };
    return <div data-testid="gl-map" />;
  },
  MapViewGLMapbox: (props: { glProvider?: string; styleOverride?: string }) => {
    seen.gl = { engine: 'mapbox', ...props };
    return <div data-testid="gl-map" />;
  },
}));
vi.mock('./useRoadtripHazards', () => ({ useRoadtripHazards: () => ({ feed: null }) }));
vi.mock('../../hooks/useNetworkMode', () => ({
  useNetworkMode: () => ({ offline: env.offline, forced: false, setForced: () => {} }),
}));
vi.mock('../../hooks/useIsDark', () => ({ useIsDark: () => env.dark }));
vi.mock('../../native/tileCache', () => ({
  tileCacheActive: () => env.tileStore,
  glTileStoreActive: () => env.tileStore,
}));
vi.mock('../../native/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../native/platform')>()),
  isNativeIos: () => false,
}));

const realGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  resetAllStores();
  resetWebGLProbe();
  env.offline = false;
  env.dark = false;
  env.tileStore = false;
  seen.leaflet = null;
  seen.gl = null;
  const ctx = { getExtension: () => ({ loseContext: () => {} }) };
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) =>
    type === 'webgl2' ? ctx : null
  ) as unknown as typeof realGetContext;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  resetWebGLProbe();
});

const pill = () => screen.queryByRole('status');

describe('MapViewAuto offline', () => {
  it('FE-COMP-MAPAUTO-OFFLINE-001: a Mapbox map online stays Mapbox, with no pill', async () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'mapbox-gl', mapbox_access_token: 'pk.test' } });

    render(<MapViewAuto places={[]} />);

    await screen.findByTestId('gl-map');
    expect(seen.gl).toMatchObject({ engine: 'mapbox', glProvider: 'mapbox-gl', styleOverride: undefined });
    expect(pill()).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-002: offline, a Mapbox map draws the stored basemap with MapLibre and says so', async () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'mapbox-gl', mapbox_access_token: 'pk.test' } });
    env.offline = true;
    env.dark = true;

    render(<MapViewAuto places={[]} />);

    await screen.findByTestId('gl-map');
    expect(seen.gl).toMatchObject({ engine: 'maplibre', glProvider: 'maplibre-gl', styleOverride: OFM_DARK });
    expect(pill()).toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-003: a MapLibre map already on a stored style stays as it is', async () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'maplibre-gl', maplibre_style: OFM_POSITRON } });
    env.offline = true;

    render(<MapViewAuto places={[]} />);

    await screen.findByTestId('gl-map');
    expect(seen.gl?.styleOverride).toBeUndefined();
    expect(pill()).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-004: offline, Leaflet on OpenStreetMap tiles switches to the stored basemap', () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'leaflet' } });
    env.offline = true;

    render(<MapViewAuto places={[]} tileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />);

    expect(seen.leaflet?.tileUrl).toBe(OFM_POSITRON);
    expect(pill()).toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-005: offline, a raster template the service worker stored stays', () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'leaflet' } });
    env.offline = true;

    render(<MapViewAuto places={[]} tileUrl="https://tiles.example.com/{z}/{x}/{y}.png" />);

    expect(seen.leaflet?.tileUrl).toBe('https://tiles.example.com/{z}/{x}/{y}.png');
    expect(pill()).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-006: in the iOS app with its tile store, Mapbox stays offline and the pill switches to the stored map', async () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'mapbox-gl', mapbox_access_token: 'pk.test' } });
    env.offline = true;
    env.tileStore = true;

    render(<MapViewAuto places={[]} />);

    await screen.findByTestId('gl-map');
    expect(seen.gl).toMatchObject({ engine: 'mapbox', styleOverride: undefined });
    const toggle = screen.getByRole('button', { pressed: false });
    fireEvent.click(toggle);
    await screen.findByTestId('gl-map');
    expect(seen.gl).toMatchObject({ engine: 'maplibre', styleOverride: OFM_POSITRON });
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-OFFLINE-007: with the tile store, a raster template stays offline in the app too', () => {
    seedStore(useSettingsStore, { settings: { map_provider: 'leaflet' } });
    env.offline = true;
    env.tileStore = true;

    render(<MapViewAuto places={[]} tileUrl="https://tiles.example.com/{z}/{x}/{y}.png" />);

    expect(seen.leaflet?.tileUrl).toBe('https://tiles.example.com/{z}/{x}/{y}.png');
  });
});
