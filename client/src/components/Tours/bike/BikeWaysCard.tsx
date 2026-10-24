import type { BikeProfile } from '@trek/shared';
import { AlertTriangle, Layers, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { CardAction, RailCard, TourNotice } from '../tourParts';
import { trailPaintKey } from './bikePaint';
import {
  percent,
  sharesBy,
  stretchesOf,
  trailClassOf,
  UNPAVED,
  unpavedShareOf,
  type RouteWayEdge,
  type RouteWays,
  type TrailClass,
} from './routeWays';
import {
  RouteWaysProgress,
  RouteWaysSource,
  ShareBar,
  ShareList,
  SurfaceSection,
  WaySection,
  WaysSection,
} from './RouteWaySections';
import { useRouteWays, type TrailGrades } from './useRouteWays';

/** BIK-05: the trail grades along a mountain bike tour, downhill and uphill apart, the unknown said. */
function TrailSection({ ways, grades, onRetry }: { ways: RouteWays; grades: TrailGrades; onRetry: () => void }) {
  const { t } = useTranslation();
  const classOf = useMemo(
    () =>
      (edge: RouteWayEdge): TrailClass =>
        edge.wayId !== null && grades.unasked.has(edge.wayId)
          ? 'unasked'
          : trailClassOf(edge.wayId === null ? undefined : grades.byWay.get(edge.wayId)),
    [grades]
  );
  const uphillOf = useMemo(
    () =>
      (edge: RouteWayEdge): string => {
        const step = edge.wayId === null ? null : grades.byWay.get(edge.wayId)?.mtb_scale_uphill;
        return step ? `u${step[0]}` : 'none';
      },
    [grades]
  );
  const rows = useMemo(() => sharesBy<TrailClass>(ways, classOf), [ways, classOf]);
  const uphill = useMemo(() => sharesBy<string>(ways, uphillOf).filter((row) => row.key !== 'none'), [ways, uphillOf]);
  // Nothing could be asked about: said once with a way to ask again, not as a row covering the whole tour.
  const noneAnswered =
    grades.status === 'ready' && grades.byWay.size === 0 && rows.every((row) => row.key === 'unasked');
  const unread = noneAnswered ? 'failed' : grades.status;
  if (unread !== 'ready')
    return (
      <WaysSection label={t('tours.bike.trail.title')}>
        <GradesStatus status={unread} onRetry={onRetry} />
      </WaysSection>
    );
  return (
    <>
      <WaysSection label={t('tours.bike.trail.title')}>
        <ShareBar rows={rows} paintOf={trailPaintKey} />
        <ShareList
          ways={ways}
          rows={rows}
          idPrefix="trail"
          classOf={classOf}
          labelOf={(key) => t(`tours.bike.trail.${key}`)}
          paintOf={trailPaintKey}
        />
      </WaysSection>
      {uphill.length > 0 && (
        <WaysSection label={t('tours.bike.trail.uphillTitle')}>
          <ShareList
            ways={ways}
            rows={uphill}
            idPrefix="uphill"
            classOf={uphillOf}
            labelOf={(key) => t('tours.bike.trail.uphillStep', { step: key.slice(1) })}
          />
        </WaysSection>
      )}
      <span className="text-content-faint" style={fs(11, 'body')}>
        {t('tours.bike.trail.note')}
      </span>
    </>
  );
}

function GradesStatus({ status, onRetry }: { status: Exclude<TrailGrades['status'], 'ready'>; onRetry: () => void }) {
  const { t } = useTranslation();
  if (status === 'loading')
    return (
      <span className="inline-flex items-center gap-1.5 text-content-muted" style={fs(11.5, 'body')}>
        <Loader2 size={12} strokeWidth={2} className="animate-spin" />
        {t('tours.bike.trail.loading')}
      </span>
    );
  return (
    <TourNotice
      tone="warning"
      icon={status === 'offline' ? <WifiOff size={13} strokeWidth={2} /> : <AlertTriangle size={13} strokeWidth={2} />}
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{t(status === 'offline' ? 'tours.bike.ways.offline' : 'tours.bike.trail.failed')}</span>
        {status === 'failed' && (
          <CardAction icon={<RefreshCw size={12} strokeWidth={2} />} onClick={onRetry}>
            {t('common.errorRetry')}
          </CardAction>
        )}
      </span>
    </TourNotice>
  );
}

/** BIK-02: a road bike tour names what of it is known to be unpaved, and points at it on the map. */
function UnpavedNotice({ ways }: { ways: RouteWays }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const unpaved = ways.edges.filter((edge) => UNPAVED.has(edge.surface)).reduce((sum, edge) => sum + edge.lengthM, 0);
  if (unpaved === 0) return null;
  const show = () =>
    useTourRouteHighlightStore
      .getState()
      .show({ id: 'unpaved', lines: stretchesOf(ways, (edge) => UNPAVED.has(edge.surface)), paint: 'gravel' });
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{t('tours.bike.ways.unpavedNotice', { length: formatDistance(unpaved / 1000, unit) })}</span>
        <CardAction icon={<Layers size={12} strokeWidth={2} />} onClick={show}>
          {t('tours.bike.ways.showOnMap')}
        </CardAction>
      </span>
    </TourNotice>
  );
}

