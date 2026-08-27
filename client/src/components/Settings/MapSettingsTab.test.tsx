// FE-COMP-MAP-001 to FE-COMP-MAP-035
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import { ToastContainer } from '../shared/Toast';
import MapSettingsTab from './MapSettingsTab';

// Mock MapView to avoid Leaflet DOM issues in jsdom
vi.mock('../Map/MapView', () => ({
  MapView: ({ onMapClick }: { onMapClick?: (info: { latlng: { lat: number; lng: number } }) => void }) => (
    <div data-testid="map-view" onClick={() => onMapClick?.({ latlng: { lat: 51.5, lng: -0.1 } })} />
  ),
}));

// The GL preview boots a real mapbox/maplibre instance; the tab only cares that
// it gets the right provider/style, so render those as data attributes.
vi.mock('./MapboxPreview', () => ({
  default: ({ provider, style, token, enable3d, quality }: {
    provider?: string; style: string; token?: string; enable3d: boolean; quality?: boolean;
  }) => (
    <div
      data-testid="gl-preview"
      data-provider={provider}
      data-style={style}
      data-token={token}
      data-3d={String(enable3d)}
      data-quality={String(quality)}
    />
  ),
}));

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useSettingsStore, {
    settings: buildSettings({ map_tile_url: '' }),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  });
});

describe('MapSettingsTab', () => {
  it('FE-COMP-MAP-001: renders without crashing', () => {
    render(<MapSettingsTab />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-MAP-002: shows the Map section title', () => {
    render(<MapSettingsTab />);
    expect(screen.getByText('Map')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-003: shows the map template label', () => {
    render(<MapSettingsTab />);
    expect(screen.getByText('Map Template')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-004: no longer offers a default map centre — each map frames its own places', () => {
    render(<MapSettingsTab />);
    expect(screen.queryByText('Latitude')).not.toBeInTheDocument();
    expect(screen.queryByText('Longitude')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-009: tile URL text input is shown', () => {
    render(<MapSettingsTab />);
    const tileInput = screen.getByPlaceholderText(/openstreetmap/i);
    expect(tileInput).toBeInTheDocument();
  });

  it('FE-COMP-MAP-010: typing a custom tile URL updates the text input', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    const tileInput = screen.getByPlaceholderText(/openstreetmap/i);
    await user.clear(tileInput);
    // Escape curly braces so userEvent doesn't treat them as special keys
    await user.type(tileInput, 'https://custom.tiles/{{z}/{{x}/{{y}.png');
    expect(screen.getByDisplayValue('https://custom.tiles/{z}/{x}/{y}.png')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-011: clicking the Save Map button calls updateSettings', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: '' }),
      updateSettings,
    });
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Save Map'));
    expect(updateSettings).toHaveBeenCalledTimes(1);
    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      map_tile_url: expect.any(String),
      map_provider: expect.any(String),
    }));
  });

  it('FE-COMP-MAP-012: Save Map no longer writes a default centre or zoom', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: '' }),
      updateSettings,
    });
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Save Map'));

    const saved = updateSettings.mock.calls[0][0];
    expect(saved).not.toHaveProperty('default_lat');
    expect(saved).not.toHaveProperty('default_lng');
    expect(saved).not.toHaveProperty('default_zoom');
  });

  it('FE-COMP-MAP-013: Save Map button shows spinner while saving', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockReturnValue(new Promise(() => {}));
    seedStore(useSettingsStore, {
      settings: buildSettings(),
      updateSettings,
    });
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Save Map'));
    const saveBtn = screen.getByText('Save Map').closest('button')!;
    expect(saveBtn).toBeDisabled();
  });

  it('FE-COMP-MAP-014: Save Map error shows a toast', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockRejectedValue(new Error('Save failed'));
    seedStore(useSettingsStore, {
      settings: buildSettings(),
      updateSettings,
    });
    render(<><ToastContainer /><MapSettingsTab /></>);
    await user.click(screen.getByText('Save Map'));
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-016: preset dropdown is rendered', () => {
    render(<MapSettingsTab />);
    expect(screen.getByText('Select template...')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-017: settings update from store syncs local state', async () => {
    const { rerender } = render(<MapSettingsTab />);

    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: 'https://custom.tiles/{z}/{x}/{y}.png' }),
    });
    rerender(<MapSettingsTab />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://custom.tiles/{z}/{x}/{y}.png')).toBeInTheDocument();
    });
  });
});

