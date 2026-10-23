import type { TourRouteCard } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useNetworkMode } from '../../../../hooks/useNetworkMode';
import { chatOf, type HoldOutcome, useAssistantStore } from '../../../../store/assistantStore';
import { useCanDo } from '../../../../store/permissionsStore';
import { useTripStore } from '../../../../store/tripStore';
import type { RouteProfileFocus } from '../../../../utils/routeGeometry';
import { hasUndecided } from '../../assistantParts';
import { useAssistantView } from '../../assistantViewContext';
import { useChangeHover } from '../../useChangeHover';
import { tourTarget } from './tourLook';
import { canTake, routePoints } from './tourRouteModel';
import { takeInThread, takeOfProposal } from './tourTakeModel';

/**
 * What a route card and the phone's route peek share: the spot of the route
 * in focus, which the profile, a stop chip and the map's pointer all move.
 * A card or a peek that goes takes its spot on the map with it.
 */
export function useRouteFocus(toolCallId: string) {
  const { tripId } = useAssistantView();
  const focus = useAssistantStore((s) =>
    s.routeFocus?.tripId === tripId && s.routeFocus.ref === toolCallId ? s.routeFocus.focus : null
  );
  const setRouteFocus = useAssistantStore((s) => s.setRouteFocus);

  /** Puts the focus out, if it is still this card's. */
  const release = useCallback(() => {
    const current = useAssistantStore.getState().routeFocus;
    if (current?.tripId === tripId && current.ref === toolCallId) setRouteFocus(null);
  }, [tripId, toolCallId, setRouteFocus]);

  const setFocus = useCallback(
    (next: RouteProfileFocus | null) => {
      if (next) setRouteFocus({ tripId, ref: toolCallId, focus: next, source: 'card' });
      else release();
    },
    [tripId, toolCallId, setRouteFocus, release]
  );

  useEffect(() => release, [release]);

  return { focus, setFocus };
}

/**
 * A route card: the light between the card and its line on the map (resting
 * on one lights the other), the spot of the route in focus, and "On map",
 * which frames the route (a ways card frames all its ways, `frame`); on the
 * phone the chat steps aside first and the route's peek opens over the map.
 * The peek itself takes only the focus: its light is the map's, which
 * moveRoutePeek moves, so closing it leaves a light the chat put on alone.
 */
export function useTourRouteCard(toolCallId: string, card: TourRouteCard, frame?: readonly TourRouteCard[]) {
  const { tripId, variant, onRevealMap } = useAssistantView();
  const hover = useChangeHover(tripId, toolCallId);
  const { focus, setFocus } = useRouteFocus(toolCallId);
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const setRoutePeek = useAssistantStore((s) => s.setRoutePeek);

  const showOnMap = useCallback(() => {
    const points = (frame ?? [card]).flatMap(routePoints);
    if (points.length === 0) return;
    onRevealMap?.();
    requestCamera(tripId, points, 'fit', 'user');
    if (variant === 'fullscreen') setRoutePeek({ tripId, toolCallId });
  }, [card, frame, tripId, toolCallId, variant, onRevealMap, requestCamera, setRoutePeek]);

  return { lit: hover.lit, litFromMap: hover.litFromMap, handlers: hover.handlers, focus, setFocus, showOnMap };
}

/**
 * Lights a line on the map while what draws it is pointed at (a way of a
 * ways card, a saved tour's row), by the key the map draws it under; only
 * what lit it puts it out, since the pointer may already rest on another.
 */
export function useLineHover() {
  const { tripId } = useAssistantView();
  const setMapHover = useAssistantStore((s) => s.setMapHover);
  return useCallback(
    (ref: string, on: boolean) => {
      if (on) {
        setMapHover(tripId, ref, 'card');
        return;
      }
      const link = useAssistantStore.getState().mapLink;
      if (link?.tripId === tripId && link.hoveredId === ref) setMapHover(tripId, null, 'card');
    },
    [tripId, setMapHover]
  );
}

/** Where "Plan this" stands: not tapped, asking, held below for a decision, or refused. */
type TakeState = 'idle' | 'busy' | 'taken' | 'failed';

