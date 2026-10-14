// FE-PAGE-TOURSTAGE-001 to FE-PAGE-TOURSTAGE-005
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import type { MapViewProps } from '../../components/Map/mapViewContract';
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
  return { map, engine, listeners, fire, flatMap: { props: null as MapViewProps | null } };
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
vi.mock('../../components/Planner/LocationSelect', () => ({ default: () => <input aria-label="location search" /> }));

type Planner = TourPlannerMapStageProps['tourPlanner'];

function planner(
  mode: 'new-draft' | 'edit-saved' | 'view-saved' | 'view-gpx',
  overrides: Record<string, unknown> = {}
) {
  return {
    mode: { type: mode },
    isSaving: false,
    waypoints: [{ id: 'w1', lat: 46, lng: 7 }],
    selectedWaypointId: 'w1',
    setSelectedWaypointId: vi.fn(),
    setWaypointPosition: vi.fn(() => true),
    addWaypoint: vi.fn(),
    routeAnalysis: null,
    readOnlyGpxAnalysis: null,
    mapBaseLayer: 'default',
    setMapBaseLayer: vi.fn(),
    routeProfileFocus: null,
    setRouteProfileFocus: vi.fn(),
    ...overrides,
  } as unknown as Planner;
}

function renderStage(tourPlanner: Planner, canPlaceEdit = true) {
  const props = {
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
  return render(<TourPlannerMapStage {...props} />);
}

/** Switches the flat map to 3D and waits for the GL engine to load. */
async function openTerrain() {
  fireEvent.click(screen.getByRole('button', { name: 'flat map' }));
  await waitFor(() => expect(stage.engine.Marker).toHaveBeenCalled());
}

beforeEach(() => {
  stage.listeners.clear();
  stage.flatMap.props = null;
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {}))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TourPlannerMapStage', () => {
  it('FE-PAGE-TOURSTAGE-001: the flat map adds and moves control points while a tour is edited', () => {
    const tourPlanner = planner('new-draft');
    renderStage(tourPlanner);
    const props = stage.flatMap.props;
    expect(props?.plannerWaypoints).toEqual([{ id: 'w1', lat: 46, lng: 7 }]);
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

  it('FE-PAGE-TOURSTAGE-003: the 3D switch opens the terrain, where a click plans the next point', async () => {
    const tourPlanner = planner('edit-saved');
    renderStage(tourPlanner);
    await openTerrain();
    expect(screen.queryByRole('button', { name: 'flat map' })).toBeNull();
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
});
