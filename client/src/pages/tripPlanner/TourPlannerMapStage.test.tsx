// FE-PAGE-TOURSTAGE-001 to FE-PAGE-TOURSTAGE-031
import type { Ferrata, PaddleFeature } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { idleLegVariants, idleRoundHikes } from '../../../tests/helpers/tourPlannerStub';
import { useTripFerratas } from '../../components/Ferratas/useTripFerratas';
import type { MapViewProps } from '../../components/Map/mapViewContract';
import { useTourMapView } from '../../components/Tours/planner/useTourMapView';
import { clearPaddleObstacles, publishPaddleObstacles, selectPaddleObstacle } from '../../store/paddleObstacleStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTourMapViewportStore } from '../../store/tourMapViewportStore';
import { initialTourPlaceToolState, useTourPlaceToolStore } from '../../store/tourPlaceToolStore';
import { TourPlannerMapStage, type TourPlannerMapStageProps } from './TourPlannerMapStage';

type Handler = (event?: unknown) => void;

const stage = vi.hoisted(() => {
  const listeners = new Map<string, Handler[]>();
  const map = {
    on: vi.fn((type: string, fn: Handler) => {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
      return map;
    }),
    once: vi.fn(() => map),
    off: vi.fn(() => map),
    loaded: vi.fn(() => false),
    // The style never finishes in these tests: the ferrata layer waits for it and draws nothing.
    isStyleLoaded: vi.fn(() => false),
    getContainer: vi.fn(() => document.body),
    getLayer: vi.fn(() => undefined),
    hasImage: vi.fn(() => false),
    addImage: vi.fn(),
    removeImage: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setFilter: vi.fn(),
    setPaintProperty: vi.fn(),
    queryRenderedFeatures: vi.fn(() => []),
    getCanvas: vi.fn(() => ({ style: {} })),
    getBounds: vi.fn(() => ({
      getSouth: () => 46.5,
      getWest: () => 11.7,
      getNorth: () => 46.6,
      getEast: () => 11.9,
    })),
    getZoom: vi.fn(() => 12),
    remove: vi.fn(),
    fitBounds: vi.fn(),
    setTerrain: vi.fn(),
    setStyle: vi.fn(),
    getSource: vi.fn(),
  };
  const marker = { setLngLat: vi.fn(), addTo: vi.fn(), remove: vi.fn(), on: vi.fn() };
  marker.setLngLat.mockReturnValue(marker);
  marker.addTo.mockReturnValue(marker);
  const engine = {
    Map: vi.fn(function () {
      return map;
    }),
    Marker: vi.fn(function () {
      return marker;
    }),
  };
  const fire = (type: string, event?: unknown) => (listeners.get(type) ?? []).forEach((fn) => fn(event));
  return {
    map,
    engine,
    listeners,
    fire,
    flatMap: { props: null as MapViewProps | null },
    search: { props: null as Record<string, unknown> | null },
  };
});

vi.mock('../../components/Map/engines/maplibre', () => ({ default: stage.engine }));
vi.mock('../../components/Map/MapViewAuto', () => ({
  MapViewAuto: (props: MapViewProps) => {
    stage.flatMap.props = props;
    return (
      <button type="button" onClick={props.onToggleTerrain3d}>
        flat map
      </button>
    );
  },
}));
vi.mock('../../components/Planner/LocationSelect', () => ({
  default: (props: Record<string, unknown>) => {
    stage.search.props = props;
    return <input aria-label="location search" />;
  },
}));
// What the layer asks the server is useTripFerratas' own suite; here it answers from memory.
vi.mock('../../components/Ferratas/useTripFerratas', () => ({ useTripFerratas: vi.fn() }));
// The checklist's part of the card is ObstacleDecisionPanel's own suite; here it shows what it was handed.
vi.mock('../../components/Tours/paddle/ObstacleDecisionPanel', () => ({
  ChecklistObstaclePanel: ({ checklist, featureRef }: { checklist: { status: string }; featureRef: string }) => (
    <p data-testid="checklist-obstacle-panel">{`${checklist.status} ${featureRef}`}</p>
  ),
}));

const FERRATA: Ferrata = {
  id: 'way/42',
  name: 'Via delle Trincee',
  grade: { raw: '4', level: 4, plus: null },
  routeName: null,
  geometry: [
    [46.52, 11.8],
    [46.53, 11.81],
  ],
  osmUrl: 'https://www.openstreetmap.org/way/42',
};

type Planner = TourPlannerMapStageProps['tourPlanner'];

function planner(
  mode: 'neutral' | 'new-draft' | 'edit-saved' | 'view-saved' | 'view-gpx',
  overrides: Record<string, unknown> = {}
) {
  return {
    mode: mode === 'view-gpx' ? { type: mode, placeId: 9, tour: { place_id: 9, tour_type: 'hike' } } : { type: mode },
    tourType: 'hike',
    isSaving: false,
    waypoints: [{ id: 'w1', lat: 46, lng: 7 }],
    selectedWaypointId: 'w1',
    setSelectedWaypointId: vi.fn(),
    setWaypointPosition: vi.fn(() => true),
    addWaypoint: vi.fn(),
    undo: vi.fn(),
    maxHikingDifficulty: null,
    routeAnalysis: null,
    readOnlyGpxAnalysis: null,
    mapBaseLayer: 'default',
    setMapBaseLayer: vi.fn(),
    mapOverlays: new Set(),
    mapOverlaysOff: new Set(),
    toggleMapOverlay: vi.fn(),
    routeProfileFocus: null,
    setRouteProfileFocus: vi.fn(),
    legVariants: idleLegVariants(),
    roundHikes: idleRoundHikes(),
    ...overrides,
  } as unknown as Planner;
}

