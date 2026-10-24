import type { TourListItem } from '@trek/shared';
import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';
import { isTourFile, useTourGpxImport } from '../Tours/useTourGpxImport';

/** Stable identity: the dialog reads the files on opening, and a fresh [] would open it again on every render. */
const NO_FILES: readonly File[] = [];

export interface PlacesColumnFileImportOptions {
  tripId: number;
  /** The Tours addon: with it on, a line belongs to a tour and the file goes to the Tours import first. */
  toursEnabled: boolean;
  canEdit: boolean;
  /** The imported tours' place ids, so the places pool leaves them out at once. */
  onToursChanged?: (placeIds?: number[]) => void | Promise<void>;
  /** The new tours are in, after the trip's places were read again. */
  onImported?: (tours: TourListItem[]) => void;
}

/**
 * Where a file picked or dropped on the places column goes, one answer for the
 * desktop column and the phone's import sheet.
 *
 * With the Tours addon off nothing changes: the file opens the places import,
 * the first one of a drop as ever, and an empty pick opens it without one.
 *
 * With it on, a GPX, KML or KMZ file holds a route or a track, and tracks are
 * tours now, so it goes into the Tours import preview, the same dialog the
 * Tours tab opens. A file the preview finds no line in is a list of points,
 * which the places import has always taken: it opens there, once the preview
 * is closed, with those files already chosen. A file neither reads is named in
 * a toast instead of being dropped without a word.
 */
export function usePlacesColumnFileImport({
  tripId,
  toursEnabled,
  canEdit,
  onToursChanged,
  onImported,
}: PlacesColumnFileImportOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  // null while the places import is closed; [] for an opening without a file.
  const [placesFiles, setPlacesFiles] = useState<readonly File[] | null>(null);
  const tourImport = useTourGpxImport({
    tripId,
    canEdit: canEdit && toursEnabled,
    onToursChanged,
    onImported,
    onNoTrack: setPlacesFiles,
  });

  /** A drop on the column, or a pick from the phone's sheet. */
  const takeFiles = (files: readonly File[]) => {
    if (!canEdit || files.length === 0) return;
    if (!toursEnabled) {
      setPlacesFiles([files[0]]);
      return;
    }
    const routed = files.filter(isTourFile);
    if (routed.length < files.length) toast.error(t('places.importFileUnsupported'));
    if (routed.length > 0) void tourImport.importFiles(routed);
  };

  /** The column's "Import file" entry: the Tours file picker with the addon on, the places import without it. */
  const pickFile = () => {
    if (!canEdit) return;
    if (toursEnabled) tourImport.pick();
    else setPlacesFiles(NO_FILES);
  };

  const setPlacesImportOpen = (open: boolean) => setPlacesFiles(open ? NO_FILES : null);
  const closePlacesImport = () => setPlacesFiles(null);

  return {
    tourImport,
    // Never over the Tours preview: a mixed drop shows its tracks first, then the points.
    placesImportOpen: placesFiles !== null && !tourImport.preview && !tourImport.importing,
    placesImportFiles: placesFiles ?? NO_FILES,
    setPlacesImportOpen,
    closePlacesImport,
    takeFiles,
    pickFile,
  };
}
