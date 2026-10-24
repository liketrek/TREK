import type { TourListItem } from '@trek/shared';
import { ArrowDown, ArrowUp, ArrowUpRight, Clock, Loader2, Ruler, Sigma, type LucideIcon } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Day } from '../../../types';
import { formatDistance, formatElevation } from '../../../utils/units';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { useWaypointPlaceNames } from '../planner/useWaypointPlaceNames';
import { movingTimeLabel } from '../tourFacts';
import { TourNotice } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import { StageDayPicker } from './StageDayPicker';
import { stopNameOf } from './stageNames';
import { StageSummary } from './StageParts';
import type { StageSum, StageTotals } from './tourStages';
import { useSavedTourStages } from './useSavedTourStages';
import { useTourStageDays, type TourStageDays } from './useTourStageDays';

type Translate = ReturnType<typeof useTranslation>['t'];

interface TourStageOverviewProps {
  id: string;
  tripId: number | string | null | undefined;
  tour: TourListItem;
  days: Day[];
  canAssign: boolean;
  /** Opens the tour in the planner at this stage, by the key of the stop it starts at; absent where it cannot. */
  onOpenStage?: (tour: TourListItem, stageKey: string) => void;
}

/** A sum as a badge: the total of the stages that tell it, marked as at least that where some do not. */
function TotalBadge({
  icon: Icon,
  label,
  sum,
  format,
  t,
}: {
  icon: LucideIcon;
  label: string;
  sum: StageSum;
  format: (value: number) => string;
  t: Translate;
}) {
  if (sum.value === null) return null;
  const partial = sum.known < sum.of;
  const value = partial ? `≥ ${format(sum.value)}` : format(sum.value);
  const said = partial
    ? `${label}: ${value} (${t('tours.stages.totalPartial', { known: sum.known, of: sum.of })})`
    : `${label}: ${value}`;
  return (
    <Tooltip label={said}>
      <span className="inline-flex" aria-label={said} data-stage-total-partial={partial || undefined}>
        <WhiteBadge icon={<Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {value}
        </WhiteBadge>
      </span>
    </Tooltip>
  );
}

/**
 * The whole tour as its stages add up, under them and set apart from the
 * trip's own figures: each measure only as far as the stages tell it, and
 * none where none does. A tour counts once here however many days hold it.
 */
export function StageTotalsRow({ tour, totals }: { tour: TourListItem; totals: StageTotals }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const height = (value: number) => formatElevation(value, unit);
  // A route not planned yet adds up to nothing: no row rather than an empty one.
  if (Object.values(totals).every((sum) => sum.value === null)) return null;
  return (
    <div
      data-testid="tour-stage-totals"
      className="mt-1 flex min-w-0 flex-wrap items-center gap-1 border-t border-edge-faint px-1.5 pb-0.5 pt-2"
    >
      <span
        className="me-auto inline-flex items-center gap-1 font-semibold text-content-secondary"
        style={fs(11.5, 'body')}
      >
        <Sigma size={12} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
        {t('tours.stages.wholeTour')}
      </span>
      <TotalBadge
        icon={Ruler}
        label={t('tours.detail.distance')}
        sum={totals.distanceKm}
        format={(value) => formatDistance(value, unit)}
        t={t}
      />
      <TotalBadge icon={ArrowUp} label={t('tours.detail.ascent')} sum={totals.gain} format={height} t={t} />
      <TotalBadge icon={ArrowDown} label={t('tours.detail.descent')} sum={totals.loss} format={height} t={t} />
      <TotalBadge
        icon={Clock}
        label={movingTimeLabel(tour, t('tours.planner.inspector.duration'), t)}
        sum={totals.minutes}
        format={formatPlannedTourDuration}
        t={t}
      />
    </div>
  );
}

/** The round button that opens the tour in the planner at one stage. */
function OpenStageButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        data-testid="tour-stage-open"
        onClick={onClick}
        className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-accent hover:text-accent-text hover:ring-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" className="rtl:-scale-x-100" />
      </button>
    </Tooltip>
  );
}

