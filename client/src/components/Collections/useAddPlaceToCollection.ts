import type { CollectionLink, CollectionStatus } from '@trek/shared';
import type React from 'react';
import { useEffect, useEffectEvent, useState } from 'react';

import { mapsApi } from '../../api/client';
import { collectionsApi } from '../../api/collections';
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage';
import { getApiErrorMessage as errorWithMessage, type TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { parseCoordinatePair } from '../Planner/PlaceFormModal.helpers';
import { useToast } from '../shared/Toast';
import { type MapsPlace, num, str } from './addPlaceModel';

interface CommonOptions {
  open: boolean;
  /** The list the place goes into. On the phone null, when opened from "All saved": the list is picked in the sheet. */
  collectionId: number | null;
  collectionName: string;
  t: TranslationFn;
  onClose: () => void;
  onAdded: () => void;
}

/**
 * The two shells read the form differently, and each keeps its own reading.
 *
 * `dialog` (desktop): stays open after an add, so the form resets for the next place;
 * the coordinates are typed or pasted, links ride along, a search that finds nothing
 * says so, and an error without a server message shows the error's own text.
 *
 * `sheet` (phone): closes after an add, the target list may be picked in the sheet,
 * the coordinates come from the picked hit only, a search or save already running is
 * not started again, and an error without a server message shows the fallback.
 */
export type AddPlaceToCollectionOptions = CommonOptions &
  (
    | {
        variant: 'dialog';
        /** How a typed link becomes the stored one. */
        normalizeLinkUrl: (url: string) => string;
        /** Runs after an add, once the form is reset for the next place. */
        afterAdd?: () => void;
      }
    | {
        variant: 'sheet';
        /** The pickable target lists, for an opening without a fixed list. */
        lists: { id: number; name: string }[];
      }
  );

const NO_LISTS: { id: number; name: string }[] = [];

/**
 * Adding a place to a collection list: the one logic path behind the desktop dialog and
 * the phone sheet, which render their own markup over it. A maps search fills the name
 * and the location when a hit is picked, the rest is typed, and the save goes to the
 * list (duplicates are reported by the server and surface as a toast).
 */
export function useAddPlaceToCollection(options: AddPlaceToCollectionOptions) {
  const { open, collectionId, collectionName, t, onClose, onAdded } = options;
  const lists = options.variant === 'sheet' ? options.lists : NO_LISTS;
  const sheet = options.variant === 'sheet';
  const placeLang = usePlaceLanguage();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapsPlace[]>([]);
  const [searching, setSearching] = useState(false);
  // A search that came back empty used to render nothing at all, which reads as
  // "the dialog is dead". Say so instead (#1921).
  const [noResults, setNoResults] = useState(false);
  // The picked location (address/coords/ids) plus the editable fields.
  const [picked, setPicked] = useState<MapsPlace | null>(null);
  const [name, setName] = useState('');
  // Address + coordinates: prefilled from a picked result, but also directly
  // typeable so a place can be added by GPS without searching (#1435).
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<CollectionLink[]>([]);
  const [status, setStatus] = useState<CollectionStatus>('idea');
  const [saving, setSaving] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(collectionId);

  const errorText = sheet ? getApiErrorMessage : errorWithMessage;

  const reset = () => {
    setQuery('');
    setResults([]);
    setNoResults(false);
    setPicked(null);
    setName('');
    setAddress('');
    setLat('');
    setLng('');
    setCategoryId(null);
    setDescription('');
    setLinks([]);
    setStatus('idea');
  };

  const resetOnClose = useEffectEvent(() => {
    reset();
    if (sheet) setTargetId(null);
  });
  useEffect(() => {
    if (!open) resetOnClose();
  }, [open]);

  // Opened from a specific list → target is fixed; from "All Saved" (no active
  // list) → default to the sole list if there is one, else pick it in-sheet.
  // The lists may still be loading when the sheet opens, so the default is
  // applied again once they arrive, without overruling a pick already made.
  useEffect(() => {
    if (!sheet || !open) return;
    if (collectionId != null) {
      setTargetId(collectionId);
      return;
    }
    setTargetId((prev) =>
      prev != null && lists.some((l) => l.id === prev) ? prev : lists.length === 1 ? lists[0].id : null
    );
  }, [sheet, open, collectionId, lists]);

  const search = async () => {
    if (!query.trim() || (sheet && searching)) return;
    setSearching(true);
    if (!sheet) setNoResults(false);
    try {
      const res = await mapsApi.search(query, placeLang);
      const places = (res.places as MapsPlace[]) || [];
      setResults(places);
      if (!sheet) setNoResults(places.length === 0);
    } catch (err) {
      toast.error(errorText(err, t('places.mapsSearchError')));
    } finally {
      setSearching(false);
    }
  };

  const dismissResults = () => {
    setResults([]);
    setNoResults(false);
  };

  const pick = (r: MapsPlace) => {
    setPicked(r);
    setName(str(r.name) ?? '');
    setAddress(str(r.address) ?? '');
    if (!sheet) {
      const la = num(r.lat);
      const lo = num(r.lng);
      setLat(la != null ? String(la) : '');
      setLng(lo != null ? String(lo) : '');
    }
    setResults([]);
    if (!sheet) setNoResults(false);
    setQuery(str(r.name) ?? query);
  };

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  /** "48.85, 2.35" pasted into either coordinate fills both halves. */
  const coordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pair = parseCoordinatePair(e.clipboardData.getData('text'));
    if (pair) {
      e.preventDefault();
      setLat(pair[0]);
      setLng(pair[1]);
    }
  };

  const save = async () => {
    const cleanName = name.trim();
    const target = sheet ? targetId : collectionId;
    if (!cleanName || target == null || (sheet && saving)) return;
    const latNum = lat.trim() ? Number(lat) : Number.NaN;
    const lngNum = lng.trim() ? Number(lng) : Number.NaN;
    setSaving(true);
    try {
      const res = await collectionsApi.savePlace({
        collection_id: target,
        name: cleanName,
        address: address.trim() || null,
        lat: sheet ? ((picked && num(picked.lat)) ?? null) : Number.isFinite(latNum) ? latNum : null,
        lng: sheet ? ((picked && num(picked.lng)) ?? null) : Number.isFinite(lngNum) ? lngNum : null,
        google_place_id: (picked && str(picked.google_place_id)) ?? null,
        google_ftid: (picked && str(picked.google_ftid)) ?? null,
        osm_id: (picked && str(picked.osm_id)) ?? null,
        website: (picked && str(picked.website)) ?? null,
        phone: (picked && str(picked.phone)) ?? null,
        category_id: categoryId,
        description: description.trim() || null,
        ...(options.variant === 'dialog'
          ? {
              links: links
                .map((l) => ({ label: l.label?.trim() || undefined, url: options.normalizeLinkUrl(l.url) }))
                .filter((l) => l.url),
            }
          : {}),
        status,
        force: true,
      });
      if (res.duplicate) toast.info(t('collections.duplicateWarning'));
      else {
        const listName = sheet ? (lists.find((l) => l.id === target)?.name ?? collectionName) : collectionName;
        toast.success(t('collections.addedToList', { name: listName }));
        onAdded();
      }
      if (options.variant === 'sheet') onClose();
      else {
        reset();
        options.afterAdd?.();
      }
    } catch (err) {
      toast.error(errorText(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    setResults,
    searching,
    noResults,
    setNoResults,
    dismissResults,
    name,
    setName,
    address,
    setAddress,
    lat,
    setLat,
    lng,
    setLng,
    categoryId,
    setCategoryId,
    description,
    setDescription,
    links,
    setLinks,
    setLink,
    status,
    setStatus,
    saving,
    targetId,
    setTargetId,
    search,
    pick,
    coordPaste,
    save,
  };
}
