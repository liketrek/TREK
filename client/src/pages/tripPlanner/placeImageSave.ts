import type { PendingImagePayload } from '../../components/Planner/placeImageChoice';
import { isEffectivelyOffline } from '../../sync/networkMode';
import type { Place } from '../../types';

interface ImageActions {
  uploadPlaceImage: (tripId: number | string, placeId: number, file: File) => Promise<Place>;
  setPlaceImageFromFile: (tripId: number | string, placeId: number, fileId: number) => Promise<Place>;
}

/**
 * Takes the waiting picture off what the form saves. It goes to its own route
 * once the place has an id, and that route needs a connection: offline the
 * form stays open with it, the way it does with files, rather than saving a
 * place that quietly loses its picture.
 */
export function takePendingImage(
  data: { _pendingImage?: PendingImagePayload },
  needsConnection: () => string
): PendingImagePayload | undefined {
  const pending = data._pendingImage;
  delete data._pendingImage;
  if (pending && isEffectivelyOffline()) throw new Error(needsConnection());
  return pending;
}

/** Makes the waiting picture the place's own: the file uploaded, or the attached file taken. */
export async function savePendingImage(
  actions: ImageActions,
  tripId: number | string,
  placeId: number | undefined,
  pending: PendingImagePayload | undefined,
  onError: (err: unknown) => void
): Promise<void> {
  if (!pending || !placeId) return;
  try {
    if (pending instanceof File) await actions.uploadPlaceImage(tripId, placeId, pending);
    else await actions.setPlaceImageFromFile(tripId, placeId, pending.fileId);
  } catch (err: unknown) {
    onError(err);
  }
}
