import type {
  JourneyDayImportResult,
  JourneyDayStay,
  JourneyDayStays,
  JourneyRecordedDay,
  JourneyRecordingPreview,
  JourneyTrack,
} from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { journeyRecordingsRepo } from '../../repo/journeyRecordingsRepo';
import { localIsoDate } from '../../utils/localDate';
import { useToast } from '../shared/Toast';
import {
  anchorOf,
  groupsOf,
  initialChoice,
  isTakeable,
  nameOf,
  problemOf,
  rename,
  requestOf,
  toggleJoin,
  toggleStay,
  type DayImportChoice,
} from './journeyDayImportModel';
import { recordingErrorText } from './journeyRecordingModel';
import { useJourneyRecordingDay } from './useJourneyRecordingDay';
import type { JourneyRecordingPrepState } from './useJourneyRecordingPrep';

/** What the desktop dialog and the phone sheet are opened with. */
export interface JourneyDayImportViewProps {
  journeyId: number;
  journeyTitle: string;
  date: string;
  /** The colour of the day's pins on the journey map, so its stays read as that day. */
  dayColor: string;
  /** The route the journey keeps for the day, if any. */
  storedRoute: JourneyRecordedDay | undefined;
  /** Drafts were written: the journey and the stay list are read again. */
  onTakenOver: () => void;
  onKept: (day: JourneyRecordedDay) => void;
  onClose: () => void;
  /** The caller's own preparation of the journey's days (JRN-03), for editors too; absent while it is off or unread. */
  prep?: JourneyRecordingPrepState;
}

/**
 * Something went wrong on the way. `failed`: nothing was taken over, the list
 * shows what the journal holds now and sending again writes nothing twice.
 * `route`: the drafts are in, only the route was not kept.
 */
type Outcome = { kind: 'failed' | 'route'; reason: string };

type RouteOffer = 'loading' | 'kept' | 'keep' | 'differs' | 'none';

const noop = () => {};

/** The map marker id of a stay, so a pin and its row find each other. */
export function stayMarkerId(suggestionId: number): string {
  return `stay-${suggestionId}`;
}

/**
 * The day's stays from the traveller's own Dawarich and what they chose of
 * them. A reload of the same day keeps the choice, so names and joins survive
 * a failed attempt; the last answer stays shown while the next one is read.
 */
