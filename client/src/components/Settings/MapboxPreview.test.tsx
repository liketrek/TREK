// FE-COMP-GLPREVIEW-001 to FE-COMP-GLPREVIEW-014
import { render, screen, act } from '../../../tests/helpers/render';

type ClickHandler = (e: { lngLat: { lat: number; lng: number } }) => void;

const glHandlers = vi.hoisted(() => ({
  load: undefined as (() => void) | undefined,
  click: undefined as ClickHandler | undefined,
  reset() {
    this.load = undefined;
    this.click = undefined;
  },
}));

const glMap = vi.hoisted(() => ({
  on: vi.fn((event: string, cb: unknown) => {
    if (event === 'load') glHandlers.load = cb as () => void;
    if (event === 'click') glHandlers.click = cb as ClickHandler;
  }),
  remove: vi.fn(),
  jumpTo: vi.fn(),
  setTerrain: vi.fn(),
}));

const mapboxCtor = vi.hoisted(() => vi.fn(function (_options: Record<string, unknown>) {
  return glMap;
}));
const maplibreCtor = vi.hoisted(() => vi.fn(function (_options: Record<string, unknown>) {
  return glMap;
}));
const mapboxModule = vi.hoisted(() => ({ accessToken: '', Map: mapboxCtor }));

vi.mock('mapbox-gl', () => ({ default: mapboxModule }));
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));
vi.mock('maplibre-gl', () => ({ default: { Map: maplibreCtor } }));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

vi.mock('../Map/mapboxSetup', () => ({
  isStandardFamily: vi.fn(() => false),
  supportsCustom3d: vi.fn(() => true),
  addCustom3dBuildings: vi.fn(),
  addTerrainAndSky: vi.fn(),
}));

import { isStandardFamily, supportsCustom3d, addCustom3dBuildings, addTerrainAndSky } from '../Map/mapboxSetup';
import { MAPBOX_DEFAULT_STYLE, OPENFREEMAP_DEFAULT_STYLE } from '../Map/glProviders';
import mapboxgl from 'mapbox-gl';
import maplibregl from 'maplibre-gl';
import GlMapPreviewWithEngine from './MapboxPreview';

// The engine is a prop now, not a module import — that is what keeps mapbox-gl and
// maplibre-gl in separate chunks. This shim preserves the suite's existing call
// shape and makes the same choice glLazy.tsx makes in production, so the vi.mock
// factories below still stand in for the right SDK.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlMapPreview(props: any) {
  return <GlMapPreviewWithEngine {...props} gl={props.provider === 'maplibre-gl' ? maplibregl : mapboxgl} />;
}

const STREETS = 'mapbox://styles/mapbox/streets-v12';

function mapOptions(ctor: typeof mapboxCtor): Record<string, unknown> {
  return ctor.mock.calls[0][0] as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  glHandlers.reset();
  mapboxModule.accessToken = '';
  document.documentElement.classList.remove('dark');
  vi.mocked(isStandardFamily).mockReturnValue(false);
  vi.mocked(supportsCustom3d).mockReturnValue(true);
});

