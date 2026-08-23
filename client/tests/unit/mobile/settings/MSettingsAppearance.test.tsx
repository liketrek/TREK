// FE-MOB-SETAPP-001 onwards
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { useAddonStore } from '../../../../src/store/addonStore';
import { usePluginStore } from '../../../../src/store/pluginStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import { DEFAULT_APPEARANCE, type AppearanceConfig } from '@trek/shared';
import type { Settings } from '../../../../src/types';
import MSettingsAppearance from '../../../../src/mobile/screens/settings/MSettingsAppearance';

type UpdateSettingMock = ReturnType<typeof vi.fn>;

function seedAppearance(
  appearance: Partial<AppearanceConfig> | undefined,
  over: Partial<Settings> = {},
): UpdateSettingMock {
  const updateSetting = vi.fn().mockResolvedValue(undefined);
  seedStore(useSettingsStore, {
    settings: buildSettings({
      language: 'en',
      dark_mode: 'light',
      appearance: appearance ? { ...DEFAULT_APPEARANCE, ...appearance } : undefined,
      ...over,
    }),
    updateSetting,
  });
  return updateSetting;
}

function renderAppearance() {
  return render(
    <>
      <ToastContainer />
      <MSettingsAppearance />
    </>,
  );
}

/** Persisted appearance blobs, in call order. */
function appearanceCalls(mock: UpdateSettingMock): AppearanceConfig[] {
  return mock.mock.calls.filter((c) => c[0] === 'appearance').map((c) => c[1] as AppearanceConfig);
}

/** The most recently persisted appearance blob (throws until one exists). */
function lastAppearance(mock: UpdateSettingMock): AppearanceConfig {
  const calls = appearanceCalls(mock);
  if (calls.length === 0) throw new Error('no appearance persisted yet');
  return calls[calls.length - 1];
}

