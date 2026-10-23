import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AssistantGhost, AssistantMapProps } from '../../components/Map/mapViewContract';
import {
  activityFocus,
  blockDays,
  changeEffects,
  dayPoints,
  ghostCandidates,
  liveGhosts,
  overlaySnapshot,
  windowCover,
  type GhostCandidate,
  type LatLng,
} from '../../store/assistantMapModel';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { AssignmentsMap, Category, Place } from '../../types';
import { prefersReducedMotion } from '../../utils/reducedMotion';
import { useAssistantRouteLines } from './useAssistantRouteLines';

/** Moves the map was not asked for come at most this often while the assistant works. */
const AUTO_CAMERA_GAP_MS = 2000;
/** How long a place that just arrived from an applied suggestion pops. */
const POP_MS = 1000;
const NO_IDS: readonly number[] = [];

interface CompareViewOptions<P extends { id: number }> {
  tripId: number;
  /** The planner's view of the plan (hotel and hidden service stops left out). */
  assignments: AssignmentsMap;
  /** The plan as the store holds it. */
  storedAssignments: AssignmentsMap;
  places: P[];
}

/**
 * "Before" on the map: while the user compares, the days the last applied
 * block touched show their plan from just before it ran, the places it made
 * are left off, and no pin can be dragged onto a day, since the plan shown is
 * not the one a drop would change. Otherwise everything passes through as is.
 */
export function useAssistantCompareView<P extends { id: number }>({
  tripId,
  assignments,
  storedAssignments,
  places,
}: CompareViewOptions<P>): { assignments: AssignmentsMap; places: P[]; markersLocked: boolean } {
  const compare = useAssistantStore((s) => chatOf(s, tripId).compare);
  return useMemo(() => {
    if (compare?.mode !== 'before') return { assignments, places, markersLocked: false };
    const added = new Set(compare.addedPlaceIds);
    return {
      assignments: overlaySnapshot(assignments, storedAssignments, compare.snapshot),
      places: added.size > 0 ? places.filter((p) => !added.has(p.id)) : places,
      markersLocked: true,
    };
  }, [assignments, compare, places, storedAssignments]);
}

interface MapLinkOptions {
  tripId: number;
  isMobile: boolean;
  /** The desktop map lock: a locked map never moves on its own. */
  mapLocked: boolean;
  /** The places on the plan map now, so a suggestion about one of them marks its pin instead of a ghost. */
  mapPlaces: readonly { id: number }[];
  assignments: AssignmentsMap;
  markersLocked: boolean;
  selectDay: (dayId: number) => void;
}

/**
 * Everything the assistant shows on the trip map, as props for MapViewAuto:
 * its waiting suggestions as ghosts tied to their rows in the chat, the
 * routes its cards show (useAssistantRouteLines), the camera moves it asks
 * for, and the pop of a place that arrives from an applied suggestion. A
 * spot a card points at is a pin of its own, or the pulse of a trip place's
 * own pin. Desktop and phone both get it through useTripPlanner.
 */
