import type { HorseRoute } from '@trek/shared';
import { ArrowRight, ExternalLink, Plus } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { SoftPill } from '../../Planner/planParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  PILL,
  fs,
} from '../../shared/DialogShell';
import { FigureBadge } from '../paddle/FigureBadge';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { AccessLabel, AccessPills, ConnectionField, DirectionField, SectionChips } from './HorseRouteDialogParts';
import { HorseRouteMap } from './HorseRouteMap';
import { horseRouteTitle } from './horseSection';
import { Horseshoe } from './HorseshoeIcon';
import { useHorseSectionPick } from './useHorseSectionPick';

type DialogPlanner = Pick<TourPlannerController, 'waypoints' | 'editWaypoints' | 'isSaving' | 'canEdit' | 'route'>;

/** What the route is at a glance: its reference, its sections, whether it goes on, and a way to OpenStreetMap. */
function RoutePills({ route }: { route: HorseRoute }) {
  const { t } = useTranslation();
  return (
    <>
      {route.ref && route.name && <SoftPill>{route.ref}</SoftPill>}
      <FigureBadge label={t('tours.horse.routes.sections')} value={String(route.sections.length)} />
      {route.continues && (
        <SoftPill icon={<ArrowRight size={11} strokeWidth={2.4} className="rtl:rotate-180" />}>
          {t('tours.horse.routes.continues')}
        </SoftPill>
      )}
      <a href={route.osmUrl} target="_blank" rel="noopener noreferrer" className={PILL} style={fs(11, 'body')}>
        <ExternalLink size={11} strokeWidth={2.2} aria-hidden="true" />
        {t('tours.horse.dialog.osm')}
      </a>
    </>
  );
}

/**
 * HOR-01: a signposted horse route, and the one place a section of it goes
 * onto the ride. The rider sees the route on a map, picks a section and the
 * direction, reads what the tags along it say and how it joins the ride, and
 * only then takes it: one step of the planner's history. Being on the route
 * is never read as a permission to ride it.
 */
export function HorseRouteDialog({
  planner,
  route,
  onClose,
}: {
  planner: DialogPlanner;
  route: HorseRoute;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const pick = useHorseSectionPick(planner, route, onClose);
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="editor"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Horseshoe size={20} strokeWidth={2} className="text-[color:var(--horse-route)]" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={t('tours.horse.dialog.eyebrow')}
          title={horseRouteTitle(route, t)}
          pills={<RoutePills route={route} />}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            data-testid="horse-section-adopt"
            icon={<Plus size={14} strokeWidth={2} />}
            disabled={!pick.canAdopt}
            title={pick.leg && pick.gapOpen && !pick.joinGap ? t('tours.horse.dialog.adoptGapHint') : undefined}
            onClick={pick.adopt}
          >
            {t('tours.horse.dialog.adopt')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <HorseRouteMap route={route} chosen={pick.leg} ride={planner.route} />
      <DialogSection label={t('tours.horse.routes.sections')}>
        <SectionChips route={route} chosen={pick.section?.number} onPick={pick.pick} unit={unit} />
      </DialogSection>
      {pick.leg && (
        <>
          <DialogSection label={t('tours.horse.dialog.direction')}>
            <DirectionField pick={pick} />
          </DialogSection>
          <DialogSection label={<AccessLabel />}>
            <AccessPills leg={pick.leg} unit={unit} />
          </DialogSection>
          <DialogSection label={t('tours.horse.dialog.connection')}>
            <ConnectionField pick={pick} unit={unit} />
          </DialogSection>
        </>
      )}
    </DialogShell>
  );
}
