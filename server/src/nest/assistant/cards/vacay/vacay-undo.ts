import type { ToolArgs, ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { readKey, recordOf } from '../card-values';
import { dateArg } from './vacay-load';
import { entriesOf, type Fraction } from './vacay-reads';
import type { AssistantChangePreview, VacayCardProposal } from '@trek/shared';

/**
 * The way back from a day off the assistant toggled: the same toggle once
 * more, for the same person, with what puts the day back exactly as it was.
 * A day the change added is cleared with the size and kind it was added
 * with; a day it converted goes back to the size and kind its card showed
 * before. The person comes from the held card, since a toggle for the caller
 * names nobody and its answer names no day.
 *
 * Only while the person's day is still as the change left it, read with
 * `get_vacay_entries` for the day's year and the year before (the signed-in
 * user's calendar grid can show the day in either), and only where the
 * planner's toggle does exactly that: half a company holiday on the day makes
 * every toggle half a day, so a whole day cannot come back then and the undo
 * answers "changed since"; a whole one set since took the day off already.
 *
 * Not taken back at all: a day the change cleared, since the planner's toggle
 * adds a day without the note the cleared one may have carried and nothing
 * the chat holds says whether it carried one; and a toggle that did not do
 * what its card foresaw (the day changed between the hold and the decision),
 * since what it found then is not known.
 */

type VacayUndo = NonNullable<ToolCards['undo']>;
type DayKind = VacayCardProposal['kind'];

/** One size and kind of a day off. */
interface DayOff {
  fraction: Fraction;
  kind: DayKind;
}

/** What one toggle did: whose day, which date, how it left the day, and the toggle that puts it back. */
interface Toggled {
  date: string;
  personId: number;
  left: DayOff;
  back: DayOff;
}

const ENTRIES_READ = 'get_vacay_entries';

function dayOff(fraction: unknown, kind: unknown): DayOff | null {
  if ((fraction === 0.5 || fraction === 1) && (kind === 'vacation' || kind === 'comp')) return { fraction, kind };
  return null;
}

/**
 * Whether a toggle held with this proposal can be taken back once it ran as
 * foreseen: a day it adds, or one it converts from a size and kind the card
 * saw. A day it clears, or one it is refused, has no way back.
 */
export function takesBack(proposal: VacayCardProposal): boolean {
  return proposal.outcome === 'add' || (proposal.outcome === 'convert' && proposal.before !== null);
}

/** The held card's day, when the card is the planner's and names whose day it is. */
function heldDay(preview: AssistantChangePreview | null): (VacayCardProposal & { personId: number }) | null {
  const card = preview?.card;
  const proposal = card?.kind === 'vacay' ? card.proposal : null;
  const personId = proposal?.personId ?? null;
  return proposal && personId !== null ? { ...proposal, personId } : null;
}

/**
 * The size and kind the toggle back sets, when that puts the day back
 * exactly: what an added day was added with, or what the card saw before a
 * conversion that did just what the card foresaw.
 */
function backOf(action: unknown, proposal: VacayCardProposal, left: DayOff): DayOff | null {
  if (action === 'added') return proposal.outcome === 'add' ? left : null;
  if (action !== 'updated' || proposal.outcome !== 'convert' || proposal.before === null) return null;
  const foreseen = left.fraction === proposal.fraction && left.kind === proposal.kind;
  return foreseen ? dayOff(proposal.before.fraction, proposal.before.kind) : null;
}

/**
 * What the toggle did, from its arguments, its answer and the card it was
 * held with; null for a toggle that cannot be taken back exactly.
 */
function toggledOf(args: ToolArgs, result: unknown, preview: AssistantChangePreview | null): Toggled | null {
  const proposal = heldDay(preview);
  const date = dateArg(args);
  if (!proposal || date === null || proposal.date !== date) return null;
  const answer = recordOf(result);
  const left = dayOff(answer.fraction, answer.kind);
  const back = left ? backOf(answer.action, proposal, left) : null;
  return left && back ? { date, personId: proposal.personId, left, back } : null;
}

/** The logged days and company holidays the undo read, of both years; null when either read failed. */
function readDays(snapshot: UndoSnapshot, date: string) {
  const year = Number(date.slice(0, 4));
  const read = (of: number) => entriesOf(snapshot.reads.get(readKey(ENTRIES_READ, { year: of })));
  const now = read(year);
  const earlier = read(year - 1);
  if (!now || !earlier) return null;
  return { entries: [...now.entries, ...earlier.entries], company: [...now.company, ...earlier.company] };
}

/**
 * The person's day is as the change left it, and the toggle back would do
 * exactly what it says: no half company holiday on the day unless half a day
 * is what goes back.
 */
function unchangedToggle(result: unknown, snapshot: UndoSnapshot, call?: UndoCall): boolean {
  const toggled = call ? toggledOf(call.args, result, call.preview) : null;
  if (!toggled) return false;
  const days = readDays(snapshot, toggled.date);
  if (!days) return false;
  const { date, personId, left, back } = toggled;
  const own = days.entries.filter((entry) => entry.date === date && entry.personId === personId);
  const halfCompany = days.company.some((row) => row.date === date && row.fraction < 1);
  return (
    own.length > 0 &&
    own.every((entry) => entry.fraction === left.fraction && entry.kind === left.kind) &&
    (back.fraction === 0.5 || !halfCompany)
  );
}

/** The undo of `toggle_vacay_entry`. */
export const TOGGLE_BACK: VacayUndo = {
  tool: 'toggle_vacay_entry',
  args: (args, result, preview) => {
    const toggled = toggledOf(args, result, preview);
    if (!toggled) return null;
    const { date, personId, back } = toggled;
    return { date, fraction: back.fraction, kind: back.kind, targetUserId: personId };
  },
  reads: (args) => {
    const year = Number(dateArg(args)?.slice(0, 4) ?? 0);
    return [
      { tool: ENTRIES_READ, args: { year } },
      { tool: ENTRIES_READ, args: { year: year - 1 } },
    ];
  },
  unchanged: unchangedToggle,
};
