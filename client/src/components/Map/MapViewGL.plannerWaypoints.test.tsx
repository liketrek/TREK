import { act } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import type { GeoPosition, TrackingMode } from '../../hooks/useGeolocation';
import { useSettingsStore } from '../../store/settingsStore';

// The planner-waypoint and location-search camera cases of MapViewGL, and the tour
// map's via ferrata layer (RC-10), with the same map doubles as MapViewGL.test.tsx.

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
  // Every overlay that adds a layer takes it away again on cleanup; a real
  // MapLibre/Mapbox map has both halves, and a double with only the adding half
  // fails the teardown rather than the behaviour under test.
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  setLayoutProperty: vi.fn(),
  setFilter: vi.fn(),
  hasImage: vi.fn().mockReturnValue(false),
  addImage: vi.fn(),
  removeImage: vi.fn(),
  getStyle: vi.fn().mockReturnValue({ layers: [] }),
  isStyleLoaded: vi.fn().mockReturnValue(true),
  getCanvasContainer: vi.fn(() => glCanvasContainer),
  getContainer: vi.fn(() => glCanvasContainer),
  getLayer: vi.fn().mockReturnValue(null),
  queryRenderedFeatures: vi.fn().mockReturnValue([]),
  querySourceFeatures: vi.fn().mockReturnValue([]),
  unproject: vi.fn(() => ({ lng: 2.3522, lat: 48.8566 })),
  // The MapLibre place pins position themselves with this, so a mock without it
  // never exercises the path the real map takes.
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

// Markers and popups are created through the mocked GL constructors, so the
// tests can reach the very instances the component built (their DOM element,
// the coordinates they were placed at, the popup content they were given).
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

vi.mock('maplibre-gl', () => ({
  default: {
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
import { groupFerratas } from '../Ferratas/ferrataGroups';
import { MapViewGL as MapViewGLWithEngine } from './MapViewGL';
import * as mapboxSetup from './mapboxSetup';

// The engine is a prop, not a module import (see MapViewGL.test.tsx). This shim makes
// the same choice glLazy.tsx makes in production.
function MapViewGL(props: Omit<React.ComponentProps<typeof MapViewGLWithEngine>, 'gl'>) {
  return <MapViewGLWithEngine {...props} gl={props.glProvider === 'maplibre-gl' ? maplibregl : mapboxgl} />;
}

function pointer(type: string, x: number, y: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    button: { value: 0 },
    clientX: { value: x },
    clientY: { value: y },
    pointerId: { value: 1 },
  });
  return event;
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
  glMap.queryTerrainElevation.mockReturnValue(null);
  // A busy style, a refused source and a custom layer list are each set by one test
  // for the case it covers. Put back here, or every test after it would silently run
  // against a map that never settles.
  glMap.isStyleLoaded.mockReturnValue(true);
  glMap.getStyle.mockReturnValue({ layers: [] });
  glMap.addSource.mockImplementation(() => undefined);
  glMarkers.clear();
  // clearAllMocks() wipes call history but keeps implementations, so anything a
  // test overrides with mockReturnValue has to be put back here.
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
  });
});

afterEach(() => {
  vi.clearAllMocks();
  glBounds.clear();
  resetAllStores();
});

