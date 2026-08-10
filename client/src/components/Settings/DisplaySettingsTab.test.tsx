// FE-COMP-DISPLAY-001 to FE-COMP-DISPLAY-052
import { render, screen, within, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import DisplaySettingsTab from './DisplaySettingsTab';
import { ToastContainer } from '../shared/Toast';

beforeEach(() => {
  resetAllStores();
  server.use(
    http.put('/api/settings', async () => HttpResponse.json({ success: true })),
  );
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light', language: 'en' }) });
});

describe('DisplaySettingsTab', () => {
  it('FE-COMP-DISPLAY-001: renders without crashing', () => {
    render(<DisplaySettingsTab />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-002: shows the language & region section title', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Language & region')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-006: shows Language section', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-007: shows Time Format section', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Time Format')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-010: shows 24h time format option', () => {
    render(<DisplaySettingsTab />);
    // Label is "24h (14:30)"
    expect(screen.getByText(/24h/i)).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-011: shows 12h time format option', () => {
    render(<DisplaySettingsTab />);
    // Label is "12h (2:30 PM)"
    expect(screen.getByText(/12h/i)).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-015: clicking a language button calls updateSetting with that language code', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('Deutsch'));
    expect(updateSetting).toHaveBeenCalledWith('language', 'de');
  });

  it('FE-COMP-DISPLAY-016: active language button is visually highlighted', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }) });
    render(<DisplaySettingsTab />);
    // Multiple elements contain "English" (desktop grid button + mobile dropdown trigger).
    // The desktop grid button is the one with the active border style.
    const englishMatches = screen.getAllByText('English').map(el => el.closest('button')!).filter(Boolean);
    const activeBtn = englishMatches.find(btn => (btn.style.border || '').includes('var(--text-primary)'));
    expect(activeBtn).toBeDefined();
  });

  it('FE-COMP-DISPLAY-017: shows Temperature section label', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText(/temperature/i)).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-018: celsius button is active when temperature_unit is celsius', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ temperature_unit: 'celsius' }) });
    render(<DisplaySettingsTab />);
    const celsiusBtn = screen.getByText('°C Celsius').closest('button')!;
    expect(celsiusBtn.style.border).toContain('var(--text-primary)');
  });

  it('FE-COMP-DISPLAY-019: clicking fahrenheit button calls updateSetting with fahrenheit', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ temperature_unit: 'celsius' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('°F Fahrenheit'));
    expect(updateSetting).toHaveBeenCalledWith('temperature_unit', 'fahrenheit');
  });

  it('FE-COMP-DISPLAY-028: metric distance button is active by default', () => {
    seedStore(useSettingsStore, { settings: { temperature_unit: 'celsius' } });
    render(<DisplaySettingsTab />);
    const metricBtn = screen.getByText('km Metric').closest('button')!;
    expect(metricBtn.style.border).toContain('var(--text-primary)');
  });

  it('FE-COMP-DISPLAY-029: clicking imperial distance calls updateSetting with imperial', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('mi Imperial'));
    expect(updateSetting).toHaveBeenCalledWith('distance_unit', 'imperial');
  });

  it('FE-COMP-DISPLAY-020: clicking 24h time format calls updateSetting with 24h', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }), updateSetting });
    render(<DisplaySettingsTab />);
    // The label is split across a text node ('24h') and a responsive span (' (14:30)').
    // Click the button that contains the 24h text instead of matching the full string.
    await user.click(screen.getByRole('button', { name: /24h/ }));
    expect(updateSetting).toHaveBeenCalledWith('time_format', '24h');
  });

  it('FE-COMP-DISPLAY-024: shows Blur Booking Codes section', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText(/blur booking codes/i)).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-025: blur booking codes On button is active when blur_booking_codes is true', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ blur_booking_codes: true }) });
    render(<DisplaySettingsTab />);
    const block = screen.getByText(/blur booking codes/i).closest('div')!;
    const blurOnBtn = within(block).getByText(/^On$/i).closest('button')!;
    expect(blurOnBtn.style.border).toContain('var(--text-primary)');
  });

  it('FE-COMP-DISPLAY-030: shows Always show booking routes next to Booking route labels', () => {
    render(<DisplaySettingsTab />);
    const bookingLabels = screen.getByText(/booking route labels/i);
    const alwaysShow = screen.getByText(/always show booking routes/i);
    expect(alwaysShow).toBeInTheDocument();
    // Adjacent siblings within the Travel & Map section: alwaysShow's block
    // immediately follows bookingLabels' block.
    expect(bookingLabels.closest('div')!.nextElementSibling).toBe(alwaysShow.closest('div'));
  });

  it('FE-COMP-DISPLAY-031: always-show-routes Off button is active by default (unset)', () => {
    render(<DisplaySettingsTab />);
    const block = screen.getByText(/always show booking routes/i).closest('div')!;
    const offBtn = within(block).getByText(/^Off$/i).closest('button')!;
    expect(offBtn.style.border).toContain('var(--text-primary)');
  });

  it('FE-COMP-DISPLAY-032: clicking On for always-show-routes calls updateSetting with map_always_show_routes true', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSetting });
    render(<DisplaySettingsTab />);
    const block = screen.getByText(/always show booking routes/i).closest('div')!;
    await user.click(within(block).getByText(/^On$/i));
    expect(updateSetting).toHaveBeenCalledWith('map_always_show_routes', true);
  });

  it('FE-COMP-DISPLAY-026: updateSetting failure shows toast error', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockRejectedValue(new Error('Server error'));
    seedStore(useSettingsStore, { settings: buildSettings({ temperature_unit: 'celsius' }), updateSetting });
    render(<><ToastContainer /><DisplaySettingsTab /></>);
    await user.click(screen.getByText('°F Fahrenheit'));
    await screen.findByText('Server error');
  });

  it('FE-COMP-DISPLAY-027: temperature unit local state updates optimistically before API resolves', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockReturnValue(new Promise(() => {}));
    seedStore(useSettingsStore, { settings: buildSettings({ temperature_unit: 'celsius' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('°F Fahrenheit'));
    const fahrenheitBtn = screen.getByText('°F Fahrenheit').closest('button')!;
    expect(fahrenheitBtn.style.border).toContain('var(--text-primary)');
  });
});

