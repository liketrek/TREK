import { useEffect, useRef, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../types';
import { normalizeImageFile } from '../../utils/convertHeic';
import { useToast } from '../shared/Toast';

interface CoverSearchPhoto {
  id: string;
  url: string;
  thumb: string;
  description?: string | null;
  photographer?: string | null;
  link?: string | null;
}

interface TripCoverPickerOptions {
  /** The trip being edited, or null while creating one. */
  trip: { id: number } | null;
  /** Falls back as the Unsplash query when the search field is empty. */
  title: string;
  onCoverUpdate?: (tripId: number, coverUrl: string | null) => void;
  /**
   * Release a staged file's blob url as soon as the preview moves on (the phone
   * sheet). Otherwise it is released when another file replaces it, on reset and
   * on unmount (the desktop dialog).
   */
  releasePreviewOnChange: boolean;
}

/**
 * The cover of the create/edit trip form: device upload and Unsplash search. While
 * editing, a pick is saved on the trip straight away; while creating, it is staged
 * and `applyToCreatedTrip` saves it once the trip exists.
 */
export function useTripCoverPicker({ trip, title, onCoverUpdate, releasePreviewOnChange }: TripCoverPickerOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const isEditing = !!trip;
  const coverSearchSeq = useRef(0);
  // The staged cover lives on as an object URL until it is replaced or the form goes.
  const previewUrlRef = useRef<string | null>(null);

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingUnsplashUrl, setPendingUnsplashUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoverSearchPhoto[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Server and Unsplash urls are left alone; only a local file preview is a blob url.
  useEffect(() => {
    if (!releasePreviewOnChange || !coverPreview?.startsWith('blob:')) return;
    return () => {
      URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview, releasePreviewOnChange]);

  // A staged cover that never got uploaded would otherwise pin the full image for
  // as long as the tab lives.
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  /** Back to a clean picker showing `preview` (the trip's stored cover, or none). */
  const resetCover = (preview: string | null) => {
    setCoverPreview(preview);
    setSearchQuery('');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPendingCoverFile(null);
    setPendingUnsplashUrl(null);
    setSearchResults([]);
    setSearchError('');
  };

  const stagePreview = (file: File) => {
    if (releasePreviewOnChange) {
      setCoverPreview(URL.createObjectURL(file));
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(file);
    setCoverPreview(previewUrlRef.current);
  };

  const uploadCoverNow = async (tripId: number, file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const data = await tripsApi.uploadCover(tripId, fd);
      setCoverPreview(data.cover_image);
      onCoverUpdate?.(tripId, data.cover_image);
      toast.success(t('dashboard.coverSaved'));
    } catch {
      toast.error(t('dashboard.coverUploadError'));
    } finally {
      setUploadingCover(false);
    }
  };

  const selectFile = async (file: File | null | undefined) => {
    if (!file) return;
    // HEIC/HEIF from iOS can't be rendered or stored as-is, convert to JPEG first
    const normalized = await normalizeImageFile(file);
    setPendingUnsplashUrl(null);
    if (isEditing && trip?.id) {
      // Existing trip: upload immediately
      await uploadCoverNow(trip.id, normalized);
    } else {
      // New trip: stage for upload after creation
      setPendingCoverFile(normalized);
      stagePreview(normalized);
    }
  };

  const search = async () => {
    const query = searchQuery.trim() || title.trim();
    if (!query) {
      setSearchError(t('dashboard.unsplashQueryRequired'));
      return;
    }
    // Guard against out-of-order responses: only the latest search applies its
    // results, so a slow earlier query can't overwrite a newer one. #1277 review
    const seq = ++coverSearchSeq.current;
    setSearching(true);
    setSearchError('');
    try {
      const data = await tripsApi.searchCoverImages(query);
      if (seq !== coverSearchSeq.current) return;
      const photos: CoverSearchPhoto[] = data.photos || [];
      setSearchResults(photos);
      if (photos.length === 0) setSearchError(t('dashboard.unsplashNoResults'));
    } catch (err: unknown) {
      if (seq !== coverSearchSeq.current) return;
      setSearchError(getApiErrorMessage(err, t('dashboard.coverSearchError')));
    } finally {
      if (seq === coverSearchSeq.current) setSearching(false);
    }
  };

  const selectPhoto = async (photo: CoverSearchPhoto) => {
    if (!photo.url) return;
    setPendingCoverFile(null);
    if (isEditing && trip?.id) {
      setUploadingCover(true);
      try {
        await tripsApi.update(trip.id, { cover_image: photo.url });
        setCoverPreview(photo.url);
        onCoverUpdate?.(trip.id, photo.url);
        toast.success(t('dashboard.coverSaved'));
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('dashboard.coverSaveError')));
      } finally {
        setUploadingCover(false);
      }
    } else {
      setPendingUnsplashUrl(photo.url);
      setCoverPreview(photo.url);
    }
  };

  const removeCover = async () => {
    if (pendingCoverFile || pendingUnsplashUrl) {
      setPendingCoverFile(null);
      setPendingUnsplashUrl(null);
      setCoverPreview(null);
      return;
    }
    // Nothing pending left, so the preview is a saved trip's stored cover.
    const id = trip!.id;
    try {
      await tripsApi.update(id, { cover_image: null });
      setCoverPreview(null);
      onCoverUpdate?.(id, null);
    } catch {
      toast.error(t('dashboard.coverRemoveError'));
    }
  };

  /** Saves the staged cover on a trip that was just created. */
  const applyToCreatedTrip = async (createdId: number | undefined) => {
    if (pendingCoverFile && createdId) {
      try {
        const fd = new FormData();
        fd.append('cover', pendingCoverFile);
        const data = await tripsApi.uploadCover(createdId, fd);
        onCoverUpdate?.(createdId, data.cover_image);
      } catch {
        // Cover upload failed but trip was created, surface it without blocking the create
        toast.error(t('dashboard.coverUploadError'));
      }
    } else if (pendingUnsplashUrl && createdId) {
      try {
        await tripsApi.update(createdId, { cover_image: pendingUnsplashUrl });
        onCoverUpdate?.(createdId, pendingUnsplashUrl);
      } catch {
        toast.error(t('dashboard.coverSaveError'));
      }
    }
  };

  return {
    coverPreview,
    uploadingCover,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchError,
    searching,
    resetCover,
    selectFile,
    search,
    selectPhoto,
    removeCover,
    applyToCreatedTrip,
  };
}
