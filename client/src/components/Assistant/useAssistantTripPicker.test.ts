/**
 * FE-AI-PICK-001 to FE-AI-PICK-004
 *
 * Which trips the assistant offers outside a trip, and in what order: the
 * running one, then the ones to come, then the ones behind.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { tripRepo } from '../../repo/tripRepo';
import type { Trip } from '../../types';
import { rankPickerTrips, useAssistantTripPicker } from './useAssistantTripPicker';

const TODAY = '2026-10-21';

const trip = (id: number, start: string | null, end: string | null) => ({
  id,
  title: `Trip ${id}`,
  start_date: start,
  end_date: end,
});

afterEach(() => vi.restoreAllMocks());

describe('rankPickerTrips', () => {
  it('FE-AI-PICK-001: the running trip leads, then the soonest to come, then the latest past one', () => {
    const ranked = rankPickerTrips(
      [
        trip(1, '2026-01-02', '2026-01-09'),
        trip(2, '2026-12-01', '2026-12-05'),
        trip(3, '2026-10-20', '2026-10-25'),
        trip(4, '2026-11-01', '2026-11-04'),
        trip(5, '2026-05-01', '2026-05-03'),
      ],
      TODAY
    );
    expect(ranked.map((t) => [t.id, t.badge])).toEqual([
      [3, 'now'],
      [4, 'next'],
      [2, null],
      [5, null],
      [1, null],
    ]);
  });

  it('FE-AI-PICK-002: a trip without dates counts as to come, after the dated ones, and is never "next"', () => {
    const ranked = rankPickerTrips([trip(1, null, null), trip(2, '2026-11-01', null)], TODAY);
    expect(ranked.map((t) => [t.id, t.badge])).toEqual([
      [2, 'next'],
      [1, null],
    ]);
  });

  it('FE-AI-PICK-003: offers at most eight trips', () => {
    const many = Array.from({ length: 12 }, (_, i) => trip(i + 1, `2027-01-${String(i + 1).padStart(2, '0')}`, null));
    expect(rankPickerTrips(many, TODAY)).toHaveLength(8);
  });
});

describe('useAssistantTripPicker', () => {
  it('FE-AI-PICK-004: loads the trips once and ranks them; a failed load offers none', async () => {
    const list = vi
      .spyOn(tripRepo, 'list')
      .mockResolvedValueOnce({ trips: [trip(7, '2026-10-01', '2026-10-30') as Trip], archivedTrips: [] });
    const { result } = renderHook(() => useAssistantTripPicker());
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual([{ id: 7, title: 'Trip 7', badge: 'now' }]));
    expect(list).toHaveBeenCalledTimes(1);

    list.mockRejectedValueOnce(new Error('down'));
    const failed = renderHook(() => useAssistantTripPicker());
    await waitFor(() => expect(failed.result.current).toEqual([]));
  });
});
