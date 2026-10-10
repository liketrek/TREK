// FE-COMP-APPEARANCE-EDITOR-001 onwards: the appearance editor behind both settings shells.
import { act, renderHook } from '@testing-library/react';
import { DEFAULT_APPEARANCE, normalizeAppearance } from '@trek/shared';

import { buildSettings } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import { applyAppearance } from '../../theme/applyAppearance';
import type { Settings } from '../../types';
import { contrastRatio, DESKTOP_GROUPS, isHex, MOBILE_GROUPS } from './appearanceModel';
import { useAppearanceEditor } from './useAppearanceEditor';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('../../theme/applyAppearance', () => ({ applyAppearance: vi.fn() }));

const updateSetting = vi.fn();

function seed(over: Partial<Settings> = {}) {
  seedStore(useSettingsStore, { settings: buildSettings({ dark_mode: false, ...over }), updateSetting });
}

beforeEach(() => {
  resetAllStores();
  vi.useFakeTimers();
  toast.error.mockReset();
  updateSetting.mockReset().mockResolvedValue(undefined);
  vi.mocked(applyAppearance).mockClear();
});
afterEach(() => vi.useRealTimers());

describe('appearanceModel', () => {
  it('FE-COMP-APPEARANCE-EDITOR-001: contrast, hex check and widget groups', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#fff', '#ffffff')).toBeCloseTo(1, 5);
    expect(isHex('#abc')).toBe(true);
    expect(isHex('#a1b2c3')).toBe(true);
    expect(isHex('abc')).toBe(false);
    expect(DESKTOP_GROUPS.map((g) => g.master)).toEqual([undefined, 'sidebar']);
    expect(MOBILE_GROUPS.map((g) => g.id)).toEqual(['belowHero', 'bottomOfPage']);
  });
});

describe('useAppearanceEditor', () => {
  it('FE-COMP-APPEARANCE-EDITOR-002: seeds from the stored appearance and derives the accent hint', () => {
    seed({ dark_mode: 'dark' });
    const { result } = renderHook(() => useAppearanceEditor());
    expect(result.current.cfg).toEqual(normalizeAppearance(useSettingsStore.getState().settings.appearance));
    expect(result.current.darkMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.accentLight).toBe('#4f46e5');
    expect(result.current.accentDark).toBe('#6366f1');
    expect(result.current.customRatio).toBeCloseTo(contrastRatio('#6366f1', '#ffffff'), 5);
  });

  it('FE-COMP-APPEARANCE-EDITOR-003: a change previews at once and persists once after the debounce', () => {
    seed();
    const { result } = renderHook(() => useAppearanceEditor());
    act(() => result.current.update({ density: 'compact' }));
    act(() => result.current.update({ transparency: false }));
    expect(result.current.cfg.density).toBe('compact');
    expect(applyAppearance).toHaveBeenCalledTimes(2);
    expect(updateSetting).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(350));
    expect(updateSetting).toHaveBeenCalledTimes(1);
    expect(updateSetting).toHaveBeenCalledWith(
      'appearance',
      expect.objectContaining({ density: 'compact', transparency: false })
    );
  });

  it('FE-COMP-APPEARANCE-EDITOR-004: a failed persist shows the error', async () => {
    seed();
    updateSetting.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useAppearanceEditor());
    act(() => result.current.update({ reduceMotion: true }));
    await act(async () => {
      vi.advanceTimersByTime(350);
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(toast.error).toHaveBeenCalledWith('nope');
  });

  it('FE-COMP-APPEARANCE-EDITOR-005: leaving inside the debounce still writes the pending change', () => {
    seed();
    const { result, unmount } = renderHook(() => useAppearanceEditor());
    act(() => result.current.update({ fontScale: 1.2 }));
    unmount();
    expect(updateSetting).toHaveBeenCalledWith('appearance', expect.objectContaining({ fontScale: 1.2 }));
  });

  it('FE-COMP-APPEARANCE-EDITOR-006: widgets toggle per device and reset goes back to the defaults', () => {
    seed();
    const { result } = renderHook(() => useAppearanceEditor());
    const mobileBefore = result.current.cfg.dashboard.mobile;
    act(() => result.current.setWidget('desktop', 'sidebar', false));
    expect(result.current.cfg.dashboard.desktop.sidebar).toBe(false);
    expect(result.current.cfg.dashboard.mobile).toEqual(mobileBefore);
    const before = result.current.cfg;
    act(() => result.current.resetAll());
    expect(result.current.cfg).toEqual({ ...before, ...DEFAULT_APPEARANCE });
    expect(result.current.cfg.dashboard.desktop.sidebar).toBe(DEFAULT_APPEARANCE.dashboard.desktop.sidebar);
  });

  it('FE-COMP-APPEARANCE-EDITOR-007: the colour mode is saved straight away, with the error on failure', async () => {
    seed();
    const { result } = renderHook(() => useAppearanceEditor());
    await act(() => result.current.setMode('dark'));
    expect(updateSetting).toHaveBeenCalledWith('dark_mode', 'dark');
    updateSetting.mockRejectedValueOnce('x');
    await act(() => result.current.setMode('light'));
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });
});
