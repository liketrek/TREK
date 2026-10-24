import type {
  JourneyMapLayerResult,
  JourneyMapLayersResponse,
  JourneyMapPlace,
  JourneyMapStay,
  JourneyPublicMapLayersResponse,
  JourneyTrack,
} from '@trek/shared';
import { safeColor, type JourneyMapMark } from './journeyMapMarks';

/**
 * The four layers of a journey map (JRN-04), switched on and off one by one
 * by each reader for themselves. A switch only ever hides: it changes no
 * trip, entry or photo, and it never shows a reader what the journey does not
 * give them.
 */
const JOURNEY_MAP_LAYERS = ['plan', 'recorded', 'entries', 'photos'] as const;
export type JourneyMapLayer = (typeof JOURNEY_MAP_LAYERS)[number];
export type JourneyMapVisibility = Record<JourneyMapLayer, boolean>;

/** The layers a renderer draws itself and switches in place; the photos it is handed or not. */
export type JourneyMapLayerVisibility = Pick<JourneyMapVisibility, 'plan' | 'recorded' | 'entries'>;

export const ALL_VISIBLE: JourneyMapVisibility = { plan: true, recorded: true, entries: true, photos: true };

/** What a layer's switch tells the reader beside its count; `idle` is a layer not read yet because it is off. */
type JourneyMapLayerState = 'ready' | 'loading' | 'unavailable' | 'empty' | 'idle';

export interface JourneyMapLayerControl {
  layer: JourneyMapLayer;
  count: number;
  state: JourneyMapLayerState;
}

/** A switch's name, and what its tooltip adds when the layer has nothing to draw or could not be read. */
export const LAYER_TEXT: Record<JourneyMapLayer, { labelKey: string; emptyKey: string; unavailableKey: string }> = {
  plan: {
    labelKey: 'journey.map.layer.plan',
    emptyKey: 'journey.map.layer.planEmpty',
    unavailableKey: 'journey.map.layer.planUnavailable',
  },
  recorded: {
    labelKey: 'journey.map.layer.recorded',
    emptyKey: 'journey.map.layer.recordedEmpty',
    unavailableKey: 'journey.map.layer.recordedUnavailable',
  },
  entries: {
    labelKey: 'journey.map.layer.entries',
    emptyKey: 'journey.map.layer.entriesEmpty',
    unavailableKey: 'journey.map.layer.entriesUnavailable',
  },
  photos: {
    labelKey: 'journey.map.layer.photos',
    emptyKey: 'journey.map.layer.photosEmpty',
    unavailableKey: 'journey.map.layer.photosEmpty',
  },
};

const STORAGE_PREFIX = 'trek:journey-map-layers:';

/**
 * Where a reader's switches are kept: per journey, and per link on a shared
 * page. The link's token is the credential to the journey, so only a hash of
 * it is written to the browser's storage.
 */
export function layersStorageKey(scope: { journeyId: number } | { token: string }): string {
  if ('journeyId' in scope) return `${STORAGE_PREFIX}${scope.journeyId}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < scope.token.length; i++) {
    hash ^= scope.token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${STORAGE_PREFIX}pub:${(hash >>> 0).toString(36)}`;
}

/** A stored value read leniently: a layer it does not name stays at its default. */
export function parseStoredLayers(raw: string | null): JourneyMapVisibility {
  if (!raw) return ALL_VISIBLE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return ALL_VISIBLE;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return ALL_VISIBLE;
  const stored = parsed as Record<string, unknown>;
  const next = { ...ALL_VISIBLE };
  for (const layer of JOURNEY_MAP_LAYERS) {
    if (typeof stored[layer] === 'boolean') next[layer] = stored[layer] as boolean;
  }
  return next;
}

export function readStoredLayers(key: string): JourneyMapVisibility {
  try {
    return parseStoredLayers(window.localStorage.getItem(key));
  } catch {
    return ALL_VISIBLE;
  }
}

export function writeStoredLayers(key: string, visibility: JourneyMapVisibility): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(visibility));
  } catch {
    // A private window or blocked storage: the switch works for this visit only.
  }
}

/** The items of a source that answered, nothing for one that did not. */
export function itemsOf<T>(layer: JourneyMapLayerResult<T> | undefined): T[] {
  return layer?.status === 'ok' ? layer.items : [];
}

/** How a source that the reader may see stands, as its switch shows it. */
export function stateOf(
  layer: JourneyMapLayerResult<unknown> | undefined,
  loading: boolean,
  count: number
): JourneyMapLayerState {
  if (layer?.status === 'unavailable') return 'unavailable';
  if (!layer) return loading ? 'loading' : 'idle';
  return count > 0 ? 'ready' : 'empty';
}

/**
 * The marks of the plan and of the stays, as the renderers draw them. A
 * planned place an entry on the map came from is left to that entry's pin,
 * which carries the plan's check instead: one spot, one pin. Without the
 * entries layer the plan pin stands on its own again.
 */
