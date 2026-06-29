// FE-COMP-APPEARANCE-001+ — color mode moved here from DisplaySettingsTab,
// plus the new scheme / readability / dashboard-widget controls.
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import AppearanceSettingsTab from './AppearanceSettingsTab';

beforeEach(() => {
  resetAllStores();
  server.use(http.put('/api/settings', async () => HttpResponse.json({ success: true })));
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light', language: 'en' }) });
});

describe('AppearanceSettingsTab', () => {
  it('FE-COMP-APPEARANCE-001: renders without crashing', () => {
    render(<AppearanceSettingsTab />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-APPEARANCE-002: shows the color-mode buttons', () => {
    render(<AppearanceSettingsTab />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auto/i })).toBeInTheDocument();
  });

  it('FE-COMP-APPEARANCE-003: clicking Dark calls updateSetting with dark', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<AppearanceSettingsTab />);
    await user.click(screen.getByText('Dark'));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'dark');
  });

  it('FE-COMP-APPEARANCE-004: clicking Light calls updateSetting with light', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'dark' }), updateSetting });
    render(<AppearanceSettingsTab />);
    await user.click(screen.getByText('Light'));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'light');
  });

  it('FE-COMP-APPEARANCE-005: clicking Auto calls updateSetting with auto', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<AppearanceSettingsTab />);
    await user.click(screen.getByRole('button', { name: /Auto/i }));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'auto');
  });

  it('FE-COMP-APPEARANCE-006: shows readability + dashboard widget sections', () => {
    render(<AppearanceSettingsTab />);
    expect(screen.getByText('Readability')).toBeInTheDocument();
    expect(screen.getByText('Transparency')).toBeInTheDocument();
    expect(screen.getByText('Dashboard widgets')).toBeInTheDocument();
  });

  it('FE-COMP-APPEARANCE-007: shows the preset color schemes', () => {
    render(<AppearanceSettingsTab />);
    expect(screen.getByText('Indigo')).toBeInTheDocument();
    expect(screen.getByText('Teal')).toBeInTheDocument();
    expect(screen.getByText('High contrast')).toBeInTheDocument();
  });

  it('FE-COMP-APPEARANCE-008: choosing a scheme persists the appearance config', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<AppearanceSettingsTab />);
    await user.click(screen.getByText('Indigo'));
    await waitFor(
      () => expect(updateSetting).toHaveBeenCalledWith('appearance', expect.objectContaining({ schemeId: 'indigo' })),
      { timeout: 1500 },
    );
  });

  it('FE-COMP-APPEARANCE-009: toggling transparency persists transparency:false', async () => {
    const user = userEvent.setup();
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light' }), updateSetting });
    render(<AppearanceSettingsTab />);
    await user.click(screen.getByRole('button', { name: 'Transparency' }));
    await waitFor(
      () => expect(updateSetting).toHaveBeenCalledWith('appearance', expect.objectContaining({ transparency: false })),
      { timeout: 1500 },
    );
  });
});
