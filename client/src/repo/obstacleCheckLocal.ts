import { obstacleStatusOf, type ObstacleReviewOp, type TourObstacleCheck, type TourObstacleEntry } from '@trek/shared';

interface LocalContext {
  /** When the change was made, as an ISO instant. */
  now: string;
  userId: number | null;
  /** The revision the changed checklist carries until the server answers. */
  revision: string;
}

/** A decision on a current entry, read against the entry's own basis as the server will. */
function decided(entry: TourObstacleEntry, op: ObstacleReviewOp, ctx: LocalContext): TourObstacleEntry {
  if (!entry.basis || !op.decision || !op.basis) return entry;
  const note = op.note || null;
  const record = entry.decision;
  const same =
    record?.decision === op.decision &&
    record.note === note &&
    entry.basis.route === op.basis.route &&
    entry.basis.source === op.basis.source;
  const { status, changed } = obstacleStatusOf({
    current: { route: entry.basis.route, source: entry.basis.source, portage: entry.portage },
    review: { decision: op.decision, route: op.basis.route, source: op.basis.source },
  });
  return {
    ...entry,
    status,
    changed,
    decision: same && record ? record : { decision: op.decision, note, decided_at: ctx.now, decided_by: ctx.userId },
  };
}

function applied(entry: TourObstacleEntry, op: ObstacleReviewOp, ctx: LocalContext): TourObstacleEntry | null {
  if (op.op === 'decide') return entry.relation === null ? entry : decided(entry, op, ctx);
  if (op.op === 'note')
    return entry.decision ? { ...entry, decision: { ...entry.decision, note: op.note || null } } : entry;
  if (op.op === 'clear') {
    // An earlier decision goes with its entry; a current entry is open again.
    if (entry.relation === null) return null;
    return { ...entry, status: 'open', changed: [], decision: null };
  }
  return entry.status === 'gone' ? { ...entry, status: 'kept' } : entry;
}

/**
 * The checklist as it reads once the changes land, worked out here for an
 * offline save or the moment before the server answers: the server stores
 * the same decisions against the same basis and answers the same statuses.
 */
export function applyObstacleOps(
  check: TourObstacleCheck,
  ops: readonly ObstacleReviewOp[],
  ctx: LocalContext
): TourObstacleCheck {
  const byKey = new Map(ops.map((op) => [op.key, op]));
  const entries = check.entries.flatMap((entry) => {
    const op = byKey.get(entry.key);
    if (!op) return [entry];
    const next = applied(entry, op, ctx);
    return next ? [next] : [];
  });
  return { ...check, revision: ctx.revision, entries };
}
