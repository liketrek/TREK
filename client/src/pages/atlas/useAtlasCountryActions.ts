import { continentForCountry, type VisitStatus } from '@trek/shared';
import type React from 'react';
import { useEffect, useState } from 'react';

import apiClient from '../../api/client';
import { useToast } from '../../components/shared/Toast';
import { getApiErrorMessage, type TranslationFn } from '../../types';
import {
  findBucketDuplicate,
  isBucketDuplicateError,
  withCountryMarkedVisited,
  type AtlasData,
  type BucketItem,
} from './atlasModel';

/** The country or region the action popup is open on, and which step it shows. */
export interface AtlasConfirmAction {
  type: 'mark' | 'unmark' | 'choose' | 'bucket' | 'choose-region' | 'unmark-region';
  code: string;
  name: string;
  regionCode?: string;
  countryName?: string;
}

export interface VisitedRegion {
  code: string;
  name: string;
  placeCount: number;
  manuallyMarked?: boolean;
  status?: VisitStatus;
}

export type VisitedRegionMap = Record<string, VisitedRegion[]>;

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export interface AtlasCountryActionsOptions {
  t: TranslationFn;
  confirmAction: AtlasConfirmAction | null;
  setConfirmAction: SetState<AtlasConfirmAction | null>;
  setData: SetState<AtlasData | null>;
  visitedRegions: VisitedRegionMap;
  setVisitedRegions: SetState<VisitedRegionMap>;
  bucketList: BucketItem[];
  setBucketList: SetState<BucketItem[]>;
  handleDeleteBucketItem: (id: number) => Promise<void>;
}

/** The bucket list target of a month and year picker: YYYY-MM, or null unless both are set. */
export function bucketMonthTarget(month: number, year: number): string | null {
  return month > 0 && year > 0 ? `${year}-${String(month).padStart(2, '0')}` : null;
}

/** The visited regions with a hand marked region added to its country, unless it is there already. */
export function withRegionMarked(prev: VisitedRegionMap, countryCode: string, region: VisitedRegion): VisitedRegionMap {
  const existing = prev[countryCode] || [];
  if (existing.find((r) => r.code === region.code)) return prev;
  return { ...prev, [countryCode]: [...existing, region] };
}

/** The visited regions without one region; a country left with none drops out. */
export function withRegionUnmarked(prev: VisitedRegionMap, countryCode: string, regionCode: string): VisitedRegionMap {
  const remaining = (prev[countryCode] || []).filter((r) => r.code !== regionCode);
  const next = { ...prev, [countryCode]: remaining };
  if (remaining.length === 0) delete next[countryCode];
  return next;
}

/**
 * The atlas once a region is unmarked: if no visible region of the country remains
 * (however a region was derived: the server hides it either way and cascades to the
 * country the same way), the country goes too, but only when it has no place or trip
 * of its own. A country with real places is never hidden server side (#1490), so
 * removing it here would only flash and reappear on the next load.
 */
export function withCountryDroppedAfterRegionUnmark(
  prev: AtlasData | null,
  countryCode: string,
  regionCode: string,
  visitedRegions: VisitedRegionMap
): AtlasData | null {
  if (!prev) return prev;
  const c = prev.countries.find((c) => c.code === countryCode);
  if (!c || c.placeCount > 0 || c.tripCount > 0) return prev;
  const remainingRegions = (visitedRegions[countryCode] || []).filter((r) => r.code !== regionCode);
  if (remainingRegions.length > 0) return prev;
  const cont = continentForCountry(countryCode);
  return {
    ...prev,
    countries: prev.countries.filter((c) => c.code !== countryCode),
    stats: { ...prev.stats, totalCountries: Math.max(0, prev.stats.totalCountries - 1) },
    continents: { ...prev.continents, [cont]: Math.max(0, (prev.continents?.[cont] || 0) - 1) },
  };
}

/**
 * What the country / region action popup does, behind both the desktop dialog and the
 * phone sheet (which render their own markup and their own bucket list date picker):
 * mark a country or a region visited, unmark a region, put the country or region on
 * the bucket list for a target month, or take the country off it again.
 */
