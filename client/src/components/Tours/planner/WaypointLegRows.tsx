import type { PaddleLayout, PaddleRegionLoadState, TourFixedLeg } from '@trek/shared';
import { Spline } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { TourFerrataCrossing } from '../../../store/tourFerrataCrossingStore';
import { formatDistance } from '../../../utils/units';
import { FerrataGlyph } from '../../Ferratas/FerrataGlyph';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { HorseLegRow } from '../horse/HorseLegRow';
import { PaddleLegFailureRow, PaddleLegNotes } from '../paddle/PaddleLegParts';
import { isRegionLoadPending, regionLoadFailure } from '../paddle/paddleRegionLoad';
import { PaddleRegionLoadRow } from '../paddle/PaddleRegionLoadRow';
import { LockRow, PendingPortageRow, PortageLegRow } from '../paddle/PaddleWaypointParts';
import type { usePaddleRegionLoad } from '../paddle/usePaddleRegionLoad';
import { usePaddleWaypointActions } from '../paddle/usePaddleWaypointActions';
import { usePortageWay, type usePortageRouting } from '../paddle/usePortageRouting';
import { SkiLegFailureRow, SkiLegSteps } from '../ski/SkiLegRows';
import { WalkFerryLegRow } from '../walk/WalkFerryLegRow';
import type { PaddleLegFailure } from './paddleRouting';
import { lineLengthM } from './tourFixedLegs';
import type { TourPlannerController } from './useTourPlanner';

type WaypointPoint = TourPlannerController['waypoints'][number];

/**
 * A leg drawn by hand, as a badge on that leg in the dashed look the map draws
 * it in: no router planned it, and the badge says so. Its length is the line
 * the user drew, the only measure it has. On a ride (HOR-01) it is the manual
 * stretch between horse routes, said to be unchecked.
 */
function FreeLegRow({ leg, ride }: { leg: TourFixedLeg; ride: boolean }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  // Read as plain numbers: this workspace compiles without strict mode, where the schema's tuples are "maybe two".
  const line = leg.geometry.map(([lat, lng]): [number, number] => [Number(lat), Number(lng)]);
  const distance = formatDistance(lineLengthM(line) / 1000, unit ?? 'metric');
  return (
    <li data-testid="tour-planner-free-leg" className="flex min-w-0 py-0.5 ps-[34px]">
      <Tooltip label={t(ride ? 'tours.horse.leg.manualInfo' : 'tours.planner.freeLegInfo')}>
        <span className="flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-full border border-dashed border-edge bg-surface-card pe-1 ps-2">
          <Spline size={13} strokeWidth={2} className="flex-none text-content-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
            {t(ride ? 'tours.horse.leg.manual' : 'tours.planner.freeLegBadge')}
          </span>
          <span
            className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary"
            style={fs(10.5)}
          >
            {distance}
          </span>
        </span>
      </Tooltip>
    </li>
  );
}

/**
 * A via ferrata the route climbs between two waypoints, as a badge on that leg:
 * the ladder, its name, and its grade and length as chips inside, in the
 * ferrata violet the map draws it in.
 */
function FerrataLegRow({ crossing }: { crossing: TourFerrataCrossing }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  const length = formatDistance((crossing.toM - crossing.fromM) / 1000, unit ?? 'metric');
  return (
    <li
      data-testid="tour-planner-ferrata-leg"
      aria-label={t('tours.ferrata.crossingInfo', { length, name: crossing.name })}
      className="flex min-w-0 py-0.5 ps-[34px]"
    >
      <span className="flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-full bg-surface-card pe-1 ps-1 shadow-sm ring-1 ring-inset ring-[color:var(--map-ferrata)]">
        <FerrataGlyph size={18} className="flex-none" />
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
          {crossing.name}
        </span>
        {crossing.grade && (
          <span
            className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist font-semibold leading-[18px] text-content-secondary"
            style={fs(10.5)}
          >
            {crossing.grade}
          </span>
        )}
        <span
          className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary"
          style={fs(10.5)}
        >
          {length}
        </span>
      </span>
    </li>
  );
}

/**
 * What a paddle tour shows under a waypoint: the portage that starts there,
 * and the lock at it with its times.
 */
function PaddleRowExtras({
  planner,
  point,
  index,
  layout,
  editable,
  routing,
}: {
  planner: TourPlannerController;
  point: TourPlannerController['waypoints'][number];
  index: number;
  layout: PaddleLayout;
  editable: boolean;
  routing: ReturnType<typeof usePortageRouting>;
}) {
  const paddle = usePaddleWaypointActions(planner);
  const way = usePortageWay(planner.waypoints, routing, index);
  const portage = layout.stretches.find((stretch) => stretch.kind === 'portage' && stretch.startIndex === index);
  const lock = point.lock ? layout.locks.find((stop) => stop.index === index) : undefined;
  return (
    <>
      {point.carryNext && <PendingPortageRow disabled={!editable} onRemove={() => paddle.togglePortage(point.id)} />}
      {portage && (
        <PortageLegRow
          lengthM={portage.toM - portage.fromM}
          extraMinutes={portage.extraMinutes}
          disabled={!editable}
          onExtraChange={(minutes) => paddle.setPortageExtra(point.id, minutes)}
          onRemove={point.auto ? undefined : () => paddle.togglePortage(point.id)}
          way={point.auto ? undefined : way}
        />
      )}
      {point.lock && (
        <LockRow
          lock={point.lock}
          bypassed={!!lock?.bypassed}
          disabled={!editable}
          onChange={(next) => paddle.setLock(point.id, next)}
        />
      )}
    </>
  );
}

