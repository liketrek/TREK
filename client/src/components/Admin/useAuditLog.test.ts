import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../api/client';
import { type AuditEntry, auditUserLabel, fmtAuditDetails, useAuditLog } from './useAuditLog';

// FE-HOOK-AUDIT-001 to FE-HOOK-AUDIT-008

vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k, locale: 'en-US' }) }));

function entry(id: number, over: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id,
    created_at: '2025-06-01T10:30:00Z',
    user_id: 5,
    username: 'alice',
    user_email: 'alice@example.com',
    action: 'trip.create',
    resource: '/trips/42',
    details: null,
    ip: '127.0.0.1',
    ...over,
  };
}

const auditLog = () => vi.mocked(adminApi.auditLog);

beforeEach(() => {
  vi.spyOn(adminApi, 'auditLog').mockResolvedValue({ entries: [entry(1)], total: 150 });
});
afterEach(() => vi.restoreAllMocks());

describe('useAuditLog', () => {
  it('FE-HOOK-AUDIT-001: loads the first page of 100 on mount', async () => {
    const { result } = renderHook(() => useAuditLog());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(auditLog()).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    expect(result.current.entries.map((e) => e.id)).toEqual([1]);
    expect(result.current.total).toBe(150);
  });

  it('FE-HOOK-AUDIT-002: load more appends the next page and advances the offset each time', async () => {
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    auditLog().mockResolvedValueOnce({ entries: [entry(2)], total: 150 });
    await act(() => result.current.loadMore());
    expect(auditLog()).toHaveBeenLastCalledWith({ limit: 100, offset: 100 });
    expect(result.current.entries.map((e) => e.id)).toEqual([1, 2]);
    auditLog().mockResolvedValueOnce({ entries: [entry(3)], total: 150 });
    await act(() => result.current.loadMore());
    expect(auditLog()).toHaveBeenLastCalledWith({ limit: 100, offset: 200 });
  });

  it('FE-HOOK-AUDIT-003: a failed load more keeps what is already listed and the offset', async () => {
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    auditLog().mockRejectedValueOnce(new Error('down'));
    await act(() => result.current.loadMore());
    expect(result.current.entries.map((e) => e.id)).toEqual([1]);
    expect(result.current.loading).toBe(false);
    auditLog().mockResolvedValueOnce({ entries: [], total: 150 });
    await act(() => result.current.loadMore());
    expect(auditLog()).toHaveBeenLastCalledWith({ limit: 100, offset: 100 });
  });

  it('FE-HOOK-AUDIT-004: refresh starts over from offset 0 after paging', async () => {
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    auditLog().mockResolvedValueOnce({ entries: [entry(2)], total: 150 });
    await act(() => result.current.loadMore());
    auditLog().mockResolvedValueOnce({ entries: [entry(9)], total: 1 });
    await act(() => result.current.loadFirstPage());
    expect(result.current.entries.map((e) => e.id)).toEqual([9]);
    auditLog().mockResolvedValueOnce({ entries: [], total: 1 });
    await act(() => result.current.loadMore());
    expect(auditLog()).toHaveBeenLastCalledWith({ limit: 100, offset: 100 });
  });

  it('FE-HOOK-AUDIT-005: a failed first page empties the list and the total', async () => {
    auditLog().mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('FE-HOOK-AUDIT-006: a missing entries array or total reads as empty', async () => {
    auditLog().mockResolvedValue({});
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('FE-HOOK-AUDIT-007: fmtTime reads a bare timestamp as UTC and honours the server timezone', async () => {
    const { result } = renderHook(() => useAuditLog('Asia/Tokyo'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const expected = new Date('2025-06-01T10:30:00Z').toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'Asia/Tokyo',
    });
    expect(result.current.fmtTime('2025-06-01T10:30:00')).toBe(expected);
    expect(result.current.fmtTime('2025-06-01T10:30:00Z')).toBe(expected);
  });

  it('FE-HOOK-AUDIT-008: details and user labels fall back the way both shells show them', () => {
    expect(fmtAuditDetails(null)).toBe('—');
    expect(fmtAuditDetails({})).toBe('—');
    expect(fmtAuditDetails({ a: 1 })).toBe('{"a":1}');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(fmtAuditDetails(circular)).toBe('—');
    expect(auditUserLabel(entry(1))).toBe('alice');
    expect(auditUserLabel(entry(1, { username: null }))).toBe('alice@example.com');
    expect(auditUserLabel(entry(1, { username: null, user_email: null }))).toBe('#5');
    expect(auditUserLabel(entry(1, { username: null, user_email: null, user_id: null }))).toBe('—');
  });
});
