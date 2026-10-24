import { useCallback, useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { HOME_CHAT_KEY } from '../../store/assistantChatKey';
import { useAssistantStore } from '../../store/assistantStore';
import type { AssistantChatTrip } from './assistantViewContext';

/**
 * The home chat, the assistant outside any one trip, as the desktop window
 * and the phone screen both show it: the key its conversations are kept
 * under, the name its head carries, and the way into one trip's own chat.
 * That way leaves the question the home chat handed over waiting in the
 * trip's composer, ready to send, and then lets the view switch (the window
 * shows that trip's chat in place, the phone opens the trip with its chat).
 */
export function useAssistantHome(switchTo: (trip: AssistantChatTrip) => void) {
  const { t } = useTranslation();
  const setDraft = useAssistantStore((s) => s.setDraft);

  const openTripChat = useCallback(
    (trip: AssistantChatTrip, question: string | null) => {
      // A question typed there already stays; the handed-over one only fills an empty composer.
      const typed = useAssistantStore.getState().byTrip[trip.id]?.draft ?? '';
      if (question && !typed.trim()) setDraft(trip.id, question);
      switchTo(trip);
    },
    [setDraft, switchTo]
  );

  const title = t('assistant.home.title');
  const chat = useMemo((): AssistantChatTrip => ({ id: HOME_CHAT_KEY, title }), [title]);
  return { chat, openTripChat };
}

/**
 * The way into the home chat on the pages outside a trip (the phone's
 * dashboard head and the dock's More list): offered only while the assistant
 * can run for this user, like every other way in.
 */
export function useAssistantHomeLauncher() {
  const available = useAssistantStore((s) => s.status?.available === true);
  const open = useAssistantStore((s) => s.open);
  return { available, open };
}
