import type { JourneyTrack } from '@trek/shared';
import { useCallback, useMemo } from 'react';
import { openStayDatesWithin, type openStaysByDate } from '../../components/Dawarich/dawarichSuggestionModel';
import { useJourneyMapLayers } from '../../components/Journey/useJourneyMapLayers';
import { useJourneyRecordingPrep } from '../../components/Journey/useJourneyRecordingPrep';
import type { useDawarichJournalTrail } from '../../hooks/useDawarichJournalTrail';
import type { useDawarichSuggestions } from '../../hooks/useDawarichSuggestions';
import { useAddonStore } from '../../store/addonStore';
import type { JourneyDetail } from '../../store/journeyStore';
import { useJourneyDetailDayImport } from './useJourneyDetailDayImport';
import { useJourneyDetailRecordings } from './useJourneyDetailRecordings';

/** The trips' GPX tracks reach the map with its plan layer, not as recorded lines. */
const NO_TRIP_TRACKS: JourneyTrack[] = [];

/**
 * What the journey page draws and offers beyond its entries: the recorded days
 * prepared in the background (JRN-03), the days the journey keeps (JRN-01),
 * the map's layers (JRN-04) and the take-over of a day with its stays (JRN-02).
 */
export function useJourneyDetailLayers({
  journey: current,
  loaded: journeyLoaded,
  canEditEntries,
  loadJourney,
  dawarich,
  dawarichByDate,
  dawarichTrail,
  tripDates,
  sidebarMapItems,
  photoCount,
  showTripTracks,
}: {
  journey: JourneyDetail | null;
  /** Whether `journey` is the one the route names yet: the store keeps the last one while the next loads. */
  loaded: boolean;
  canEditEntries: boolean;
  loadJourney: (id: number) => Promise<unknown>;
  dawarich: ReturnType<typeof useDawarichSuggestions>;
  dawarichByDate: ReturnType<typeof openStaysByDate>;
  dawarichTrail: ReturnType<typeof useDawarichJournalTrail>;
  tripDates: ReadonlySet<string>;
  sidebarMapItems: ReadonlyArray<{ id: string; entry_date: string; dayColor: string }>;
  photoCount: number;
  showTripTracks: boolean;
}) {
  // The editor's own status, the owner's switch, and where each day of the trips stands.
  const isAddonEnabled = useAddonStore((s) => s.isEnabled);
  const reloadJourney = useCallback(() => {
    if (current) void loadJourney(current.id);
  }, [current, loadJourney]);
  const recordingPrep = useJourneyRecordingPrep({
    journeyId: journeyLoaded && current ? current.id : null,
    enabled: !!current?.auto_prepare_recordings,
    active: canEditEntries && isAddonEnabled('dawarich'),
    periodDates: tripDates,
    onSwitched: reloadJourney,
    onFetched: dawarich.reload,
  });

  const { recordings, colorOfDay, canTakeOverRecording, recordingNeedsConnection, mapTracks } =
    useJourneyDetailRecordings({
      loaded: journeyLoaded,
      journey: current,
      canEdit: canEditEntries,
      dawarichStatus: dawarich.status,
      sidebarMapItems,
      tripTracks: NO_TRIP_TRACKS,
      liveTracks: dawarichTrail.tracks,
    });

  // The plan of the linked trips, what was recorded, the entries with the stays
  // of their day reports, the photos. Read again when an entry comes, goes or
  // changes the place it came from, and when a trip is linked or the track
  // switch flips.
  const entryIdsOnMap = useMemo(() => new Set(sidebarMapItems.map((m) => m.id)), [sidebarMapItems]);
  const entryById = useMemo(() => new Map((current?.entries ?? []).map((e) => [e.id, e])), [current?.entries]);
  const dateOfEntry = useCallback((entryId: number) => entryById.get(entryId)?.entry_date ?? null, [entryById]);
  const entryTitleOf = useCallback(
    (entryId: number) => {
      const entry = entryById.get(entryId);
      return entry ? entry.title || entry.location_name || null : null;
    },
    [entryById]
  );
  const mapRefreshKey = useMemo(
    () =>
      [
        (current?.entries ?? [])
          .filter((e) => e.type !== 'skeleton')
          .map((e) => `${e.id}:${e.source_place_id ?? ''}`)
          .join(','),
        (current?.trips ?? []).map((trip) => trip.trip_id).join(','),
        showTripTracks ? 'tracks' : '',
      ].join('|'),
    [current?.entries, current?.trips, showTripTracks]
  );
  // The kept days and the live trail are read by this screen, not by the layers' read.
  const recordedRead =
    recordings.status === 'failed' || dawarichTrail.status === 'unavailable'
      ? 'unavailable'
      : recordings.status === 'loading' || dawarichTrail.status === 'loading'
        ? 'loading'
        : 'ready';
  const mapLayers = useJourneyMapLayers({
    source: journeyLoaded && current ? { journeyId: current.id } : null,
    refreshKey: mapRefreshKey,
    entryIdsOnMap,
    photoCount,
    recordedTracks: mapTracks,
    recordedRead,
    colorOfDay,
    dateOfEntry,
  });

  // The drafts a day's take-over wrote reach the timeline, and its stays leave the pending list.
  const afterDayTakeOver = useCallback(() => {
    if (current) void loadJourney(current.id);
    dawarich.reload();
  }, [current, loadJourney, dawarich]);
  const recordedDayOf = useCallback((date: string) => recordings.byDate.get(date), [recordings.byDate]);
  const dayImport = useJourneyDetailDayImport({
    loaded: journeyLoaded,
    journey: current,
    colorOfDay,
    recordedDayOf,
    onKept: recordings.kept,
    onTakenOver: afterDayTakeOver,
  });
  // The days a phone can take over from the stay sheet, a day with no entry or card on it included.
  const dayImportDates = useMemo(
    () =>
      current && canEditEntries && canTakeOverRecording
        ? openStayDatesWithin(dawarichByDate, [
            ...current.entries.map((e) => e.entry_date),
            ...current.trips.flatMap((trip) => [trip.start_date, trip.end_date]),
          ])
        : [],
    [current, canEditEntries, canTakeOverRecording, dawarichByDate]
  );

  return {
    recordingPrep,
    recordings,
    canTakeOverRecording,
    recordingNeedsConnection,
    mapTracks,
    mapLayers,
    entryTitleOf,
    dayImport,
    dayImportDates,
  };
}
