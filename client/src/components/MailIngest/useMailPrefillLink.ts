import { isTransportReservationType, mailIngestPrefillResponseSchema, type BookingImportPreviewItem } from '@trek/shared';
import { useEffect, useRef } from 'react';
import type { SetURLSearchParams } from 'react-router';
import { mailIngestApi } from '../../api/mailIngest';

/**
 * "Fill in yourself" from the mail inbox lands in the trip as ?mailPrefill=<id>:
 * once the trip has loaded, the booking form opens with what the mail held, the
 * same per-item review a file import uses, and the parameter leaves the address
 * so a reload does not open it again. Desktop and phone share the planner hook
 * this runs in.
 */
export function useMailPrefillLink({
  searchParams,
  setSearchParams,
  loaded,
  startImportReview,
}: {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  loaded: boolean;
  startImportReview: (items: BookingImportPreviewItem[], files?: File[], kind?: 'transports' | 'bookings') => void;
}): void {
  const requested = searchParams.get('mailPrefill');
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!requested || !loaded || handled.current === requested) return;
    handled.current = requested;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('mailPrefill');
        return next;
      },
      { replace: true },
    );
    const id = Number(requested);
    if (!Number.isInteger(id) || id <= 0) return;
    mailIngestApi
      .prefill(id)
      .then((raw) => {
        const { item } = mailIngestPrefillResponseSchema.parse(raw);
        startImportReview([item], [], isTransportReservationType(item.type) ? 'transports' : 'bookings');
      })
      .catch(() => {
        // An entry decided meanwhile has nothing to prefill; the trip simply stays open.
      });
  }, [requested, loaded, setSearchParams, startImportReview]);
}
