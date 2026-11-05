// FE-PLANNER-BOOKINGFOLLOWUP-001 to -006: what a booking save does after the
// booking itself, shared by the desktop dialogs and the phone sheets.
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTripStore } from '../../store/tripStore';
import type { Reservation } from '../../types';
import { useBookingFollowUp } from './useBookingFollowUp';

const BOOKING = { id: 99 } as Reservation;
const t = (key: string) => key;

interface Props {
  session: unknown;
  travelerIds?: Set<number>;
  upload?: (fd: FormData) => Promise<unknown>;
}

let setTravelers: ReturnType<typeof vi.fn>;

function setup(initial: Props, files: File[] = []) {
  return renderHook(
    ({ session, travelerIds = new Set([7]), upload }: Props) => {
      const [pendingFiles, setPendingFiles] = useState<File[]>(files);
      const followUp = useBookingFollowUp({
        session,
        tripId: 5,
        original: { travelers: [{ user_id: 7 }] } as Reservation,
        travelerIds,
        pendingFiles,
        setPendingFiles,
        upload,
        t,
      });
      return { followUp, pendingFiles };
    },
    { initialProps: initial }
  );
}

async function save(result: { current: { followUp: ReturnType<typeof useBookingFollowUp> } }) {
  let outcome: unknown = null;
  await act(async () => {
    await result.current.followUp
      .steps('Hotel')
      .afterSave(BOOKING)
      .catch((err: unknown) => {
        outcome = err;
      });
  });
  return outcome;
}

describe('useBookingFollowUp', () => {
  beforeEach(() => {
    setTravelers = vi.fn(async () => undefined);
    useTripStore.setState({ setReservationTravelers: setTravelers as never });
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-001: a save that goes through leaves nothing to retry', async () => {
    const upload = vi.fn(async () => undefined);
    const { result } = setup({ session: 'new', upload }, [new File(['a'], 'a.pdf')]);
    expect(await save(result)).toBeNull();
    expect(result.current.followUp.holdsSaved()).toBe(false);
    expect(result.current.followUp.steps('Hotel').saved).toBeUndefined();
    expect(result.current.pendingFiles).toEqual([]);
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-002: a failed upload keeps the booking and exactly the files still to send', async () => {
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.pdf');
    const upload = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('413'));
    const { result } = setup({ session: 'new', upload }, [a, b]);
    const err = await save(result);
    expect((err as Error).message).toBe('reservations.toast.filesNotUploaded');
    expect(result.current.followUp.holdsSaved()).toBe(true);
    expect(result.current.followUp.steps('Hotel').saved).toBe(BOOKING);
    expect(result.current.pendingFiles).toEqual([b]);
    const fd = upload.mock.calls[0][0] as FormData;
    expect(fd.get('reservation_id')).toBe('99');
    expect(fd.get('description')).toBe('Hotel');
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-003: the retry after a failure clears the stored booking once it goes through', async () => {
    const upload = vi.fn().mockRejectedValueOnce(new Error('413')).mockResolvedValue(undefined);
    const { result } = setup({ session: 'new', upload }, [new File(['a'], 'a.pdf')]);
    await save(result);
    expect(result.current.followUp.holdsSaved()).toBe(true);
    expect(await save(result)).toBeNull();
    expect(result.current.followUp.holdsSaved()).toBe(false);
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-004: another session starts without the booking a failed try stored', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('413'));
    const { result, rerender } = setup({ session: 'new', upload }, [new File(['a'], 'a.pdf')]);
    await save(result);
    expect(result.current.followUp.holdsSaved()).toBe(true);
    rerender({ session: { title: 'Next draft' }, upload });
    expect(result.current.followUp.holdsSaved()).toBe(false);
    expect(result.current.followUp.steps('Hotel').saved).toBeUndefined();
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-005: the travellers are written only when the pick differs from the booking', async () => {
    const { result, rerender } = setup({ session: 'new' });
    await save(result);
    expect(setTravelers).not.toHaveBeenCalled();
    rerender({ session: 'new', travelerIds: new Set([7, 8]) });
    await save(result);
    expect(setTravelers).toHaveBeenCalledWith(5, 99, [7, 8]);
  });

  it('FE-PLANNER-BOOKINGFOLLOWUP-006: a failed traveller write keeps the booking for the retry', async () => {
    setTravelers.mockRejectedValueOnce(new Error('offline'));
    const { result } = setup({ session: 'new', travelerIds: new Set([8]) });
    expect(await save(result)).toBeInstanceOf(Error);
    expect(result.current.followUp.holdsSaved()).toBe(true);
  });
});
