// FE-COMP-VACAYSHARE-001 to -003: the calendar share row actions both views share.
import { renderHook, waitFor } from '@testing-library/react';

import { useVacayStore } from '../../store/vacayStore';
import { useVacayShareActions } from './useVacayShareActions';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const setShareHidden = vi.fn<(shareId: number, hidden: boolean) => Promise<void>>();
const removeShare = vi.fn<(shareId: number) => Promise<void>>();

beforeEach(() => {
  toast.error.mockReset();
  setShareHidden.mockReset().mockResolvedValue(undefined);
  removeShare.mockReset().mockResolvedValue(undefined);
  useVacayStore.setState({ setShareHidden, removeShare });
});

describe('useVacayShareActions', () => {
  it('FE-COMP-VACAYSHARE-001: toggles and removes through the store', async () => {
    const { result } = renderHook(() => useVacayShareActions());
    result.current.toggleHidden(4, true);
    result.current.remove(5);
    expect(setShareHidden).toHaveBeenCalledWith(4, true);
    expect(removeShare).toHaveBeenCalledWith(5);
    await Promise.resolve();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-COMP-VACAYSHARE-002: a rejected toggle toasts the server error', async () => {
    setShareHidden.mockRejectedValue({ response: { data: { error: 'Share not found' } } });
    const { result } = renderHook(() => useVacayShareActions());
    result.current.toggleHidden(4, false);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Share not found'));
  });

  it('FE-COMP-VACAYSHARE-003: a rejected removal falls back to the generic share error', async () => {
    removeShare.mockRejectedValue('boom');
    const { result } = renderHook(() => useVacayShareActions());
    result.current.remove(5);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('vacay.shareFailed'));
  });
});
