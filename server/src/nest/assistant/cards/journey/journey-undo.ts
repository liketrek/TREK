import type { ToolCards, UndoSnapshot } from '../card-types';
import { idIn, readKey, recordOf } from '../card-values';

/** How the undo reads the created entry again: by its id, whatever the turn read before. */
function entryRead(result: unknown) {
  return { tool: 'get_journey_entry', args: { entryId: idIn(result, 'entry') } };
}

function photoCount(entry: Record<string, unknown>): number {
  return Array.isArray(entry.photos) ? entry.photos.length : 0;
}

/**
 * A created entry, unchanged since: still there, not written since it was
 * made (every write of an entry stamps its `updated_at`), and holding the
 * photos it was created with, none added since, which the undo would delete
 * along with it.
 */
function entryUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).entry);
  const read = entryRead(result);
  if (read.args.entryId === null) return false;
  const current = recordOf(recordOf(snapshot.reads.get(readKey(read.tool, read.args))).entry);
  return (
    current.id === created.id &&
    current.updated_at !== undefined &&
    current.updated_at === created.updated_at &&
    photoCount(current) === photoCount(created)
  );
}

/** A created journal entry taken back by deleting it; a written-up suggestion is never one the create made. */
export const DELETE_CREATED_ENTRY: NonNullable<ToolCards['undo']> = {
  tool: 'delete_journey_entry',
  args: (_args, result) => {
    const entryId = idIn(result, 'entry');
    return entryId ? { entryId } : null;
  },
  reads: (_args, result) => [entryRead(result)],
  unchanged: entryUnchanged,
};
