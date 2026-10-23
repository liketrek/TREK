import { cumulativeMetres, nearestAlongM, type TrekCard } from '@trek/shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { CARD_MAP_LOOK, CARD_RULES } from '../../components/Assistant/cards/cardLooks';
import { alongOf, profileSamples, routeEntries, wayGroups } from '../../components/Assistant/cards/tour/tourRouteModel';
import { useMapPaint } from '../../components/Map/mapPaint';
import type { AssistantGhost } from '../../components/Map/mapViewContract';
import {
  type AnswerLayout,
  cardGhosts,
  cardHiddenGhosts,
  lookPoints,
  type RouteCardEntry,
  routeLines,
  type RouteRef,
  routeRefs,
} from '../../store/assistantRouteModel';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import type { AssistantRouteLine } from '../../types/assistantMap';
import {
  focusRouteProfileAtDistance,
  parseRenderableRouteGeometry,
  type RouteProfileFocus,
} from '../../utils/routeGeometry';

/**
 * The chat's routes on the plan's map, the one channel the tour and road
 * trip cards share: what the cards draw (through their map looks), lit with
 * their cards both ways, the spot of a route in focus shown on the map and
 * picked from it, and the drive or saved tour a card points at. Desktop and
 * phone both get it through useAssistantMapLink.
 */

/** A saved tour's key on the map, as the tour list lights it. */
const SAVED_TOUR = 'tour:';
/** The colours a lit saved tour and a pointed-at drive are drawn in, the planner's own (styles/hike.css). */
const SAVED_PAINT = { line: 'var(--hike-variant-current)', casing: 'var(--bike-highlight-casing)' } as const;
const PREVIEW_CASING = 'var(--bg-card)';
/** Two tokens that change with the theme, so the resolved colours follow a light or dark switch. */
const THEME_PROBE = { accent: '--accent', card: '--bg-card' } as const;

/**
 * How an answer lays out its cards, as the chat does: consecutive cards of
 * one group show as one, and the tours' proposals of one activity as a
 * choice of up to three ways.
 */
export const answerLayout: AnswerLayout = (entries) => {
  const runs: { group: string; entries: RouteCardEntry[] }[] = [];
  for (const entry of entries) {
    const group = CARD_RULES.group(entry.card);
    const run = runs[runs.length - 1];
    if (run?.group === group) run.entries.push(entry);
    else runs.push({ group, entries: [entry] });
  }
  return runs.flatMap((run) => {
    const routes = routeEntries(run.entries);
    return routes.length === run.entries.length ? wayGroups(routes) : run.entries.map((entry) => [entry]);
  });
};

/**
 * The spot of a route nearest to a point on the map, as the route's card
 * measures it: metres along its line scaled to its own length, with the
 * height there. Only a route with a height profile has one.
 */
export function routeFocusAt(card: TrekCard, lat: number, lng: number): RouteProfileFocus | null {
  if (card.kind !== 'tourRoute') return null;
  const samples = profileSamples(card);
  if (samples.length < 2) return null;
  const raw = cumulativeMetres(card.line);
  const scaled = alongOf(card);
  const rawTotal = raw[raw.length - 1] ?? 0;
  const scale = rawTotal > 0 ? (scaled[scaled.length - 1] ?? 0) / rawTotal : 1;
  return focusRouteProfileAtDistance(samples, nearestAlongM(card.line, lat, lng) * scale);
}

/** A saved tour of the trip lit from the chat (its row in a tour list), drawn over its own track. */
function savedTourLine(places: readonly Place[], hoveredId: string | null): AssistantRouteLine[] {
  if (!hoveredId?.startsWith(SAVED_TOUR)) return [];
  const placeId = Number(hoveredId.slice(SAVED_TOUR.length));
  const points = parseRenderableRouteGeometry(places.find((place) => place.id === placeId)?.route_geometry);
  if (!points) return [];
  const line = points.map(([lat, lng]): [number, number] => [lat, lng]);
  const { line: color, casing } = SAVED_PAINT;
  return [{ id: hoveredId, ref: hoveredId, lines: [line], color, casing, hot: true }];
}

