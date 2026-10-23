import { assistantAppliedSchema } from '../assistant.schema';
import {
  COLLAB_APPLIED_ENTITIES,
  COLLAB_VERB_KEYS,
  type CollabChatCard,
  type CollabNotesCard,
  type CollabPollsCard,
} from './collab.contract';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

const ANNA = { id: 7, name: 'Anna', avatarKey: 'anna.png' };

/** A message as the trip chat shows it. */
const bubble = (over: Partial<CollabChatCard['messages'][number]> = {}): CollabChatCard['messages'][number] => ({
  id: 11,
  author: ANNA,
  text: 'Shall we take\nthe early train?',
  cut: false,
  at: '2026-10-21T09:12:00Z',
  reply: null,
  reactions: [{ emoji: '❤️', count: 2, mine: true, names: ['Anna', 'Jon'] }],
  files: [{ fileId: 4, image: true, name: 'ticket.jpg' }],
  fromAssistant: false,
  change: 'none',
  reactEmoji: null,
  ...over,
});

const chat = (over: Partial<CollabChatCard> = {}): CollabChatCard => ({
  kind: 'collabChat',
  messages: [bubble()],
  earlier: 3,
  ...over,
});

const poll = (over: Partial<CollabPollsCard['polls'][number]> = {}): CollabPollsCard['polls'][number] => ({
  pollId: 5,
  question: 'Where do we eat on Friday?',
  options: [
    { text: 'Trattoria Roma', votes: 2, mine: true, voters: [ANNA] },
    { text: 'Night market', votes: 0, mine: false, voters: [] },
  ],
  moreOptions: 0,
  multiple: false,
  closed: false,
  deadline: '2026-10-24T18:00:00Z',
  author: ANNA,
  change: 'none',
  votedIndex: null,
  votedAdds: false,
  warning: null,
  ...over,
});

const note = (over: Partial<CollabNotesCard['notes'][number]> = {}): CollabNotesCard['notes'][number] => ({
  noteId: 9,
  title: 'Restaurants to try',
  body: 'Pasta at **Luigi**\nthe rooftop bar',
  category: 'Ideas',
  color: '#10b981',
  pinned: true,
  websiteHost: 'luigis.it',
  files: 2,
  author: ANNA,
  change: 'none',
  changed: [],
  ...over,
});

describe('the trip chat cards', () => {
  it('CARDS-COLLAB-001: a chat, a poll and a note card read as themselves in the union', () => {
    for (const card of [
      chat(),
      { kind: 'collabPolls', polls: [poll()], more: 2 },
      { kind: 'collabNotes', notes: [note()], more: 0 },
    ]) {
      expect(trekCardSchema.parse(card)).toEqual(card);
    }
  });

  it('CARDS-COLLAB-002: a held send has no id and no time yet, and an image alone has no text', () => {
    const held = chat({ messages: [bubble({ id: null, at: null, change: 'send', reactions: [], files: [] })] });
    expect(trekCardSchema.parse(held)).toEqual(held);
    expect(trekCardSchema.safeParse(chat({ messages: [bubble({ text: '' })] })).success).toBe(true);
  });

  it('CARDS-COLLAB-003: an avatar is a stored file name, never an address or a way up', () => {
    for (const avatarKey of ['https://idp.test/me.png', '../secret.png', '/uploads/avatars/a.png']) {
      const card = chat({ messages: [bubble({ author: { ...ANNA, avatarKey } })] });
      expect(trekCardSchema.safeParse(card).success).toBe(false);
      expect(storedTrekCardSchema.parse(card)).toBeNull();
    }
  });

  it('CARDS-COLLAB-004: a time is a UTC moment to the second, as the server normalises it', () => {
    expect(trekCardSchema.safeParse(chat({ messages: [bubble({ at: '2026-10-21 09:12:00' })] })).success).toBe(false);
    expect(trekCardSchema.safeParse(chat({ messages: [bubble({ at: '2026-10-21T09:12Z' })] })).success).toBe(false);
    const late = { kind: 'collabPolls', polls: [poll({ deadline: '2026-10-24' })], more: 0 };
    expect(trekCardSchema.safeParse(late).success).toBe(false);
  });

  it('CARDS-COLLAB-005: lists past their bounds read as null', () => {
    const seven = Array.from({ length: 7 }, (_, index) => bubble({ id: index + 1 }));
    expect(storedTrekCardSchema.parse(chat({ messages: seven }))).toBeNull();
    expect(storedTrekCardSchema.parse(chat({ messages: [] }))).toBeNull();
    const five = [1, 2, 3, 4, 5].map((pollId) => poll({ pollId }));
    expect(storedTrekCardSchema.parse({ kind: 'collabPolls', polls: five, more: 0 })).toBeNull();
    expect(storedTrekCardSchema.parse({ kind: 'collabNotes', notes: [], more: 0 })).toBeNull();
    const many = Array.from({ length: 13 }, (_, index) => ({ text: `#${index}`, votes: 0, mine: false, voters: [] }));
    expect(storedTrekCardSchema.parse({ kind: 'collabPolls', polls: [poll({ options: many })], more: 0 })).toBeNull();
    expect(storedTrekCardSchema.parse(chat({ messages: [bubble({ text: 'x'.repeat(4001) })] }))).toBeNull();
  });

  it('CARDS-COLLAB-006: a note colour is a hex colour and its link only a host', () => {
    const tinted = { kind: 'collabNotes', notes: [note({ color: 'url(https://x.test/p)' })], more: 0 };
    expect(trekCardSchema.safeParse(tinted).success).toBe(false);
    const linked = { kind: 'collabNotes', notes: [{ ...note(), website: 'https://x.test' }], more: 0 };
    expect(trekCardSchema.parse(linked)).toEqual({ kind: 'collabNotes', notes: [note()], more: 0 });
  });

  it('CARDS-COLLAB-007: the trip chat adds three applied entities and no verb', () => {
    expect(COLLAB_VERB_KEYS).toEqual([]);
    for (const entity of COLLAB_APPLIED_ENTITIES) {
      const receipt = { toolCallId: 'call_1', entity, ids: [3], dayId: null, undoUntil: null };
      expect(assistantAppliedSchema.parse(receipt).entity).toBe(entity);
    }
  });
});
