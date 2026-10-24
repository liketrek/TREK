import type { JourneyRecordedDay } from '@trek/shared';
import { useCallback, useMemo, useState } from 'react';
import type { JourneyDayImportViewProps } from '../../components/Journey/useJourneyDayImport';
import { DAWARICH_TRAIL_COLOR } from '../../components/Map/dawarichTrail';

/**
 * Which day of the journey is being taken over with its stays (JRN-02), as
 * the journey page and the phone screen wire it: the day opens the dialog in
 * the colour of its pins, with the route the journey keeps for it, and a
 * take-over reads the journey and the stay list again.
 */
export function useJourneyDetailDayImport({
  loaded,
  journey,
  colorOfDay,
  recordedDayOf,
  onKept,
  onTakenOver,
}: {
  /** Whether `journey` is the one the route names yet: the store keeps the last one while the next loads. */
  loaded: boolean;
  journey: { id: number; title: string } | null | undefined;
  colorOfDay: (date: string) => string | null;
  recordedDayOf: (date: string) => JourneyRecordedDay | undefined;
  onKept: (day: JourneyRecordedDay) => void;
  onTakenOver: () => void;
}) {
  const journeyId = loaded && journey ? journey.id : null;
  const journeyTitle = journey?.title ?? '';
  const [opened, setOpened] = useState<{ journeyId: number | null; date: string | null }>(NOTHING_OPEN);
  const openDate = opened.journeyId === journeyId ? opened.date : null;

  const open = useCallback((date: string) => setOpened({ journeyId, date }), [journeyId]);
  const close = useCallback(() => setOpened(NOTHING_OPEN), []);

  const dialog = useMemo<JourneyDayImportViewProps | null>(
    () =>
      journeyId !== null && openDate
        ? {
            journeyId,
            journeyTitle,
            date: openDate,
            dayColor: colorOfDay(openDate) ?? DAWARICH_TRAIL_COLOR,
            storedRoute: recordedDayOf(openDate),
            onTakenOver,
            onKept,
            onClose: close,
          }
        : null,
    [journeyId, journeyTitle, openDate, colorOfDay, recordedDayOf, onTakenOver, onKept, close]
  );

  return { openDate, open, close, dialog };
}

const NOTHING_OPEN = { journeyId: null, date: null };
