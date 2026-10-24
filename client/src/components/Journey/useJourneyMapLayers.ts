import type { JourneyTrack } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTranslation } from '../../i18n';
import { journeyMapRepo } from '../../repo/journeyMapRepo';
import { DAWARICH_TRAIL_COLOR } from '../Map/dawarichTrail';
import {
  ALL_VISIBLE,
  buildControls,
  buildMarks,
  itemsOf,
  layersStorageKey,
  readStoredLayers,
  sourcesOf,
  writeStoredLayers,
  type JourneyMapAnswer,
  type JourneyMapLayer,
  type JourneyMapLayerControl,
  type JourneyMapVisibility,
} from './journeyMapLayers';
import type { JourneyMapMark } from './journeyMapMarks';

/** Whose map it is: a journey its reader belongs to, or one a share link opens. */
type JourneyMapSource = { journeyId: number } | { token: string };

export interface JourneyMapLayersView {
  visibility: JourneyMapVisibility;
  toggle: (layer: JourneyMapLayer) => void;
  /** The switches the reader is offered: a layer a share link does not show is not among them. */
  controls: JourneyMapLayerControl[];
  /** The plan's routes and what was recorded, each kind hidden by its own switch on the map. */
  tracks: JourneyTrack[];
  marks: JourneyMapMark[];
  /** Entry pins whose place the plan had too: they carry the plan's check. */
  plannedEntryIds: ReadonlySet<string>;
}

interface Options {
  /** Null until the journey the screen names is the one loaded. */
  source: JourneyMapSource | null;
  /** Changes when entries come or go, so a place's entry and a report's stays follow. */
  refreshKey?: string;
  /** The entries that have a pin on the map. */
  entryIdsOnMap: ReadonlySet<string>;
  photoCount: number;
  /** What was recorded that the screen already holds: the kept days and the live trail of a journey's people. */
  recordedTracks?: JourneyTrack[];
  /** How reading those went: a failed read is not a journey with nothing recorded. */
  recordedRead?: 'loading' | 'ready' | 'unavailable';
  /** The colour of the pins of a day, so a stay and a recorded day read with their day. */
  colorOfDay: (date: string) => string | null;
  /** The day an entry is on, for the colour of its stays. */
  dateOfEntry: (entryId: number) => string | null;
  /**
   * Every layer on, whatever this browser kept. On by default on a phone,
   * which shows no switches, so a layer once switched off there would stay
   * off with no way back. A switch that is still offered then holds only for
   * the visit.
   */
  allLayers?: boolean;
}

const NO_TRACKS: JourneyTrack[] = [];

/** The reader's switches, kept per journey (or per link) in this browser. */
function useLayerSwitches(storageKey: string | null) {
  const [stored, setStored] = useState<{ key: string | null; visibility: JourneyMapVisibility } | null>(null);
  const visibility = useMemo(() => {
    if (stored && stored.key === storageKey) return stored.visibility;
    return storageKey ? readStoredLayers(storageKey) : ALL_VISIBLE;
  }, [stored, storageKey]);
  const toggle = useCallback(
    (layer: JourneyMapLayer) => {
      const next = { ...visibility, [layer]: !visibility[layer] };
      setStored({ key: storageKey, visibility: next });
      if (storageKey) writeStoredLayers(storageKey, next);
    },
    [visibility, storageKey]
  );
  return { visibility, toggle };
}

/**
 * The layers read from the server, once per `requestKey`. What was read for
 * an earlier key of the same map stays until the new answer lands; null is a
 * read that failed.
 */
function useLayersRead(
  journeyId: number | null,
  token: string | null,
  requestKey: string | null,
  sourceKey: string | null
) {
  const [loaded, setLoaded] = useState<{ key: string; layers: JourneyMapAnswer | null } | null>(null);
  useEffect(() => {
    if (!requestKey) return;
    const controller = new AbortController();
    const read =
      journeyId !== null
        ? journeyMapRepo.layers(journeyId, controller.signal)
        : journeyMapRepo.publicLayers(token ?? '', controller.signal);
    read
      .then((layers) => setLoaded({ key: requestKey, layers }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ key: requestKey, layers: null });
      });
    return () => controller.abort();
  }, [requestKey, journeyId, token]);
  const layers = loaded && sourceKey && loaded.key.startsWith(`${sourceKey}|`) ? loaded.layers : undefined;
  return { layers, loading: !!requestKey && loaded?.key !== requestKey };
}

