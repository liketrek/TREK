// FE-ADMIN-DUS-001 to FE-ADMIN-DUS-027
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildAdmin } from '../../../tests/helpers/factories';
import { useAuthStore } from '../../store/authStore';
import { ToastContainer } from '../shared/Toast';
import DefaultUserSettingsTab from './DefaultUserSettingsTab';

// The tile preview would pull Leaflet into jsdom; the panel only needs it to render.
vi.mock('../Map/MapView', () => ({
  MapView: ({ tileUrl }: { tileUrl?: string }) => <div data-testid="map-preview" data-tile={tileUrl} />,
}));

const MAPBOX_STANDARD = 'mapbox://styles/mapbox/standard';
const MAPBOX_DARK = 'mapbox://styles/mapbox/dark-v11';
const MAPBOX_NAV_NIGHT = 'mapbox://styles/mapbox/navigation-night-v1';
const OFM_LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';
const TILE_PLACEHOLDER = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Stateful stand-in for the admin defaults endpoint: PUT merges, null deletes. */
function stubDefaults(initial: Record<string, unknown> = {}) {
  const state: Record<string, unknown> = { ...initial };
  const puts: Record<string, unknown>[] = [];
  server.use(
    http.get('/api/admin/default-user-settings', () => HttpResponse.json(state)),
    http.put('/api/admin/default-user-settings', async ({ request }) => {
      const body = await request.json() as Record<string, unknown>;
      puts.push(body);
      for (const [key, value] of Object.entries(body)) {
        if (value === null) delete state[key];
        else state[key] = value;
      }
      return HttpResponse.json({ ...state });
    }),
  );
  return { puts, state };
}

function withToast() {
  return render(<><ToastContainer /><DefaultUserSettingsTab /></>);
}

/** The selected option button is the one drawn with the strong border token. */
function isActive(button: HTMLElement): boolean {
  return (button.style.border || '').includes('var(--text-primary)');
}

/**
 * The reset link sits inside the field's own <label>; because a button is a labelable
 * element the wrapping label becomes its accessible name, so it is queried positionally.
 */
function resetLink(label: string): HTMLElement {
  const el = screen.getAllByText(label).find(node => node.tagName === 'LABEL');
  if (!el) throw new Error(`no label found for ${label}`);
  return within(el).getByRole('button');
}

function hasResetLink(label: string): boolean {
  const el = screen.getAllByText(label).find(node => node.tagName === 'LABEL');
  return !!el && within(el).queryByRole('button') !== null;
}

/** The CARTO key input sits under its label inside the field's own wrapper. */
function cartoInput(): HTMLInputElement {
  return within(screen.getByText('Shared CARTO key').closest('div') as HTMLElement).getByRole('textbox');
}

/** Opens a CustomSelect by its trigger label and picks an option from the portal. */
async function pickFromSelect(user: ReturnType<typeof userEvent.setup>, trigger: string, option: string) {
  await user.click(screen.getByRole('button', { name: trigger }));
  const choices = await screen.findAllByRole('button', { name: option });
  await user.click(choices[choices.length - 1]);
}

