// FE-ADMIN-MAILINGEST-001: leaving the booking mail setup with changes not saved.
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';

const repo = vi.hoisted(() => ({
  adminSettings: vi.fn(),
  adminStatus: vi.fn(),
  saveAdminSettings: vi.fn(),
  adminTest: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../repo/mailIngestRepo', () => ({ mailIngestRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const { useMailIngestAdmin } = await import('./useMailIngestAdmin');

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children);

beforeEach(() => {
  vi.clearAllMocks();
  repo.adminSettings.mockResolvedValue({ mail_ingest_enabled: 'true', mail_ingest_imap_host: 'mail.example.com' });
  repo.adminStatus.mockResolvedValue(null);
  repo.saveAdminSettings.mockResolvedValue({});
});

describe('useMailIngestAdmin', () => {
  it('FE-ADMIN-MAILINGEST-001: a way out with changes not saved asks, and discarding puts the saved values back', async () => {
    const { result } = renderHook(() => useMailIngestAdmin(true), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const close = vi.fn();
    act(() => result.current.leaving.requestClose(close));
    expect(close).toHaveBeenCalledTimes(1);
    expect(result.current.leaving.asking).toBe(false);

    act(() => result.current.set('imap_host', 'imap.example.com'));
    act(() => result.current.leaving.requestClose(close));
    expect(close).toHaveBeenCalledTimes(1);
    expect(result.current.leaving.asking).toBe(true);

    act(() => result.current.leaving.keepEditing());
    expect(result.current.leaving.asking).toBe(false);
    expect(result.current.form?.imap_host).toBe('imap.example.com');

    act(() => result.current.leaving.requestClose(close));
    act(() => result.current.leaving.discard());
    expect(close).toHaveBeenCalledTimes(2);
    expect(result.current.leaving.asking).toBe(false);
    expect(result.current.form?.imap_host).toBe('mail.example.com');
    expect(result.current.dirty).toBe(false);
    expect(repo.saveAdminSettings).not.toHaveBeenCalled();
  });
});
