import { useMemo, useState } from 'react';

import { formatClockTime } from '../../utils/formatters';
import { formatClock, parseClock } from './roadtripModel';

/**
 * The lengths a stop usually takes, so the common answer is one tap. Kept short on
 * purpose: a longer list reads as a form, and anything not on it is what the slider
 * (desktop) or the two step buttons are for.
 */
export const STAY_PRESETS = [15, 30, 45, 60, 90, 120, 480, 720];

/**
 * As far as a stay goes, in minutes: a full day. The drive no longer reads a check-out,
 * so this is the only place a night is given its hours, and a stay longer than a day is
 * a second day rather than a longer stop.
 */
export const STAY_MAX = 24 * 60;

const DAY_MINUTES = STAY_MAX;

/** The step the slider and the two buttons move in. */
export const STAY_STEP = 5;

/** A stay as the phone keeps it: whole minutes between none and a full day. */
export const clampStay = (value: number): number => Math.min(STAY_MAX, Math.max(0, Math.round(value)));

/**
 * What a stay does to the stop: the arrival is fixed by the drive, the departure is the
 * one end the stay moves. `carry` is how many days later the departure lands, because
 * `formatClock` wraps modulo 24 h and a stay running past midnight would otherwise read
 * as an early departure on the same day. Null without an arrival to start from.
 */
export function stayPreview(arrival: string | null | undefined, minutes: number, is12h: boolean) {
  const at = parseClock(arrival);
  if (at === null) return null;
  return {
    arrive: formatClockTime(formatClock(at), is12h),
    leave: formatClockTime(formatClock(at + minutes), is12h),
    carry: Math.floor((at + minutes) / DAY_MINUTES) - Math.floor(at / DAY_MINUTES),
  };
}

export interface StayDraftOptions {
  /** When the drive gets to the stop, as the schedule has it. */
  arrival: string | null | undefined;
  is12h: boolean;
  /** The value the draft starts on before the shell seeds it. */
  initial: number;
  /** The phone keeps the stay in whole minutes when a step moves it; the desktop does not round. */
  wholeMinutes: boolean;
}

/**
 * The stay length being chosen for one road-trip stop, behind the desktop stay dialog
 * and the phone's stay sheet: the draft, the save in flight, the five minute steps that
 * never leave 0 to a full day, and the arrival and departure it makes. Each shell seeds
 * the draft when it opens and writes it its own way.
 */
export function useStayDraft({ arrival, is12h, initial, wholeMinutes }: StayDraftOptions) {
  const [minutes, setMinutes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const preview = useMemo(() => stayPreview(arrival, minutes, is12h), [arrival, minutes, is12h]);
  const nudge = (delta: number) =>
    setMinutes((m) => (wholeMinutes ? clampStay(m + delta) : Math.min(STAY_MAX, Math.max(0, m + delta))));
  return { minutes, setMinutes, saving, setSaving, nudge, preview };
}