// ── Provider switching and GL settings (018–030) ──────────────────────────────

const MAPBOX_STANDARD = 'mapbox://styles/mapbox/standard';
const OFM_LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';

/** The style preset picker sitting above the raw style input. */
function styleDropdown(): HTMLElement {
  return screen.getByText('Map Style').closest('div')!.querySelector('div.relative') as HTMLElement;
}

/** The ToggleSwitch belonging to a labelled GL option row. */
function toggleFor(label: string): HTMLElement {
  let el: HTMLElement | null = screen.getByText(label);
  while (el && !el.querySelector('button')) el = el.parentElement;
  return el!.querySelector('button') as HTMLElement;
}

describe('MapSettingsTab – GL providers', () => {
  it('FE-COMP-MAP-018: picking Mapbox GL reveals the token field, the style picker and the preview', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    await user.click(screen.getByText('Mapbox GL'));

    expect(screen.getByText('Mapbox Access Token')).toBeInTheDocument();
    expect(screen.getByText('Map Style')).toBeInTheDocument();
    expect(screen.queryByText('Map Template')).not.toBeInTheDocument();
    // The preview is lazy-loaded, so the first read of it has to await the chunk.
    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-provider', 'mapbox-gl');
    expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument();
  });

  it('FE-COMP-MAP-019: the style picker lists presets with their tag chips and applies the pick', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Mapbox GL'));

    const dropdown = styleDropdown();
    await user.click(within(dropdown).getByRole('button'));

    expect(within(dropdown).getByText('Satellite Streets')).toBeInTheDocument();
    expect(within(dropdown).getAllByText('Apple-like').length).toBeGreaterThan(0);

    await user.click(within(dropdown).getByText('Streets'));

    expect(screen.getByDisplayValue('mapbox://styles/mapbox/streets-v12')).toBeInTheDocument();
    expect(within(dropdown).queryByText('Satellite Streets')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-020: a mousedown outside the style picker closes it', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Mapbox GL'));

    const dropdown = styleDropdown();
    await user.click(within(dropdown).getByRole('button'));
    expect(within(dropdown).getByText('Satellite Streets')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(within(dropdown).queryByText('Satellite Streets')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-021: a custom style falls back to the picker placeholder', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Mapbox GL'));

    const styleInput = screen.getByDisplayValue(MAPBOX_STANDARD);
    await user.clear(styleInput);
    await user.type(styleInput, 'mapbox://styles/me/custom');

    expect(within(styleDropdown()).getByText('Select a Mapbox style')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-022: MapLibre needs no token and swaps in the OpenFreeMap presets', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    await user.click(screen.getByText('MapLibre GL'));

    expect(screen.queryByText('Mapbox Access Token')).not.toBeInTheDocument();
    expect(screen.queryByText('3D Buildings & Terrain')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue(OFM_LIBERTY)).toBeInTheDocument();
    expect(screen.getByText('Preset or OpenFreeMap style URL. OpenFreeMap styles work without a token.')).toBeInTheDocument();
    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-provider', 'maplibre-gl');
  });

  it('FE-COMP-MAP-023: switching from MapLibre back to Mapbox drops the OpenFreeMap style', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    await user.click(screen.getByText('MapLibre GL'));
    expect(screen.getByDisplayValue(OFM_LIBERTY)).toBeInTheDocument();

    await user.click(screen.getByText('Mapbox GL'));

    expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument();
  });

  it('FE-COMP-MAP-024: switching back to Leaflet restores the tile-template fields', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    await user.click(screen.getByText('Mapbox GL'));
    await user.click(screen.getByText('Leaflet'));

    expect(screen.getByText('Map Template')).toBeInTheDocument();
    expect(screen.queryByTestId('gl-preview')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-025: the token typed into the field reaches the preview', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Mapbox GL'));

    await user.type(screen.getByPlaceholderText('pk.eyJ1Ijoi...'), 'pk.token');

    expect(await screen.findByTestId('gl-preview')).toHaveAttribute('data-token', 'pk.token');
  });

  it('FE-COMP-MAP-026: the 3D and quality toggles drive the preview', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);
    await user.click(screen.getByText('Mapbox GL'));

    await screen.findByTestId('gl-preview');
    const preview = () => screen.getByTestId('gl-preview');
    expect(preview()).toHaveAttribute('data-3d', 'true');
    expect(preview()).toHaveAttribute('data-quality', 'false');

    await user.click(toggleFor('3D Buildings & Terrain'));
    expect(preview()).toHaveAttribute('data-3d', 'false');

    await user.click(toggleFor('High Quality Mode'));
    expect(preview()).toHaveAttribute('data-quality', 'true');
  });

  it('FE-COMP-MAP-027: saving under Mapbox writes the mapbox_style slot', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSettings });
    render(<MapSettingsTab />);

    await user.click(screen.getByText('Mapbox GL'));
    await user.click(screen.getByText('Save Map'));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      map_provider: 'mapbox-gl',
      mapbox_style: MAPBOX_STANDARD,
    }));
    expect(updateSettings.mock.calls[0][0]).not.toHaveProperty('maplibre_style');
  });

  it('FE-COMP-MAP-028: saving under MapLibre writes the maplibre_style slot instead', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSettings });
    render(<MapSettingsTab />);

    await user.click(screen.getByText('MapLibre GL'));
    await user.click(screen.getByText('Save Map'));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      map_provider: 'maplibre-gl',
      maplibre_style: OFM_LIBERTY,
    }));
    expect(updateSettings.mock.calls[0][0]).not.toHaveProperty('mapbox_style');
  });

  it('FE-COMP-MAP-029: a stored GL provider is restored from the settings', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({
        map_provider: 'maplibre-gl',
        maplibre_style: 'https://tiles.openfreemap.org/styles/bright',
      }),
    });
    render(<MapSettingsTab />);

    expect(screen.getByDisplayValue('https://tiles.openfreemap.org/styles/bright')).toBeInTheDocument();
    expect(within(styleDropdown()).getByText('OpenFreeMap Bright')).toBeInTheDocument();
  });

  it('FE-COMP-MAP-030: picking a Leaflet template fills the tile URL input', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    await user.click(screen.getByText('Select template...'));
    await user.click(await screen.findByText('CartoDB Dark'));

    expect(screen.getByDisplayValue('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png')).toBeInTheDocument();
  });
});

