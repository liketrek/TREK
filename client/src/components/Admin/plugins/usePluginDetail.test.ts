// FE-ADMIN-PLUGIN-DETAIL-001 to -003: the registry detail fetch behind both detail views.
import { renderHook, waitFor } from '@testing-library/react';

import { adminApi } from '../../../api/client';
import { usePluginDetail } from './usePluginDetail';

afterEach(() => vi.restoreAllMocks());

describe('usePluginDetail', () => {
  it('FE-ADMIN-PLUGIN-DETAIL-001: loads the detail for the id', async () => {
    vi.spyOn(adminApi, 'pluginDetail').mockResolvedValue({ id: 'alpha', size: 2048 });
    const { result } = renderHook(() => usePluginDetail('alpha'));
    expect(result.current.detail).toBeNull();
    await waitFor(() => expect(result.current.detail).toEqual({ id: 'alpha', size: 2048 }));
    expect(result.current.failed).toBe(false);
    expect(adminApi.pluginDetail).toHaveBeenCalledWith('alpha');
  });

  it('FE-ADMIN-PLUGIN-DETAIL-002: a failed fetch is flagged and leaves no detail', async () => {
    vi.spyOn(adminApi, 'pluginDetail').mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => usePluginDetail('alpha'));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.detail).toBeNull();
  });

  it('FE-ADMIN-PLUGIN-DETAIL-003: a response for an id the view moved off is dropped', async () => {
    let resolveFirst!: (v: unknown) => void;
    vi.spyOn(adminApi, 'pluginDetail').mockImplementation((id: string) =>
      id === 'alpha' ? new Promise((r) => (resolveFirst = r)) : Promise.resolve({ id })
    );
    const { result, rerender } = renderHook(({ id }) => usePluginDetail(id), { initialProps: { id: 'alpha' } });
    rerender({ id: 'beta' });
    await waitFor(() => expect(result.current.detail).toEqual({ id: 'beta' }));
    resolveFirst({ id: 'alpha' });
    await Promise.resolve();
    expect(result.current.detail).toEqual({ id: 'beta' });
  });
});
