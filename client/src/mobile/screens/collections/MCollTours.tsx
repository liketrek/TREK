import type { CollectionTourItem, CollectionTourTarget } from '@trek/shared';
import { ArrowRight, Check, CopyPlus, Loader2, Route, Trash2 } from 'lucide-react';
import { createElement } from 'react';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import { fs } from '../../../components/shared/DialogShell';
import { sourceText } from '../../../components/Tours/collection/keptTourText';
import {
  toursMatching,
  useActiveCollectionTourList,
  useCollectionTours,
} from '../../../components/Tours/collection/useCollectionTours';
import {
  useCollectionTourTakeOver,
  type CollectionTourTakeOver,
  type PointsChoice,
} from '../../../components/Tours/collection/useCollectionTourTakeOver';
import { measureBadges } from '../../../components/Tours/library/tourMeasureBadges';
import { tourDayRowIcon } from '../../../components/Tours/tourDayRowIcon';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import MSheet from '../../components/MSheet';
import { CancelPill, Eyebrow, PrimaryPill, SheetFooter, SheetHeader } from './MCollSheetKit';

/** A kept tour's measures as the small pills of the phone's rows. */
function MeasurePills({ tour }: { tour: CollectionTourItem }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  return (
    <>
      {measureBadges(tour, unit, t)
        .slice(0, 2)
        .map((badge) => (
          <span
            key={badge.key}
            aria-label={badge.label}
            className="box-border inline-flex w-[78px] items-center justify-center gap-1 truncate rounded-full bg-[color:var(--m-ic)] py-[5px] font-geist font-extrabold text-m-ink"
            style={fs(9)}
          >
            {createElement(badge.icon, { size: 9, strokeWidth: 2.6, className: 'flex-none text-m-muted' })}
            <span className="truncate">{badge.value}</span>
          </span>
        ))}
    </>
  );
}

/**
 * A kept tour on the phone, shaped like a saved place: the type on a tinted
 * tile (a hike's grade where it has one), its name and the trip it was kept
 * from, and its time and length where a place has its status and category.
 * A tap opens the sheet that takes it into a trip.
 */
