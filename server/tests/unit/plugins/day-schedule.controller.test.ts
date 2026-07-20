/**
 * DayScheduleController (#plugins): bounded time contributions plugins attach to
 * the day plan via the dayScheduleProvider hook. Mirrors the map-markers
 * hardening — gate + fail-safe + server-side normalization — plus the schedule
 * specifics: dayIds are validated against the trip's own days and minutes are
 * clamped to a day, because this output feeds displayed timing totals.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { canAccessTrip, pluginsEnabled, tripDays } = vi.hoisted(() => ({
  canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined)),
  pluginsEnabled: vi.fn(() => true),
  tripDays: { value: [{ id: 10 }, { id: 11 }] as Array<{ id: number }> },
}));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ all: () => tripDays.value }) },
  canAccessTrip,
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { DayScheduleController } from '../../../src/nest/plugins/day-schedule.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    invokeHook: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginRuntimeService;
  return { c: new DayScheduleController(runtime), runtime };
}
const item = (over: Record<string, unknown> = {}) => ({ id: 's1', dayId: 10, label: 'Charging', ...over });

describe('DayScheduleController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / no user / non-member all return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => [item()]);
    expect(await x.c.get('1', req(5))).toEqual({ items: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [item()]).c.get('1', req(undefined))).items).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [item()]).c.get('1', req(5))).items).toEqual([]);
  });

  it('keeps a valid item, stamps pluginId, rounds + clamps minutes, defaults the tone', async () => {
    const { c } = controller(() => [
      item({ assignmentId: 42, minutes: 35.6, tone: 'success' }),
      item({ id: 's2', minutes: 999999, position: 'start' }),
    ]);
    const out = (await c.get('1', req(5))).items;
    expect(out[0]).toMatchObject({ pluginId: 'p1', dayId: 10, assignmentId: 42, minutes: 36, tone: 'success' });
    expect(out[1]).toMatchObject({ minutes: 1440, position: 'start', tone: 'default' });
  });

  it("drops items anchored to another trip's day, without id/label, or non-objects", async () => {
    const { c } = controller(() => [
      item({ dayId: 999 }),          // not a day of this trip
      item({ id: '' }),              // no id
      item({ label: '' }),           // no label
      item({ dayId: 'x' }),          // non-numeric day
      null,                          // non-object
      item({ id: 'good', dayId: 11 }),
    ]);
    const out = (await c.get('1', req(5))).items;
    expect(out.map(i => i.id)).toEqual(['good']);
  });

  it('ignores bogus anchors and positions instead of failing the item', async () => {
    const { c } = controller(() => [item({ assignmentId: 'x', reservationId: 1.5, position: 'middle', minutes: -10 })]);
    const out = (await c.get('1', req(5))).items;
    expect(out[0].assignmentId).toBeUndefined();
    expect(out[0].reservationId).toBeUndefined();
    expect(out[0].position).toBeUndefined();
    expect(out[0].minutes).toBeUndefined();
  });

  it('caps items at 60 per provider and skips a failing provider', async () => {
    const many = Array.from({ length: 80 }, (_, i) => item({ id: `s${i}` }));
    const { c } = controller((id) => (id === 'bad' ? (() => { throw new Error('boom'); })() : many), ['good', 'bad']);
    const out = (await c.get('1', req(5))).items;
    expect(out).toHaveLength(60);
  });

  it('bounds work on an all-invalid oversized payload', async () => {
    const huge = Array.from({ length: 100_000 }, () => ({ id: 's', dayId: 999, label: 'x' })); // foreign day -> all dropped
    const { c } = controller(() => huge);
    expect((await c.get('1', req(5))).items).toEqual([]);
  });

  it('skips the day lookup entirely when no provider is active', async () => {
    const { c, runtime } = controller(() => [item()], []);
    expect((await c.get('1', req(5))).items).toEqual([]);
    expect(runtime.invokeHook).not.toHaveBeenCalled();
  });
});
