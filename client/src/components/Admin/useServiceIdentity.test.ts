// FE-ADMIN-SVCID-HOOK-001 to FE-ADMIN-SVCID-HOOK-004
import { act, renderHook } from '@testing-library/react';
import type { ServiceIdentityStatus } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useServiceIdentity } from './useServiceIdentity';

const { status, regenerate, visible } = vi.hoisted(() => ({
  status: vi.fn(),
  regenerate: vi.fn(),
  visible: { current: true },
}));

vi.mock('../../repo/serviceIdentityRepo', () => ({ serviceIdentityRepo: { status, regenerate } }));
vi.mock('../../hooks/useElementVisible', () => ({ useElementVisible: () => visible.current }));

const LEGACY: ServiceIdentityStatus = {
  state: 'legacy',
  tier: 'legacy',
  keySource: null,
  services: [],
  lastSeenAt: null,
};
const card = { current: null };

beforeEach(() => {
  vi.useFakeTimers();
  visible.current = true;
  status.mockReset().mockResolvedValue(LEGACY);
  regenerate.mockReset();
});

afterEach(() => vi.useRealTimers());

describe('useServiceIdentity', () => {
  it('FE-ADMIN-SVCID-HOOK-001: reads once in view, then every 30 seconds', async () => {
    const { result } = renderHook(() => useServiceIdentity(card));
    await act(async () => {});
    expect(result.current.status).toEqual(LEGACY);
    expect(status).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(status).toHaveBeenCalledTimes(2);
  });

  it('FE-ADMIN-SVCID-HOOK-002: reads nothing while the card is out of view, and stops when it leaves', async () => {
    visible.current = false;
    const { rerender } = renderHook(() => useServiceIdentity(card));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });
    expect(status).not.toHaveBeenCalled();

    visible.current = true;
    rerender();
    await act(async () => {});
    expect(status).toHaveBeenCalledTimes(1);

    visible.current = false;
    rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });
    expect(status).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMIN-SVCID-HOOK-003: marks a failed read, and clears the mark on the next good one', async () => {
    status.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useServiceIdentity(card));
    await act(async () => {});
    expect(result.current.failed).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(result.current.failed).toBe(false);
  });

  it('FE-ADMIN-SVCID-HOOK-004: a new identity replaces the status, and a refusal reaches the caller', async () => {
    const registering = { ...LEGACY, state: 'registering' as const };
    regenerate.mockResolvedValueOnce(registering).mockRejectedValueOnce(new Error('409'));
    const { result } = renderHook(() => useServiceIdentity(card));
    await act(async () => {
      await result.current.regenerate();
    });
    expect(result.current.status).toEqual(registering);
    await act(async () => {
      await expect(result.current.regenerate()).rejects.toThrow('409');
    });
    expect(result.current.regenerating).toBe(false);
  });
});
