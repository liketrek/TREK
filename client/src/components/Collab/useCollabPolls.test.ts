// FE-COLLAB-POLLS-001 to FE-COLLAB-POLLS-015: the poll logic behind the desktop Collab
// panel (empties on a failed load, flips the closed flag itself, ticks until a poll is
// closed) and the phone's polls tab (keeps the list, shows the closed poll the server
// sends, puts a vote answer on the poll it voted on, stops ticking once a deadline passed).
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { CollabPollData } from './collabModel';
import { useCollabPolls, type CollabPollsOptions } from './useCollabPolls';

const t = (key: string) => key;

function poll(id: number, over: Partial<CollabPollData> = {}): CollabPollData {
  return {
    id,
    trip_id: 1,
    user_id: 2,
    question: `Poll ${id}`,
    options: [
      { text: 'A', label: 'A', voters: [] },
      { text: 'B', label: 'B', voters: [] },
    ],
    multiple_choice: false,
    is_closed: false,
    deadline: null,
    username: 'alice',
    avatar: null,
    avatar_url: null,
    created_at: '2026-05-01T10:00:00Z',
    ...over,
  };
}

function setup(over: Partial<CollabPollsOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const hook = renderHook(
    (props: Partial<CollabPollsOptions>) => useCollabPolls({ tripId: 1, t, toast, ...over, ...props }),
    { initialProps: {} }
  );
  return { ...hook, toast };
}

