// FE-PLANNER-RESLISTFILTER-005 to -008: what one card of the phone's bookings
// and transports tabs does.
import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildReservation } from '../../../../tests/helpers/factories';
import type { Reservation } from '../../../types';
import { openFile } from '../../../utils/fileDownload';
import { useReservationCard } from './useReservationCard';

vi.mock('../../../utils/fileDownload', () => ({ openFile: vi.fn(() => Promise.resolve()) }));

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

  beforeEach(() => vi.mocked(openFile).mockClear());

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

  it('FE-PLANNER-RESLISTFILTER-008: a file chip opens its file on click, Enter or Space and stops there', () => {
    const { result } = renderHook(() => useReservationCard(ann, host()));
    const chip = result.current.fileChip(file);
    const click = { stopPropagation: vi.fn() } as unknown as MouseEvent;
    chip.onClick(click);
    expect(click.stopPropagation).toHaveBeenCalled();
    const key = (k: string) =>
      ({ key: k, preventDefault: vi.fn(), stopPropagation: vi.fn() }) as unknown as KeyboardEvent;
    const enter = key('Enter');
    chip.onKeyDown(enter);
    chip.onKeyDown(key(' '));
    const tab = key('Tab');
    chip.onKeyDown(tab);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(enter.stopPropagation).toHaveBeenCalled();
    expect(tab.preventDefault).not.toHaveBeenCalled();
    expect(tab.stopPropagation).not.toHaveBeenCalled();
    expect(openFile).toHaveBeenCalledTimes(3);
    expect(openFile).toHaveBeenCalledWith('/uploads/f/1', 'voucher.pdf');
  });
});