/** The theme's colour for a CSS value (`var(--token)`), read again when the theme changes; other values as they are. */
function useCssColor(): (value: string) => string {
  const theme = useMapPaint(THEME_PROBE);
  return useMemo(() => {
    const style = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
    return (value: string) => {
      const token = /^var\((--[\w-]+)\)$/.exec(value.trim())?.[1];
      if (!token) return value;
      return style?.getPropertyValue(token).trim() || theme.accent;
    };
  }, [theme]);
}

/** A line with its colours resolved, as both map renderers need them. */
function painted(line: AssistantRouteLine, color: (value: string) => string): AssistantRouteLine {
  const next = { ...line, color: color(line.color), casing: color(line.casing) };
  if (line.tints) next.tints = line.tints.map((tint) => ({ ...tint, color: color(tint.color) }));
  return next;
}

/**
 * Each card object the map has seen, by a number of its own. A streamed text
 * delta leaves the cards' objects alone and a card that changes (a change's
 * applied card replacing its preview) is a new object, so the number tells
 * whether the map must redraw without comparing the cards. A weak cache: a
 * card the chat let go of leaves it.
 */
const cardSerials = new WeakMap<object, number>();
let lastSerial = 0;

function serialOf(card: object): number {
  let serial = cardSerials.get(card);
  if (serial === undefined) {
    lastSerial += 1;
    serial = lastSerial;
    cardSerials.set(card, serial);
  }
  return serial;
}

function refsNow(state: Parameters<typeof chatOf>[0], tripId: number, knownIds: ReadonlySet<number>): RouteRef[] {
  const chat = chatOf(state, tripId);
  return routeRefs(chat.messages, chat.picks, knownIds, CARD_MAP_LOOK, answerLayout);
}

/**
 * The cards the map draws now, re-read only when one of them changes. The
 * selector hands back a key, so a streamed answer does not render the
 * planner on every frame.
 */
function useRouteRefs(tripId: number, knownIds: ReadonlySet<number>): RouteRef[] {
  const signature = useAssistantStore((s) =>
    refsNow(s, tripId, knownIds)
      .map((ref) => `${ref.toolCallId}|${ref.use}|${ref.way ?? ''}|${ref.picked ? 1 : 0}|${serialOf(ref.card)}`)
      .join(';')
  );
  return useMemo(
    () => (signature === '' ? [] : refsNow(useAssistantStore.getState(), tripId, knownIds)),
    [signature, knownIds, tripId]
  );
}

interface RouteLinesOptions {
  tripId: number;
  isMobile: boolean;
  /** Whether the map may move without being asked (see useAssistantMapLink). */
  autoAllowed: boolean;
}

/**
 * Everything the chat's routes put on the plan's map: the lines, the spots
 * the waiting changes' cards mark (and the changes whose pin their own line
 * replaces), the focus pin, and the pointer's way back to the cards. A
 * pointer on a line lights its card; moving along it moves the card's
 * profile; leaving puts both out. On the phone a tap does what the pointer
 * does, and opens the route's peek over the map.
 */
