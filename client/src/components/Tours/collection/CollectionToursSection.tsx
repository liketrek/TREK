import type { CollectionTourItem } from '@trek/shared';
import { AlertTriangle, CopyPlus, Gauge, Moon, Route, Trash2, Waypoints, WifiOff } from 'lucide-react';
import { createElement, type MouseEvent } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { WhiteBadge } from '../../Planner/planParts';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { Tooltip } from '../../shared/Tooltip';
import { TourMeasurePills } from '../library/tourPreviewParts';
import { runPaceText } from '../run/runPaceText';
import { tourDayRowIcon } from '../tourDayRowIcon';
import { TourGradeTile, TourNotice } from '../tourParts';
import { CollectionTourTakeOverDialog } from './CollectionTourTakeOverDialog';
import { sourceText } from './keptTourText';
import {
  toursMatching,
  useActiveCollectionTourList,
  useCollectionTours,
  type CollectionTours,
} from './useCollectionTours';
import { useCollectionTourTakeOver } from './useCollectionTourTakeOver';

/**
 * What the trip's list shows of a kept tour beyond its measures: a run's pace
 * and a multi-day tour's stages, each a badge whose tooltip names it.
 */
function KeptTourTypeBadges({ tour }: { tour: CollectionTourItem }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const pace = runPaceText(tour, t, unit);
  const stages = tour.stage_count ? t('tours.stages.count', { count: tour.stage_count }) : null;
  const icon = 'flex-none text-content-faint';
  return (
    <>
      {pace && (
        <Tooltip label={t('tours.run.pace')}>
          <span className="inline-flex" data-testid="kept-tour-pace" aria-label={`${t('tours.run.pace')}: ${pace}`}>
            <WhiteBadge icon={<Gauge size={10} strokeWidth={2.2} className={icon} />}>{pace}</WhiteBadge>
          </span>
        </Tooltip>
      )}
      {stages && (
        <span className="inline-flex" data-testid="kept-tour-stages">
          <WhiteBadge icon={<Moon size={10} strokeWidth={2.2} className={icon} />}>{stages}</WhiteBadge>
        </span>
      )}
    </>
  );
}

/**
 * One kept tour as a row of the collection's list, the way a saved place is:
 * its grade tile where a place has its photo, its name with its type and the
 * trip it was kept from, then its measures, the way into a trip and, for its
 * owner or an admin, removing it. The whole row takes it into a trip, as the
 * whole row of a place opens the place.
 */
function KeptTourRow({
  tour,
  canRemove,
  onTake,
  onRemove,
}: {
  tour: CollectionTourItem;
  canRemove: boolean;
  onTake: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const tile = { ...tour, has_waypoints: tour.waypoint_count > 0 };
  const points = t('tours.collection.points', { count: tour.waypoint_count });
  const stop = (act: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    act();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      data-no-press
      data-testid={`kept-tour-${tour.id}`}
      onClick={onTake}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onTake();
      }}
      className="col-lrow col-lrow-tour group"
    >
      <span className="col-lrow-tile">
        <TourGradeTile tour={tile} />
      </span>
      <div className="li">
        <div className="t">{tour.name}</div>
        <div className="s">
          {createElement(tourDayRowIcon(tour.tour_type), { size: 11 })}
          <span>{t(`tourTypes.${tour.tour_type}`)}</span>
          <Tooltip label={sourceText(tour, t)}>
            <span className="col-lrow-from">
              <Route size={11} />
              <span>{tour.source.tripTitle}</span>
            </span>
          </Tooltip>
        </div>
      </div>
      <div className="col-lrow-end">
        <span className="col-lrow-measures">
          <TourMeasurePills tour={tour} testPrefix="kept-tour" />
          <KeptTourTypeBadges tour={tour} />
          {tour.waypoint_count > 0 && (
            <Tooltip label={points}>
              <span className="inline-flex" aria-label={points}>
                <WhiteBadge icon={<Waypoints size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
                  {tour.waypoint_count}
                </WhiteBadge>
              </span>
            </Tooltip>
          )}
        </span>
        <span className="col-lrow-div" aria-hidden />
        <Tooltip label={t('tours.collection.addHint')}>
          <button type="button" className="col-lrow-act" onClick={stop(onTake)}>
            <CopyPlus size={13} strokeWidth={2} />
            {t('tours.collection.add')}
          </button>
        </Tooltip>
        {canRemove && (
          <Tooltip label={t('tours.collection.remove')}>
            <button
              type="button"
              onClick={stop(onRemove)}
              aria-label={t('tours.collection.remove')}
              data-testid={`kept-tour-remove-${tour.id}`}
              className="col-lrow-remove opacity-50 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/** What stands above the rows while they cannot be shown: offline, or failed with a retry. */
function SectionProblem({ kept }: { kept: CollectionTours }) {
  const { t } = useTranslation();
  if (kept.status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.collection.offline')}</TourNotice>;
  if (kept.status !== 'error') return null;
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      <span className="flex flex-wrap items-center gap-2">
        {t('tours.collection.toursFailed')}
        <button type="button" onClick={kept.retry} className="font-semibold underline underline-offset-2">
          {t('tours.planner.retry')}
        </button>
      </span>
    </TourNotice>
  );
}

/**
 * LIB-03 on a collection's page: the whole tours it keeps, as the first rows
 * of its list, each ready to be taken into a trip. The list's search narrows
 * them by name as it narrows the places. Nothing shows while it keeps none,
 * or while the Tours addon is off.
 */
export function CollectionToursSection({
  collectionId,
  canRemove,
  search = '',
}: {
  collectionId: number;
  canRemove: boolean;
  search?: string;
}) {
  const { t } = useTranslation();
  const kept = useCollectionTours(collectionId);
  const takeOver = useCollectionTourTakeOver(collectionId);
  const problem = kept.status === 'error' || kept.status === 'offline';
  const shown = toursMatching(kept.tours, search);
  if (!kept.enabled || (shown.length === 0 && !problem)) return null;
  return (
    <section aria-label={t('tours.title')} className="col-listview col-tourrows" data-testid="collection-tours">
      <SectionProblem kept={kept} />
      {shown.map((tour) => (
        <KeptTourRow
          key={tour.id}
          tour={tour}
          canRemove={canRemove}
          onTake={() => takeOver.show(tour)}
          onRemove={() => kept.askRemove(tour)}
        />
      ))}
      <CollectionTourTakeOverDialog takeOver={takeOver} />
      <ConfirmDialog
        isOpen={kept.removing !== null}
        onClose={kept.cancelRemove}
        onConfirm={() => void kept.confirmRemove()}
        title={t('tours.collection.removeTitle')}
        message={t('tours.collection.removeBody')}
        confirmLabel={t('tours.collection.remove')}
        cancelLabel={t('common.cancel')}
        danger
      />
    </section>
  );
}

/** The tours of the list open on the collections page; nothing on "All saved" or before a list opens. */
export function ActiveCollectionTours({ search = '' }: { search?: string }) {
  const { collectionId, canRemove } = useActiveCollectionTourList();
  if (collectionId === null) return null;
  return <CollectionToursSection collectionId={collectionId} canRemove={canRemove} search={search} />;
}
