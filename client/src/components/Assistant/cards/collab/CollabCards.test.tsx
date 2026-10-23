/**
 * FE-AI-COLLAB-001 to FE-AI-COLLAB-033
 *
 * The trip chat's cards as the assistant chat draws them: messages as the
 * chat draws them (sides, faces, names, quotes, reactions, a held send, a
 * removal), polls as the Collab tab draws them (results only after a vote or
 * the end, the winner, a held vote), shared notes with their colour, facts
 * and changes, the phone's sizes, and the pure look and model behind them.
 */
import type {
  AssistantMessage,
  CollabBubbleCard,
  CollabChatCard,
  CollabNoteCard,
  CollabNotesCard,
  CollabPollCard,
  CollabPollsCard,
  TrekCard,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAuthStore } from '../../../../store/authStore';
import { formatChatClockTime } from '../../../Collab/collabModel';
import type { ChangeItem, ChangeState } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { CARD_LOOKS, CARD_RULES, ENTITY_LOOK, STEP_LOOKS, TOOL_LABELS } from '../cardLooks';
import type { CardEntry } from '../cardTypes';
import { bubbleStatus, mergedChat, pollOutcome, shareOf, spotOf } from './collabCardModel';
import CollabChatBlock, { CollabChatBody } from './CollabChatCard';
import { CHAT_TARGET, NOTES_TARGET, POLLS_TARGET, readServedChange } from './collabLook';
import CollabNotesBlock, { CollabNoteFacts, CollabNotesBody } from './CollabNotesCard';
import CollabPollsBlock, { CollabPollsBody } from './CollabPollsCard';

const AUTH = useAuthStore.getState();
const MESSAGE = { id: 'm1', role: 'assistant', parts: [] } as unknown as AssistantMessage;
const ANNA = { id: 7, name: 'Anna', avatarKey: 'anna.png' };
const JON = { id: 8, name: 'Jon', avatarKey: null };

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: 7 }) });
});

afterEach(() => {
  useAuthStore.setState(AUTH, true);
  vi.useRealTimers();
});

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', density: 'compact', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const entries = (...cards: TrekCard[]): CardEntry[] =>
  cards.map((card, index) => ({ toolCallId: `call_${index}`, card }));

/** A change row holding `card`, decided as `state`, with the change's own rows. */
const itemOf = (card: TrekCard, state: ChangeState, rows: unknown[] = []): ChangeItem =>
  ({
    toolCallId: 'call_x',
    preview: {
      toolCallId: 'call_x',
      verbKey: 'genericUpdate',
      subject: 'x',
      rows,
      dayId: null,
      placeIds: [],
      undoable: false,
    },
    applied: null,
    state,
    card,
  }) as unknown as ChangeItem;

const bubble = (over: Partial<CollabBubbleCard> = {}): CollabBubbleCard => ({
  id: 1,
  author: JON,
  text: 'Shall we take the early train?',
  cut: false,
  at: '2026-10-21T09:12:00Z',
  reply: null,
  reactions: [],
  files: [],
  fromAssistant: false,
  change: 'none',
  reactEmoji: null,
  ...over,
});

const chat = (messages: CollabBubbleCard[], earlier = 0): CollabChatCard => ({ kind: 'collabChat', messages, earlier });

const poll = (over: Partial<CollabPollCard> = {}): CollabPollCard => ({
  pollId: 5,
  question: 'Where do we eat on Friday?',
  options: [
    { text: 'Trattoria Roma', votes: 2, mine: false, voters: [ANNA, JON] },
    { text: 'Night market', votes: 1, mine: false, voters: [JON] },
  ],
  moreOptions: 0,
  multiple: false,
  closed: false,
  deadline: null,
  author: JON,
  change: 'none',
  votedIndex: null,
  votedAdds: false,
  warning: null,
  ...over,
});

const polls = (...list: CollabPollCard[]): CollabPollsCard => ({ kind: 'collabPolls', polls: list, more: 0 });

const note = (over: Partial<CollabNoteCard> = {}): CollabNoteCard => ({
  noteId: 9,
  title: 'Restaurants to try',
  body: 'Pasta at **Luigi** and https://luigis.example/menu',
  category: 'Ideas',
  color: '#10b981',
  pinned: false,
  websiteHost: 'luigis.example',
  files: 2,
  author: ANNA,
  change: 'none',
  changed: [],
  ...over,
});

const notes = (...list: CollabNoteCard[]): CollabNotesCard => ({ kind: 'collabNotes', notes: list, more: 0 });

