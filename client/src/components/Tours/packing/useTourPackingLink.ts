import {
  linkedPackingItems,
  packingCategoriesOf,
  type LinkedPackingItems,
  type PackingCategoryChoice,
  type TourListItem,
  type TourPackingLink,
} from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { translateApiError, useTranslation } from '../../../i18n';
import { tourPackingLinkRepo } from '../../../repo/tourPackingLinkRepo';
import { useAddonStore } from '../../../store/addonStore';
import { useTripStore } from '../../../store/tripStore';
import type { PackingItem } from '../../../types';
import { packingCategoryOrder, packingViewItems } from '../../Packing/packingListModel';
import { katColor } from '../../Packing/packingListPanel.helpers';
import { useToast } from '../../shared/Toast';

/** The link as read for one tour, so a newer tour never shows an older tour's answer. */
interface LinkAnswer {
  key: string;
  status: 'ready' | 'error';
  link: TourPackingLink | null;
}

/** What the section shows: nothing known yet, the read failed, or the link as it reads now. */
type TourPackingStatus = 'loading' | 'error' | 'ready';

/** A category the dialog offers, with the colour the packing list gives it. */
interface TourPackingCategory extends PackingCategoryChoice {
  color: string;
}

/**
 * P2D-XD-01: the packing list a tour points at, for its detail. The link is
 * read through the offline core whenever the tour reloads (another traveller
 * may have changed it); the items come live from the trip's packing list as
 * this user may see it, so ticking an item off in Packing shows here at once.
 * The dialog chooses what to point at and writes only on its confirm; letting
 * go writes nothing to the packing list either.
 */
export function useTourPackingLink({ tripId, tour }: { tripId: number; tour: TourListItem }) {
  const { t } = useTranslation();
  const toast = useToast();
  const packingEnabled = useAddonStore((state) => state.isEnabled('packing'));
  const items = useTripStore((state) => state.packingItems);
  const placeId = tour.place_id;
  const key = `${tripId}:${placeId}`;
  const [answer, setAnswer] = useState<LinkAnswer | null>(null);
  const [reloads, setReloads] = useState(0);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    tourPackingLinkRepo.read(tripId, placeId, controller.signal).then(
      (link) => {
        if (!controller.signal.aborted) setAnswer({ key, status: 'ready', link });
      },
      () => {
        if (!controller.signal.aborted) setAnswer({ key, status: 'error', link: null });
      }
    );
    return () => controller.abort();
    // `tour` is replaced when the trip's tours reload, which is when the link may have changed elsewhere.
  }, [key, tripId, placeId, tour, reloads]);

  const current = answer?.key === key ? answer : null;
  const status: TourPackingStatus = current?.status ?? 'loading';
  const link = current?.link ?? null;

  const linked = useMemo<LinkedPackingItems<PackingItem> | null>(
    () => (link ? linkedPackingItems(link, items) : null),
    [link, items]
  );
  const defaultCategory = t('packing.defaultCategory');
  const categories = useMemo<TourPackingCategory[]>(() => {
    // The colours of the shared list, as the packing list shows it first.
    const order = packingCategoryOrder(packingViewItems(items, 'common'), defaultCategory);
    return packingCategoriesOf(items).map((category) => ({ ...category, color: katColor(category.name, order) }));
  }, [items, defaultCategory]);
  const wholeCount = useMemo(() => linkedPackingItems({ category: null }, items).items.length, [items]);
  const linkedColor = link?.category ? (categories.find((c) => c.name === link.category)?.color ?? null) : null;

  const show = useCallback(() => {
    setChoice(link?.category ?? null);
    setOpen(true);
  }, [link]);
  const close = useCallback(() => {
    if (!saving) setOpen(false);
  }, [saving]);
  const retry = useCallback(() => setReloads((count) => count + 1), []);

  const settle = async (write: () => Promise<TourPackingLink | null>, done: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const next = await write();
      setAnswer({ key, status: 'ready', link: next });
      setOpen(false);
      toast.success(done);
    } catch (err: unknown) {
      toast.error(translateApiError(t, err, 'tours.packing.failed'));
    } finally {
      setSaving(false);
    }
  };
  const confirm = () =>
    settle(() => tourPackingLinkRepo.link(tripId, placeId, { category: choice }), t('tours.packing.linked'));
  const unlink = () => settle(() => tourPackingLinkRepo.unlink(tripId, placeId), t('tours.packing.unlinked'));

  /** The choice already is what the tour points at, so linking again would change nothing. */
  const unchanged = link !== null && link.category === choice;

  return {
    packingEnabled,
    status,
    link,
    linked,
    linkedColor,
    categories,
    wholeCount,
    open,
    choice,
    saving,
    canConfirm: !saving && !unchanged,
    show,
    close,
    choose: setChoice,
    confirm,
    unlink,
    retry,
  };
}

export type TourPackingLinkController = ReturnType<typeof useTourPackingLink>;
