import type React from 'react';
import { useState } from 'react';

import { useTranslation } from '../../i18n';
import { useJourneyStore } from '../../store/journeyStore';
import { getApiErrorMessage } from '../../types';
import { normalizeImageFiles } from '../../utils/convertHeic';
import { isVideoFile } from '../../utils/videoPoster';
import { useToast } from '../shared/Toast';

export interface GalleryUploadOptions {
  /** The journey the photos go to; nothing is uploaded while it is unknown. */
  journeyId: number | null;
  /** Reload the journey once the upload is through, whatever came of it. */
  onUploaded: () => void;
  /**
   * Hand the upload a progress callback, so `progress` counts the files up while they go
   * (the desktop gallery's upload button shows it). Without it the count stays at none
   * done until the batch is through.
   */
  trackProgress?: boolean;
  /**
   * The toast and translate the view already holds. The phone screen passes the ones its
   * page hook gives it, as it always did; left out, the hook takes its own.
   */
  toast?: ReturnType<typeof useToast>;
  t?: ReturnType<typeof useTranslation>['t'];
}

/**
 * Uploading device files into a journey's gallery, behind both the desktop gallery and
 * the phone journey screen: images are normalised (HEIC and friends) while videos go up
 * as they are (#823), a partial failure says how many did not make it, and the journey
 * reloads afterwards.
 */
export function useGalleryUpload({
  journeyId,
  onUploaded,
  trackProgress = false,
  toast: viewToast,
  t: viewT,
}: GalleryUploadOptions) {
  const own = useTranslation();
  const ownToast = useToast();
  const t = viewT ?? own.t;
  const toast = viewToast ?? ownToast;
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || journeyId == null) return;
    setProgress({ done: 0, total: files.length });
    try {
      const all = Array.from(files);
      const videos = all.filter(isVideoFile);
      const images = all.filter((f) => !isVideoFile(f));
      const normalized = [...(images.length ? await normalizeImageFiles(images) : []), ...videos];
      const store = useJourneyStore.getState();
      const { failed } = trackProgress
        ? await store.uploadGalleryPhotos(journeyId, normalized, {
            onProgress: (p) => setProgress({ done: p.done, total: p.total }),
          })
        : await store.uploadGalleryPhotos(journeyId, normalized);
      if (failed.length > 0) {
        toast.error(
          t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(normalized.length) })
        );
      } else {
        toast.success(t('journey.photosUploaded', { count: files.length }));
      }
      onUploaded();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('journey.photosUploadFailed')));
    } finally {
      setProgress(null);
    }
    e.target.value = '';
  };

  return { uploading: progress !== null, progress, handleGalleryUpload };
}
