import { importableTourTypeSchema, type TourLibraryItem, type TourTypeKey } from '@trek/shared';
import { AlertTriangle, CopyPlus, Library, Loader2, Search, WifiOff } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { EditorField, INPUT, PillSelect } from '../../shared/dialogParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { RailFacts, TourNotice } from '../tourParts';
import { tourPreviewFacts } from './tourPreviewFacts';
import { TourLinePreview, TourMeasurePills } from './tourPreviewParts';
import { type TourLibrary } from './useTourLibrary';

const ALL = 'all';

/** One tour of the list: its name, the trip it is in, its measures. */
function LibraryRow({ tour, selected, onChoose }: { tour: TourLibraryItem; selected: boolean; onChoose: () => void }) {
  const { t } = useTranslation();
  return (
    <li>
      <button
        type="button"
        onClick={onChoose}
        aria-pressed={selected}
        data-testid={`tour-library-row-${tour.place_id}`}
        className={`flex w-full min-w-0 flex-col gap-1 rounded-[10px] px-2.5 py-2 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'}`}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
            {tour.name}
          </span>
          <span className="flex-none text-content-faint" style={fs(11, 'body')}>
            {t(`tourTypes.${tour.tour_type}`)}
          </span>
        </span>
        <span className="min-w-0 truncate text-content-muted" style={fs(11, 'body')}>
          {tour.trip.title}
        </span>
        <span className="flex flex-wrap gap-1.5">
          <TourMeasurePills tour={tour} testPrefix="tour-library" />
        </span>
      </button>
    </li>
  );
}

