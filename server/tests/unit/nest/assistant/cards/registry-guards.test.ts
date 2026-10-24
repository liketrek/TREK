/**
 * A package hook that throws never breaks a turn, a decision or an undo: the
 * registry wraps each one at load, and the place that calls it falls back to
 * what a tool without the hook gets. One package is replaced by a probe whose
 * every hook throws, so these cases run through the live call sites.
 */
import { buildTripCard } from '../../../../../src/nest/assistant/assistant-context';
import { toolOutputForProvider } from '../../../../../src/nest/assistant/assistant-output';
import { unchangedSinceApplied } from '../../../../../src/nest/assistant/assistant-undo.helpers';
import type { PreviewContext } from '../../../../../src/nest/assistant/cards/card-types';
import {
  ASSISTANT_UNDO_MAP,
  describedOf,
  nameArgOf,
  TOOL_CARDS,
  undoReadsOf,
} from '../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../src/nest/assistant/tool-call-preview.helpers';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../src/nest/audit/audit-log.logger', () => logMock);

vi.mock('../../../../../src/nest/assistant/cards/vacay', () => {
  const boom = (): never => {
    throw new Error('boom');
  };
  return {
    VACAY_CARDS: {
      id: 'vacay',
      tools: {
        plan_probe: {
          write: { verbKey: 'genericCreate', entity: 'other' },
          describe: boom,
          effect: boom,
          project: boom,
          appliedIds: boom,
          nameArg: boom,
          undo: { tool: 'delete_probe', args: boom, reads: boom, unchanged: boom },
        },
        list_probe: { appliedIds: () => [3, 0, -1, 2.5, 'x'] },
        // Names an id only from what the receipt is read with: the stored preview and the chat's trip.
        from_probe: {
          appliedIds: (_args: unknown, _result: unknown, from: { preview: unknown; tripId: number | null }) =>
            from.preview && from.tripId === 5 ? [11] : [],
        },
        // Tells the undo the call's own arguments are still what it reads.
        call_probe: {
          undo: {
            tool: 'delete_probe',
            args: () => ({}),
            unchanged: (_result: unknown, _snapshot: unknown, call: { args: Record<string, unknown> }) =>
              call.args.date === '2026-06-12',
          },
        },
      },
    },
  };
});

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(1, 7, { trip: { title: 'Alps' } }, null, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-06-01', airport: () => null };
const logged = () => logMock.logWarn.mock.calls.map(([line]) => String(line));

describe('the guarded package hooks', () => {
  it('ASTREG-030: a describer that throws gives way to the card built from the arguments', () => {
    const preview = describeToolCall('plan_probe', 'c1', { name: 'Lake' }, ctx);
    expect(preview).toMatchObject({ toolCallId: 'c1', tool: 'plan_probe' });
    expect(logged()[0]).toContain('the describer of plan_probe failed: boom');
    expect(describedOf('create_place', ctx, {}, null)).toBeNull();
    expect(TOOL_CARDS.plan_probe?.effect?.(ctx, {}, null)).toBeNull();
  });

  it('ASTREG-031: ids that throw fall back to the answer, and ids that are no row ids are left out', () => {
    const applied = appliedChange('plan_probe', 'c1', {}, { place: { id: 9 } }, null, null);
    expect(applied).toMatchObject({ entity: 'other', ids: [9] });
    expect(appliedChange('list_probe', 'c2', {}, {}, null, null)?.ids).toEqual([3]);
    expect(logged()[0]).toContain('the applied ids of plan_probe failed: boom');
  });

  it('ASTREG-032: an undo whose hooks throw has no way back and reads as changed since', () => {
    expect(ASSISTANT_UNDO_MAP.plan_probe?.args({}, {}, null)).toBeNull();
    expect(undoReadsOf('plan_probe', {}, {})).toEqual([]);
    expect(unchangedSinceApplied('plan_probe', {}, { summary: {}, places: {} })).toBe(false);
    expect(nameArgOf('plan_probe', 'probeId', 1, card)).toBeNull();
    expect(logged()).toEqual([
      expect.stringContaining('the undo arguments of plan_probe failed'),
      expect.stringContaining('the undo reads of plan_probe failed'),
      expect.stringContaining('the undo check of plan_probe failed'),
      expect.stringContaining('the name of probeId of plan_probe failed'),
    ]);
  });

  it("ASTREG-034: the preview and the trip reach a package's receipt ids, and the call its undo check", () => {
    const preview = describeToolCall('create_place', 'c3', { name: 'Lake' }, ctx);
    expect(appliedChange('from_probe', 'c3', {}, {}, null, null, { preview, tripId: 5 })?.ids).toEqual([11]);
    expect(appliedChange('from_probe', 'c3', {}, {}, null, null)?.ids).toEqual([]);
    const snapshot = { summary: {}, places: {} };
    const call = { args: { date: '2026-06-12' }, preview: null };
    expect(unchangedSinceApplied('call_probe', {}, snapshot, call)).toBe(true);
    // Without the call the check reads empty arguments, as the core's own checks do.
    expect(unchangedSinceApplied('call_probe', {}, snapshot)).toBe(false);
    expect(logged()).toEqual([]);
  });

  it('ASTREG-033: a projection that throws hands the provider the answer as it came', () => {
    expect(toolOutputForProvider('plan_probe', { days: 3 })).toEqual({ days: 3 });
    expect(logged()[0]).toContain('the projection of plan_probe failed: boom');
  });
});
