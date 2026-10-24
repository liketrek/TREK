import type { JourneyRecordingPrep } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { dawarichRepo } from '../../repo/dawarichRepo';
import { journeyRecordingsRepo } from '../../repo/journeyRecordingsRepo';
import { useJourneyStore } from '../../store/journeyStore';
import { useToast } from '../shared/Toast';
import {
  dayPrepOf,
  prepReachOf,
  prepStatusLine,
  type JourneyDayPrep,
  type PrepStatusLine,
} from './journeyRecordingPrepModel';

export interface JourneyRecordingPrepOptions {
  /** The journey the route names, or null while it loads. */
  journeyId: number | null;
  /** The journey's switch as last read, so a change reads the status again. */
  enabled: boolean;
  /** An editor with the Dawarich addon on: nobody else has anything of their own prepared. */
  active: boolean;
  /** The dates of the linked trips; only those the server says its runs reach are prepared. */
  periodDates: ReadonlySet<string>;
  /** The switch was saved: the journey is read again. */
  onSwitched: () => void;
  /** A fetch by hand came back: the stays waiting at the days are read again. */
  onFetched: () => void;
}

export interface JourneyRecordingPrepState {
  /** Null until read, and for anyone `active` leaves out. */
  prep: JourneyRecordingPrep | null;
  saving: boolean;
  /** A fetch asked for by hand is running. */
  fetching: boolean;
  /** The line under the switch in the settings and in the day review; null while it is off or not read yet. */
  statusLine: PrepStatusLine | null;
  /** Whether a fetch by hand would reach anything. */
  canFetch: boolean;
  setEnabled: (next: boolean) => Promise<void>;
  fetchNow: () => Promise<void>;
  dayPrep: (date: string) => JourneyDayPrep | null;
}

/**
 * A journey preparing its recorded days (JRN-03), for the journey page, the
 * phone screen, both settings shells and the day review: the caller's own
 * status, the owner's switch, a fetch by hand and where each day stands.
 * Switching it on fetches at once, so the days fill without waiting for the
 * next background run.
 */
export function useJourneyRecordingPrep({
  journeyId,
  enabled,
  active,
  periodDates,
  onSwitched,
  onFetched,
}: JourneyRecordingPrepOptions): JourneyRecordingPrepState {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const updateJourney = useJourneyStore((s) => s.updateJourney);
  // Held with its journey, so a journey opened after another never shows the other's status.
  const [loaded, setLoaded] = useState<{ journeyId: number | null; prep: JourneyRecordingPrep | null }>(NOTHING);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [readToken, setReadToken] = useState(0);
  const prep = active && loaded.journeyId === journeyId ? loaded.prep : null;

  useEffect(() => {
    if (!active || journeyId === null) return;
    const controller = new AbortController();
    void readPrep(journeyId, controller.signal).then((next) => {
      if (next && !controller.signal.aborted) setLoaded({ journeyId, prep: next });
    });
    return () => controller.abort();
  }, [journeyId, active, enabled, readToken]);

  const fetchNow = useCallback(async () => {
    setFetching(true);
    try {
      const result = await dawarichRepo.syncNow();
      if (result.alreadyRunning) toast.info(t('journey.prep.alreadyRunning'));
      onFetched();
    } catch {
      toast.error(t('journey.prep.fetchFailed'));
    } finally {
      setFetching(false);
      setReadToken((n) => n + 1);
    }
  }, [onFetched, toast, t]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (journeyId === null) return;
      setSaving(true);
      try {
        await updateJourney(journeyId, { auto_prepare_recordings: next });
        onSwitched();
      } catch {
        toast.error(t('journey.settings.saveFailed'));
        return;
      } finally {
        setSaving(false);
      }
      if (next && prep?.connection !== 'not_connected') await fetchNow();
    },
    [journeyId, updateJourney, onSwitched, toast, t, prep?.connection, fetchNow]
  );

  const reach = useMemo(() => prepReachOf(prep, periodDates), [prep, periodDates]);
  const prepared = reach.dates.size > 0;
  const statusLine = useMemo(
    () => (prep ? prepStatusLine(prep, { prepared, outOfReach: reach.outOfReach }, t, locale) : null),
    [prep, prepared, reach.outOfReach, t, locale]
  );
  const dayPrep = useCallback((date: string) => dayPrepOf(date, prep, reach.dates), [prep, reach.dates]);

  return {
    prep,
    saving,
    fetching,
    statusLine,
    canFetch: !!prep?.enabled && prep.connection !== 'not_connected' && prepared,
    setEnabled,
    fetchNow,
    dayPrep,
  };
}

/** The status, or null when it could not be read: the last one read stays, a status line is no reason for a toast. */
async function readPrep(journeyId: number, signal: AbortSignal): Promise<JourneyRecordingPrep | null> {
  try {
    return await journeyRecordingsRepo.prep(journeyId, signal);
  } catch {
    return null;
  }
}

const NOTHING = { journeyId: null, prep: null };