/** What the card reads: a tour's own line, whether it is current, and the profile that decides the extras. */
export interface BikeWaysSubject {
  tripId: number | string;
  route: [number, number][] | null;
  bikeProfile: BikeProfile | null | undefined;
  /** False while there is no bike tour to read, or the editor is not open on one. */
  active: boolean;
}

/**
 * BIK-01 to BIK-05: what a bike tour runs on, its surfaces and its kinds of
 * way, and on a mountain bike tour the trail grades. Read off the router's
 * description of the route as OpenStreetMap maps it; where the data says
 * nothing the card says unknown. Nothing here changes the tour. The editor's
 * card and the tour's detail card on the Plan tab are this same view.
 */
export function BikeWaysView({ tripId, route, bikeProfile, active }: BikeWaysSubject) {
  const { t } = useTranslation();
  const state = useRouteWays({ tripId, active, route, matching: 'bike', withGrades: bikeProfile === 'mtb' });
  const { ways } = state;
  const unpaved = useMemo(() => (ways ? unpavedShareOf(ways) : null), [ways]);
  if (!active || state.status === 'idle') return null;
  return (
    <RailCard
      icon={<Layers size={14} strokeWidth={2} />}
      title={t('tours.bike.ways.title')}
      foldId="bike-ways"
      aside={
        unpaved !== null ? (
          <SoftPill tone={unpaved > 0 ? 'warning' : 'neutral'}>
            {t('tours.bike.ways.unpavedBadge', { share: percent(unpaved) })}
          </SoftPill>
        ) : undefined
      }
    >
      <div data-testid="bike-ways-card" className="flex min-w-0 flex-col gap-3">
        <RouteWaysProgress state={state} />
        {ways && (
          <>
            {bikeProfile === 'road' && <UnpavedNotice ways={ways} />}
            <SurfaceSection ways={ways} />
            <WaySection ways={ways} />
            {state.grades && <TrailSection ways={ways} grades={state.grades} onRetry={state.retry} />}
            <RouteWaysSource />
          </>
        )}
      </div>
    </RailCard>
  );
}

/** The planner rail's card: the tour being edited, its line once it is current. */
export function BikeWaysCard({ planner }: { planner: TourPlannerController }) {
  const editing = planner.mode.type === 'new-draft' || planner.mode.type === 'edit-saved';
  return (
    <BikeWaysView
      tripId={planner.tripId}
      route={planner.routeCurrent ? planner.route : null}
      bikeProfile={planner.bikeProfile}
      active={planner.isBike && editing}
    />
  );
}
