import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTripStore } from '../../store/tripStore';
import type { Place, TripFile } from '../../types';
import { filesForPlace } from '../../utils/placeFiles';
import type { PlaceImageOwn } from './PlaceImagePicker';
import { chosenImage, pickableImages, type ChosenImage, type PendingPlaceImage } from './placeImageChoice';

interface PlaceImageFieldOptions {
  /** The place being edited; null or undefined while a new one is made. */
  place: Pick<Place, 'id' | 'image_url'> | null | undefined;
  /** The form's image field: undefined keeps the picture, null drops it, a URL takes a source's photo. */
  imageUrl: string | null | undefined;
  pendingImage: PendingPlaceImage | null;
  canUploadFiles: boolean;
  stageUpload: (file: File) => void;
  stageAttached: (file: TripFile) => void;
  removeImage: () => void;
}

/**
 * The editor's picture of a place, the same for the desktop dialog and the
 * phone sheet: the picture it has now, the images attached to it, the one
 * waiting for the save, and which tile of the picker stands for the choice.
 * A new place has no attached files yet; it can still be given a picture from
 * the device, uploaded once the save has made it.
 */
export function usePlaceImageField({
  place,
  imageUrl,
  pendingImage,
  canUploadFiles,
  stageUpload,
  stageAttached,
  removeImage,
}: PlaceImageFieldOptions): { own: PlaceImageOwn; chosen: ChosenImage } {
  const { files, reservations } = useTripStore(useShallow((s) => ({ files: s.files, reservations: s.reservations })));
  const placeId = place?.id;
  const attached = useMemo(
    () => (placeId ? pickableImages(filesForPlace(files, placeId, reservations)) : []),
    [files, placeId, reservations]
  );
  const currentUrl = place?.image_url ?? null;
  return {
    own: {
      currentUrl,
      attached,
      pendingPreview: pendingImage?.kind === 'upload' ? pendingImage.preview : null,
      canUpload: canUploadFiles,
      onUpload: stageUpload,
      onPickAttached: stageAttached,
      onRemove: removeImage,
    },
    chosen: chosenImage(imageUrl, pendingImage, currentUrl),
  };
}
