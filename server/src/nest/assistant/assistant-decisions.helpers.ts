import type { AssistantMessagePart } from '@trek/shared';

/** What the model is told about a change the user discarded. */
export const DISCARDED = { applied: false, reason: 'The user discarded this change.' };
/** ... one the user left undecided by asking something else. */
const CANCELLED = { applied: false, reason: 'The user moved on without deciding.' };
/** ... one that was approved but never ran. */
export const NOT_RUN = { applied: false, reason: 'The change could not be run.' };

/** What became of one decided change, as its message records it. */
export interface Outcome {
  approved: boolean;
  result: unknown;
  isError: boolean;
}

/** The parts of a message with the named held changes marked as left undecided. */
export function withCancelled(
  parts: readonly AssistantMessagePart[],
  cancelled: ReadonlySet<string>,
): AssistantMessagePart[] {
  return parts.map((part) =>
    part.type === 'tool-call' && cancelled.has(part.toolCallId)
      ? { ...part, result: CANCELLED, approval: { id: part.toolCallId, resolution: 'cancelled' as const } }
      : part,
  );
}

/** The parts of a message with each decided change carrying its outcome. */
export function withOutcomes(
  parts: readonly AssistantMessagePart[],
  outcomes: ReadonlyMap<string, Outcome>,
): AssistantMessagePart[] {
  return parts.map((part) => {
    const outcome = part.type === 'tool-call' ? outcomes.get(part.toolCallId) : undefined;
    if (part.type !== 'tool-call' || !outcome) return part;
    return {
      ...part,
      result: outcome.result,
      ...(outcome.isError ? { isError: true } : {}),
      approval: { id: part.toolCallId, approved: outcome.approved },
    };
  });
}