export function useAssistantMapLink(options: MapLinkOptions): AssistantMapProps {
  const { tripId, isMobile, mapLocked, mapPlaces, assignments, markersLocked, selectDay } = options;
  const places = useTripStore((s) => s.places);
  const categories = useTripStore((s) => s.categories);
  const candidates = useGhostCandidates(tripId);
  const knownIds = useMemo(() => new Set(places.map((p) => p.id)), [places]);
  const preview = useAssistantStore((s) => (s.preview?.tripId === tripId ? s.preview : null));
  const linkId = useAssistantStore((s) => (s.mapLink?.tripId === tripId ? s.mapLink.hoveredId : null));
  const setMapHover = useAssistantStore((s) => s.setMapHover);
  const autoAllowed = useAutoCameraAllowed(isMobile, mapLocked);
  const route = useAssistantRouteLines({ tripId, isMobile, autoAllowed });
  const { hiddenGhosts, cardGhosts } = route;
  // A change whose card draws its own line stands on the map as that line, not as a pin at its start.
  const live = useMemo(
    () => liveGhosts(candidates, knownIds).filter((c) => !hiddenGhosts.has(c.toolCallId)),
    [candidates, hiddenGhosts, knownIds]
  );

  const onMapIds = useMemo(() => new Set(mapPlaces.map((p) => p.id)), [mapPlaces]);
  const { ghosts, existing } = useMemo(
    () => ghostPins(live, { places, categories, onMap: onMapIds }),
    [categories, live, onMapIds, places]
  );
  const previewPlace = preview?.placeId !== undefined && onMapIds.has(preview.placeId) ? preview.placeId : null;
  const previewId = preview && previewPlace === null ? `preview:${preview.ref}` : null;
  const shownGhosts = useMemo(() => {
    const all = cardGhosts.length > 0 ? [...ghosts, ...cardGhosts] : ghosts;
    if (!preview || !previewId) return all;
    return [...all, { id: previewId, lat: preview.lat, lng: preview.lng, name: preview.name }];
  }, [cardGhosts, ghosts, preview, previewId]);

  const onGhostHover = useCallback((id: string | null) => setMapHover(tripId, id, 'map'), [setMapHover, tripId]);
  const onGhostClick = useCallback((id: string) => setMapHover(tripId, id, 'map'), [setMapHover, tripId]);

  useAutoCamera({ tripId, live, ghosts, assignments, autoAllowed });
  const assistantCamera = useCameraProp(tripId, isMobile);
  const poppedPlaceIds = useArrivalPop(tripId, knownIds, selectDay, autoAllowed);
  const pulse = previewPlace ?? (linkId ? (existing.get(linkId) ?? null) : null);

  return useMemo(
    () => ({
      assistantGhosts: shownGhosts,
      assistantHoveredId: previewId ?? linkId,
      onAssistantGhostHover: onGhostHover,
      onAssistantGhostClick: onGhostClick,
      assistantPulsePlaceId: pulse,
      assistantCamera,
      poppedPlaceIds,
      markersLocked,
      assistantRouteLines: route.assistantRouteLines,
      onAssistantRouteHover: route.onAssistantRouteHover,
      onAssistantRoutePoint: route.onAssistantRoutePoint,
      routeProfileFocus: route.routeProfileFocus,
    }),
    [
      assistantCamera,
      linkId,
      markersLocked,
      onGhostClick,
      onGhostHover,
      poppedPlaceIds,
      previewId,
      pulse,
      route.assistantRouteLines,
      route.onAssistantRouteHover,
      route.onAssistantRoutePoint,
      route.routeProfileFocus,
      shownGhosts,
    ]
  );
}

/**
 * The thread's ghost candidates, re-read only when they change. The selector
 * hands back a string so a streamed text delta, which rewrites the messages
 * on every frame, does not render the whole planner each time.
 */
function useGhostCandidates(tripId: number): GhostCandidate[] {
  const signature = useAssistantStore((s) => JSON.stringify(ghostCandidates(chatOf(s, tripId).messages)));
  return useMemo(() => JSON.parse(signature) as GhostCandidate[], [signature]);
}

interface GhostPinSources {
  places: readonly Place[];
  categories: readonly Category[];
  /** The places with a pin of their own on the map now. */
  onMap: ReadonlySet<number>;
}

/**
 * The ghosts to draw, and for a suggestion about a place that has its own pin
 * on the map, that place (its pin pulses instead). A place that is in the
 * trip but not on the map (filtered out by category) is drawn as a ghost too,
 * or hovering its row would show nothing.
 */
function ghostPins(
  live: readonly GhostCandidate[],
  { places, categories, onMap }: GhostPinSources
): { ghosts: AssistantGhost[]; existing: Map<string, number> } {
  const ghosts: AssistantGhost[] = [];
  const existing = new Map<string, number>();
  const categoryOf = (id: number | null | undefined) => categories.find((c) => c.id === id);
  for (const { toolCallId, effect } of live) {
    if (effect.place) {
      const category = categoryOf(effect.place.categoryId);
      const { lat, lng, name } = effect.place;
      ghosts.push({ id: toolCallId, lat, lng, name, color: category?.color, icon: category?.icon });
      continue;
    }
    const placeId = effect.placeId;
    if (placeId === null) continue;
    if (onMap.has(placeId)) {
      existing.set(toolCallId, placeId);
      continue;
    }
    const place = places.find((p) => p.id === placeId);
    if (place?.lat == null || place.lng == null) continue;
    const category = categoryOf(place.category_id);
    ghosts.push({
      id: toolCallId,
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      color: category?.color,
      icon: category?.icon,
    });
  }
  return { ghosts, existing };
}

/**
 * Whether the map may move without being asked: the setting is on, motion is
 * not reduced, the desktop map is not locked, and on the phone the chat is
 * folded down to its pill so the map is what the user sees.
 */
function useAutoCameraAllowed(isMobile: boolean, mapLocked: boolean): boolean {
  const follow = useSettingsStore((s) => s.settings.assistant_map_follow) !== false;
  const minimized = useAssistantStore((s) => s.window.open && s.window.minimized);
  if (!follow || prefersReducedMotion()) return false;
  return isMobile ? minimized : !mapLocked;
}

interface AutoCameraOptions {
  tripId: number;
  live: readonly GhostCandidate[];
  ghosts: readonly AssistantGhost[];
  assignments: AssignmentsMap;
  autoAllowed: boolean;
}

