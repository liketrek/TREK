import type { PackingUpdateBagRequest } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';

import { packingApi } from '../../api/client';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import type { PackingBag } from '../../types';
import { BAG_COLORS } from './packingListPanel.constants';
import { useBagTotalsPing } from './useBagTotalsPing';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  error: (message: string) => void;
}

/**
 * The trip's bags behind both packing lists: the bags with their server-summed
 * weights, kept fresh by the room's totals ping, and the bag writes. The desktop
 * panel and the phone tab draw their own bag sidebar, modal or sheet over it.
 */
export function usePackingBags({
  tripId,
  bagTrackingEnabled,
  t,
  toast,
}: {
  tripId: number;
  bagTrackingEnabled: boolean;
  t: Translate;
  toast: Toaster;
}) {
  const [bags, setBags] = useState<PackingBag[]>([]);
  /** Server-summed weight of everything in no bag (#2191); null until the first load. */
  const [unassignedWeightGrams, setUnassignedWeightGrams] = useState<number | null>(null);

  const reloadBags = useCallback(async () => {
    if (!bagTrackingEnabled) return;
    try {
      const r = await packingApi.listBags(tripId);
      setBags(r.bags || []);
      setUnassignedWeightGrams(r.unassigned_weight_grams ?? null);
    } catch {
      // Offline or a failed read: the surfaces fall back to the local sum
      // (see `serverWeightsFresh` below), so there is nothing to roll back.
    }
  }, [tripId, bagTrackingEnabled]);

  useEffect(() => {
    void reloadBags();
  }, [reloadBags]);

  // Bag weights are summed server-side across every member (#2191), so an item
  // this viewer may not even see still moves them. The item events cannot carry
  // that (a private item is delivered only to its owner, which is the very rule
  // that made the totals wrong), so the server pings the room content-free and
  // we re-read the numbers.
  useBagTotalsPing(bagTrackingEnabled, reloadBags);

  // Bags are not part of the offline cache (no repo, no Dexie table), so while
  // offline the server totals are frozen at the last online read and cannot see
  // the optimistic item writes the mutation queue is holding. A stale absolute
  // number measured against an airline limit is worse than an honest partial
  // one, so offline the surfaces sum what they can see instead (#2191).
  const { offline } = useNetworkMode();
  const serverWeightsFresh = !offline;

  /**
   * Creates a bag in the next colour. Resolves to the server's answer once the
   * write went through, even when that answer carries no bag, or to null once
   * the failure is reported.
   */
  const tryCreateBag = async (name: string): Promise<{ bag: PackingBag } | null> => {
    try {
      const data = await packingApi.createBag(tripId, { name, color: BAG_COLORS[bags.length % BAG_COLORS.length] });
      setBags((prev) => [...prev, data.bag]);
      return { bag: data.bag };
    } catch {
      toast.error(t('packing.toast.saveError'));
      return null;
    }
  };

  /** Creates a bag in the next colour; the new bag, or undefined once the failure is reported. */
  const createBag = async (name: string): Promise<PackingBag | undefined> => (await tryCreateBag(name))?.bag;

  const updateBag = async (bagId: number, data: PackingUpdateBagRequest) => {
    try {
      const result = await packingApi.updateBag(tripId, bagId, data);
      setBags((prev) => prev.map((b) => (b.id === bagId ? { ...b, ...result.bag } : b)));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const deleteBag = async (bagId: number) => {
    try {
      await packingApi.deleteBag(tripId, bagId);
      setBags((prev) => prev.filter((b) => b.id !== bagId));
    } catch {
      toast.error(t('packing.toast.deleteError'));
    }
  };

  const setBagMembers = async (bagId: number, userIds: number[]) => {
    try {
      const result = await packingApi.setBagMembers(tripId, bagId, userIds);
      setBags((prev) => prev.map((b) => (b.id === bagId ? { ...b, members: result.members } : b)));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return {
    bags,
    unassignedWeightGrams,
    serverWeightsFresh,
    reloadBags,
    tryCreateBag,
    createBag,
    updateBag,
    deleteBag,
    setBagMembers,
  };
}
