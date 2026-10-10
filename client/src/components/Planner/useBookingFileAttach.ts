import type React from 'react';
import { type Dispatch, type SetStateAction, useState } from 'react';

import type { TripFile } from '../../types';
import { attachedBookingFiles } from './bookingFormModel';

export interface BookingFileAttachOptions {
  /** The booking being edited; files picked before it is saved wait in `pendingFiles`. */
  reservation: { id: number; title: string } | null | undefined;
  /** The trip's files. */
  files: TripFile[];
  onFileUpload?: (fd: FormData) => Promise<unknown>;
  setPendingFiles: Dispatch<SetStateAction<File[]>>;
  /** The toast and translate the dialog already holds. */
  toast: { success: (message: string) => void; error: (message: string) => void };
  t: (key: string) => string;
}

/**
 * The Files row of the desktop booking and transport dialogs: a file picked on a
 * saved booking goes up at once, one picked on a new booking waits for the save,
 * and the files linked or detached in the dialog show on the booking right away.
 */
export function useBookingFileAttach({
  reservation,
  files,
  onFileUpload,
  setPendingFiles,
  toast,
  t,
}: BookingFileAttachOptions) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [linkedFileIds, setLinkedFileIds] = useState<number[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (reservation?.id) {
      setUploadingFile(true);
      try {
        if (onFileUpload) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('reservation_id', String(reservation.id));
          fd.append('description', reservation.title);
          await onFileUpload(fd);
          toast.success(t('reservations.toast.fileUploaded'));
        } else {
          // A dialog without an upload reports a failed upload, as it always did.
          toast.error(t('reservations.toast.uploadError'));
        }
      } catch {
        toast.error(t('reservations.toast.uploadError'));
      } finally {
        setUploadingFile(false);
        e.target.value = '';
      }
    } else {
      setPendingFiles((prev) => [...prev, file]);
      e.target.value = '';
    }
  };

  return {
    uploadingFile,
    handleFileChange,
    attachedFiles: attachedBookingFiles(files, reservation?.id, linkedFileIds),
    removePending: (index: number) => setPendingFiles((prev) => prev.filter((_, j) => j !== index)),
    linkFile: (fileId: number) => setLinkedFileIds((prev) => [...prev, fileId]),
    detachFile: (fileId: number) => setLinkedFileIds((prev) => prev.filter((id) => id !== fileId)),
  };
}
