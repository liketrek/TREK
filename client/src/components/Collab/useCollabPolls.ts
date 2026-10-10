import type { CollabPollCreateRequest } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { useTranslation } from '../../i18n';
import type { useToast } from '../shared/Toast';
import { isPollActive, type CollabPollData } from './collabModel';

type PollResponse = { poll?: CollabPollData } | CollabPollData;

function readPoll(result: PollResponse): CollabPollData {
  return ('poll' in result && result.poll) || (result as CollabPollData);
}

export interface CollabPollsOptions {
  tripId: number | string;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  /** The desktop panel outlives a trip change, so a failed load there empties the list. */
  resetOnLoadError?: boolean;
  /**
   * The phone shows the closed poll the server sends, both as the close answer and as the
   * live event; the desktop panel flips its flag and merges the live event into the poll.
   */
  replaceClosedPoll?: boolean;
  /** The phone puts a vote answer on the poll it voted on; the desktop panel on the id in the answer. */
  matchVoteByPollId?: boolean;
  /** The phone stops the countdown tick once a deadline passes; the desktop panel ticks until the poll is closed. */
  tickOnlyWhileActive?: boolean;
}

/**
 * The trip polls behind the desktop Collab panel and the phone's polls tab, which draw
 * their own cards and create form over it: the list with its live WebSocket updates, a
 * 30 second tick while a deadline is still counting down, and creating, voting, closing
 * and deleting. Collab has no store slice, so the polls live here.
 */
export function useCollabPolls({
  tripId,
  t,
  toast,
  resetOnLoadError = false,
  replaceClosedPoll = false,
  matchVoteByPollId = false,
  tickOnlyWhileActive = false,
}: CollabPollsOptions) {
  const [polls, setPolls] = useState<CollabPollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    collabApi
      .getPolls(tripId)
      .then((data: CollabPollData[] | { polls?: CollabPollData[] }) => {
        if (!cancelled) setPolls(Array.isArray(data) ? data : data.polls || []);
      })
      .catch(() => {
        if (!cancelled && resetOnLoadError) setPolls([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, resetOnLoadError]);

  useEffect(() => {
    const handler = (msg: Record<string, unknown>) => {
      if (!msg?.type) return;
      // An event still in flight from a trip just left must not land in this list.
      if (String(msg.tripId) !== String(tripId)) return;
      const poll = msg.poll as CollabPollData | undefined;
      if (msg.type === 'collab:poll:created' && poll) {
        setPolls((prev) => (prev.some((p) => p.id === poll.id) ? prev : [poll, ...prev]));
      }
      if (msg.type === 'collab:poll:voted' && poll) {
        setPolls((prev) => prev.map((p) => (p.id === poll.id ? poll : p)));
      }
      if (msg.type === 'collab:poll:closed' && poll) {
        setPolls((prev) =>
          prev.map((p) => {
            if (p.id !== poll.id) return p;
            return replaceClosedPoll ? poll : { ...p, ...poll, is_closed: true };
          })
        );
      }
      if (msg.type === 'collab:poll:deleted') {
        const id = (msg.pollId as number | undefined) || poll?.id;
        if (id) setPolls((prev) => prev.filter((p) => p.id !== id));
      }
    };
    addListener(handler);
    return () => removeListener(handler);
  }, [tripId, replaceClosedPoll]);

  // Re-render every 30s while a deadline is still counting down.
  useEffect(() => {
    if (!polls.some((p) => p.deadline && (tickOnlyWhileActive ? isPollActive(p) : !p.is_closed))) return;
    const iv = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(iv);
  }, [polls, tickOnlyWhileActive]);

  /** Rethrows after the toast, so the form that called it stays open. */
  const createPoll = useCallback(
    async (data: CollabPollCreateRequest) => {
      try {
        const created = readPoll(await collabApi.createPoll(tripId, data));
        setPolls((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
      } catch (err) {
        toast.error(t('common.error'));
        throw err;
      }
    },
    [tripId, toast, t]
  );

  const votePoll = useCallback(
    async (pollId: number, optionIndex: number) => {
      try {
        const updated = readPoll(await collabApi.votePoll(tripId, pollId, optionIndex));
        const target = matchVoteByPollId ? pollId : updated.id;
        setPolls((prev) => prev.map((p) => (p.id === target ? updated : p)));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [tripId, matchVoteByPollId, toast, t]
  );

  const closePoll = useCallback(
    async (pollId: number) => {
      try {
        const result = await collabApi.closePoll(tripId, pollId);
        setPolls((prev) =>
          prev.map((p) => {
            if (p.id !== pollId) return p;
            return replaceClosedPoll ? readPoll(result) : { ...p, is_closed: true };
          })
        );
      } catch {
        toast.error(t('common.error'));
      }
    },
    [tripId, replaceClosedPoll, toast, t]
  );

  const deletePoll = useCallback(
    async (pollId: number) => {
      try {
        await collabApi.deletePoll(tripId, pollId);
        setPolls((prev) => prev.filter((p) => p.id !== pollId));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [tripId, toast, t]
  );

  return { polls, loading, createPoll, votePoll, closePoll, deletePoll };
}
