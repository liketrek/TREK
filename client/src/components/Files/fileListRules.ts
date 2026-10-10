import type { Place, Reservation, TripFile } from '../../types';
import { isImage, isMedia, isWalletPass } from './FileManager.helpers';

export type FileTypeCategory = 'pdf' | 'image' | 'pass' | 'xls' | 'other';

function isSpreadsheetFile(mimeType?: string | null, name?: string | null): boolean {
  const ext = (name || '').toLowerCase().split('.').pop();
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || ext === 'ods') return true;
  const mime = mimeType || '';
  return mime.includes('excel') || mime.includes('spreadsheet') || mime === 'text/csv';
}

/**
 * PDF / IMG / PASS / XLS / fallback, derived from the real mime_type and filename. IMG folds
 * in video (#823 media) since both open in the same lightbox.
 */
export function getFileTypeCategory(file: Pick<TripFile, 'mime_type' | 'original_name'>): FileTypeCategory {
  if (isWalletPass(file.mime_type, file.original_name)) return 'pass';
  if (file.mime_type === 'application/pdf') return 'pdf';
  if (isMedia(file.mime_type)) return 'image';
  if (isSpreadsheetFile(file.mime_type, file.original_name)) return 'xls';
  return 'other';
}

/**
 * How the filter tabs sort a file, which differs between the views. The phone's tiles
 * partition the files by type category: 'image' takes videos too and 'doc' is every file
 * that is no PDF and no media, and a note id of 0 still counts as collab. The desktop tabs
 * read the mime type directly: 'image' is pictures only and 'doc' is Word, Excel and text,
 * and only a set note id counts as collab.
 */
export interface FileFilterRules {
  byTypeCategory?: boolean;
  collabWhenNotNull?: boolean;
}

export const PHONE_FILE_FILTER_RULES: FileFilterRules = { byTypeCategory: true, collabWhenNotNull: true };

function matchesTypeFilter(file: TripFile, filter: 'pdf' | 'image' | 'doc', byTypeCategory: boolean): boolean {
  if (byTypeCategory) {
    const category = getFileTypeCategory(file);
    if (filter === 'doc') return category === 'xls' || category === 'pass' || category === 'other';
    return category === filter;
  }
  const mime = file.mime_type || '';
  if (filter === 'pdf') return file.mime_type === 'application/pdf';
  if (filter === 'image') return isImage(file.mime_type);
  return mime.includes('word') || mime.includes('excel') || mime.includes('text');
}

/** Whether a file shows under a filter tab; an unknown filter shows everything. */
export function matchesFileFilter(file: TripFile, filter: string, rules: FileFilterRules = {}): boolean {
  switch (filter) {
    case 'starred':
      return !!file.starred;
    case 'collab':
      return rules.collabWhenNotNull ? file.note_id != null : !!file.note_id;
    case 'pdf':
    case 'image':
    case 'doc':
      return matchesTypeFilter(file, filter, !!rules.byTypeCategory);
    default:
      return true;
  }
}

/**
 * How the link list reads a file's own place and booking column. The desktop row skips an
 * empty column of any kind (0 included); the phone skips only a null one.
 */
export interface FileLinkListRules {
  ownLinkWhenTruthy?: boolean;
}

export const DESKTOP_FILE_LINK_LIST_RULES: FileLinkListRules = { ownLinkWhenTruthy: true };

export interface LinkedFileTargets {
  places: Place[];
  /** Each linked booking, with whether it is a transport (the rest show as bookings). */
  reservations: { reservation: Reservation; transport: boolean }[];
}

/**
 * The ids a file is linked to in one column: its own place or booking column first, then
 * each extra link once, null entries skipped.
 */
export function linkedFileIds(
  file: Pick<TripFile, 'place_id' | 'linked_place_ids' | 'reservation_id' | 'linked_reservation_ids'>,
  field: 'place_id' | 'reservation_id',
  rules: FileLinkListRules = {}
): number[] {
  const own = field === 'place_id' ? file.place_id : file.reservation_id;
  const extra = field === 'place_id' ? file.linked_place_ids : file.linked_reservation_ids;
  const ids = new Set<number>();
  if (rules.ownLinkWhenTruthy ? own : own != null) ids.add(own as number);
  for (const id of extra || []) if (id != null) ids.add(id);
  return [...ids];
}

/**
 * The places and bookings a file is linked to: its own place and booking column plus the
 * extra file links, each once and in that order, leaving out ids that match nothing.
 */
export function linkedFileTargets(
  file: TripFile,
  places: Place[] | undefined,
  reservations: Reservation[] | undefined,
  transportTypes: ReadonlySet<string>,
  rules: FileLinkListRules = {}
): LinkedFileTargets {
  const linkedPlaces: Place[] = [];
  for (const id of linkedFileIds(file, 'place_id', rules)) {
    const place = (places || []).find((p) => p.id === id);
    if (place) linkedPlaces.push(place);
  }
  const linkedReservations: LinkedFileTargets['reservations'] = [];
  for (const id of linkedFileIds(file, 'reservation_id', rules)) {
    const reservation = (reservations || []).find((r) => r.id === id);
    if (reservation) linkedReservations.push({ reservation, transport: transportTypes.has(reservation.type) });
  }
  return { places: linkedPlaces, reservations: linkedReservations };
}
