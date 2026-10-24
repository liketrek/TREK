// FE-PLANNER-BOOKINGFORM-001 to -010: the travellers, picked files, attached files
// and expense requests of the transport and booking forms, desktop and phone alike.
import { typeToCostCategory } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';

import { buildBudgetItem, buildDay, buildReservation, buildTripFile } from '../../../tests/helpers/factories';
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode';
import type { Reservation } from '../../types';
import {
  attachedBookingFiles,
  expenseRequestAfterSave,
  filesNeedConnection,
  pendingImportExpense,
  toggledTraveler,
  travelerIdsOf,
  travelersChanged,
  uploadBookingFiles,
} from './bookingFormModel';

const withTravelers = (...ids: number[]) =>
  buildReservation({ travelers: ids.map((user_id) => ({ user_id, username: `u${user_id}` })) } as Partial<Reservation>);

describe('bookingFormModel', () => {
  it('FE-PLANNER-BOOKINGFORM-001: a booking opens with its travellers, a new one with nobody', () => {
    expect([...travelerIdsOf(withTravelers(3, 1))]).toEqual([3, 1]);
    expect(travelerIdsOf(null).size).toBe(0);
    expect(travelerIdsOf(buildReservation()).size).toBe(0);
  });

  it('FE-PLANNER-BOOKINGFORM-002: toggling adds a missing traveller and drops a picked one, on a copy', () => {
    const prev = new Set([1]);
    const added = toggledTraveler(prev, 2);
    expect([...added]).toEqual([1, 2]);
    expect([...toggledTraveler(added, 1)]).toEqual([2]);
    expect([...prev]).toEqual([1]);
  });

  it('FE-PLANNER-BOOKINGFORM-003: only a real change counts, whatever the order', () => {
    expect(travelersChanged(withTravelers(1, 2), new Set([2, 1]))).toEqual({ changed: false, nextIds: [2, 1] });
    expect(travelersChanged(withTravelers(1, 2), new Set([1]))).toEqual({ changed: true, nextIds: [1] });
    expect(travelersChanged(withTravelers(1), new Set([2]))).toEqual({ changed: true, nextIds: [2] });
    expect(travelersChanged(null, new Set())).toEqual({ changed: false, nextIds: [] });
    expect(travelersChanged(undefined, new Set([4]))).toEqual({ changed: true, nextIds: [4] });
  });

  it('FE-PLANNER-BOOKINGFORM-004: the picked files go up one after the other against the saved booking', async () => {
    const order: string[] = [];
    const upload = vi.fn(async (fd: FormData) => {
      order.push(`start:${(fd.get('file') as File).name}`);
      await Promise.resolve();
      order.push(`end:${(fd.get('file') as File).name}`);
    });
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')];
    await uploadBookingFiles(upload, 42, files, 'Hotel stay');
    expect(order).toEqual(['start:a.pdf', 'end:a.pdf', 'start:b.pdf', 'end:b.pdf']);
    const fd = upload.mock.calls[1][0];
    expect(fd.get('reservation_id')).toBe('42');
    expect(fd.get('description')).toBe('Hotel stay');

    upload.mockClear();
    await uploadBookingFiles(upload, 42, [], 'none');
    expect(upload).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGFORM-008: without an upload handler the picked files are skipped and the save is not rejected', async () => {
    await expect(uploadBookingFiles(undefined, 42, [new File(['a'], 'a.pdf')], 'Hotel stay')).resolves.toBeUndefined();
  });

  it('FE-PLANNER-BOOKINGFORM-005: an expense wish opens the editor for the saved booking, nothing else does', () => {
    const booking = { title: 'Hotel Adlon', type: 'hotel' };
    const item = buildBudgetItem({ id: 7 });
    expect(expenseRequestAfterSave({ create: true }, { id: 42 }, booking, [])).toEqual({
      prefill: { reservationId: 42, name: 'Hotel Adlon', category: typeToCostCategory('hotel') },
    });
    expect(expenseRequestAfterSave({ editItem: item }, { id: 42 }, booking, [])).toEqual({ editItem: item });
    expect(expenseRequestAfterSave(null, { id: 42 }, booking, [])).toBeNull();
    expect(expenseRequestAfterSave({ create: true }, undefined, booking, [])).toBeNull();
    expect(expenseRequestAfterSave({ editItem: item }, null, booking, [])).toBeNull();
  });

  it('FE-PLANNER-BOOKINGFORM-009: the expense opened for a booking is dated on the booking day (#2604)', () => {
    const days = [buildDay({ id: 5, date: '2026-11-10' }), buildDay({ id: 6, date: '2026-11-11' })];
    const train = { title: 'KTX', type: 'train' };
    const dateOf = (saved: Parameters<typeof expenseRequestAfterSave>[1]) =>
      (expenseRequestAfterSave({ create: true }, saved, train, days) as { prefill: { date?: string } }).prefill.date;
    expect(dateOf({ id: 1, reservation_time: '2026-11-12T10:00' })).toBe('2026-11-12');
    expect(dateOf({ id: 1, reservation_time: '2026-11-12' })).toBe('2026-11-12');
    // A hotel has no time of its own: it counts on its check-in day.
    expect(dateOf({ id: 1, reservation_time: null, accommodation_start_day_id: 6 })).toBe('2026-11-11');
    // A time without a date sits on the day it was added to, or on none.
    expect(dateOf({ id: 1, reservation_time: 'T09:00', day_id: 5 })).toBe('2026-11-10');
    expect(dateOf({ id: 1, reservation_time: 'T09:00', day_id: null })).toBeUndefined();
    expect(dateOf({ id: 1 })).toBeUndefined();
  });

  it('FE-PLANNER-BOOKINGFORM-006: an import review previews the parsed price, a saved booking does not', () => {
    const prefill = { metadata: { price: 120, priceCurrency: 'eur' } };
    const preview = pendingImportExpense(null, prefill, 'hotel');
    expect(preview).toEqual({ total_price: 120, category: typeToCostCategory('hotel'), currency: 'EUR' });
    expect(pendingImportExpense(null, { metadata: { price: 50 } }, 'other')?.currency).toBeNull();
    expect(pendingImportExpense(buildReservation(), prefill, 'hotel')).toBeNull();
    expect(pendingImportExpense(null, null, 'hotel')).toBeNull();
    expect(pendingImportExpense(null, { metadata: {} }, 'hotel')).toBeNull();
  });

  it('FE-PLANNER-BOOKINGFORM-007: a saved booking shows its own, server linked and dialog linked files', () => {
    const files = [
      buildTripFile({ id: 1, reservation_id: 5 }),
      buildTripFile({ id: 2, reservation_id: null, linked_reservation_ids: [5] }),
      buildTripFile({ id: 3, reservation_id: null }),
      buildTripFile({ id: 4, reservation_id: 9 }),
    ];
    expect(attachedBookingFiles(files, 5, []).map((f) => f.id)).toEqual([1, 2]);
    expect(attachedBookingFiles(files, 5, [3]).map((f) => f.id)).toEqual([1, 2, 3]);
    expect(attachedBookingFiles(files, null, [3])).toEqual([]);
    expect(attachedBookingFiles(files, undefined, [])).toEqual([]);
  });
  it('FE-PLANNER-BOOKINGFORM-010: only files that would go up while offline hold the save back (#2601)', () => {
    const file = new File(['x'], 'ticket.pdf');
    expect(filesNeedConnection([file], true)).toBe(false);
    setForcedOffline(true);
    try {
      expect(filesNeedConnection([file], true)).toBe(true);
      expect(filesNeedConnection([], true)).toBe(false);
      expect(filesNeedConnection([file], false)).toBe(false);
    } finally {
      _resetNetworkMode();
    }
  });
});
