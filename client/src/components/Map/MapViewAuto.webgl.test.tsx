/**
 * The trip map without WebGL2 (FE-COMP-MAPAUTO-WEBGL-*).
 *
 * A browser that cannot give a GL engine its WebGL2 context sees the Leaflet map
 * with the user's tiles, never a map that fails to start: up front when the probe
 * says no, and the moment the GL map's own constructor is refused when it said yes.
 */
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { resetWebGLProbe } from '../../utils/webgl';
import { buildGlMap } from './glSupport';
import { MapViewAuto } from './MapViewAuto';
import { useMapLoadStatus } from './useMapLoadStatus';

const gl = vi.hoisted(() => ({ refuse: false, suspend: false, crash: false, failFirst: false, mounts: 0 }));

vi.mock('./MapView', () => ({
  MapView: () => <div data-testid="leaflet-map" />,
}));

/** Stands in for MapViewGL: builds its map the way the real one does, through buildGlMap. */
function FakeGlMap() {
  const report = useMapLoadStatus();
  useEffect(() => {
    gl.mounts += 1;
    buildGlMap(() => {
      if (!gl.refuse) return {};
      const err = new Error('WebGL2 is required to display this map.');
      err.name = 'GPUInitializationError';
      throw err;
    });
    if (!gl.refuse) report?.(gl.failFirst && gl.mounts === 1 ? 'failed' : 'ready');
  }, [report]);
  if (gl.crash) throw new Error('GL renderer failed');
  if (gl.suspend) throw new Promise(() => {});
  return <div data-testid="gl-map" />;
}

vi.mock('./glLazy', () => ({ MapViewGLMaplibre: FakeGlMap, MapViewGLMapbox: FakeGlMap }));
vi.mock('./useRoadtripHazards', () => ({ useRoadtripHazards: () => ({ feed: null }) }));

const realGetContext = HTMLCanvasElement.prototype.getContext;

function browserWithWebGL2(available: boolean) {
  const ctx = { getExtension: () => ({ loseContext: () => {} }) };
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) =>
    available && type === 'webgl2' ? ctx : null
  ) as unknown as typeof realGetContext;
}

beforeEach(() => {
  resetAllStores();
  resetWebGLProbe();
  gl.refuse = false;
  gl.suspend = false;
  gl.crash = false;
  gl.failFirst = false;
  gl.mounts = 0;
  seedStore(useSettingsStore, { settings: { map_provider: 'maplibre-gl', mapbox_access_token: '' } });
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  resetWebGLProbe();
});

describe('MapViewAuto without WebGL2', () => {
  it('FE-COMP-MAPAUTO-WEBGL-001: draws the MapLibre map where WebGL2 is there', async () => {
    browserWithWebGL2(true);

    render(<MapViewAuto places={[]} />);

    expect(await screen.findByTestId('gl-map')).toBeInTheDocument();
    expect(screen.queryByTestId('leaflet-map')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-WEBGL-002: draws the Leaflet map when the browser has no WebGL2', () => {
    browserWithWebGL2(false);

    render(<MapViewAuto places={[]} />);

    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
    expect(screen.queryByTestId('gl-map')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-WEBGL-003: falls back to Leaflet when the GPU refuses the context the probe promised', async () => {
    browserWithWebGL2(true);
    gl.refuse = true;

    render(<MapViewAuto places={[]} />);

    expect(await screen.findByTestId('leaflet-map')).toBeInTheDocument();
    expect(screen.queryByTestId('gl-map')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-WEBGL-004: does not mount Leaflet while the GL renderer is suspended', () => {
    browserWithWebGL2(true);
    gl.suspend = true;

    render(<MapViewAuto places={[]} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('gl-map')).not.toBeInTheDocument();
    expect(screen.queryByTestId('leaflet-map')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAPAUTO-WEBGL-005: a rejected renderer falls back without a stale loading notice', async () => {
    browserWithWebGL2(true);
    gl.crash = true;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(<MapViewAuto places={[]} tileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />);

      expect(await screen.findByTestId('leaflet-map')).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('FE-COMP-MAPAUTO-WEBGL-006: retry rebuilds only the GL renderer', async () => {
    browserWithWebGL2(true);
    gl.failFirst = true;

    render(<MapViewAuto places={[]} />);

    const alert = await screen.findByRole('alert');
    expect(gl.mounts).toBe(1);
    fireEvent.click(within(alert).getByRole('button'));

    await waitFor(() => expect(gl.mounts).toBe(2));
    expect(await screen.findByTestId('gl-map')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('leaflet-map')).not.toBeInTheDocument();
  });
});