describe('GlMapPreview', () => {
  it('FE-COMP-GLPREVIEW-001: without a Mapbox token it shows the hint instead of a map', () => {
    render(<GlMapPreview token="" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} />);

    expect(screen.getByText('Enter a Mapbox access token to preview')).toBeInTheDocument();
    expect(mapboxCtor).not.toHaveBeenCalled();
    expect(glMap.jumpTo).not.toHaveBeenCalled();
  });

  it('FE-COMP-GLPREVIEW-002: a token creates a Mapbox map centred on the given coordinates', () => {
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8566} lng={2.3522} zoom={16} enable3d={false} />);

    expect(mapboxModule.accessToken).toBe('pk.test');
    expect(mapboxCtor).toHaveBeenCalledTimes(1);
    expect(mapOptions(mapboxCtor)).toMatchObject({
      style: STREETS,
      center: [2.3522, 48.8566],
      zoom: 16,
      pitch: 0,
      antialias: false,
      projection: 'mercator',
    });
    expect(screen.queryByText('Enter a Mapbox access token to preview')).not.toBeInTheDocument();
  });

  it('FE-COMP-GLPREVIEW-003: 3D pitches the camera on mount', () => {
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d />);

    expect(mapOptions(mapboxCtor).pitch).toBe(45);
  });

  it('FE-COMP-GLPREVIEW-004: quality mode enables the globe projection and antialiasing', () => {
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} quality />);

    expect(mapOptions(mapboxCtor)).toMatchObject({ projection: 'globe', antialias: true });
  });

  it('FE-COMP-GLPREVIEW-005: MapLibre needs no token and never asks for a projection', () => {
    render(
      <GlMapPreview
        provider="maplibre-gl"
        style={OPENFREEMAP_DEFAULT_STYLE}
        lat={48.8}
        lng={2.3}
        zoom={16}
        enable3d
      />,
    );

    expect(maplibreCtor).toHaveBeenCalledTimes(1);
    expect(mapboxCtor).not.toHaveBeenCalled();
    const opts = mapOptions(maplibreCtor);
    expect(opts).toMatchObject({ aroundCenter: false, style: OPENFREEMAP_DEFAULT_STYLE, pitch: 0 });
    expect(opts).not.toHaveProperty('projection');
  });

  it('FE-COMP-GLPREVIEW-006: a Mapbox style is coerced to the OpenFreeMap default under MapLibre', () => {
    render(<GlMapPreview provider="maplibre-gl" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} />);

    expect(mapOptions(maplibreCtor).style).toBe(OPENFREEMAP_DEFAULT_STYLE);
  });

  it('FE-COMP-GLPREVIEW-007: loading a 3D-capable custom style adds terrain and buildings', () => {
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d />);
    act(() => glHandlers.load?.());

    expect(addTerrainAndSky).toHaveBeenCalledWith(glMap);
    expect(addCustom3dBuildings).toHaveBeenCalledWith(glMap, false);
    expect(glMap.setTerrain).not.toHaveBeenCalled();
  });

  it('FE-COMP-GLPREVIEW-008: dark mode is passed through to the 3D building colours', () => {
    document.documentElement.classList.add('dark');
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d />);
    act(() => glHandlers.load?.());

    expect(addCustom3dBuildings).toHaveBeenCalledWith(glMap, true);
  });

  it('FE-COMP-GLPREVIEW-009: a Standard-family style skips terrain and the custom building layer', () => {
    vi.mocked(isStandardFamily).mockReturnValue(true);
    vi.mocked(supportsCustom3d).mockReturnValue(false);
    render(<GlMapPreview token="pk.test" style={MAPBOX_DEFAULT_STYLE} lat={48.8} lng={2.3} zoom={16} enable3d />);
    act(() => glHandlers.load?.());

    expect(addTerrainAndSky).not.toHaveBeenCalled();
    expect(addCustom3dBuildings).not.toHaveBeenCalled();
    // The default style ships its own terrain, so the preview clears ours.
    expect(glMap.setTerrain).toHaveBeenCalledWith(null);
  });

  it('FE-COMP-GLPREVIEW-010: a failing setTerrain on load is swallowed', () => {
    glMap.setTerrain.mockImplementationOnce(() => {
      throw new Error('no terrain');
    });
    render(<GlMapPreview token="pk.test" style={MAPBOX_DEFAULT_STYLE} lat={48.8} lng={2.3} zoom={16} enable3d={false} />);

    expect(() => act(() => glHandlers.load?.())).not.toThrow();
  });

  it('FE-COMP-GLPREVIEW-011: with 3D off nothing is added on load', () => {
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} />);
    act(() => glHandlers.load?.());

    expect(addTerrainAndSky).not.toHaveBeenCalled();
    expect(addCustom3dBuildings).not.toHaveBeenCalled();
  });

  it('FE-COMP-GLPREVIEW-012: a map click reports the picked coordinates', () => {
    const onClick = vi.fn();
    render(<GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} onClick={onClick} />);

    act(() => glHandlers.click?.({ lngLat: { lat: 51.5, lng: -0.12 } }));

    expect(onClick).toHaveBeenCalledWith({ lat: 51.5, lng: -0.12 });
  });

  it('FE-COMP-GLPREVIEW-013: moving the centre recenters instead of rebuilding the map', () => {
    const { rerender } = render(
      <GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} />,
    );
    glMap.jumpTo.mockClear();

    rerender(<GlMapPreview token="pk.test" style={STREETS} lat={51.5} lng={-0.12} zoom={12} enable3d={false} />);

    expect(glMap.jumpTo).toHaveBeenCalledWith({ center: [-0.12, 51.5], zoom: 12 });
    expect(mapboxCtor).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-GLPREVIEW-014: a failing jumpTo is swallowed and unmounting removes the map', () => {
    glMap.jumpTo.mockImplementationOnce(() => {
      throw new Error('not ready');
    });
    const { unmount } = render(
      <GlMapPreview token="pk.test" style={STREETS} lat={48.8} lng={2.3} zoom={16} enable3d={false} />,
    );

    expect(glMap.jumpTo).toHaveBeenCalled();
    glMap.remove.mockImplementationOnce(() => {
      throw new Error('already gone');
    });
    expect(() => unmount()).not.toThrow();
    expect(glMap.remove).toHaveBeenCalled();
  });
});
