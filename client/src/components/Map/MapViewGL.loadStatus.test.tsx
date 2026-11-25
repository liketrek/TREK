import { act, fireEvent, within } from '@testing-library/react';
import * as maplibregl from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import type { GeoPosition, TrackingMode } from '../../hooks/useGeolocation';
import { useSettingsStore } from '../../store/settingsStore';
import { MapLoadStatusProvider } from './MapLoadStatus';

// The map-load status cases of MapViewGL, with the same map doubles as MapViewGL.test.tsx.

// Stable fake map so fitBounds call counts survive re-renders. The canvas
// container is a single element so listeners registered by the component are
// reachable from tests via dispatchEvent.
const glCanvasContainer = vi.hoisted(() => document.createElement('div'));
const glMap = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  loaded: vi.fn().mockReturnValue(true),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  jumpTo: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  remove: vi.fn(),
  addSource: vi.fn(),
  getSource: vi.fn().mockReturnValue(null),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  setLayoutProperty: vi.fn(),
  getStyle: vi.fn().mockReturnValue({ layers: [] }),
  isStyleLoaded: vi.fn().mockReturnValue(true),
  getCanvasContainer: vi.fn(() => glCanvasContainer),
  getLayer: vi.fn().mockReturnValue(null),
  queryRenderedFeatures: vi.fn().mockReturnValue([]),
  querySourceFeatures: vi.fn().mockReturnValue([]),
  unproject: vi.fn(() => ({ lng: 2.3522, lat: 48.8566 })),
  project: vi.fn((lngLat: [number, number]) => ({ x: lngLat[0] * 10, y: lngLat[1] * 10 })),
  getBounds: vi.fn(() => ({ getSouth: () => 0, getWest: () => 0, getNorth: () => 1, getEast: () => 1 })),
  easeTo: vi.fn(),
  getCanvas: vi.fn(() => document.createElement('canvas')),
  getBearing: vi.fn(() => 0),
  setTerrain: vi.fn(),
  setConfigProperty: vi.fn(),
  queryTerrainElevation: vi.fn((): number | null => null),
}));

const glBounds = vi.hoisted(() => {
  const state = {
    instances: [] as Array<{ extend: ReturnType<typeof vi.fn> }>,
  };
  return {
    get instances() {
      return state.instances;
    },
    clear: () => {
      state.instances = [];
    },
    create: () => {
      const bounds = {
        extend: vi.fn(() => bounds),
      };
      state.instances.push(bounds);
      return bounds;
    },
  };
});

interface FakeMarker {
  element: HTMLElement;
  lngLat: number[] | null;
  setLngLat: (ll: number[]) => FakeMarker;
  getLngLat: () => { lng: number; lat: number };
  addTo: (map: unknown) => FakeMarker;
  remove: () => void;
  getElement: () => HTMLElement;
}

interface FakePopup {
  setLngLat: (ll: unknown) => FakePopup;
  setHTML: (html: string) => FakePopup;
  setText: (text: string) => FakePopup;
  setDOMContent: (node: HTMLElement) => FakePopup;
  addTo: (map: unknown) => FakePopup;
  remove: () => void;
}

const glMarkers = vi.hoisted(() => {
  const created: FakeMarker[] = [];
  return {
    get created() {
      return created;
    },
    clear: () => {
      created.length = 0;
    },
    make: (opts?: { element?: HTMLElement }): FakeMarker => {
      const element = opts?.element ?? document.createElement('div');
      const marker: FakeMarker = {
        element,
        lngLat: null,
        setLngLat: vi.fn((ll: number[]) => {
          marker.lngLat = ll;
          return marker;
        }),
        getLngLat: vi.fn(() => ({ lng: Number(marker.lngLat?.[0] ?? 0), lat: Number(marker.lngLat?.[1] ?? 0) })),
        addTo: vi.fn((_map: unknown) => marker),
        remove: vi.fn(),
        getElement: vi.fn(() => element),
      };
      created.push(marker);
      return marker;
    },
  };
});

