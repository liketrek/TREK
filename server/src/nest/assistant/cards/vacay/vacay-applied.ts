import type { ToolArgs } from '../card-types';
import { recordOf } from '../card-values';
import { counted } from './vacay-change';
import type { Fraction } from './vacay-reads';
import type { AssistantChangePreview, VacayCard, VacayCardProposal } from '@trek/shared';

/**
 * The card of an applied vacation change. The change card was drawn when the
 * call was held, which can be hours before the user decided, and the day may
 * have changed since; the tool's answer says what was really done (`added`,
 * `removed`, `updated`). Where that is what the card foresaw, the card stands.
 * Where it is not, the day shows what was done, and the days left follow the
 * answer where it tells enough to count them and change nothing where it does
 * not, rather than show a count the day never got.
 */

type Outcome = VacayCardProposal['outcome'];
type DayKind = VacayCardProposal['kind'];

interface AppliedInput {
  args: ToolArgs;
  result: unknown;
  preview: AssistantChangePreview | null;
}

const DONE = new Map<string, Outcome>([
  ['added', 'add'],
  ['removed', 'remove'],
  ['updated', 'convert'],
]);

/** The held card with its day, when the stored preview has one. */
function heldOf(preview: AssistantChangePreview | null): { card: VacayCard; proposal: VacayCardProposal } | null {
  const card = preview?.card;
  if (card?.kind !== 'vacay' || !card.proposal) return null;
  return { card, proposal: card.proposal };
}

/** What the tool says it did; null for an answer that names nothing (a refusal). */
function doneOf(result: unknown): Outcome | null {
  const action = recordOf(result).action;
  return typeof action === 'string' ? (DONE.get(action) ?? null) : null;
}

function fractionOf(value: unknown, fallback: Fraction): Fraction {
  if (value === 0.5 || value === 1) return value;
  return fallback;
}

function kindOf(value: unknown, fallback: DayKind): DayKind {
  if (value === 'vacation' || value === 'comp') return value;
  return fallback;
}

/**
 * What a toggle that did `outcome` adds to the used days: an added day by its
 * own size, a cleared one by the size it was asked with (the planner clears
 * only that), a converted one only when the card knew the day before.
 */
function toggleDays(
  outcome: Outcome,
  proposal: VacayCardProposal,
  done: { fraction: Fraction; kind: DayKind },
): number | null {
  if (outcome === 'add') return counted(done.kind, done.fraction);
  if (outcome === 'remove') return -counted(proposal.kind, proposal.fraction);
  if (outcome === 'convert' && proposal.before) {
    return counted(done.kind, done.fraction) - counted(proposal.before.kind, proposal.before.fraction);
  }
  return null;
}

/** A day off as it was applied. */
export function appliedToggle({ result, preview }: AppliedInput): VacayCard | null {
  const held = heldOf(preview);
  const outcome = doneOf(result);
  if (!held || !outcome) return null;
  const { card, proposal } = held;
  const answer = recordOf(result);
  const fraction = fractionOf(answer.fraction, proposal.fraction);
  const kind = kindOf(answer.kind, proposal.kind);
  if (outcome === proposal.outcome && fraction === proposal.fraction && kind === proposal.kind) return card;
  const days = toggleDays(outcome, proposal, { fraction, kind });
  const { personId, periodYear } = proposal;
  const deltas =
    days === null || personId === null || periodYear === null ? [] : [{ personId, year: periodYear, days }];
  return { ...card, proposal: { ...proposal, outcome, fraction, kind, deltas } };
}

/**
 * A company holiday as it was applied. What it gave back depends on the days
 * logged when it was applied, which the answer does not name, so a holiday
 * that did something else than foreseen changes nobody's days left.
 */
export function appliedCompany({ result, preview }: AppliedInput): VacayCard | null {
  const held = heldOf(preview);
  const outcome = doneOf(result);
  if (!held || !outcome) return null;
  const { card, proposal } = held;
  const fraction = fractionOf(recordOf(result).fraction, proposal.fraction);
  if (outcome === proposal.outcome && fraction === proposal.fraction) return card;
  return { ...card, proposal: { ...proposal, outcome, fraction, deltas: [] } };
}
