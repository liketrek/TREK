import type { ToolArgs, ToolCards, UndoSnapshot } from '../card-types';
import { readKey, recordOf } from '../card-values';

/**
 * The way back from an applied book change. Edits and the cover go back with
 * `restore_book_page`, which puts the pages the change answered under
 * `previous_spreads` back as they were, and only while each of those pages is
 * still as the change left it (`page_digests`): a later save to one of them
 * makes it refuse, and the undo answers "changed since", while a save to
 * another page does not hold it back. "Undo all" over several page changes,
 * newest first, therefore takes each back in turn.
 *
 * Deleted pages go back at the place they had, which only means the same
 * while the book is still at the version the delete left; new pages are
 * deleted again and a moved page moved back on that same condition, read
 * with `get_book` first, and the call itself names that version, so a save
 * landing between the check and the call is refused rather than overwritten.
 * A block that mixes them with page edits can still end partly "changed
 * since": the newer undo of an edit is a save the older delete or move then
 * stands behind.
 */

export type BookUndo = NonNullable<ToolCards['undo']>;

/** The version a write's answer left the book at; null for an answer that names none. */
export function versionOf(result: unknown): number | null {
  const version = recordOf(result).version;
  return typeof version === 'number' && Number.isInteger(version) && version > 0 ? version : null;
}

/** The pages a write kept as they were before it; none when it kept none. */
function previousOf(result: unknown): unknown[] {
  const pages = recordOf(result).previous_spreads;
  return Array.isArray(pages) ? pages : [];
}

/**
 * The pages the restore checks, as the write answered them under
 * `page_digests`: only when every page it puts back is still in the book, so
 * each is replaced where it is; otherwise none, and the whole book's version
 * stands guard.
 */
function digestsOf(result: unknown, pages: readonly unknown[]): Array<{ spreadId: string; digest: string }> {
  const answered = recordOf(result).page_digests;
  const digests = (Array.isArray(answered) ? answered : []).flatMap((row) => {
    const { spreadId, digest } = recordOf(row);
    return typeof spreadId === 'string' && typeof digest === 'string' ? [{ spreadId, digest }] : [];
  });
  const named = new Set(digests.map((row) => row.spreadId));
  const covered = pages.every((page) => {
    const id = recordOf(recordOf(page).spread).id;
    return typeof id === 'string' && named.has(id);
  });
  return covered ? digests : [];
}

/** The book as the undo reads it before it checks: its summary, whatever the change was. */
export const BOOK_READ = { tool: 'get_book', args: {} } as const;

/** Nothing was saved to the book since the change: `get_book` still reads the version it left. */
export function bookUnmoved(result: unknown, snapshot: UndoSnapshot): boolean {
  const left = versionOf(result);
  return left !== null && versionOf(snapshot.reads.get(readKey(BOOK_READ.tool, BOOK_READ.args))) === left;
}

/**
 * Pages put back as the change found them. The restore itself refuses unless
 * the pages it names are still as the change left them (or, for pages the
 * change deleted, the book still at the version it left), so the check only
 * asks that the answer holds what the restore needs.
 */
export const RESTORE_PREVIOUS: BookUndo = {
  tool: 'restore_book_page',
  args: (_args, result) => {
    const pages = previousOf(result);
    const expectedVersion = versionOf(result);
    if (pages.length === 0 || expectedVersion === null) return null;
    const expectedPages = digestsOf(result, pages);
    return expectedPages.length > 0 ? { pages, expectedVersion, expectedPages } : { pages, expectedVersion };
  },
  unchanged: (result) => previousOf(result).length > 0 && versionOf(result) !== null,
};

/** New pages deleted again, while nothing was saved to the book since they were added. */
export const DELETE_ADDED: BookUndo = {
  tool: 'delete_book_pages',
  args: (_args, result) => {
    const ids = recordOf(result).spread_ids;
    const spreadIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    const expectedVersion = versionOf(result);
    return spreadIds.length > 0 && expectedVersion !== null ? { spreadIds, expectedVersion } : null;
  },
  reads: () => [BOOK_READ],
  unchanged: bookUnmoved,
};

/** A moved page moved back to where it stood, while nothing was saved to the book since. */
export const MOVE_BACK: BookUndo = {
  tool: 'move_book_page',
  args: (args: ToolArgs, result) => {
    const from = recordOf(result).from_index;
    const spreadId = args.spreadId;
    const expectedVersion = versionOf(result);
    if (typeof spreadId !== 'string' || typeof from !== 'number' || expectedVersion === null) return null;
    return { spreadId, toIndex: from, expectedVersion };
  },
  reads: () => [BOOK_READ],
  unchanged: bookUnmoved,
};