// ── CARTO key (031–035) ─────────────────────────────────────────────

const CARTO_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

/** The key input sits under its label inside the field's own wrapper. */
function cartoInput(): HTMLInputElement {
  return within(screen.getByText('CARTO API key').closest('div') as HTMLElement).getByRole('textbox');
}

describe('MapSettingsTab – CARTO key', () => {
  it('FE-COMP-MAP-031: the key field belongs to Leaflet and goes away with the GL providers', async () => {
    const user = userEvent.setup();
    render(<MapSettingsTab />);

    expect(screen.getByText('CARTO API key')).toBeInTheDocument();

    await user.click(screen.getByText('Mapbox GL'));

    expect(screen.queryByText('CARTO API key')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-032: a managed instance brings its own key, so the field is hidden', () => {
    seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true, managed: true });
    render(<MapSettingsTab />);

    expect(screen.queryByText('CARTO API key')).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-033: the typed key is part of the save patch', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: CARTO_DARK_TILES }),
      updateSettings,
    });
    render(<MapSettingsTab />);

    await user.type(cartoInput(), 'demo-key');
    await user.click(screen.getByText('Save Map'));

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ carto_api_key: 'demo-key' }));
  });

  it('FE-COMP-MAP-034: a CARTO template without a key explains the watermark until one is typed', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: CARTO_DARK_TILES }),
      updateSettings: vi.fn().mockResolvedValue(undefined),
    });
    render(<MapSettingsTab />);

    expect(screen.getByText(/API KEY REQUIRED/)).toBeInTheDocument();

    await user.type(cartoInput(), 'demo-key');

    expect(screen.queryByText(/API KEY REQUIRED/)).not.toBeInTheDocument();
  });

  it('FE-COMP-MAP-035: a template on another host never gets that notice', () => {
    seedStore(useSettingsStore, {
      settings: buildSettings({ map_tile_url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }),
      updateSettings: vi.fn().mockResolvedValue(undefined),
    });
    render(<MapSettingsTab />);

    expect(screen.queryByText(/API KEY REQUIRED/)).not.toBeInTheDocument();
  });
});