/**
 * The two moves the map makes on its own: to a new block of suggestions once
 * the answer holding it is complete (once per block, framing the ghosts with
 * the days they join), and to the area a running step searches (at most every
 * two seconds, and never back afterwards). A block already waiting when the
 * planner opens is left where it is.
 */
function useAutoCamera({ tripId, live, ghosts, assignments, autoAllowed }: AutoCameraOptions): void {
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const isRunning = useAssistantStore((s) => chatOf(s, tripId).isRunning);
  const activity = useAssistantStore((s) => chatOf(s, tripId).live.activity);
  const waiting = live.filter((c) => c.status === 'waiting');
  const blockKey = isRunning ? null : (waiting[0]?.toolCallId ?? null);
  const seenBlock = useRef<string | null | undefined>(undefined);
  const lastAuto = useRef(0);

  useEffect(() => {
    const first = seenBlock.current === undefined;
    if (!first && (blockKey === null || blockKey === seenBlock.current)) return;
    seenBlock.current = blockKey;
    if (first || blockKey === null || !autoAllowed) return;
    const points: LatLng[] = [
      ...ghosts.map((g): LatLng => [g.lat, g.lng]),
      ...dayPoints(assignments, blockDays(waiting.map((c) => c.effect))),
    ];
    requestCamera(tripId, points, 'fit', 'auto');
  }, [assignments, autoAllowed, blockKey, ghosts, requestCamera, tripId, waiting]);

  useEffect(() => {
    if (!activity?.area || !autoAllowed) return;
    const now = Date.now();
    if (now - lastAuto.current < AUTO_CAMERA_GAP_MS) return;
    lastAuto.current = now;
    requestCamera(tripId, activityFocus(activity.area), 'fit', 'auto');
  }, [activity, autoAllowed, requestCamera, tripId]);
}

/** The store's camera request for this trip as the map's prop, with what the floating window covers. */
function useCameraProp(tripId: number, isMobile: boolean): AssistantMapProps['assistantCamera'] {
  const camera = useAssistantStore((s) => (s.camera?.tripId === tripId ? s.camera : null));
  const windowRect = useAssistantStore((s) => s.windowRect);
  return useMemo(() => {
    if (!camera) return null;
    const cover =
      isMobile || typeof window === 'undefined'
        ? null
        : windowCover(windowRect, window.innerWidth, document.documentElement.dir === 'rtl');
    return {
      key: String(camera.seq),
      points: camera.points,
      mode: camera.mode,
      animate: !prefersReducedMotion(),
      auto: camera.why === 'auto',
      at: camera.at,
      cover,
    };
  }, [camera, isMobile, windowRect]);
}

/**
 * When a place from an applied suggestion reaches the trip, its pin pops for
 * a moment. Once the block has run, the day of its last arrived change is
 * selected, which frames the map on it: one move per block, and only where
 * the map may move on its own. The change applied before the planner opened
 * is left alone.
 */
function useArrivalPop(
  tripId: number,
  knownIds: ReadonlySet<number>,
  selectDay: (dayId: number) => void,
  autoAllowed: boolean
) {
  const applied = useAssistantStore((s) => (s.lastApplied?.tripId === tripId ? s.lastApplied.applied : null));
  const isRunning = useAssistantStore((s) => chatOf(s, tripId).isRunning);
  const effect = useAssistantStore((s) =>
    applied ? (changeEffects(chatOf(s, tripId).messages).get(applied.toolCallId) ?? null) : null
  );
  const key = applied?.toolCallId ?? null;
  const placeId = applied?.entity === 'place' ? (applied.ids[0] ?? null) : (effect?.placeId ?? null);
  const arrived = key !== null && effect?.kind !== 'remove' && placeId !== null && knownIds.has(placeId);
  const [popDone, setPopDone] = useState(key);
  const handled = useRef(key);
  const pendingDay = useRef<number | null>(null);
  const popping = arrived && key !== popDone;

  useEffect(() => {
    if (!popping) return;
    const timer = window.setTimeout(() => setPopDone(key), POP_MS);
    return () => window.clearTimeout(timer);
  }, [key, popping]);

  useEffect(() => {
    if (!arrived || handled.current === key) return;
    handled.current = key;
    const dayId = applied?.dayId ?? effect?.dayId ?? null;
    if (dayId !== null) pendingDay.current = dayId;
  }, [applied, arrived, effect, key]);

  useEffect(() => {
    const dayId = pendingDay.current;
    if (isRunning || dayId === null) return;
    pendingDay.current = null;
    if (autoAllowed) selectDay(dayId);
  }, [arrived, autoAllowed, isRunning, key, selectDay]);

  return useMemo(() => (popping && placeId !== null ? [placeId] : NO_IDS), [placeId, popping]);
}
