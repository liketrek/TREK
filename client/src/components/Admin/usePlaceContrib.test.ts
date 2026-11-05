// FE-ADMIN-CONTRIBHOOK-001
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PlaceContribState } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeContribRepo } from '../../repo/placeContribRepo';
import { usePlaceContrib } from './usePlaceContrib';

const STATE = { ineligibleReason: null, active: true } as unknown as PlaceContribState;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlaceContrib', () => {
  it('FE-ADMIN-CONTRIBHOOK-001: a withdrawal that went through is answered even when the state cannot be read again', async () => {
    const state = vi.spyOn(placeContribRepo, 'state').mockResolvedValueOnce(STATE);
    vi.spyOn(placeContribRepo, 'withdraw').mockResolvedValue({ withdrawn: { website: 2 }, cleared: 1 });
    const { result } = renderHook(() => usePlaceContrib());
    await waitFor(() => expect(result.current.state).toBe(STATE));

    state.mockRejectedValueOnce(new Error('offline'));
    let answer: unknown;
    await act(async () => {
      answer = await result.current.withdraw();
    });

    expect(answer).toEqual({ withdrawn: { website: 2 }, cleared: 1 });
    expect(result.current.state).toBe(STATE);
    expect(result.current.busy).toBe(false);
  });
});
