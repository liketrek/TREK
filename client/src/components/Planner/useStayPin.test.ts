import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findOnMap } from '../../repo/mapMatchRepo';
import { isEffectivelyOffline } from '../../sync/networkMode';
import { useStayPin } from './useStayPin';

vi.mock('../../hooks/usePlaceLanguage', () => ({ usePlaceLanguage: () => 'en' }));
vi.mock('../../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../../repo/mapMatchRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../repo/mapMatchRepo')>()),
  findOnMap: vi.fn(),
}));

const SPOT = { lat: 35.69, lng: 139.7, label: 'Hotel Gracery Shinjuku' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
});

describe('useStayPin', () => {
  it('FE-STAY-PIN-001: looks the stay up by name and address and says where it found it', async () => {
    vi.mocked(findOnMap).mockResolvedValueOnce(SPOT);
    const { result } = renderHook(() => useStayPin());
    expect(result.current.pin).toEqual({ status: 'idle' });

    act(() => result.current.lookUp('Hotel Gracery', '1-19-1 Kabukicho'));
    expect(result.current.pin).toEqual({ status: 'searching' });
    await waitFor(() => expect(result.current.pin).toEqual({ status: 'found', match: SPOT }));
    expect(result.current.match).toEqual(SPOT);
    expect(findOnMap).toHaveBeenCalledWith(
      ['Hotel Gracery 1-19-1 Kabukicho', 'Hotel Gracery', '1-19-1 Kabukicho'],
      'en'
    );
  });

  it('FE-STAY-PIN-002: nothing found, a failed search and an empty name all read as not on the map', async () => {
    const { result } = renderHook(() => useStayPin());
    vi.mocked(findOnMap).mockResolvedValueOnce(null);
    act(() => result.current.lookUp('Ryokan', null));
    await waitFor(() => expect(result.current.pin).toEqual({ status: 'missing' }));
    expect(result.current.match).toBeNull();

    vi.mocked(findOnMap).mockRejectedValueOnce(new Error('down'));
    act(() => result.current.lookUp('Ryokan', null));
    await waitFor(() => expect(result.current.pin).toEqual({ status: 'missing' }));

    act(() => result.current.lookUp('', ''));
    expect(result.current.pin).toEqual({ status: 'missing' });
  });

  it('FE-STAY-PIN-003: a later lookup or a hand-picked spot wins over an answer still on its way', async () => {
    let answer: (m: typeof SPOT | null) => void = () => undefined;
    vi.mocked(findOnMap).mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const { result } = renderHook(() => useStayPin());
    act(() => result.current.lookUp('Hotel', 'Somewhere'));
    const picked = { lat: 1, lng: 2, label: 'Picked' };
    act(() => result.current.pick(picked));
    await act(async () => answer(SPOT));
    expect(result.current.pin).toEqual({ status: 'found', match: picked });

    act(() => result.current.reset());
    expect(result.current.pin).toEqual({ status: 'idle' });
  });

  it('FE-STAY-PIN-004: offline there is nothing to ask, so the review shows nothing', () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    const { result } = renderHook(() => useStayPin());
    act(() => result.current.lookUp('Hotel', 'Somewhere'));
    expect(result.current.pin).toEqual({ status: 'idle' });
    expect(findOnMap).not.toHaveBeenCalled();
  });
});
