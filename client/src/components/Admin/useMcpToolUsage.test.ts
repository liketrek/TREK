import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminMcpApi } from '../../api/adminMcp';
import { lastCallAt, usageBarWidth, usageShare, useMcpToolUsage } from './useMcpToolUsage';

// FE-HOOK-MCPUSAGE-001 to FE-HOOK-MCPUSAGE-007

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const usage = (days: number, calls: number) => ({
  days,
  since: '2026-10-07 00:00:00',
  total_calls: calls + 1,
  tools: [
    { tool: 'list_trips', calls, users: 2, last_called_at: '2026-11-05 10:00:00' },
    { tool: 'get_weather', calls: 1, users: 1, last_called_at: '2026-11-04 09:30:00' },
  ],
});

beforeEach(() => {
  toast.error.mockReset();
  vi.spyOn(adminMcpApi, 'toolUsage').mockImplementation(async (days: number) => usage(days, days === 7 ? 3 : 8));
});
afterEach(() => vi.restoreAllMocks());

describe('useMcpToolUsage', () => {
  it('FE-HOOK-MCPUSAGE-001: loads the last 30 days on mount, the most called tool setting the bar scale', async () => {
    const { result } = renderHook(() => useMcpToolUsage());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adminMcpApi.toolUsage).toHaveBeenCalledWith(30);
    expect(result.current.tools.map((t) => t.tool)).toEqual(['list_trips', 'get_weather']);
    expect(result.current.totalCalls).toBe(9);
    expect(result.current.maxCalls).toBe(8);
  });

  it('FE-HOOK-MCPUSAGE-002: another span loads again, the same span does not', async () => {
    const { result } = renderHook(() => useMcpToolUsage());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDays(30));
    expect(adminMcpApi.toolUsage).toHaveBeenCalledTimes(1);
    act(() => result.current.setDays(7));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adminMcpApi.toolUsage).toHaveBeenLastCalledWith(7);
    expect(result.current.maxCalls).toBe(3);
  });

  it('FE-HOOK-MCPUSAGE-003: a failed load says so and leaves the table empty', async () => {
    vi.mocked(adminMcpApi.toolUsage).mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useMcpToolUsage());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('admin.mcpToolUsage.loadError');
    expect(result.current.tools).toEqual([]);
  });

  it('FE-HOOK-MCPUSAGE-004: an answer the contract does not describe is refused, not shown', async () => {
    vi.mocked(adminMcpApi.toolUsage).mockResolvedValueOnce({ tools: 'nope' } as never);
    const { result } = renderHook(() => useMcpToolUsage());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(result.current.tools).toEqual([]);
  });

  it('FE-HOOK-MCPUSAGE-005: the bar share and the call time read the way the table shows them', () => {
    expect(usageShare(4, 8)).toBe(0.5);
    expect(usageShare(3, 0)).toBe(0);
    expect(usageShare(9, 8)).toBe(1);
    expect(usageBarWidth(1, 3)).toBe('33%');
    const row = (last_called_at: string) => ({ tool: 't', calls: 1, users: 1, last_called_at });
    expect(lastCallAt(row('2026-11-05 10:00:00'))?.toISOString()).toBe('2026-11-05T10:00:00.000Z');
    expect(lastCallAt(row('2026-11-05T10:00:00Z'))?.toISOString()).toBe('2026-11-05T10:00:00.000Z');
    expect(lastCallAt(row('not a time'))).toBeNull();
  });

  it("FE-HOOK-MCPUSAGE-006: a span that fails to load drops the last span's rows instead of showing them as its own", async () => {
    const { result } = renderHook(() => useMcpToolUsage());
    await waitFor(() => expect(result.current.tools).toHaveLength(2));
    vi.mocked(adminMcpApi.toolUsage).mockRejectedValueOnce(new Error('boom'));
    act(() => result.current.setDays(90));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.days).toBe(90);
    expect(result.current.tools).toEqual([]);
    expect(result.current.totalCalls).toBe(0);
    expect(toast.error).toHaveBeenCalledWith('admin.mcpToolUsage.loadError');
  });

  it('FE-HOOK-MCPUSAGE-007: each row carries its bar width and its last call written out', async () => {
    const { result } = renderHook(() => useMcpToolUsage());
    await waitFor(() => expect(result.current.tools).toHaveLength(2));
    const [top, other] = result.current.tools;
    expect(top.barWidth).toBe('100%');
    expect(other.barWidth).toBe('13%');
    expect(top.lastCall).not.toBe('—');
  });
});
