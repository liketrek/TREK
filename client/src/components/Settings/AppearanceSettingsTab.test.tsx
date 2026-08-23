// FE-COMP-APPEARANCE-001+ — color mode moved here from DisplaySettingsTab,
// plus the new scheme / readability / dashboard-widget controls.
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildSettings } from '../../../tests/helpers/factories';
import { ToastContainer } from '../shared/Toast';
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

// ── Custom accent, sliders, widgets and error paths (010–021) ─────────────────

const PERSIST = { timeout: 1500 } as const;

function seedAppearance(updateSetting = vi.fn().mockResolvedValue(undefined)) {
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: 'light', language: 'en' }), updateSetting });
  return updateSetting;
}

/** The last `appearance` payload the debounced persist wrote. */
function lastAppearance(updateSetting: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const calls = updateSetting.mock.calls.filter(c => c[0] === 'appearance');
  return calls[calls.length - 1][1] as Record<string, unknown>;
}

describe('AppearanceSettingsTab – custom accent and sliders', () => {
  it('FE-COMP-APPEARANCE-010: a failing persist surfaces the error toast', async () => {
    const user = userEvent.setup();
    seedAppearance(vi.fn().mockRejectedValue(new Error('Appearance rejected')));
    render(<><ToastContainer /><AppearanceSettingsTab /></>);

    await user.click(screen.getByText('Teal'));

    await screen.findByText('Appearance rejected', undefined, PERSIST);
  });

  it('FE-COMP-APPEARANCE-011: a failing colour-mode change surfaces the error toast', async () => {
    const user = userEvent.setup();
    seedAppearance(vi.fn().mockRejectedValue(new Error('Mode rejected')));
    render(<><ToastContainer /><AppearanceSettingsTab /></>);

    await user.click(screen.getByText('Dark'));

    await screen.findByText('Mode rejected');
  });

  it('FE-COMP-APPEARANCE-012: picking Custom reveals the accent picker', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    expect(screen.queryByText('Custom accent')).not.toBeInTheDocument();
    await user.click(screen.getByText('Custom'));

    expect(screen.getByText('Custom accent')).toBeInTheDocument();
    await waitFor(
      () => expect(updateSetting).toHaveBeenCalledWith('appearance', expect.objectContaining({ schemeId: 'custom' })),
      PERSIST,
    );
  });

  it('FE-COMP-APPEARANCE-013: an accent preset sets both the light and the dark accent', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByText('Custom'));
    await user.click(screen.getByRole('button', { name: '#0d9488' }));

    await waitFor(
      () => expect(lastAppearance(updateSetting).accent).toEqual({ light: '#0d9488', dark: '#0d9488' }),
      PERSIST,
    );
  });

  it('FE-COMP-APPEARANCE-014: the two colour inputs edit the light and dark accent separately', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByText('Custom'));
    const [light, dark] = Array.from(document.querySelectorAll('input[type="color"]')) as HTMLInputElement[];

    fireEvent.change(light, { target: { value: '#112233' } });
    await waitFor(() => expect(lastAppearance(updateSetting).accent).toMatchObject({ light: '#112233' }), PERSIST);

    fireEvent.change(dark, { target: { value: '#445566' } });
    await waitFor(() => expect(lastAppearance(updateSetting).accent).toEqual({ light: '#112233', dark: '#445566' }), PERSIST);
  });

  it('FE-COMP-APPEARANCE-015: the contrast hint follows the picked accent', async () => {
    const user = userEvent.setup();
    seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByText('Custom'));
    expect(screen.getByText(/Good contrast/)).toBeInTheDocument();

    // Near-white on white is unreadable — the hint has to say so.
    fireEvent.change(document.querySelectorAll('input[type="color"]')[0], { target: { value: '#fafafa' } });
    expect(screen.getByText(/Low contrast/)).toBeInTheDocument();
  });

  it('FE-COMP-APPEARANCE-016: reduce motion is persisted', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByRole('button', { name: 'Reduce motion' }));

    await waitFor(
      () => expect(updateSetting).toHaveBeenCalledWith('appearance', expect.objectContaining({ reduceMotion: true })),
      PERSIST,
    );
  });

  it('FE-COMP-APPEARANCE-017: the global text-size slider persists fontScale', async () => {
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '1.2' } });

    await waitFor(() => expect(lastAppearance(updateSetting).fontScale).toBe(1.2), PERSIST);
    expect(screen.getAllByText('120%').length).toBeGreaterThan(0);
  });

  it('FE-COMP-APPEARANCE-018: each size row writes its own typeScale entry', async () => {
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);
    const sliders = screen.getAllByRole('slider');

    fireEvent.change(sliders[1], { target: { value: '1.15' } });
    fireEvent.change(sliders[2], { target: { value: '1.1' } });
    fireEvent.change(sliders[3], { target: { value: '0.9' } });
    fireEvent.change(sliders[4], { target: { value: '0.85' } });

    await waitFor(
      () => expect(lastAppearance(updateSetting).typeScale).toMatchObject({
        title: 1.15,
        subtitle: 1.1,
        body: 0.9,
        caption: 0.85,
      }),
      PERSIST,
    );
  });
});