const glPopup = vi.hoisted((): FakePopup => {
  const popup: FakePopup = {
    setLngLat: vi.fn((_ll: unknown) => popup),
    setHTML: vi.fn((_html: string) => popup),
    setText: vi.fn((_text: string) => popup),
    setDOMContent: vi.fn((_node: HTMLElement) => popup),
    addTo: vi.fn((_map: unknown) => popup),
    remove: vi.fn(),
  };
  return popup;
});

vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(function () {
      return glMap;
    }),
    Marker: vi.fn(function (opts?: { element?: HTMLElement }) {
      return glMarkers.make(opts);
    }),
    LngLatBounds: vi.fn(function () {
      return glBounds.create();
    }),
    NavigationControl: vi.fn(),
    Popup: vi.fn(function () {
      return glPopup;
    }),
  },
}));
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

// maplibre-gl 6 has no default export, so the fakes are named exports.
vi.mock('maplibre-gl', () => ({
  Map: vi.fn(function () {
    return glMap;
  }),
  Marker: vi.fn(function (opts?: { element?: HTMLElement }) {
    return glMarkers.make(opts);
  }),
  LngLatBounds: vi.fn(function () {
    return glBounds.create();
  }),
  NavigationControl: vi.fn(),
  Popup: vi.fn(function () {
    return glPopup;
  }),
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

vi.mock('./mapboxSetup', () => ({
  isStandardFamily: vi.fn(() => false),
  supportsCustom3d: vi.fn(() => false),
  wantsTerrain: vi.fn(() => false),
  addCustom3dBuildings: vi.fn(),
  addTerrainAndSky: vi.fn(),
}));

const locationMarker = vi.hoisted(() => ({ update: vi.fn(), destroy: vi.fn() }));

vi.mock('./locationMarkerMapbox', () => ({
  attachLocationMarker: vi.fn(() => locationMarker),
}));

const reservationOverlay = vi.hoisted(() => ({
  update: vi.fn((_reservations: unknown, _opts: unknown, _routes: unknown) => {}),
  destroy: vi.fn(),
}));

vi.mock('./reservationsMapbox', () => ({
  ReservationMapboxOverlay: vi.fn(function () {
    return reservationOverlay;
  }),
}));

const geoStub = vi.hoisted(() => ({
  position: null as GeoPosition | null,
  mode: 'off' as TrackingMode,
  error: null as string | null,
  errorCode: null as string | null,
  cycleMode: vi.fn(async () => {}),
  setMode: vi.fn((_m: TrackingMode | ((prev: TrackingMode) => TrackingMode)) => {}),
}));

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => geoStub),
}));

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}));

import mapboxgl from 'mapbox-gl';
import * as photoService from '../../services/photoService';
import { MapViewGL as MapViewGLWithEngine } from './MapViewGL';
import * as mapboxSetup from './mapboxSetup';

// The engine is a prop now, not a module import — that is what keeps mapbox-gl and
// maplibre-gl in separate chunks. This shim preserves the suite's existing call
// shape and makes the same choice glLazy.tsx makes in production, so the vi.mock
// factories below still stand in for the right SDK.
type MapViewProps = Omit<React.ComponentProps<typeof MapViewGLWithEngine>, 'gl'>;

function MapViewGL(props: MapViewProps) {
  return <MapViewGLWithEngine {...props} gl={props.glProvider === 'maplibre-gl' ? maplibregl : mapboxgl} />;
}

