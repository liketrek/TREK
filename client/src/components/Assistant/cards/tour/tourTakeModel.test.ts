/**
 * FE-AI-TOUR-047, FE-AI-TOUR-048
 *
 * Whether a proposal was already taken, read from the thread: a later answer
 * holding "Plan this" for it, waiting or applied, takes it; one discarded,
 * cancelled or expired, another way, or a thread that no longer holds the
 * proposal does not. A take names the proposal it came from, which decides
 * before the way; one held before it named any is matched by its way.
 */
import type { AssistantMessage, AssistantMessagePart, AssistantToolApproval, TourRouteCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { GENTLE, HIKE } from '../../../../../tests/helpers/assistantTour';
import { takeInThread } from './tourTakeModel';

const message = (id: string, parts: AssistantMessagePart[]): AssistantMessage => ({
  id,
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-22T08:00:00.000Z',
  parts,
});

const proposal = message('m1', [{ type: 'data-trek-card', data: { toolCallId: 'call_1', card: HIKE } }]);

/** The answer holding "Plan this" for `card`, decided as `approval` says, naming `takenFrom` when given. */
function take(
  card: TourRouteCard,
  approval: Omit<AssistantToolApproval, 'id'> = {},
  toolName = 'take_proposal',
  takenFrom?: string
) {
  return message('m2', [
    { type: 'tool-call', toolCallId: 't1', toolName, args: {}, approval: { id: 't1', ...approval } },
    {
      type: 'data-trek-change',
      data: {
        toolCallId: 't1',
        verbKey: 'addTour',
        subject: card.name ?? '',
        rows: [],
        dayId: null,
        placeIds: [],
        undoable: true,
        card: { ...card, source: 'pending' },
        ...(takenFrom ? { takenFrom } : {}),
      },
    },
  ]);
}

describe('takeInThread', () => {
  it('FE-AI-TOUR-047: a later take of the same way, waiting or applied, takes the proposal; nothing else does', () => {
    expect(takeInThread([proposal], 'call_1', HIKE)).toBeNull();
    expect(takeInThread([proposal, take(HIKE)], 'call_1', HIKE)).toBe('waiting');
    expect(takeInThread([proposal, take(HIKE, { approved: true })], 'call_1', HIKE)).toBe('applied');
    expect(takeInThread([proposal, take(HIKE, { approved: false })], 'call_1', HIKE)).toBeNull();
    expect(takeInThread([proposal, take(HIKE, { resolution: 'expired' })], 'call_1', HIKE)).toBeNull();
    expect(takeInThread([proposal, take(HIKE, {}, 'create_hike')], 'call_1', HIKE)).toBeNull();

    const other = { ...GENTLE, line: [[47.9, 12.8, 600], ...GENTLE.line.slice(1)] } satisfies TourRouteCard;
    expect(takeInThread([proposal, take(other)], 'call_1', HIKE)).toBeNull();
    expect(takeInThread([take(HIKE), proposal], 'call_1', HIKE)).toBeNull();
    expect(takeInThread([take(HIKE)], 'call_1', HIKE)).toBeNull();
  });

  it('FE-AI-TOUR-048: a take that names its proposal is matched by it, not by its way', () => {
    const other = { ...GENTLE, line: [[47.9, 12.8, 600], ...GENTLE.line.slice(1)] } satisfies TourRouteCard;
    expect(takeInThread([proposal, take(other, {}, 'take_proposal', 'call_1')], 'call_1', HIKE)).toBe('waiting');
    // The server joins a take to the answer that drew the proposal: found there too.
    const joined = { ...proposal, parts: [...proposal.parts, ...take(other, {}, 'take_proposal', 'call_1').parts] };
    expect(takeInThread([joined], 'call_1', HIKE)).toBe('waiting');
    // The same way taken from another proposal leaves this one free.
    expect(
      takeInThread([proposal, take(HIKE, { approved: true }, 'take_proposal', 'call_2')], 'call_1', HIKE)
    ).toBeNull();
  });
});
