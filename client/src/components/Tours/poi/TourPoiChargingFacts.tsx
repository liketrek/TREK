import type { TourPoiCharging } from '@trek/shared';
import { Bike, Plug } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from '../../../i18n';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';

/** Socket families as people call them; proper nouns, so not translated. */
const SOCKET_NAMES: Record<string, string> = {
  schuko: 'Schuko',
  typee: 'Type E',
  bs1363: 'BS 1363',
  sev1011_t13: 'T13',
  sev1011_t23: 'T23',
  cee_blue: 'CEE',
  type2: 'Type 2',
};

/** The household plugs: the bike's own charger goes in, none hangs there. */
const HOUSEHOLD_SOCKETS: ReadonlySet<string> = new Set([
  'schuko',
  'typee',
  'bs1363',
  'sev1011_t13',
  'sev1011_t23',
  'cee_blue',
]);

type Translate = ReturnType<typeof useTranslation>['t'];

/** OpenStreetMap's access values, read as one of four answers; any other is left unsaid. */
function accessLabel(access: string | null, t: Translate) {
  if (access === 'yes' || access === 'permissive' || access === 'public') return t('tours.poi.charging.access.public');
  if (access === 'customers') return t('tours.poi.charging.access.customers');
  if (access === 'private') return t('tours.poi.charging.access.private');
  if (access === 'no') return t('tours.poi.charging.access.none');
  return null;
}

function Fact({ hint, children }: { hint: string; children: ReactElement }) {
  return (
    <Tooltip label={hint} placement="top">
      <span className="inline-flex">{children}</span>
    </Tooltip>
  );
}

/**
 * BIK-07: what an e-bike charging point states, a badge per fact and only the
 * facts given: made for bikes or letting them charge, its sockets, fee, access
 * and how many bikes fit. A plug left unsaid is said to be unsaid, dimmed, so it
 * never reads as one that fits.
 */
export function TourPoiChargingFacts({ charging }: { charging: TourPoiCharging }) {
  const { t } = useTranslation();
  const hint = t('tours.poi.charging.sourceHint');
  const access = accessLabel(charging.access, t);
  return (
    <div className="mt-2" data-testid="tour-poi-charging">
      <p className="m-0 mb-1 text-caption text-content-faint">{t('tours.poi.charging.label')}</p>
      <div className="flex flex-wrap gap-1.5">
        <Fact hint={hint}>
          {charging.bicycle === 'designated' ? (
            <SoftPill tone="success" icon={<Bike size={10} strokeWidth={2.2} aria-hidden="true" />}>
              {t('tours.poi.charging.designated')}
            </SoftPill>
          ) : (
            <WhiteBadge icon={<Bike size={10} strokeWidth={2.2} className="text-content-faint" />}>
              {t('tours.poi.charging.allowed')}
            </WhiteBadge>
          )}
        </Fact>
        {charging.sockets.map((socket) => (
          <Fact key={socket.type} hint={HOUSEHOLD_SOCKETS.has(socket.type) ? t('tours.poi.charging.ownCharger') : hint}>
            <WhiteBadge icon={<Plug size={10} strokeWidth={2.2} className="text-content-faint" />}>
              {SOCKET_NAMES[socket.type] ?? socket.type}
              {socket.count && socket.count > 1 ? ` ×${socket.count}` : ''}
              {socket.kw ? ` ${socket.kw} kW` : ''}
            </WhiteBadge>
          </Fact>
        ))}
        {charging.sockets.length === 0 && (
          <Fact hint={t('tours.poi.charging.socketsUnknownHint')}>
            <span className="inline-flex opacity-60" data-testid="tour-poi-charging-no-socket">
              <WhiteBadge icon={<Plug size={10} strokeWidth={2.2} className="text-content-faint" />}>
                {t('tours.poi.charging.socketsUnknown')}
              </WhiteBadge>
            </span>
          </Fact>
        )}
        {charging.fee !== null && (
          <Fact hint={hint}>
            <WhiteBadge>{charging.fee ? t('tours.poi.charging.fee') : t('tours.poi.charging.free')}</WhiteBadge>
          </Fact>
        )}
        {access && (
          <Fact hint={hint}>
            <WhiteBadge>{access}</WhiteBadge>
          </Fact>
        )}
        {charging.capacity !== null && (
          <Fact hint={hint}>
            <WhiteBadge>
              {t('tours.poi.charging.capacity')}
              <span className="font-medium text-content">{charging.capacity}</span>
            </WhiteBadge>
          </Fact>
        )}
      </div>
    </div>
  );
}