async function loaded(over: Partial<CollabPollsOptions> = {}) {
  const view = setup(over);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

function wsHandler(): (event: Record<string, unknown>) => void {
  const calls = vi.mocked(addListener).mock.calls;
  return calls[calls.length - 1][0] as (event: Record<string, unknown>) => void;
}

beforeEach(() => {
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
  vi.spyOn(collabApi, 'getPolls').mockResolvedValue({ polls: [poll(1), poll(2)] });
  vi.spyOn(collabApi, 'createPoll').mockResolvedValue({ poll: poll(9) });
  vi.spyOn(collabApi, 'votePoll').mockResolvedValue({ poll: poll(1, { question: 'voted' }) });
  vi.spyOn(collabApi, 'closePoll').mockResolvedValue({ poll: poll(1, { is_closed: true, question: 'server' }) });
  vi.spyOn(collabApi, 'deletePoll').mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useCollabPolls', () => {
  it('FE-COLLAB-POLLS-001: loads the polls, from an object or a bare array', async () => {
    const { result } = setup();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(collabApi.getPolls).toHaveBeenCalledWith(1);
    expect(result.current.polls.map((p) => p.id)).toEqual([1, 2]);

    vi.mocked(collabApi.getPolls).mockResolvedValue([poll(3)]);
    const bare = await loaded();
    expect(bare.result.current.polls.map((p) => p.id)).toEqual([3]);

    vi.mocked(collabApi.getPolls).mockResolvedValue({});
    const empty = await loaded();
    expect(empty.result.current.polls).toEqual([]);
  });

  it('FE-COLLAB-POLLS-002: a failed reload empties the desktop list and keeps the phone list', async () => {
    const desktop = await loaded({ resetOnLoadError: true });
    const phone = await loaded();
    vi.mocked(collabApi.getPolls).mockRejectedValue(new Error('boom'));

    desktop.rerender({ tripId: 2 });
    phone.rerender({ tripId: 2 });
    await waitFor(() => expect(desktop.result.current.loading).toBe(false));
    await waitFor(() => expect(phone.result.current.loading).toBe(false));
    expect(desktop.result.current.polls).toEqual([]);
    expect(phone.result.current.polls.map((p) => p.id)).toEqual([1, 2]);
  });

  it('FE-COLLAB-POLLS-003: live events create, vote, close and delete, only for this trip', async () => {
    const { result } = await loaded();
    const handler = wsHandler();
    act(() => {
      handler({ type: 'collab:poll:created', tripId: 2, poll: poll(7) });
      handler({ type: 'collab:poll:created', tripId: '1', poll: poll(7) });
      handler({ type: 'collab:poll:created', tripId: 1, poll: poll(7) });
      handler({ type: 'collab:poll:voted', tripId: 1, poll: poll(1, { question: 'live vote' }) });
      handler({ type: 'collab:poll:closed', tripId: 1, poll: { id: 2 } });
    });
    expect(result.current.polls.map((p) => p.id)).toEqual([7, 1, 2]);
    expect(result.current.polls[1].question).toBe('live vote');
    // A closed event folds into the poll it names and always closes it.
    expect(result.current.polls[2]).toMatchObject({ question: 'Poll 2', is_closed: true });

    act(() => {
      handler({ type: 'collab:poll:deleted', tripId: 1, pollId: 7 });
      handler({ type: 'collab:poll:deleted', tripId: 1, poll: { id: 1 } });
      handler({ type: 'collab:poll:voted', tripId: 1 });
      handler({});
    });
    expect(result.current.polls.map((p) => p.id)).toEqual([2]);
  });

  it('FE-COLLAB-POLLS-004: unmounting removes the live listener', async () => {
    const { unmount } = await loaded();
    const handler = wsHandler();
    unmount();
    expect(removeListener).toHaveBeenCalledWith(handler);
  });

  it('FE-COLLAB-POLLS-005: creating puts the new poll on top once', async () => {
    const { result } = await loaded();
    const data = { question: 'Q', options: ['A', 'B'], multiple_choice: true };
    await act(async () => {
      await result.current.createPoll(data);
    });
    expect(collabApi.createPoll).toHaveBeenCalledWith(1, data);
    act(() => wsHandler()({ type: 'collab:poll:created', tripId: 1, poll: poll(9) }));
    expect(result.current.polls.map((p) => p.id)).toEqual([9, 1, 2]);
  });

  it('FE-COLLAB-POLLS-006: a failed create toasts and rethrows', async () => {
    const err = new Error('boom');
    vi.mocked(collabApi.createPoll).mockRejectedValue(err);
    const { result, toast } = await loaded();
    await act(async () => {
      await expect(result.current.createPoll({ question: 'Q', options: ['A', 'B'] })).rejects.toBe(err);
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.polls).toHaveLength(2);
  });

  it('FE-COLLAB-POLLS-007: voting swaps in the server poll, a failure toasts', async () => {
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.votePoll(1, 0);
    });
    expect(collabApi.votePoll).toHaveBeenCalledWith(1, 1, 0);
    expect(result.current.polls[0].question).toBe('voted');

    vi.mocked(collabApi.votePoll).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await result.current.votePoll(1, 1);
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COLLAB-POLLS-008: closing flips the flag on desktop and swaps in the server poll on the phone', async () => {
    vi.mocked(collabApi.closePoll).mockResolvedValue({ success: true });
    const desktop = await loaded();
    await act(async () => {
      await desktop.result.current.closePoll(1);
    });
    expect(collabApi.closePoll).toHaveBeenCalledWith(1, 1);
    expect(desktop.result.current.polls[0]).toMatchObject({ question: 'Poll 1', is_closed: true });
    expect(desktop.result.current.polls[1].is_closed).toBe(false);

    vi.mocked(collabApi.closePoll).mockResolvedValue({ poll: poll(1, { is_closed: true, question: 'server' }) });
    const phone = await loaded({ replaceClosedPoll: true });
    await act(async () => {
      await phone.result.current.closePoll(1);
    });
    expect(phone.result.current.polls[0]).toMatchObject({ question: 'server', is_closed: true });
  });

  it('FE-COLLAB-POLLS-009: a failed close toasts and leaves the poll open', async () => {
    vi.mocked(collabApi.closePoll).mockRejectedValue(new Error('boom'));
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.closePoll(1);
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.polls[0].is_closed).toBe(false);
  });

  it('FE-COLLAB-POLLS-010: deleting drops the poll, a failure toasts and keeps it', async () => {
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.deletePoll(1);
    });
    expect(collabApi.deletePoll).toHaveBeenCalledWith(1, 1);
    expect(result.current.polls.map((p) => p.id)).toEqual([2]);

    vi.mocked(collabApi.deletePoll).mockRejectedValue(new Error('boom'));
    await act(async () => {
      await result.current.deletePoll(2);
    });
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.polls.map((p) => p.id)).toEqual([2]);
  });

  it('FE-COLLAB-POLLS-011: the clock ticks while an open poll still has a deadline ahead', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const ahead = new Date(Date.now() + 3_600_000).toISOString();
    vi.mocked(collabApi.getPolls).mockResolvedValue({ polls: [poll(1, { deadline: ahead })] });
    let renders = 0;
    const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const { result } = renderHook(() => {
      renders += 1;
      return useCollabPolls({ tripId: 1, t, toast });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = renders;
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(renders).toBeGreaterThan(before);
  });

  it('FE-COLLAB-POLLS-012: no tick for closed or deadline free polls, an expired one ticks only on desktop', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const past = new Date(Date.now() - 1000).toISOString();
    const ahead = new Date(Date.now() + 3_600_000).toISOString();
    const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
    const renderCounted = (polls: CollabPollData[], over: Partial<CollabPollsOptions>) => {
      vi.mocked(collabApi.getPolls).mockResolvedValue({ polls });
      const counter = { renders: 0 };
      const view = renderHook(() => {
        counter.renders += 1;
        return useCollabPolls({ tripId: 1, t, toast, ...over });
      });
      return { ...view, counter };
    };

    const quiet = renderCounted([poll(1), poll(3, { deadline: ahead, is_closed: true })], {});
    await waitFor(() => expect(quiet.result.current.loading).toBe(false));
    const quietBefore = quiet.counter.renders;
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    expect(quiet.counter.renders).toBe(quietBefore);
    quiet.unmount();

    const phone = renderCounted([poll(2, { deadline: past })], { tickOnlyWhileActive: true });
    await waitFor(() => expect(phone.result.current.loading).toBe(false));
    const phoneBefore = phone.counter.renders;
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    expect(phone.counter.renders).toBe(phoneBefore);
    phone.unmount();

    const desktop = renderCounted([poll(2, { deadline: past })], {});
    await waitFor(() => expect(desktop.result.current.loading).toBe(false));
    const desktopBefore = desktop.counter.renders;
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(desktop.counter.renders).toBeGreaterThan(desktopBefore);
  });

  it('FE-COLLAB-POLLS-013: a poll create answered with the bare poll is read too', async () => {
    vi.mocked(collabApi.createPoll).mockResolvedValue(poll(11));
    const { result } = await loaded();
    await act(async () => {
      await result.current.createPoll({ question: 'Q', options: ['A', 'B'] });
    });
    expect(result.current.polls.map((p) => p.id)).toEqual([11, 1, 2]);
  });

  it('FE-COLLAB-POLLS-014: on the phone a live closed event replaces the poll with the one it carries', async () => {
    const { result } = await loaded({ replaceClosedPoll: true });
    act(() => {
      wsHandler()({ type: 'collab:poll:closed', tripId: 1, poll: { id: 2, question: 'closed live' } });
    });
    expect(result.current.polls[1]).toEqual({ id: 2, question: 'closed live' });
  });

  it('FE-COLLAB-POLLS-015: a vote answer lands on the answered id on desktop and on the voted poll on the phone', async () => {
    vi.mocked(collabApi.votePoll).mockResolvedValue({ poll: poll(2, { question: 'answer' }) });
    const desktop = await loaded();
    await act(async () => {
      await desktop.result.current.votePoll(1, 0);
    });
    expect(desktop.result.current.polls.map((p) => p.question)).toEqual(['Poll 1', 'answer']);

    const phone = await loaded({ matchVoteByPollId: true });
    await act(async () => {
      await phone.result.current.votePoll(1, 0);
    });
    expect(phone.result.current.polls.map((p) => p.question)).toEqual(['answer', 'Poll 2']);
  });
});
