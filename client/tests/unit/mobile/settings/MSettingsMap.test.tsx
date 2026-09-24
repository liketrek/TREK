// FE-MOB-SETMAP-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import type { Settings } from '../../../../src/types';
import MSettingsMap from '../../../../src/mobile/screens/settings/MSettingsMap';

// Leaflet and the GL preview need a real canvas — stub both and expose the
// props the screen feeds them so the preview wiring stays assertable.
vi.mock('../../../../src/components/Map/MapView', () => ({
  MapView: ({ tileUrl }: { tileUrl: string }) => <div data-testid="leaflet-preview" data-tile={tileUrl} />,
}));
vi.mock('../../../../src/components/Settings/MapboxPreview', () => ({
  default: ({ provider, token, style, enable3d, quality }: {
    provider: string; token: string; style: string; enable3d: boolean; quality: boolean;
  }) => (
    <div
      data-testid="gl-preview"
      data-provider={provider}
      data-token={token}
      data-style={style}
      data-3d={String(enable3d)}
      data-quality={String(quality)}
    />
  ),
}));

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function seedMap(over: Partial<Settings> = {}, updateSettings = vi.fn().mockResolvedValue(undefined)) {
  seedStore(useSettingsStore, {
    settings: buildSettings({ language: 'en', map_tile_url: '', ...over }),
    updateSettings,
  });
  return updateSettings;
}

/** The CARTO key input follows its eyebrow label in the card's flat layout. */
function cartoInput(): HTMLInputElement {
  return screen.getByText('CARTO API key').nextElementSibling as HTMLInputElement;
}

function renderMap() {
  return render(
    <>
      <ToastContainer />
      <MSettingsMap />
    </>,
  );
}