function useDayReview(journeyId: number, date: string) {
  const [reloadToken, setReloadToken] = useState(0);
  const forDay = `${journeyId}|${date}`;
  const requestKey = `${forDay}|${reloadToken}`;
  const [answer, setAnswer] = useState<{ key: string; review: JourneyDayStays | null; failure: unknown }>(NO_ANSWER);
  const [chosen, setChosen] = useState<{ forDay: string; choice: DayImportChoice } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    journeyRecordingsRepo
      .reviewDay(journeyId, date, controller.signal)
      .then((review) => {
        if (cancelled) return;
        setAnswer({ key: requestKey, review, failure: null });
        setChosen((prev) => (prev?.forDay === forDay ? prev : { forDay, choice: initialChoice(review.stays) }));
      })
      .catch((failure: unknown) => {
        if (!cancelled) setAnswer({ key: requestKey, review: null, failure });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [journeyId, date, forDay, requestKey]);

  const update = useCallback(
    (change: (choice: DayImportChoice) => DayImportChoice) =>
      setChosen((prev) => (prev ? { ...prev, choice: change(prev.choice) } : prev)),
    []
  );

  return {
    review: answer.review,
    loading: answer.key !== requestKey,
    failure: answer.key === requestKey ? answer.failure : null,
    choice: chosen?.forDay === forDay ? chosen.choice : null,
    update,
    reload: useCallback(() => setReloadToken((n) => n + 1), []),
  };
}

/** What the dialog offers for the day's route: kept already, kept in another version, to keep, or nothing recorded. */
function routeOfferOf(
  stored: JourneyRecordedDay | undefined,
  route: ReturnType<typeof useJourneyRecordingDay>
): RouteOffer {
  if (stored) return route.action === 'replace' ? 'differs' : 'kept';
  if (route.loading) return 'loading';
  return route.action === 'keep' ? 'keep' : 'none';
}

/** The stays as numbered pins in the day's colour, unchosen ones in the map's neutral pin, and the route under them. */
function useDayMap(
  stays: JourneyDayStay[],
  choice: DayImportChoice | null,
  date: string,
  dayColor: string,
  route: JourneyRecordedDay | JourneyRecordingPreview | null
) {
  const { t } = useTranslation();
  const entries = useMemo(
    () =>
      stays.flatMap((stay, index) =>
        stay.lat === null || stay.lng === null
          ? []
          : [
              {
                id: stayMarkerId(stay.suggestionId),
                lat: stay.lat,
                lng: stay.lng,
                title: choice ? nameOf(choice, stay) : stay.name,
                entry_date: date,
                dayColor: choice?.selected.has(stay.suggestionId) && isTakeable(stay) ? dayColor : undefined,
                dayLabel: index + 1,
              },
            ]
      ),
    [stays, choice, date, dayColor]
  );
  const tracks = useMemo<JourneyTrack[]>(
    () =>
      (route?.segments ?? []).map((segment, index) => ({
        place_id: -(index + 1),
        trip_id: 0,
        name: t('journey.recording.scope'),
        color: dayColor,
        points: segment.points,
        kind: 'day_recording',
      })),
    [route, dayColor, t]
  );
  return { entries, tracks };
}

/**
 * The take-over and, when asked, the route after it. A take-over that fails
 * leaves nothing written and reads the day again; a route that fails after
 * the drafts are in keeps the dialog open to try the route alone.
 */
function useDayTakeOver({
  journeyId,
  date,
  preview,
  onTakenOver,
  onKept,
  onClose,
  reload,
}: {
  journeyId: number;
  date: string;
  preview: JourneyRecordingPreview | null;
  onTakenOver: () => void;
  onKept: (day: JourneyRecordedDay) => void;
  onClose: () => void;
  reload: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState<'submit' | 'route' | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const saveRoute = useCallback(async (): Promise<boolean> => {
    if (!preview?.contentHash) return true;
    try {
      const saved = await journeyRecordingsRepo.save(journeyId, date, {
        utcOffsetMinutes: preview.utcOffsetMinutes,
        expectedHash: preview.contentHash,
      });
      onKept(saved.day);
      return true;
    } catch (err) {
      setOutcome({ kind: 'route', reason: recordingErrorText(err, t) });
      return false;
    }
  }, [preview, journeyId, date, onKept, t]);

  const announce = useCallback(
    (result: JourneyDayImportResult) => {
      if (result.entries.length > 0) toast.success(t('journey.dayImport.done', { count: result.entries.length }));
      if (result.alreadyTaken.length > 0) {
        toast.info(t('journey.dayImport.alreadyTaken', { count: result.alreadyTaken.length }));
      }
    },
    [toast, t]
  );

  const submit = useCallback(
    async (request: Parameters<typeof journeyRecordingsRepo.takeOverDay>[2], withRoute: boolean) => {
      setBusy('submit');
      setOutcome(null);
      try {
        announce(await journeyRecordingsRepo.takeOverDay(journeyId, date, request));
        onTakenOver();
        if (!withRoute || (await saveRoute())) onClose();
        else reload();
      } catch (err) {
        setOutcome({ kind: 'failed', reason: recordingErrorText(err, t) });
        // The answer may be lost after the write: read again, so the list says what the journal holds.
        reload();
      } finally {
        setBusy(null);
      }
    },
    [journeyId, date, announce, onTakenOver, saveRoute, onClose, reload, t]
  );

  const retryRoute = useCallback(async () => {
    setBusy('route');
    setOutcome(null);
    const kept = await saveRoute();
    setBusy(null);
    if (!kept) return;
    toast.success(t('journey.recording.keptToast'));
    onClose();
  }, [saveRoute, toast, t, onClose]);

  return { busy, outcome, submit, retryRoute };
}

/**
 * Taking a recorded day into the journal with its stays (JRN-02), for the
 * desktop dialog and the phone sheet alike: the day's stays read from the
 * traveller's own Dawarich, the choice of which become drafts under which
 * names and in which groups, the day's route on the same map, and the
 * take-over itself. Nothing is written before the button; cancelling leaves
 * everything as it was.
 */
export function useJourneyDayImport({
  journeyId,
  date,
  dayColor,
  storedRoute,
  onTakenOver,
  onKept,
  onClose,
}: Omit<JourneyDayImportViewProps, 'journeyTitle' | 'prep'>) {
  const { t, locale } = useTranslation();
  const day = useDayReview(journeyId, date);
  const route = useJourneyRecordingDay({ journeyId, date, onKept, onRemoved: noop, onClose: noop });
  const [keepRoute, setKeepRoute] = useState(false);
  const [activeStay, setActiveStay] = useState<number | null>(null);
  const { choice, update } = day;
  const stays = useMemo(() => day.review?.stays ?? [], [day.review]);
  const reportDefault = t('journey.dayImport.reportDefault', {
    date: new Date(`${date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
  });
  const routeOffer = routeOfferOf(storedRoute, route);
  const map = useDayMap(
    stays,
    choice,
    date,
    dayColor,
    storedRoute ?? (route.preview?.contentHash ? route.preview : null)
  );
  const takeOver = useDayTakeOver({
    journeyId,
    date,
    preview: route.preview,
    onTakenOver,
    onKept,
    onClose,
    reload: day.reload,
  });
  const groups = useMemo(() => (choice ? groupsOf(choice, stays) : []), [choice, stays]);
  const problem = choice ? problemOf(choice, stays, reportDefault) : 'nothing';

  return {
    date,
    review: day.review,
    loading: day.loading,
    /** The day is today: stays recorded later still arrive. */
    running: date === localIsoDate(),
    /** Translated; null while nothing failed. */
    error: day.failure === null ? null : recordingErrorText(day.failure, t),
    retry: day.reload,
    choice,
    stays,
    groups,
    problem,
    reportDefault,
    skipCount: stays.filter((stay) => stay.status === 'open' && !choice?.selected.has(stay.suggestionId)).length,
    activeStay,
    setActiveStay,
    mapEntries: map.entries,
    mapTracks: map.tracks,
    route: {
      offer: routeOffer,
      distanceMeters: (storedRoute ?? route.preview)?.stats.distanceMeters ?? null,
      keep: keepRoute,
      toggle: () => setKeepRoute((on) => !on),
    },
    busy: takeOver.busy,
    outcome: takeOver.outcome,
    submit: () => {
      if (choice && !problem) {
        void takeOver.submit(requestOf(choice, stays, reportDefault), keepRoute && routeOffer === 'keep');
      }
    },
    retryRoute: () => void takeOver.retryRoute(),
    toggle: (id: number) => update((c) => toggleStay(c, id)),
    join: (id: number) => update((c) => toggleJoin(c, id)),
    rename: (stay: JourneyDayStay, name: string) => update((c) => rename(c, stay, name)),
    setMode: (mode: DayImportChoice['mode']) => update((c) => ({ ...c, mode })),
    setTitle: (key: number, title: string) => update((c) => ({ ...c, titles: { ...c.titles, [key]: title } })),
    setAnchor: (key: number, id: number | null) => update((c) => ({ ...c, anchors: { ...c.anchors, [key]: id } })),
    anchorOf: (key: number) => {
      const group = groups.find((g) => g.key === key);
      return group && choice ? anchorOf(choice, group) : null;
    },
  };
}

export type JourneyDayImportState = ReturnType<typeof useJourneyDayImport>;

const NO_ANSWER = { key: '', review: null, failure: null };
