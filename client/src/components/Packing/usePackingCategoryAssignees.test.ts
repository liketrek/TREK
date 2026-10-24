import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { packingApi } from '../../api/client';
import { usePackingCategoryAssignees } from './usePackingCategoryAssignees';

// FE-PACK-ASSIGN-001 to FE-PACK-ASSIGN-004

const t = (key: string) => key;
const ANNA = { user_id: 3, username: 'anna' };
const BEN = { user_id: 4, username: 'ben' };

function setup() {
  const toast = { error: vi.fn() };
  return { ...renderHook(() => usePackingCategoryAssignees({ tripId: 7, t, toast })), toast };
}

afterEach(() => vi.restoreAllMocks());

describe('usePackingCategoryAssignees', () => {
  it('FE-PACK-ASSIGN-001: loads who looks after each category of the trip', async () => {
    const get = vi.spyOn(packingApi, 'getCategoryAssignees').mockResolvedValue({ assignees: { Camp: [ANNA] } });
    const { result } = setup();
    await waitFor(() => expect(result.current.categoryAssignees).toEqual({ Camp: [ANNA] }));
    expect(get).toHaveBeenCalledWith(7);
  });

  it('FE-PACK-ASSIGN-002: a failed or empty load leaves every category unassigned, without a message', async () => {
    vi.spyOn(packingApi, 'getCategoryAssignees').mockResolvedValue({});
    const empty = setup();
    await act(async () => {});
    expect(empty.result.current.categoryAssignees).toEqual({});

    vi.spyOn(packingApi, 'getCategoryAssignees').mockRejectedValue(new Error('offline'));
    const failed = setup();
    await act(async () => {});
    expect(failed.result.current.categoryAssignees).toEqual({});
    expect(failed.toast.error).not.toHaveBeenCalled();
  });

  it('FE-PACK-ASSIGN-003: setting a category keeps the others and takes what the server answers', async () => {
    vi.spyOn(packingApi, 'getCategoryAssignees').mockResolvedValue({ assignees: { Camp: [ANNA], Food: [BEN] } });
    const put = vi.spyOn(packingApi, 'setCategoryAssignees').mockResolvedValue({ assignees: [ANNA, BEN] });
    const { result } = setup();
    await waitFor(() => expect(result.current.categoryAssignees.Food).toEqual([BEN]));
    await act(async () => {
      await result.current.setAssignees('Camp', [3, 4]);
    });
    expect(put).toHaveBeenCalledWith(7, 'Camp', [3, 4]);
    expect(result.current.categoryAssignees).toEqual({ Camp: [ANNA, BEN], Food: [BEN] });

    put.mockResolvedValueOnce({});
    await act(async () => {
      await result.current.setAssignees('Food', []);
    });
    expect(result.current.categoryAssignees.Food).toEqual([]);
  });

  it('FE-PACK-ASSIGN-004: a failed change is reported and changes nothing', async () => {
    vi.spyOn(packingApi, 'getCategoryAssignees').mockResolvedValue({ assignees: { Camp: [ANNA] } });
    vi.spyOn(packingApi, 'setCategoryAssignees').mockRejectedValue(new Error('x'));
    const { result, toast } = setup();
    await waitFor(() => expect(result.current.categoryAssignees.Camp).toEqual([ANNA]));
    await act(async () => {
      await result.current.setAssignees('Camp', []);
    });
    expect(toast.error).toHaveBeenCalledWith('packing.toast.saveError');
    expect(result.current.categoryAssignees).toEqual({ Camp: [ANNA] });
  });
});
