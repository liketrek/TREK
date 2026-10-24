import { GitCompareArrows, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import { MAP_CARD_GLASS } from '../../Map/mapControlShadow';
import { Eyebrow } from '../../Planner/bookings/bookingParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { ACTUAL_TRACK_COLOR, LineSwatch } from './activityCompareParts';
import type { ActivityCompareLegend as Legend } from './useActivityCompareMap';

/** One line of the legend: how it is drawn, what it is, and whose it is. */
function LegendRow({ swatch, label, name }: { swatch: ReactNode; label: string; name: string }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span className="grid h-6 w-8 flex-none place-items-center rounded-full bg-surface-card shadow-sm ring-1 ring-inset ring-edge-faint">
        {swatch}
      </span>
      <span className="flex min-w-0 flex-col">
        <Eyebrow>{label}</Eyebrow>
        <span className="truncate font-semibold text-content" style={fs(12, 'body')}>
          {name}
        </span>
      </span>
    </li>
  );
}

/**
 * ACT-02 over the plan map: what its two lines are while a tour is compared
 * with its actual track, in the frosted look of the map's cards. Closing it
 * ends the comparison; it changes nothing else.
 */
export default function ActivityCompareLegend({ legend }: { legend: Legend }) {
  const { t } = useTranslation();
  const close = t('tours.activity.compare.hide');
  return (
    <aside
      data-testid="activity-compare-legend"
      aria-label={t('tours.activity.compare.title')}
      className="pointer-events-auto w-[240px] rounded-2xl p-3"
      style={MAP_CARD_GLASS}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <GitCompareArrows size={13} strokeWidth={2} className="flex-none text-content-muted" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12.5, 'body')}>
          {t('tours.activity.compare.title')}
        </span>
        <Tooltip label={close}>
          <button
            type="button"
            onClick={() => useTourActivityCompareStore.getState().clear()}
            aria-label={close}
            className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </Tooltip>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        <LegendRow
          swatch={<LineSwatch color={legend.planColor} />}
          label={t('tours.activity.compare.plan')}
          name={legend.planName}
        />
        <LegendRow
          swatch={<LineSwatch color={ACTUAL_TRACK_COLOR} dotted />}
          label={t('tours.activity.badge')}
          name={legend.trackName}
        />
      </ul>
    </aside>
  );
}
