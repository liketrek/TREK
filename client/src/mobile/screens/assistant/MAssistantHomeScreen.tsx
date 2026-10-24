import { useCallback, useEffect, useMemo } from 'react';
import { useMatch, useNavigate } from 'react-router';

import type { AssistantChatTrip } from '../../../components/Assistant/assistantViewContext';
import type { EntityTarget } from '../../../components/Assistant/cards/cardTypes';
import { useAssistantHome } from '../../../components/Assistant/useAssistantHome';
import { useAssistantStore } from '../../../store/assistantStore';
import { AssistantScreen, type MapHops } from '../trip/assistant/MAssistantScreen';

/**
 * The assistant on the phone outside a trip: the home chat, full screen over
 * the dashboard, Vacay, Atlas, the collections or the settings, opened from
 * the dashboard's head or the dock's More list. It knows all of the user's
 * trips; going on in one trip's own chat opens that trip with its chat on
 * screen and the question waiting in its composer. Another page a card points
 * at closes the chat and opens there.
 *
 * Inside a trip the trip's own screen (MAssistantScreen) shows its chat, so
 * this one stays away there. Nothing shows until the assistant has a
 * connection this user can use.
 */
export default function MAssistantHomeScreen() {
  const navigate = useNavigate();
  const inTrip = useMatch('/trips/:id/*') !== null;
  const available = useAssistantStore((s) => s.status?.available === true);
  const open = useAssistantStore((s) => s.window.open);
  const minimized = useAssistantStore((s) => s.window.minimized);
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const close = useAssistantStore((s) => s.close);

  // The trip's screen takes over with the window still open, so its chat comes up there.
  const switchTo = useCallback((trip: AssistantChatTrip) => void navigate(`/trips/${trip.id}`), [navigate]);
  const home = useAssistantHome(switchTo);
  const hops = useMemo(
    (): MapHops => ({
      open: (target: EntityTarget) => {
        if (target.kind !== 'page') return;
        close();
        void navigate(target.path);
      },
    }),
    [close, navigate]
  );

  // The desktop window loads this itself; on the phone the pages outside a trip ask once.
  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (inTrip || !available || !open || minimized) return null;
  return (
    <AssistantScreen
      tripId={home.chat.id}
      tripTitle={home.chat.title}
      hidden={false}
      hops={hops}
      onOpenTripChat={home.openTripChat}
    />
  );
}
