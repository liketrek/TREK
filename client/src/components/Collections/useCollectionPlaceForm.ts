import type { CollectionLabel, CollectionLink, CollectionPlace } from '@trek/shared';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mapsApi } from '../../api/client';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { normalizeImageFile } from '../../utils/convertHeic';
import { useToast } from '../shared/Toast';
import { cleanListLinks } from './useListEditor';

export interface CollectionPlacePatch {
  name?: string;
  description?: string | null;
  links?: CollectionLink[];
  category_id?: number | null;
  label_ids?: number[];
  image_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}

export interface CollectionPlaceFormOptions {
  place: CollectionPlace | null;
  labels: CollectionLabel[];
  onSave: (patch: CollectionPlacePatch) => Promise<void>;
  onUploadImage?: (file: File) => Promise<void>;
  t: TranslationFn;
  /** The collections model's link normaliser, injected so this hook needs nothing from pages/. */
  normalizeLinkUrl: (url: string) => string;
  /** Keep showing the last place while it is cleared (a sheet holds it through its exit animation). */
  holdLastPlace?: boolean;
  /** The form edits the coordinates too, and a save sends them (the desktop detail). */
  withCoordinates?: boolean;
  /**
   * Drop a cover photo still being fetched as soon as the place object changes, not
   * only when a different place opens (the phone sheet).
   */
  dropPhotoOnPlaceUpdate?: boolean;
}

/** What the maps provider looks a place photo up by: its Google or OSM id, else its coordinates. */
export function placePhotoLookupId(place: CollectionPlace): string | null {
  return (
    place.google_place_id ||
    place.osm_id ||
    (place.lat != null && place.lng != null ? `${place.lat},${place.lng}` : null)
  );
}

/** A coordinate field's number, or null when it is blank or not a number. */
export function parseCoordinate(value: string): number | null {
  const n = value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

const coordText = (v: number | null | undefined) => (v != null ? String(v) : '');

/**
 * The saved place detail behind both the desktop detail sheet and the phone sheet,
 * which render their own markup over it: the edit form (reseeded whenever a different
 * place opens), the cover photo fetched from the maps provider for a place without
 * its own image, the custom cover upload and removal, and the save.
 */
export function useCollectionPlaceForm({
  place,
  labels,
  onSave,
  onUploadImage,
  t,
  normalizeLinkUrl,
  holdLastPlace = false,
  withCoordinates = false,
  dropPhotoOnPlaceUpdate = false,
}: CollectionPlaceFormOptions) {
  const toast = useToast();
  const [held, setHeld] = useState<CollectionPlace | null>(place);
  if (holdLastPlace && place && place !== held) setHeld(place);
  const shown = holdLastPlace ? held : place;

  const [imgBusy, setImgBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shown?.name ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(shown?.category_id ?? null);
  const [description, setDescription] = useState(shown?.description ?? '');
  const [links, setLinks] = useState<CollectionLink[]>(shown?.links ?? []);
  const [labelIds, setLabelIds] = useState<number[]>(shown?.label_ids ?? []);
  const [address, setAddress] = useState(shown?.address ?? '');
  const [lat, setLat] = useState(coordText(shown?.lat));
  const [lng, setLng] = useState(coordText(shown?.lng));
  const [saving, setSaving] = useState(false);
  // A higher res photo pulled from the maps provider when the place has none of
  // its own; the list avatar's little thumbnail is too low res for the cover.
  const [fetchedPhoto, setFetchedPhoto] = useState<string | null>(null);
  // Bumped to drop a photo still on its way; an object so a cleanup can hold on to it.
  const photoSeq = useRef({ n: 0 });

  const resetForm = useCallback((p: CollectionPlace) => {
    setEditing(false);
    setName(p.name);
    setCategoryId(p.category_id ?? null);
    setDescription(p.description ?? '');
    setLinks(p.links ?? []);
    setLabelIds(p.label_ids ?? []);
    setAddress(p.address ?? '');
    setLat(coordText(p.lat));
    setLng(coordText(p.lng));
  }, []);

  // Reseed the form and fetch the cover only when a DIFFERENT place opens (keyed on
  // the id, not on every field).
  const seededId = useRef<number | null>(null);
  const shownId = shown?.id;
  useEffect(() => {
    if (!shown || seededId.current === shown.id) return;
    seededId.current = shown.id;
    resetForm(shown);
    setFetchedPhoto(null);
    const seq = ++photoSeq.current.n;
    if (shown.image_url) return;
    const photoId = placePhotoLookupId(shown);
    if (!photoId) return;
    mapsApi
      .placePhoto(photoId, shown.lat ?? undefined, shown.lng ?? undefined, shown.name)
      .then((res) => {
        if (seq === photoSeq.current.n && res?.photoUrl) setFetchedPhoto(res.photoUrl);
      })
      .catch(() => {});
  }, [shown, shownId, resetForm]);

  // A photo still on its way belongs to the place object it was asked for (the sheet),
  // or to the place id (the detail); either way it is dropped on unmount.
  useEffect(() => {
    if (!dropPhotoOnPlaceUpdate) return;
    const seq = photoSeq.current;
    return () => {
      seq.n++;
    };
  }, [shown, dropPhotoOnPlaceUpdate]);
  // Forgetting the seeded id lets a remount (strict mode in dev) reseed and fetch again.
  useEffect(() => {
    const seq = photoSeq.current;
    const seeded = seededId;
    return () => {
      seq.n++;
      seeded.current = null;
    };
  }, []);

  const cover = shown?.image_url || fetchedPhoto;

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !shown || !onUploadImage) return;
    setImgBusy(true);
    try {
      await onUploadImage(await normalizeImageFile(file));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.imageUploadError')));
    } finally {
      setImgBusy(false);
    }
  };

  const handleImageRemove = async () => {
    setImgBusy(true);
    try {
      await onSave({ image_url: null });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.imageUploadError')));
    } finally {
      setImgBusy(false);
    }
  };

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const toggleLabel = (id: number) =>
    setLabelIds(labelIds.includes(id) ? labelIds.filter((x) => x !== id) : [...labelIds, id]);
  const cancelEdit = () => {
    if (shown) resetForm(shown);
  };
  const assignedLabels = labels.filter((l) => (shown?.label_ids ?? []).includes(l.id));

  const save = async () => {
    if (!shown) return;
    const base = {
      name: name.trim() || shown.name,
      description: description.trim() || null,
      links: cleanListLinks(links, normalizeLinkUrl),
      category_id: categoryId,
      label_ids: labelIds,
      address: address.trim() || null,
    };
    setSaving(true);
    try {
      await onSave(withCoordinates ? { ...base, lat: parseCoordinate(lat), lng: parseCoordinate(lng) } : base);
      setEditing(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return {
    shown,
    editing,
    setEditing,
    name,
    setName,
    categoryId,
    setCategoryId,
    description,
    setDescription,
    links,
    setLinks,
    setLink,
    labelIds,
    toggleLabel,
    address,
    setAddress,
    lat,
    setLat,
    lng,
    setLng,
    saving,
    imgBusy,
    cover,
    assignedLabels,
    handleImagePick,
    handleImageRemove,
    cancelEdit,
    save,
  };
}
