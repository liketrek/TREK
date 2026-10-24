import { ChevronRight, Luggage } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useTranslation } from '../../i18n';
import EmptyState from '../shared/EmptyState';
import { Spinner } from '../shared/Spinner';
import { type PickerTrip, useAssistantTripPicker } from './useAssistantTripPicker';

/**
 * The user's trips to go on with in one trip's own chat, from the home chat's
 * head: that chat, its history and its changes belong to the trip. The
 * running and the next trip lead. The list opens before the trips are there,
 * so the focus goes onto the first one once they come.
 */
export default function AssistantTripPicker({ onPick }: { onPick: (trip: PickerTrip) => void }) {
  const { t } = useTranslation();
  const trips = useAssistantTripPicker();
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, [trips]);

  if (trips === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-5 w-5 border-2 border-edge border-t-[color:var(--text-primary)]" />
      </div>
    );
  }
  if (trips.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <EmptyState scene="idle" size={72} compact surface="var(--bg-elevated)" title={t('assistant.picker.empty')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
      <ul className="trek-stagger m-0 flex list-none flex-col gap-1 p-0">
        {trips.map((trip, i) => (
          <li key={trip.id}>
            <button
              ref={i === 0 ? first : undefined}
              type="button"
              onClick={() => onPick(trip)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors hover:bg-surface-hover"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-content-muted">
                <Luggage size={15} aria-hidden="true" />
              </span>
              <bdi className="min-w-0 flex-1 truncate text-body text-content">{trip.title}</bdi>
              {trip.badge && (
                <span className="flex-shrink-0 rounded-full bg-accent-subtle px-2 py-px text-caption text-accent-on">
                  {t(trip.badge === 'now' ? 'assistant.picker.now' : 'assistant.picker.next')}
                </span>
              )}
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="flex-shrink-0 text-content-faint rtl:-scale-x-100"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