/** Where a take leaves the card: held is taken, a refusal says why, nothing held offers the button again. */
function stateAfter(outcome: HoldOutcome, error: string | null): TakeState {
  if (outcome === 'held') return 'taken';
  // A proposal the server can no longer find or create comes back as `generic`: the card asks for it again.
  // Any other refusal (busy, a limit) is the chat's to say, and the button is offered again.
  return outcome === 'refused' && error === 'generic' ? 'failed' : 'idle';
}

/**
 * "Plan this" on a proposed hike or city walk: one tap adds the tour. The
 * server holds the tour it creates as a change, without a model turn, and
 * the tap decides it at once, since tapping "Plan this" already is the
 * decision; the assistant then answers to what was added. Once the tour is
 * there, the desktop opens it in the Tours tab to be edited. It shows for
 * someone who may add places to the trip, and waits (saying why) while
 * offline, while the assistant answers or while another change is
 * undecided, since one decision answers every open card. A proposal the
 * server can no longer find or create is refused; the card then asks for it
 * to be asked again. Taken is read from the thread too, so a card drawn again
 * after its tour was held or applied does not offer it a second time.
 */
export function useTakeProposal(toolCallId: string, card: TourRouteCard) {
  const { tripId } = useAssistantView();
  const { offline } = useNetworkMode();
  const can = useCanDo();
  const trip = useTripStore((s) => (s.trip?.id === tripId ? s.trip : null));
  const { isRunning, threadId, waiting, held } = useAssistantStore(
    useShallow((s) => {
      const chat = chatOf(s, tripId);
      return {
        isRunning: chat.isRunning,
        threadId: chat.threadId,
        waiting: hasUndecided(chat.messages),
        held: takeInThread(chat.messages, toolCallId, card),
      };
    })
  );
  const takeProposal = useAssistantStore((s) => s.takeProposal);
  const decide = useAssistantStore((s) => s.decide);
  const { variant, onOpen } = useAssistantView();
  const [tapped, setState] = useState<TakeState>('idle');
  // The take this card started and decides; its tour opens once it is applied, and only then.
  const [started, setStarted] = useState<string | null>(null);
  const state: TakeState = held !== null && tapped !== 'busy' ? 'taken' : tapped;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const visible = canTake(card) && !!trip && can('place_edit', trip);
  let reasonKey: string | null = null;
  if (offline) reasonKey = 'assistant.error.offline';
  else if (waiting && state !== 'taken') reasonKey = 'assistant.composer.decideFirst';
  const disabled = reasonKey !== null || isRunning || threadId === null || state === 'busy';

  const take = useCallback(async () => {
    setState('busy');
    const outcome = await takeProposal(tripId, toolCallId);
    if (!mounted.current) return;
    // A refusal is kept as the chat's error, read only when the take was refused.
    setState(stateAfter(outcome, chatOf(useAssistantStore.getState(), tripId).error));
    if (outcome !== 'held') return;
    const waiting = takeOfProposal(chatOf(useAssistantStore.getState(), tripId).messages, toolCallId, card);
    if (waiting?.state !== 'waiting') return;
    setStarted(waiting.id);
    await decide(tripId, [{ toolCallId: waiting.id, approved: true }]);
  }, [takeProposal, decide, tripId, toolCallId, card]);

  // The tour this card added opens in the Tours tab, where it is edited; the phone has no such tab.
  const appliedPlace = useAssistantStore((s) => {
    if (!started) return null;
    const found = takeOfProposal(chatOf(s, tripId).messages, toolCallId, card);
    return found?.id === started && found.state === 'applied' ? found.placeId : null;
  });
  // Opened once per take, whatever renders follow.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (appliedPlace === null || opened.current === started) return;
    opened.current = started;
    if (variant !== 'fullscreen' && onOpen) onOpen(tourTarget(appliedPlace));
  }, [appliedPlace, started, variant, onOpen]);

  // While the take this card started is being decided, the card says it is being planned, not that it waits below.
  const deciding = started !== null && held === 'waiting';
  return { visible, disabled, reasonKey, state, applied: held === 'applied', deciding, take };
}
