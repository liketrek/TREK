import type { Collection, CollectionLink } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useCollectionStore } from '../../store/collectionStore';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

export interface CoverSearchPhoto {
  id: string;
  url: string;
  thumb: string;
  description?: string | null;
  photographer?: string | null;
}

export interface ListEditorOptions {
  /** null = closed, 'new' = create, a Collection = edit that list. */
  target: Collection | 'new' | null;
  onClose: () => void;
  onCreated: (id: number) => void;
  t: TranslationFn;
  /** The colour a new list starts with. */
  defaultColor: string;
  /** Keep editing the last target while it is cleared (a sheet holds it through its exit animation). */
  holdLastTarget?: boolean;
  /** The collections model's link normaliser, injected so this hook needs nothing from pages/. */
  normalizeLinkUrl: (url: string) => string;
}

/** Links with a trimmed label and a normalised url; rows without a url are dropped. */
export function cleanListLinks(links: CollectionLink[], normalizeLinkUrl: (url: string) => string): CollectionLink[] {
  return links.map((l) => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter((l) => l.url);
}

/**
 * Create or edit a list (name, colour, cover from an upload or an Unsplash search,
 * description and links): the logic behind both the desktop dialog and the phone sheet,
 * which render their own markup over it. On create it makes the list, then uploads the
 * cover to the new id; on edit it patches and uploads again.
 */
export function useListEditor({
  target,
  onClose,
  onCreated,
  t,
  defaultColor,
  holdLastTarget = false,
  normalizeLinkUrl,
}: ListEditorOptions) {
  const createCollection = useCollectionStore((s) => s.createCollection);
  const updateCollection = useCollectionStore((s) => s.updateCollection);
  const uploadCover = useCollectionStore((s) => s.uploadCover);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [held, setHeld] = useState<Collection | 'new' | null>(target);
  if (holdLastTarget && target && target !== held) setHeld(target);
  const shown = holdLastTarget ? held : target;
  const editing = shown && shown !== 'new' ? shown : null;

  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColor);
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<CollectionLink[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingUnsplashUrl, setPendingUnsplashUrl] = useState<string | null>(null);
  const [coverQuery, setCoverQuery] = useState('');
  const [coverResults, setCoverResults] = useState<CoverSearchPhoto[]>([]);
  const [searchingCover, setSearchingCover] = useState(false);
  const coverSeq = useRef(0);
  const [saving, setSaving] = useState(false);
  // Remembers a freshly created list id so a retry after a cover upload failure
  // updates it instead of creating a duplicate list.
  const [createdId, setCreatedId] = useState<number | null>(null);
  const objectUrl = useRef<string | null>(null);

  const dropObjectUrl = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  // (Re)seed the form whenever the target changes.
  useEffect(() => {
    if (!target) return;
    const edit = target !== 'new' ? target : null;
    setName(edit?.name ?? '');
    setColor(edit?.color ?? defaultColor);
    setDescription(edit?.description ?? '');
    setLinks(edit?.links ?? []);
    setCoverFile(null);
    dropObjectUrl();
    setCoverPreview(edit?.cover_image ?? null);
    setPendingUnsplashUrl(null);
    setCoverQuery('');
    setCoverResults([]);
    setCreatedId(null);
  }, [target, defaultColor, dropObjectUrl]);

  // Revoke the last preview blob on unmount.
  useEffect(() => () => dropObjectUrl(), [dropObjectUrl]);

  // A create that only failed at the cover step already produced the list:
  // hand it over on the way out instead of leaving it behind unnoticed.
  const close = () => {
    if (createdId != null) onCreated(createdId);
    onClose();
  };

  const pickCover = (file: File | undefined) => {
    if (!file) return;
    dropObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setCoverFile(file);
    setCoverPreview(url);
    setPendingUnsplashUrl(null); // an uploaded file wins over a picked Unsplash photo
  };

  const searchCover = async () => {
    const query = coverQuery.trim() || name.trim();
    if (!query) return;
    const seq = ++coverSeq.current;
    setSearchingCover(true);
    try {
      const data = await tripsApi.searchCoverImages(query);
      if (seq !== coverSeq.current) return;
      setCoverResults(data.photos || []);
    } catch {
      if (seq === coverSeq.current) setCoverResults([]);
    } finally {
      if (seq === coverSeq.current) setSearchingCover(false);
    }
  };

  const pickUnsplash = (photo: CoverSearchPhoto) => {
    if (!photo.url) return;
    dropObjectUrl();
    setCoverFile(null);
    setPendingUnsplashUrl(photo.url);
    setCoverPreview(photo.url);
  };

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const save = async () => {
    const trimmed = name.trim();
    // Enter fires while the create is still in flight, and `createdId` is only
    // set once it comes back; without this the second one creates a second list.
    if (!trimmed || saving) return;
    const payload = {
      name: trimmed,
      color,
      description: description.trim() || null,
      links: cleanListLinks(links, normalizeLinkUrl),
      ...(pendingUnsplashUrl ? { cover_image: pendingUnsplashUrl } : {}),
    };
    setSaving(true);
    try {
      let id = editing?.id ?? createdId;
      if (id != null) {
        await updateCollection(id, payload);
      } else {
        const created = await createCollection(payload);
        id = created?.id ?? null;
        setCreatedId(id);
      }
      if (id != null && coverFile) await uploadCover(id, coverFile);
      if (!editing && id != null) onCreated(id);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return {
    editing,
    fileRef,
    name,
    setName,
    color,
    setColor,
    description,
    setDescription,
    links,
    setLinks,
    setLink,
    coverPreview,
    coverQuery,
    setCoverQuery,
    coverResults,
    searchingCover,
    saving,
    close,
    pickCover,
    searchCover,
    pickUnsplash,
    save,
  };
}
