import type { ToolCards, UndoSnapshot } from '../card-types';
import { idIn, readKey, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { listed, rowById } from './collab-values';

/**
 * The way back from a note or a poll the assistant added: deleting it, as
 * long as nobody built on it since. A note must still read as it was created
 * (title, text, last change) and hold no file, since a new note starts with
 * none and any file is a teammate's; a poll must have no votes and still be
 * open. A sent message has no way back: deleting it leaves "deleted a
 * message" in everyone's chat.
 */

type Undo = NonNullable<ToolCards['undo']>;

const NOTES_READ = { tool: 'list_collab_notes', args: {} };
const POLLS_READ = { tool: 'list_collab_polls', args: {} };

/** The row a list read of the undo holds under `key` with the created row's id. */
function current(snapshot: UndoSnapshot, read: { tool: string; args: Row }, key: string, created: Row): Row | null {
  const id = typeof created.id === 'number' ? created.id : null;
  return rowById(listed(snapshot.reads.get(readKey(read.tool, read.args)), key), id);
}

/** A created note, still as it was created and without a file someone added. */
function noteUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).note);
  const now = current(snapshot, NOTES_READ, 'notes', created);
  return (
    now !== null &&
    now.title === created.title &&
    (now.content ?? null) === (created.content ?? null) &&
    now.updated_at === created.updated_at &&
    rowsOf(now.attachments).length === 0
  );
}

/** A created poll nobody voted in and nobody closed. */
function pollUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).poll);
  const now = current(snapshot, POLLS_READ, 'polls', created);
  if (now === null || now.question !== created.question || now.is_closed === true) return false;
  return rowsOf(now.options).every((option) => rowsOf(option.voters).length === 0);
}

export const DELETE_CREATED_NOTE: Undo = {
  tool: 'delete_collab_note',
  args: (_args, result) => {
    const noteId = idIn(result, 'note');
    return noteId ? { noteId } : null;
  },
  reads: () => [NOTES_READ],
  unchanged: noteUnchanged,
};

export const DELETE_CREATED_POLL: Undo = {
  tool: 'delete_collab_poll',
  args: (_args, result) => {
    const pollId = idIn(result, 'poll');
    return pollId ? { pollId } : null;
  },
  reads: () => [POLLS_READ],
  unchanged: pollUnchanged,
};
