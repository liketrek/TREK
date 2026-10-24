import { useCallback, useEffect, useRef } from 'react';
import { tourDraftRepo } from '../../../repo/tourDraftRepo';
import { draftFromText, type DraftPayload } from './tourPlannerDraft';

/**
 * The planner's draft kept on the account between visits, one per trip, so a
 * draft started on one device opens on the next. The draft found when the
 * planner opens is handed to `onRestored` once its read is back, unless the
 * planner kept or forgot a draft meanwhile (the traveller began something
 * else); one that does not pass the check is left alone. Keeping writes once
 * the edits settle, and a draft still waiting goes out when the planner
 * closes; forgetting throws the account's draft away once it is saved or
 * discarded.
 */
export function useTourDraftStorage(tripId: number | string, onRestored: (draft: DraftPayload) => void) {
  // Set by a keep or a forget: a read that comes back afterwards is older than what the planner holds.
  const touchedRef = useRef(false);
  // Whether the account may hold a draft of this trip, so a forget without one sends nothing.
  const heldRef = useRef(true);
  // The planner's restore as it was last rendered, so a new one does not read the draft again.
  const restoreRef = useRef(onRestored);
  useEffect(() => {
    restoreRef.current = onRestored;
  }, [onRestored]);

  useEffect(() => {
    let cancelled = false;
    touchedRef.current = false;
    heldRef.current = true;
    void tourDraftRepo.read(tripId).then(
      (text) => {
        if (cancelled || touchedRef.current) return;
        heldRef.current = text !== null;
        const draft = draftFromText(text);
        if (draft) restoreRef.current(draft);
      },
      // Not readable now (offline with nothing cached, or refused): the planner starts empty,
      // and the account keeps its draft for the next visit.
      () => false
    );
    // A page closed or reloaded before the edits settled still sends the newest draft.
    const sendNow = () => tourDraftRepo.flush(tripId);
    window.addEventListener('pagehide', sendNow);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', sendNow);
      sendNow();
    };
  }, [tripId]);

  const keep = useCallback(
    (draft: DraftPayload) => {
      touchedRef.current = true;
      heldRef.current = true;
      tourDraftRepo.keep(tripId, JSON.stringify(draft));
    },
    [tripId]
  );

  const forget = useCallback(() => {
    touchedRef.current = true;
    if (!heldRef.current) return;
    heldRef.current = false;
    void tourDraftRepo.forget(tripId).then(
      () => true,
      // Refused by the account: the draft stays there, and the next save or discard asks again.
      () => {
        heldRef.current = true;
      }
    );
  }, [tripId]);

  return { keep, forget };
}