/**
 * A leg the router could not plan. Where it lacked the water data of the
 * region (PAD-11C), the row follows the data instead: loading or asked for,
 * the leg waits calmly; declined, failed or not to be had, it says why.
 */
function LegFailure({
  code,
  load,
  disabled,
  onDrawStraight,
  onRetry,
  onLoadRetry,
}: {
  code: PaddleLegFailure;
  load: PaddleRegionLoadState | undefined;
  disabled: boolean;
  onDrawStraight: () => void;
  onRetry: () => void;
  onLoadRetry: () => void;
}) {
  const { t } = useTranslation();
  if (isRegionLoadPending(load)) {
    return <PaddleRegionLoadRow state={load} disabled={disabled} onDrawStraight={onDrawStraight} />;
  }
  return (
    <PaddleLegFailureRow
      code={code}
      disabled={disabled}
      onDrawStraight={onDrawStraight}
      onRetry={onRetry}
      message={regionLoadFailure(load, t)}
      onLoadRetry={load?.state === 'failed' ? onLoadRetry : undefined}
    />
  );
}

/**
 * SKI-02: what a ski tour shows under a waypoint for its leg: the steps the
 * piste router planned, or why it could not plan it and what would.
 */
function SkiLegExtras({
  planner,
  point,
  index,
  editable,
}: {
  planner: TourPlannerController;
  point: WaypointPoint;
  index: number;
  editable: boolean;
}) {
  const route = planner.skiRoute;
  if (!route) return null;
  const problem = route.problems.find((candidate) => candidate.index === index);
  if (problem) {
    return (
      <SkiLegFailureRow
        problem={problem}
        choice={planner.ski.choice}
        disabled={!editable}
        onChoice={planner.ski.change}
        onDrawStraight={() => planner.toggleWaypointFreeLeg(point.id)}
      />
    );
  }
  const leg = route.legs[index];
  return leg?.status === 'ok' ? <SkiLegSteps leg={leg} scheme={route.colourScheme} /> : null;
}

/**
 * The rows under a waypoint for the leg that starts there: the via ferrata it
 * crosses, a line drawn by hand, a ride's horse route section (HOR-01), and
 * on a paddle tour what the router found on the way (PAD-11) or why it could
 * not plan it, plus the portage and lock rows, and a ski tour's planned steps.
 */
export function WaypointLegRows({
  planner,
  point,
  index,
  crossings = [],
  routedLegs,
  paddleLayout,
  editable,
  portageRouting,
  regionLoad,
}: {
  planner: TourPlannerController;
  point: WaypointPoint;
  index: number;
  crossings?: TourFerrataCrossing[];
  routedLegs: TourPlannerController['paddleRoute'] | null;
  paddleLayout: PaddleLayout | null;
  editable: boolean;
  portageRouting: ReturnType<typeof usePortageRouting>;
  regionLoad: ReturnType<typeof usePaddleRegionLoad>;
}) {
  const failure = routedLegs?.failures.find((candidate) => candidate.index === index);
  return (
    <>
      {crossings.map((crossing) => (
        <FerrataLegRow key={`${crossing.id}-${crossing.fromM}`} crossing={crossing} />
      ))}
      {point.fixedLeg?.kind === 'free' && <FreeLegRow leg={point.fixedLeg} ride={planner.isHorse} />}
      {point.fixedLeg?.kind === 'horse_route' && <HorseLegRow leg={point.fixedLeg} />}
      {point.fixedLeg?.kind === 'ferry' && (
        <WalkFerryLegRow
          leg={point.fixedLeg}
          editable={editable}
          onRelease={() => planner.walkFerries.release(point.id)}
        />
      )}
      {routedLegs && <PaddleLegNotes leg={routedLegs.legs[index]} />}
      {planner.isSki && <SkiLegExtras planner={planner} point={point} index={index} editable={editable} />}
      {failure && (
        <LegFailure
          code={failure.code}
          load={regionLoad.byLeg.get(index)}
          disabled={!editable}
          onDrawStraight={() => planner.toggleWaypointFreeLeg(point.id)}
          onRetry={() => planner.recomputeLeg(point.id)}
          onLoadRetry={regionLoad.retry}
        />
      )}
      {paddleLayout && (
        <PaddleRowExtras
          planner={planner}
          point={point}
          index={index}
          layout={paddleLayout}
          editable={editable}
          routing={portageRouting}
        />
      )}
    </>
  );
}
