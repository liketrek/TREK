// FE-COMP-DISPLAY-001 to FE-COMP-DISPLAY-027
import { render, screen, waitFor } from '../../../tests/helpers/render';
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

  it('FE-COMP-DISPLAY-002: shows Display section title', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Display')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-003: shows Light mode button', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-004: shows Dark mode button', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-005: shows Auto mode button', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByRole('button', { name: /Auto/i })).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-006: shows Language section', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-007: shows Time Format section', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Time Format')).toBeInTheDocument();
  });

  it('FE-COMP-DISPLAY-008: clicking Dark mode button calls updateSetting', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('Dark'));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'dark');
  });

  it('FE-COMP-DISPLAY-009: shows Color Mode label', () => {
    render(<DisplaySettingsTab />);
    expect(screen.getByText('Color Mode')).toBeInTheDocument();
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

  it('FE-COMP-DISPLAY-012: clicking Light mode calls updateSetting with light', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByText('Light'));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'light');
  });

  it('FE-COMP-DISPLAY-013: clicking Auto mode button calls updateSetting with auto', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<DisplaySettingsTab />);
    await user.click(screen.getByRole('button', { name: /Auto/i }));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'auto');
  });

  it('FE-COMP-DISPLAY-014: active color mode button has border with var(--text-primary)', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }) });
    render(<DisplaySettingsTab />);
    const darkBtn = screen.getByRole('button', { name: /^Dark$/i });
    const lightBtn = screen.getByRole('button', { name: /^Light$/i });
    const autoBtn = screen.getByRole('button', { name: /Auto/i });
    expect(darkBtn.style.border).toContain('var(--text-primary)');
    expect(lightBtn.style.border).toContain('var(--border-primary)');
    expect(autoBtn.style.border).toContain('var(--border-primary)');
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
    const onButtons = screen.getAllByText(/^On$/i);
    const blurOnBtn = onButtons[1].closest('button')!;
    expect(blurOnBtn.style.border).toContain('var(--text-primary)');
  });

  it('FE-COMP-DISPLAY-026: updateSetting failure shows toast error', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockRejectedValue(new Error('Server error'));
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<><ToastContainer /><DisplaySettingsTab /></>);
    await user.click(screen.getByText('Dark'));
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
