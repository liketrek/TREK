import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, type Row } from '../card-values';
import { Rows, text } from '../preview-format';
import { rowsOf } from '../undo-snapshot';
import { lineOf, listed, rowById } from './collab-values';

/**
 * The words of the trip chat's change cards. Each keeps the generic verb of
 * what it does (add, change, remove) and names its tool, so the chat labels
 * it "Start a poll" or "Vote in the poll"; its subject is the message, the
 * question or the note's title, which the card itself shows and the receipt
 * and the share text still read. Rows only where the card is not enough on
 * its own: a note's title, category and pin before and after, and the option
 * a vote is for.
 */

/** How long a subject taken from a message runs: its first line, cut. */
const SUBJECT = 60;

type Describer = (ctx: PreviewContext, args: ToolArgs, loaded: unknown) => Described;

function described(tool: string, subject: string, rows = new Rows()): Described {
  return { subject, rows, dayId: null, placeIds: [], tool, domain: 'collab' };
}

/** The first line of a text, cut to a subject; masked when it comes from an answer. */
function firstLine(value: unknown, mask: boolean): string {
  if (typeof value !== 'string') return '';
  const line = value.trim().split('\n')[0] ?? '';
  return (mask ? clipped(line, SUBJECT) : lineOf(line, SUBJECT)) ?? '';
}

function heldRow(loaded: unknown, key: string, args: ToolArgs, idKey: string): Row | null {
  return rowById(listed(loaded, key), argId(args, idKey));
}

function pinMark(value: unknown): string {
  return typeof value === 'boolean' ? text(value) : '';
}

/** A note change's rows: what its title, category and pin go from and to. */
function noteRows(args: ToolArgs, note: Row | null): Rows {
  const rows = new Rows();
  if (lineOf(args.title, 200) !== null) rows.change('name', clipped(note?.title, 200), text(args.title));
  if (lineOf(args.category, 100) !== null) rows.change('category', clipped(note?.category, 100), text(args.category));
  if (typeof args.pinned === 'boolean') {
    rows.rows.push({
      op: 'change',
      labelKey: 'field',
      field: 'pinned',
      before: note ? pinMark(!!note.pinned) : null,
      after: pinMark(args.pinned),
    });
  }
  return rows;
}

export const COLLAB_DESCRIBERS = {
  send_collab_message: (_ctx, args) => described('send_collab_message', firstLine(args.text, false)),
  delete_collab_message: (_ctx, args, loaded) => {
    const message = heldRow(loaded, 'messages', args, 'messageId');
    return described('delete_collab_message', firstLine(message?.text, true));
  },
  react_collab_message: (_ctx, args, loaded) => {
    const message = heldRow(loaded, 'messages', args, 'messageId');
    const emoji = lineOf(args.emoji, 16) ?? '';
    return described('react_collab_message', [emoji, firstLine(message?.text, true)].filter(Boolean).join(' '));
  },
  create_collab_poll: (_ctx, args) => described('create_collab_poll', firstLine(args.question, false)),
  vote_collab_poll: (_ctx, args, loaded) => {
    const poll = heldRow(loaded, 'polls', args, 'pollId');
    const index = typeof args.optionIndex === 'number' ? args.optionIndex : -1;
    const option = rowsOf(poll?.options)[index];
    const rows = new Rows().add('text', clipped(option?.text ?? option?.label, 160) ?? '');
    return described('vote_collab_poll', firstLine(poll?.question, true), rows);
  },
  close_collab_poll: (_ctx, args, loaded) =>
    described('close_collab_poll', firstLine(heldRow(loaded, 'polls', args, 'pollId')?.question, true)),
  delete_collab_poll: (_ctx, args, loaded) =>
    described('delete_collab_poll', firstLine(heldRow(loaded, 'polls', args, 'pollId')?.question, true)),
  create_collab_note: (_ctx, args) => {
    const rows = new Rows().add('category', lineOf(args.category, 100) ?? '');
    return described('create_collab_note', lineOf(args.title, 200) ?? '', rows);
  },
  update_collab_note: (_ctx, args, loaded) => {
    const note = heldRow(loaded, 'notes', args, 'noteId');
    const subject = clipped(note?.title, 200) ?? lineOf(args.title, 200) ?? '';
    return described('update_collab_note', subject, noteRows(args, note));
  },
  delete_collab_note: (_ctx, args, loaded) =>
    described('delete_collab_note', clipped(heldRow(loaded, 'notes', args, 'noteId')?.title, 200) ?? ''),
} satisfies Readonly<Record<string, Describer>>;
