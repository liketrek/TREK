import { HORSE_ROUTES_ATTRIBUTION, type HorseRoute } from '@trek/shared';
import { AlertTriangle, ArrowRight, ChevronRight, Loader2, RefreshCw, Search, WifiOff, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { CardAction, InfoDot, RailCard, TourNotice } from '../tourParts';
import { HorseRouteDialog } from './HorseRouteDialog';
import { horseRouteTitle } from './horseSection';
import { Horseshoe } from './HorseshoeIcon';
import { useHorseRoutes, type HorseRoutes } from './useHorseRoutes';

/**
 * One route found in the view: its horseshoe with the number of its sections
 * in the corner, its name, its length in the view, and a mark where it goes
 * on beyond. Pressed, it opens the route to take a section of it.
 */
function RouteRow({ route, onOpen }: { route: HorseRoute; onOpen: () => void }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const lengthM = route.sections.reduce((sum, section) => sum + section.length_m, 0);
  return (
    <li>
      <button
        type="button"
        data-testid={`horse-route-${route.id}`}
        onClick={onOpen}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-1.5 py-1.5 text-start transition-colors hover:bg-surface-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="relative grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-surface-tertiary">
          <Horseshoe size={16} strokeWidth={2.1} aria-hidden="true" className="text-[color:var(--horse-route)]" />
          <span
            aria-hidden="true"
            className="absolute -end-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-surface-card px-1 font-geist font-semibold tabular-nums leading-none text-content shadow-sm ring-1 ring-inset ring-edge-faint"
            style={fs(9.5)}
          >
            {route.sections.length}
          </span>
          <span className="sr-only">{`${t('tours.horse.routes.sections')}: ${route.sections.length}`}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-content" style={fs(12.5, 'body')}>
            {horseRouteTitle(route, t)}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1">
            <WhiteBadge>{formatDistance(lengthM / 1000, unit)}</WhiteBadge>
            {route.ref && route.name && <SoftPill>{route.ref}</SoftPill>}
            {route.continues && (
              <SoftPill icon={<ArrowRight size={10} strokeWidth={2.4} className="rtl:rotate-180" />}>
                {t('tours.horse.routes.continues')}
              </SoftPill>
            )}
          </span>
        </span>
        <ChevronRight
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          className="flex-none text-content-faint rtl:rotate-180"
        />
      </button>
    </li>
  );
}

/** What the last search came to, when that is not a list: loading, nothing found, or why it could not look. */
function SearchStatus({ found }: { found: HorseRoutes }) {
  const { t } = useTranslation();
  if (found.status === 'loading')
    return (
      <span className="inline-flex items-center gap-1.5 text-content-muted" style={fs(11.5, 'body')}>
        <Loader2 size={12} strokeWidth={2} className="animate-spin" />
        {t('tours.horse.routes.loading')}
      </span>
    );
  if (found.status === 'zoom')
    return <TourNotice icon={<ZoomIn size={13} strokeWidth={2} />}>{t('tours.horse.routes.zoomIn')}</TourNotice>;
  if (found.status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.horse.routes.offline')}</TourNotice>;
  if (found.status === 'failed')
    return (
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        {t('tours.horse.routes.failed')}
      </TourNotice>
    );
  if (found.status === 'ready' && found.routes.length === 0)
    return <TourNotice>{t('tours.horse.routes.none')}</TourNotice>;
  if (found.status === 'ready' && found.stale)
    return <TourNotice icon={<RefreshCw size={13} strokeWidth={2} />}>{t('tours.horse.routes.stale')}</TourNotice>;
  if (found.status === 'ready' && found.truncated)
    return <TourNotice icon={<ZoomIn size={13} strokeWidth={2} />}>{t('tours.horse.routes.truncated')}</TourNotice>;
  return null;
}

function HorseRoutesBody({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation();
  const found = useHorseRoutes(planner.tripId);
  const [open, setOpen] = useState<HorseRoute | null>(null);
  const searched = found.searched !== null;
  const again = searched && (found.stale || found.status === 'failed' || found.status === 'offline');
  return (
    <RailCard
      icon={<Horseshoe size={14} strokeWidth={2} />}
      title={t('tours.horse.routes.title')}
      foldId="horse-routes"
      aside={
        <>
          {found.status === 'ready' && found.routes.length > 0 && <SoftPill>{found.routes.length}</SoftPill>}
          <InfoDot label={t('tours.horse.routes.infoLabel')} description={t('tours.horse.routes.info')} />
        </>
      }
    >
      <div data-testid="horse-routes-card" className="flex min-w-0 flex-col gap-2.5">
        {(!searched || again) && (
          <span className="flex">
            <CardAction
              icon={again ? <RefreshCw size={12} strokeWidth={2} /> : <Search size={12} strokeWidth={2} />}
              onClick={() => void found.search()}
              disabled={found.status === 'loading'}
            >
              {t(again ? 'tours.horse.routes.searchAgain' : 'tours.horse.routes.search')}
            </CardAction>
          </span>
        )}
        <SearchStatus found={found} />
        {found.routes.length > 0 && (
          <ul
            data-testid="horse-routes-list"
            className={`m-0 flex list-none flex-col gap-0.5 p-0 transition-opacity ${found.status === 'ready' && !found.stale ? '' : 'opacity-60'}`}
          >
            {found.routes.map((route) => (
              <RouteRow key={route.id} route={route} onOpen={() => setOpen(route)} />
            ))}
          </ul>
        )}
        {searched && (
          <span className="text-content-faint" style={fs(10.5, 'body')}>
            {HORSE_ROUTES_ATTRIBUTION}
          </span>
        )}
      </div>
      {open && <HorseRouteDialog key={open.id} planner={planner} route={open} onClose={() => setOpen(null)} />}
    </RailCard>
  );
}

/**
 * HOR-01: the signposted horse routes of the map view, beside a ride being
 * planned. Looked for when the rider asks; a route opens in a dialog to take
 * a section of it. Shown only while a ride is edited.
 */
export function HorseRoutesCard({ planner }: { planner: TourPlannerController }) {
  const editing = planner.mode.type === 'new-draft' || planner.mode.type === 'edit-saved';
  if (!planner.isHorse || !editing) return null;
  return <HorseRoutesBody planner={planner} />;
}
