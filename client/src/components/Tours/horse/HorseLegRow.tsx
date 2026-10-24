import { ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { lineLengthM } from '../planner/tourFixedLegs';
import { ACCESS_TONE_DOT, accessText, accessToneOf } from './horseAccess';
import type { HorseSectionLeg } from './horseSection';
import { Horseshoe } from './HorseshoeIcon';

/**
 * HOR-01: a section of a horse route the ride follows, as a badge on its leg
 * in the brown the map draws it in: the route's name, a dot for what its
 * `horse=*` tags say (hollow where they say nothing), a mark where the route
 * is signposted the other way, and its length. The tooltip spells the tags out.
 */
export function HorseLegRow({ leg }: { leg: HorseSectionLeg }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  // Read as plain numbers: this workspace compiles without strict mode, where the schema's tuples are "maybe two".
  const line = leg.geometry.map(([lat, lng]): [number, number] => [Number(lat), Number(lng)]);
  const length = formatDistance(lineLengthM(line) / 1000, unit);
  const tone = accessToneOf(leg.access) ?? 'unknown';
  const access = accessText(leg.access, unit, t) || t('tours.horse.access.value.unknown');
  const name = leg.name ?? t('tours.horse.routes.unnamed');
  return (
    <li data-testid="tour-planner-horse-leg" className="flex min-w-0 py-0.5 ps-[34px]">
      <Tooltip label={t('tours.horse.leg.info', { access })}>
        <span className="flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-full bg-surface-card pe-1 ps-1.5 shadow-sm ring-1 ring-inset ring-[color:var(--horse-route)]">
          <Horseshoe
            size={14}
            strokeWidth={2.2}
            aria-hidden="true"
            className="flex-none text-[color:var(--horse-route)]"
          />
          <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
            {name}
          </span>
          {leg.signposted === 'against' && (
            <ArrowLeftRight
              size={12}
              strokeWidth={2.2}
              data-testid="tour-planner-horse-leg-against"
              role="img"
              aria-label={t('tours.horse.dialog.signedAgainst')}
              className="flex-none text-warning"
            />
          )}
          <span
            data-testid="tour-planner-horse-leg-access"
            role="img"
            aria-label={t(`tours.horse.access.summary.${tone}`)}
            className={`h-2 w-2 flex-none rounded-full ${ACCESS_TONE_DOT[tone]}`}
          />
          <span
            className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary"
            style={fs(10.5)}
          >
            {length}
          </span>
        </span>
      </Tooltip>
    </li>
  );
}
