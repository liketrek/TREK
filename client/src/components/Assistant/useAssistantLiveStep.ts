import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { prefersReducedMotion } from '../../utils/reducedMotion';
import { liveStepText } from './assistantModel';

interface LiveStep {
  /** The call the line speaks of. */
  toolCallId: string;
  /** "Searching near Trastevere": what the running step does, and where. */
  text: string;
  /**
   * The step searches an area and the map is set to follow it there (the
   * setting is on and motion is not reduced), so the line may say so.
   */
  hasArea: boolean;
}

/**
 * What the assistant is doing right now, in words, once a running step said
 * where it looks: the line under the steps and the phone's pill read it. Null
 * while no step names a place or a query. The step's name comes from the call
 * in the chat; the place from the stream, which never stores it.
 */
export function useAssistantLiveStep(tripId: number): LiveStep | null {
  const { t } = useTranslation();
  const follow = useSettingsStore((s) => s.settings.assistant_map_follow) !== false;
  const activity = useAssistantStore((s) => chatOf(s, tripId).live.activity);
  const toolName = useAssistantStore((s) => {
    const id = chatOf(s, tripId).live.activity?.toolCallId;
    if (!id) return null;
    const messages = chatOf(s, tripId).messages;
    const last = messages[messages.length - 1];
    const call = last?.parts.find((p) => p.type === 'tool-call' && p.toolCallId === id);
    return call?.type === 'tool-call' ? call.toolName : null;
  });
  if (!activity || !toolName || !activity.label) return null;
  const { key, params } = liveStepText(toolName, activity.label);
  const hasArea = activity.area !== null && follow && !prefersReducedMotion();
  return { toolCallId: activity.toolCallId, text: t(key, params), hasArea };
}
