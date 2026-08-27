// FE-MOB-MDUS-001 to FE-MOB-MDUS-027
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '../../../helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildAdmin } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminDefaultUserSettings from '../../../../src/mobile/screens/admin/MAdminDefaultUserSettings';

// The live tile preview would pull Leaflet into jsdom; the panel only needs it to render.
vi.mock('../../../../src/components/Map/MapView', () => ({
  MapView: ({ tileUrl }: { tileUrl?: string }) => <div data-testid="map-preview" data-tile={tileUrl} />,
}));

const MAPBOX_STANDARD = 'mapbox://styles/mapbox/standard';
const OFM_LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';

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
  return render(<><ToastContainer /><MAdminDefaultUserSettings /></>);
}

/** The reset link lives inside the field label next to its caption. */
function resetLink(label: string): HTMLElement {
  const holder = screen.getAllByText(label).find(el => el.querySelector('button'));
  if (!holder) throw new Error(`no reset link next to "${label}"`);
  return within(holder).getByRole('button', { name: 'reset' });
}

/** The CARTO key input sits under its label inside the field's own wrapper. */
function cartoInput(): HTMLInputElement {
  return within(screen.getByText('Shared CARTO key').parentElement as HTMLElement).getByRole('textbox');
}

describe('MAdminDefaultUserSettings', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
    stubDefaults();
  });

  it('FE-MOB-MDUS-001: shows the loading placeholder until the defaults arrive', async () => {
    render(<MAdminDefaultUserSettings />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    expect(await screen.findByText('Default User Settings')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  it('FE-MOB-MDUS-002: renders every default field with no preselected segment when nothing is set', async () => {
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.getByText(/Set instance-wide defaults/)).toBeInTheDocument();
    for (const name of ['Light', 'Dark', 'Auto', '°C Celsius', 'km Metric', '24h (14:30)']) {
      expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'false');
    }
    // No default chosen yet → no reset links anywhere
    expect(screen.queryByRole('button', { name: 'reset' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Display currency' })).toBeInTheDocument();
    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
  });

  it('FE-MOB-MDUS-003: a failing load still renders the (empty) panel', async () => {
    server.use(http.get('/api/admin/default-user-settings', () => HttpResponse.json({}, { status: 500 })));
    render(<MAdminDefaultUserSettings />);

    expect(await screen.findByText('Default User Settings')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Standard (free)' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-MDUS-004: picking a colour mode saves it and shows the confirmation toast', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('tab', { name: 'Dark' }));

    expect(await screen.findByText('Default saved')).toBeInTheDocument();
    expect(puts).toEqual([{ dark_mode: 'dark' }]);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Dark' })).toHaveAttribute('aria-selected', 'true'));
  });

  it('FE-MOB-MDUS-005: a legacy boolean dark_mode still highlights the matching segment', async () => {
    stubDefaults({ dark_mode: true });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('tab', { name: 'Dark' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-MDUS-006: dark_mode false maps to Light, "auto" maps to Auto', async () => {
    stubDefaults({ dark_mode: false });
    const { unmount } = render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');
    expect(screen.getByRole('tab', { name: 'Light' })).toHaveAttribute('aria-selected', 'true');
    unmount();

    stubDefaults({ dark_mode: 'auto' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');
    expect(screen.getByRole('tab', { name: 'Auto' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-MDUS-007: unit and time-format segments each save their own key', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('tab', { name: '°F Fahrenheit' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: '°F Fahrenheit' })).toHaveAttribute('aria-selected', 'true'));
    await user.click(screen.getByRole('tab', { name: 'mi Imperial' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: 'mi Imperial' })).toHaveAttribute('aria-selected', 'true'));
    await user.click(screen.getByRole('tab', { name: '12h (2:30 PM)' }));

    await waitFor(() => expect(puts).toEqual([
      { temperature_unit: 'fahrenheit' },
      { distance_unit: 'imperial' },
      { time_format: '12h' },
    ]));
  });

  it('FE-MOB-MDUS-008: a set default gets a reset link that clears it server-side', async () => {
    const user = userEvent.setup();
    const { puts, state } = stubDefaults({ temperature_unit: 'celsius' });
    withToast();
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('tab', { name: '°C Celsius' })).toHaveAttribute('aria-selected', 'true');
    await user.click(resetLink('Temperature Unit'));

    expect(await screen.findByText('Reset to built-in default')).toBeInTheDocument();
    expect(puts).toEqual([{ temperature_unit: null }]);
    expect(state.temperature_unit).toBeUndefined();
    await waitFor(() => expect(screen.getByRole('tab', { name: '°C Celsius' })).toHaveAttribute('aria-selected', 'false'));
  });

  it('FE-MOB-MDUS-009: the currency row shows the symbol and the picker saves the chosen code', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ default_currency: 'USD' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'USD $' }));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'EUR €' }));

    await waitFor(() => expect(puts).toEqual([{ default_currency: 'EUR' }]));
    await waitFor(() => expect(screen.getByRole('button', { name: 'EUR €' })).toBeInTheDocument());
  });

  it('FE-MOB-MDUS-010: the blur-booking-codes toggle saves a boolean default', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    const toggle = screen.getByRole('switch', { name: 'Blur Booking Codes' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);

    await waitFor(() => expect(puts).toEqual([{ blur_booking_codes: true }]));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Blur Booking Codes' })).toHaveAttribute('aria-checked', 'true'));
  });

  it('FE-MOB-MDUS-011: the tile URL is saved on blur and handed to the preview map', async () => {
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    // Typed through fireEvent: the {z}/{x}/{y} placeholders collide with userEvent's key syntax
    const input = screen.getByPlaceholderText('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    fireEvent.change(input, { target: { value: 'https://tiles.example.org/{z}/{x}/{y}.png' } });
    fireEvent.blur(input);

    await waitFor(() => expect(puts).toEqual([{ map_tile_url: 'https://tiles.example.org/{z}/{x}/{y}.png' }]));
    expect(screen.getByTestId('map-preview')).toHaveAttribute('data-tile', 'https://tiles.example.org/{z}/{x}/{y}.png');
  });

  it('FE-MOB-MDUS-012: the tile preset sheet fills the URL field and saves it', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('button', { name: 'Select template...' }));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'CartoDB Dark' }));

    const url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    await waitFor(() => expect(puts).toEqual([{ map_tile_url: url }]));
    expect(screen.getByPlaceholderText('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toHaveValue(url);
    await waitFor(() => expect(screen.getByRole('button', { name: 'CartoDB Dark' })).toBeInTheDocument());
  });

  it('FE-MOB-MDUS-013: resetting the tile URL clears the input as well', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_tile_url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('button', { name: 'OpenStreetMap DE' })).toBeInTheDocument();
    await user.click(resetLink('Map Template'));

    await waitFor(() => expect(puts).toEqual([{ map_tile_url: null }]));
    await waitFor(() => expect(screen.getByPlaceholderText('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toHaveValue(''));
  });

  it('FE-MOB-MDUS-014: leaflet hides the GL-only token and style fields', async () => {
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('tab', { name: 'Standard (free)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Map style')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared Mapbox token')).not.toBeInTheDocument();
  });

  it('FE-MOB-MDUS-015: switching to Mapbox stores the provider together with its own style slot', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('tab', { name: 'Mapbox (3D)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD }]));
    expect(await screen.findByText('Shared Mapbox token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mapbox Standard' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '3D buildings & terrain' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'High-quality mode' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-MDUS-016: switching to MapLibre stores the OpenFreeMap default in maplibre_style', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults();
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('tab', { name: 'MapLibre (OpenFreeMap)' }));

    await waitFor(() => expect(puts).toEqual([{ map_provider: 'maplibre-gl', maplibre_style: OFM_LIBERTY }]));
    // MapLibre needs no shared token
    expect(screen.queryByText('Shared Mapbox token')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'OpenFreeMap Liberty' })).toBeInTheDocument();
  });

  it('FE-MOB-MDUS-017: a Mapbox default holding an OpenFreeMap style falls back to the Mapbox standard', async () => {
    stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: OFM_LIBERTY });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.getByRole('button', { name: 'Mapbox Standard' })).toBeInTheDocument();
    expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument();
  });

  it('FE-MOB-MDUS-018: the shared Mapbox token is stored on blur and cleared by its reset link', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_access_token: 'pk.old' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Shared Mapbox token');

    const input = screen.getByPlaceholderText('pk.eyJ…');
    expect(input).toHaveValue('pk.old');
    await user.clear(input);
    await user.type(input, 'pk.new');
    input.blur();
    await waitFor(() => expect(puts).toEqual([{ mapbox_access_token: 'pk.new' }]));

    await user.click(resetLink('Shared Mapbox token'));
    await waitFor(() => expect(puts).toHaveLength(2));
    expect(puts[1]).toEqual({ mapbox_access_token: null });
    await waitFor(() => expect(screen.getByPlaceholderText('pk.eyJ…')).toHaveValue(''));
  });

  it('FE-MOB-MDUS-019: a hand-typed MapLibre style is normalised to OpenFreeMap on blur', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'maplibre-gl', maplibre_style: OFM_LIBERTY });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Map style');

    const input = screen.getByDisplayValue(OFM_LIBERTY);
    await user.clear(input);
    await user.type(input, 'https://example.com/custom.json');
    input.blur();

    await waitFor(() => expect(puts).toEqual([{ maplibre_style: OFM_LIBERTY }]));
    expect(input).toHaveValue(OFM_LIBERTY);
  });

  it('FE-MOB-MDUS-020: the style sheet writes the picked preset into the active provider slot', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: MAPBOX_STANDARD });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Map style');

    await user.click(screen.getByRole('button', { name: 'Mapbox Standard' }));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'Navigation Night' }));

    const url = 'mapbox://styles/mapbox/navigation-night-v1';
    await waitFor(() => expect(puts).toEqual([{ mapbox_style: url }]));
    expect(screen.getByDisplayValue(url)).toBeInTheDocument();
  });

  it('FE-MOB-MDUS-021: resetting the style restores the provider default in the field', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_style: 'mapbox://styles/mapbox/dark-v11' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Map style');

    await user.click(resetLink('Map style'));

    await waitFor(() => expect(puts).toEqual([{ mapbox_style: null }]));
    await waitFor(() => expect(screen.getByDisplayValue(MAPBOX_STANDARD)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Mapbox Standard' })).toBeInTheDocument();
  });

  it('FE-MOB-MDUS-022: the Mapbox 3D and quality toggles save their own keys', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ map_provider: 'mapbox-gl', mapbox_3d_enabled: true, mapbox_quality_mode: false });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Map style');

    await user.click(screen.getByRole('switch', { name: '3D buildings & terrain' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: '3D buildings & terrain' })).toHaveAttribute('aria-checked', 'false'));
    await user.click(screen.getByRole('switch', { name: 'High-quality mode' }));

    await waitFor(() => expect(puts).toEqual([{ mapbox_3d_enabled: false }, { mapbox_quality_mode: true }]));
  });

  it('FE-MOB-MDUS-023: a rejected save surfaces the server error instead of a success toast', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/default-user-settings', () => HttpResponse.json({})),
      http.put('/api/admin/default-user-settings', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(screen.getByRole('tab', { name: 'Dark' }));

    expect(await screen.findByText('nope')).toBeInTheDocument();
    expect(screen.queryByText('Default saved')).not.toBeInTheDocument();
  });

  it('FE-MOB-MDUS-024: a rejected reset keeps the value and reports the failure', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/default-user-settings', () => HttpResponse.json({ temperature_unit: 'celsius' })),
      http.put('/api/admin/default-user-settings', () => HttpResponse.json({ error: 'nope' }, { status: 503 })),
    );
    withToast();
    await screen.findByText('Default User Settings');

    await user.click(resetLink('Temperature Unit'));

    expect(await screen.findByText('nope')).toBeInTheDocument();
    expect(screen.queryByText('Reset to built-in default')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '°C Celsius' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-MOB-MDUS-025: the shared CARTO key is stored on blur and cleared by its reset link', async () => {
    const user = userEvent.setup();
    const { puts } = stubDefaults({ carto_api_key: 'ck.old' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Shared CARTO key');

    const input = cartoInput();
    expect(input).toHaveValue('ck.old');
    await user.clear(input);
    await user.type(input, 'ck.new');
    input.blur();
    await waitFor(() => expect(puts).toEqual([{ carto_api_key: 'ck.new' }]));

    await user.click(resetLink('Shared CARTO key'));
    await waitFor(() => expect(puts).toHaveLength(2));
    expect(puts[1]).toEqual({ carto_api_key: null });
    await waitFor(() => expect(cartoInput()).toHaveValue(''));
  });

  it('FE-MOB-MDUS-026: a managed instance brings its own CARTO key and hides the field', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), managed: true });
    stubDefaults({ carto_api_key: 'ck.hoster' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Default User Settings');

    expect(screen.queryByText('Shared CARTO key')).not.toBeInTheDocument();
  });

  it('FE-MOB-MDUS-027: a managed instance hides the shared Mapbox token as well', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin(), managed: true });
    stubDefaults({ map_provider: 'mapbox-gl', mapbox_access_token: 'pk.hoster' });
    render(<MAdminDefaultUserSettings />);
    await screen.findByText('Map style');

    expect(screen.queryByText('Shared Mapbox token')).not.toBeInTheDocument();
  });
});
