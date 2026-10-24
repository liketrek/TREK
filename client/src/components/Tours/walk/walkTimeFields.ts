import { someStaysUnknown, walkTimesOf, type WalkTimes } from '../planner/stationModel';
import type { TourMetricField } from '../tourParts';
import { formatPlannedTourDuration, plannedTotalText } from '../tourPresentation';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** What a city walk's stays are known of: how many, how many have no stay entered, and the stays entered; with its boats (CW-12). */
type WalkStays = Pick<WalkTimes, 'stayMinutes' | 'unknownStays' | 'stations' | 'ferryMinutes'>;

/**
 * A city walk's stays as said: their sum, and at least the sum while some
 * stay is not entered yet. Nothing while no stay is entered at all: the walk
 * is then planned as its walking time, and saying "unknown" at every turn
 * would only be noise. A stop passed through counts as the 0 entered for it,
 * so stays all entered as 0 read "0 min".
 */
export function walkStaysText(stays: WalkStays, t: Translate): string | null {
  if (stays.unknownStays >= stays.stations) return null;
  const time = formatPlannedTourDuration(stays.stayMinutes);
  return someStaysUnknown(stays) ? t('tours.walk.totalAtLeast', { time }) : time;
}

export interface WalkTimeFieldsInput {
  /** How the walking time is named: with its explanation in the planner, short in the tour detail. */
  walking: Omit<TourMetricField, 'value'>;
  walkingMinutes: number | null;
  stays: WalkStays;
  /** A total entered by hand, which stays apart from the one worked out; null when there is none. */
  manualMinutes: number | null;
  t: Translate;
}

/** CW-12: the time of a walk's crossings by boat, as a field of its own; none without a crossing. */
function ferryField(minutes: number | null | undefined, t: Translate): TourMetricField[] {
  if (minutes === undefined) return [];
  return [
    {
      label: t('tours.walk.ferry.field'),
      value: minutes === null ? t('tours.walk.ferry.timeUnknown') : formatPlannedTourDuration(minutes),
      info: { label: t('tours.walk.ferry.fieldInfoLabel'), description: t('tours.walk.ferry.fieldInfo') },
    },
  ];
}

/**
 * CW-02: a city walk's times as fields, in one wording for the planner and the
 * tour detail: the walking time, the boat apart (CW-12), the stays, and the
 * planned total of them. A
 * total entered by hand keeps its own label, and the total worked out shows
 * beside it as computed, so the two never read as one. 45 min of walking, a
 * museum of 90 min and a cafe of 30 min read 45 min, 2 h and 2 h 45 min.
 */
export function walkTimeFields({
  walking,
  walkingMinutes,
  stays,
  manualMinutes,
  t,
}: WalkTimeFieldsInput): TourMetricField[] {
  const notCalculated = t('tours.planner.walkingTimeUnknown');
  const { stayMinutes, unknownStays, stations, ferryMinutes } = stays;
  const times = walkTimesOf({ walkingMinutes, stayMinutes, unknownStays, stations, ferryMinutes });
  const computed =
    plannedTotalText({ plannedTotalMinutes: times.totalMinutes, atLeast: times.partial }, t) ?? notCalculated;
  const staysText = walkStaysText(stays, t);
  const parts: TourMetricField[] = [
    { ...walking, value: walkingMinutes == null ? notCalculated : formatPlannedTourDuration(walkingMinutes) },
    ...ferryField(ferryMinutes, t),
    ...(staysText ? [{ label: t('tours.walk.stays'), value: staysText }] : []),
  ];
  const planned = t('tours.planner.plannedShort');
  if (manualMinutes == null) return [...parts, { label: planned, value: computed }];
  return [
    ...parts,
    {
      label: `${planned} (${t('tours.planner.plannedTotalManual')})`,
      // A narrow column names it by what sets it apart from the computed total beside it.
      shortLabel: t('tours.planner.plannedTotalManual'),
      value: formatPlannedTourDuration(manualMinutes),
    },
    { label: t('tours.walk.totalComputed'), value: computed },
  ];
}
