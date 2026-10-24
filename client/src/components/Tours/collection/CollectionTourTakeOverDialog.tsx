import type { CollectionTourPoint, CollectionTourTarget } from '@trek/shared';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  CopyPlus,
  Flag,
  Info,
  Loader2,
  Play,
  Spline,
  Waypoints,
} from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDate } from '../../../utils/formatters';
import { WhiteBadge } from '../../Planner/planParts';
import { EditorField, INPUT } from '../../shared/dialogParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { tourPreviewFacts } from '../library/tourPreviewFacts';
import { TourLinePreview } from '../library/tourPreviewParts';
import { RailFacts, TourNotice } from '../tourParts';
import { ChoiceList, ChoiceRow } from './choiceParts';
import type { CollectionTourTakeOver, PointsChoice } from './useCollectionTourTakeOver';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** What a point's number says in its tooltip: its role, then its name where it has one. */
function pointLabel(point: CollectionTourPoint, stop: number, t: Translate): string {
  const role =
    point.role === 'start'
      ? t('tours.planner.start')
      : point.role === 'end'
        ? t('tours.planner.end')
        : t('tours.planner.waypointLabel', { n: stop });
  return point.name ? `${role}: ${point.name}` : role;
}

/** Each point's number as the map counts them: stops only, a shaping point none. */
function stopNumbers(points: readonly CollectionTourPoint[]): Array<number | null> {
  let stop = 0;
  return points.map((point) => (point.shaping ? null : (stop += 1)));
}

/**
 * The kept waypoints in route order, numbered as the map numbers them: a
 * shaping point a small dot that does not count, the start and the end with
 * their mark at the number's corner. Dimmed while they are left out.
 */
export function KeptPointsStrip({ points, dimmed }: { points: readonly CollectionTourPoint[]; dimmed: boolean }) {
  const { t } = useTranslation();
  const stops = stopNumbers(points);
  return (
    <ol
      className={`m-0 flex list-none flex-wrap items-center gap-1.5 p-0 transition-opacity ${dimmed ? 'opacity-40' : ''}`}
      data-testid="kept-points"
    >
      {points.map((point, index) => {
        if (point.shaping)
          return (
            <li key={index} aria-label={t('tours.planner.shapingPoint')} className="grid h-6 w-3 place-items-center">
              <span className="h-2 w-2 rounded-full bg-content-faint" />
            </li>
          );
        const stop = stops[index] ?? 0;
        const label = pointLabel(point, stop, t);
        const Mark = point.role === 'start' ? Play : point.role === 'end' ? Flag : null;
        return (
          <li key={index}>
            <Tooltip label={label}>
              <span
                aria-label={label}
                className="relative grid h-6 w-6 place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content"
                style={fs(11)}
              >
                {stop}
                {Mark && (
                  <span className="absolute -end-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm">
                    <Mark size={8} strokeWidth={2.6} />
                  </span>
                )}
              </span>
            </Tooltip>
          </li>
        );
      })}
    </ol>
  );
}

/** A trip's dates as badges, start then end, each only where the trip has it. */
function TripDates({ trip }: { trip: CollectionTourTarget }) {
  const { language } = useTranslation();
  const start = formatDate(trip.start_date, language);
  const end = trip.end_date !== trip.start_date ? formatDate(trip.end_date, language) : null;
  if (!start && !end) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {start && (
        <WhiteBadge icon={<CalendarDays size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {start}
        </WhiteBadge>
      )}
      {start && end && (
        <ArrowRight size={10} strokeWidth={2.2} className="flex-none text-content-faint rtl:rotate-180" />
      )}
      {end && <WhiteBadge>{end}</WhiteBadge>}
    </span>
  );
}

