import type { AnswerInput, CardReader, PreviewContext, ToolArgs } from '../card-types';
import { argId, blockText, clipped, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { asRow, deadlineOf, fitted, hasPassed, lineOf, listed, personFrom, rowById, viewerOf } from './collab-values';
import type { AssistantChangePreview, CollabPollCard, CollabPollsCard } from '@trek/shared';

/**
 * The polls of the trip in the assistant chat, as the Collab tab draws them.
 * A read shows up to four polls, the open ones first; a held write shows the
 * one poll it starts, votes in, closes or deletes, after the change. A vote
 * is worked out the way the server casts it: the same option again takes it
 * back, and a single choice poll moves the vote. Who voted for what is read
 * for the signed-in user (`mine`), which the client cannot tell from the
 * three faces a card carries.
 */

/** Polls a read shows; the rest are counted. */
const SHOWN = 4;
/** Options a poll shows; the rest are counted. */
const OPTIONS = 12;

type Change = CollabPollCard['change'];

/** Whether `viewerId` voted for an option, given its voters and where it stands. */
type MineOf = (voters: readonly Row[], index: number) => boolean;

const byViewer =
  (viewerId: number): MineOf =>
  (voters) =>
    voters.some((voter) => voter.user_id === viewerId);

function isClosed(row: Row): boolean {
  return row.is_closed === true || (row.is_closed === undefined && !!row.closed);
}

function isMultiple(row: Row): boolean {
  return row.multiple_choice === true || (row.multiple_choice === undefined && !!row.multiple);
}

/** A listed poll as its card, the options' votes read for the viewer. */
function pollOf(row: Row, mineOf: MineOf, change: Change): CollabPollCard | null {
  const pollId = argId(row, 'id');
  const question = blockText(row.question, 300, { mask: true });
  const all = rowsOf(row.options);
  if (pollId === null || question === null || all.length === 0) return null;
  return {
    pollId,
    question,
    options: all.slice(0, OPTIONS).map((option, index) => {
      const voters = rowsOf(option.voters);
      return {
        text: clipped(option.text ?? option.label, 160) ?? `#${index + 1}`,
        votes: Math.min(voters.length, 9999),
        mine: mineOf(voters, index),
        voters: voters.slice(0, 3).flatMap((voter) => {
          const person = personFrom(voter);
          return person ? [person] : [];
        }),
      };
    }),
    moreOptions: Math.min(Math.max(all.length - OPTIONS, 0), 500),
    multiple: isMultiple(row),
    closed: isClosed(row),
    deadline: deadlineOf(row.deadline),
    author: personFrom(row),
    change,
    votedIndex: null,
    votedAdds: false,
    warning: null,
  };
}

function pollsOf(polls: CollabPollCard[], more = 0): CollabPollsCard | null {
  return polls.length === 0 ? null : { kind: 'collabPolls', polls, more: Math.min(more, 1_000_000) };
}

/** `list_collab_polls`: up to four polls, the open ones first as the Collab tab lists them. */
export function pollsAnswer({ value, card }: AnswerInput, now = Date.now()): CollabPollsCard | null {
  const open = (row: Row) => !isClosed(row) && !hasPassed(deadlineOf(row.deadline), now);
  const rows = listed(value, 'polls');
  const ordered = [...rows.filter(open), ...rows.filter((row) => !open(row))];
  const polls = ordered
    .map((row) => pollOf(row, byViewer(card.viewerId), 'none'))
    .filter((poll): poll is CollabPollCard => poll !== null);
  return fitted(polls.slice(0, SHOWN), (shown) => pollsOf(shown, polls.length - shown.length), 'last');
}

/** The trip's polls, as a held vote, close or delete reads them. */
export function loadPolls(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('list_collab_polls');
}

function heldPoll(loaded: unknown, args: ToolArgs): Row | null {
  return rowById(listed(loaded, 'polls'), argId(args, 'pollId'));
}

/** `create_collab_poll`: the new poll, by the user, with its options as the model wrote them and no votes. */
export function createPollChange(ctx: PreviewContext, args: ToolArgs): CollabPollsCard | null {
  const author = viewerOf(ctx.card);
  const question = blockText(args.question, 300, { mask: false });
  const texts = Array.isArray(args.options) ? args.options : [];
  // A blank option keeps its place as "#n", as a listed poll shows it: the server stores
  // every option and votes go by index, so dropping one would shift the rest.
  const options = texts.map((text, index) => lineOf(text, 160) ?? `#${index + 1}`);
  if (!author || question === null || options.length === 0) return null;
  return pollsOf([
    {
      pollId: null,
      question,
      options: options.slice(0, OPTIONS).map((text) => ({ text, votes: 0, mine: false, voters: [] })),
      moreOptions: Math.min(Math.max(options.length - OPTIONS, 0), 500),
      multiple: args.multiple === true,
      closed: false,
      deadline: deadlineOf(args.deadline),
      author,
      change: 'create',
      votedIndex: null,
      votedAdds: false,
      warning: null,
    },
  ]);
}

/**
 * The options of a poll after the viewer's vote on `index`, as the server
 * casts it: a vote already there is taken back; otherwise a single choice
 * poll first takes the viewer off every option.
 */
function voted(options: readonly Row[], index: number, viewer: Row, multiple: boolean) {
  const own = (voter: Row) => voter.user_id === viewer.user_id;
  const adds = !rowsOf(options[index]?.voters).some(own);
  const after = options.map((option, at) => {
    const voters = rowsOf(option.voters);
    if (at === index) return { ...option, voters: adds ? [...voters, viewer] : voters.filter((v) => !own(v)) };
    return adds && !multiple ? { ...option, voters: voters.filter((v) => !own(v)) } : option;
  });
  return { after, adds };
}

/**
 * `vote_collab_poll`: the poll after the vote, the toggled option marked. A
 * vote the server refuses (a closed poll, an option it does not have) shows
 * the poll as it is, with the reason.
 */
export function voteChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabPollsCard | null {
  const row = heldPoll(loaded, args);
  const viewer = viewerOf(ctx.card);
  if (!row || !viewer) return null;
  const options = rowsOf(row.options);
  const index = typeof args.optionIndex === 'number' && Number.isInteger(args.optionIndex) ? args.optionIndex : -1;
  const mine = byViewer(viewer.id);
  const known = index >= 0 && index < options.length;
  if (!known || isClosed(row)) {
    const poll = pollOf(row, mine, 'vote');
    const marked = known && index < OPTIONS ? index : null;
    return poll && pollsOf([{ ...poll, votedIndex: marked, warning: known ? 'closed' : 'unknownOption' }]);
  }
  const { after, adds } = voted(options, index, asRow(viewer), isMultiple(row));
  const poll = pollOf({ ...row, options: after }, mine, 'vote');
  return poll && pollsOf([{ ...poll, votedIndex: index < OPTIONS ? index : null, votedAdds: adds }]);
}

/** `close_collab_poll`: the poll, closed; the client marks its leader. */
export function closeChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabPollsCard | null {
  const row = heldPoll(loaded, args);
  const poll = row && pollOf({ ...row, is_closed: true }, byViewer(ctx.card.viewerId), 'close');
  return poll ? pollsOf([poll]) : null;
}

/** `delete_collab_poll`: the poll as it is, struck. */
export function removePollChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): CollabPollsCard | null {
  const row = heldPoll(loaded, args);
  const poll = row && pollOf(row, byViewer(ctx.card.viewerId), 'remove');
  return poll ? pollsOf([poll]) : null;
}

/** The poll a stored preview drew. */
function previewPoll(preview: AssistantChangePreview | null): CollabPollCard | null {
  const card = preview?.card;
  return card?.kind === 'collabPolls' ? (card.polls[0] ?? null) : null;
}

/**
 * A poll write once applied: the poll as the server answered it, with its id
 * and the votes everyone cast by then. The applied card has no trip card, so
 * which options are the user's comes from the preview's after-state.
 */
export function pollApplied(
  fallback: Change,
  input: { result: unknown; preview: AssistantChangePreview | null },
): CollabPollsCard | null {
  const shown = previewPoll(input.preview);
  const mine: MineOf = (_voters, index) => shown?.options[index]?.mine ?? false;
  const poll = pollOf(recordOf(recordOf(input.result).poll), mine, shown?.change ?? fallback);
  if (!poll) return null;
  return pollsOf([{ ...poll, votedIndex: shown?.votedIndex ?? null, votedAdds: shown?.votedAdds ?? false }]);
}
