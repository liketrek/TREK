import type { AnswerInput, CardReader, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { asRow, excerptOf, fitted, listed, personFrom, rowById, stampOf, viewerOf } from './collab-values';
import {
  COLLAB_MESSAGE_ORIGIN_ASSISTANT,
  type AssistantChangePreview,
  type CollabBubbleCard,
  type CollabChatCard,
} from '@trek/shared';

/**
 * The trip chat in the assistant chat. A read shows the last messages it
 * returned as the chat draws them, the older ones counted; a held send shows
 * the bubble it will post (its text as the model wrote it, unmasked, since
 * that is what goes out), a held delete or reaction the message it touches
 * as it will look afterwards. A deleted message never shows, and nothing of a
 * file but its id travels.
 */

/** Messages a read shows; the older ones are counted. */
const SHOWN = 5;
/** What a listed message shows of its text; the rest is in the chat. */
const EXCERPT = 500;
/** What a sent bubble holds; a longer message is cut and marked. */
const SENT = 4000;

type Change = CollabBubbleCard['change'];

function isDeleted(row: Row): boolean {
  return !!row.deleted;
}

function reactionsOf(row: Row, viewerId: number): CollabBubbleCard['reactions'] {
  return rowsOf(row.reactions)
    .flatMap((reaction) => {
      const emoji = typeof reaction.emoji === 'string' ? reaction.emoji : '';
      const users = rowsOf(reaction.users);
      if (emoji === '' || emoji.length > 16 || users.length === 0) return [];
      const names = users.map((user) => clipped(user.username, 80)).filter((name): name is string => name !== null);
      return [
        {
          emoji,
          count: Math.min(users.length, 999),
          mine: users.some((user) => user.user_id === viewerId),
          names: names.slice(0, 6),
        },
      ];
    })
    .slice(0, 8);
}

function filesOf(row: Row): CollabBubbleCard['files'] {
  return rowsOf(row.attachments).flatMap((file) => {
    const fileId = argId(file, 'id');
    if (fileId === null) return [];
    const mime = typeof file.mime_type === 'string' ? file.mime_type : '';
    return [{ fileId, image: mime.startsWith('image/'), name: clipped(file.original_name, 120) }];
  });
}

/** The message a row answers, quoted; none when it was deleted or its author is unknown. */
function replyOf(row: Row): CollabBubbleCard['reply'] {
  const name = clipped(row.reply_username, 80);
  const text = clipped(row.reply_text, 120);
  return name && text ? { name, text } : null;
}

/** A listed message as a bubble: its text cut to `max` and masked, its reactions read for the viewer. */
function bubbleOf(row: Row, viewerId: number, change: Change, max = EXCERPT): CollabBubbleCard | null {
  const id = argId(row, 'id');
  const author = personFrom(row);
  if (id === null || author === null || isDeleted(row)) return null;
  const excerpt = excerptOf(row.text, max, true) ?? { text: '', cut: false };
  const files = filesOf(row);
  if (excerpt.text === '' && files.length === 0) return null;
  return {
    id,
    author,
    text: excerpt.text,
    cut: excerpt.cut,
    at: stampOf(row.created_at),
    reply: replyOf(row),
    reactions: reactionsOf(row, viewerId),
    files: files.slice(0, 4),
    fromAssistant: row.origin === COLLAB_MESSAGE_ORIGIN_ASSISTANT,
    change,
    reactEmoji: null,
  };
}

function chatOf(messages: CollabBubbleCard[], earlier = 0): CollabChatCard | null {
  return messages.length === 0 ? null : { kind: 'collabChat', messages, earlier: Math.min(earlier, 10_000) };
}

/** `list_collab_messages`: the last few messages that are still there, oldest first, the older ones counted. */
export function chatAnswer({ value, card }: AnswerInput): CollabChatCard | null {
  const kept = listed(value, 'messages')
    .map((row) => bubbleOf(row, card.viewerId, 'none'))
    .filter((bubble): bubble is CollabBubbleCard => bubble !== null);
  return fitted(kept.slice(-SHOWN), (shown) => chatOf(shown, kept.length - shown.length), 'first');
}

/** The chat's last hundred messages, as a held write's lookup reads them. */
export function loadMessages(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('list_collab_messages');
}

/** A send reads the chat only to quote the message it answers. */
export function loadForReply(args: ToolArgs, read: CardReader): Promise<unknown> {
  return argId(args, 'replyTo') === null ? Promise.resolve(null) : read('list_collab_messages');
}

/** The listed message a held call names, when it is still there. */
function target(loaded: unknown, args: ToolArgs): Row | null {
  const row = rowById(listed(loaded, 'messages'), argId(args, 'messageId'));
  return row && !isDeleted(row) ? row : null;
}

/**
 * `send_collab_message`: the bubble as it will be posted, by the user, on
 * their side of the chat. The quoted message comes from the lookup; one that
 * is gone quotes nothing (the server refuses the reply then).
 */
export function sendChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabChatCard | null {
  const author = viewerOf(ctx.card);
  const excerpt = excerptOf(args.text, SENT, false);
  if (!author || !excerpt) return null;
  const quoted = rowById(listed(loaded, 'messages'), argId(args, 'replyTo'));
  const reply =
    quoted && !isDeleted(quoted) ? replyOf({ reply_username: quoted.username, reply_text: quoted.text }) : null;
  return chatOf([
    {
      id: null,
      author,
      text: excerpt.text,
      cut: excerpt.cut,
      at: null,
      reply,
      reactions: [],
      files: [],
      // A message sent through the tool is posted as typed by the user, so it carries no mark.
      fromAssistant: false,
      change: 'send',
      reactEmoji: null,
    },
  ]);
}

/** `delete_collab_message`: the user's own message, struck; none for another's, which the server refuses. */
export function removeChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabChatCard | null {
  const row = target(loaded, args);
  if (!row || row.user_id !== ctx.card.viewerId) return null;
  const bubble = bubbleOf(row, ctx.card.viewerId, 'remove');
  return bubble ? chatOf([bubble]) : null;
}

/** The reactions of a row after the viewer toggled `emoji` on it, as the chat groups them. */
function toggled(row: Row, emoji: string, viewer: Row): Row {
  const reactions = rowsOf(row.reactions);
  const own = (user: Row) => user.user_id === viewer.user_id;
  const found = reactions.find((reaction) => reaction.emoji === emoji);
  if (!found) return { ...row, reactions: [...reactions, { emoji, users: [viewer] }] };
  const users = rowsOf(found.users);
  const next = users.some(own) ? users.filter((user) => !own(user)) : [...users, viewer];
  return {
    ...row,
    reactions: reactions
      .map((reaction) => (reaction === found ? { ...reaction, users: next } : reaction))
      .filter((reaction) => rowsOf(reaction.users).length > 0),
  };
}

/** `react_collab_message`: the message with its reactions after the toggle, the toggled one marked. */
export function reactChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabChatCard | null {
  const row = target(loaded, args);
  const viewer = viewerOf(ctx.card);
  // Taken as sent, untrimmed: the server stores the string it gets, so " 👍" is a reaction of its own.
  const emoji = typeof args.emoji === 'string' ? args.emoji : '';
  if (!row || !viewer || emoji.trim() === '' || emoji.length > 16) return null;
  const bubble = bubbleOf(toggled(row, emoji, asRow(viewer)), ctx.card.viewerId, 'react');
  return bubble ? chatOf([{ ...bubble, reactEmoji: emoji }]) : null;
}

/** The bubble a stored preview drew, for an applied send to keep what only the preview knew. */
function previewBubble(preview: AssistantChangePreview | null): CollabBubbleCard | null {
  const card = preview?.card;
  return card?.kind === 'collabChat' ? (card.messages[0] ?? null) : null;
}

/**
 * `send_collab_message` once applied: the posted message with its id, time,
 * origin and files read from the answer. Its text stays the one the held card
 * showed, unmasked, since it is the user's own message: an address in it must
 * not turn into "[hidden]" the moment it is sent.
 */
export function sendApplied(input: { result: unknown; preview: AssistantChangePreview | null }): CollabChatCard | null {
  const row = recordOf(recordOf(input.result).message);
  const authorId = argId(row, 'user_id');
  if (authorId === null) return null;
  const held = previewBubble(input.preview);
  const bubble = bubbleOf(row, authorId, held?.change ?? 'send', SENT);
  if (!bubble) return null;
  return chatOf([held ? { ...bubble, text: held.text, cut: held.cut } : bubble]);
}
