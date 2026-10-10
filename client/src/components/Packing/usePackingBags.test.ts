import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { packingApi } from '../../api/client';
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode';
import type { PackingBag } from '../../types';
import { BAG_COLORS } from './packingListPanel.constants';
import { useBagTotalsPing } from './useBagTotalsPing';
import { usePackingBags } from './usePackingBags';

vi.mock('./useBagTotalsPing', () => ({ useBagTotalsPing: vi.fn() }));

// FE-PACK-BAGS-001 to FE-PACK-BAGS-010

const t = (key: string) => key;
const bag = (over: Partial<PackingBag>): PackingBag => ({
  id: 1,
  trip_id: 7,
  name: 'Backpack',
  color: BAG_COLORS[0],
  sort_order: 0,
  ...over,
});
const BACKPACK = bag({ id: 1 });
const DUFFEL = bag({ id: 2, name: 'Duffel', color: BAG_COLORS[1] });

function setup(bagTrackingEnabled = true) {
  const toast = { error: vi.fn() };
  const view = renderHook(
    (props: { enabled: boolean }) => usePackingBags({ tripId: 7, bagTrackingEnabled: props.enabled, t, toast }),
    {
      initialProps: { enabled: bagTrackingEnabled },
    }
  );
  return { ...view, toast };
}

beforeEach(() => {
  _resetNetworkMode();
  vi.mocked(useBagTotalsPing).mockClear();
});

afterEach(() => {
  setForcedOffline(false);
  vi.restoreAllMocks();
});

describe('usePackingBags', () => {
  it('FE-PACK-BAGS-001: loads the bags and the weight in no bag while bag tracking is on', async () => {
    const list = vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK], unassigned_weight_grams: 450 });
    const { result } = setup();
    await waitFor(() => expect(result.current.bags).toEqual([BACKPACK]));
    expect(list).toHaveBeenCalledWith(7);
    expect(result.current.unassignedWeightGrams).toBe(450);
  });

  it('FE-PACK-BAGS-002: reads nothing while bag tracking is off, and starts once it is on', async () => {
    const list = vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK] });
    const { result, rerender } = setup(false);
    await act(async () => {});
    expect(list).not.toHaveBeenCalled();
    expect(result.current.bags).toEqual([]);
    expect(result.current.unassignedWeightGrams).toBeNull();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.bags).toEqual([BACKPACK]));
    // A response without the server sum leaves it unknown.
    expect(result.current.unassignedWeightGrams).toBeNull();
  });

  it('FE-PACK-BAGS-003: a failed read keeps what was there and says nothing', async () => {
    vi.spyOn(packingApi, 'listBags').mockRejectedValue(new Error('offline'));
    const { result, toast } = setup();
    await act(async () => {});
    expect(result.current.bags).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-PACK-BAGS-004: re-reads the totals on the room ping, and the server totals count only online', async () => {
    const list = vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [] });
    const { result } = setup();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    expect(useBagTotalsPing).toHaveBeenLastCalledWith(true, result.current.reloadBags);
    expect(result.current.serverWeightsFresh).toBe(true);
    act(() => setForcedOffline(true));
    expect(result.current.serverWeightsFresh).toBe(false);
  });

  it('FE-PACK-BAGS-005: a new bag takes the next colour and joins the list', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK] });
    const create = vi.spyOn(packingApi, 'createBag').mockResolvedValue({ bag: DUFFEL });
    const { result } = setup();
    await waitFor(() => expect(result.current.bags).toHaveLength(1));
    let created: PackingBag | undefined;
    await act(async () => {
      created = await result.current.createBag('Duffel');
    });
    expect(create).toHaveBeenCalledWith(7, { name: 'Duffel', color: BAG_COLORS[1] });
    expect(created).toEqual(DUFFEL);
    expect(result.current.bags).toEqual([BACKPACK, DUFFEL]);
  });

  it('FE-PACK-BAGS-006: a failed new bag is reported and comes back empty', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [] });
    vi.spyOn(packingApi, 'createBag').mockRejectedValue(new Error('x'));
    const { result, toast } = setup();
    let created: PackingBag | undefined = BACKPACK;
    await act(async () => {
      created = await result.current.createBag('Duffel');
    });
    expect(created).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith('packing.toast.saveError');
    expect(result.current.bags).toEqual([]);
  });

  it('FE-PACK-BAGS-007: an edit merges what the server returns into that bag only', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK, DUFFEL] });
    const update = vi
      .spyOn(packingApi, 'updateBag')
      .mockResolvedValue({ bag: { ...BACKPACK, name: 'Daypack', weight_limit_grams: 7000 } });
    const { result } = setup();
    await waitFor(() => expect(result.current.bags).toHaveLength(2));
    await act(async () => {
      await result.current.updateBag(1, { name: 'Daypack', weight_limit_grams: 7000 });
    });
    expect(update).toHaveBeenCalledWith(7, 1, { name: 'Daypack', weight_limit_grams: 7000 });
    expect(result.current.bags).toEqual([{ ...BACKPACK, name: 'Daypack', weight_limit_grams: 7000 }, DUFFEL]);
  });

  it('FE-PACK-BAGS-008: deleting and setting members change the list, and each failure has its message', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK, DUFFEL] });
    vi.spyOn(packingApi, 'setBagMembers').mockResolvedValue({ members: [{ user_id: 3, username: 'ada' }] });
    vi.spyOn(packingApi, 'deleteBag').mockResolvedValue({ ok: true });
    const { result } = setup();
    await waitFor(() => expect(result.current.bags).toHaveLength(2));
    await act(async () => {
      await result.current.setBagMembers(2, [3]);
    });
    expect(result.current.bags[1].members).toEqual([{ user_id: 3, username: 'ada' }]);
    await act(async () => {
      await result.current.deleteBag(1);
    });
    expect(result.current.bags.map((b) => b.id)).toEqual([2]);
  });

  it('FE-PACK-BAGS-009: failed edits, deletes and member changes leave the bags and say why', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [BACKPACK] });
    vi.spyOn(packingApi, 'updateBag').mockRejectedValue(new Error('x'));
    vi.spyOn(packingApi, 'deleteBag').mockRejectedValue(new Error('x'));
    vi.spyOn(packingApi, 'setBagMembers').mockRejectedValue(new Error('x'));
    const { result, toast } = setup();
    await waitFor(() => expect(result.current.bags).toHaveLength(1));
    await act(async () => {
      await result.current.updateBag(1, { name: 'Daypack' });
      await result.current.deleteBag(1);
      await result.current.setBagMembers(1, [3]);
    });
    expect(toast.error.mock.calls.map((c) => c[0])).toEqual([
      'common.error',
      'packing.toast.deleteError',
      'common.error',
    ]);
    expect(result.current.bags).toEqual([BACKPACK]);
  });

  it('FE-PACK-BAGS-010: tryCreateBag tells a write that went through from a failed one', async () => {
    vi.spyOn(packingApi, 'listBags').mockResolvedValue({ bags: [] });
    const create = vi.spyOn(packingApi, 'createBag').mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    const { result, toast } = setup();
    let first: unknown = 'unset';
    let second: unknown = 'unset';
    await act(async () => {
      first = await result.current.tryCreateBag('Duffel');
    });
    expect(first).toEqual({ bag: undefined });
    expect(toast.error).not.toHaveBeenCalled();
    await act(async () => {
      second = await result.current.tryCreateBag('Tote');
    });
    expect(second).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('packing.toast.saveError');
    expect(create).toHaveBeenCalledTimes(2);
  });
});
