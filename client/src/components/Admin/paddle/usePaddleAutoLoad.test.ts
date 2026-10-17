// FE-HOOK-PADDLE-AUTOLOAD-001 to 003: how TREK loads regions by itself, read and saved in the admin area (PAD-11C).
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationProvider } from '../../../i18n/TranslationContext';

const repo = vi.hoisted(() => ({ settings: vi.fn(), saveSettings: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../repo/paddleRegionRepo', () => ({ paddleRegionRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const { usePaddleAutoLoad } = await import('./usePaddleAutoLoad');

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children);

describe('usePaddleAutoLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.settings.mockResolvedValue({ mode: 'auto', max_mb: 500 });
    repo.saveSettings.mockImplementation(async (settings: unknown) => settings);
  });

  it('FE-HOOK-PADDLE-AUTOLOAD-001: reads the setting once the card shows, and not offline', async () => {
    const { result } = renderHook(() => usePaddleAutoLoad(true, false), { wrapper });
    await waitFor(() => expect(result.current.settings).toEqual({ mode: 'auto', max_mb: 500 }));
    renderHook(() => usePaddleAutoLoad(true, true), { wrapper });
    expect(repo.settings).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-PADDLE-AUTOLOAD-002: shows a change at once and keeps what the server saved', async () => {
    const { result } = renderHook(() => usePaddleAutoLoad(true, false), { wrapper });
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    await act(async () => {
      await result.current.save({ mode: 'ask' });
    });
    expect(repo.saveSettings).toHaveBeenCalledWith({ mode: 'ask', max_mb: 500 });
    expect(result.current.settings).toEqual({ mode: 'ask', max_mb: 500 });
  });

  it('FE-HOOK-PADDLE-AUTOLOAD-003: takes a refused change back and says so', async () => {
    repo.saveSettings.mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => usePaddleAutoLoad(true, false), { wrapper });
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    await act(async () => {
      await result.current.save({ max_mb: 2000 });
    });
    expect(result.current.settings).toEqual({ mode: 'auto', max_mb: 500 });
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
