import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';
import { CalendarRange, ChevronLeft, ChevronRight, Clock, MapPin, NotebookPen, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { SoftPill, WhiteBadge } from '../Planner/planParts';
import { fs } from '../shared/DialogShell';
import type { JourneyMapMark } from './journeyMapMarks';

interface Props {
  /** What was picked on the map: one mark, or several that lie on one spot. */
  marks: JourneyMapMark[];
  onClose: () => void;
  /** Leads to an entry; absent where the reader cannot open one. */
  onOpenEntry?: (entryId: string) => void;
  /** The title of an entry the reader can see, for the stay that belongs to it. */
  entryTitleOf?: (entryId: number) => string | null;
}

function dayLabel(date: string, locale: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function timeLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function OpenEntry({ entryId, onOpenEntry }: { entryId: number; onOpenEntry?: (entryId: string) => void }) {
  const { t } = useTranslation();
  if (!onOpenEntry) return null;
  return (
    <button
      type="button"
      onClick={() => onOpenEntry(String(entryId))}
      className="inline-flex items-center gap-1 self-start rounded-lg bg-accent px-2.5 py-1.5 font-semibold text-accent-text hover:opacity-90"
      style={fs(11.5, 'body')}
    >
      <NotebookPen size={12} strokeWidth={2.2} aria-hidden />
      {t('journey.map.pick.openEntry')}
    </button>
  );
}

function PlaceDetail({ place, onOpenEntry }: { place: JourneyMapPlace; onOpenEntry?: (entryId: string) => void }) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <SoftPill icon={<CalendarRange size={11} strokeWidth={2} />}>{t('journey.map.pick.planned')}</SoftPill>
        <WhiteBadge>{place.trip_title}</WhiteBadge>
        {place.days.map((day) => (
          <WhiteBadge key={day}>{dayLabel(day, locale)}</WhiteBadge>
        ))}
        {place.time && <WhiteBadge icon={<Clock size={10} strokeWidth={2} />}>{place.time}</WhiteBadge>}
      </div>
      {place.entry_id !== null ? (
        <OpenEntry entryId={place.entry_id} onOpenEntry={onOpenEntry} />
      ) : (
        <p className="text-content-muted" style={fs(11.5, 'body')}>
          {t('journey.map.pick.notWritten')}
        </p>
      )}
    </div>
  );
}

function StayDetail({
  stay,
  onOpenEntry,
  entryTitleOf,
}: { stay: JourneyMapStay } & Pick<Props, 'onOpenEntry' | 'entryTitleOf'>) {
  const { t, locale } = useTranslation();
  const entryTitle = entryTitleOf?.(stay.entry_id);
  const from = timeLabel(stay.started_at, locale);
  const to = timeLabel(stay.ended_at, locale);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <SoftPill tone="info" icon={<MapPin size={11} strokeWidth={2} />}>
          {t('journey.map.pick.stay')}
        </SoftPill>
        {from && (
          <WhiteBadge icon={<Clock size={10} strokeWidth={2} />}>
            {to ? t('journey.map.pick.timeRange', { from, to }) : from}
          </WhiteBadge>
        )}
      </div>
      {entryTitle && (
        <p className="truncate text-content-secondary" style={fs(11.5, 'body')}>
          {t('journey.map.pick.partOf', { title: entryTitle })}
        </p>
      )}
      <OpenEntry entryId={stay.entry_id} onOpenEntry={onOpenEntry} />
    </div>
  );
}

function markName(mark: JourneyMapMark): string {
  return mark.kind === 'plan' ? mark.place.name : mark.stay.name;
}

/**
 * What a mark picked on the journey map is (JRN-04), docked over the map's
 * corner: a planned place with its trip, its days and the entry written about
 * it, or a stay with its times and the report it belongs to. Several marks on
 * one spot come as a list first, each with what kind it is, so overlapping
 * hits stay reachable one by one.
 */
export default function JourneyMapPickCard({ marks, onClose, onOpenEntry, entryTitleOf }: Props) {
  const { t, locale } = useTranslation();
  const [picked, setPicked] = useState<JourneyMapMark | null>(marks.length === 1 ? marks[0] : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = picked ? markName(picked) : t('journey.map.pick.here');
  return (
    <div
      role="dialog"
      aria-label={title}
      data-testid="journey-map-pick"
      className="pointer-events-auto flex w-[280px] max-w-[calc(100%-24px)] flex-col gap-2 rounded-xl border border-edge bg-surface-card p-3 shadow-lg"
    >
      <div className="flex items-start gap-1.5">
        {picked && marks.length > 1 && (
          <button
            type="button"
            onClick={() => setPicked(null)}
            aria-label={t('journey.map.pick.back')}
            className="-ms-1 grid h-6 w-6 flex-none place-items-center rounded-md text-content-muted hover:bg-surface-hover"
          >
            <ChevronLeft size={14} strokeWidth={2.2} className="rtl:rotate-180" />
          </button>
        )}
        <span className="min-w-0 flex-1 font-semibold text-content" style={fs(13, 'body')}>
          {title}
        </span>
        {!picked && <WhiteBadge>{marks.length}</WhiteBadge>}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="grid h-6 w-6 flex-none place-items-center rounded-md text-content-muted hover:bg-surface-hover"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>
      {picked?.kind === 'plan' && <PlaceDetail place={picked.place} onOpenEntry={onOpenEntry} />}
      {picked?.kind === 'stay' && (
        <StayDetail stay={picked.stay} onOpenEntry={onOpenEntry} entryTitleOf={entryTitleOf} />
      )}
      {!picked && (
        <ul className="-mx-1 flex max-h-[220px] flex-col overflow-y-auto">
          {marks.map((mark) => (
            <li key={mark.key}>
              <button
                type="button"
                onClick={() => setPicked(mark)}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-start hover:bg-surface-hover"
              >
                <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: mark.color }} />
                <span className="min-w-0 flex-1 truncate text-content" style={fs(12, 'body')}>
                  {markName(mark)}
                </span>
                <SoftPill tone={mark.kind === 'plan' ? 'neutral' : 'info'}>
                  {mark.kind === 'plan' ? t('journey.map.pick.planned') : t('journey.map.pick.stay')}
                </SoftPill>
                {mark.kind === 'plan' && mark.place.days[0] && (
                  <WhiteBadge>{dayLabel(mark.place.days[0], locale)}</WhiteBadge>
                )}
                <ChevronRight size={13} strokeWidth={2} className="flex-none text-content-faint rtl:rotate-180" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
