import type { AnswerInput, CardReader, PreviewContext, ToolArgs } from '../card-types';
import { argId, blockText, clipped, hexOrNull, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { hostOf, lineOf, listed, personFrom, rowById, viewerOf } from './collab-values';
import type { AssistantChangePreview, CollabNoteCard, CollabNotesCard } from '@trek/shared';

/**
 * The shared notes of the trip in the assistant chat, as the Collab tab
 * draws them. A note takes its category's colour the way the tab gives it
 * (the last note of the category in list order wins), a pinned note comes
 * first. A held write shows the one note it adds, changes or deletes, after
 * the change, with what it changes listed.
 */

/** Notes a read shows; the rest are counted. */
const SHOWN = 4;
/** What a card shows of a note's text: about three lines. */
const BODY = 600;
/** The category and colour the server gives a note created without them. */
const DEFAULT_CATEGORY = 'General';
const DEFAULT_COLOR = '#6366f1';

type Change = CollabNoteCard['change'];
type Field = CollabNoteCard['changed'][number];

/** The colour each category takes in the tab: the last note of it in list order. */
function categoryColors(rows: readonly Row[]): Map<string, string> {
  const colors = new Map<string, string>();
  for (const row of rows) {
    const color = hexOrNull(row.color);
    if (typeof row.category === 'string' && row.category !== '' && color) colors.set(row.category, color);
  }
  return colors;
}

/** A listed note as its card. Its text comes from an answer, so it is masked. */
function noteOf(row: Row, colors: ReadonlyMap<string, string>, change: Change): CollabNoteCard | null {
  const noteId = argId(row, 'id');
  const title = clipped(row.title, 200);
  if (noteId === null || title === null) return null;
  const category = typeof row.category === 'string' ? row.category : null;
  return {
    noteId,
    title,
    body: blockText(row.content, BODY, { mask: true }),
    category: clipped(category, 100),
    color: (category ? colors.get(category) : undefined) ?? hexOrNull(row.color),
    pinned: !!row.pinned,
    websiteHost: hostOf(row.website),
    files: Math.min(rowsOf(row.attachments).length, 999),
    author: personFrom(row),
    change,
    changed: [],
  };
}

function notesOf(notes: CollabNoteCard[], more = 0): CollabNotesCard | null {
  return notes.length === 0 ? null : { kind: 'collabNotes', notes, more: Math.min(more, 1_000_000) };
}

/** When a note was last touched, for the tab's order. */
function touchedAt(row: Row): number {
  const stamp = typeof row.updated_at === 'string' && row.updated_at ? row.updated_at : row.created_at;
  const ms =
    typeof stamp === 'string' ? Date.parse(stamp.includes('T') ? stamp : `${stamp.replace(' ', 'T')}Z`) : Number.NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

/** `list_collab_notes`: up to four notes, pinned first, then the latest touched, as the tab sorts them. */
export function notesAnswer({ value }: AnswerInput): CollabNotesCard | null {
  const rows = listed(value, 'notes');
  const colors = categoryColors(rows);
  const ordered = [...rows].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || touchedAt(b) - touchedAt(a));
  const notes = ordered
    .map((row) => noteOf(row, colors, 'none'))
    .filter((note): note is CollabNoteCard => note !== null);
  const shown = notes.slice(0, SHOWN);
  return notesOf(shown, notes.length - shown.length);
}

/** The trip's notes, as a held note write reads them. */
export function loadNotes(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('list_collab_notes');
}

/**
 * `create_collab_note`: the new note as the server will store it, its text
 * as the model wrote it. Without a category it lands in "General"; without a
 * colour it takes its category's, as the tab draws it.
 */
export function createNoteChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabNotesCard | null {
  const author = viewerOf(ctx.card);
  const title = lineOf(args.title, 200);
  if (!author || title === null) return null;
  const category = lineOf(args.category, 100) ?? DEFAULT_CATEGORY;
  const color = hexOrNull(args.color) ?? categoryColors(listed(loaded, 'notes')).get(category) ?? DEFAULT_COLOR;
  return notesOf([
    {
      noteId: null,
      title,
      body: blockText(args.content, BODY, { mask: false }),
      category,
      color,
      pinned: args.pinned === true,
      websiteHost: hostOf(args.website),
      files: 0,
      author,
      change: 'create',
      changed: [],
    },
  ]);
}

/** The listed note a held call names, as its card. */
function heldNote(loaded: unknown, args: ToolArgs, change: Change): CollabNoteCard | null {
  const rows = listed(loaded, 'notes');
  const row = rowById(rows, argId(args, 'noteId'));
  return row ? noteOf(row, categoryColors(rows), change) : null;
}

/**
 * `update_collab_note`: the note with the arguments laid over it as the
 * server applies them (an empty title, category or colour keeps the old one,
 * a link of null removes it), and which of its parts change.
 */
export function updateNoteChange(_ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabNotesCard | null {
  const before = heldNote(loaded, args, 'update');
  if (!before) return null;
  const row = rowById(listed(loaded, 'notes'), argId(args, 'noteId'));
  const after: CollabNoteCard = {
    ...before,
    title: lineOf(args.title, 200) ?? before.title,
    body: args.content === undefined ? before.body : blockText(args.content, BODY, { mask: false }),
    category: lineOf(args.category, 100) ?? before.category,
    color: hexOrNull(args.color) ?? before.color,
    pinned: typeof args.pinned === 'boolean' ? args.pinned : before.pinned,
    websiteHost: args.website === undefined ? before.websiteHost : hostOf(args.website),
  };
  // Compared with the stored note, not the masked card, so an address in it reads as unchanged.
  const stored: Row = row ?? {};
  const set = (value: string | null, was: unknown) => value !== null && value !== lineOf(was, 200);
  const differs: Record<Field, boolean> = {
    title: set(lineOf(args.title, 200), stored.title),
    body: args.content !== undefined && (args.content ?? '') !== (stored.content ?? ''),
    category: set(lineOf(args.category, 100), stored.category),
    color: set(hexOrNull(args.color), stored.color),
    website: args.website !== undefined && (args.website ?? null) !== (stored.website ?? null),
    pinned: typeof args.pinned === 'boolean' && args.pinned !== !!stored.pinned,
  };
  const changed = (Object.keys(differs) as Field[]).filter((field) => differs[field]);
  return notesOf([{ ...after, changed }]);
}

/** `delete_collab_note`: the note as it is, struck. */
export function removeNoteChange(_ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabNotesCard | null {
  const note = heldNote(loaded, args, 'remove');
  return note ? notesOf([note]) : null;
}

/** The note a stored preview drew. */
function previewNote(preview: AssistantChangePreview | null): CollabNoteCard | null {
  const card = preview?.card;
  return card?.kind === 'collabNotes' ? (card.notes[0] ?? null) : null;
}

/**
 * A note write once applied: the note as the server answered it, with its
 * id. Its colour is the one the preview showed, which knew the category's.
 */
export function noteApplied(
  fallback: Change,
  input: { result: unknown; preview: AssistantChangePreview | null },
): CollabNotesCard | null {
  const shown = previewNote(input.preview);
  const row = recordOf(recordOf(input.result).note);
  const colors = new Map<string, string>();
  if (shown?.category && shown.color) colors.set(shown.category, shown.color);
  const note = noteOf(row, colors, shown?.change ?? fallback);
  return note ? notesOf([{ ...note, changed: shown?.changed ?? [] }]) : null;
}
