import { vi } from 'vitest';

import type { BookingSaveSteps } from '../../src/components/Planner/bookingFormModel';
import type { Reservation } from '../../src/types';

/**
 * A booking save that does what the planner does (useBookingEdits): it stores the
 * booking as `record`, runs the editor's follow-up (travellers, files) and answers
 * nothing when that fails, keeping the failure for the test to read. The desktop
 * dialogs take it as `onSave`, the phone sheets as `handleSaveReservation` or
 * `handleSaveTransport`.
 */
export function plannerSave(record: { id: number }) {
  const failures: Error[] = [];
  const stored = record as Reservation;
  const save = vi.fn(
    async (
      _data: Record<string, unknown> & { title: string },
      steps?: BookingSaveSteps
    ): Promise<Reservation | undefined> => {
      try {
        await steps?.afterSave?.(stored);
        return stored;
      } catch (err) {
        failures.push(err as Error);
        return undefined;
      }
    }
  );
  return { save, failures };
}
