import { Clock, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

/**
 * CW-02: a city walk station's stay, where one is entered, as a quiet pill
 * under its name. A stay nobody entered says nothing. How much the station
 * matters and whether it is protected are drawn on its number instead
 * (`stationRingClass`, `StationShield`).
 */
export function StationPills({ point }: { point: Pick<TourPlannerWaypoint, 'stayMinutes'> }) {
  const { t } = useTranslation();
  if (point.stayMinutes == null) return null;
  return (
    <span className="flex flex-wrap items-center gap-1" data-testid="station-pills">
      <SoftPill icon={<Clock size={10} strokeWidth={2.2} aria-hidden="true" />}>
        {point.stayMinutes === 0 ? t('tours.walk.station.passThrough') : formatPlannedTourDuration(point.stayMinutes)}
      </SoftPill>
    </span>
  );
}

/** CW-10: a protected station's shield, at the top corner of its number. */
export function StationShield() {
  return (
    <span
      aria-hidden="true"
      data-station-protected="true"
      className="absolute -end-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm"
    >
      <ShieldCheck size={9} strokeWidth={2.4} />
    </span>
  );
}