describe('MapViewGL', () => {
  function loadOnAttach() {
    glMap.on.mockImplementation((event: string, handlerOrLayer: unknown) => {
      if (event === 'load' && typeof handlerOrLayer === 'function') (handlerOrLayer as () => void)();
      return glMap;
    });
  }

  it('honors a location-search camera intent and preserves it through later route updates', async () => {
    loadOnAttach();
    const searchPoint: [number, number] = [35.0116, 135.7681];
    const { rerender } = render(
      <MapViewGL
        places={[]}
        route={null}
        followSelection={false}
        focusKey="tour:0:search:1"
        focusPoints={[searchPoint]}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    expect(glMap.fitBounds).toHaveBeenCalledOnce();
    expect(glMap.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ maxZoom: 15 }));
    const mapConstructions = vi.mocked(maplibregl.Map).mock.calls.length;
    glMap.fitBounds.mockClear();

    rerender(
      <MapViewGL
        places={[]}
        route={[[searchPoint, [35.02, 135.77]]]}
        followSelection={false}
        focusKey="tour:0:search:1"
        focusPoints={[searchPoint, [35.02, 135.77]]}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    expect(glMap.fitBounds).not.toHaveBeenCalled();
    expect(vi.mocked(maplibregl.Map).mock.calls).toHaveLength(mapConstructions);

    rerender(
      <MapViewGL
        places={[]}
        followSelection={false}
        focusKey="tour:1"
        focusPoints={[
          [46.8, 9.5],
          [47.1, 10.1],
        ]}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    expect(glMap.fitBounds).toHaveBeenCalledOnce();
  });

  it.each(['maplibre-gl', 'mapbox-gl'] as const)(
    'RC-08: %s previews waypoint drags locally and commits only on pointer up without changing the camera',
    async (provider) => {
      loadOnAttach();
      glMap.project.mockImplementation((lngLat: [number, number]) => ({ x: lngLat[0] * 10, y: lngLat[1] * 10 }));
      glMap.unproject.mockReturnValue({ lng: 2.3522, lat: 48.8566 });
      glMap.getContainer.mockReturnValue(glCanvasContainer);
      const waypoint = { id: 'via-1', lat: 48, lng: 11, role: 'via' as const };
      const waypoints = [waypoint];
      const onMove = vi.fn(() => true);
      const onSelect = vi.fn();
      const onMapClick = vi.fn();
      const view = render(
        <MapViewGL
          places={[]}
          plannerWaypoints={waypoints}
          onPlannerWaypointClick={onSelect}
          onPlannerWaypointMove={onMove}
          onMapClick={onMapClick}
          focusKey="tour:1"
          focusPoints={[[waypoint.lat, waypoint.lng]]}
          routeProfileFocus={null}
          glProvider={provider}
        />
      );
      await act(async () => {});
      glMap.fitBounds.mockClear();
      const pin =
        provider === 'maplibre-gl'
          ? (glCanvasContainer.querySelector('[aria-label="Waypoint 1"]') as HTMLButtonElement)
          : (glMarkers.created.find((marker) => marker.element.getAttribute('aria-label') === 'Waypoint 1')
              ?.element as HTMLButtonElement);
      const startTransform = pin.style.transform;
      const libraryMarker =
        provider === 'mapbox-gl' ? glMarkers.created.find((marker) => marker.element === pin) : undefined;
      const startLngLat = libraryMarker?.lngLat;

      act(() => {
        pin.dispatchEvent(pointer('pointerdown', 10, 10));
        pin.dispatchEvent(pointer('pointermove', 30, 40));
      });
      if (provider === 'maplibre-gl') expect(pin.style.transform).not.toBe(startTransform);
      else expect(libraryMarker?.lngLat).not.toEqual(startLngLat);
      expect(onMove).not.toHaveBeenCalled();
      expect(waypoints[0]).toEqual(waypoint);

      view.rerender(
        <MapViewGL
          places={[]}
          plannerWaypoints={waypoints}
          onPlannerWaypointClick={onSelect}
          onPlannerWaypointMove={onMove}
          onMapClick={onMapClick}
          focusKey="tour:1"
          focusPoints={[[waypoint.lat, waypoint.lng]]}
          routeProfileFocus={{ distanceMeters: 100, elevationMeters: 0, lat: 48.1, lng: 11.1, sampleIndex: 0 }}
          glProvider={provider}
        />
      );
      if (provider === 'maplibre-gl') expect(pin.style.transform).not.toBe(startTransform);
      else expect(libraryMarker?.lngLat).not.toEqual(startLngLat);

      act(() => {
        pin.dispatchEvent(pointer('pointerup', 30, 40));
        pin.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      expect(onMove).toHaveBeenCalledOnce();
      expect(onMove).toHaveBeenCalledWith(waypoint.id, 48.8566, 2.3522);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onMapClick).not.toHaveBeenCalled();
      view.rerender(
        <MapViewGL
          places={[]}
          plannerWaypoints={[{ ...waypoint, lat: 48.4, lng: 11.3 }]}
          onPlannerWaypointClick={onSelect}
          onPlannerWaypointMove={onMove}
          onMapClick={onMapClick}
          focusKey="tour:1"
          focusPoints={[[48.4, 11.3]]}
          routeProfileFocus={{ distanceMeters: 100, elevationMeters: 0, lat: 48.1, lng: 11.1, sampleIndex: 0 }}
          glProvider={provider}
        />
      );
      expect(glMap.fitBounds).not.toHaveBeenCalled();
      expect(glMap.flyTo).not.toHaveBeenCalled();
      expect(glMap.jumpTo).not.toHaveBeenCalled();
    }
  );

  it('RC-08: pointer cancellation restores the MapLibre pin and plain clicks still select and add separately', async () => {
    loadOnAttach();
    const waypoint = { id: 'start', lat: 48, lng: 11, role: 'start' as const };
    const onMove = vi.fn(() => true);
    const onSelect = vi.fn();
    const onMapClick = vi.fn();
    render(
      <MapViewGL
        places={[]}
        plannerWaypoints={[waypoint]}
        onPlannerWaypointClick={onSelect}
        onPlannerWaypointMove={onMove}
        onMapClick={onMapClick}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    const pin = glCanvasContainer.querySelector('[aria-label="Waypoint 1"]') as HTMLButtonElement;
    const initialTransform = pin.style.transform;
    act(() => {
      pin.dispatchEvent(pointer('pointerdown', 10, 10));
      pin.dispatchEvent(pointer('pointermove', 30, 40));
      pin.dispatchEvent(pointer('pointercancel', 30, 40));
    });
    expect(pin.style.transform).toBe(initialTransform);
    expect(onMove).not.toHaveBeenCalled();

    act(() => {
      pin.dispatchEvent(pointer('pointerdown', 10, 10));
      pin.dispatchEvent(pointer('pointerup', 10, 10));
      pin.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(waypoint.id);
    expect(onMapClick).not.toHaveBeenCalled();
  });

  const FERRATA = {
    id: 'way/42',
    name: 'Via delle Trincee',
    grade: { raw: '4', level: 4, plus: null },
    routeName: null,
    geometry: [
      [46.52, 11.8],
      [46.53, 11.81],
    ] as [number, number][],
    osmUrl: 'https://www.openstreetmap.org/way/42',
  };
  const FERRATA_GROUPS = groupFerratas([FERRATA]);
  const ferrataLayer = (active: boolean) => ({
    active,
    onToggle: vi.fn(),
    status: active ? ('ready' as const) : ('idle' as const),
    count: active ? 1 : 0,
    groups: FERRATA_GROUPS,
    selectedId: null,
    onSelect: vi.fn(),
  });
  const addedFerratas = () => glMap.addSource.mock.calls.filter(([id]) => id === 'trek-ferratas');

  it('RC-10: the via ferrata layer is drawn on the ready map only while it is on, its switch in the tour pill', async () => {
    loadOnAttach();
    const off = ferrataLayer(false);
    const view = render(
      <MapViewGL
        places={[]}
        viewBaseLayer="topo"
        onViewBaseLayerChange={vi.fn()}
        ferrataLayer={off}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    expect(addedFerratas()).toHaveLength(0);
    const toggle = view.getByRole('button', { name: 'Via ferratas' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    act(() => toggle.click());
    expect(off.onToggle).toHaveBeenCalledOnce();

    view.rerender(
      <MapViewGL
        places={[]}
        viewBaseLayer="topo"
        onViewBaseLayerChange={vi.fn()}
        ferrataLayer={ferrataLayer(true)}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    expect(addedFerratas()).toHaveLength(1);
    expect(view.getByRole('button', { name: 'Via ferratas' })).toHaveAttribute('aria-pressed', 'true');
    expect(view.getByTestId('ferrata-count-badge')).toHaveTextContent('1');
  });

  it('RC-10: a click on a drawn ferrata opens it and is not a map click, so no control point lands under it', async () => {
    loadOnAttach();
    glMap.getLayer.mockImplementation((id: string) => (id === 'trek-ferratas-hit' ? { id } : null));
    glMap.queryRenderedFeatures.mockImplementation((_point: unknown, options?: { layers?: string[] }) =>
      options?.layers?.includes('trek-ferratas-hit') ? [{ properties: { id: FERRATA.id } }] : []
    );
    const layer = ferrataLayer(true);
    const onMapClick = vi.fn();
    render(
      <MapViewGL
        places={[]}
        viewBaseLayer="topo"
        onViewBaseLayerChange={vi.fn()}
        ferrataLayer={layer}
        onMapClick={onMapClick}
        glProvider="maplibre-gl"
      />
    );
    await act(async () => {});
    const mapClicks = glMap.on.mock.calls
      .filter(([event, handler]) => event === 'click' && typeof handler === 'function')
      .map(([, handler]) => handler as (event: unknown) => void);
    expect(mapClicks.length).toBeGreaterThan(0);
    const click = {
      point: { x: 5, y: 5 },
      lngLat: { lat: 46.52, lng: 11.8 },
      originalEvent: { target: document.createElement('div') },
    };
    act(() => mapClicks.forEach((handler) => handler(click)));
    expect(onMapClick).not.toHaveBeenCalled();
    expect(layer.onSelect).toHaveBeenCalledWith(FERRATA_GROUPS[0], FERRATA, { lat: 46.52, lng: 11.8 });
  });
});