/** The trips the kept tour can go into; one the user may not add to stays in the list, dimmed, and says why. */
function TripChoices({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  if (takeOver.detailStatus !== 'ready') return null;
  if (takeOver.trips.length === 0)
    return (
      <p className="m-0 py-3 text-center text-content-muted" style={fs(12.5, 'body')}>
        {t('tours.collection.noTrips')}
      </p>
    );
  return (
    <ChoiceList label={t('tours.collection.intoTrip')}>
      {takeOver.trips.map((trip) => (
        <ChoiceRow
          key={trip.id}
          selected={takeOver.tripId === trip.id}
          disabled={!trip.can_add}
          disabledHint={t('tours.collection.noPermission')}
          onChoose={() => takeOver.chooseTrip(trip.id)}
          testId={`kept-tour-trip-${trip.id}`}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-semibold text-content" style={fs(13, 'body')}>
              {trip.title}
            </span>
            <TripDates trip={trip} />
          </span>
        </ChoiceRow>
      ))}
    </ChoiceList>
  );
}

/**
 * One answer to whether the waypoints come along: an icon, a title, a short
 * tooltip, raised once chosen. A disabled button fires no hover or focus, so
 * one that cannot be chosen sits in a span that carries its tooltip.
 */
function PointsTile({
  value,
  selected,
  disabled,
  icon,
  title,
  hint,
  onChoose,
}: {
  value: PointsChoice;
  selected: boolean;
  disabled: boolean;
  icon: ReactNode;
  title: string;
  hint: string;
  onChoose: (value: PointsChoice) => void;
}) {
  const tile = (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onChoose(value)}
      data-testid={`kept-tour-points-${value}`}
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50 ${selected ? 'border-transparent bg-surface-card shadow-sm ring-2 ring-accent' : 'border-edge-faint bg-surface-secondary enabled:hover:bg-surface-card'}`}
    >
      <span
        className={`grid h-8 w-8 flex-none place-items-center rounded-full ${selected ? 'bg-accent text-accent-text' : 'bg-edge text-content-secondary'}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 font-semibold text-content" style={fs(12.5, 'body')}>
        {title}
      </span>
    </button>
  );
  return <Tooltip label={hint}>{disabled ? <span className="block">{tile}</span> : tile}</Tooltip>;
}

/**
 * The explicit choice about the waypoints; leaving them out is only there for
 * a tour with a line, and a tour without one says so under the choice rather
 * than only in a tooltip.
 */
function PointsChoices({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  const { tour } = takeOver;
  if (!tour) return null;
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label={t('tours.library.controlPoints')} className="grid grid-cols-2 gap-2">
        <PointsTile
          value="with"
          selected={takeOver.points === 'with'}
          disabled={tour.waypoint_count === 0 && tour.has_line}
          icon={<Waypoints size={15} strokeWidth={2} />}
          title={t('tours.collection.withPoints', { count: tour.waypoint_count })}
          hint={t('tours.collection.withPointsHint')}
          onChoose={takeOver.choosePoints}
        />
        <PointsTile
          value="without"
          selected={takeOver.points === 'without'}
          disabled={!tour.has_line}
          icon={<Spline size={15} strokeWidth={2} />}
          title={t('tours.collection.lineOnly')}
          hint={t('tours.collection.lineOnlyHint')}
          onChoose={takeOver.choosePoints}
        />
      </div>
      {!tour.has_line && (
        <TourNotice icon={<Info size={13} strokeWidth={2} />}>{t('tours.collection.needsPoints')}</TourNotice>
      )}
    </div>
  );
}

/** The kept tour as it would come over: on a map, its facts and its waypoints. */
function KeptTourPreview({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const { tour, detail } = takeOver;
  if (!tour) return null;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="kept-tour-preview">
      <TourLinePreview
        line={detail?.line}
        focusKey={String(tour.id)}
        status={takeOver.detailStatus}
        failedText={t('tours.library.previewFailed')}
        emptyText={t('tours.collection.noLine')}
      />
      <RailFacts
        facts={tourPreviewFacts(tour, tour.waypoint_count, unit, t, {
          label: t('tours.collection.savedFrom'),
          value: tour.source.tripTitle,
        })}
      />
      {detail && detail.points.length > 0 && (
        <KeptPointsStrip points={detail.points} dimmed={takeOver.points === 'without'} />
      )}
    </div>
  );
}

