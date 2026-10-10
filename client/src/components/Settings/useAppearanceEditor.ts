import { DEFAULT_APPEARANCE, normalizeAppearance, type AppearanceConfig } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { applyAppearance } from '../../theme/applyAppearance';
import { useToast } from '../shared/Toast';
import { contrastRatio } from './appearanceModel';
import { useSettingSaver } from './useSettingSaver';

/**
 * The appearance editor behind both settings shells (the desktop tab and the phone
 * section render their own markup over this): every change previews on the page at
 * once and is persisted after a short debounce, and a change still pending when the
 * editor goes away is written on the way out.
 */
export function useAppearanceEditor() {
  const { settings, updateSetting } = useSettingsStore();
  const { t } = useTranslation();
  const toast = useToast();
  const { save } = useSettingSaver();

  const [cfg, setCfg] = useState<AppearanceConfig>(() => normalizeAppearance(settings.appearance));
  const persistTimer = useRef<number | undefined>(undefined);
  // What the pending timer would have written, so leaving the editor inside the
  // debounce window still saves instead of silently dropping the change.
  const pendingWrite = useRef<AppearanceConfig | null>(null);

  // Re-sync when settings change elsewhere (e.g. server reconcile / another tab).
  useEffect(() => {
    setCfg(normalizeAppearance(settings.appearance));
  }, [settings.appearance]);

  // Flush any pending persist on unmount.
  useEffect(
    () => () => {
      if (!persistTimer.current) return;
      window.clearTimeout(persistTimer.current);
      // The component is gone, so a failure has nowhere to be shown.
      if (pendingWrite.current) updateSetting('appearance', pendingWrite.current).catch(() => {});
    },
    [updateSetting]
  );

  const isDark =
    settings.dark_mode === true ||
    settings.dark_mode === 'dark' ||
    (settings.dark_mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Live preview now (DOM), persist after a short debounce (API).
  const update = (patch: Partial<AppearanceConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    applyAppearance({ darkMode: settings.dark_mode, appearance: next, isSharedPage: false });
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    pendingWrite.current = next;
    persistTimer.current = window.setTimeout(() => {
      pendingWrite.current = null;
      updateSetting('appearance', next).catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : t('common.error'))
      );
    }, 350);
  };

  const setMode = (mode: string) => save('dark_mode', mode);

  const setWidget = (device: 'desktop' | 'mobile', key: string, on: boolean) => {
    update({
      dashboard: {
        ...cfg.dashboard,
        [device]: { ...cfg.dashboard[device], [key]: on },
      },
    });
  };

  const resetAll = () => update({ ...DEFAULT_APPEARANCE });

  const accentLight = cfg.accent?.light ?? '#4f46e5';
  const accentDark = cfg.accent?.dark ?? '#6366f1';
  const customRatio = contrastRatio(isDark ? accentDark : accentLight, '#ffffff');

  return {
    cfg,
    darkMode: settings.dark_mode,
    isDark,
    update,
    setMode,
    setWidget,
    resetAll,
    accentLight,
    accentDark,
    customRatio,
  };
}
