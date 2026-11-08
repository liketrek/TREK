import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/poll/App';
import { optionText, orderPolls, votedPoll, voteShares, type Poll } from '../../src/widgets/poll/pollModel';
import { Polls } from '../../src/widgets/poll/Polls';

const t = translator('en');
const voter = (id: number) => ({ id, user_id: id, username: `u${id}`, avatar: null, avatar_url: null });
const poll = (id: number, extra: Partial<Poll> = {}): Poll =>
  ({
    id,
    trip_id: 4,
    user_id: 1,
    question: `Question ${id}`,
    options: [
      { text: 'Lisbon', label: null, voters: [voter(1), voter(2), voter(3)] },
      { text: null, label: 'Porto', voters: [voter(4)] },
    ],
    multiple: 0,
    closed: 0,
    deadline: null,
    created_at: null,
    username: 'ana',
    avatar: null,
    avatar_url: null,
    is_closed: false,
    multiple_choice: false,
    ...extra,
  }) as Poll;

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));
afterEach(cleanup);

describe('pollModel', () => {
  it('APPS-POLL-001: reads an option’s text or label, shares the votes, and puts open polls first', () => {
    expect(optionText({ text: 'A', label: 'B' })).toBe('A');
    expect(optionText({ text: null, label: 3 })).toBe('3');
    expect(optionText({ text: { x: 1 }, label: undefined })).toBe('');
    expect(voteShares(poll(1))).toEqual([0.75, 0.25]);
    expect(voteShares(poll(1, { options: [{ text: 'A', label: null, voters: [] }] }))).toEqual([0]);
    expect(orderPolls([poll(1, { is_closed: true }), poll(2), poll(3)]).map((p) => p.id)).toEqual([3, 2, 1]);
  });

  it('APPS-POLL-002: reads the poll back from a vote’s answer, and nothing else', () => {
    expect(votedPoll(JSON.stringify({ poll: poll(5) }))?.id).toBe(5);
    expect(votedPoll('not json')).toBeNull();
    expect(votedPoll(JSON.stringify({ ok: true }))).toBeNull();
    expect(votedPoll(undefined)).toBeNull();
  });
});

describe('Polls', () => {
  it('APPS-POLL-003: shows each poll with its results, closed ones not votable', () => {
    render(<Polls data={{ polls: [poll(1, { is_closed: true }), poll(2)] }} locale="en" t={t} onVote={vi.fn()} />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Question 2',
      'Question 1',
    ]);
    expect(screen.getAllByText('75% · 3')).toHaveLength(2);
    expect(screen.getByText('Closed')).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: /Lisbon/ });
    expect(buttons[0].hasAttribute('disabled')).toBe(false);
    expect(buttons[1].hasAttribute('disabled')).toBe(true);
  });

  it('APPS-POLL-004: shows the poll TREK answered after a vote, and says when the vote failed', async () => {
    const onVote = vi
      .fn()
      .mockResolvedValueOnce(poll(2, { options: [{ text: 'Lisbon', label: null, voters: [voter(1)] }] }))
      .mockResolvedValueOnce(null);
    render(<Polls data={{ polls: [poll(2)] }} locale="en" t={t} onVote={onVote} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Porto/ })));
    expect(onVote).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), 1);
    expect(screen.getByText('100% · 1')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Lisbon/ })));
    expect(screen.getByRole('alert').textContent).toBe('Could not save your vote. Try again.');
  });

  it('APPS-POLL-008: a vote out on one poll leaves the other poll open to a vote', async () => {
    let finish: (answer: Poll | null) => void = () => undefined;
    const onVote = vi.fn(() => new Promise<Poll | null>((resolve) => (finish = resolve)));
    render(<Polls data={{ polls: [poll(2), poll(3, { question: 'Second?' })] }} locale="en" t={t} onVote={onVote} />);
    const [first, second] = screen.getAllByRole('button', { name: /Porto/ });
    fireEvent.click(first);
    expect(first.hasAttribute('disabled')).toBe(true);
    expect(second.hasAttribute('disabled')).toBe(false);
    await act(async () => finish(null));
    expect(first.hasAttribute('disabled')).toBe(false);
  });

  it('APPS-POLL-005: says so when there are no polls, and when the result is not one', () => {
    const { unmount } = render(<Polls data={{ polls: [] }} locale="en" t={t} onVote={vi.fn()} />);
    expect(screen.getByText('No polls yet')).toBeTruthy();
    unmount();
    render(<Polls data={{ polls: 'no' }} locale="en" t={t} onVote={vi.fn()} />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('poll App', () => {
  const withResult = (callServerTool: ReturnType<typeof vi.fn>) => {
    state = {
      app: { callServerTool } as unknown as TrekAppState['app'],
      result: { structuredContent: { polls: [poll(2)] }, appUrl: null },
      input: null,
      error: null,
      locale: 'en',
      t,
    };
  };

  it('APPS-POLL-006: votes through vote_collab_poll on the host’s session', async () => {
    const answered = poll(2, { options: [{ text: 'Lisbon', label: null, voters: [] }] });
    const callServerTool = vi.fn(async () => ({
      content: [{ type: 'text', text: JSON.stringify({ poll: answered }) }],
    }));
    withResult(callServerTool);
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Lisbon/ })));
    expect(callServerTool).toHaveBeenCalledWith({
      name: 'vote_collab_poll',
      arguments: { tripId: 4, pollId: 2, optionIndex: 0 },
    });
    expect(screen.getByText('0% · 0')).toBeTruthy();
  });

  it('APPS-POLL-007: counts an error answer, a failed call or an answer without the poll as refused', async () => {
    const callServerTool = vi
      .fn()
      .mockResolvedValueOnce({ content: [], isError: true })
      .mockRejectedValueOnce(new Error('gone'))
      .mockResolvedValueOnce({ content: [{ type: 'image', data: '', mimeType: 'image/png' }] });
    withResult(callServerTool);
    render(<App />);
    for (let i = 0; i < 3; i += 1) {
      await act(async () => fireEvent.click(screen.getByRole('button', { name: /Lisbon/ })));
      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    }
    expect(callServerTool).toHaveBeenCalledTimes(3);
  });
});
