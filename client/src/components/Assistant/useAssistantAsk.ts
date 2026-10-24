import { useAssistantStore } from '../../store/assistantStore';

/**
 * The ways into the assistant from inside a trip: "Ask" about a place, on the
 * desktop inspector and the phone's place sheet, opens it with the place as
 * the chat's context chip; the phone's Mehr tile just opens it. Offered only
 * while the assistant can run for this user, like every other way in.
 */
export function useAssistantAsk(tripId: number | null) {
  const available = useAssistantStore((s) => s.status?.available === true);
  const openWith = useAssistantStore((s) => s.openWith);
  const open = useAssistantStore((s) => s.open);
  return {
    available: available && tripId !== null,
    askAbout: (placeId: number) => {
      if (tripId !== null) openWith(tripId, { placeIds: [placeId] });
    },
    open,
  };
}