// ── Display currency (033–034) ────────────────────────────────────────────────

function seedFailing(message = 'Server error') {
  const updateSetting = vi.fn().mockRejectedValue(new Error(message));
  seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }), updateSetting });
  return updateSetting;
}

/** The block of buttons belonging to one labelled setting. */
function optionBlock(label: RegExp): HTMLElement {
  return screen.getByText(label).closest('div') as HTMLElement;
}

describe('DisplaySettingsTab – Display currency', () => {
  it('FE-COMP-DISPLAY-033: picking "Trip currency" clears the personal display currency', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ default_currency: 'USD' }), updateSetting });
    render(<DisplaySettingsTab />);

    await user.click(screen.getByRole('button', { name: /USD/ }));
    await user.click(await screen.findByText('Trip currency'));

    expect(updateSetting).toHaveBeenCalledWith('default_currency', '');
  });

  it('FE-COMP-DISPLAY-034: a rejected currency change surfaces the error', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockRejectedValue(new Error('Currency locked'));
    seedStore(useSettingsStore, { settings: buildSettings({ default_currency: 'USD' }), updateSetting });
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(screen.getByRole('button', { name: /USD/ }));
    await user.click(await screen.findByText('Trip currency'));

    await screen.findByText('Currency locked');
  });
});

// ── Compact language dropdown (035–039) ───────────────────────────────────────

function mobileLangWrap(): HTMLElement {
  return screen.getByText('Language').closest('div')!.querySelector('.sm\\:hidden') as HTMLElement;
}

describe('DisplaySettingsTab – Compact language picker', () => {
  it('FE-COMP-DISPLAY-035: the compact trigger shows the active language and opens the list', async () => {
    const user = userEvent.setup();
    render(<DisplaySettingsTab />);
    const wrap = mobileLangWrap();

    expect(within(wrap).getAllByRole('button')).toHaveLength(1);
    expect(within(wrap).getByText('English')).toBeInTheDocument();

    await user.click(within(wrap).getByRole('button'));

    expect(within(wrap).getAllByRole('button').length).toBeGreaterThan(1);
  });

  it('FE-COMP-DISPLAY-036: picking a language from the list saves it and closes the list', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }), updateSetting });
    render(<DisplaySettingsTab />);
    const wrap = mobileLangWrap();

    await user.click(within(wrap).getByRole('button'));
    await user.click(within(wrap).getByText('Deutsch').closest('button')!);

    expect(updateSetting).toHaveBeenCalledWith('language', 'de');
    expect(within(wrap).getAllByRole('button')).toHaveLength(1);
  });

  it('FE-COMP-DISPLAY-037: a rejected pick from the list surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('Language locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);
    const wrap = mobileLangWrap();

    await user.click(within(wrap).getByRole('button'));
    await user.click(within(wrap).getByText('Deutsch').closest('button')!);

    await screen.findByText('Language locked');
  });

  it('FE-COMP-DISPLAY-048: a rejected pick from the desktop grid surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('Language locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(screen.getByText('Deutsch'));

    await screen.findByText('Language locked');
  });

  it('FE-COMP-DISPLAY-038: a mousedown outside the picker closes it', async () => {
    const user = userEvent.setup();
    render(<DisplaySettingsTab />);
    const wrap = mobileLangWrap();

    await user.click(within(wrap).getByRole('button'));
    expect(within(wrap).getAllByRole('button').length).toBeGreaterThan(1);

    fireEvent.mouseDown(document.body);

    expect(within(wrap).getAllByRole('button')).toHaveLength(1);
  });

  it('FE-COMP-DISPLAY-039: a mousedown inside the picker keeps it open', async () => {
    const user = userEvent.setup();
    render(<DisplaySettingsTab />);
    const wrap = mobileLangWrap();

    await user.click(within(wrap).getByRole('button'));
    fireEvent.mouseDown(within(wrap).getByText('Deutsch'));

    expect(within(wrap).getAllByRole('button').length).toBeGreaterThan(1);
  });
});

