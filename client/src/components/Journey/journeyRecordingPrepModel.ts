import { JOURNEY_RECORDING_PREP_REACH_DAYS, type JourneyRecordingPrep } from '@trek/shared';
import { localIsoDate } from '../../utils/localDate';
import { relativeTime } from '../../utils/relativeTime';
import { reasonText } from './journeyRecordingModel';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Where preparing one journey day stands (JRN-03), for its badge.
 * `running`: the day is today. `provisional`: the last fetch that came through
 * was before the day ended, so stays may be missing. `pending`: no fetch came
 * through yet. `complete`: fetched after the day was over.
 */
export interface JourneyDayPrep {
  state: 'running' | 'provisional' | 'pending' | 'complete';
  /** The last run failed; what the day shows is as new as `lastSuccessAt`. */
  failed: boolean;
  lastSuccessAt: string | null;
}

/**
 * Which days the caller's runs reach and whether some linked day is left out.
 * The server names the trips its runs read; a trip still open runs up to
 * today. Without that answer the linked dates stand in for them.
 */
export interface PrepReach {
  dates: ReadonlySet<string>;
  /** A linked day that is over is read by no run, its trip ended too long ago. */
  outOfReach: boolean;
}

export function prepReachOf(
  prep: JourneyRecordingPrep | null,
  linkedDates: ReadonlySet<string>,
  now: Date = new Date()
): PrepReach {
  if (!prep?.periods) return { dates: linkedDates, outOfReach: false };
  const today = localIsoDate(now);
  const dates = new Set<string>();
  for (const period of prep.periods) {
    const end = new Date(`${period.end ?? today}T00:00:00`);
    for (let d = new Date(`${period.start}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
      dates.add(localIsoDate(d));
    }
  }
  const outOfReach = [...linkedDates].some((date) => date < today && !dates.has(date));
  return { dates, outOfReach };
}

/**
 * A day the caller's runs reach while the journey prepares its days for a
 * connected caller; null for every other day, including those still ahead.
 */
export function dayPrepOf(
  date: string,
  prep: JourneyRecordingPrep | null,
  periodDates: ReadonlySet<string>,
  now: Date = new Date()
): JourneyDayPrep | null {
  if (!prep?.enabled || prep.connection === 'not_connected' || !periodDates.has(date)) return null;
  const today = localIsoDate(now);
  if (date > today) return null;
  const base = { failed: prep.lastError !== null, lastSuccessAt: prep.lastSuccessAt };
  if (date === today) return { state: 'running', ...base };
  if (!prep.lastSuccessAt) return { state: 'pending', ...base };
  const dayEnd = new Date(`${date}T00:00:00`);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { state: Date.parse(prep.lastSuccessAt) < dayEnd.getTime() ? 'provisional' : 'complete', ...base };
}

/** Whether a day's badge marks it as not final: still running, fetched too early, not fetched, or stale after a failure. */
export function dayPrepUnsettled(day: JourneyDayPrep | null | undefined): boolean {
  return !!day && (day.state !== 'complete' || day.failed);
}

/** What a day's badge adds to its tooltip; empty for a day fetched whole by a run that came through. */
export function dayPrepText(day: JourneyDayPrep, t: Translate, locale: string, now: number = Date.now()): string {
  const parts: string[] = [];
  if (day.state === 'running') parts.push(t('journey.prep.dayRunning'));
  if (day.state === 'pending') parts.push(t('journey.prep.dayPending'));
  if (day.state === 'provisional' && day.lastSuccessAt) {
    parts.push(t('journey.prep.dayProvisional', { time: relativeTime(Date.parse(day.lastSuccessAt), locale, now) }));
  }
  if (day.failed) parts.push(t('journey.prep.dayFailed'));
  return parts.join(' ');
}

/** The same for the day review, which says on its own that the day is still running. */
export function dayPrepNotice(day: JourneyDayPrep, t: Translate, locale: string, now: number = Date.now()): string {
  return day.state === 'running' ? (day.failed ? t('journey.prep.dayFailed') : '') : dayPrepText(day, t, locale, now);
}

/** The line under the switch in the journey settings, and whether it asks for attention. */
export interface PrepStatusLine {
  text: string;
  tone: 'muted' | 'warning';
}

/**
 * What the caller's own preparation of a journey looks like right now, for
 * the settings and the day review: why nothing happens (no connection, no
 * dated trip, every trip out of reach, background sync off), the last failure
 * next to the state still shown, or when it last came through, followed by a
 * word on trips left out. Null while the switch is off.
 */
export function prepStatusLine(
  prep: JourneyRecordingPrep,
  reach: { prepared: boolean; outOfReach: boolean },
  t: Translate,
  locale: string,
  now: number = Date.now()
): PrepStatusLine | null {
  if (!prep.enabled) return null;
  if (prep.connection === 'not_connected') return { text: t('journey.prep.notConnected'), tone: 'warning' };
  const outOfReachText = t('journey.prep.outOfReach', { count: JOURNEY_RECORDING_PREP_REACH_DAYS });
  if (!reach.prepared) {
    return { text: reach.outOfReach ? outOfReachText : t('journey.prep.noPeriods'), tone: 'warning' };
  }
  const line = baseStatusLine(prep, t, locale, now);
  return reach.outOfReach ? { ...line, text: `${line.text} ${outOfReachText}` } : line;
}

function baseStatusLine(prep: JourneyRecordingPrep, t: Translate, locale: string, now: number): PrepStatusLine {
  const success = prep.lastSuccessAt ? relativeTime(Date.parse(prep.lastSuccessAt), locale, now) : null;
  if (prep.lastError) {
    const reason = reasonText(prep.lastError, t);
    return {
      text: success ? t('journey.prep.failed', { reason, time: success }) : t('journey.prep.failedNever', { reason }),
      tone: 'warning',
    };
  }
  if (prep.connection === 'sync_off') return { text: t('journey.prep.syncOff'), tone: 'warning' };
  if (!success) return { text: t('journey.prep.never'), tone: 'muted' };
  return { text: t('journey.prep.lastSuccess', { time: success }), tone: 'muted' };
}
