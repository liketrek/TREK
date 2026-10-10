import { filesApi } from '../../api/client';
import type { TranslationFn, TripFile } from '../../types';
import type { useToast } from '../shared/Toast';

/** The files a paste carries, in clipboard order; text and other non-file items are skipped. */
export function filesFromClipboard(clipboardData: DataTransfer | null | undefined): File[] {
  const items = clipboardData?.items;
  if (!items) return [];
  const pasted: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) pasted.push(file);
    }
  }
  return pasted;
}

/** Which of a file's two link columns a toggle works on. */
export type FileLinkField = 'place_id' | 'reservation_id';

/**
 * What toggling one place or booking on a file does. The first link lives on the file
 * itself (`place_id` / `reservation_id`); any further one is a separate file link record.
 * So an unlinked target becomes the file's own link while that column is free and an extra
 * link record otherwise, and a linked target is cleared from the column it sits in or its
 * link record is removed.
 */
export type FileLinkStep =
  | { kind: 'update'; data: { place_id: number | null } | { reservation_id: number | null } }
  | { kind: 'addLink' }
  | { kind: 'removeLink' };

/**
 * How a caller reads the ids, which differs between the views. The phone link sheet treats
 * only a null column as free and finds a link record by the numeric value of its id; the
 * desktop manager treats any empty column as free and compares the record id as it comes.
 */
export interface FileLinkRules {
  freeOnlyWhenNull?: boolean;
  matchRecordsByNumber?: boolean;
}

export const PHONE_FILE_LINK_RULES: FileLinkRules = { freeOnlyWhenNull: true, matchRecordsByNumber: true };

function linkedIds(file: TripFile, field: FileLinkField): number[] {
  const own = file[field];
  const extra = field === 'place_id' ? file.linked_place_ids : file.linked_reservation_ids;
  return [...(own != null ? [own] : []), ...(extra || []).filter((id) => id != null)];
}

export function planFileLinkToggle(
  file: TripFile,
  field: FileLinkField,
  targetId: number,
  rules: FileLinkRules = {}
): FileLinkStep {
  const column = (value: number | null) => (field === 'place_id' ? { place_id: value } : { reservation_id: value });
  if (linkedIds(file, field).includes(targetId)) {
    if (file[field] === targetId) return { kind: 'update', data: column(null) };
    return { kind: 'removeLink' };
  }
  const free = rules.freeOnlyWhenNull ? file[field] == null : !file[field];
  if (free) return { kind: 'update', data: column(targetId) };
  return { kind: 'addLink' };
}

interface FileLinkRecord {
  id: number;
  place_id?: number | string | null;
  reservation_id?: number | string | null;
}

/** Runs an `addLink` or `removeLink` step against the server. */
export async function runFileLinkRecordStep(
  tripId: number,
  fileId: number,
  field: FileLinkField,
  targetId: number,
  step: 'addLink' | 'removeLink',
  rules: FileLinkRules = {}
): Promise<void> {
  if (step === 'addLink') {
    await filesApi.addLink(
      tripId,
      fileId,
      field === 'place_id' ? { place_id: targetId } : { reservation_id: targetId }
    );
    return;
  }
  const linksRes = (await filesApi.getLinks(tripId, fileId)) as { links?: FileLinkRecord[] };
  const link = (linksRes.links || []).find((l) =>
    rules.matchRecordsByNumber ? Number(l[field]) === targetId : l[field] === targetId
  );
  if (link) await filesApi.removeLink(tripId, fileId, link.id);
}

/** Toggles one place or booking on a file, whichever of the server calls that takes. */
export async function toggleFileLink(
  tripId: number,
  file: TripFile,
  field: FileLinkField,
  targetId: number,
  rules: FileLinkRules = {}
): Promise<void> {
  const step = planFileLinkToggle(file, field, targetId, rules);
  if (step.kind === 'update') await filesApi.update(tripId, file.id, step.data);
  else await runFileLinkRecordStep(tripId, file.id, field, targetId, step.kind, rules);
}

interface FileFeedback {
  t: TranslationFn;
  toast: ReturnType<typeof useToast>;
}

/**
 * How a field save reloads the files, which differs between the views. The desktop manager
 * starts its reload and moves on; the phone's file sheet waits for the reload, so a failed
 * reload shows the same error as a failed save and its busy marker stays until it is done.
 */
export interface FileUpdateRules {
  awaitRefresh?: boolean;
}

export const PHONE_FILE_UPDATE_RULES: FileUpdateRules = { awaitRefresh: true };

/** Saves fields of a file (its note, its place or booking) and reloads the files; a failure shows the assign error. */
export async function updateFileFields(
  tripId: number,
  fileId: number,
  data: Parameters<typeof filesApi.update>[2],
  { t, toast, refresh }: FileFeedback & { refresh: () => unknown },
  rules: FileUpdateRules = {}
): Promise<void> {
  try {
    await filesApi.update(tripId, fileId, data);
    if (rules.awaitRefresh) await refresh();
    else void refresh();
  } catch {
    toast.error(t('files.toast.assignError'));
  }
}

/**
 * The trash toast, which differs between the views: the desktop manager falls back to an
 * English text when the translation is empty, the phone shows the translation as it is.
 */
export interface FileTrashToastRules {
  trashedFallback?: string;
}

export const DESKTOP_FILE_TRASH_TOAST_RULES: FileTrashToastRules = { trashedFallback: 'Moved to trash' };

/** Moves a file to the trash through the view's delete call and says how it went. */
export async function trashFileWithToast(
  remove: () => Promise<unknown>,
  { t, toast, onTrashed }: FileFeedback & { onTrashed?: () => void },
  rules: FileTrashToastRules = {}
): Promise<void> {
  try {
    await remove();
    const trashed = t('files.toast.trashed');
    toast.success(rules.trashedFallback ? trashed || rules.trashedFallback : trashed);
    onTrashed?.();
  } catch {
    toast.error(t('files.toast.deleteError'));
  }
}
