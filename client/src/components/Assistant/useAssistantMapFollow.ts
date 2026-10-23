import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useToast } from '../shared/Toast';

/** The assistant's own on/off settings; each reads as on unless switched off. */
type AssistantFlag = 'assistant_map_follow' | 'assistant_cost_estimates';

/** One of the assistant's switches, read and saved through the user's settings. */
function useAssistantFlag(key: AssistantFlag): { on: boolean; set: (on: boolean) => Promise<void> } {
  const on = useSettingsStore((s) => s.settings[key]) !== false;
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const { t } = useTranslation();
  const toast = useToast();

  const set = async (next: boolean) => {
    try {
      await updateSetting(key, next);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    }
  };

  return { on, set };
}

/**
 * Whether the trip map follows the assistant: pans to where it searches and
 * frames the places it suggests. On unless switched off. Behind the switch in
 * both AI settings shells, the desktop section and the phone card.
 */
export function useAssistantMapFollow() {
  return useAssistantFlag('assistant_map_follow');
}

/**
 * Whether the assistant proposes an estimated budget item along with a place
 * that costs money, as one more change card to apply or leave. On unless
 * switched off; the server reads the same setting.
 */
export function useAssistantCostEstimates() {
  return useAssistantFlag('assistant_cost_estimates');
}
