import { type ChangeEvent, useCallback, useRef, useState } from 'react';

import { assignmentsApi } from '../../api/client';
import { translateApiError, useTranslation } from '../../i18n';
import type { TripStoreState } from '../../store/tripStore';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import { normalizeImageFile } from '../../utils/convertHeic';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The part of a toast both shells hand in, theirs or the planner's. */
export interface PlaceActionToast {
  error: (message: string) => void;
}

/** Who joins a stop: nobody set means everyone, so every member is active and nobody is left to add. */
export function splitParticipants<M extends { id: number }>(
  members: M[],
  participantIds: number[],
  allJoined: boolean
) {
  return {
    activeMembers: allJoined ? members : members.filter((m) => participantIds.includes(m.id)),
    availableMembers: allJoined ? [] : members.filter((m) => !participantIds.includes(m.id)),
  };
}

/** The participant list with one member taken off; the whole trip again is stored as nobody. */
export function participantsWithout<M extends { id: number }>(
  members: M[],
  participantIds: number[],
  allJoined: boolean,
  userId: number
): number[] {
  const next = allJoined
    ? members.filter((m) => m.id !== userId).map((m) => m.id)
    : participantIds.filter((id) => id !== userId);
  return next.length === members.length ? [] : next;
}

/** The participant list with one member added; the whole trip again is stored as nobody. */
export function participantsWith<M extends { id: number }>(
  members: M[],
  participantIds: number[],
  userId: number
): number[] {
  const next = [...participantIds, userId];
  return next.length === members.length ? [] : next;
}

export interface PlaceActionDeps {
  tripId: number;
  tripActions: Pick<TripStoreState, 'ratePlace' | 'updatePlace'>;
  toast: PlaceActionToast;
  t: Translate;
}

/**
 * The place writes the desktop inspector and the phone sheet both make. Each one
 * reports a failure with the error's own message.
 */
export function placeActions({ tripId, tripActions, toast, t }: PlaceActionDeps) {
  const report = (err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'));

  /** Who joins the assignment; the answer is written back into that day's list. */
  const setParticipants = async (assignmentId: number, dayId: number, userIds: number[]) => {
    try {
      const data = await assignmentsApi.setParticipants(tripId, assignmentId, userIds);
      useTripStore.setState((state) => ({
        assignments: {
          ...state.assignments,
          [String(dayId)]: (state.assignments[String(dayId)] || []).map((a) =>
            a.id === assignmentId ? { ...a, participants: data.participants } : a
          ),
        },
      }));
    } catch (err: unknown) {
      report(err);
    }
  };

  /** Collaborative rating (#1435): every trip member casts their own star vote. */
  const ratePlace = async (placeId: number, rating: number | null) => {
    try {
      await tripActions.ratePlace(tripId, placeId, rating);
    } catch (err: unknown) {
      report(err);
    }
  };

  const updatePlace = async (placeId: number, data: Partial<Place>) => {
    try {
      await tripActions.updatePlace(tripId, placeId, data);
    } catch (err: unknown) {
      report(err);
    }
  };

  return { setParticipants, ratePlace, updatePlace };
}

/**
 * The files picked for a place, uploaded one after the other against it, and the
 * list opened once they are in. Without a place or an upload the pick does nothing.
 * `logFailure` keeps the console line the desktop inspector has always written.
 */
export function usePlaceFileUpload(
  placeId: number | null | undefined,
  upload: ((fd: FormData) => Promise<unknown>) | undefined,
  toast: PlaceActionToast,
  logFailure = false
) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (!selected.length || !upload || !placeId) return;
      setUploading(true);
      try {
        for (const file of selected) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('place_id', String(placeId));
          await upload(fd);
        }
        setFilesExpanded(true);
      } catch (err: unknown) {
        if (logFailure) console.error('Upload failed', err);
        toast.error(translateApiError(t, err, 'files.uploadError'));
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [upload, placeId, toast, t, logFailure]
  );

  return { uploading, filesExpanded, setFilesExpanded, fileInputRef, handleUpload };
}

/**
 * A picture picked as a place's image (#1136): converted from HEIC where needed,
 * uploaded, and a failure said in a toast. `busy` also covers whatever else the
 * caller does to the image while it runs. Without an upload the pick does nothing.
 */
export function usePlaceImagePick(upload: ((file: File) => Promise<unknown>) | undefined, toast: PlaceActionToast) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const pickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !upload) return;
    setBusy(true);
    try {
      await upload(await normalizeImageFile(file));
    } catch (err: unknown) {
      toast.error(translateApiError(t, err, 'places.imageUploadError'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, setBusy, pickImage };
}