function stageProps(tourPlanner: Planner, canPlaceEdit = true) {
  return {
    tripId: 7,
    mapTileUrl: '',
    leftHidden: false,
    rightHidden: false,
    t: (key: string) => key,
    tourPlanner,
    tourMap: { route: null, focusPoints: [[46, 7]], focusKey: 'k', captureViewport: vi.fn() },
    locationSearch: { value: null, onChange: vi.fn() },
    canPlaceEdit,
    leftPanelPx: 320,
    rightPanelPx: 380,
  } as unknown as TourPlannerMapStageProps;
}

function renderStage(tourPlanner: Planner, canPlaceEdit = true) {
  return render(<TourPlannerMapStage {...stageProps(tourPlanner, canPlaceEdit)} />);
}

function pointer(type: string, x: number, y: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } });
  return event;
}

/** A press on the map surface that travels `dx` pixels before it is let go. */
function press(dx: number) {
  const surface = screen.getByTestId('tour-map-surface');
  surface.dispatchEvent(pointer('pointerdown', 100, 100));
  surface.dispatchEvent(pointer('pointermove', 100 + dx, 100));
  surface.dispatchEvent(pointer('pointerup', 100 + dx, 100));
}

/** Switches the flat map to 3D and waits for the GL engine to load. */
async function openTerrain() {
  fireEvent.click(screen.getByRole('button', { name: 'flat map' }));
  await waitFor(() => expect(stage.engine.Marker).toHaveBeenCalled());
}

