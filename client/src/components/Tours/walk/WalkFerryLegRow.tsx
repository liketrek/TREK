import type { TourFixedLeg } from '@trek/shared';
import { Footprints, Ship } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { formatPlannedTourDuration } from '../tourPresentation';
import { FERRY_CSS_COLOR } from './walkRoutePaint';

type FerryLeg = Extract<TourFixedLeg, { kind: 'ferry' }>;

/**
 * CW-12: a crossing by boat the travellers took, as a badge on its leg in the
 * dotted look and water blue the map draws it in, with the boat's time inside
 * (or that it is not known). Giving it back plans the leg on foot again.
 */
export function WalkFerryLegRow({
  leg,
  onRelease,
  editable,
}: {
  leg: FerryLeg;
  onRelease: () => void;
  editable: boolean;
}) {
  const { t } = useTranslation();
  const time =
    leg.minutes === null
      ? t('tours.walk.ferry.timeUnknown')
      : t('tours.walk.ferry.time', { time: formatPlannedTourDuration(Math.max(1, leg.minutes)) });
  return (
    <li data-testid="walk-ferry-leg" className="flex min-w-0 items-center gap-1 py-0.5 ps-[34px]">
      <Tooltip label={t('tours.walk.ferry.legInfo')}>
        <span className="flex h-[26px] min-w-0 flex-1 items-center gap-1.5 rounded-full border border-dotted border-edge bg-surface-card pe-1 ps-2">
          <Ship size={13} strokeWidth={2} className="flex-none" style={{ color: FERRY_CSS_COLOR }} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
            {t('tours.walk.ferry.leg')}
          </span>
          <span
            className={`flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary ${leg.minutes === null ? 'opacity-60' : ''}`}
            style={fs(10.5)}
          >
            {time}
          </span>
        </span>
      </Tooltip>
      {editable && (
        <Tooltip label={t('tours.walk.ferry.release')}>
          <button
            type="button"
            onClick={onRelease}
            aria-label={t('tours.walk.ferry.release')}
            className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-content-muted hover:bg-surface-secondary hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Footprints size={13} strokeWidth={2} />
          </button>
        </Tooltip>
      )}
    </li>
  );
}
