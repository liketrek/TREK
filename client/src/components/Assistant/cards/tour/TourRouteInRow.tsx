import type { TourRouteCard } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import ElevationProfile from '../../../shared/ElevationProfile';
import { variantPaintCss } from '../../../Tours/planner/legVariantPaint';
import { VariantDelta } from '../../../Tours/planner/LegVariantsCard';
import { tourDayRowIcon } from '../../../Tours/tourDayRowIcon';
import type { ChangeItem } from '../../assistantParts';
import { verbLookOf } from '../cardLooks';
import KindTile from '../parts/KindTile';
import WayFigures from './TourFigureLine';
import { TourGrade, TourRouteSketch } from './TourRouteHead';
import { legVariantOf, previousVariantOf, profileBands, profileSamples } from './tourRouteModel';
import { useTourRouteCard } from './useTourRouteCard';

/**
 * A held tour change in its row, and the receipt it turns into: the route
 * drawn small with its figures and grade, a small profile under it, and for a
 * changed route how the new way differs from the one it replaces (the old
 * line faint in the sketch). A tour whose way is planned only once it is
 * added is drawn straight and says so. The receipt keeps all of it; "On map"
 * and "Open in Tours" sit at the receipt's end.
 */

/** The tile in front of the row: what kind of tour, in the tone of what happens to it. */
export function TourRouteLead({ card, item }: { card: TourRouteCard; item: ChangeItem }) {
  const tone = verbLookOf(item.preview?.verbKey ?? 'addTour').tone;
  const settled = item.state === 'discarded' || item.state === 'expired';
  return <KindTile icon={tourDayRowIcon(card.activity)} tone={tone} size="sm" dimmed={settled} />;
}

export default function TourRouteInRow({ card, item }: { card: TourRouteCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const { showOnMap } = useTourRouteCard(item.toolCallId, card);
  const samples = useMemo(() => profileSamples(card), [card]);
  const previous = previousVariantOf(card);
  const notPlanned = card.problem?.why === 'not_planned';
  const grades = card.activity === 'hike' ? card.grades : null;
  return (
    <div
      className="flex flex-col gap-2 rounded-[12px] border border-edge-faint bg-surface-secondary p-2.5"
      data-testid="tour-route-row"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-14 flex-none overflow-hidden rounded-[10px] bg-surface-card p-1 shadow-sm">
          <TourRouteSketch card={card} height={36} onShow={showOnMap} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1">
              <WayFigures way={legVariantOf(card, 'current')} unit={unit} />
            </span>
            {grades && grades.highest !== null && <TourGrade card={card} />}
          </span>
          {previous && (
            <VariantDelta
              variant={legVariantOf(card, 'current')}
              current={previous}
              unit={unit}
              t={t}
              hint={t('assistant.card.tour.deltaBefore')}
            />
          )}
          {notPlanned && <p className="m-0 text-caption text-content-faint">{t('assistant.card.tour.notPlanned')}</p>}
        </div>
      </div>
      {!notPlanned && samples.length >= 2 && (
        <ElevationProfile
          samples={samples}
          color={variantPaintCss('current')}
          height={36}
          gradientId={`assistant-tour-row-${item.toolCallId.replace(/[^\w-]/g, '-')}`}
          bands={profileBands(card, samples)}
        />
      )}
    </div>
  );
}
