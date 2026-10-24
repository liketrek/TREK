import {
  summarizeTourActivities,
  type TourActivityStatsEntry,
  type TourActivityStatsResponse,
  type TourActivitySummary,
} from '@trek/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { TourActivityStatsOfflineError, tourActivityStatsRepo } from '../../../repo/tourActivityStatsRepo';
import { localIsoDate } from '../../../utils/localDate';
import { useToast } from '../../shared/Toast';
import {
  periodOptions,
  periodRange,
  typeOptions,
  type ActivityPeriod,
  type ActivityType,
} from './tourActivityStatsModel';

/** Where the read stands: not asked yet, on its way, there, refused offline, or failed. */
type ActivityStatsStatus = 'idle' | 'loading' | 'ready' | 'offline' | 'error';

export interface TourActivityStats {
  status: ActivityStatsStatus;
  data: TourActivityStatsResponse | null;
  /** The sums of the chosen period and type; null until the first read is there. */
  summary: TourActivitySummary | null;
  period: ActivityPeriod;
  setPeriod: (period: ActivityPeriod) => void;
  periods: ActivityPeriod[];
  type: ActivityType;
  setType: (type: ActivityType) => void;
  types: ActivityType[];
  /** The tours whose exclusion is on its way to the server. */
  pending: ReadonlySet<number>;
  setExcluded: (entry: TourActivityStatsEntry, excluded: boolean) => Promise<void>;
  retry: () => void;
}

/** What the latest read came back with, and the attempt it answered. */
interface Answered {
  attempt: number;
  status: Exclude<ActivityStatsStatus, 'idle' | 'loading'>;
}

/** Every entry of the tour with the flag as asked, the rest as they were. */
function flagged(data: TourActivityStatsResponse, placeId: number, excluded: boolean): TourActivityStatsResponse {
  return {
    ...data,
    entries: data.entries.map((entry) => (entry.place_id === placeId ? { ...entry, excluded } : entry)),
  };
}

/** Every entry with the flags of the exclusions still on their way laid over it, the way they show already. */
function withFlags(data: TourActivityStatsResponse, flags: ReadonlyMap<number, boolean>): TourActivityStatsResponse {
  if (flags.size === 0) return data;
  return {
    ...data,
    entries: data.entries.map((entry) =>
      flags.has(entry.place_id) ? { ...entry, excluded: flags.get(entry.place_id) === true } : entry
    ),
  };
}

/**
 * STA-02: the user's own tour activities in the Atlas. Read live when the tab
 * is first shown (and again on retry), never cached on the device; narrowed by
 * period and type here, summed by the shared summary the assistant uses too.
 * Leaving a tour out shows at once and is undone with a message when the
 * server refuses it; the plan of the tour never changes. Answers can come
 * back in any order: only the answer to the latest read or write is taken
 * whole, with the exclusions still on their way laid over it; an older one
 * only confirms its own tour's flag, so it never puts back a state from
 * before a newer change.
 */
export function useTourActivityStats(active: boolean): TourActivityStats {
  const { t } = useTranslation();
  const toast = useToast();
  // The answer to the latest read and which attempt it answered: a retry is loading until its own answer is there.
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [data, setData] = useState<TourActivityStatsResponse | null>(null);
  const [period, setPeriod] = useState<ActivityPeriod>('all');
  const [type, setType] = useState<ActivityType>('all');
  const [pending, setPending] = useState<ReadonlySet<number>>(() => new Set());
  const [attempt, setAttempt] = useState(0);
  const today = localIsoDate();
  // Raised by every read and every write, so an answer knows whether a newer request went out after it.
  const latest = useRef(0);
  // The exclusions on their way to the server, by tour: the flag the user asked for.
  const inFlight = useRef(new Map<number, boolean>());

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const asked = ++latest.current;
    tourActivityStatsRepo.get(controller.signal).then(
      (answer) => {
        if (controller.signal.aborted) return;
        if (asked === latest.current) setData(withFlags(answer, inFlight.current));
        setAnswered({ attempt, status: 'ready' });
      },
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setAnswered({ attempt, status: err instanceof TourActivityStatsOfflineError ? 'offline' : 'error' });
      }
    );
    return () => controller.abort();
  }, [active, attempt]);

  let status: ActivityStatsStatus = 'loading';
  if (answered?.attempt === attempt) status = answered.status;
  else if (!active && !answered) status = 'idle';

  const summary = useMemo(() => {
    if (!data) return null;
    const range = periodRange(period, today);
    return summarizeTourActivities(data.entries, { today, ...range, type: type === 'all' ? null : type });
  }, [data, period, type, today]);
  const periods = useMemo(() => periodOptions(data?.entries ?? [], today), [data, today]);
  const types = useMemo(() => typeOptions(data?.entries ?? [], today), [data, today]);

  const setExcluded = useCallback(
    async (entry: TourActivityStatsEntry, excluded: boolean) => {
      const placeId = entry.place_id;
      const asked = ++latest.current;
      inFlight.current.set(placeId, excluded);
      setPending((current) => new Set(current).add(placeId));
      setData((current) => (current ? flagged(current, placeId, excluded) : current));
      try {
        const answer = await tourActivityStatsRepo.setExcluded({ place_id: placeId, excluded });
        inFlight.current.delete(placeId);
        if (asked === latest.current) setData(withFlags(answer, inFlight.current));
        else setData((current) => (current ? flagged(current, placeId, excluded) : current));
      } catch {
        inFlight.current.delete(placeId);
        setData((current) => (current ? flagged(current, placeId, !excluded) : current));
        toast.error(t('tours.stats.excludeFailed'));
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(placeId);
          return next;
        });
      }
    },
    [t, toast]
  );

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    status,
    data,
    summary,
    period,
    setPeriod,
    periods,
    type,
    setType,
    types,
    pending,
    setExcluded,
    retry,
  };
}