/** The last word once the tour is in the trip: where it is now. */
function TakenNotice({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  if (!takeOver.done) return null;
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" role="status">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success ring-4 ring-surface-card">
        <CircleCheck size={26} strokeWidth={2} />
      </span>
      <p className="m-0 max-w-[420px] font-semibold text-content" style={fs(14, 'subtitle')}>
        {t('tours.collection.taken', { name: takeOver.done.tourName, trip: takeOver.done.tripTitle })}
      </p>
    </div>
  );
}

function TakeOverFooter({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  if (takeOver.done)
    return (
      <DialogFooter>
        <FooterSpacer />
        <DialogButton onClick={takeOver.close}>{t('common.close')}</DialogButton>
        <DialogButton
          variant="primary"
          onClick={takeOver.openTrip}
          icon={<ArrowRight size={14} strokeWidth={2} className="rtl:rotate-180" />}
        >
          {t('tours.collection.openTrip')}
        </DialogButton>
      </DialogFooter>
    );
  return (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={takeOver.close} disabled={takeOver.taking}>
        {t('common.cancel')}
      </DialogButton>
      <DialogButton
        variant="primary"
        data-testid="kept-tour-confirm"
        disabled={!takeOver.canConfirm}
        onClick={() => void takeOver.confirm()}
        icon={
          takeOver.taking ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : (
            <CopyPlus size={14} strokeWidth={2} />
          )
        }
      >
        {t('tours.collection.add')}
      </DialogButton>
    </DialogFooter>
  );
}

/** Why the trips cannot be listed: offline, or failed with a retry. */
function DetailProblem({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  if (takeOver.detailStatus === 'offline') return <TourNotice>{t('tours.collection.offline')}</TourNotice>;
  if (takeOver.detailStatus !== 'error') return null;
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      <span className="flex flex-wrap items-center gap-2">
        {t('tours.library.previewFailed')}
        <button type="button" onClick={takeOver.retry} className="font-semibold underline underline-offset-2">
          {t('tours.planner.retry')}
        </button>
      </span>
    </TourNotice>
  );
}

/**
 * LIB-03: the dialog that takes a tour kept in a collection into a trip. The
 * kept tour on the left; on the right the trip, the choice about its
 * waypoints and the name. The tour is made only by the button in its foot.
 */
export function CollectionTourTakeOverDialog({ takeOver }: { takeOver: CollectionTourTakeOver }) {
  const { t } = useTranslation();
  const labelId = useId();
  const nameId = useId();
  const { tour } = takeOver;
  if (!tour) return null;
  return (
    <DialogShell
      onClose={takeOver.close}
      labelledBy={labelId}
      width={takeOver.done ? 'narrow' : 'wide'}
      blocked={takeOver.taking}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <CopyPlus size={20} strokeWidth={1.9} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={takeOver.close}
          eyebrow={t('tours.collection.takeEyebrow')}
          title={tour.name}
          sub={takeOver.done ? undefined : t('tours.collection.takeSub')}
          subWraps
        />
      }
      footer={<TakeOverFooter takeOver={takeOver} />}
    >
      {takeOver.done ? (
        <TakenNotice takeOver={takeOver} />
      ) : (
        <div className="grid min-h-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <KeptTourPreview takeOver={takeOver} />
          <div className="flex min-w-0 flex-col gap-4">
            <DialogSection label={t('tours.collection.intoTrip')}>
              <DetailProblem takeOver={takeOver} />
              <TripChoices takeOver={takeOver} />
            </DialogSection>
            <DialogSection label={t('tours.library.controlPoints')}>
              <PointsChoices takeOver={takeOver} />
            </DialogSection>
            <EditorField label={t('tours.collection.nameInTrip')} htmlFor={nameId}>
              <input
                id={nameId}
                className={INPUT}
                value={takeOver.name}
                maxLength={255}
                onChange={(event) => takeOver.setName(event.target.value)}
              />
            </EditorField>
          </div>
        </div>
      )}
    </DialogShell>
  );
}