describe('AppearanceSettingsTab – dashboard widgets', () => {
  it('FE-COMP-APPEARANCE-019: toggling a desktop widget persists it under dashboard.desktop', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByRole('button', { name: 'Atlas / countries' }));

    await waitFor(
      () => expect(lastAppearance(updateSetting).dashboard).toMatchObject({ desktop: { atlas: false } }),
      PERSIST,
    );
  });

  it('FE-COMP-APPEARANCE-020: turning the sidebar master off disables its child widgets', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);
    const master = screen.getByRole('button', { name: 'Right sidebar' });
    expect(master).toHaveAttribute('aria-pressed', 'true');

    await user.click(master);

    await waitFor(
      () => expect(lastAppearance(updateSetting).dashboard).toMatchObject({ desktop: { sidebar: false } }),
      PERSIST,
    );
    expect(screen.getByRole('button', { name: 'Right sidebar' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-COMP-APPEARANCE-021: toggling a mobile widget only touches the mobile map', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    // Currency exists on both devices; the second occurrence is the mobile row.
    const currencyToggles = screen.getAllByRole('button', { name: 'Currency' });
    await user.click(currencyToggles[1]);

    await waitFor(
      () => expect(lastAppearance(updateSetting).dashboard).toMatchObject({
        desktop: { currency: true },
        mobile: { currency: false },
      }),
      PERSIST,
    );
  });

  it('FE-COMP-APPEARANCE-022: Reset to defaults writes the whole default config back', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    render(<AppearanceSettingsTab />);

    await user.click(screen.getByRole('button', { name: 'Atlas / countries' }));
    await waitFor(() => expect(lastAppearance(updateSetting).dashboard).toMatchObject({ desktop: { atlas: false } }), PERSIST);

    await user.click(screen.getByRole('button', { name: /Reset to defaults/ }));

    await waitFor(
      () => expect(lastAppearance(updateSetting).dashboard).toMatchObject({ desktop: { atlas: true } }),
      PERSIST,
    );
  });

  // The scheme is already on the DOM by then, so dropping the write would revert the
  // choice on the next load without ever telling the user.
  it('FE-COMP-APPEARANCE-023: leaving the tab before the debounce fires flushes the pending save once', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    const { unmount } = render(<AppearanceSettingsTab />);

    await user.click(screen.getByText('Indigo'));
    unmount();

    const calls = updateSetting.mock.calls.filter(c => c[0] === 'appearance');
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({ schemeId: 'indigo' });

    // The timer is cancelled, so nothing lands a second time.
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(updateSetting.mock.calls.filter(c => c[0] === 'appearance')).toHaveLength(1);
  });

  it('FE-COMP-APPEARANCE-024: a debounce that already fired is not written again on unmount', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance();
    const { unmount } = render(<AppearanceSettingsTab />);

    await user.click(screen.getByText('Teal'));
    await waitFor(() => expect(updateSetting.mock.calls.filter(c => c[0] === 'appearance')).toHaveLength(1), PERSIST);

    unmount();
    expect(updateSetting.mock.calls.filter(c => c[0] === 'appearance')).toHaveLength(1);
  });
});
