// FE-COMP-MAP-001 to FE-COMP-MAP-017
import { render, screen, waitFor } from '../../../tests/helpers/render';
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
    await screen.findByText('Save failed');
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