function MCollTourRow({ tour, onOpen }: { tour: CollectionTourItem; onOpen: () => void }) {
  const { t } = useTranslation();
  const grade = tour.max_hiking_difficulty;
  return (
    <div className="mt-2 flex items-stretch gap-2" data-testid={`m-kept-tour-${tour.id}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-[11px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[11px] text-start"
      >
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color:var(--m-ic)] font-geist font-extrabold text-m-ink"
          style={fs(12)}
        >
          {grade != null ? `T${grade}` : createElement(tourDayRowIcon(tour.tour_type), { size: 17, strokeWidth: 2.2 })}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-m-ink" style={fs(12.5)}>
            {tour.name}
          </span>
          <span className="mt-[2px] flex items-center gap-[3px] truncate font-geist text-m-muted" style={fs(10)}>
            <Route size={9} strokeWidth={2.2} className="flex-none" />
            <span className="truncate">{t(`tourTypes.${tour.tour_type}`)}</span>
          </span>
        </span>
      </button>
      <div className="flex flex-none flex-col justify-center gap-[5px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[10px] py-2">
        <MeasurePills tour={tour} />
      </div>
    </div>
  );
}

/** One trip the tour can go into, chosen like a radio row; one the user may not add to stays, dimmed, with the reason. */
function TripRow({ trip, chosen, onChoose }: { trip: CollectionTourTarget; chosen: boolean; onChoose: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      disabled={!trip.can_add}
      onClick={onChoose}
      className={`mb-2 flex w-full items-center gap-[11px] rounded-[14px] border px-3 py-[10px] text-start disabled:opacity-50 ${chosen ? 'border-[color:var(--m-act)] bg-m-sheetop' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)]'}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-m-ink" style={fs(13)}>
          {trip.title}
        </span>
        {!trip.can_add && (
          <span className="block truncate font-geist text-m-muted" style={fs(11)}>
            {t('tours.collection.noPermission')}
          </span>
        )}
      </span>
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${chosen ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)]'}`}
      >
        {chosen && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

/** With its points or the line alone; a tour without a line can only bring its points. */
function PointsChips({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  const tour = takeOver.tour;
  if (!tour) return null;
  const chips: Array<{ value: PointsChoice; label: string; disabled: boolean }> = [
    { value: 'with', label: t('tours.collection.withPoints', { count: tour.waypoint_count }), disabled: false },
    { value: 'without', label: t('tours.collection.lineOnly'), disabled: !tour.has_line },
  ];
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          role="radio"
          aria-checked={takeOver.points === chip.value}
          disabled={chip.disabled}
          onClick={() => takeOver.choosePoints(chip.value)}
          className={`rounded-full px-[13px] py-[7px] font-semibold disabled:opacity-40 ${takeOver.points === chip.value ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'}`}
          style={fs(12)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

/** The sheet's body while it asks: the trips, the points and the name in the trip. */
function TakeOverForm({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  if (takeOver.detailStatus === 'loading')
    return (
      <div className="flex justify-center py-10 text-m-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  if (takeOver.detailStatus === 'offline' || takeOver.detailStatus === 'error')
    return (
      <div className="py-6 text-center font-geist text-m-muted" style={fs(12.5)}>
        {t(takeOver.detailStatus === 'offline' ? 'tours.collection.offline' : 'tours.library.previewFailed')}
        {takeOver.detailStatus === 'error' && (
          <button type="button" onClick={takeOver.retry} className="ms-2 font-semibold text-m-ink underline">
            {t('tours.planner.retry')}
          </button>
        )}
      </div>
    );
  return (
    <>
      <Eyebrow className="mb-2">{t('tours.collection.intoTrip')}</Eyebrow>
      {takeOver.trips.length === 0 ? (
        <div className="py-4 font-geist text-m-muted" style={fs(12.5)}>
          {t('tours.collection.noTrips')}
        </div>
      ) : (
        takeOver.trips.map((trip) => (
          <TripRow
            key={trip.id}
            trip={trip}
            chosen={takeOver.tripId === trip.id}
            onChoose={() => takeOver.chooseTrip(trip.id)}
          />
        ))
      )}
      <Eyebrow className="mb-2 mt-4">{t('tours.library.controlPoints')}</Eyebrow>
      <PointsChips takeOver={takeOver} />
      <Eyebrow className="mb-2 mt-4">{t('tours.collection.nameInTrip')}</Eyebrow>
      <input
        value={takeOver.name}
        onChange={(event) => takeOver.setName(event.target.value)}
        className="h-9 w-full rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] font-geist text-m-ink outline-none"
        style={fs(12.5)}
      />
    </>
  );
}

/**
 * Taking a kept tour into a trip on the phone: the same choices as the
 * desktop dialog, from the same hook, as a sheet. Removing it from the list
 * sits at its foot for the list's owner or an admin.
 */
function MCollTourSheet({
  takeOver,
  canRemove,
  onRemove,
}: {
  takeOver: CollectionTourTakeOver;
  canRemove: boolean;
  onRemove: (tour: CollectionTourItem) => void;
}) {
  const { t } = useTranslation();
  const tour = takeOver.tour;
  const title = tour?.name ?? t('tours.collection.add');
  return (
    <MSheet open={takeOver.open} onClose={takeOver.close} material="opaque" ariaLabel={title}>
      <SheetHeader title={title} onClose={takeOver.close} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        {tour && (
          <p className="mb-3 mt-0 font-geist text-m-muted" style={fs(11)}>
            {sourceText(tour, t)}
          </p>
        )}
        {takeOver.done ? (
          <p className="m-0 text-m-ink" style={fs(13)}>
            {t('tours.collection.taken', { name: takeOver.done.tourName, trip: takeOver.done.tripTitle })}
          </p>
        ) : (
          <TakeOverForm takeOver={takeOver} />
        )}
      </div>
      <SheetFooter>
        {canRemove && tour && !takeOver.done && (
          <button
            type="button"
            onClick={() => {
              takeOver.close();
              onRemove(tour);
            }}
            aria-label={t('tours.collection.remove')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-m-muted"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        )}
        <span className="flex-1" />
        {takeOver.done ? (
          <PrimaryPill onClick={takeOver.openTrip}>
            {t('tours.collection.openTrip')} <ArrowRight size={14} strokeWidth={2.2} className="rtl:rotate-180" />
          </PrimaryPill>
        ) : (
          <>
            <CancelPill onClick={takeOver.close} disabled={takeOver.taking}>
              {t('common.cancel')}
            </CancelPill>
            <PrimaryPill onClick={() => void takeOver.confirm()} disabled={!takeOver.canConfirm}>
              {takeOver.taking ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CopyPlus size={14} strokeWidth={2.2} />
              )}
              {t('tours.collection.add')}
            </PrimaryPill>
          </>
        )}
      </SheetFooter>
    </MSheet>
  );
}

/**
 * LIB-03 on the phone: the whole tours the open list keeps, as its first
 * rows, narrowed by the list's search like its places. Nothing while it keeps
 * none, on "All saved", or while the Tours addon is off.
 */
export default function MCollTours({ search }: { search: string }) {
  const { collectionId, canRemove } = useActiveCollectionTourList();
  if (collectionId === null) return null;
  return <MCollToursOf collectionId={collectionId} canRemove={canRemove} search={search} />;
}

function MCollToursOf({
  collectionId,
  canRemove,
  search,
}: {
  collectionId: number;
  canRemove: boolean;
  search: string;
}) {
  const { t } = useTranslation();
  const kept = useCollectionTours(collectionId);
  const takeOver = useCollectionTourTakeOver(collectionId);
  const shown = toursMatching(kept.tours, search);
  if (shown.length === 0 && !takeOver.open && kept.removing === null) return null;
  return (
    <div data-testid="m-collection-tours">
      {shown.map((tour) => (
        <MCollTourRow key={tour.id} tour={tour} onOpen={() => takeOver.show(tour)} />
      ))}
      <MCollTourSheet takeOver={takeOver} canRemove={canRemove} onRemove={kept.askRemove} />
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
    </div>
  );
}
