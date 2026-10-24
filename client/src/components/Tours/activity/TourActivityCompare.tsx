import type { TourActivity } from '@trek/shared';
import { Equal, Map as MapIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import { formatDistance } from '../../../utils/units';
import { BOX, Eyebrow } from '../../Planner/bookings/bookingParts';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { CardAction, TourFactFields, type TourMetricField } from '../tourParts';
import { ACTUAL_TRACK_COLOR, LineSwatch } from './activityCompareParts';
import { formatDifference, formatValue } from './compareValueText';
import {
  compareRows,
  OFF_PLAN_M,
  planDeviation,
  type CompareKey,
  type CompareRow,
  type PlanValues,
} from './planComparison';

type Translate = (key: string, params?: Record<string, unknown>) => string;

const ROW_LABELS: Record<CompareKey, string> = {
  distance: 'tours.detail.distance',
  ascent: 'tours.detail.ascent',
  descent: 'tours.detail.descent',
  time: 'tours.activity.compare.time',
};

/** One value of one side: the number, or a word saying that side does not carry it. */
function ValueCell({
  text,
  missing,
  hint,
  strong = false,
}: {
  text: string;
  missing: boolean;
  hint?: string;
  strong?: boolean;
}) {
  const look = missing
    ? 'italic text-content-faint'
    : strong
      ? 'font-semibold text-content'
      : 'font-medium text-content-secondary';
  return (
    <td className="px-2 py-1.5 text-end tabular-nums">
      <Tooltip label={hint ?? ''} disabled={!hint}>
        <span className={`inline-flex ${look}`}>{text}</span>
      </Tooltip>
    </td>
  );
}

/** The plan's value; a total that leaves a stay out reads "at least", as the head says it. */
function planText(row: CompareRow, plan: PlanValues, unit: DistanceUnit, t: Translate): string {
  if (row.plan === null) return t('tours.activity.compare.notInPlan');
  const text = formatValue(row.key, row.plan, unit);
  return row.key === 'time' && plan.minutesAtLeast ? `≥ ${text}` : text;
}

/** The track's value; a time is said to be measured, or the time stamps to be missing. */
function actualCell(row: CompareRow, unit: DistanceUnit, t: Translate): { text: string; hint?: string } {
  if (row.key === 'time') {
    return row.actual === null
      ? { text: t('tours.activity.noTime'), hint: t('tours.activity.noTimeHint') }
      : { text: formatValue('time', row.actual, unit), hint: t('tours.activity.timeHint') };
  }
  return {
    text: row.actual === null ? t('tours.activity.compare.notInTrack') : formatValue(row.key, row.actual, unit),
  };
}

/** The difference as a small badge whose arrow says which way; empty where the two cannot be compared. */
function DifferenceCell({ row, unit }: { row: CompareRow; unit: DistanceUnit }) {
  if (row.difference === null) return <td className="px-2 py-1.5" />;
  const text = formatDifference(row.key, row.difference, unit);
  const Icon = text.startsWith('±') ? Equal : row.difference > 0 ? TrendingUp : TrendingDown;
  return (
    <td className="px-2 py-1.5 text-end">
      <SoftPill
        className="tabular-nums"
        icon={<Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
      >
        {text}
      </SoftPill>
    </td>
  );
}

/** A column head: its name with the line it is drawn as on the map. */
function ColumnHead({ label, swatch }: { label: string; swatch?: ReactNode }) {
  return (
    <th scope="col" className="px-2 py-1.5 text-end font-normal">
      <span className="inline-flex items-center gap-1.5">
        {swatch}
        <Eyebrow>{label}</Eyebrow>
      </span>
    </th>
  );
}

/** The four measures of plan and track, one row each, with what lies between them. */
function CompareTable({
  rows,
  plan,
  planColor,
  unit,
}: {
  rows: readonly CompareRow[];
  plan: PlanValues;
  planColor: string;
  unit: DistanceUnit;
}) {
  const { t } = useTranslation();
  return (
    <div className={`${BOX} overflow-hidden`}>
      <table data-testid="tour-activity-compare" className="w-full border-collapse" style={fs(12, 'body')}>
        <thead className="bg-surface-secondary">
          <tr>
            <td />
            <ColumnHead label={t('tours.activity.compare.plan')} swatch={<LineSwatch color={planColor} />} />
            <ColumnHead label={t('tours.activity.badge')} swatch={<LineSwatch color={ACTUAL_TRACK_COLOR} dotted />} />
            <ColumnHead label={t('tours.activity.compare.difference')} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const actual = actualCell(row, unit, t);
            return (
              <tr key={row.key} data-testid={`tour-activity-compare-${row.key}`} className="border-t border-edge-faint">
                <th scope="row" className="px-2.5 py-1.5 text-start font-medium text-content-muted">
                  {t(ROW_LABELS[row.key])}
                </th>
                <ValueCell text={planText(row, plan, unit, t)} missing={row.plan === null} />
                <ValueCell text={actual.text} hint={actual.hint} missing={row.actual === null} strong />
                <DifferenceCell row={row} unit={unit} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** How far the track left the planned line, or that there is no line to measure against. */
function deviationFields(
  activity: TourActivity,
  plan: PlanValues,
  unit: DistanceUnit,
  t: Translate
): TourMetricField[] {
  // Latitude and longitude only: how far the track strayed is measured on the map, not in height.
  const recorded = activity.geometry.map(([lat, lng]) => [lat, lng]);
  const deviation = planDeviation(recorded, plan.line);
  const offLabel = t('tours.activity.compare.offPlan');
  if (!deviation) return [{ label: offLabel, value: t('tours.activity.compare.noLine') }];
  const offInfo = {
    label: offLabel,
    description: t('tours.activity.compare.offPlanHint', { distance: formatDistance(OFF_PLAN_M / 1000, unit) }),
  };
  return [
    { label: t('tours.activity.compare.farthest'), value: formatDistance(deviation.farthestM / 1000, unit) },
    {
      label: offLabel,
      value: t('tours.activity.compare.offPlanValue', {
        distance: formatDistance(deviation.offPlanKm, unit),
        percent: Math.round(deviation.offPlanShare * 100),
      }),
      info: offInfo,
    },
  ];
}

interface TourActivityCompareProps {
  activity: TourActivity;
  plan: PlanValues;
  /** The plan's track colour, as the map draws it. */
  planColor: string;
  unit: DistanceUnit;
  /** The switch for the plan map; left out where no plan map is beside the detail (the phone). */
  map?: { shown: boolean; onToggle: () => void };
}

/**
 * ACT-02 in an actual track's card: its values beside the plan's, each side
 * named and drawn as it is on the map, the difference only where both are
 * known, and how far the track strayed from the planned line. It reads both
 * and changes neither; the map switch only draws.
 */
export default function TourActivityCompare({ activity, plan, planColor, unit, map }: TourActivityCompareProps) {
  const { t } = useTranslation();
  const rows = useMemo(() => compareRows(plan, activity.metrics), [activity.metrics, plan]);
  const deviation = useMemo(() => deviationFields(activity, plan, unit, t), [activity, plan, unit, t]);
  const mapLabel = t(map?.shown ? 'tours.activity.compare.hide' : 'tours.activity.compare.show');
  return (
    <section aria-label={t('tours.activity.compare.title')} className="flex flex-col gap-2">
      <div className="flex min-h-[28px] items-center gap-2">
        <Eyebrow>{t('tours.activity.compare.title')}</Eyebrow>
        {map && activity.geometry.length >= 2 && (
          <span className="ms-auto inline-flex">
            <Tooltip label={t('tours.activity.compare.showHint')} disabled={map.shown}>
              <span className="inline-flex">
                <CardAction icon={<MapIcon size={12} strokeWidth={2.2} />} onClick={map.onToggle} pressed={map.shown}>
                  {mapLabel}
                </CardAction>
              </span>
            </Tooltip>
          </span>
        )}
      </div>
      <CompareTable rows={rows} plan={plan} planColor={planColor} unit={unit} />
      <TourFactFields fields={deviation} columns={deviation.length === 2 ? 2 : undefined} />
    </section>
  );
}