describe('DefaultUserSettingsTab', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
    stubDefaults();
  });

  it('FE-ADMIN-DUS-001: shows the loading placeholder until the defaults arrive', async () => {
    render(<DefaultUserSettingsTab />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    expect(await screen.findByText('Default User Settings')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-002: renders every field with no reset links while nothing is set', async () => {
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    for (const name of ['Light', 'Dark', 'Auto', '°C Celsius', 'km Metric', '24h (14:30)', 'On', 'Off']) {
      expect(isActive(screen.getByRole('button', { name }))).toBe(false);
    }
    for (const label of ['Color Mode', 'Temperature Unit', 'Distance Unit', 'Time Format', 'Display currency', 'Map Template']) {
      expect(hasResetLink(label)).toBe(false);
    }
    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-003: a failing load still renders the panel with built-in defaults', async () => {
    server.use(http.get('/api/admin/default-user-settings', () => HttpResponse.json({}, { status: 500 })));
    render(<DefaultUserSettingsTab />);

    expect(await screen.findByText('Default User Settings')).toBeInTheDocument();
    expect(hasResetLink('Map engine')).toBe(false);
    expect(isActive(screen.getByRole('button', { name: 'Standard (free)' }))).toBe(true);
  });

  it('FE-ADMIN-DUS-004: picking a colour mode saves it and confirms with a toast', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(await screen.findByText('Default saved')).toBeInTheDocument();
    expect(puts).toEqual([{ dark_mode: 'dark' }]);
    await waitFor(() => expect(isActive(screen.getByRole('button', { name: 'Dark' }))).toBe(true));
    expect(resetLink('Color Mode')).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-005: a legacy boolean dark_mode still highlights the matching option', async () => {
    stubDefaults({ dark_mode: true });
    const { unmount } = render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');
    expect(isActive(screen.getByRole('button', { name: 'Dark' }))).toBe(true);
    expect(isActive(screen.getByRole('button', { name: 'Light' }))).toBe(false);
    unmount();

    stubDefaults({ dark_mode: false });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');
    expect(isActive(screen.getByRole('button', { name: 'Light' }))).toBe(true);
    expect(isActive(screen.getByRole('button', { name: 'Auto' }))).toBe(false);
  });

  it('FE-ADMIN-DUS-006: unit and time-format options each save their own key', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    await waitFor(() => expect(resetLink('Temperature Unit')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'mi Imperial' }));
    await waitFor(() => expect(resetLink('Distance Unit')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: '12h (2:30 PM)' }));

    await waitFor(() => expect(puts).toEqual([
      { temperature_unit: 'fahrenheit' },
      { distance_unit: 'imperial' },
      { time_format: '12h' },
    ]));
  });

  it('FE-ADMIN-DUS-007: a set default gets a reset link that clears it server-side', async () => {
    const user = userEvent.setup();
    const { puts, state } = stubDefaults({ temperature_unit: 'celsius' });
    withToast();
    await screen.findByText('Default User Settings');

    expect(isActive(screen.getByRole('button', { name: '°C Celsius' }))).toBe(true);
    await user.click(resetLink('Temperature Unit'));

    expect(await screen.findByText('Reset to built-in default')).toBeInTheDocument();
    expect(puts).toEqual([{ temperature_unit: null }]);
    expect(state.temperature_unit).toBeUndefined();
    await waitFor(() => expect(hasResetLink('Temperature Unit')).toBe(false));
  });

  it('FE-ADMIN-DUS-008: the currency picker saves the chosen code and can be reset', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ default_currency: 'USD' });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await pickFromSelect(user, 'USD $', 'EUR €');
    await waitFor(() => expect(puts).toEqual([{ default_currency: 'EUR' }]));
    await waitFor(() => expect(screen.getByRole('button', { name: 'EUR €' })).toBeInTheDocument());

    await user.click(resetLink('Display currency'));
    await waitFor(() => expect(puts).toHaveLength(2));
    expect(puts[1]).toEqual({ default_currency: null });
  });

  it('FE-ADMIN-DUS-009: the blur-booking-codes options save booleans', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'On' }));
    await waitFor(() => expect(isActive(screen.getByRole('button', { name: 'On' }))).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Off' }));

    await waitFor(() => expect(puts).toEqual([
      { blur_booking_codes: true },
      { blur_booking_codes: false },
    ]));
  });

  it('FE-ADMIN-DUS-010: the tile preset dropdown fills the URL field and hands it to the preview', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await pickFromSelect(user, 'Select template...', 'CartoDB Dark');

    const url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    await waitFor(() => expect(puts).toEqual([{ map_tile_url: url }]));
    expect(screen.getByPlaceholderText(TILE_PLACEHOLDER)).toHaveValue(url);
    expect(screen.getByTestId('map-preview')).toHaveAttribute('data-tile', url);
  });

  it('FE-ADMIN-DUS-011: a hand-typed tile URL is saved on blur', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    const input = screen.getByPlaceholderText(TILE_PLACEHOLDER);
    // userEvent reads {...} as key descriptors, so the placeholders are omitted here
    await user.type(input, 'https://tiles.example.org/tile.png');
    fireEvent.blur(input);

    await waitFor(() => expect(puts).toEqual([{ map_tile_url: 'https://tiles.example.org/tile.png' }]));
    expect(screen.getByTestId('map-preview')).toHaveAttribute('data-tile', 'https://tiles.example.org/tile.png');
  });

  it('FE-ADMIN-DUS-012: resetting the tile URL clears the input too', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_tile_url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('button', { name: 'OpenStreetMap DE' })).toBeInTheDocument();
    await user.click(resetLink('Map Template'));

    await waitFor(() => expect(puts).toEqual([{ map_tile_url: null }]));
    await waitFor(() => expect(screen.getByPlaceholderText(TILE_PLACEHOLDER)).toHaveValue(''));
  });

  it('FE-ADMIN-DUS-013: leaflet hides the GL-only token and style fields', async () => {
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    expect(isActive(screen.getByRole('button', { name: 'Standard (free)' }))).toBe(true);
    expect(screen.queryByText('Map style')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared Mapbox token')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-014: switching to Mapbox stores the provider with its own style slot', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'Mapbox (3D)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD }]));
    expect(await screen.findByText('Shared Mapbox token')).toBeInTheDocument();
    expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-015: switching to MapLibre stores the OpenFreeMap default and hides the token field', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'MapLibre (OpenFreeMap)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'maplibre-gl', maplibre_style: OFM_LIBERTY }]));
    expect(await screen.findByText('Map style')).toBeInTheDocument();
    expect(screen.queryByText('Shared Mapbox token')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue(OFM_LIBERTY)).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-016: switching back to the standard engine only stores the provider', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Map style');

    await user.click(screen.getByRole('button', { name: 'Standard (free)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'leaflet' }]));
    await waitFor(() => expect(screen.queryByText('Map style')).not.toBeInTheDocument());
  });

  it('FE-ADMIN-DUS-017: a Mapbox default holding an OpenFreeMap style falls back to the Mapbox standard', async () => {
    stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: OFM_LIBERTY });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Map style');

    expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-018: a stored Mapbox style survives while the standard engine is active', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'leaflet', mapbox_style: MAPBOX_DARK });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    expect(screen.queryByText('Map style')).not.toBeInTheDocument();
    // Switching to Mapbox re-uses the stored slot instead of resetting it
    await user.click(screen.getByRole('button', { name: 'Mapbox (3D)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_DARK }]));
    expect(screen.getByDisplayValue(MAPBOX_DARK)).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-019: the shared Mapbox token is stored on blur and cleared by its reset link', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_access_token: 'pk.old' });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Shared Mapbox token');

    const input = screen.getByPlaceholderText('pk.eyJ…');
    expect(input).toHaveValue('pk.old');
    await user.clear(input);
    await user.type(input, 'pk.new');
    fireEvent.blur(input);
    await waitFor(() => expect(puts).toEqual([{ mapbox_access_token: 'pk.new' }]));

    // Clicking the reset link also blurs the field again, so only the last PUT is checked
    await user.click(resetLink('Shared Mapbox token'));
    await waitFor(() => expect(puts[puts.length - 1]).toEqual({ mapbox_access_token: null }));
    await waitFor(() => expect(screen.getByPlaceholderText('pk.eyJ…')).toHaveValue(''));
  });

  it('FE-ADMIN-DUS-020: a hand-typed MapLibre style is normalised to OpenFreeMap on blur', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'maplibre-gl', maplibre_style: OFM_LIBERTY });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Map style');

    const input = screen.getByDisplayValue(OFM_LIBERTY);
    await user.clear(input);
    await user.type(input, 'https://example.com/custom.json');
    fireEvent.blur(input);

    await waitFor(() => expect(puts).toEqual([{ maplibre_style: OFM_LIBERTY }]));
    expect(input).toHaveValue(OFM_LIBERTY);
  });

  it('FE-ADMIN-DUS-021: the style dropdown writes the picked preset into the active provider slot', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Map style');

    await pickFromSelect(user, 'Mapbox Standard', 'Navigation Night');

    await waitFor(() => expect(puts).toEqual([{ mapbox_style: MAPBOX_NAV_NIGHT }]));
    expect(screen.getByDisplayValue(MAPBOX_NAV_NIGHT)).toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-022: resetting the style restores the provider default in the field', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_DARK });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Map style');

    await user.click(resetLink('Map style'));

    await waitFor(() => expect(puts).toEqual([{ mapbox_style: null }]));
    await waitFor(() => expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument());
  });

  it('FE-ADMIN-DUS-023: the Mapbox 3D and quality options start on their built-in defaults and save their own keys', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('3D buildings & terrain');

    // 3D defaults to on, quality mode to off when neither is stored
    const threeD = within(screen.getByText('3D buildings & terrain').closest('div') as HTMLElement);
    expect(isActive(threeD.getByRole('button', { name: 'On' }))).toBe(true);
    const quality = within(screen.getByText('High-quality mode').closest('div') as HTMLElement);
    expect(isActive(quality.getByRole('button', { name: 'Off' }))).toBe(true);

    await user.click(threeD.getByRole('button', { name: 'Off' }));
    await waitFor(() => expect(puts).toEqual([{ mapbox_3d_enabled: false }]));
    await user.click(quality.getByRole('button', { name: 'On' }));
    await waitFor(() => expect(puts).toHaveLength(2));
    expect(puts[1]).toEqual({ mapbox_quality_mode: true });
  });

  it('FE-ADMIN-DUS-024: a rejected save surfaces the request error instead of a success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/default-user-settings', () => HttpResponse.json({})),
      http.put('/api/admin/default-user-settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(await screen.findByText(/Request failed with status code 500/)).toBeInTheDocument();
    expect(screen.queryByText('Default saved')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-025: a rejected reset surfaces the request error', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/default-user-settings', () => HttpResponse.json({ time_format: '12h' })),
      http.put('/api/admin/default-user-settings', () => HttpResponse.json({ error: 'nope' }, { status: 503 })),
    );
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(resetLink('Time Format'));

    expect(await screen.findByText(/Request failed with status code 503/)).toBeInTheDocument();
    expect(screen.queryByText('Reset to built-in default')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-DUS-026: the shared CARTO key is stored on blur and cleared by its reset link', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ carto_api_key: 'ck.old' });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Shared CARTO key');

    const input = cartoInput();
    expect(input).toHaveValue('ck.old');
    await user.clear(input);
    await user.type(input, 'ck.new');
    fireEvent.blur(input);
    await waitFor(() => expect(puts).toEqual([{ carto_api_key: 'ck.new' }]));

    // Clicking the reset link also blurs the field again, so only the last PUT is checked
    await user.click(resetLink('Shared CARTO key'));
    await waitFor(() => expect(puts[puts.length - 1]).toEqual({ carto_api_key: null }));
    await waitFor(() => expect(cartoInput()).toHaveValue(''));
  });

  it('FE-ADMIN-DUS-027: a managed instance hides the shared CARTO key field', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), managed: true });
    stubDefaults({ carto_api_key: 'ck.hoster' });
    render(<DefaultUserSettingsTab />);
    await screen.findByText('Default User Settings');

    expect(screen.queryByText('Shared CARTO key')).not.toBeInTheDocument();
  });
});