describe('MSettingsMap', () => {
  beforeEach(() => {
    resetAllStores();
    seedMap();
  });

  it('FE-MOB-SETMAP-001: offers the three providers with Leaflet active by default', () => {
    renderMap();

    expect(screen.getByText('Leaflet')).toBeInTheDocument();
    expect(screen.getByText('Mapbox GL')).toBeInTheDocument();
    expect(screen.getByText('MapLibre GL')).toBeInTheDocument();
    expect(screen.getByText('Classic 2D, any raster tiles')).toBeInTheDocument();
    expect(screen.getByTestId('leaflet-preview')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-002: the Leaflet branch shows the tile template row and the raw URL input', () => {
    seedMap({ map_tile_url: OSM_URL });
    renderMap();

    expect(screen.getByText('OpenStreetMap')).toBeInTheDocument();
    expect(screen.getByDisplayValue(OSM_URL)).toBeInTheDocument();
    expect(screen.getByTestId('leaflet-preview')).toHaveAttribute('data-tile', OSM_URL);
  });

  it('FE-MOB-SETMAP-003: an unknown tile URL falls back to the select placeholder', () => {
    seedMap({ map_tile_url: 'https://custom.tiles/{z}/{x}/{y}.png' });
    renderMap();

    expect(screen.getByText('Select template...')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-004: the template sheet writes the chosen preset into the URL field', async () => {
    const user = userEvent.setup();
    renderMap();

    await user.click(screen.getByRole('button', { name: /Select template/ }));
    await user.click(await screen.findByRole('button', { name: 'CartoDB Dark' }));

    expect(screen.getByDisplayValue('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-005: typing a tile URL feeds straight into the Leaflet preview', async () => {
    const user = userEvent.setup();
    renderMap();

    await user.type(screen.getByPlaceholderText(OSM_URL), 'https://tiles.test/a.png');
    expect(screen.getByTestId('leaflet-preview')).toHaveAttribute('data-tile', 'https://tiles.test/a.png');
  });

  it('FE-MOB-SETMAP-006: switching to Mapbox GL swaps in the token, style and 3D controls', async () => {
    const user = userEvent.setup();
    renderMap();

    await user.click(screen.getByText('Mapbox GL'));

    expect(screen.getByPlaceholderText('pk.eyJ1Ijoi...')).toBeInTheDocument();
    expect(screen.getByText('Mapbox Standard')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '3D Buildings & Terrain' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'High Quality Mode' })).toBeInTheDocument();
    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-provider', 'mapbox-gl');
    expect(screen.queryByTestId('leaflet-preview')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-007: MapLibre drops the token field and normalises to an OpenFreeMap style', async () => {
    const user = userEvent.setup();
    renderMap();

    await user.click(screen.getByText('MapLibre GL'));

    expect(screen.queryByPlaceholderText('pk.eyJ1Ijoi...')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: '3D Buildings & Terrain' })).not.toBeInTheDocument();
    expect(screen.getByText('OpenFreeMap Liberty')).toBeInTheDocument();
    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-style', 'https://tiles.openfreemap.org/styles/liberty');
    expect(screen.getByTestId('gl-preview')).toHaveAttribute('data-3d', 'false');
  });

  it('FE-MOB-SETMAP-008: a custom mapbox:// style shows the "pick a style" placeholder', async () => {
    const user = userEvent.setup();
    seedMap({ map_provider: 'mapbox-gl', mapbox_style: 'mapbox://styles/me/custom' });
    renderMap();

    expect(screen.getByText('Select a Mapbox style')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Select a Mapbox style/ }));
    await user.click(await screen.findByRole('button', { name: /Satellite Streets/ }));
    expect(screen.getByDisplayValue('mapbox://styles/mapbox/satellite-streets-v12')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-009: an unknown MapLibre style shows the OpenFreeMap placeholder', () => {
    seedMap({ map_provider: 'maplibre-gl', maplibre_style: 'https://tiles.openfreemap.org/styles/mine' });
    renderMap();

    expect(screen.getByText('Select an OpenFreeMap style')).toBeInTheDocument();
    expect(screen.getByText('Preset or OpenFreeMap style URL. OpenFreeMap styles work without a token.')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-010: a stored mapbox provider hydrates token, style and both switches', async () => {
    seedMap({
      map_provider: 'mapbox-gl',
      mapbox_access_token: 'pk.token',
      mapbox_style: 'mapbox://styles/mapbox/dark-v11',
      mapbox_3d_enabled: false,
      mapbox_quality_mode: true,
    });
    renderMap();

    expect(screen.getByDisplayValue('pk.token')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '3D Buildings & Terrain' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'High Quality Mode' })).toHaveAttribute('aria-checked', 'true');
    const preview = await screen.findByTestId('gl-preview');
    expect(preview).toHaveAttribute('data-token', 'pk.token');
    expect(preview).toHaveAttribute('data-3d', 'false');
    expect(preview).toHaveAttribute('data-quality', 'true');
  });

  it('FE-MOB-SETMAP-011: the 3D and quality switches drive the preview', async () => {
    const user = userEvent.setup();
    seedMap({ map_provider: 'mapbox-gl', mapbox_access_token: 'pk.token' });
    renderMap();

    await user.click(screen.getByRole('switch', { name: '3D Buildings & Terrain' }));
    await user.click(screen.getByRole('switch', { name: 'High Quality Mode' }));

    const preview = await screen.findByTestId('gl-preview');
    expect(preview).toHaveAttribute('data-3d', 'false');
    expect(preview).toHaveAttribute('data-quality', 'true');
  });

  it('FE-MOB-SETMAP-012: saving Leaflet persists the tile URL and keeps the mapbox style slot', async () => {
    const user = userEvent.setup();
    const updateSettings = seedMap({ map_tile_url: OSM_URL, mapbox_style: 'mapbox://styles/mapbox/dark-v11' });
    renderMap();

    await user.click(screen.getByRole('button', { name: 'Save Map' }));

    expect(updateSettings).toHaveBeenCalledWith({
      map_provider: 'leaflet',
      map_tile_url: OSM_URL,
      mapbox_access_token: '',
      carto_api_key: '',
      mapbox_style: 'mapbox://styles/mapbox/dark-v11',
      mapbox_3d_enabled: true,
      mapbox_quality_mode: false,
    });
    await screen.findByText('Map settings saved');
  });

  it('FE-MOB-SETMAP-013: saving MapLibre writes the maplibre slot, not the mapbox one', async () => {
    const user = userEvent.setup();
    const updateSettings = seedMap({ map_provider: 'maplibre-gl' });
    renderMap();

    await user.click(screen.getByRole('button', { name: 'Save Map' }));

    const saved = updateSettings.mock.calls[0][0] as Partial<Settings>;
    expect(saved.maplibre_style).toBe('https://tiles.openfreemap.org/styles/liberty');
    expect(saved).not.toHaveProperty('mapbox_style');
  });

  it('FE-MOB-SETMAP-014: a non-OpenFreeMap style typed for MapLibre is normalised on save', async () => {
    const user = userEvent.setup();
    const updateSettings = seedMap({ map_provider: 'maplibre-gl' });
    renderMap();

    const styleInput = screen.getByPlaceholderText('https://tiles.openfreemap.org/styles/liberty');
    await user.clear(styleInput);
    await user.type(styleInput, 'mapbox://styles/mapbox/streets-v12');
    await user.click(screen.getByRole('button', { name: 'Save Map' }));

    const saved = updateSettings.mock.calls[0][0] as Partial<Settings>;
    expect(saved.maplibre_style).toBe('https://tiles.openfreemap.org/styles/liberty');
    expect(screen.getByDisplayValue('https://tiles.openfreemap.org/styles/liberty')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-015: the save button is disabled while the request is in flight', async () => {
    const user = userEvent.setup();
    seedMap({}, vi.fn().mockReturnValue(new Promise(() => {})));
    renderMap();

    await user.click(screen.getByRole('button', { name: 'Save Map' }));
    expect(screen.getByRole('button', { name: 'Save Map' })).toBeDisabled();
  });

  it('FE-MOB-SETMAP-016: a failed save surfaces the error message', async () => {
    const user = userEvent.setup();
    seedMap({}, vi.fn().mockRejectedValue(new Error('Storage full')));
    renderMap();

    await user.click(screen.getByRole('button', { name: 'Save Map' }));
    await screen.findByText('Storage full');
    expect(screen.getByRole('button', { name: 'Save Map' })).toBeEnabled();
  });

  it('FE-MOB-SETMAP-017: a settings change from elsewhere re-syncs the local form', async () => {
    renderMap();

    seedMap({ map_tile_url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' });

    await waitFor(() =>
      expect(screen.getByDisplayValue('https://tile.openstreetmap.de/{z}/{x}/{y}.png')).toBeInTheDocument(),
    );
    expect(screen.getByText('OpenStreetMap DE')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-018: a typed Mapbox token reaches the preview and the save payload', async () => {
    const user = userEvent.setup();
    const updateSettings = seedMap({ map_provider: 'mapbox-gl' });
    renderMap();

    await user.type(screen.getByPlaceholderText('pk.eyJ1Ijoi...'), 'pk.new-token');
    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-token', 'pk.new-token');

    await user.click(screen.getByRole('button', { name: 'Save Map' }));
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ mapbox_access_token: 'pk.new-token', map_provider: 'mapbox-gl' }),
    );
  });

  it('FE-MOB-SETMAP-019: a mapbox style stored while MapLibre is active is not carried over', async () => {
    seedMap({ map_provider: 'maplibre-gl', maplibre_style: 'mapbox://styles/mapbox/dark-v11' });
    renderMap();

    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-style', 'https://tiles.openfreemap.org/styles/liberty');
  });

  it('FE-MOB-SETMAP-020: the Leaflet branch offers the CARTO key field', async () => {
    const user = userEvent.setup();
    renderMap();

    expect(screen.getByText('CARTO API key')).toBeInTheDocument();

    await user.click(screen.getByText('Mapbox GL'));

    expect(screen.queryByText('CARTO API key')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-021: a managed instance brings its own key and hides the field', () => {
    seedStore(useAuthStore, { managed: true });
    renderMap();

    expect(screen.queryByText('CARTO API key')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-022: a managed instance hides the Mapbox token field too', () => {
    seedStore(useAuthStore, { managed: true });
    seedMap({ map_provider: 'mapbox-gl' });
    renderMap();

    expect(screen.queryByPlaceholderText('pk.eyJ1Ijoi...')).not.toBeInTheDocument();
    expect(screen.getByText('Mapbox Standard')).toBeInTheDocument();
  });

  it('FE-MOB-SETMAP-023: the typed CARTO key reaches the save payload', async () => {
    const user = userEvent.setup();
    const updateSettings = seedMap();
    renderMap();

    await user.type(cartoInput(), 'demo-key');
    await user.click(screen.getByRole('button', { name: 'Save Map' }));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ carto_api_key: 'demo-key' }));
  });

  it('FE-MOB-SETMAP-024: a CARTO template without a key explains the watermark until one is typed', async () => {
    const user = userEvent.setup();
    seedMap({ map_tile_url: CARTO_DARK_TILES });
    renderMap();

    expect(screen.getByText(/API KEY REQUIRED/)).toBeInTheDocument();

    await user.type(cartoInput(), 'demo-key');

    expect(screen.queryByText(/API KEY REQUIRED/)).not.toBeInTheDocument();
  });
});
