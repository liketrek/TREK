import type { TourListItem } from '@trek/shared';
import { ArrowUp, Clock, Footprints, Pause, Ruler, type LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { Tooltip } from '../shared/Tooltip';
import { tourDayRowIcon } from './tourDayRowIcon';
import { formatPlannedTourDuration, tourPlannedTimes } from './tourPresentation';

export function TourDayRowIcon({ type, size = 27 }: { type: string; size?: number }) {
  const { t } = useTranslation();
  const Icon = tourDayRowIcon(type);
  const known = ['hike', 'bike', 'walk', 'kayak'].includes(type);
  return (
    <span
      data-testid="plan-tour-icon"
      aria-label={known ? t(`tourTypes.${type}`) : t('tours.mode.tours')}
      className="grid flex-none place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.6)} aria-hidden="true" />
    </span>
  );
}

function Fact({
  icon: Icon,
  value,
  label,
  testId,
  mobile,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  testId: string;
  mobile: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex max-w-full">
      <Tooltip label={label}>
        <button
          type="button"
          data-testid={testId}
          aria-label={label}
          aria-expanded={open}
          aria-controls={id}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') setOpen(false);
          }}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[0.65625rem] tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${mobile ? 'bg-[color:var(--m-ic)] text-m-muted' : 'bg-surface-card text-content-secondary'}`}
        >
          <Icon size={11} aria-hidden="true" />
          {value}
        </button>
      </Tooltip>
      <span
        id={id}
        hidden={!open}
        role="note"
        className={`absolute start-0 top-full z-30 mt-1 w-40 whitespace-normal rounded-[6px] border p-2 text-[0.6875rem] shadow-sm ${mobile ? 'bg-[color:var(--m-ic)] text-m-ink' : 'border-edge bg-surface-card text-content'}`}
      >
        {label}
      </span>
    </span>
  );
}

export default function TourDayRowFacts({ tour, mobile = false }: { tour: TourListItem; mobile?: boolean }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  const times = tourPlannedTimes(tour);
  const facts: Array<{ icon: LucideIcon; value: string; label: string; testId: string }> = [];
  const add = (icon: LucideIcon, value: string, label: string, testId: string) =>
    facts.push({ icon, value, label, testId });
  if (tour.distance != null)
    add(Ruler, formatDistance(tour.distance, unit), t('tours.detail.distance'), 'plan-tour-distance');
  if (tour.elevation_gain != null)
    add(ArrowUp, formatElevation(tour.elevation_gain, unit), t('tours.detail.ascent'), 'plan-tour-ascent');
  if (times.walkingMinutes != null)
    add(
      Footprints,
      formatPlannedTourDuration(times.walkingMinutes),
      t('tours.planner.inspector.duration'),
      'trip-plan-tour-walking-time'
    );
  if (times.breakMinutes != null && times.breakMinutes > 0)
    add(
      Pause,
      formatPlannedTourDuration(times.breakMinutes),
      t('tours.planner.breaksAdditional'),
      'trip-plan-tour-breaks'
    );
  if (times.plannedTotalMinutes != null)
    add(
      Clock,
      formatPlannedTourDuration(times.plannedTotalMinutes),
      `${t('tours.planner.plannedTotalDuration')}${times.manuallyOverridden ? `, ${t('tours.planner.plannedTotalManual')}` : ''}`,
      'trip-plan-tour-planned-duration'
    );
  return (
    <span data-testid="plan-tour-facts" className="flex min-w-0 flex-wrap items-center gap-1">
      {facts.map((fact) => (
        <Fact key={fact.testId} {...fact} label={`${fact.label}: ${fact.value}`} mobile={mobile} />
      ))}
    </span>
  );
}