export function buildMarks({
  places,
  stays,
  visibility,
  entryIdsOnMap,
  stayColor,
}: {
  places: JourneyMapPlace[];
  stays: JourneyMapStay[];
  visibility: JourneyMapVisibility;
  entryIdsOnMap: ReadonlySet<string>;
  stayColor: (entryId: number) => string | null;
}): { marks: JourneyMapMark[]; plannedEntryIds: ReadonlySet<string> } {
  const marks: JourneyMapMark[] = [];
  const plannedEntryIds = new Set<string>();
  if (visibility.plan) {
    for (const place of places) {
      const entryId = place.entry_id === null ? null : String(place.entry_id);
      if (visibility.entries && entryId && entryIdsOnMap.has(entryId)) {
        plannedEntryIds.add(entryId);
        continue;
      }
      marks.push({
        kind: 'plan',
        key: `plan:${place.place_id}`,
        lat: place.lat,
        lng: place.lng,
        color: safeColor(place.category_color),
        place,
      });
    }
  }
  if (visibility.entries) {
    for (const stay of stays) {
      marks.push({
        kind: 'stay',
        key: `stay:${stay.id}`,
        lat: stay.lat,
        lng: stay.lng,
        color: safeColor(stayColor(stay.entry_id)),
        stay,
      });
    }
  }
  return { marks, plannedEntryIds };
}

/** What the server answered for a map: a journey's own layers, or a link's with its recorded days. */
export type JourneyMapAnswer = JourneyMapLayersResponse | JourneyPublicMapLayersResponse;

const UNAVAILABLE = { status: 'unavailable' } as const;

/**
 * Every source of an answer on its own: undefined while nothing was read, all
 * unavailable when the read itself failed (null). The recorded days come only
 * with a link's answer; a journey's own map reads them with their details.
 */
export function sourcesOf(answer: JourneyMapAnswer | null | undefined): {
  places?: JourneyMapLayersResponse['places'];
  routes?: JourneyMapLayersResponse['routes'];
  stays?: JourneyMapLayersResponse['stays'];
  recordings?: JourneyPublicMapLayersResponse['recordings'];
} {
  if (answer === null) return { places: UNAVAILABLE, routes: UNAVAILABLE, stays: UNAVAILABLE, recordings: UNAVAILABLE };
  if (!answer) return {};
  const recordings = 'recordings' in answer ? (answer as JourneyPublicMapLayersResponse).recordings : undefined;
  return { places: answer.places, routes: answer.routes, stays: answer.stays, recordings };
}

/**
 * The switches a reader is offered, each with its count and state. A layer a
 * share link withholds is not offered at all; one with nothing to draw is,
 * dimmed, with the reason in its tooltip. A journey's own map always offers
 * what was recorded, which the screen reads itself.
 */
export function buildControls({
  ownJourney,
  sources,
  loading,
  counts,
  recordedRead = 'ready',
}: {
  ownJourney: boolean;
  sources: ReturnType<typeof sourcesOf>;
  loading: boolean;
  /** How the screen's own read of what was recorded went, for a journey's own map. */
  recordedRead?: 'loading' | 'ready' | 'unavailable';
  counts: { places: number; routes: number; recordedDays: number; entries: number; stays: number; photos: number };
}): JourneyMapLayerControl[] {
  const list: JourneyMapLayerControl[] = [];
  if (sources.places?.status !== 'withheld') {
    const state =
      sources.routes?.status === 'unavailable'
        ? 'unavailable'
        : stateOf(sources.places, loading, counts.places + counts.routes);
    list.push({ layer: 'plan', count: counts.places, state });
  }
  if (ownJourney || sources.recordings?.status !== 'withheld') {
    const state = ownJourney
      ? ownRecordedState(recordedRead, counts.recordedDays)
      : stateOf(sources.recordings, loading, counts.recordedDays);
    list.push({ layer: 'recorded', count: counts.recordedDays, state });
  }
  const entriesState =
    sources.stays?.status === 'unavailable' ? 'unavailable' : counts.entries + counts.stays > 0 ? 'ready' : 'empty';
  list.push({ layer: 'entries', count: counts.entries, state: entriesState });
  list.push({ layer: 'photos', count: counts.photos, state: counts.photos > 0 ? 'ready' : 'empty' });
  return list;
}

function ownRecordedState(read: 'loading' | 'ready' | 'unavailable', days: number): JourneyMapLayerState {
  if (read === 'unavailable') return 'unavailable';
  if (days > 0) return 'ready';
  return read === 'loading' ? 'loading' : 'empty';
}

/** Whether a track belongs to the plan (a trip's GPX) or to what was recorded. */
export function isPlannedTrack(track: JourneyTrack): boolean {
  return !track.kind || track.kind === 'trip_gpx';
}
