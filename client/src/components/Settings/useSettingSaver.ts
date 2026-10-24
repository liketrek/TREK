import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings } from '../../types';
import { useToast } from '../shared/Toast';

/**
 * One user preference saved straight away, with the error as a toast when it fails.
 * Behind both general settings shells (the desktop tab and the phone section), which
 * read the current values from the `settings` this returns.
 */
export function useSettingSaver() {
  const { settings, updateSetting } = useSettingsStore();
  const { t } = useTranslation();
  const toast = useToast();

  const save = async (key: keyof Settings, value: Settings[keyof Settings]) => {
    try {
      await updateSetting(key, value);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    }
  };

  return { settings, save };
}
