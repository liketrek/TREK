import { BOOK_READ, bookUnmoved, versionOf, type BookUndo } from '../book/book-undo';
import type { ToolArgs } from '../card-types';
import { recordOf } from '../card-values';

/**
 * The way back from the book-level changes (journey-studio-wp13.md 6.1). An
 * applied design goes back with `restore_book_revision`, the book's format
 * with `set_book_setup` to what it answered under `previous_setup`, a kept
 * layout with `remove_book_layout`, a removed one with `restore_book_layout`.
 * Each call names the version the change left, so a save landing in between
 * is refused (409, "changed since") rather than overwritten; the ones that
 * can only tell from the book also read `get_book` first, with the same
 * version check as the photo book's new and moved pages (book-undo.ts).
 */

/** The revision an applied design kept; null when the journey had no book before it. */
function revisionOf(result: unknown): number | null {
  const id = recordOf(result).revision_id;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

/** An applied design taken back: the book as the apply found it, while nothing was saved since. */
export const RESTORE_REVISION: BookUndo = {
  tool: 'restore_book_revision',
  args: (_args, result) => {
    const revisionId = revisionOf(result);
    const expectedVersion = versionOf(result);
    return revisionId !== null && expectedVersion !== null ? { revisionId, expectedVersion } : null;
  },
  unchanged: (result) => revisionOf(result) !== null && versionOf(result) !== null,
};

/** The page numbers' fields `set_book_setup` takes. */
const NUMBER_KEYS = ['show', 'startAt', 'position', 'margin', 'size', 'autoColor', 'color', 'font'] as const;

/** The format and the page numbers set back to what the change answered under `previous_setup`. */
export const SETUP_BACK: BookUndo = {
  tool: 'set_book_setup',
  args: (_args, result) => {
    const previous = recordOf(recordOf(result).previous_setup);
    const expectedVersion = versionOf(result);
    if (typeof previous.preset !== 'string' || expectedVersion === null) return null;
    const numbers = recordOf(previous.pageNumbers);
    const pageNumbers: ToolArgs = {};
    for (const key of NUMBER_KEYS) if (numbers[key] !== undefined) pageNumbers[key] = numbers[key];
    return {
      preset: previous.preset,
      pageWidth: previous.pageWidth,
      pageHeight: previous.pageHeight,
      bleed: previous.bleed,
      safe: previous.safe,
      pageNumbers,
      expectedVersion,
    };
  },
  reads: () => [BOOK_READ],
  unchanged: bookUnmoved,
};

/** A layout the change kept, taken away again. */
export const REMOVE_SAVED: BookUndo = {
  tool: 'remove_book_layout',
  args: (_args, result) => {
    const layoutId = recordOf(result).layout_id;
    const expectedVersion = versionOf(result);
    return typeof layoutId === 'string' && expectedVersion !== null ? { layoutId, expectedVersion } : null;
  },
  reads: () => [BOOK_READ],
  unchanged: bookUnmoved,
};

/** A layout the change took away, put back as it answered it under `previous_layout`. */
export const LAYOUT_BACK: BookUndo = {
  tool: 'restore_book_layout',
  args: (_args, result) => {
    const layout = recordOf(result).previous_layout;
    const expectedVersion = versionOf(result);
    if (!layout || typeof layout !== 'object' || expectedVersion === null) return null;
    return { layout: JSON.stringify(layout), expectedVersion };
  },
  unchanged: (result) => !!recordOf(result).previous_layout && versionOf(result) !== null,
};