export function useAtlasCountryActions({
  t,
  confirmAction,
  setConfirmAction,
  setData,
  visitedRegions,
  setVisitedRegions,
  bucketList,
  setBucketList,
  handleDeleteBucketItem,
}: AtlasCountryActionsOptions) {
  const toast = useToast();
  // The phone picker: one YYYY-MM month input, cleared whenever the popup closes.
  const [bucketDate, setBucketDate] = useState('');

  useEffect(() => {
    if (!confirmAction) setBucketDate('');
  }, [confirmAction]);

  const markCountry = async (): Promise<void> => {
    if (!confirmAction) return;
    const { code } = confirmAction;
    try {
      await apiClient.post(`/addons/atlas/country/${code}/mark`);
      setData((prev) => (prev ? withCountryMarkedVisited(prev, code) : prev));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
    setConfirmAction(null);
  };

  /** `withVisitedStatus` stores the new region as visited outright (the phone sheet). */
  const markRegion = async (withVisitedStatus = false): Promise<void> => {
    if (!confirmAction) return;
    const { code: countryCode, name: regionName, regionCode } = confirmAction;
    if (!regionCode) return;
    try {
      await apiClient.post(`/addons/atlas/region/${regionCode}/mark`, { name: regionName, country_code: countryCode });
      const region: VisitedRegion = withVisitedStatus
        ? { code: regionCode, name: regionName, placeCount: 0, status: 'visited', manuallyMarked: true }
        : { code: regionCode, name: regionName, placeCount: 0, manuallyMarked: true };
      setVisitedRegions((prev) => withRegionMarked(prev, countryCode, region));
      setData((prev) => (prev ? withCountryMarkedVisited(prev, countryCode) : prev));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
    setConfirmAction(null);
  };

  const unmarkRegion = async (): Promise<void> => {
    if (!confirmAction) return;
    const { code: countryCode, regionCode } = confirmAction;
    if (!regionCode) return;
    try {
      await apiClient.delete(`/addons/atlas/region/${regionCode}/mark`);
      setVisitedRegions((prev) => withRegionUnmarked(prev, countryCode, regionCode));
      setData((prev) => withCountryDroppedAfterRegionUnmark(prev, countryCode, regionCode, visitedRegions));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
    setConfirmAction(null);
  };

  /**
   * Adds the bucket list entry for the target month and closes the popup, running
   * `beforeClose` first (the desktop dialog resets its month and year picker there).
   * A duplicate keeps the popup open and the picker as it is, so another month can be
   * picked right away (#1898).
   */
  const addBucket = async (targetDate: string | null, beforeClose?: () => void): Promise<void> => {
    if (!confirmAction) return;
    const entry = { name: confirmAction.name, country_code: confirmAction.code, target_date: targetDate };
    if (findBucketDuplicate(bucketList, { ...entry, lat: null, lng: null })) {
      toast.error(t('atlas.bucketDuplicate'));
      return;
    }
    try {
      // A region wish hatches that region on the map, not the whole country (#1901).
      const r = await apiClient.post('/addons/atlas/bucket-list', {
        ...entry,
        region_code: confirmAction.regionCode ?? null,
      });
      setBucketList((prev) => [r.data.item, ...prev]);
    } catch (err) {
      if (isBucketDuplicateError(err)) {
        toast.error(t('atlas.bucketDuplicate'));
        return;
      }
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
    beforeClose?.();
    setConfirmAction(null);
  };

  /** The phone sheet: its month input, cleared by the close itself. */
  const addBucketForDate = () => addBucket(bucketDate || null);

  // A country can sit on the bucket list more than once (one entry per place and
  // target date), so taking it off the wishlist drops every entry for that code.
  const wishlistItems = confirmAction ? bucketList.filter((b) => b.country_code === confirmAction.code) : [];
  const removeBucket = async (): Promise<void> => {
    if (!confirmAction) return;
    await Promise.all(wishlistItems.map((item) => handleDeleteBucketItem(item.id)));
    setConfirmAction(null);
  };

  return {
    bucketDate,
    setBucketDate,
    onWishlist: wishlistItems.length > 0,
    markCountry,
    markRegion,
    unmarkRegion,
    addBucket,
    addBucketForDate,
    removeBucket,
  };
}