/** What a stage offers on its right: the day it is on, and the way into the planner. */
function StageActions({
  stageKey,
  stageNumber,
  days,
  stageDays,
  onOpen,
}: {
  stageKey: string;
  stageNumber: number;
  days: Day[];
  stageDays: TourStageDays;
  onOpen?: (stageKey: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-none flex-col items-end gap-1">
      <StageDayPicker stageKey={stageKey} stageNumber={stageNumber} days={days} stageDays={stageDays} />
      {onOpen && <OpenStageButton label={t('tours.stages.openInPlanner')} onClick={() => onOpen(stageKey)} />}
    </span>
  );
}

/**
 * MDT-02: a multi-day tour unfolded in the list of the trip's tours: its
 * stages in route order with what each measures and the day it is on, and
 * what the stages add up to. A stage opens in the planner, where it is edited
 * as part of the one route, and goes on a day of the trip (or none) on its
 * own. Nothing here keeps a copy of a stage: the figures are read off the
 * saved tour each time it changes.
 */
export function TourStageOverview({ id, tripId, tour, days, canAssign, onOpenStage }: TourStageOverviewProps) {
  const { t } = useTranslation();
  const saved = useSavedTourStages(tripId, tour, true);
  const stageDays = useTourStageDays({ tripId, placeId: tour.place_id, canAssign });
  const placeNames = useWaypointPlaceNames(saved.points);
  const unmeasured = (
    <Tooltip label={t('tours.stages.unmeasuredHint')}>
      <span className="inline-flex">
        <SoftPill>{t('tours.stages.unmeasured')}</SoftPill>
      </span>
    </Tooltip>
  );
  return (
    // The row around it opens the tour on a click; what happens in here stays in here.
    <div
      id={id}
      role="presentation"
      data-testid="tour-stage-overview"
      onClick={(event) => event.stopPropagation()}
      // Escape still goes on: a stage's day menu is portalled but bubbles through here,
      // and it closes on the Escape that reaches the document.
      onKeyDown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
      className="mt-2 cursor-default rounded-xl bg-surface-secondary p-1 ring-1 ring-inset ring-edge-faint"
    >
      {saved.status === 'error' && <TourNotice>{t('tours.stages.loadFailed')}</TourNotice>}
      {saved.status === 'loading' && (
        <p
          className="m-0 flex items-center gap-1.5 px-2 py-2 text-content-faint"
          style={fs(11.5, 'body')}
          role="status"
        >
          <Loader2 size={12} strokeWidth={2.2} aria-hidden="true" className="animate-spin" />
          {t('common.loading')}
        </p>
      )}
      {saved.status === 'ready' && (
        <>
          <ol aria-label={t('tours.stages.title')} className="m-0 flex list-none flex-col gap-px p-0">
            {saved.stages.map((stage) => (
              <li
                key={stage.number}
                data-testid="tour-stage-item"
                data-stage={stage.number}
                className="flex min-w-0 items-start gap-2.5 rounded-[10px] px-1.5 py-1.5"
              >
                <StageSummary
                  stage={stage}
                  night={stage.number < saved.stages.length}
                  from={stopNameOf(saved.points, placeNames, stage.fromId, t)}
                  to={stopNameOf(saved.points, placeNames, stage.toId, t)}
                  unmeasured={unmeasured}
                />
                {stage.key && (
                  <StageActions
                    stageKey={stage.key}
                    stageNumber={stage.number}
                    days={days}
                    stageDays={stageDays}
                    onOpen={onOpenStage ? (key) => onOpenStage(tour, key) : undefined}
                  />
                )}
              </li>
            ))}
          </ol>
          {saved.totals && <StageTotalsRow tour={tour} totals={saved.totals} />}
        </>
      )}
    </div>
  );
}
