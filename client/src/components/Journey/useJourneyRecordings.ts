import type { JourneyRecordedDay, JourneyTrack } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { journeyRecordingsRepo } from '../../repo/journeyRecordingsRepo';
import { useServerPing } from '../../sync/useServerPing';
import { DAWARICH_TRAIL_COLOR } from '../Map/dawarichTrail';
import type { JourneyRecordingViewProps } from './useJourneyRecordingDay';

interface JourneyRecordingsState {
  days: JourneyRecordedDay[];
  /** Whether the days were read: a failed first read is not a journey that kept none. */
  status: 'idle' | 'loading' | 'ready' | 'failed';
  byDate: ReadonlyMap<string, JourneyRecordedDay>;
  /** The kept days as lines for the journey map, one per piece, never joined across a gap. */
  tracks: JourneyTrack[];
  /** The day whose recording dialog is open, or null. */
  openDate: string | null;
  /** What the desktop dialog or the phone sheet opens with while a day is open. */
  dialog: JourneyRecordingViewProps | null;
  open: (date: string) => void;
  close: () => void;
  /** A day was kept or replaced from the dialog: shown at once, without asking again. */
  kept: (day: JourneyRecordedDay) => void;
  removed: (date: string) => void;
}

/**
 * The recorded days a journey keeps (JRN-01), for the desktop page and the
 * phone screen alike: the list, the lines they draw on the journey map and
 * which day's dialog is open. Read again whenever somebody on the journey
 * keeps or drops a day. Offline the days stay as last read; a journey has no
 * offline copy to fall back on.
 *
 * `colorOf` gives a day the colour its entries have on the map, so a kept
 * route and the pins of its day read as one; a day without entries takes the
 * colour of the live recording.
 */
export function useJourneyRecordings(
  journey: { id: number; title: string } | null,
  colorOf: (date: string) => string | null
): JourneyRecordingsState {
  const journeyId = journey?.id ?? null;
  const journeyTitle = journey?.title ?? '';
  const { t, locale } = useTranslation();
  // Held with the journey they belong to, so a journey opened after another
  // never shows the other one's days, and nothing has to be reset in an effect.
  const [loaded, setLoaded] = useState<{ journeyId: number | null; days: JourneyRecordedDay[] }>(NOTHING_LOADED);
  const [opened, setOpened] = useState<{ journeyId: number | null; date: string | null }>(NOTHING_OPEN);
  const [failedFor, setFailedFor] = useState<number | null>(null);
  const days = loaded.journeyId === journeyId ? loaded.days : NO_DAYS;
  const status =
    journeyId === null
      ? 'idle'
      : loaded.journeyId === journeyId
        ? 'ready'
        : failedFor === journeyId
          ? 'failed'
          : 'loading';
  const openDate = opened.journeyId === journeyId ? opened.date : null;

  const read = useCallback(async () => {
    if (journeyId === null) return null;
    try {
      return { journeyId, days: await journeyRecordingsRepo.list(journeyId) };
    } catch {
      // What was read before stays on the map; a kept day does not vanish
      // because one read of it failed.
      return null;
    }
  }, [journeyId]);

  useEffect(() => {
    let cancelled = false;
    void read().then((next) => {
      if (cancelled) return;
      if (next) setLoaded(next);
      else setFailedFor(journeyId);
    });
    return () => {
      cancelled = true;
    };
  }, [read, journeyId]);

  const reload = useCallback(async () => {
    const next = await read();
    if (next) setLoaded(next);
  }, [read]);

  useServerPing('journey:recording:updated', journeyId !== null, reload);

  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  const tracks = useMemo(
    () =>
      days.flatMap((day) => {
        const name = t('journey.recording.mapLine', {
          date: new Date(`${day.date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        });
        const color = colorOf(day.date) ?? DAWARICH_TRAIL_COLOR;
        return day.segments.map((segment, index): JourneyTrack => ({
          // Negative and far from the live trail's -1, -2, ... so the map keys never meet.
          place_id: -(100_000 + day.id * 1_000 + index),
          trip_id: 0,
          name,
          color,
          points: segment.points,
          kind: 'day_recording',
        }));
      }),
    [days, colorOf, t, locale]
  );

  const kept = useCallback(
    (day: JourneyRecordedDay) =>
      setLoaded((prev) => ({
        journeyId,
        days: [...prev.days.filter((d) => d.date !== day.date), day].sort((a, b) => (a.date < b.date ? -1 : 1)),
      })),
    [journeyId]
  );

  const removed = useCallback(
    (date: string) => setLoaded((prev) => ({ journeyId, days: prev.days.filter((d) => d.date !== date) })),
    [journeyId]
  );

  const open = useCallback((date: string) => setOpened({ journeyId, date }), [journeyId]);
  const close = useCallback(() => setOpened(NOTHING_OPEN), []);

  const dialog = useMemo(
    () =>
      journeyId !== null && openDate
        ? {
            journeyId,
            journeyTitle,
            date: openDate,
            stored: byDate.get(openDate),
            onKept: kept,
            onRemoved: removed,
            onClose: close,
          }
        : null,
    [journeyId, journeyTitle, openDate, byDate, kept, removed, close]
  );

  return { days, status, byDate, tracks, openDate, dialog, open, close, kept, removed };
}

/** Stable empty identity, so a journey without kept days never re-renders its map for nothing. */
const NO_DAYS: JourneyRecordedDay[] = [];
const NOTHING_LOADED = { journeyId: null, days: NO_DAYS };
const NOTHING_OPEN = { journeyId: null, date: null };
