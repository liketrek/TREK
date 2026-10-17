// FE-PLANNER-RESDELETE-001 to -003: deleting a booking after a question, shared
// by the desktop bookings panel and the phone's booking and transport cards.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildReservation } from '../../../../tests/helpers/factories';
import { useReservationDelete } from './useReservationDelete';

const res = buildReservation({ id: 7, title: 'Hotel' });

describe('useReservationDelete', () => {
  it('FE-PLANNER-RESDELETE-001: nothing is deleted until the question is answered', async () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() => useReservationDelete(onDelete, vi.fn()));
    act(() => result.current.requestDelete(res));
    expect(result.current.pendingDelete).toBe(res);
    act(() => result.current.cancelDelete());
    expect(result.current.pendingDelete).toBeNull();
    await act(() => result.current.confirmDelete());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-RESDELETE-002: an answer closes the question, runs beforeDelete, then deletes', async () => {
    const calls: string[] = [];
    const onDelete = vi.fn(() => {
      calls.push('delete');
    });
    const beforeDelete = vi.fn(() => {
      calls.push('before');
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useReservationDelete(onDelete, onError, beforeDelete));
    act(() => result.current.requestDelete(res));
    await act(() => result.current.confirmDelete());
    expect(result.current.pendingDelete).toBeNull();
    expect(beforeDelete).toHaveBeenCalledWith(res);
    expect(onDelete).toHaveBeenCalledWith(7);
    expect(calls).toEqual(['before', 'delete']);
    expect(onError).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-RESDELETE-003: a failed delete, rejected or thrown, goes to onError', async () => {
    const onError = vi.fn();
    const rejecting = renderHook(() => useReservationDelete(() => Promise.reject(new Error('offline')), onError));
    act(() => rejecting.result.current.requestDelete(res));
    await act(() => rejecting.result.current.confirmDelete());
    expect(onError).toHaveBeenCalledTimes(1);

    const throwing = renderHook(() =>
      useReservationDelete(() => {
        throw new Error('boom');
      }, onError)
    );
    act(() => throwing.result.current.requestDelete(res));
    await act(() => throwing.result.current.confirmDelete());
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