describe('the chat card', () => {
  it('FE-AI-COLLAB-001: puts the others on one side with face and name, the user on the other in the accent', () => {
    const thread = chat([bubble(), bubble({ id: 2, author: ANNA, text: 'Yes, 7:40 from the main station.' })]);
    inView(<CollabChatBlock cards={entries(thread)} message={MESSAGE} />);
    const other = screen.getByText('Shall we take the early train?').closest('div[style]');
    const own = screen.getByText('Yes, 7:40 from the main station.').closest('div[style]');
    expect(other?.getAttribute('style')).toContain('background: var(--bg-card)');
    expect(own?.getAttribute('style')).toContain('background: var(--accent)');
    expect(screen.getByText('Jon')).toBeInTheDocument();
    expect(screen.queryByText('Anna')).toBeNull();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-002: quotes a reply, names who reacted, keeps links as words and draws emoji alone large', () => {
    const thread = chat([
      bubble({
        reply: { name: 'Anna', text: 'Train or bus?' },
        text: 'See https://rail.example/times',
        reactions: [{ emoji: '❤️', count: 2, mine: true, names: ['Anna', 'Jon'] }],
      }),
      bubble({ id: 2, text: '🎉' }),
    ]);
    const { container } = inView(<CollabChatBlock cards={entries(thread)} message={MESSAGE} />);
    expect(screen.getByText('Train or bus?')).toBeInTheDocument();
    expect(screen.getByText('https://rail.example/times').tagName).toBe('SPAN');
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByLabelText('❤️ 2: Anna, Jon')).toBeInTheDocument();
    expect(screen.getByText('🎉').getAttribute('style')).toContain('font-size: calc(40px');
  });

  it('FE-AI-COLLAB-003: merges the reads of one answer, each message once in order, counts the older ones and opens the chat', () => {
    const onOpen = vi.fn();
    const first = chat([bubble({ id: 2, at: '2026-10-21T09:13:00Z', text: 'second' }), bubble({ text: 'first' })], 3);
    const second = chat([bubble({ id: 2, at: '2026-10-21T09:13:00Z', text: 'second' })], 1);
    inView(<CollabChatBlock cards={entries(first, second)} message={MESSAGE} />, { onOpen });
    expect(screen.getAllByText('second')).toHaveLength(1);
    const texts = [...document.querySelectorAll('div[style]')].map((el) => el.textContent);
    expect(texts.indexOf('first')).toBeLessThan(texts.indexOf('second'));
    expect(screen.getByText('3 earlier messages')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open the chat/ }));
    expect(onOpen).toHaveBeenCalledWith(CHAT_TARGET);
  });

  it('FE-AI-COLLAB-004: a held send says it is not sent yet, then its time and sent, or not sent', () => {
    const held = chat([bubble({ id: null, at: null, author: ANNA, text: 'Booked!', change: 'send' })]);
    const { rerender } = inView(<CollabChatBody card={held} item={itemOf(held, 'pending')} />);
    expect(screen.getByText('Not sent yet')).toBeInTheDocument();
    const sent = chat([bubble({ id: 40, author: ANNA, text: 'Booked!', change: 'send' })]);
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabChatBody card={sent} item={itemOf(sent, 'applied')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText(formatChatClockTime('2026-10-21T09:12:00Z', false))).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sent' })).toBeInTheDocument();
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabChatBody card={held} item={itemOf(held, 'failed')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText('Not sent')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-005: a removal strikes the message, and once applied reads as the chat placeholder under its day', () => {
    vi.useFakeTimers({ now: new Date('2026-10-21T12:00:00Z'), toFake: ['Date'] });
    const removing = chat([bubble({ author: ANNA, text: 'Wrong train', change: 'remove' })]);
    const { rerender } = inView(<CollabChatBody card={removing} item={itemOf(removing, 'pending')} />);
    expect(screen.getByText('Wrong train').closest('.line-through')).not.toBeNull();
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabChatBody card={removing} item={itemOf(removing, 'applied')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.queryByText('Wrong train')).toBeNull();
    expect(screen.getByText('You deleted a message')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-006: a held reaction rings the emoji it toggles until it is applied', () => {
    const reacting = chat([
      bubble({
        change: 'react',
        reactEmoji: '👍',
        reactions: [
          { emoji: '👍', count: 1, mine: true, names: ['Anna'] },
          { emoji: '❤️', count: 1, mine: false, names: ['Jon'] },
        ],
      }),
    ]);
    const { rerender } = inView(<CollabChatBody card={reacting} item={itemOf(reacting, 'pending')} />);
    expect(screen.getByLabelText('👍 1: Anna').className).toContain('border-dashed');
    expect(screen.getByLabelText('❤️ 1: Jon').className).not.toContain('border-dashed');
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabChatBody card={reacting} item={itemOf(reacting, 'applied')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByLabelText('👍 1: Anna').className).not.toContain('border-dashed');
  });

  it('FE-AI-COLLAB-033: a held reaction that takes away the last of its emoji keeps it faint until applied', () => {
    const takingBack = chat([
      bubble({
        change: 'react',
        reactEmoji: '🎉',
        reactions: [{ emoji: '❤️', count: 1, mine: false, names: ['Jon'] }],
      }),
    ]);
    const { rerender } = inView(<CollabChatBody card={takingBack} item={itemOf(takingBack, 'pending')} />);
    const faint = screen.getByLabelText('Reaction 🎉 taken back');
    expect(faint.className).toContain('border-dashed');
    expect(faint.className).toContain('opacity-40');
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabChatBody card={takingBack} item={itemOf(takingBack, 'applied')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.queryByLabelText('Reaction 🎉 taken back')).toBeNull();
    expect(screen.getByLabelText('❤️ 1: Jon')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-007: an image is drawn from TREK by its id, another file named, a cut message says so', () => {
    const files = chat([
      bubble({
        cut: true,
        files: [
          { fileId: 31, image: true, name: 'ticket.jpg' },
          { fileId: 32, image: false, name: 'plan.pdf' },
        ],
      }),
    ]);
    inView(<CollabChatBlock cards={entries(files)} message={MESSAGE} />);
    expect(screen.getByAltText('ticket.jpg').getAttribute('src')).toBe('/api/trips/4/files/31/download');
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
    expect(screen.getByText('Continues in the chat')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-008: on the phone the faces are smaller and the bubbles wider', () => {
    const thread = chat([bubble()]);
    inView(<CollabChatBlock cards={entries(thread)} message={MESSAGE} />, { variant: 'fullscreen' });
    const face = screen.getByText('J');
    expect(face.getAttribute('style')).toContain('width: 24px');
    expect(face.parentElement?.nextElementSibling?.getAttribute('style')).toContain('max-width: 85%');
  });

  it('FE-AI-COLLAB-009: a message shared from the assistant carries the mark', () => {
    inView(<CollabChatBlock cards={entries(chat([bubble({ fromAssistant: true })]))} message={MESSAGE} />);
    expect(screen.getByText('from the assistant')).toBeInTheDocument();
  });
});

describe('the poll card', () => {
  it('FE-AI-COLLAB-010: hides the results until the user voted, then shows the shares and voters', () => {
    const { rerender } = inView(<CollabPollsBlock cards={entries(polls(poll()))} message={MESSAGE} />);
    expect(screen.queryByText('67%')).toBeNull();
    expect(screen.getByText('3 votes')).toBeInTheDocument();
    const voted = poll({
      options: [
        { text: 'Trattoria Roma', votes: 2, mine: true, voters: [ANNA, JON] },
        { text: 'Night market', votes: 1, mine: false, voters: [JON] },
      ],
    });
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabPollsBlock cards={entries(polls(voted))} message={MESSAGE} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-011: an ended poll shows its results, marks the winner and says it is closed', () => {
    const { container } = inView(<CollabPollsBlock cards={entries(polls(poll({ closed: true })))} message={MESSAGE} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    const bars = [...container.querySelectorAll('span[aria-hidden="true"][style]')];
    expect(bars.some((bar) => bar.getAttribute('style')?.includes('var(--success-soft)'))).toBe(true);
  });

  it('FE-AI-COLLAB-012: a held vote rings its option, and nothing on the card votes', () => {
    const held = polls(
      poll({
        change: 'vote',
        votedIndex: 1,
        votedAdds: true,
        options: [
          { text: 'Trattoria Roma', votes: 2, mine: false, voters: [ANNA, JON] },
          { text: 'Night market', votes: 2, mine: true, voters: [JON, ANNA] },
        ],
      })
    );
    const { container } = inView(<CollabPollsBody card={held} item={itemOf(held, 'pending')} />);
    expect(screen.getByText('Your vote')).toBeInTheDocument();
    expect(container.querySelector('.border-dashed')?.textContent).toContain('Night market');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('FE-AI-COLLAB-013: a refused vote says why, a new poll says it is new, a removed one is struck', () => {
    const refused = polls(poll({ change: 'vote', closed: true, warning: 'closed', votedIndex: 0 }));
    const { rerender } = inView(<CollabPollsBody card={refused} item={itemOf(refused, 'pending')} />);
    expect(screen.getByText('This poll is closed')).toBeInTheDocument();
    expect(screen.queryByText('Your vote')).toBeNull();
    const created = polls(poll({ pollId: null, change: 'create', moreOptions: 2 }));
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabPollsBody card={created} item={itemOf(created, 'pending')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('2 more options')).toBeInTheDocument();
    const removed = polls(poll({ change: 'remove' }));
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabPollsBody card={removed} item={itemOf(removed, 'pending')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText('Where do we eat on Friday?').className).toContain('line-through');
  });

  it('FE-AI-COLLAB-014: counts the polls left out and leads to them', () => {
    const onOpen = vi.fn();
    const card: CollabPollsCard = { ...polls(poll()), more: 2 };
    inView(<CollabPollsBlock cards={entries(card)} message={MESSAGE} />, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: '2 more polls' }));
    expect(onOpen).toHaveBeenCalledWith(POLLS_TARGET);
  });
});

describe('the note card', () => {
  it('FE-AI-COLLAB-020: tints the head by the category colour and states the link host, files and category', () => {
    inView(<CollabNotesBlock cards={entries(notes(note()))} message={MESSAGE} />);
    expect(screen.getByTestId('note-category-dot').style.background).toBe('rgb(16, 185, 129)');
    expect(screen.getByText('luigis.example')).toBeInTheDocument();
    expect(screen.getByText('2 files')).toBeInTheDocument();
    expect(screen.getByText('https://luigis.example/menu').tagName).toBe('SPAN');
  });

  it('FE-AI-COLLAB-021: a colour that is no colour falls back to the accent, a pinned note wears its pin', () => {
    const odd = note({ noteId: 1, title: 'Odd', color: 'url(x)' });
    const pinned = note({ noteId: 2, title: 'Pinned one', pinned: true });
    inView(<CollabNotesBlock cards={entries(notes(odd, pinned))} message={MESSAGE} />);
    expect(screen.getByRole('article', { name: 'Odd' }).querySelector('[style*="var(--accent)"]')).not.toBeNull();
    expect(screen.getByRole('article', { name: 'Pinned one' }).querySelector('.lucide-pin')).not.toBeNull();
    expect(screen.getByRole('article', { name: 'Odd' }).querySelector('.lucide-pin')).toBeNull();
  });

  it('FE-AI-COLLAB-022: a held new note has a dashed frame, a note about to go is struck', () => {
    const created = notes(note({ noteId: null, change: 'create' }));
    const { rerender } = inView(<CollabNotesBody card={created} item={itemOf(created, 'pending')} />);
    expect(screen.getByRole('article').className).toContain('border-dashed');
    const removed = notes(note({ change: 'remove' }));
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <CollabNotesBody card={removed} item={itemOf(removed, 'pending')} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByText('Restaurants to try').closest('.line-through')).not.toBeNull();
  });

  it('FE-AI-COLLAB-023: two notes stand side by side where the chat has room, one under the other where it has not', () => {
    const pair = entries(notes(note(), note({ noteId: 10, title: 'Second' })));
    const { container, rerender } = inView(<CollabNotesBlock cards={pair} message={MESSAGE} />, { density: 'roomy' });
    expect(container.querySelector('.grid-cols-2')).not.toBeNull();
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window', density: 'compact' }}>
        <CollabNotesBlock cards={pair} message={MESSAGE} />
      </AssistantViewContext.Provider>
    );
    expect(container.querySelector('.grid-cols-2')).toBeNull();
  });

  it('FE-AI-COLLAB-024: a note change states its title and category before and after, and its pin', () => {
    const changed = notes(note({ change: 'update', changed: ['title', 'pinned'], pinned: true }));
    const rows = [
      { op: 'change', labelKey: 'name', before: 'Food', after: 'Restaurants to try' },
      { op: 'change', labelKey: 'category', before: 'General', after: 'Ideas' },
      { op: 'change', labelKey: 'field', field: 'pinned', before: 'no', after: 'yes' },
    ];
    const { unmount } = inView(<CollabNoteFacts card={changed} item={itemOf(changed, 'pending', rows)} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    unmount();
    // The pin follows the note the change leaves, whatever glyph the row carries.
    const unpinned = notes(note({ change: 'update', changed: ['pinned'], pinned: false }));
    const pinRow = [{ op: 'change', labelKey: 'field', field: 'pinned', before: 'yes', after: 'no' }];
    inView(<CollabNoteFacts card={unpinned} item={itemOf(unpinned, 'pending', pinRow)} />);
    expect(screen.queryByText('Pinned')).toBeNull();
    expect(screen.getByText('No longer pinned')).toBeInTheDocument();
  });

  it('FE-AI-COLLAB-025: leads to the notes from its head', () => {
    const onOpen = vi.fn();
    inView(<CollabNotesBlock cards={entries(notes(note()))} message={MESSAGE} />, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: /Open the notes/ }));
    expect(onOpen).toHaveBeenCalledWith(NOTES_TARGET);
  });
});