export function useAssistantRouteLines({ tripId, isMobile, autoAllowed }: RouteLinesOptions) {
  const places = useTripStore((s) => s.places);
  const knownIds = useMemo(() => new Set(places.map((place) => place.id)), [places]);
  const refs = useRouteRefs(tripId, knownIds);
  const hoveredId = useAssistantStore((s) => (s.mapLink?.tripId === tripId ? s.mapLink.hoveredId : null));
  const preview = useAssistantStore((s) => (s.routePreview?.tripId === tripId ? s.routePreview : null));
  const focus = useAssistantStore((s) => (s.routeFocus?.tripId === tripId ? s.routeFocus.focus : null));
  const setMapHover = useAssistantStore((s) => s.setMapHover);
  const setRouteFocus = useAssistantStore((s) => s.setRouteFocus);
  const setRoutePeek = useAssistantStore((s) => s.setRoutePeek);
  const color = useCssColor();

  const assistantRouteLines = useMemo(() => {
    const drawn = [...routeLines(refs, CARD_MAP_LOOK, hoveredId), ...savedTourLine(places, hoveredId)];
    if (preview) {
      const { ref, lines } = preview;
      drawn.push({ id: `preview:${ref}`, ref, lines, color: preview.color, casing: PREVIEW_CASING, hot: true });
    }
    return drawn.map((line) => painted(line, color));
  }, [color, hoveredId, places, preview, refs]);

  const ghosts = useMemo(
    () =>
      cardGhosts(refs, CARD_MAP_LOOK).map((ghost): AssistantGhost => ({
        id: ghost.id,
        ref: ghost.ref,
        lat: ghost.lat,
        lng: ghost.lng,
        name: ghost.name,
        variant: ghost.variant ?? 'pin',
      })),
    [refs]
  );
  const hiddenGhosts = useMemo(() => cardHiddenGhosts(refs, CARD_MAP_LOOK), [refs]);

  const latestRefs = useRef(refs);
  useLayoutEffect(() => {
    latestRefs.current = refs;
  });
  const frame = useRef<number | null>(null);
  const pointed = useRef<{ ref: string; lat: number; lng: number } | null>(null);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const onAssistantRouteHover = useCallback(
    (ref: string | null) => {
      setMapHover(tripId, ref, 'map');
      if (ref !== null) return;
      const current = useAssistantStore.getState().routeFocus;
      if (current?.tripId === tripId && current.source === 'map') setRouteFocus(null);
    },
    [setMapHover, setRouteFocus, tripId]
  );

  // Pointer moves come many per frame; the focus follows once a frame.
  const onAssistantRoutePoint = useCallback(
    (ref: string, lat: number, lng: number) => {
      pointed.current = { ref, lat, lng };
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const point = pointed.current;
        pointed.current = null;
        if (!point) return;
        const card = latestRefs.current.find((r) => r.toolCallId === point.ref && r.use !== 'before')?.card ?? null;
        const spot = card ? routeFocusAt(card, point.lat, point.lng) : null;
        if (spot) setRouteFocus({ tripId, ref: point.ref, focus: spot, source: 'map' });
        // The light goes on only with the peek, whose closing puts it out again (moveRoutePeek).
        if (!isMobile || card?.kind !== 'tourRoute') return;
        setMapHover(tripId, point.ref, 'map');
        setRoutePeek({ tripId, toolCallId: point.ref });
      });
    },
    [isMobile, setMapHover, setRouteFocus, setRoutePeek, tripId]
  );

  useRouteAutoCamera(tripId, refs, autoAllowed);

  return {
    assistantRouteLines,
    onAssistantRouteHover,
    onAssistantRoutePoint,
    routeProfileFocus: focus,
    cardGhosts: ghosts,
    hiddenGhosts,
  };
}

/**
 * One move of its own per new answer that draws routes: once the answer is
 * complete, the map frames all its ways, where the map may move by itself.
 * An answer already there when the planner opens is left where it is, even
 * when the planner opens while the chat is still writing and the new answer
 * draws no routes of its own.
 */
function useRouteAutoCamera(tripId: number, refs: readonly RouteRef[], autoAllowed: boolean): void {
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const isRunning = useAssistantStore((s) => chatOf(s, tripId).isRunning);
  const firstKey = refs.find((ref) => ref.use === 'look')?.toolCallId ?? null;
  const blockKey = isRunning ? null : firstKey;
  const seen = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (seen.current === undefined) {
      // What the chat shows at mount counts as seen, finished or not.
      seen.current = firstKey;
      return;
    }
    if (blockKey === null || blockKey === seen.current) return;
    seen.current = blockKey;
    if (!autoAllowed) return;
    const points = lookPoints(refs, CARD_MAP_LOOK);
    if (points.length > 0) requestCamera(tripId, points, 'fit', 'auto');
  }, [autoAllowed, blockKey, firstKey, refs, requestCamera, tripId]);
}