/**
 * The layers of a journey map (JRN-04) for the desktop page, the phone screen
 * and the shared page alike: the reader's switches, kept per journey in this
 * browser, the plan and the stays read from the server, and what the
 * renderers draw from them. Nothing is read while neither the plan nor the
 * entries are shown; a source that fails says so on its switch and the
 * others keep drawing.
 */
export function useJourneyMapLayers({
  source,
  refreshKey = '',
  entryIdsOnMap,
  photoCount,
  recordedTracks = NO_TRACKS,
  recordedRead = 'ready',
  colorOfDay,
  dateOfEntry,
  allLayers,
}: Options): JourneyMapLayersView {
  const { t, locale } = useTranslation();
  const journeyId = source && 'journeyId' in source ? source.journeyId : null;
  const token = source && 'token' in source ? source.token : null;
  const storageKey =
    journeyId !== null ? layersStorageKey({ journeyId }) : token !== null ? layersStorageKey({ token }) : null;
  const isMobile = useIsMobile();
  const { visibility, toggle } = useLayerSwitches((allLayers ?? isMobile) ? null : storageKey);

  const sourceKey = journeyId !== null ? `j:${journeyId}` : token !== null ? `s:${token}` : null;
  // A shared page reads once; a journey's own map only while the plan or the entries are shown.
  const wanted = token !== null || (journeyId !== null && (visibility.plan || visibility.entries));
  const requestKey = wanted && sourceKey ? `${sourceKey}|${refreshKey}` : null;
  const { layers, loading } = useLayersRead(journeyId, token, requestKey, sourceKey);
  const sources = useMemo(() => sourcesOf(layers), [layers]);

  const places = useMemo(() => itemsOf(sources.places), [sources.places]);
  const routes = useMemo(() => itemsOf(sources.routes), [sources.routes]);
  const stays = useMemo(() => itemsOf(sources.stays), [sources.stays]);

  const sharedRecorded = useMemo(
    () =>
      itemsOf(sources.recordings).flatMap((day, dayIndex) => {
        const name = t('journey.recording.mapLine', {
          date: new Date(`${day.date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        });
        const color = colorOfDay(day.date) ?? DAWARICH_TRAIL_COLOR;
        return day.pieces.map((points, index): JourneyTrack => ({
          // Negative and far from the live trail's ids, as the journey's own kept days.
          place_id: -(100_000 + dayIndex * 1_000 + index),
          trip_id: 0,
          name,
          color,
          points,
          kind: 'day_recording',
        }));
      }),
    [sources.recordings, colorOfDay, t, locale]
  );

  const recorded = recordedTracks.length ? recordedTracks : sharedRecorded;
  const tracks = useMemo(
    () => (routes.length === 0 ? recorded : recorded.length === 0 ? routes : [...routes, ...recorded]),
    [routes, recorded]
  );

  const stayColor = useCallback(
    (entryId: number) => {
      const date = dateOfEntry(entryId);
      return date ? colorOfDay(date) : null;
    },
    [dateOfEntry, colorOfDay]
  );

  const { marks, plannedEntryIds } = useMemo(
    () => buildMarks({ places, stays, visibility, entryIdsOnMap, stayColor }),
    [places, stays, visibility, entryIdsOnMap, stayColor]
  );

  const recordedDays = useMemo(() => new Set(recorded.map((track) => track.name)).size, [recorded]);
  const controls = useMemo(
    () =>
      buildControls({
        ownJourney: journeyId !== null,
        sources,
        loading,
        recordedRead,
        counts: {
          places: places.length,
          routes: routes.length,
          recordedDays,
          entries: entryIdsOnMap.size,
          stays: stays.length,
          photos: photoCount,
        },
      }),
    [
      journeyId,
      sources,
      loading,
      recordedRead,
      places.length,
      routes.length,
      recordedDays,
      entryIdsOnMap.size,
      stays.length,
      photoCount,
    ]
  );

  return { visibility, toggle, controls, tracks, marks, plannedEntryIds };
}
