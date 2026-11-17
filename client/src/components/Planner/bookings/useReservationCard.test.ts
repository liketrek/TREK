// FE-PLANNER-RESLISTFILTER-005 to -009: what one card of the phone's bookings
// and transports tabs does.
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildBudgetItem, buildReservation } from '../../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useTripStore } from '../../../store/tripStore';
import type { Reservation } from '../../../types';
import { downloadFile, openFile } from '../../../utils/fileDownload';
import { useReservationCard } from './useReservationCard';

vi.mock('../../../utils/fileDownload', () => ({
  openFile: vi.fn(() => Promise.resolve()),
  downloadFile: vi.fn(() => Promise.resolve()),
}));

const traveler = (user_id: number) => ({ user_id, username: `u${user_id}` });
const ann = buildReservation({
  id: 10,
  status: 'confirmed',
  reservation_time: '2026-03-02T09:00',
  travelers: [traveler(1)],
} as Partial<Reservation>);
const bob = buildReservation({
  id: 11,
  status: 'pending',
  reservation_time: '2026-03-01T09:00',
  travelers: [traveler(2)],
} as Partial<Reservation>);

describe('useReservationCard', () => {
  const file = { url: '/uploads/f/1', original_name: 'voucher.pdf' };
  const host = (blur?: boolean, handleDeleteReservation: (id: number) => unknown = vi.fn(() => Promise.resolve())) => ({
    settings: { blur_booking_codes: blur },
    handleDeleteReservation: vi.fn(handleDeleteReservation),
    toast: { error: vi.fn() },
    t: (key: string) => key,
  });

  beforeEach(() => {
    vi.mocked(openFile).mockClear();
    vi.mocked(downloadFile).mockClear();
  });

  it('FE-PLANNER-RESLISTFILTER-005: with the blur preference on the code is blurred until toggled', () => {
    const { result } = renderHook(() => useReservationCard(ann, host(true)));
    expect(result.current.codeBlurred).toBe(true);
    act(() => result.current.toggleCode?.());
    expect(result.current.codeBlurred).toBe(false);
    act(() => result.current.toggleCode?.());
    expect(result.current.codeBlurred).toBe(true);
  });

  it('FE-PLANNER-RESLISTFILTER-006: with the preference off the code is plain and has no toggle', () => {
    const { result } = renderHook(() => useReservationCard(ann, host(false)));
    expect(result.current.codeBlurred).toBe(false);
    expect(result.current.toggleCode).toBeUndefined();
  });

  it('FE-PLANNER-RESLISTFILTER-007: delete asks first, closes the question and toasts a failure', async () => {
    const opts = host(false, () => Promise.reject(new Error('boom')));
    const { result } = renderHook(() => useReservationCard(bob, opts));
    expect(result.current.confirmingDelete).toBe(false);
    act(() => result.current.askDelete());
    expect(result.current.confirmingDelete).toBe(true);
    act(() => result.current.cancelDelete());
    expect(result.current.confirmingDelete).toBe(false);
    expect(opts.handleDeleteReservation).not.toHaveBeenCalled();

    act(() => result.current.askDelete());
    act(() => result.current.confirmDelete());
    expect(result.current.confirmingDelete).toBe(false);
    expect(opts.handleDeleteReservation).toHaveBeenCalledWith(11);
    await vi.waitFor(() => expect(opts.toast.error).toHaveBeenCalledWith('reservations.toast.deleteError'));
  });

  it('FE-PLANNER-RESLISTFILTER-008: a file opens or downloads under its own name (#2585)', () => {
    const { result } = renderHook(() => useReservationCard(ann, host()));
    result.current.openFile(file);
    expect(openFile).toHaveBeenCalledWith('/uploads/f/1', 'voucher.pdf');
    expect(downloadFile).not.toHaveBeenCalled();
    result.current.downloadFile(file);
    expect(downloadFile).toHaveBeenCalledWith('/uploads/f/1', 'voucher.pdf');
    expect(openFile).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-RESLISTFILTER-008b: a download that fails says so with a toast', async () => {
    vi.mocked(downloadFile).mockRejectedValueOnce(new Error('offline'));
    const opts = host();
    const { result } = renderHook(() => useReservationCard(ann, opts));
    result.current.downloadFile(file);
    await vi.waitFor(() => expect(opts.toast.error).toHaveBeenCalledWith('files.downloadError'));
  });

  it('FE-PLANNER-RESLISTFILTER-009: the card knows whether deleting it takes a linked expense along (#2604)', () => {
    resetAllStores();
    seedStore(useTripStore, { budgetItems: [buildBudgetItem({ id: 1, reservation_id: 10 } as never)] });
    expect(renderHook(() => useReservationCard(ann, host())).result.current.deleteTakesExpense).toBe(true);
    expect(renderHook(() => useReservationCard(bob, host())).result.current.deleteTakesExpense).toBe(false);
  });
});