/** A line of the list's state: loading, offline, failed with a retry, empty, or cut short. */
function ListState({ library }: { library: TourLibrary }) {
  const { t } = useTranslation();
  const { listStatus, list } = library;
  if (listStatus === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.library.offline')}</TourNotice>;
  if (listStatus === 'error')
    return (
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        <span className="flex flex-wrap items-center gap-2">
          {t('tours.library.loadFailed')}
          <button type="button" onClick={library.retry} className="font-semibold underline underline-offset-2">
            {t('tours.planner.retry')}
          </button>
        </span>
      </TourNotice>
    );
  if (listStatus === 'loading' && !list)
    return (
      <p role="status" className="m-0 flex items-center gap-2 py-4 text-content-faint" style={fs(12, 'body')}>
        <Loader2 size={13} strokeWidth={2.2} className="animate-spin" />
        {t('common.loading')}
      </p>
    );
  if (list && list.tours.length === 0 && listStatus !== 'loading')
    return (
      <p className="m-0 py-4 text-center text-content-muted" style={fs(12.5, 'body')}>
        {list.trips.length === 0 ? t('tours.library.noTrips') : t('tours.library.empty')}
      </p>
    );
  if (list?.truncated) return <TourNotice>{t('tours.library.truncated')}</TourNotice>;
  return null;
}

/** The search box and the two filters over the list. */
function ListFilters({ library }: { library: TourLibrary }) {
  const { t } = useTranslation();
  const searchId = useId();
  const trips = library.list?.trips ?? [];
  const tripOptions = [
    { value: ALL, label: t('tours.library.allTrips') },
    ...trips.map((trip) => ({ value: String(trip.id), label: trip.title, hint: String(trip.tour_count) })),
  ];
  const typeOptions = [
    { value: ALL, label: t('tours.library.allTypes') },
    ...importableTourTypeSchema.options.map((type) => ({ value: type, label: t(`tourTypes.${type}`) })),
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-[10px] border border-edge bg-surface-input px-2.5 py-2">
        {library.listStatus === 'loading' ? (
          <Loader2
            size={13}
            strokeWidth={2.2}
            className="flex-none animate-spin text-content-faint"
            data-testid="tour-library-searching"
          />
        ) : (
          <Search size={13} strokeWidth={2.2} className="flex-none text-content-faint" />
        )}
        <label htmlFor={searchId} className="sr-only">
          {t('tours.library.search')}
        </label>
        <input
          id={searchId}
          autoFocus
          value={library.filters.query}
          onChange={(event) => library.filter({ query: event.target.value })}
          placeholder={t('tours.library.search')}
          className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
          style={fs(12.5, 'body')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PillSelect
          quiet
          label={t('tours.library.trip')}
          value={library.filters.tripFilter === null ? ALL : String(library.filters.tripFilter)}
          options={tripOptions}
          onChange={(value) => library.filter({ tripFilter: value === ALL ? null : Number(value) })}
        />
        <PillSelect
          quiet
          label={t('tours.filter.type')}
          value={library.filters.typeFilter ?? ALL}
          options={typeOptions}
          onChange={(value) => library.filter({ typeFilter: value === ALL ? null : (value as TourTypeKey) })}
        />
      </div>
    </div>
  );
}

/** The chosen tour: on a map, its facts, and the name the copy gets. */
function Preview({ library }: { library: TourLibrary }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const nameId = useId();
  const { selected } = library;
  if (!selected)
    return (
      <div className="grid h-full min-h-[240px] place-items-center rounded-[14px] border border-dashed border-edge px-6 text-center">
        <p className="m-0 max-w-[260px] text-content-muted" style={fs(12.5, 'body')}>
          {t('tours.library.chooseHint')}
        </p>
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="tour-library-preview">
      <TourLinePreview
        line={library.preview?.line}
        focusKey={String(selected.place_id)}
        status={library.previewStatus}
        failedText={t('tours.library.previewFailed')}
      />
      <RailFacts
        facts={tourPreviewFacts(selected, library.preview?.waypoint_count ?? 0, unit, t, {
          label: t('tours.library.fromTrip'),
          value: selected.trip.title,
        })}
      />
      <EditorField label={t('tours.library.nameHere')} htmlFor={nameId} hint={t('tours.library.independent')}>
        <input
          id={nameId}
          className={INPUT}
          value={library.name}
          maxLength={255}
          onChange={(event) => library.setName(event.target.value)}
        />
      </EditorField>
    </div>
  );
}

/**
 * LIB-02: the dialog to take a tour of another trip over into this one. The
 * list on the left, the chosen tour on the right; the copy is made only by the
 * button in its foot.
 */
/** LIB-02: the dialog that takes a tour of another trip into this one, opened from "Add tour". */
export function TourLibraryDialog({ library }: { library: TourLibrary }) {
  const { t } = useTranslation();
  const labelId = useId();
  if (!library.open) return null;
  return (
    <DialogShell
      onClose={library.close}
      labelledBy={labelId}
      width="wide"
      blocked={library.taking}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Library size={20} strokeWidth={2} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={library.close}
          eyebrow={t('tours.library.eyebrow')}
          title={t('tours.library.title')}
          sub={t('tours.library.sub')}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={library.close} disabled={library.taking}>
            {t('common.cancel')}
          </DialogButton>
          <DialogButton
            variant="primary"
            data-testid="tour-library-confirm"
            icon={
              library.taking ? (
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              ) : (
                <CopyPlus size={14} strokeWidth={2} />
              )
            }
            disabled={!library.canConfirm}
            onClick={() => void library.confirm()}
          >
            {t('tours.library.confirm')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className="grid min-h-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section aria-label={t('tours.library.title')} className="flex min-w-0 flex-col gap-3">
          <ListFilters library={library} />
          <ListState library={library} />
          {library.list && library.list.tours.length > 0 && (
            <ul
              className={`m-0 flex max-h-[420px] list-none flex-col gap-0.5 overflow-y-auto py-0 pe-2 ps-0 transition-opacity [scrollbar-gutter:stable] ${library.listStatus === 'loading' ? 'opacity-60' : ''}`}
              data-testid="tour-library-list"
              aria-busy={library.listStatus === 'loading'}
            >
              {library.list.tours.map((tour) => (
                <LibraryRow
                  key={tour.place_id}
                  tour={tour}
                  selected={library.selected?.place_id === tour.place_id}
                  onChoose={() => library.choose(tour)}
                />
              ))}
            </ul>
          )}
        </section>
        <Preview library={library} />
      </div>
    </DialogShell>
  );
}
