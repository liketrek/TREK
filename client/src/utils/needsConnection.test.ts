// FE-UTIL-NEEDSCONN-001 to FE-UTIL-NEEDSCONN-002
import { afterEach, describe, expect, it, vi } from 'vitest';
import { offlineOr, refusedOffline } from './needsConnection';

const t = (key: string) => `t:${key}`;

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

afterEach(() => setOnline(true));

describe('needsConnection', () => {
  it('FE-UTIL-NEEDSCONN-001: offline a write the queue cannot hold is refused with the hint', () => {
    const toast = { error: vi.fn() };
    expect(refusedOffline(toast, t)).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();

    setOnline(false);
    expect(refusedOffline(toast, t)).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('t:common.needsConnection');
  });

  it('FE-UTIL-NEEDSCONN-002: a failed write reads as needing a connection only while offline', () => {
    expect(offlineOr(t, 'Error')).toBe('Error');
    setOnline(false);
    expect(offlineOr(t, 'Error')).toBe('t:common.needsConnection');
  });
});