beforeEach(() => {
  window.sessionStorage.clear();
  useTourPlaceToolStore.setState(initialTourPlaceToolState());
  stage.listeners.clear();
  stage.flatMap.props = null;
  stage.search.props = null;
  vi.clearAllMocks();
  vi.mocked(useTripFerratas).mockImplementation((_tripId, _bbox, enabled) => ({
    ferratas: enabled ? [FERRATA] : [],
    status: enabled ? 'ready' : 'idle',
    truncated: false,
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {}))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the paddle checklist in the obstacle card (PAD-06)', () => {
  type Checklist = NonNullable<TourPlannerMapStageProps['paddleChecklist']>;

  const WEIR: PaddleFeature = {
    ref: 'node/101',
    kind: 'weir',
    group_key: null,
    name: 'Hammer weir',
    geometry: { type: 'Point', coordinates: [7, 46] },
    tags: { waterway: 'weir' },
    tag_hash: 'weir-hash',
    region_id: 'valais',
  };

  /** The weir in the obstacle store and picked, as a click on its map pin or a row of the checklist picks it. */
  function pickWeir() {
    act(() => {
      publishPaddleObstacles({
        status: 'ready',
        features: [WEIR],
        related: [],
        routeLengthM: 0,
        coverage: 'covered',
        regions: [],
        truncated: false,
      });
      selectPaddleObstacle(WEIR.ref);
    });
  }

  afterEach(() => {
    act(() => clearPaddleObstacles());
  });

  it('PCM-001: the picked object card carries the checklist part for that object', () => {
    const paddleChecklist = { status: 'ready' } as unknown as Checklist;
    render(<TourPlannerMapStage {...stageProps(planner('edit-saved'))} paddleChecklist={paddleChecklist} />);
    pickWeir();
    const panel = screen.getByTestId('checklist-obstacle-panel');
    expect(screen.getByTestId('paddle-obstacle-overlay')).toContainElement(panel);
    expect(panel).toHaveTextContent('ready node/101');
  });

  it('PCM-002: without a checklist the card shows the object alone', () => {
    renderStage(planner('edit-saved'));
    pickWeir();
    expect(screen.getByTestId('paddle-obstacle-overlay')).toBeInTheDocument();
    expect(screen.queryByTestId('checklist-obstacle-panel')).not.toBeInTheDocument();
  });
});

describe('TourPlannerMapStage', () => {
  it('FE-PAGE-TOURSTAGE-001: the flat map adds and moves control points while a tour is edited', () => {
    const tourPlanner = planner('new-draft');
    renderStage(tourPlanner);
    const props = stage.flatMap.props;
    expect(props?.plannerWaypoints).toEqual([expect.objectContaining({ id: 'w1', lat: 46, lng: 7 })]);
    expect(props?.selectedPlannerWaypointId).toBe('w1');
    expect(props?.onPlannerWaypointMove).toBe(tourPlanner.setWaypointPosition);
    props?.onMapClick?.({ latlng: { lat: 46.2, lng: 7.2 } } as never);
    expect(tourPlanner.addWaypoint).toHaveBeenCalledWith(46.2, 7.2);
  });

  it('FE-PAGE-TOURSTAGE-002: the flat map shows no control points and takes no clicks outside editing', () => {
    renderStage(planner('view-saved'));
    const props = stage.flatMap.props;
    expect(props?.plannerWaypoints).toEqual([]);
    expect(props?.selectedPlannerWaypointId).toBeNull();
    expect(props?.onMapClick).toBeUndefined();
    expect(props?.onPlannerWaypointMove).toBeUndefined();
  });

  it('FE-PAGE-TOURSTAGE-003: the 3D switch opens the terrain, where a click plans once "set points" is on', async () => {
    const tourPlanner = planner('edit-saved');
    renderStage(tourPlanner);
    await openTerrain();
    expect(screen.queryByRole('button', { name: 'flat map' })).toBeNull();
    // Off to begin with in 3D, where every look around is a drag.
    const tool = screen.getByRole('button', { name: 'Set points' });
    expect(tool).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Turn on Set points to click points onto the terrain.')).toBeInTheDocument();
    act(() => stage.fire('click', { lngLat: { lat: 46.3, lng: 7.3 } }));
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();

    fireEvent.click(tool);
    expect(screen.getByRole('button', { name: 'Set points' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('tour-map-surface')).toHaveAttribute('data-placing', 'true');
    expect(screen.getByText(/Click the terrain to set points/)).toBeInTheDocument();
    act(() => stage.fire('click', { lngLat: { lat: 46.3, lng: 7.3 } }));
    expect(tourPlanner.addWaypoint).toHaveBeenCalledWith(46.3, 7.3);

    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(await screen.findByRole('button', { name: 'flat map' })).toBeInTheDocument();
    expect(stage.map.remove).toHaveBeenCalled();
  });

  it('FE-PAGE-TOURSTAGE-004: without edit rights the terrain only says how to open a tour', async () => {
    const tourPlanner = planner('new-draft');
    renderStage(tourPlanner, false);
    await openTerrain();
    expect(screen.getByText('Open a tour on the right to fly it in 3D and colour it by grade.')).toBeInTheDocument();
    act(() => stage.fire('click', { lngLat: { lat: 46.3, lng: 7.3 } }));
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
  });

  it('FE-PAGE-TOURSTAGE-005: an opened GPX tour gets the flyover dock, loading its landscape first', async () => {
    const samples = [0, 1, 2].map((i) => ({
      distanceMeters: i * 100,
      elevationMeters: 500,
      lat: 46 + i / 1000,
      lng: 7,
    }));
    renderStage(planner('view-gpx', { readOnlyGpxAnalysis: { distanceIndexedProfileSamples: samples } }));
    await openTerrain();
    expect(screen.getByRole('progressbar', { name: 'Loading the landscape: 0 %' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grade mix' })).toBeInTheDocument();
  });

  it('FE-PAGE-TOURSTAGE-006: the flat map gets the via ferrata layer switched off, and nothing is asked for', () => {
    renderStage(planner('view-saved'));
    const props = stage.flatMap.props;
    expect(props?.ferrataLayer?.active).toBe(false);
    expect(props?.ferrataLayer?.status).toBe('idle');
    expect(typeof props?.onViewportChange).toBe('function');
    // Off: no view, and the trip's area (here its one framed point) only rides along.
    expect(vi.mocked(useTripFerratas).mock.lastCall).toEqual([
      7,
      null,
      false,
      { south: 46, west: 7, north: 46, east: 7 },
      [],
    ]);
  });

  it('FE-PAGE-TOURSTAGE-007: switched on, the layer asks for the area the flat map reported and draws what it found, grouped', () => {
    renderStage(planner('view-saved'));
    const area = { south: 46.5, west: 11.7, north: 46.6, east: 11.9 };
    act(() => stage.flatMap.props?.onViewportChange?.(area, 12));
    // HOR-01: the rail's horse route search looks in the same view.
    expect(useTourMapViewportStore.getState().bounds).toEqual(area);
    act(() => stage.flatMap.props?.ferrataLayer?.onToggle());

    expect(vi.mocked(useTripFerratas).mock.lastCall?.slice(0, 3)).toEqual([7, area, true]);
    expect(stage.flatMap.props?.ferrataLayer?.active).toBe(true);
    expect(stage.flatMap.props?.ferrataLayer?.groups[0]?.segments).toEqual([FERRATA]);
    expect(stage.flatMap.props?.ferrataLayer?.count).toBe(1);
  });

  it('FE-PAGE-TOURSTAGE-008: a picked ferrata opens its card at the inline end, clear of the right panel, and Escape closes it', () => {
    renderStage(planner('view-saved'));
    act(() => stage.flatMap.props?.ferrataLayer?.onToggle());
    expect(screen.queryByTestId('ferrata-detail-overlay')).toBeNull();

    const group = stage.flatMap.props?.ferrataLayer?.groups[0];
    if (!group) throw new Error('no group');
    act(() => stage.flatMap.props?.ferrataLayer?.onSelect(group, FERRATA, { lat: 46.52, lng: 11.8 }));
    const overlay = screen.getByTestId('ferrata-detail-overlay');
    // The right panel's 380px plus the 20px the layer pill keeps to the left one.
    expect(overlay.style.insetInlineEnd).toBe('400px');
    // On the flat map nothing is under its corner: it rests at the edge gap.
    expect(overlay.style.bottom).toBe('12px');
    expect(overlay).toHaveTextContent('Via delle Trincee');
    expect(stage.flatMap.props?.ferrataLayer?.selectedId).toBe(group.id);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('ferrata-detail-overlay')).toBeNull();
  });

  it('FE-PAGE-TOURSTAGE-009: in 3D the switch sits in the terrain layer pill with its count, the layer stays on and the terrain reports its area', async () => {
    renderStage(planner('view-saved'));
    act(() => stage.flatMap.props?.ferrataLayer?.onToggle());
    await openTerrain();

    const toggle = screen.getByRole('button', { name: 'Via ferratas' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('ferrata-status-pill')).toBeNull();

    act(() => stage.fire('load'));
    expect(vi.mocked(useTripFerratas).mock.lastCall?.slice(0, 3)).toEqual([
      7,
      { south: 46.5, west: 11.7, north: 46.6, east: 11.9 },
      true,
    ]);
    expect(screen.getByTestId('ferrata-count-badge')).toHaveTextContent('1');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Via ferratas' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByTestId('ferrata-count-badge')).toBeNull();
  });

  it('FE-PAGE-TOURSTAGE-010: the map search is the floating variant, with the short placeholder', () => {
    renderStage(planner('view-saved'));
    expect(stage.search.props).toMatchObject({
      floating: true,
      placeholder: 'tours.planner.mapSearch',
      ariaLabel: 'tours.planner.mapSearch',
    });
  });

  it('FE-PAGE-TOURSTAGE-011: right to left, the card sits at the inline end over the left panel', () => {
    useSettingsStore.setState((state) => ({ settings: { ...state.settings, language: 'ar' } }));
    try {
      renderStage(planner('view-saved'));
      act(() => stage.flatMap.props?.ferrataLayer?.onToggle());
      const group = stage.flatMap.props?.ferrataLayer?.groups[0];
      if (!group) throw new Error('no group');
      act(() => stage.flatMap.props?.ferrataLayer?.onSelect(group, FERRATA, { lat: 46.52, lng: 11.8 }));
      // The left panel's 320px plus the pill's 20px.
      expect(screen.getByTestId('ferrata-detail-overlay').style.insetInlineEnd).toBe('340px');
    } finally {
      useSettingsStore.setState((state) => ({ settings: { ...state.settings, language: 'en' } }));
    }
  });
  it('FE-PAGE-TOURSTAGE-012: the press that closes a ferrata card does not also add a waypoint, the next click does', () => {
    const tourPlanner = planner('new-draft');
    renderStage(tourPlanner);
    act(() => stage.flatMap.props?.ferrataLayer?.onToggle());
    const group = stage.flatMap.props?.ferrataLayer?.groups[0];
    if (!group) throw new Error('no group');
    act(() => stage.flatMap.props?.ferrataLayer?.onSelect(group, FERRATA, { lat: 46.52, lng: 11.8 }));

    fireEvent.pointerDown(screen.getByRole('button', { name: 'flat map' }));
    expect(screen.queryByTestId('ferrata-detail-overlay')).toBeNull();
    act(() => stage.flatMap.props?.onMapClick?.({ latlng: { lat: 46.2, lng: 7.2 } } as never));
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();

    act(() => stage.flatMap.props?.onMapClick?.({ latlng: { lat: 46.3, lng: 7.3 } } as never));
    expect(tourPlanner.addWaypoint).toHaveBeenCalledWith(46.3, 7.3);
  });
  it('FE-PAGE-TOURSTAGE-013: on the flat map "set points" starts on, with the crosshair, and off it takes no clicks', () => {
    renderStage(planner('new-draft'));
    expect(stage.flatMap.props?.placeTool?.active).toBe(true);
    expect(screen.getByTestId('tour-map-surface')).toHaveAttribute('data-placing', 'true');

    act(() => stage.flatMap.props?.placeTool?.onToggle());
    expect(stage.flatMap.props?.placeTool?.active).toBe(false);
    expect(stage.flatMap.props?.onMapClick).toBeUndefined();
    expect(screen.getByTestId('tour-map-surface')).not.toHaveAttribute('data-placing');
  });

  it('FE-PAGE-TOURSTAGE-014: the end of a pan or a rotation never places a point, a click does, in 2D and 3D', async () => {
    const tourPlanner = planner('new-draft');
    renderStage(tourPlanner);
    press(12);
    act(() => stage.flatMap.props?.onMapClick?.({ latlng: { lat: 46.2, lng: 7.2 } } as never));
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
    press(1);
    act(() => stage.flatMap.props?.onMapClick?.({ latlng: { lat: 46.2, lng: 7.2 } } as never));
    expect(tourPlanner.addWaypoint).toHaveBeenCalledTimes(1);

    await openTerrain();
    fireEvent.click(screen.getByRole('button', { name: 'Set points' }));
    press(30);
    act(() => stage.fire('click', { lngLat: { lat: 46.3, lng: 7.3 } }));
    expect(tourPlanner.addWaypoint).toHaveBeenCalledTimes(1);
    press(0);
    act(() => stage.fire('click', { lngLat: { lat: 46.3, lng: 7.3 } }));
    expect(tourPlanner.addWaypoint).toHaveBeenLastCalledWith(46.3, 7.3);
  });

  it('FE-PAGE-TOURSTAGE-015: "point set" shows above the bottom row after a click, and its undo takes the point back', () => {
    const tourPlanner = planner('new-draft');
    const view = renderStage(tourPlanner);
    act(() => stage.flatMap.props?.onMapClick?.({ latlng: { lat: 46.2, lng: 7.2 } } as never));
    const placed = planner('new-draft', {
      waypoints: [
        { id: 'w1', lat: 46, lng: 7 },
        { id: 'w2', lat: 46.2, lng: 7.2 },
      ],
      undo: tourPlanner.undo,
    });
    view.rerender(<TourPlannerMapStage {...stageProps(placed)} />);
    const hint = screen.getByTestId('map-undo-hint');
    expect(hint).toHaveTextContent('tours.planner.pointPlaced');
    // Clear of the 2D row: its 12px gap, the 42px pill, the same gap again.
    expect(hint.parentElement?.parentElement?.style.bottom).toBe('66px');

    fireEvent.click(screen.getByRole('button', { name: 'undo.button' }));
    expect(tourPlanner.undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('map-undo-hint')).toBeNull();
  });

  it('FE-PAGE-TOURSTAGE-016: without edit rights there is no "set points" switch and no crosshair', () => {
    renderStage(planner('new-draft'), false);
    expect(stage.flatMap.props?.placeTool).toBeUndefined();
    expect(screen.getByTestId('tour-map-surface')).not.toHaveAttribute('data-placing');
  });

  it('FE-PAGE-TOURSTAGE-017: a click on the route being edited sets a shaping point in the leg there and selects it (P2A-03)', () => {
    const tourPlanner = planner('new-draft', {
      waypoints: [
        { id: 'w1', lat: 46, lng: 7 },
        { id: 'w2', lat: 46.1, lng: 7.1, shaping: true },
        { id: 'w3', lat: 46.2, lng: 7.2 },
      ],
      route: [
        [46, 7],
        [46.1, 7.1],
        [46.2, 7.2],
      ],
      insertShapingPoint: vi.fn(() => 'shape-1'),
    });
    renderStage(tourPlanner);
    const props = stage.flatMap.props;
    expect(props?.plannerWaypoints?.map((point) => [point.label ?? null, !!point.shaping])).toEqual([
      ['1', false],
      [null, true],
      ['2', false],
    ]);
    props?.onRouteClick?.(46.15, 7.15);
    expect(tourPlanner.insertShapingPoint).toHaveBeenCalledWith('w2', 46.15, 7.15);
    expect(tourPlanner.setSelectedWaypointId).toHaveBeenCalledWith('shape-1');
  });

  it('FE-PAGE-TOURSTAGE-018: the route takes no shaping clicks outside editing or without edit rights', () => {
    renderStage(
      planner('view-saved', {
        route: [
          [46, 7],
          [46.1, 7.1],
        ],
      })
    );
    expect(stage.flatMap.props?.onRouteClick).toBeUndefined();
    renderStage(
      planner('new-draft', {
        route: [
          [46, 7],
          [46.1, 7.1],
        ],
      }),
      false
    );
    expect(stage.flatMap.props?.onRouteClick).toBeUndefined();
  });

  it('FE-PAGE-TOURSTAGE-026: a run opens in 3D as any tour does, with its own maps, and back in 2D nothing of it changed (RUN-01)', async () => {
    const tourPlanner = planner('edit-saved', { tourType: 'run' });
    renderStage(tourPlanner);
    expect(stage.flatMap.props?.tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
    await openTerrain();
    expect(screen.queryByRole('button', { name: 'flat map' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(await screen.findByRole('button', { name: 'flat map' })).toBeInTheDocument();
    // The switch is a view: no point and no step of the run went with it.
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
    expect(tourPlanner.undo).not.toHaveBeenCalled();
  });

  it('FE-PAGE-TOURSTAGE-027: an imported ski track flies in 3D with its grade colours and its own maps, and the switch changes nothing of it (SKI-02)', async () => {
    const samples = [0, 1, 2].map((i) => ({
      distanceMeters: i * 100,
      elevationMeters: 1200 + i * 40,
      lat: 47 + i / 1000,
      lng: 11,
    }));
    const tourPlanner = planner('view-gpx', {
      mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'ski', ski_discipline: 'touring' } },
      readOnlyGpxAnalysis: { distanceIndexedProfileSamples: samples },
    });
    renderStage(tourPlanner);
    expect(stage.flatMap.props?.tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
    expect(stage.flatMap.props?.ferrataLayer).toBeUndefined();
    await openTerrain();
    expect(screen.getByRole('button', { name: 'Grade mix' })).toBeInTheDocument();
    // Seeing the track in 3D is a view: no point is set and no step of the planner is taken.
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
    expect(tourPlanner.undo).not.toHaveBeenCalled();
  });

  it('FE-PAGE-TOURSTAGE-033: a planned ski tour flies in 3D with its grade colours, the pistes laid over it (SKI-02)', async () => {
    const samples = [0, 1, 2].map((i) => ({
      distanceMeters: i * 100,
      elevationMeters: 1800 - i * 60,
      lat: 47 + i / 1000,
      lng: 11,
    }));
    const tourPlanner = planner('edit-saved', {
      tourType: 'ski',
      routeAnalysis: { distanceIndexedProfileSamples: samples },
    });
    renderStage(tourPlanner);
    expect(stage.flatMap.props?.tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
    expect(stage.flatMap.props?.tourLayers?.overlays?.map((overlay) => [overlay.id, overlay.status])).toEqual([
      ['pistes', 'on'],
    ]);
    expect(stage.flatMap.props?.ferrataLayer).toBeUndefined();
    await openTerrain();
    expect(screen.getByRole('button', { name: 'Grade mix' })).toBeInTheDocument();
    expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
  });

  it('FE-PAGE-TOURSTAGE-019: while a section is compared its card is up, and a click on the route sets no shaping point (RTE-02)', () => {
    const route = [
      [46, 7],
      [46.2, 7.2],
    ];
    const comparison = {
      leg: { fromId: 'w1', toId: 'w2', from: { lat: 46, lng: 7 }, to: { lat: 46.2, lng: 7.2 }, costing: {}, key: 'k' },
      phase: 'loading',
      variants: [],
      selected: null,
      proving: false,
      notice: null,
    };
    const waypoints = [
      { id: 'w1', lat: 46, lng: 7 },
      { id: 'w2', lat: 46.2, lng: 7.2 },
    ];
    renderStage(planner('new-draft', { waypoints, route, canEdit: true }));
    expect(stage.flatMap.props?.onRouteClick).toBeDefined();
    expect(screen.queryByTestId('leg-variants-card')).not.toBeInTheDocument();

    const legVariants = { ...idleLegVariants(), comparison };
    renderStage(planner('new-draft', { waypoints, route, canEdit: true, legVariants }));
    expect(stage.flatMap.props?.onRouteClick).toBeUndefined();
    expect(screen.getByTestId('leg-variants-card')).toBeInTheDocument();
  });

  it('FE-PAGE-TOURSTAGE-020: "way taken" shows above the bottom row, and its undo takes the way back (RTE-02)', () => {
    const appliedHint = { shown: true, key: 1, undo: vi.fn(), hold: vi.fn() };
    renderStage(planner('new-draft', { legVariants: { ...idleLegVariants(), appliedHint } }));
    const hint = screen.getByTestId('map-undo-hint');
    expect(hint).toHaveTextContent('tours.variants.applied');
    expect(hint.parentElement?.parentElement?.style.bottom).toBe('66px');
    fireEvent.click(screen.getByRole('button', { name: 'undo.button' }));
    expect(appliedHint.undo).toHaveBeenCalledTimes(1);
    fireEvent.mouseEnter(hint);
    expect(appliedHint.hold).toHaveBeenCalledWith(true);
  });

  describe('one card in the corner (RTE-02)', () => {
    const waypoints = [
      { id: 'w1', lat: 46, lng: 7 },
      { id: 'w2', lat: 46.2, lng: 7.2 },
    ];
    const comparison = {
      leg: { fromId: 'w1', toId: 'w2', from: { lat: 46, lng: 7 }, to: { lat: 46.2, lng: 7.2 }, costing: {}, key: 'k' },
      phase: 'loading',
      variants: [],
      selected: null,
      proving: false,
      notice: null,
    };
    const comparingPlanner = (legVariants: ReturnType<typeof idleLegVariants>) =>
      planner('new-draft', { waypoints, route: null, canEdit: true, legVariants: { ...legVariants, comparison } });

    /** Picks the via ferrata on the flat map, as a click on its line does. */
    function pickFerrata() {
      act(() => stage.flatMap.props?.ferrataLayer?.onToggle());
      const group = stage.flatMap.props?.ferrataLayer?.groups[0];
      if (!group) throw new Error('no group');
      act(() => stage.flatMap.props?.ferrataLayer?.onSelect(group, FERRATA, { lat: 46.52, lng: 11.8 }));
    }

    it('FE-PAGE-TOURSTAGE-021: a via ferrata picked while a section is compared closes the comparison, so one card stands there', () => {
      const legVariants = idleLegVariants();
      const view = renderStage(comparingPlanner(legVariants));
      expect(screen.getByTestId('leg-variants-overlay')).toBeInTheDocument();
      pickFerrata();
      expect(legVariants.close).toHaveBeenCalledTimes(1);

      view.rerender(<TourPlannerMapStage {...stageProps(planner('new-draft', { waypoints, legVariants }))} />);
      expect(screen.getByTestId('ferrata-detail-overlay')).toBeInTheDocument();
      expect(screen.queryByTestId('leg-variants-overlay')).not.toBeInTheDocument();
    });

    it('FE-PAGE-TOURSTAGE-022: a comparison opened over a via ferrata card closes that card instead', () => {
      const legVariants = idleLegVariants();
      const view = renderStage(planner('new-draft', { waypoints, legVariants }));
      pickFerrata();
      expect(screen.getByTestId('ferrata-detail-overlay')).toBeInTheDocument();

      view.rerender(<TourPlannerMapStage {...stageProps(comparingPlanner(legVariants))} />);
      expect(screen.queryByTestId('ferrata-detail-overlay')).not.toBeInTheDocument();
      expect(screen.getByTestId('leg-variants-overlay')).toBeInTheDocument();
      expect(legVariants.close).not.toHaveBeenCalled();
    });
  });

  describe('round hikes (RTE-03)', () => {
    const waypoints = [
      { id: 'w1', lat: 46, lng: 7 },
      { id: 'w2', lat: 46.2, lng: 7.2 },
    ];
    const route = [
      [46, 7],
      [46.2, 7.2],
    ];
    const roundView = {
      startId: 'w1',
      targetM: 10_000,
      request: null,
      phase: 'setup',
      candidates: [],
      asked: 0,
      selected: null,
      confirming: false,
      notice: null,
    };

    it('FE-PAGE-TOURSTAGE-023: while round hikes are offered their card is up, and a click on the route sets no shaping point', () => {
      renderStage(planner('new-draft', { waypoints, route, canEdit: true }));
      expect(stage.flatMap.props?.onRouteClick).toBeDefined();
      expect(screen.queryByTestId('round-hike-card')).not.toBeInTheDocument();

      const roundHikes = { ...idleRoundHikes(), view: roundView };
      renderStage(planner('new-draft', { waypoints, route, canEdit: true, maxHikingDifficulty: 2, roundHikes }));
      expect(stage.flatMap.props?.onRouteClick).toBeUndefined();
      expect(screen.getByTestId('round-hike-card')).toBeInTheDocument();
    });

    it('FE-PAGE-TOURSTAGE-024: "round taken" shows with its undo, which takes the round back', () => {
      const appliedHint = { shown: true, key: 1, undo: vi.fn(), hold: vi.fn() };
      renderStage(planner('new-draft', { roundHikes: { ...idleRoundHikes(), appliedHint } }));
      expect(screen.getByTestId('map-undo-hint')).toHaveTextContent('tours.round.applied');
      fireEvent.click(screen.getByRole('button', { name: 'undo.button' }));
      expect(appliedHint.undo).toHaveBeenCalledTimes(1);
    });

    it('FE-PAGE-TOURSTAGE-025: round hikes opened over a comparison close it, so one card stands in the corner', () => {
      const legVariants = {
        ...idleLegVariants(),
        comparison: {
          leg: {
            fromId: 'w1',
            toId: 'w2',
            from: { lat: 46, lng: 7 },
            to: { lat: 46.2, lng: 7.2 },
            costing: {},
            key: 'k',
          },
          phase: 'loading',
          variants: [],
          selected: null,
          proving: false,
          notice: null,
        },
      };
      const roundHikes = idleRoundHikes();
      const view = renderStage(planner('new-draft', { waypoints, canEdit: true, legVariants, roundHikes }));
      view.rerender(
        <TourPlannerMapStage
          {...stageProps(
            planner('new-draft', {
              waypoints,
              canEdit: true,
              maxHikingDifficulty: 2,
              legVariants,
              roundHikes: { ...roundHikes, view: roundView },
            })
          )}
        />
      );
      expect(legVariants.close).toHaveBeenCalledTimes(1);
      expect(roundHikes.close).not.toHaveBeenCalled();
    });
  });

  describe('map layers per tour type (P2B-06/07, PAD-04, PAD-10)', () => {
    const flat = () => stage.flatMap.props as MapViewProps;

    const overlayStates = () => flat().tourLayers?.overlays?.map((overlay) => [overlay.id, overlay.status]);

    it('a hike keeps the standard map, topo and satellite and the via ferrata layer, and no pistes or seamarks', () => {
      renderStage(planner('new-draft'));
      expect(flat().tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
      expect(flat().ferrataLayer).toBeDefined();
      expect(overlayStates()).toEqual([]);
    });

    it('with no tour open there is no via ferrata layer and no seamarks, but the pistes are offered (SKI-01)', () => {
      renderStage(planner('neutral'));
      expect(flat().ferrataLayer).toBeUndefined();
      expect(overlayStates()).toEqual([['pistes', 'off']]);
    });

    it('a paddle tour offers the standard map and satellite, seamarks off, and neither topo nor ferratas', () => {
      renderStage(planner('new-draft', { tourType: 'kayak', mapBaseLayer: 'topo' }));
      expect(flat().tourLayers?.bases).toEqual(['default', 'satellite']);
      // Topo chosen for a hike falls back to the paddle tour's own default, without touching the choice.
      expect(flat().viewBaseLayer).toBe('default');
      expect(flat().ferrataLayer).toBeUndefined();
      expect(overlayStates()).toEqual([['seamarks', 'off']]);
    });

    it('an imported paddle tour is shown with the paddle maps, a bike tour and a run with their own, a type nobody plans with the standard set', () => {
      const { unmount } = renderStage(
        planner('view-gpx', { mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'kayak' } } })
      );
      expect(flat().tourLayers?.bases).toEqual(['default', 'satellite']);
      unmount();
      const bike = renderStage(
        planner('view-gpx', { mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'bike' } } })
      );
      expect(flat().tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
      bike.unmount();
      // RUN-01: a run has topo for its climbs and no ferratas.
      const run = renderStage(
        planner('view-gpx', { mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'run' } } })
      );
      expect(flat().tourLayers?.bases).toEqual(['default', 'topo', 'satellite']);
      expect(flat().ferrataLayer).toBeUndefined();
      run.unmount();
      renderStage(
        planner('view-gpx', { mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, tour_type: 'food' } } })
      );
      expect(flat().tourLayers?.bases).toEqual(['default', 'satellite']);
      expect(flat().tourLayers?.overlays).toEqual([]);
      expect(flat().ferrataLayer).toBeUndefined();
    });

    it('seamarks switch on, report a source that stopped answering, and recover on the next tile', () => {
      // The switch lives with the planner's map view, so it outlasts the map.
      function PaddleStage() {
        const view = useTourMapView();
        return <TourPlannerMapStage {...stageProps(planner('new-draft', { tourType: 'kayak', ...view }))} />;
      }
      render(<PaddleStage />);
      const overlay = () => flat().tourLayers?.overlays?.[0];
      act(() => overlay()?.onToggle());
      expect(overlay()).toMatchObject({
        status: 'on',
        active: true,
        url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      });
      act(() => {
        for (let i = 0; i < 3; i += 1) overlay()?.onTileError();
      });
      expect(overlay()?.status).toBe('on');
      act(() => overlay()?.onTileError());
      expect(overlay()?.status).toBe('down');
      act(() => overlay()?.onTileLoad());
      expect(overlay()?.status).toBe('on');
      act(() => overlay()?.onToggle());
      expect(overlay()).toMatchObject({ status: 'off', active: false });
    });

    it('FE-PAGE-TOURSTAGE-028: the pistes switch on over the map with no tour open and stay on when a ski tour opens (SKI-01)', () => {
      function NeutralStage({ mode }: { mode: 'neutral' | 'new-draft' }) {
        const view = useTourMapView();
        return <TourPlannerMapStage {...stageProps(planner(mode, { ...view, tourType: 'ski' }))} />;
      }
      const { rerender } = render(<NeutralStage mode="neutral" />);
      const pistes = () => flat().tourLayers?.overlays?.find((overlay) => overlay.id === 'pistes');
      act(() => pistes()?.onToggle());
      expect(pistes()).toMatchObject({
        status: 'on',
        active: true,
        url: 'https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png',
        minZoom: 9,
        maxZoom: 18,
      });
      expect(pistes()?.attribution).toContain('OpenSnowMap');
      expect(pistes()?.attribution).toContain('OpenStreetMap');
      // The choice is the map view's, so it outlasts the switch from no tour to a ski tour.
      rerender(<NeutralStage mode="new-draft" />);
      expect(pistes()?.status).toBe('on');
    });

    it('FE-PAGE-TOURSTAGE-029: switching the pistes changes no point and no step, and a source that stopped answering keeps the map (SKI-01)', () => {
      const tourPlanner = planner('edit-saved', { tourType: 'ski', mapOverlays: new Set(['pistes']) });
      renderStage(tourPlanner);
      const pistes = () => flat().tourLayers?.overlays?.find((overlay) => overlay.id === 'pistes');
      expect(pistes()?.status).toBe('on');
      act(() => pistes()?.onToggle());
      expect(tourPlanner.toggleMapOverlay).toHaveBeenCalledWith('pistes', true);
      act(() => {
        for (let i = 0; i < 4; i += 1) pistes()?.onTileError();
      });
      expect(pistes()?.status).toBe('down');
      // The points and the base map stay what they were, and the planner was asked for nothing but the switch.
      expect(flat().plannerWaypoints).toHaveLength(1);
      expect(flat().viewBaseLayer).toBe('default');
      expect(tourPlanner.addWaypoint).not.toHaveBeenCalled();
      expect(tourPlanner.setWaypointPosition).not.toHaveBeenCalled();
      expect(tourPlanner.undo).not.toHaveBeenCalled();
    });

    it('FE-PAGE-TOURSTAGE-030: an imported ski track shows the pistes at once; a hike, a bike tour, a run and a paddle tour do not offer them (SKI-01)', () => {
      const viewed = (tour: Record<string, unknown>) =>
        planner('view-gpx', { mode: { type: 'view-gpx', placeId: 9, tour: { place_id: 9, ...tour } } });
      const ski = renderStage(viewed({ tour_type: 'ski', ski_discipline: 'alpine' }));
      expect(overlayStates()).toEqual([['pistes', 'on']]);
      ski.unmount();
      for (const tourType of ['hike', 'bike', 'run', 'kayak']) {
        const other = renderStage(planner('new-draft', { tourType }));
        expect(flat().tourLayers?.overlays?.some((overlay) => overlay.id === 'pistes')).toBe(false);
        other.unmount();
      }
    });

    it('FE-PAGE-TOURSTAGE-031: the pistes know the zoom the map reported, so switched on far out they say to zoom in (SKI-01)', () => {
      renderStage(planner('neutral', { mapOverlays: new Set(['pistes']) }));
      const pistes = () => flat().tourLayers?.overlays?.find((overlay) => overlay.id === 'pistes');
      const area = { south: 46, west: 7, north: 48, east: 12 };
      // No zoom reported yet: nothing is claimed.
      expect(pistes()).toMatchObject({ status: 'on', belowMinZoom: false });
      act(() => flat().onViewportChange?.(area, 6));
      expect(pistes()?.belowMinZoom).toBe(true);
      act(() => flat().onViewportChange?.(area, 12));
      expect(pistes()?.belowMinZoom).toBe(false);
    });

    it('FE-PAGE-TOURSTAGE-032: a planned ski tour shows the pistes until switched off, and off they stay for the next one (SKI-01)', () => {
      function SkiStage({ placeId }: { placeId: number }) {
        const view = useTourMapView();
        const mode = { type: 'edit-saved', placeId };
        return <TourPlannerMapStage {...stageProps(planner('edit-saved', { ...view, tourType: 'ski', mode }))} />;
      }
      const { rerender } = render(<SkiStage placeId={4} />);
      const pistes = () => flat().tourLayers?.overlays?.find((overlay) => overlay.id === 'pistes');
      expect(pistes()).toMatchObject({ status: 'on', active: true });
      act(() => pistes()?.onToggle());
      expect(pistes()).toMatchObject({ status: 'off', active: false });
      rerender(<SkiStage placeId={5} />);
      expect(pistes()?.status).toBe('off');
      act(() => pistes()?.onToggle());
      expect(pistes()?.status).toBe('on');
    });
  });
});
