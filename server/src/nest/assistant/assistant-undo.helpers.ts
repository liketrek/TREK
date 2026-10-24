import type { AssistantToolSession } from './assistant-tools.service';
import type { ToolArgs, UndoCall, UndoSnapshot } from './cards/card-types';
import { readKey, recordOf, type Row } from './cards/card-values';
import { TOOL_CARDS, undoReadsOf } from './cards/registry';
import {
  byId,
  placeUnchanged,
  rowsOf,
  same,
  snapshotAssignments,
  snapshotDays,
  STABLE_FIELDS,
} from './cards/undo-snapshot';

/**
 * Whether an applied change may still be taken back: what it created must be
 * as it was then. An undo removes the created row with everything that hangs
 * off it, so a place someone planned on another day since, or booked, or
 * linked an expense to, is not removed by an undo the user meant for the bare
 * place. The trip is read as the tools answer it (`get_trip_summary` raw, and
 * `list_places` for places), plus the reads a package's undo asks for.
 */

/** The trip as an undo reads it; the package reads are left out where none were made. */
export type TripSnapshot = Omit<UndoSnapshot, 'reads'> & { reads?: UndoSnapshot['reads'] };

/** The trip reads every undo makes before it checks. */
const TRIP_READS = ['get_trip_summary', 'list_places'] as const;

const CORE_CHECKS: Readonly<Record<string, (result: Row, snapshot: UndoSnapshot) => boolean>> = {
  create_place: placeUnchanged,
  create_and_assign_place: placeUnchanged,
  assign_place_to_day: (result, snapshot) => {
    const created = recordOf(result.assignment);
    return same(created, byId(snapshotAssignments(snapshot), created.id), STABLE_FIELDS.assignment);
  },
  create_day_note: (result, snapshot) => {
    const created = recordOf(result.note);
    const notes = snapshotDays(snapshot).flatMap((day) => rowsOf(day.notes));
    return same(created, byId(notes, created.id), STABLE_FIELDS.note);
  },
  create_packing_item: (result, snapshot) => {
    const created = recordOf(result.item);
    const items = rowsOf(recordOf(recordOf(snapshot.summary).packing).items);
    return same(created, byId(items, created.id), STABLE_FIELDS.packing);
  },
  create_todo: (result, snapshot) => {
    const created = recordOf(result.item);
    return same(created, byId(rowsOf(recordOf(snapshot.summary).todos), created.id), STABLE_FIELDS.todo);
  },
  create_budget_item: (result, snapshot) => {
    const created = recordOf(result.item);
    const items = rowsOf(recordOf(recordOf(snapshot.summary).budget).items);
    return same(created, byId(items, created.id), STABLE_FIELDS.budget);
  },
};

/** One check: the change's answer, the snapshot, and the call it answered (its arguments, its stored preview). */
type Check = (result: Row, snapshot: UndoSnapshot, call: UndoCall) => boolean;

/**
 * The core checks and each package's `undo.unchanged`, which the registry
 * guards (one that throws reads as changed) and keeps off the core's tools.
 */
const CHECKS: Readonly<Partial<Record<string, Check>>> = {
  ...CORE_CHECKS,
  ...Object.fromEntries(
    Object.entries(TOOL_CARDS).flatMap(([tool, cards]): Array<[string, Check]> => {
      const undo = cards.undo;
      return undo ? [[tool, (result, snapshot, call) => undo.unchanged(result, snapshot, call)]] : [];
    }),
  ),
};

/** The call a check reads when its caller has none: no arguments, no held card. */
const NO_CALL: UndoCall = { args: {}, preview: null };

/**
 * True when the change `toolName` made (its stored `result`) is still as it
 * left it. `call` is what the answer may not name (the day a vacation toggle
 * was for, the person); a check that needs none ignores it.
 */
export function unchangedSinceApplied(
  toolName: string,
  result: unknown,
  snapshot: TripSnapshot,
  call: UndoCall = NO_CALL,
): boolean {
  const check = CHECKS[toolName];
  return !!check && check(recordOf(result), { ...snapshot, reads: snapshot.reads ?? new Map() }, call);
}

/**
 * The tools an undo's session holds: the removing tool, the trip reads (on a
 * trip, `tripReads`) and what the change's package reads.
 */
export function undoTargetsOf(
  undoTool: string,
  toolName: string,
  args: ToolArgs,
  result: unknown,
  tripReads = true,
): Set<string> {
  const trip = tripReads ? TRIP_READS : [];
  return new Set([undoTool, ...trip, ...undoReadsOf(toolName, args, result).map((read) => read.tool)]);
}

/** What an undo's snapshot reads: a package's reads, and whether the trip is read too. */
interface SnapshotReads {
  reads?: ReturnType<typeof undoReadsOf>;
  /** False in a Studio conversation: it is about a journey, there is no trip to read and the summary stays null. */
  tripReads?: boolean;
}

/** The trip as the undo checks it, read through the undo's session; null when a trip read failed. */
export async function undoSnapshotOf(
  session: Pick<AssistantToolSession, 'read'>,
  toolName: string,
  args: ToolArgs,
  result: unknown,
  { reads = undoReadsOf(toolName, args, result), tripReads = true }: SnapshotReads = {},
): Promise<UndoSnapshot | null> {
  const trip = tripReads ? await readTrip(session) : { summary: null, places: null };
  if (!trip) return null;
  const extra = await Promise.all(
    reads.map(async (read): Promise<[string, unknown]> => {
      const run = await session.read(read.tool, read.args);
      return [readKey(read.tool, read.args), run.ok ? run.value : null];
    }),
  );
  return { ...trip, reads: new Map(extra) };
}

/** The trip summary and its places as an undo reads them; null when either read failed. */
async function readTrip(session: Pick<AssistantToolSession, 'read'>): Promise<Omit<UndoSnapshot, 'reads'> | null> {
  const summary = await session.read('get_trip_summary');
  const places = await session.read('list_places');
  return summary.ok && places.ok ? { summary: summary.value, places: places.value } : null;
}
