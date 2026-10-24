/**
 * The trip chat's cards in the assistant chat: messages, polls and shared
 * notes as a read answered them and as a held write will leave them, built
 * from the tools' raw answers and checked against the card union through the
 * registry's guard (a card that does not fit its kind comes back as null).
 * Text from an answer is masked, text the model wrote is not; no address of
 * a file or a picture travels; a vote is worked out as the server casts it.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
import type { AnswerInput, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import { deadlineOf, stampOf } from '../../../../../../src/nest/assistant/cards/collab/collab-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  changeCardOf,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import {
  assistantChangePreviewSchema,
  MAX_CARD_CHARS,
  type CollabChatCard,
  type CollabNotesCard,
  type CollabPollsCard,
  type TrekCard,
} from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

type Row = Record<string, unknown>;

/** Anna (7) asks; Jon (8) signed in with a provider's picture. */
const summary = {
  trip: { title: 'Rome' },
  members: {
    owner: { id: 7, username: 'anna', avatar_url: '/uploads/avatars/anna.png' },
    collaborators: [{ id: 8, username: 'jon', avatar_url: 'https://idp.test/jon.png' }],
  },
};
const card = buildTripCard(1, 7, summary, null, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-10-21', airport: () => null };
const ANNA = { id: 7, name: 'anna', avatarKey: 'anna.png' };
const JON = { id: 8, name: 'jon', avatarKey: null };
/** Anna as a voter row names her: without a picture. */
const ANNA_VOTER = { ...ANNA, avatarKey: null };
const ANNA_ROW = { user_id: 7, username: 'anna', avatar_url: '/uploads/avatars/anna.png' };

const answer = (tool: string, value: unknown): TrekCard | null =>
  answerCardOf(tool, { toolCallId: 'call_1', args: {}, value, card, today: ctx.today } satisfies AnswerInput);

const message = (id: number, over: Row = {}): Row => ({
  id,
  trip_id: 1,
  user_id: 8,
  username: 'jon',
  avatar_url: 'https://idp.test/jon.png',
  text: `Message ${id}`,
  created_at: '2026-10-21 09:12:00',
  deleted: 0,
  origin: null,
  reply_to: null,
  reply_text: null,
  reply_username: null,
  reactions: [],
  attachments: [],
  ...over,
});

const voter = (id: number, name: string) => ({ id, user_id: id, username: name, avatar: null, avatar_url: null });

const poll = (id: number, over: Row = {}): Row => ({
  id,
  trip_id: 1,
  user_id: 8,
  username: 'jon',
  avatar_url: null,
  question: `Question ${id}?`,
  options: [
    { text: 'Trattoria', label: 'Trattoria', voters: [voter(8, 'jon')] },
    { text: 'Market', label: 'Market', voters: [voter(7, 'anna')] },
    { text: 'Noodles', label: 'Noodles', voters: [] },
  ],
  is_closed: false,
  multiple_choice: false,
  deadline: null,
  created_at: '2026-10-20 10:00:00',
  ...over,
});

const note = (id: number, over: Row = {}): Row => ({
  id,
  trip_id: 1,
  user_id: 7,
  username: 'anna',
  avatar_url: '/uploads/avatars/anna.png',
  title: `Note ${id}`,
  content: null,
  category: 'General',
  color: '#6366f1',
  pinned: 0,
  website: null,
  created_at: '2026-10-20 10:00:00',
  updated_at: '2026-10-20 10:00:00',
  attachments: [],
  ...over,
});

const chatOf = (built: TrekCard | null): CollabChatCard => {
  if (built?.kind !== 'collabChat') throw new Error(`no chat card: ${JSON.stringify(built)}`);
  return built;
};
const pollsOf = (built: TrekCard | null): CollabPollsCard => {
  if (built?.kind !== 'collabPolls') throw new Error(`no poll card: ${JSON.stringify(built)}`);
  return built;
};
const notesOf = (built: TrekCard | null): CollabNotesCard => {
  if (built?.kind !== 'collabNotes') throw new Error(`no note card: ${JSON.stringify(built)}`);
  return built;
};

describe('the chat card of a read', () => {
  it('ASTCOLLAB-001: shows the last five messages still there, oldest first, and counts the older ones', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => message(id, id === 7 ? { deleted: 1, text: '' } : {}));
    const chat = chatOf(answer('list_collab_messages', { messages: rows }));
    expect(chat.messages.map((bubble) => bubble.id)).toEqual([3, 4, 5, 6, 8]);
    expect(chat.earlier).toBe(2);
    expect(chat.messages[0]).toMatchObject({ author: JON, at: '2026-10-21T09:12:00Z', change: 'none', cut: false });
    expect(answer('list_collab_messages', { messages: [message(1, { deleted: 1 })] })).toBeNull();
    expect(answer('list_collab_messages', { messages: [] })).toBeNull();
  });

  it('ASTCOLLAB-002: reads reactions for the user, files by id, the assistant mark, and never an address', () => {
    const row = message(4, {
      origin: 'assistant',
      reactions: [
        {
          emoji: '❤️',
          count: 2,
          users: [
            { user_id: 7, username: 'anna' },
            { user_id: 8, username: 'jon' },
          ],
        },
        { emoji: '👍', count: 1, users: [{ user_id: 8, username: 'jon' }] },
      ],
      attachments: [
        { id: 31, original_name: 'ticket.jpg', mime_type: 'image/jpeg', url: '/api/trips/1/files/31/download' },
        { id: 32, original_name: 'plan.pdf', mime_type: 'application/pdf', url: '/api/trips/1/files/32/download' },
      ],
    });
    const [bubble] = chatOf(answer('list_collab_messages', { messages: [row] })).messages;
    expect(bubble?.reactions).toEqual([
      { emoji: '❤️', count: 2, mine: true, names: ['anna', 'jon'] },
      { emoji: '👍', count: 1, mine: false, names: ['jon'] },
    ]);
    expect(bubble?.files).toEqual([
      { fileId: 31, image: true, name: 'ticket.jpg' },
      { fileId: 32, image: false, name: 'plan.pdf' },
    ]);
    expect(bubble?.fromAssistant).toBe(true);
    const json = JSON.stringify(bubble);
    expect(json).not.toContain('/api/');
    expect(json).not.toContain('http');
  });

  it('ASTCOLLAB-003: keeps line breaks, folds blank runs, masks an address and cuts a long message', () => {
    const text = 'Train at 7:40\n\n\n\nwrite to jon@example.test\nok';
    const [bubble] = chatOf(answer('list_collab_messages', { messages: [message(1, { text })] })).messages;
    expect(bubble?.text).toBe('Train at 7:40\n\nwrite to [hidden]\nok');
    const longText = { messages: [message(2, { text: 'x'.repeat(900) })] };
    const [long] = chatOf(answer('list_collab_messages', longText)).messages;
    expect(long?.cut).toBe(true);
    expect(long?.text).toHaveLength(500);
  });

  it('ASTCOLLAB-004: quotes the message a bubble answers, and nothing for a deleted one', () => {
    const reply = message(3, { reply_to: 2, reply_username: 'anna', reply_text: 'Shall we?' });
    const gone = message(4, { reply_to: 1, reply_username: 'anna', reply_text: '' });
    const chat = chatOf(answer('list_collab_messages', { messages: [reply, gone] }));
    expect(chat.messages.map((bubble) => bubble.reply)).toEqual([{ name: 'anna', text: 'Shall we?' }, null]);
  });

  it('ASTCOLLAB-005: a face is a stored file name: a provider picture or a way up gives none', () => {
    const rows = [
      message(1, { user_id: 7, username: 'anna', avatar_url: '/uploads/avatars/anna.png' }),
      message(2, { avatar_url: 'https://idp.test/jon.png' }),
      message(3, { avatar_url: '/uploads/avatars/../secret.png' }),
    ];
    const chat = chatOf(answer('list_collab_messages', { messages: rows }));
    expect(chat.messages.map((bubble) => bubble.author.avatarKey)).toEqual(['anna.png', null, null]);
  });
});

