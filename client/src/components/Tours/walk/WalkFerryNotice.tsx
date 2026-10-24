import { Check, Eye, MapPin, Ship, Unlink } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';
import { stopNumbersOf, type TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { WalkFerryCrossing } from '../planner/tourRouting';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { CardAction, TourNotice } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import { useLinkedPlaceOf } from './useWalkSchedule';
import { ferryMinutesOf, legStationsOf } from './walkFerry';
import { FERRY_CSS_COLOR } from './walkRoutePaint';

type Planner = Pick<
  TourPlannerController,
  'walkFerries' | 'waypoints' | 'setSelectedWaypointId' | 'canEdit' | 'isSaving'
>;

/** A leg's two stations as the stop list shows them: by name, the trip place they stand for, else their number. */
interface LegStop {
  id: string | null;
  name: string;
  number: number;
}

function useLegStops(planner: Planner): (leg: number) => { from: LegStop; to: LegStop } {
  const { t } = useTranslation();
  const placeOf = useLinkedPlaceOf();
  const numbers = stopNumbersOf(planner.waypoints);
  const stopOf = (point: TourPlannerWaypoint | null): LegStop => {
    const number = point ? (numbers.get(point.id) ?? 0) : 0;
    return {
      id: point?.id ?? null,
      name: point?.name?.trim() || (point && placeOf(point)?.name) || t('tours.walk.stationNumbered', { number }),
      number,
    };
  };
  return (leg) => {
    const { from, to } = legStationsOf(planner.waypoints, leg);
    return { from: stopOf(from), to: stopOf(to) };
  };
}

/** The crossing's length and time as badges; a time the router did not give says so, dimmed. */
function CrossingFacts({ crossing }: { crossing: WalkFerryCrossing }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  const minutes = ferryMinutesOf(crossing);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <SoftPill icon={<Ship size={10} strokeWidth={2.2} className="flex-none" style={{ color: FERRY_CSS_COLOR }} />}>
        {formatDistance(crossing.metres / 1000, unit ?? 'metric')}
      </SoftPill>
      <Tooltip label={t('tours.walk.ferry.timeHint')}>
        <span data-testid="walk-ferry-time" className={`inline-flex ${minutes === null ? 'opacity-60' : ''}`}>
          <SoftPill>
            {minutes === null
              ? t('tours.walk.ferry.timeUnknown')
              : t('tours.walk.ferry.time', { time: formatPlannedTourDuration(minutes) })}
          </SoftPill>
        </span>
      </Tooltip>
    </span>
  );
}

function SelectStop({ planner, stop }: { planner: Planner; stop: LegStop }) {
  const { t } = useTranslation();
  return (
    <CardAction icon={<MapPin size={12} strokeWidth={2} />} onClick={() => planner.setSelectedWaypointId(stop.id)}>
      {t('tours.walk.ferry.selectStop', { number: stop.number })}
    </CardAction>
  );
}

/** Take ferry; one whose line is too long to keep as a leg is dimmed, with why and what to do instead. */
function AcceptAction({ planner, crossing }: { planner: Planner; crossing: WalkFerryCrossing }) {
  const { t } = useTranslation();
  const { accept, acceptable } = planner.walkFerries;
  const fits = acceptable(crossing);
  const action = (
    <CardAction
      icon={<Check size={12} strokeWidth={2} />}
      onClick={() => accept(crossing)}
      disabled={!planner.canEdit || planner.isSaving || !fits}
    >
      {t('tours.walk.ferry.accept')}
    </CardAction>
  );
  if (fits) return action;
  return (
    <Tooltip label={t('tours.walk.ferry.acceptTooLong')}>
      <span className="inline-flex" data-testid="walk-ferry-accept-too-long">
        {action}
      </span>
    </Tooltip>
  );
}

/**
 * CW-12: a city walk's crossings by boat in the planner. One the router took
 * is named with its length and the boat's time, shown on the map on demand,
 * and holds the save until the travellers take it as a ferry leg or move a
 * stop; one taken is said once more, so the walk's time reads right. A leg no
 * way joins at all names its two stops; the route planned before stays,
 * greyed, until a way is found.
 */
export function WalkFerryNotice({ planner }: { planner: Planner }) {
  const { t } = useTranslation();
  const { gap, crossings, show } = planner.walkFerries;
  const stopsOf = useLegStops(planner);
  const gapStops = gap ? stopsOf(gap.leg) : null;
  return (
    <>
      {gapStops && (
        <TourNotice tone="warning" icon={<Unlink size={13} strokeWidth={2} />}>
          <span className="flex flex-col items-start gap-1.5" data-testid="walk-ferry-gap">
            <span>{t('tours.walk.ferry.gap', { from: gapStops.from.name, to: gapStops.to.name })}</span>
            <span className="text-content-muted">{t('tours.walk.ferry.gapHint')}</span>
            <SelectStop planner={planner} stop={gapStops.to} />
          </span>
        </TourNotice>
      )}
      {crossings.map((crossing) => {
        const stops = stopsOf(crossing.leg);
        const names = { from: stops.from.name, to: stops.to.name };
        return (
          <TourNotice
            key={`${crossing.leg}:${crossing.accepted ? 'kept' : 'open'}`}
            tone={crossing.accepted ? 'neutral' : 'warning'}
            icon={<Ship size={13} strokeWidth={2} />}
          >
            <span className="flex flex-col items-start gap-1.5" data-testid="walk-ferry">
              <span>{t(crossing.accepted ? 'tours.walk.ferry.accepted' : 'tours.walk.ferry.pending', names)}</span>
              <CrossingFacts crossing={crossing} />
              {!crossing.accepted && <span className="text-content-muted">{t('tours.walk.ferry.pendingHint')}</span>}
              <span className="flex flex-wrap gap-1.5">
                {!crossing.accepted && <AcceptAction planner={planner} crossing={crossing} />}
                <CardAction icon={<Eye size={12} strokeWidth={2} />} onClick={() => show(crossing)}>
                  {t('tours.walk.ferry.show')}
                </CardAction>
                {!crossing.accepted && <SelectStop planner={planner} stop={stops.to} />}
              </span>
            </span>
          </TourNotice>
        );
      })}
    </>
  );
}
