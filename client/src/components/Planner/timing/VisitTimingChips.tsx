import { visitStay, visitTimes } from '@trek/shared';
import { formatDurationShort, parseClock } from '@trek/shared/roadtrip';
import { Clock, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTripStore } from '../../../store/tripStore';
import type { Assignment, Day } from '../../../types';
import { formatClockTime } from '../../../utils/formatters';
import RoadtripStayModal, { type StayDraft } from '../../Roadtrip/RoadtripStayModal';
import { fs } from '../../shared/DialogShell';
import type { TimingPlan } from './ItineraryTiming';

export function VisitTimingChips({
  assignment,
  day,
  tripId,
  plan,
  editable,
  onStay,
}: {
  assignment: Assignment;
  day: Day;
  tripId: number | string;
  plan: TimingPlan;
  editable: boolean;
  onStay?: (draft: StayDraft) => void;
}) {
  const { t } = useTranslation();
  const is12h = useSettingsStore((s) => s.settings.time_format) === '12h';
  const [draft, setDraft] = useState<StayDraft | null>(null);
  const index = plan.nodes.findIndex((node) => node.assignment?.id === assignment.id);
  const entry = plan.schedule.entries[index];
  if (!entry) return null;
  const fixed = visitTimes(assignment);
  const clock = (value: string | null, offset = 0) =>
    value
      ? `${formatClockTime(value, is12h)}${offset ? ` ${t('timing.dayOffset', { count: offset })}` : ''}`
      : t('timing.unknown');
  const arrival = clock(entry.arrival, entry.dayOffset);
  const departure = clock(entry.departure, entry.departureDayOffset ?? entry.dayOffset);
  const startMinute = parseClock(entry.arrival);
  const endMinute = parseClock(entry.departure);
  const stay = fixed.end
    ? startMinute === null || endMinute === null
      ? null
      : endMinute - startMinute + ((entry.departureDayOffset ?? entry.dayOffset) - entry.dayOffset) * 1440
    : visitStay(assignment);
  const stayText = `${t('roadtrip.stop.stayShort')} ${stay === null ? t('timing.unknown') : formatDurationShort(stay * 60)}`;
  const editStay = () => {
    const next: StayDraft = {
      assignmentId: assignment.id,
      dayId: day.id,
      placeId: assignment.place_id,
      name: assignment.place.name,
      minutes: visitStay(assignment),
      arrival: entry.arrival,
      departure: entry.departure,
    };
    if (onStay) onStay(next);
    else setDraft(next);
  };
  return (
    <div
      className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
      data-testid={`visit-timing-${assignment.id}`}
    >
      <span
        className="inline-flex min-w-0 items-center gap-1 font-geist tabular-nums text-content-secondary"
        style={fs(11.5)}
        aria-label={`${t('timing.arrival')} ${arrival}, ${t('timing.departure')} ${departure}`}
      >
        <Clock size={12} aria-hidden="true" className="shrink-0" />
        {entry.arrival === null && entry.departure === null ? t('timing.unknown') : `${arrival}–${departure}`}
      </span>
      {editable && !fixed.end ? (
        <button
          type="button"
          onClick={editStay}
          disabled={assignment.id < 0}
          aria-label={`${t('roadtrip.stop.stay')} · ${formatDurationShort((stay ?? 0) * 60)}`}
          className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-edge px-2 font-geist font-medium tabular-nums text-content-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 [@media(pointer:coarse)]:min-h-11"
          style={fs(10.5)}
        >
          <Pencil size={11} aria-hidden="true" className="shrink-0" />
          <span>{stayText}</span>
        </button>
      ) : (
        <span className="text-content-muted" style={fs(10.5)}>
          {stayText}
        </span>
      )}
      {(fixed.start || fixed.end) && (
        <div className="flex w-full flex-wrap gap-x-3 gap-y-1 text-content-muted" style={fs(10.5)}>
          {fixed.start && (
            <span>
              {t('timing.fixedStart')} {clock(fixed.start)}
            </span>
          )}
          {fixed.end && (
            <span>
              {t('timing.fixedEnd')} {clock(fixed.end)}
            </span>
          )}
        </div>
      )}
      {plan.schedule.warnings
        .filter((w) => w.index === index && w.code !== 'overnight')
        .slice(0, 1)
        .map((w) => (
          <span key={w.code} role="status" className="w-full text-warning" style={fs(10.5)}>
            {t(`roadtrip.warn.${w.code}`, { count: w.minutes ?? 0, minutes: w.minutes ?? 0 })}
          </span>
        ))}
      <RoadtripStayModal
        stop={draft}
        onClose={() => setDraft(null)}
        onSave={async (_placeId, minutes) =>
          useTripStore.getState().setAssignmentStay(tripId, day.id, assignment.id, minutes)
        }
      />
    </div>
  );
}
