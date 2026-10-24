import type { JourneyTrack } from '@trek/shared';
import { useCallback, useMemo } from 'react';
import { useJourneyRecordings } from '../../components/Journey/useJourneyRecordings';
import type { DawarichSuggestionsStatus } from '../../hooks/useDawarichSuggestions';

/**
 * The recorded days a journey keeps (JRN-01) as the journey page wires them:
 * their lines in the colour of the pins of their day, beside the trips' GPX
 * tracks and the live Dawarich trail. A kept day is the journey's own, so it
 * draws whatever the GPX switch says, and wins over the live trail of its date.
 */
export function useJourneyDetailRecordings({
  loaded,
  journey: current,
  canEdit,
  dawarichStatus,
  sidebarMapItems,
  tripTracks,
  liveTracks,
}: {
  /** Whether `journey` is the one the route names yet: the store keeps the last one while the next loads. */
  loaded: boolean;
  journey: { id: number; title: string } | null | undefined;
  canEdit: boolean;
  dawarichStatus: DawarichSuggestionsStatus;
  sidebarMapItems: ReadonlyArray<{ entry_date: string; dayColor: string }>;
  tripTracks: JourneyTrack[];
  liveTracks: JourneyTrack[];
}) {
  const dayColorByDate = useMemo(
    () => new Map(sidebarMapItems.map((item) => [item.entry_date, item.dayColor])),
    [sidebarMapItems]
  );
  const colorOfDay = useCallback((date: string) => dayColorByDate.get(date) ?? null, [dayColorByDate]);
  const journeyId = loaded && current ? current.id : null;
  const journeyTitle = current?.title ?? '';
  const journey = useMemo(
    () => (journeyId === null ? null : { id: journeyId, title: journeyTitle }),
    [journeyId, journeyTitle]
  );
  const recordings = useJourneyRecordings(journey, colorOfDay);

  const mapTracks = useMemo(() => {
    if (recordings.tracks.length === 0 && liveTracks.length === 0) return tripTracks;
    const live = liveTracks.filter((track) => !recordings.byDate.has(track.name));
    return [...tripTracks, ...recordings.tracks, ...live];
  }, [tripTracks, recordings.tracks, recordings.byDate, liveTracks]);

  return {
    recordings,
    colorOfDay,
    canTakeOverRecording: canEdit && dawarichStatus === 'ready',
    recordingNeedsConnection: canEdit && dawarichStatus === 'offline',
    mapTracks,
  };
}
