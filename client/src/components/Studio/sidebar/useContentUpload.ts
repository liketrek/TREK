import { useRef, useState, type DragEvent } from 'react';

import { useToast } from '../../shared/Toast';
import type { PhotoFilter } from '../photoFilter';
import type { StudioUploader } from '../studioUpload';

/**
 * The way pictures get into the Content panel: a file picked, a file dropped
 * anywhere on the panel, or a photo provider's picker (#2271).
 *
 * Into the entry the browser is filtered to, otherwise into the gallery. The
 * filter is the one thing on screen that names an entry, so it is also the one
 * thing that can say where a picture belongs. Afterwards the new pictures get
 * a filter of their own, because the gallery sorts them to its end, and twelve
 * pictures that arrive out of sight read as twelve that did not arrive.
 */
export function useContentUpload({
  filter,
  showArrived,
  onUpload,
  onBrowseProvider,
  enabled,
  t,
}: {
  filter: PhotoFilter;
  /** Shows the pictures that just landed, and lets go of the search that might hide them. */
  showArrived: (photoIds: number[]) => void;
  onUpload: StudioUploader;
  onBrowseProvider?: (provider: string, entryId: number | null) => Promise<number[]>;
  /** False for a viewer, or on a tab that shows no photos: nothing is taken. */
  enabled: boolean;
  t: (k: string, params?: Record<string, string | number>) => string;
}) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  // A ref as well as the state: two drops in one second would both read the state before either had set it.
  const sending = useRef(false);
  const [dropOver, setDropOver] = useState(false);
  const entryId = filter.kind === 'entry' ? filter.id : null;

  const send = async (files: File[]) => {
    if (sending.current || !files.length) return;
    sending.current = true;
    setUpload({ done: 0, total: files.length });
    try {
      const sent = await onUpload(files, entryId, (p) => setUpload({ done: p.done, total: p.total }));
      if (sent.photoIds.length) {
        showArrived(sent.photoIds);
        toast.success(t('journey.photosUploaded', { count: sent.photoIds.length }));
      }
    } finally {
      sending.current = false;
      setUpload(null);
    }
  };

  /** From a photo provider: into the same place an upload goes, and shown the same way. */
  const pickFromProvider = async (provider: string) => {
    if (!onBrowseProvider) return;
    const photoIds = await onBrowseProvider(provider, entryId);
    if (photoIds.length) showArrived(photoIds);
  };

  /*
   * The whole scrolling area takes a drop, not just the dashed cell: a drag
   * from the desktop arrives with the pointer wherever it arrives. Only a file
   * drag is claimed; the panel's own photo drags carry another type and go to
   * the sheet.
   */
  const dropZone = enabled
    ? {
        onDragOver: (e: DragEvent<HTMLDivElement>) => {
          if (!e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setDropOver(true);
        },
        onDragLeave: (e: DragEvent<HTMLDivElement>) => {
          // Moving onto a child of the box is not leaving the box.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropOver(false);
        },
        onDrop: (e: DragEvent<HTMLDivElement>) => {
          const files = Array.from(e.dataTransfer.files ?? []);
          if (!files.length) return;
          e.preventDefault();
          setDropOver(false);
          void send(files);
        },
      }
    : {};

  return { fileInput, upload, dropOver, dropZone, send, pickFromProvider };
}