describe('MSettingsAppearance', () => {
  beforeEach(() => {
    resetAllStores();
    usePluginStore.setState({ plugins: [], loaded: true });
    seedAppearance(undefined);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-no-transparency');
    document.documentElement.removeAttribute('data-reduce-motion');
  });

  it('FE-MOB-SETAPP-001: renders the four cards and the reset action', () => {
    renderAppearance();

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Mobile', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Readability')).toBeInTheDocument();
    expect(screen.getByText('Experimental')).toBeInTheDocument();
    expect(screen.getByText('Dashboard widgets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset to defaults/ })).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-002: the color mode segment reflects the stored dark_mode', () => {
    seedAppearance(undefined, { dark_mode: 'dark' });
    renderAppearance();

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-MOB-SETAPP-003: a legacy boolean dark_mode still resolves to the dark segment', () => {
    seedAppearance(undefined, { dark_mode: true });
    renderAppearance();

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-SETAPP-004: picking a color mode persists it right away', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Auto' }));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'auto');
  });

  it('FE-MOB-SETAPP-005: a failing color-mode save shows the error toast', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', dark_mode: 'light' }),
      updateSetting: vi.fn().mockRejectedValue(new Error('Server down')),
    });
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    await screen.findByText('Server down');
  });

  it('FE-MOB-SETAPP-006: choosing a scheme applies it to the DOM and persists it debounced', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Teal' }));

    expect(document.documentElement.getAttribute('data-scheme')).toBe('teal');
    await waitFor(() => expect(appearanceCalls(updateSetting)[0]).toMatchObject({ schemeId: 'teal' }));
  });

  it('FE-MOB-SETAPP-007: rapid edits collapse into a single persisted blob', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Indigo' }));
    await user.click(screen.getByRole('button', { name: 'Rose' }));
    await user.click(screen.getByRole('button', { name: 'Violet' }));

    await waitFor(() => expect(appearanceCalls(updateSetting)).toHaveLength(1));
    expect(appearanceCalls(updateSetting)[0].schemeId).toBe('violet');
  });

  it('FE-MOB-SETAPP-008: a rejected appearance save surfaces the error toast', async () => {
    const user = userEvent.setup();
    seedStore(useSettingsStore, {
      settings: buildSettings({ language: 'en', dark_mode: 'light' }),
      updateSetting: vi.fn().mockRejectedValue(new Error('Blob too large')),
    });
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Amber' }));
    await screen.findByText('Blob too large');
  });

  it('FE-MOB-SETAPP-009: the custom scheme reveals the accent presets and the contrast badge', async () => {
    const user = userEvent.setup();
    renderAppearance();

    expect(screen.queryByText('Custom accent')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Custom' }));

    expect(screen.getByText('Custom accent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#4f46e5' })).toBeInTheDocument();
    expect(screen.getByText(/Good contrast \(\d\.\d:1\)/)).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-010: a preset swatch sets both accents and can drop the contrast rating', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance({ schemeId: 'custom', accent: { light: '#4f46e5', dark: '#6366f1' } });
    renderAppearance();

    await user.click(screen.getByRole('button', { name: '#d97706' }));

    expect(screen.getByText(/Low contrast \(\d\.\d:1\)/)).toBeInTheDocument();
    await waitFor(() =>
      expect(appearanceCalls(updateSetting)[0].accent).toEqual({ light: '#d97706', dark: '#d97706' }),
    );
  });

  it('FE-MOB-SETAPP-011: the two color inputs edit their own mode only', async () => {
    const updateSetting = seedAppearance({ schemeId: 'custom', accent: { light: '#4f46e5', dark: '#6366f1' } });
    renderAppearance();

    const [lightInput, darkInput] = screen.getAllByDisplayValue(/#/) as HTMLInputElement[];
    fireEvent.change(lightInput, { target: { value: '#123456' } });
    expect(darkInput.value).toBe('#6366f1');

    fireEvent.change(screen.getAllByDisplayValue(/#/)[1], { target: { value: '#abcdef' } });
    await waitFor(() =>
      expect(lastAppearance(updateSetting).accent).toEqual({ light: '#123456', dark: '#abcdef' }),
    );
  });

  it('FE-MOB-SETAPP-012: a shorthand accent hex is expanded for the contrast rating', () => {
    seedAppearance({ schemeId: 'custom', accent: { light: '#abc', dark: '#abc' } });
    renderAppearance();

    expect(screen.getByText(/contrast \(\d\.\d:1\)/)).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-013: dark mode rates the dark accent instead of the light one', () => {
    seedAppearance({ schemeId: 'custom', accent: { light: '#111111', dark: '#fde68a' } }, { dark_mode: 'dark' });
    renderAppearance();

    // Near-white on white is unreadable — the dark accent is the one under test.
    expect(screen.getByText(/Low contrast/)).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-014: auto mode follows the OS preference for the accent rating', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    seedAppearance({ schemeId: 'custom', accent: { light: '#111111', dark: '#fde68a' } }, { dark_mode: 'auto' });
    renderAppearance();

    expect(screen.getByText(/Low contrast/)).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-015: the readability switches write their DOM markers', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getByRole('switch', { name: 'Transparency' }));
    expect(document.documentElement.hasAttribute('data-no-transparency')).toBe(true);

    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(true);

    await waitFor(() =>
      expect(lastAppearance(updateSetting)).toMatchObject({ transparency: false, reduceMotion: true }),
    );
  });

  it('FE-MOB-SETAPP-016: switching to compact density sets the density attribute', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    await waitFor(() => expect(appearanceCalls(updateSetting)[0]).toMatchObject({ density: 'compact' }));
  });

  it('FE-MOB-SETAPP-017: the global text slider shows its percentage and persists fontScale', async () => {
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    expect(sliders).toHaveLength(5);
    fireEvent.change(sliders[0], { target: { value: '1.2' } });

    expect(screen.getByText('120%')).toBeInTheDocument();
    await waitFor(() => expect(appearanceCalls(updateSetting)[0]).toMatchObject({ fontScale: 1.2 }));
  });

  it('FE-MOB-SETAPP-018: each per-tier slider only moves its own scale', async () => {
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    fireEvent.change(sliders[1], { target: { value: '1.4' } });
    fireEvent.change(sliders[2], { target: { value: '1.3' } });
    fireEvent.change(sliders[3], { target: { value: '0.9' } });
    fireEvent.change(sliders[4], { target: { value: '0.8' } });

    await waitFor(() =>
      expect(lastAppearance(updateSetting).typeScale).toEqual({
        title: 1.4,
        subtitle: 1.3,
        body: 0.9,
        caption: 0.8,
      }),
    );
  });

  it('FE-MOB-SETAPP-019: desktop and mobile widget toggles are independent', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    const currencySwitches = screen.getAllByRole('switch', { name: 'Currency' });
    expect(currencySwitches).toHaveLength(2);

    await user.click(currencySwitches[0]);
    await waitFor(() => expect(lastAppearance(updateSetting).dashboard.desktop.currency).toBe(false));
    expect(lastAppearance(updateSetting).dashboard.mobile.currency).toBe(true);

    await user.click(screen.getAllByRole('switch', { name: 'Currency' })[1]);
    await waitFor(() => expect(lastAppearance(updateSetting).dashboard.mobile.currency).toBe(false));
  });

  it('FE-MOB-SETAPP-020: turning the sidebar master off disables its child toggles', async () => {
    const user = userEvent.setup();
    renderAppearance();

    const master = screen.getByRole('switch', { name: 'Right sidebar' });
    expect(screen.getAllByRole('switch', { name: 'Timezones' })[0]).toBeEnabled();

    await user.click(master);
    expect(screen.getAllByRole('switch', { name: 'Timezones' })[0]).toBeDisabled();
    // The mobile twin stays usable.
    expect(screen.getAllByRole('switch', { name: 'Timezones' })[1]).toBeEnabled();
  });

  it('FE-MOB-SETAPP-021: the desktop-only widgets render outside the sidebar group', () => {
    renderAppearance();

    expect(screen.getByRole('switch', { name: 'Atlas / countries' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Distance flown' })).toBeInTheDocument();
    expect(screen.getAllByRole('switch', { name: 'Trips total' })).toHaveLength(2);
    // "Below the hero" exists once per device, "Bottom of page" only on mobile.
    expect(screen.getAllByText('Below the hero')).toHaveLength(2);
    expect(screen.getByText('Bottom of page')).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-022: the mobile card carries the nav customizer and the dashboard order', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true }],
      loaded: true,
    });
    renderAppearance();

    expect(screen.getByText('Bottom navbar')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Dashboard order')).toBeInTheDocument();
    expect(screen.getByText('Trips')).toBeInTheDocument();
  });

  it('FE-MOB-SETAPP-023: reordering the mobile dashboard persists the new token order', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getAllByLabelText('Move down')[0]);
    await waitFor(() =>
      expect(lastAppearance(updateSetting).dashboard.mobileOrder).toEqual([
        'currency',
        'trips',
        'collections',
        'timezones',
        'upcomingReservations',
      ]),
    );
  });

  it('FE-MOB-SETAPP-024: editing the bottom navbar persists the new split', async () => {
    const user = userEvent.setup();
    seedStore(useAddonStore, {
      addons: [
        { id: 'vacay', name: 'Vacay', type: 'global', icon: 'calendar', enabled: true },
        { id: 'atlas', name: 'Atlas', type: 'global', icon: 'map', enabled: true },
      ],
      loaded: true,
    });
    const updateSetting = seedAppearance(undefined);
    renderAppearance();

    await user.click(screen.getAllByLabelText('Move under “More”')[0]);
    await waitFor(() =>
      expect(lastAppearance(updateSetting).mobileNav).toEqual({ bar: ['atlas'], more: ['vacay'] }),
    );
  });

  it('FE-MOB-SETAPP-025: reset restores the defaults and clears the DOM markers', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance({ schemeId: 'rose', density: 'compact', reduceMotion: true, fontScale: 1.3 });
    renderAppearance();

    expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Reset to defaults/ }));

    expect(document.documentElement.hasAttribute('data-scheme')).toBe(false);
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(false);
    expect(screen.getByRole('button', { name: 'Comfortable' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(appearanceCalls(updateSetting)[0]).toEqual(DEFAULT_APPEARANCE));
  });

  it('FE-MOB-SETAPP-026: a settings change from elsewhere re-syncs the local config', async () => {
    const { rerender } = renderAppearance();
    expect(screen.getByRole('button', { name: 'Comfortable' })).toHaveAttribute('aria-pressed', 'true');

    seedAppearance({ density: 'compact' });
    rerender(<MSettingsAppearance />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true'),
    );
  });

  // The scheme is already on the DOM by then, so dropping the write would revert the
  // choice on the next load without ever telling the user.
  it('FE-MOB-SETAPP-027: unmounting before the debounce fires flushes the pending save once', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    const { unmount } = renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Indigo' }));
    unmount();

    expect(appearanceCalls(updateSetting)).toHaveLength(1);
    expect(appearanceCalls(updateSetting)[0].schemeId).toBe('indigo');

    // The timer is cancelled, so nothing lands a second time.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(appearanceCalls(updateSetting)).toHaveLength(1);
  });

  it('FE-MOB-SETAPP-028: a debounce that already fired is not written again on unmount', async () => {
    const user = userEvent.setup();
    const updateSetting = seedAppearance(undefined);
    const { unmount } = renderAppearance();

    await user.click(screen.getByRole('button', { name: 'Teal' }));
    await waitFor(() => expect(appearanceCalls(updateSetting)).toHaveLength(1));

    unmount();
    expect(appearanceCalls(updateSetting)).toHaveLength(1);
  });
});