// ── Map & privacy toggles (040–047) ───────────────────────────────────────────

describe('DisplaySettingsTab – Map and privacy toggles', () => {
  it('FE-COMP-DISPLAY-040: turning booking route labels off persists false', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ map_booking_labels: true }), updateSetting });
    render(<DisplaySettingsTab />);

    await user.click(within(optionBlock(/booking route labels/i)).getByText(/^Off$/));

    expect(updateSetting).toHaveBeenCalledWith('map_booking_labels', false);
  });

  it('FE-COMP-DISPLAY-041: a rejected booking-labels change surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('Labels locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(within(optionBlock(/booking route labels/i)).getByText(/^On$/));

    await screen.findByText('Labels locked');
  });

  it('FE-COMP-DISPLAY-042: a rejected always-show-routes change surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('Routes locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(within(optionBlock(/always show booking routes/i)).getByText(/^On$/));

    await screen.findByText('Routes locked');
  });

  it('FE-COMP-DISPLAY-043: the POI pill defaults to On and can be turned off', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSetting });
    render(<DisplaySettingsTab />);
    const block = optionBlock(/explore places on the map/i);

    expect(within(block).getByText(/^On$/).closest('button')!.style.border).toContain('var(--text-primary)');
    await user.click(within(block).getByText(/^Off$/));

    expect(updateSetting).toHaveBeenCalledWith('map_poi_pill_enabled', false);
  });

  it('FE-COMP-DISPLAY-044: a rejected POI pill change surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('POI locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(within(optionBlock(/explore places on the map/i)).getByText(/^Off$/));

    await screen.findByText('POI locked');
  });

  it('FE-COMP-DISPLAY-045: turning blur booking codes on persists true', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ blur_booking_codes: false }), updateSetting });
    render(<DisplaySettingsTab />);

    await user.click(within(optionBlock(/blur booking codes/i)).getByText(/^On$/));

    expect(updateSetting).toHaveBeenCalledWith('blur_booking_codes', true);
  });

  it('FE-COMP-DISPLAY-046: the accommodation optimisation defaults to On and can be turned off', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSetting });
    render(<DisplaySettingsTab />);
    const block = optionBlock(/optimize route from accommodation/i);

    expect(within(block).getByText(/^On$/).closest('button')!.style.border).toContain('var(--text-primary)');
    await user.click(within(block).getByText(/^Off$/));

    expect(updateSetting).toHaveBeenCalledWith('optimize_from_accommodation', false);
  });

  it('FE-COMP-DISPLAY-047: rejected blur, optimisation, distance and time-format changes all toast', async () => {
    const user = userEvent.setup();
    seedFailing('Nope');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(within(optionBlock(/blur booking codes/i)).getByText(/^On$/));
    await screen.findByText('Nope');

    await user.click(within(optionBlock(/optimize route from accommodation/i)).getByText(/^Off$/));
    await user.click(screen.getByText('mi Imperial'));
    await user.click(screen.getByRole('button', { name: /24h/ }));

    expect(screen.getAllByText('Nope').length).toBeGreaterThan(0);
  });
});

describe('DisplaySettingsTab – startup destination', () => {
  it('FE-COMP-DISPLAY-049: defaults to the dashboard and hides the tab picker', () => {
    seedStore(useSettingsStore, { settings: buildSettings() });
    render(<DisplaySettingsTab />);
    const block = optionBlock(/^Start page$/);

    expect(within(block).getByText('Dashboard').closest('button')!.style.border).toContain('var(--text-primary)');
    // Nothing to pick a tab for while TREK opens on the dashboard.
    expect(screen.queryByText('Start tab')).not.toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-050: choosing the active trip saves it and reveals the tab picker', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings(), updateSetting });
    render(<DisplaySettingsTab />);

    await user.click(within(optionBlock(/^Start page$/)).getByText('Active trip'));

    expect(updateSetting).toHaveBeenCalledWith('start_page', 'active_trip');
  });

  it('FE-COMP-DISPLAY-051: with the active trip chosen, the tab picker stores the planner tab id', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, {
      settings: buildSettings({ start_page: 'active_trip', start_trip_tab: 'plan' }),
      updateSetting,
    });
    render(<DisplaySettingsTab />);

    await user.click(screen.getByRole('button', { name: 'Plan' }));
    await user.click(await screen.findByText('Costs'));

    // The German legacy id, not the English label the user sees.
    expect(updateSetting).toHaveBeenCalledWith('start_trip_tab', 'finanzplan');
  });

  it('FE-COMP-DISPLAY-052: a rejected start-page change surfaces the error', async () => {
    const user = userEvent.setup();
    seedFailing('Start locked');
    render(<><ToastContainer /><DisplaySettingsTab /></>);

    await user.click(within(optionBlock(/^Start page$/)).getByText('Active trip'));

    await screen.findByText('Start locked');
  });
});