beforeEach(() => {
  glMap.on.mockImplementation(() => glMap);
  glMap.off.mockImplementation(() => glMap);
  glMap.once.mockImplementation(() => glMap);
  glMap.loaded.mockReturnValue(true);
  glMap.getSource.mockReturnValue(null);
  glMap.getLayer.mockReturnValue(null);
  glMap.queryRenderedFeatures.mockReturnValue([]);
  glMap.querySourceFeatures.mockReturnValue([]);
  glMap.getCanvas.mockImplementation(() => document.createElement('canvas'));
  glMap.getBearing.mockReturnValue(0);
  glMap.getZoom.mockReturnValue(10);
  glMap.queryTerrainElevation.mockReturnValue(null);
  glMap.isStyleLoaded.mockReturnValue(true);
  glMap.getStyle.mockReturnValue({ layers: [] });
  glMap.addSource.mockImplementation(() => undefined);
  glMarkers.clear();
  vi.mocked(mapboxSetup.isStandardFamily).mockReturnValue(false);
  vi.mocked(mapboxSetup.supportsCustom3d).mockReturnValue(false);
  vi.mocked(mapboxSetup.wantsTerrain).mockReturnValue(false);
  vi.mocked(photoService.getCached).mockReturnValue(undefined);
  vi.mocked(photoService.isLoading).mockReturnValue(false);
  vi.mocked(photoService.onThumbReady).mockReturnValue(() => {});
  vi.mocked(photoService.getAllThumbs).mockReturnValue({});
  geoStub.position = null;
  geoStub.mode = 'off';
  geoStub.error = null;
  useSettingsStore.setState({
    settings: {
      ...useSettingsStore.getState().settings,
      map_provider: 'mapbox-gl',
      mapbox_access_token: 'pk.test_token',
      mapbox_style: 'mapbox://styles/mapbox/streets-v12',
      mapbox_3d_enabled: false,
    },
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
  glBounds.clear();
  resetAllStores();
});

describe('MapViewGL load status', () => {
  it('FE-COMP-MAPVIEWGL-LOAD-001: stays loading until the first complete map load', async () => {
    const { queryByRole, unmount } = render(
      <MapLoadStatusProvider onRetry={vi.fn()}>
        <MapViewGL places={[]} />
      </MapLoadStatusProvider>
    );
    expect(queryByRole('status')).toBeInTheDocument();

    const onLoad = glMap.on.mock.calls.find((call) => call[0] === 'load')?.[1] as () => void;
    await act(async () => {
      onLoad();
    });

    expect(queryByRole('status')).not.toBeInTheDocument();
    expect(queryByRole('alert')).not.toBeInTheDocument();

    const onStyleLoad = glMap.once.mock.calls.find((call) => call[0] === 'style.load')?.[1];
    const onError = glMap.on.mock.calls.find((call) => call[0] === 'error')?.[1];
    unmount();
    expect(glMap.off).toHaveBeenCalledWith('style.load', onStyleLoad);
    expect(glMap.off).toHaveBeenCalledWith('error', onError);
  });

  it('FE-COMP-MAPVIEWGL-LOAD-002: an initial style error offers a retry', async () => {
    const onRetry = vi.fn();
    const { findByRole } = render(
      <MapLoadStatusProvider onRetry={onRetry}>
        <MapViewGL places={[]} />
      </MapLoadStatusProvider>
    );
    const onError = glMap.on.mock.calls.find((call) => call[0] === 'error')?.[1] as () => void;
    await act(async () => {
      onError();
    });

    const alert = await findByRole('alert');
    fireEvent.click(within(alert).getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-MAPVIEWGL-LOAD-003: an ordinary tile error after style.load is not a failure', async () => {
    const { queryByRole } = render(
      <MapLoadStatusProvider onRetry={vi.fn()}>
        <MapViewGL places={[]} />
      </MapLoadStatusProvider>
    );
    const onStyleLoad = glMap.once.mock.calls.find((call) => call[0] === 'style.load')?.[1] as () => void;
    const onError = glMap.on.mock.calls.find((call) => call[0] === 'error')?.[1] as () => void;
    await act(async () => {
      onStyleLoad();
      onError();
    });

    expect(queryByRole('alert')).not.toBeInTheDocument();
    expect(queryByRole('status')).toBeInTheDocument();
  });
});
