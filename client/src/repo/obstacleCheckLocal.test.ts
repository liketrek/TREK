// The checklist worked out here before the server answers (PAD-06): a decision
// read against the entry's own basis, a note, removing and keeping a decision.
import { describe, expect, it } from 'vitest';

import { earlierEntry, obstacleCheck, obstacleEntry, ROUTE_BASIS, SOURCE_BASIS } from '../../tests/helpers/paddleCheck';
import { applyObstacleOps } from './obstacleCheckLocal';

const ctx = { now: '2026-10-17T09:00:00.000Z', userId: 4, revision: 'local:abc' };
const basis = { route: ROUTE_BASIS, source: SOURCE_BASIS };

describe('applyObstacleOps', () => {
  it('OCL-001: a decision on the basis shown is decided, a portage without a planned carry is to do', () => {
    const check = obstacleCheck();
    const passed = applyObstacleOps(
      check,
      [{ key: 'node/1', op: 'decide', decision: 'pass', note: 'Links', basis }],
      ctx
    );
    expect(passed.revision).toBe('local:abc');
    expect(passed.entries[0]).toMatchObject({
      status: 'decided',
      changed: [],
      decision: { decision: 'pass', note: 'Links', decided_at: ctx.now, decided_by: 4 },
    });
    const carried = applyObstacleOps(
      check,
      [{ key: 'node/1', op: 'decide', decision: 'portage', note: null, basis }],
      ctx
    );
    expect(carried.entries[0]?.status).toBe('todo');
    const planned = applyObstacleOps(
      obstacleCheck({ entries: [obstacleEntry({ portage: 'planned' })] }),
      [{ key: 'node/1', op: 'decide', decision: 'portage', note: null, basis }],
      ctx
    );
    expect(planned.entries[0]?.status).toBe('decided');
  });

  it('OCL-002: a decision on another basis than the entry carries reads as one to check again', () => {
    const stale = { route: ROUTE_BASIS.replace('p1:o:', 'p1:n:'), source: SOURCE_BASIS };
    const next = applyObstacleOps(
      obstacleCheck(),
      [{ key: 'node/1', op: 'decide', decision: 'pass', note: null, basis: stale }],
      ctx
    );
    expect(next.entries[0]).toMatchObject({ status: 'review', changed: ['route'] });
  });

  it('OCL-003: the same decision again keeps when it was made', () => {
    const decision = { decision: 'pass' as const, note: null, decided_at: '2026-10-01T08:00:00.000Z', decided_by: 2 };
    const check = obstacleCheck({ entries: [obstacleEntry({ status: 'decided', decision })] });
    const next = applyObstacleOps(check, [{ key: 'node/1', op: 'decide', decision: 'pass', note: null, basis }], ctx);
    expect(next.entries[0]?.decision).toEqual(decision);
  });

  it('OCL-004: a note changes only the note, and nothing without a decision', () => {
    const decision = { decision: 'pass' as const, note: null, decided_at: '2026-10-01T08:00:00.000Z', decided_by: 2 };
    const check = obstacleCheck({
      entries: [obstacleEntry({ status: 'decided', decision }), obstacleEntry({ key: 'node/2' })],
    });
    const next = applyObstacleOps(
      check,
      [
        { key: 'node/1', op: 'note', decision: null, note: 'Rampe rechts', basis: null },
        { key: 'node/2', op: 'note', decision: null, note: 'nothing to note', basis: null },
      ],
      ctx
    );
    expect(next.entries[0]?.decision).toEqual({ ...decision, note: 'Rampe rechts' });
    expect(next.entries[1]?.decision).toBeNull();
  });

  it('OCL-005: removing a decision reopens a current entry and drops an earlier one', () => {
    const decision = { decision: 'pass' as const, note: null, decided_at: '2026-10-01T08:00:00.000Z', decided_by: 2 };
    const check = obstacleCheck({ entries: [obstacleEntry({ status: 'decided', decision }), earlierEntry()] });
    const next = applyObstacleOps(
      check,
      [
        { key: 'node/1', op: 'clear', decision: null, note: null, basis: null },
        { key: 'node/9', op: 'clear', decision: null, note: null, basis: null },
      ],
      ctx
    );
    expect(next.entries).toEqual([obstacleEntry({ status: 'open', changed: [], decision: null })]);
  });

  it('OCL-006: keeping turns a vanished object kept, anything else stays; a decision on an earlier entry is ignored', () => {
    const check = obstacleCheck({ entries: [obstacleEntry(), earlierEntry()] });
    const next = applyObstacleOps(
      check,
      [
        { key: 'node/1', op: 'keep', decision: null, note: null, basis: null },
        { key: 'node/9', op: 'keep', decision: null, note: null, basis: null },
      ],
      ctx
    );
    expect(next.entries.map((entry) => entry.status)).toEqual(['open', 'kept']);
    const decided = applyObstacleOps(
      check,
      [{ key: 'node/9', op: 'decide', decision: 'portage', note: null, basis }],
      ctx
    );
    expect(decided.entries[1]).toEqual(earlierEntry());
  });
});