describe('the chat card of a held write', () => {
  const listing = { messages: [message(1), message(2, ANNA_ROW), message(3, { deleted: 1 })] };

  it('ASTCOLLAB-010: a send shows the bubble as it will be posted, unmasked, by the user', () => {
    const text = 'Mail me at anna@example.test\nthanks';
    const chat = chatOf(changeCardOf('send_collab_message', ctx, { text }, null));
    expect(chat.messages).toEqual([
      {
        id: null,
        author: ANNA,
        text,
        cut: false,
        at: null,
        reply: null,
        reactions: [],
        files: [],
        fromAssistant: false,
        change: 'send',
        reactEmoji: null,
      },
    ]);
    const long = chatOf(changeCardOf('send_collab_message', ctx, { text: 'y'.repeat(4200) }, null));
    expect(long.messages[0]).toMatchObject({ cut: true });
    expect(long.messages[0]?.text).toHaveLength(4000);
    expect(changeCardOf('send_collab_message', ctx, {}, null)).toBeNull();
  });

  it('ASTCOLLAB-011: a reply quotes the message it answers from the lookup, nothing when it is gone', async () => {
    const read = vi.fn().mockResolvedValue(listing);
    expect(await loadFor('send_collab_message', { text: 'Hi' }, read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(await loadFor('send_collab_message', { text: 'Yes', replyTo: 1 }, read)).toBe(listing);
    expect(read).toHaveBeenCalledWith('list_collab_messages', undefined);
    const quoted = chatOf(changeCardOf('send_collab_message', ctx, { text: 'Yes', replyTo: 1 }, listing));
    expect(quoted.messages[0]?.reply).toEqual({ name: 'jon', text: 'Message 1' });
    for (const replyTo of [3, 99]) {
      const none = chatOf(changeCardOf('send_collab_message', ctx, { text: 'Yes', replyTo }, listing));
      expect(none.messages[0]?.reply).toBeNull();
    }
  });

  it("ASTCOLLAB-012: a delete shows the user's own message struck, and no card for another's or a missing one", () => {
    const own = chatOf(changeCardOf('delete_collab_message', ctx, { messageId: 2 }, listing));
    expect(own.messages[0]).toMatchObject({ id: 2, change: 'remove', author: ANNA });
    for (const messageId of [1, 3, 99]) {
      expect(changeCardOf('delete_collab_message', ctx, { messageId }, listing)).toBeNull();
    }
  });

  it('ASTCOLLAB-013: a reaction shows the message after the toggle, the toggled emoji marked', () => {
    const reacted = {
      messages: [
        message(1, {
          reactions: [
            { emoji: '❤️', count: 1, users: [{ user_id: 7, username: 'anna' }] },
            { emoji: '👍', count: 1, users: [{ user_id: 8, username: 'jon' }] },
          ],
        }),
      ],
    };
    const off = chatOf(changeCardOf('react_collab_message', ctx, { messageId: 1, emoji: '❤️' }, reacted));
    expect(off.messages[0]?.reactions).toEqual([{ emoji: '👍', count: 1, mine: false, names: ['jon'] }]);
    expect(off.messages[0]).toMatchObject({ change: 'react', reactEmoji: '❤️' });
    const more = chatOf(changeCardOf('react_collab_message', ctx, { messageId: 1, emoji: '👍' }, reacted));
    expect(more.messages[0]?.reactions[1]).toEqual({ emoji: '👍', count: 2, mine: true, names: ['jon', 'anna'] });
    const fresh = chatOf(changeCardOf('react_collab_message', ctx, { messageId: 1, emoji: '🎉' }, reacted));
    expect(fresh.messages[0]?.reactions[2]).toEqual({ emoji: '🎉', count: 1, mine: true, names: ['anna'] });
    expect(changeCardOf('react_collab_message', ctx, { messageId: 99, emoji: '🎉' }, reacted)).toBeNull();
    // Taken as sent: the server stores " 👍" as it gets it, a reaction of its own beside 👍.
    const spaced = chatOf(changeCardOf('react_collab_message', ctx, { messageId: 1, emoji: ' 👍' }, reacted));
    expect(spaced.messages[0]?.reactions.map((reaction) => reaction.emoji)).toEqual(['❤️', '👍', ' 👍']);
    expect(spaced.messages[0]?.reactEmoji).toBe(' 👍');
    expect(changeCardOf('react_collab_message', ctx, { messageId: 1, emoji: '  ' }, reacted)).toBeNull();
  });

  it('ASTCOLLAB-014: an applied send carries the posted message with its id and time', () => {
    const preview = describeToolCall('send_collab_message', 'call_1', { text: 'Hi' }, ctx, null);
    const result = { message: message(40, { ...ANNA_ROW, text: 'Hi', created_at: '2026-10-21 10:00:05' }) };
    const chat = chatOf(appliedCardOf('send_collab_message', { args: { text: 'Hi' }, result, preview }));
    expect(chat.messages[0]).toMatchObject({ id: 40, at: '2026-10-21T10:00:05Z', change: 'send', text: 'Hi' });
    const refused = { args: {}, result: 'Reply target message not found', preview };
    expect(appliedCardOf('send_collab_message', refused)).toBeNull();
    // The user's own words stay as the held card showed them, an address included.
    const text = 'Mail me at anna@example.test';
    const mailPreview = describeToolCall('send_collab_message', 'call_2', { text }, ctx, null);
    const mailed = { message: message(41, { ...ANNA_ROW, text }) };
    const sent = chatOf(appliedCardOf('send_collab_message', { args: { text }, result: mailed, preview: mailPreview }));
    expect(sent.messages[0]).toMatchObject({ id: 41, text, cut: false });
  });
});

describe('the poll cards', () => {
  const now = Date.parse('2026-10-21T12:00:00Z');

  it('ASTCOLLAB-020: a read shows up to four polls, the open ones first, the votes read for the user', () => {
    vi.useFakeTimers({ now });
    try {
      const rows = [
        poll(1, { is_closed: true }),
        poll(2, { deadline: '2026-10-20T00:00:00.000Z' }),
        poll(3),
        poll(4),
        poll(5),
        poll(6),
      ];
      const polls = pollsOf(answer('list_collab_polls', { polls: rows }));
      expect(polls.polls.map((p) => p.pollId)).toEqual([3, 4, 5, 6]);
      expect(polls.more).toBe(2);
      expect(polls.polls[0]?.options).toEqual([
        { text: 'Trattoria', votes: 1, mine: false, voters: [JON] },
        { text: 'Market', votes: 1, mine: true, voters: [ANNA_VOTER] },
        { text: 'Noodles', votes: 0, mine: false, voters: [] },
      ]);
      expect(polls.polls[0]).toMatchObject({ multiple: false, closed: false, author: JON, change: 'none' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('ASTCOLLAB-021: a new poll lists twelve options, counts the rest, and has no votes', () => {
    const options = Array.from({ length: 14 }, (_, index) => `Option ${index + 1}`);
    const args = { question: 'Where on Friday?', options, multiple: true, deadline: '2026-10-24T18:00:00+02:00' };
    const [created] = pollsOf(changeCardOf('create_collab_poll', ctx, args, null)).polls;
    expect(created?.options).toHaveLength(12);
    expect(created).toMatchObject({
      pollId: null,
      moreOptions: 2,
      multiple: true,
      deadline: '2026-10-24T16:00:00Z',
      author: ANNA,
      change: 'create',
    });
    expect(created?.options.every((option) => option.votes === 0 && !option.mine)).toBe(true);
    // A blank option keeps its place, since votes go by index; a deadline without a zone is no moment.
    const blank = { question: 'Which?', options: ['A', '  ', 'C'], deadline: '2026-10-24T18:00' };
    const [kept] = pollsOf(changeCardOf('create_collab_poll', ctx, blank, null)).polls;
    expect(kept?.options.map((option) => option.text)).toEqual(['A', '#2', 'C']);
    expect(kept?.deadline).toBeNull();
  });

  it('ASTCOLLAB-022: a vote moves a single choice, adds to a multiple choice and takes a repeat back', () => {
    const listing = { polls: [poll(1), poll(2, { multiple_choice: true })] };
    const vote = (pollId: number, optionIndex: number) =>
      pollsOf(changeCardOf('vote_collab_poll', ctx, { pollId, optionIndex }, listing)).polls[0];
    const moved = vote(1, 2);
    expect(moved?.options.map((option) => [option.votes, option.mine])).toEqual([
      [1, false],
      [0, false],
      [1, true],
    ]);
    expect(moved).toMatchObject({ votedIndex: 2, votedAdds: true, warning: null, change: 'vote' });
    const added = vote(2, 0);
    expect(added?.options.map((option) => option.mine)).toEqual([true, true, false]);
    const back = vote(1, 1);
    expect(back?.options[1]).toMatchObject({ votes: 0, mine: false });
    expect(back).toMatchObject({ votedIndex: 1, votedAdds: false });
  });

  it('ASTCOLLAB-023: a vote the server refuses says why, and no poll gives no card', () => {
    const listing = { polls: [poll(1, { is_closed: true }), poll(2)] };
    const closed = pollsOf(changeCardOf('vote_collab_poll', ctx, { pollId: 1, optionIndex: 0 }, listing)).polls[0];
    expect(closed).toMatchObject({ warning: 'closed', votedIndex: 0, votedAdds: false });
    expect(closed?.options[0]?.votes).toBe(1);
    const unknown = pollsOf(changeCardOf('vote_collab_poll', ctx, { pollId: 2, optionIndex: 9 }, listing)).polls[0];
    expect(unknown).toMatchObject({ warning: 'unknownOption', votedIndex: null });
    expect(changeCardOf('vote_collab_poll', ctx, { pollId: 3, optionIndex: 0 }, listing)).toBeNull();
  });

  it('ASTCOLLAB-024: closing marks the poll closed, deleting shows it as it is', () => {
    const listing = { polls: [poll(1)] };
    expect(pollsOf(changeCardOf('close_collab_poll', ctx, { pollId: 1 }, listing)).polls[0]).toMatchObject({
      closed: true,
      change: 'close',
    });
    expect(pollsOf(changeCardOf('delete_collab_poll', ctx, { pollId: 1 }, listing)).polls[0]).toMatchObject({
      closed: false,
      change: 'remove',
    });
    expect(changeCardOf('close_collab_poll', ctx, { pollId: 2 }, listing)).toBeNull();
  });

  it("ASTCOLLAB-025: an applied vote has the server's counts and keeps the user's options from the preview", () => {
    const listing = { polls: [poll(1)] };
    const preview = describeToolCall('vote_collab_poll', 'call_1', { pollId: 1, optionIndex: 2 }, ctx, listing);
    const result = {
      poll: poll(1, {
        options: [
          { text: 'Trattoria', voters: [voter(8, 'jon'), voter(9, 'mia')] },
          { text: 'Market', voters: [] },
          { text: 'Noodles', voters: [voter(7, 'anna')] },
        ],
      }),
    };
    const [applied] = pollsOf(appliedCardOf('vote_collab_poll', { args: {}, result, preview })).polls;
    expect(applied?.options.map((option) => [option.votes, option.mine])).toEqual([
      [2, false],
      [0, false],
      [1, true],
    ]);
    expect(applied).toMatchObject({ pollId: 1, change: 'vote', votedIndex: 2, votedAdds: true });
    const created = appliedCardOf('create_collab_poll', { args: {}, result: { poll: poll(5) }, preview: null });
    expect(pollsOf(created).polls[0]).toMatchObject({ pollId: 5, change: 'create' });
  });
});

describe('the note cards', () => {
  it('ASTCOLLAB-030: a read shows pinned notes first, then the latest changed, in their category colour', () => {
    const rows = [
      note(1, { category: 'Ideas', color: '#ef4444', updated_at: '2026-10-20 08:00:00' }),
      note(2, { category: 'Ideas', color: '#10b981', updated_at: '2026-10-21 08:00:00' }),
      note(3, { pinned: 1, website: 'https://www.luigis.it/menu', attachments: [{ id: 1 }, { id: 2 }] }),
      note(4, { website: 'javascript:alert(1)', content: 'Mail jon@example.test' }),
      note(5, { updated_at: '2026-10-01 08:00:00' }),
    ];
    const notes = notesOf(answer('list_collab_notes', { notes: rows }));
    expect(notes.notes.map((n) => n.noteId)).toEqual([3, 2, 4, 1]);
    expect(notes.more).toBe(1);
    expect(notes.notes[0]).toMatchObject({ pinned: true, websiteHost: 'luigis.it', files: 2, author: ANNA });
    expect(notes.notes[1]?.color).toBe('#10b981');
    expect(notes.notes[2]).toMatchObject({ websiteHost: null, body: 'Mail [hidden]', color: '#6366f1' });
    expect(notes.notes[3]?.color).toBe('#10b981');
    const few = notesOf(answer('list_collab_notes', { notes: [note(1), note(2)] }));
    expect(few.notes).toHaveLength(2);
    expect(few.more).toBe(0);
  });

  it('ASTCOLLAB-031: a new note lands in General without a category, in its category colour without a colour', () => {
    const listing = { notes: [note(1, { category: 'Food', color: '#f59e0b' })] };
    const plain = notesOf(changeCardOf('create_collab_note', ctx, { title: 'Ideas' }, listing)).notes[0];
    expect(plain).toMatchObject({ category: 'General', color: '#6366f1', change: 'create', noteId: null });
    expect(plain?.author).toEqual(ANNA);
    const pizza = { title: 'Pizza', category: 'Food' };
    const food = notesOf(changeCardOf('create_collab_note', ctx, pizza, listing)).notes[0];
    expect(food?.color).toBe('#f59e0b');
    const args = { title: 'Rome', content: 'Ask at anna@example.test', color: '#3b82f6', website: 'http://r.test/x' };
    const own = notesOf(changeCardOf('create_collab_note', ctx, args, listing)).notes[0];
    expect(own).toMatchObject({ color: '#3b82f6', body: 'Ask at anna@example.test', websiteHost: 'r.test' });
  });

  it('ASTCOLLAB-032: a change lists only the parts that differ, a link of null removes it', () => {
    const listing = { notes: [note(1, { title: 'Food', website: 'https://a.test', pinned: 0 })] };
    const args = { noteId: 1, title: 'Food', category: 'Eat', website: null, pinned: true };
    const changed = notesOf(changeCardOf('update_collab_note', ctx, args, listing)).notes[0];
    expect(changed?.changed).toEqual(['category', 'website', 'pinned']);
    expect(changed).toMatchObject({ category: 'Eat', websiteHost: null, pinned: true, change: 'update', noteId: 1 });
    expect(changeCardOf('update_collab_note', ctx, { noteId: 2, title: 'x' }, listing)).toBeNull();
    const removed = notesOf(changeCardOf('delete_collab_note', ctx, { noteId: 1 }, listing)).notes[0];
    expect(removed).toMatchObject({ change: 'remove', title: 'Food' });
  });

  it("ASTCOLLAB-033: an applied note carries the server's id and keeps the preview's colour and changes", () => {
    const listing = { notes: [note(1, { category: 'Food', color: '#f59e0b' })] };
    const args = { title: 'Pizza', category: 'Food' };
    const preview = describeToolCall('create_collab_note', 'call_1', args, ctx, listing);
    const result = { note: note(9, { title: 'Pizza', category: 'Food', color: '#6366f1' }) };
    const applied = notesOf(appliedCardOf('create_collab_note', { args: {}, result, preview })).notes[0];
    expect(applied).toMatchObject({ noteId: 9, color: '#f59e0b', change: 'create' });
  });
});

describe('the words, the receipts and the way back', () => {
  const messages = { messages: [message(2, { user_id: 7, username: 'anna', text: 'See you\nat nine' })] };
  const polls = { polls: [poll(1)] };
  const notes = { notes: [note(1, { title: 'Food', category: 'Ideas', pinned: 0 })] };

  it('ASTCOLLAB-040: every write names its tool in the trip chat, with its message, question or title', () => {
    const cases: Array<[string, Row, unknown, string]> = [
      ['send_collab_message', { text: 'Hello all\nsecond line' }, null, 'Hello all'],
      ['delete_collab_message', { messageId: 2 }, messages, 'See you'],
      ['react_collab_message', { messageId: 2, emoji: '👍' }, messages, '👍 See you'],
      ['create_collab_poll', { question: 'Where?', options: ['A', 'B'] }, null, 'Where?'],
      ['vote_collab_poll', { pollId: 1, optionIndex: 1 }, polls, 'Question 1?'],
      ['close_collab_poll', { pollId: 1 }, polls, 'Question 1?'],
      ['delete_collab_poll', { pollId: 1 }, polls, 'Question 1?'],
      ['create_collab_note', { title: 'Pizza' }, null, 'Pizza'],
      ['update_collab_note', { noteId: 1, pinned: true }, notes, 'Food'],
      ['delete_collab_note', { noteId: 1 }, notes, 'Food'],
    ];
    for (const [tool, args, loaded, subject] of cases) {
      const preview = describeToolCall(tool, 'call_1', args, ctx, loaded);
      expect(assistantChangePreviewSchema.safeParse(preview).success, tool).toBe(true);
      const verbKey = ASSISTANT_WRITE_TOOLS[tool]?.verbKey;
      expect(preview, tool).toMatchObject({ subject, tool, domain: 'collab', verbKey });
      expect(preview.card, tool).toBeDefined();
    }
  });

  it('ASTCOLLAB-041: a vote names its option, a note change its title, category and pin before and after', () => {
    expect(describeToolCall('vote_collab_poll', 'c', { pollId: 1, optionIndex: 1 }, ctx, polls).rows).toEqual([
      { op: 'add', labelKey: 'text', before: null, after: 'Market' },
    ]);
    const args = { noteId: 1, title: 'Eat', category: 'Food', pinned: true };
    expect(describeToolCall('update_collab_note', 'c', args, ctx, notes).rows).toEqual([
      { op: 'change', labelKey: 'name', before: 'Food', after: 'Eat' },
      { op: 'change', labelKey: 'category', before: 'Ideas', after: 'Food' },
      { op: 'change', labelKey: 'field', field: 'pinned', before: '✗', after: '✓' },
    ]);
  });

  it("ASTCOLLAB-042: a note id is the shared note's, never a day note of the same number", () => {
    const withDayNote = buildTripCard(
      1,
      7,
      { ...summary, days: [{ id: 31, day_number: 1, notes: [{ id: 1, text: 'Day note' }] }] },
      null,
      null,
    );
    expect(withDayNote.notes.get(1)?.text).toBe('Day note');
    const preview = describeToolCall('delete_collab_note', 'c', { noteId: 1 }, { ...ctx, card: withDayNote }, notes);
    expect(preview.subject).toBe('Food');
    expect(describeToolCall('delete_collab_note', 'c', { noteId: 1 }, ctx, null).subject).toBe('');
  });

  it('ASTCOLLAB-043: a receipt names the message, poll or note it touched', () => {
    const cases: Array<[string, Row, unknown, string, number[]]> = [
      ['send_collab_message', { text: 'x' }, { message: { id: 40 } }, 'collab_message', [40]],
      ['delete_collab_message', { messageId: 2 }, { success: true }, 'collab_message', [2]],
      ['react_collab_message', { messageId: 2, emoji: '👍' }, { reactions: [] }, 'collab_message', [2]],
      ['create_collab_poll', {}, { poll: { id: 5 } }, 'collab_poll', [5]],
      ['vote_collab_poll', { pollId: 5, optionIndex: 0 }, { poll: { id: 5 } }, 'collab_poll', [5]],
      ['close_collab_poll', { pollId: 5 }, { poll: { id: 5 } }, 'collab_poll', [5]],
      ['delete_collab_poll', { pollId: 5 }, { success: true }, 'collab_poll', [5]],
      ['create_collab_note', {}, { note: { id: 9 } }, 'collab_note', [9]],
      ['update_collab_note', { noteId: 9 }, { note: { id: 9 } }, 'collab_note', [9]],
      ['delete_collab_note', { noteId: 9 }, { success: true }, 'collab_note', [9]],
    ];
    for (const [tool, args, result, entity, ids] of cases) {
      expect(appliedChange(tool, 'c', args, result, null, null), tool).toMatchObject({ entity, ids });
    }
  });

  it('ASTCOLLAB-044: a new note or poll is taken back while nobody built on it; a message has no way back', () => {
    const createdNote = { note: note(9, { title: 'Pizza' }) };
    const createdPoll = { poll: poll(5, { options: [{ text: 'A', voters: [] }] }) };
    expect(ASSISTANT_UNDO_MAP.create_collab_note?.args({}, createdNote, null)).toEqual({ noteId: 9 });
    expect(ASSISTANT_UNDO_MAP.create_collab_poll?.args({}, createdPoll, null)).toEqual({ pollId: 5 });
    expect(ASSISTANT_UNDO_MAP.send_collab_message).toBeUndefined();
    expect(undoReadsOf('create_collab_note', {}, createdNote)).toEqual([{ tool: 'list_collab_notes', args: {} }]);
    const snapshot = (tool: string, value: unknown) => ({
      summary: {},
      places: {},
      reads: new Map([[readKey(tool, {}), value]]),
    });
    const noteKept = (rows: Row[]) =>
      unchangedSinceApplied('create_collab_note', createdNote, snapshot('list_collab_notes', { notes: rows }));
    const pollKept = (rows: Row[]) =>
      unchangedSinceApplied('create_collab_poll', createdPoll, snapshot('list_collab_polls', { polls: rows }));
    expect(noteKept([createdNote.note])).toBe(true);
    expect(noteKept([{ ...createdNote.note, updated_at: '2026-10-21 11:00:00' }])).toBe(false);
    // A file a teammate attached keeps the note, even when its last change stayed the same.
    expect(noteKept([{ ...createdNote.note, attachments: [{ id: 3, original_name: 'menu.pdf' }] }])).toBe(false);
    expect(pollKept([createdPoll.poll])).toBe(true);
    expect(pollKept([{ ...createdPoll.poll, options: [{ text: 'A', voters: [voter(8, 'jon')] }] }])).toBe(false);
    expect(pollKept([])).toBe(false);
  });
});

describe('the bounds', () => {
  it('ASTCOLLAB-050: a moment is read as UTC to the second; a deadline without a zone is none', () => {
    expect(stampOf('2026-10-21 09:12:00')).toBe('2026-10-21T09:12:00Z');
    expect(stampOf('2026-10-21T09:12:00.000Z')).toBe('2026-10-21T09:12:00Z');
    expect(stampOf('2026-10-21T11:12:00+02:00')).toBe('2026-10-21T09:12:00Z');
    expect(stampOf('2026-10-24')).toBe('2026-10-24T00:00:00Z');
    expect(stampOf('Friday')).toBeNull();
    expect(stampOf(null)).toBeNull();
    expect(deadlineOf('2026-10-24T18:00:00+02:00')).toBe('2026-10-24T16:00:00Z');
    expect(deadlineOf('2026-10-24T18:00:00.000Z')).toBe('2026-10-24T18:00:00Z');
    expect(deadlineOf('2026-10-24')).toBe('2026-10-24T00:00:00Z');
    expect(deadlineOf('2026-10-24T18:00')).toBeNull();
    expect(deadlineOf('2026-10-24 18:00:00')).toBeNull();
  });

  it('ASTCOLLAB-051: the largest chat, poll and note cards fit the card size', () => {
    const words = (n: number) => 'word '.repeat(n);
    const reactions = ['1', '2', '3', '4', '5', '6', '7', '8'].map((emoji) => ({
      emoji,
      users: [1, 2, 3, 4, 5, 6].map((id) => ({ user_id: id, username: 'n'.repeat(80) })),
    }));
    const files = [1, 2, 3, 4].map((id) => ({ id, original_name: 'f'.repeat(120), mime_type: 'image/png' }));
    const reply = { reply_username: 'r'.repeat(80), reply_text: words(40) };
    const heavy = { text: words(200), ...reply, reactions, attachments: files };
    const chat = chatOf(answer('list_collab_messages', { messages: [1, 2, 3, 4, 5].map((id) => message(id, heavy)) }));
    expect(chat.messages.length + chat.earlier).toBe(5);
    expect(chat.messages.at(-1)?.id).toBe(5);
    const options = Array.from({ length: 20 }, (_, index) => ({
      text: `${index} ${words(40)}`,
      voters: [1, 2, 3].map((id) => voter(id, 'v'.repeat(80))),
    }));
    const bigPolls = pollsOf(answer('list_collab_polls', { polls: [1, 2, 3, 4].map((id) => poll(id, { options })) }));
    expect(bigPolls.polls.length + bigPolls.more).toBe(4);
    expect(bigPolls.polls[0]?.pollId).toBe(1);
    const bigNote = { title: words(50), content: words(200), category: 'c'.repeat(100) };
    const bigNotes = notesOf(answer('list_collab_notes', { notes: [1, 2, 3, 4].map((id) => note(id, bigNote)) }));
    for (const built of [chat, bigPolls, bigNotes]) {
      expect(JSON.stringify(built).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    }
  });
});