describe('the look and the model', () => {
  it('FE-AI-COLLAB-030: names every collab tool and read, and opens the Collab tab on its part', () => {
    for (const tool of ['delete_collab_message', 'create_collab_poll', 'vote_collab_poll', 'update_collab_note']) {
      expect(TOOL_LABELS[tool]?.labelKey).toBe(`assistant.tool.${tool}`);
    }
    expect(STEP_LOOKS.list_collab_messages?.stepKey).toBe('assistant.step.collabChat');
    expect(STEP_LOOKS.list_collab_notes?.stepKey).toBe('assistant.step.collabNotes');
    const applied = { toolCallId: 'c', ids: [1], dayId: null, undoUntil: null };
    expect(ENTITY_LOOK.collab_message.open?.({ ...applied, entity: 'collab_message' }, null)).toEqual(CHAT_TARGET);
    expect(ENTITY_LOOK.collab_poll.open?.({ ...applied, entity: 'collab_poll' }, null)).toEqual(POLLS_TARGET);
    expect(ENTITY_LOOK.collab_note.open?.({ ...applied, entity: 'collab_note' }, null)).toEqual(NOTES_TARGET);
    expect(CARD_LOOKS.collabPolls.entity?.(polls(poll()))).toBe('collab_poll');
  });

  it('FE-AI-COLLAB-031: a read of the one poll or note a change touches gives way to it; a list or the chat stays', () => {
    const vote = polls(poll({ change: 'vote', votedIndex: 0, votedAdds: true }));
    expect(readServedChange(polls(poll()), vote)).toBe(true);
    expect(CARD_RULES.yieldsToChange(polls(poll()), vote)).toBe(true);
    expect(readServedChange(polls(poll(), poll({ pollId: 6 })), vote)).toBe(false);
    expect(readServedChange(polls(poll({ pollId: 6 })), vote)).toBe(false);
    expect(readServedChange(notes(note()), notes(note({ change: 'update' })))).toBe(true);
    expect(CARD_RULES.yieldsToChange(chat([bubble()]), chat([bubble({ change: 'react' })]))).toBe(false);
  });

  it('FE-AI-COLLAB-032: groups bubbles by sender and day, and reads a poll by its outcome', () => {
    vi.useFakeTimers({ now: new Date('2026-10-22T12:00:00Z') });
    const run = [bubble(), bubble({ id: 2 }), bubble({ id: 3, author: ANNA, at: '2026-10-22T09:00:00Z' })];
    expect(spotOf(run, 0)).toEqual({ newGroup: true, lastInGroup: false, newDay: true });
    expect(spotOf(run, 1)).toEqual({ newGroup: false, lastInGroup: true, newDay: false });
    expect(spotOf(run, 2)).toEqual({ newGroup: true, lastInGroup: true, newDay: true });
    const merged = mergedChat(entries(chat([bubble({ id: null, at: null }), bubble({ id: 4 })], 2), chat(run)));
    expect(merged.messages.map((b) => b.id)).toEqual([1, 2, 4, 3, null]);
    expect(merged.earlier).toBe(2);
    expect(bubbleStatus(bubble({ change: 'send', at: null }), 'pending')).toBe('waiting');
    expect(bubbleStatus(bubble({ change: 'send' }), 'discarded')).toBe('none');
    expect(bubbleStatus(bubble(), null)).toBe('time');
    const ended = pollOutcome(poll({ deadline: '2026-10-21T00:00:00Z' }));
    expect(ended).toMatchObject({ ended: true, showResults: true, top: 2 });
    expect(pollOutcome(poll())).toMatchObject({ total: 3, ended: false, showResults: false });
    expect(shareOf(2, 3)).toBe(67);
    expect(shareOf(0, 0)).toBe(0);
  });
});
