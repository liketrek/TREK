/**
 * DayTintsController (#plugins): the per-day colour plugins put behind the day cards
 * via the dayTintProvider hook. Same gate + fail-safe + server-side normalization as
 * the day-schedule hook, plus the rule this hook exists to make deterministic: a day
 * takes exactly one tint, so a contested day must resolve the same way every request
 * or the card flickers between two plugins' colours.
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
import { db as dbConn } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { DayTintsController } from '../../../src/nest/plugins/contributions/day-tints.controller';
import type { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function controller(invoke: (id: string) => unknown, providers = ['p1']) {
  const runtime = {
    providersOf: vi.fn(() => providers),
    dayTints: vi.fn(async (id: string) => invoke(id)),
  } as unknown as PluginHooks;
  return { c: new DayTintsController(runtime, new DatabaseService(dbConn)), runtime };
}
const tint = (over: Record<string, unknown> = {}) => ({ dayId: 10, tone: 'success', ...over });

describe('DayTintsController', () => {
  beforeEach(() => { pluginsEnabled.mockReturnValue(true); canAccessTrip.mockReturnValue({ id: 1 } as never); });

  it('gates: disabled / no user / non-member all return [] (no plugin calls on the first)', async () => {
    pluginsEnabled.mockReturnValue(false);
    const x = controller(() => [tint()]);
    expect(await x.c.get('1', req(5))).toEqual({ tints: [] });
    expect(x.runtime.providersOf).not.toHaveBeenCalled();
    pluginsEnabled.mockReturnValue(true);

    expect((await controller(() => [tint()]).c.get('1', req(undefined))).tints).toEqual([]);
    canAccessTrip.mockReturnValue(undefined as never);
    expect((await controller(() => [tint()]).c.get('1', req(5))).tints).toEqual([]);
  });

  it('keeps a valid tint, stamps pluginId, and caps the label', async () => {
    const { c } = controller(() => [tint({ label: 'x'.repeat(200) })]);
    const out = (await c.get('1', req(5))).tints;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ pluginId: 'p1', dayId: 10 });
    expect(out[0].label).toHaveLength(60);
  });

  it('spreads the `tone` shorthand across all three regions', async () => {
    const { c } = controller(() => [tint({ tone: 'warn' })]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toMatchObject({ badgeTone: 'warn', headerTone: 'warn', activityTone: 'warn' });
  });

  it('lets a named region override the shorthand', async () => {
    const { c } = controller(() => [tint({ tone: 'warn', badgeTone: 'danger' })]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toMatchObject({ badgeTone: 'danger', headerTone: 'warn', activityTone: 'warn' });
  });

  it('tints ONLY the named regions when there is no shorthand', async () => {
    // The point of the split: mark the leg on the badge, leave the dense activity
    // list untouched. An absent region must stay absent, not fall back to a colour.
    const { c } = controller(() => [{ dayId: 10, badgeTone: 'success' }]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toEqual({ pluginId: 'p1', dayId: 10, badgeTone: 'success' });
    expect(out[0].headerTone).toBeUndefined();
    expect(out[0].activityTone).toBeUndefined();
  });

  it('degrades a bogus tone to default rather than dropping the region', async () => {
    const { c } = controller(() => [
      tint({ tone: 'chartreuse' }),
      { dayId: 11, headerTone: 42 },
    ]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toMatchObject({ badgeTone: 'default', headerTone: 'default', activityTone: 'default' });
    // A named-but-bogus region is still a request to tint it; unnamed ones stay off.
    expect(out[1]).toEqual({ pluginId: 'p1', dayId: 11, headerTone: 'default' });
  });

  it('spreads a `color` shorthand across all three regions, lower-cased', async () => {
    const { c } = controller(() => [{ dayId: 10, color: '#A1B2C3' }]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toMatchObject({ badgeColor: '#a1b2c3', headerColor: '#a1b2c3', activityColor: '#a1b2c3' });
  });

  it('gives a region exactly one paint — a colour beats a tone at the same level', async () => {
    // Both set on the badge: the colour is the more specific request, and the tone
    // must not ride along, or the client has a tie to break.
    const { c } = controller(() => [{ dayId: 10, badgeTone: 'danger', badgeColor: '#00ff00' }]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toEqual({ pluginId: 'p1', dayId: 10, badgeColor: '#00ff00' });
    expect(out[0].badgeTone).toBeUndefined();
  });

  it('lets a named region override the shorthand across channels, both ways', async () => {
    const { c } = controller(() => [
      { dayId: 10, color: '#112233', badgeTone: 'danger' },  // tone overrides a colour shorthand
      { dayId: 11, tone: 'warn', badgeColor: '#112233' },    // colour overrides a tone shorthand
    ]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toMatchObject({ badgeTone: 'danger', headerColor: '#112233', activityColor: '#112233' });
    expect(out[0].badgeColor).toBeUndefined();
    expect(out[1]).toMatchObject({ badgeColor: '#112233', headerTone: 'warn', activityTone: 'warn' });
  });

  it('accepts ONLY #rrggbb — a CSS colour cannot be smuggled in as a string', async () => {
    // The value ends up inside a `color-mix()` in an inline `background`, which takes a
    // layer list: a string that closes the paren early could append a url() layer and
    // beacon every viewer of the trip. None of these may reach the client as a colour.
    const evil = 'red 50%, transparent), url(https://evil.example/x.png';
    const { c } = controller(() => [
      { dayId: 10, badgeColor: evil, headerColor: 'rebeccapurple', activityColor: '#abc' },
      { dayId: 11, color: 'rgb(1,2,3)', headerColor: '#12345', activityColor: '#1234567' },
    ]);
    const out = (await c.get('1', req(5))).tints;
    expect(JSON.stringify(out)).not.toContain('evil.example');
    for (const t of out) {
      expect(t.badgeColor).toBeUndefined();
      expect(t.headerColor).toBeUndefined();
      expect(t.activityColor).toBeUndefined();
    }
    // Rejected, but the regions still asked to be tinted — they degrade like a bogus
    // tone does rather than silently rendering plain.
    expect(out[0]).toMatchObject({ badgeTone: 'default', headerTone: 'default', activityTone: 'default' });
    // A junk shorthand paints nothing, so the badge — which named neither channel —
    // stays untinted, while the two regions that did name one degrade to `default`.
    expect(out[1]).toMatchObject({ headerTone: 'default', activityTone: 'default' });
    expect(out[1].badgeTone).toBeUndefined();
  });

  it('keeps a valid sibling when only one channel of a region is junk', async () => {
    const { c } = controller(() => [{ dayId: 10, badgeColor: 'chartreuse', badgeTone: 'success' }]);
    const out = (await c.get('1', req(5))).tints;
    expect(out[0]).toEqual({ pluginId: 'p1', dayId: 10, badgeTone: 'success' });
  });

  it('treats an entry with no tone at all as "tint this day", default everywhere', async () => {
    const { c } = controller(() => [{ dayId: 10 }, { dayId: 11, tone: undefined }]);
    const out = (await c.get('1', req(5))).tints;
    for (const t of out) expect(t).toMatchObject({ badgeTone: 'default', headerTone: 'default', activityTone: 'default' });
    expect(out[0].label).toBeUndefined();
  });

  it("drops tints on another trip's day, on a non-numeric day, and non-objects", async () => {
    const { c } = controller(() => [
      tint({ dayId: 999 }),  // not a day of this trip
      tint({ dayId: 'x' }),  // non-numeric day
      tint({ dayId: null }),
      null,                  // non-object
      tint({ dayId: 11 }),
    ]);
    const out = (await c.get('1', req(5))).tints;
    expect(out.map(t => t.dayId)).toEqual([11]);
  });

  it('takes a provider\'s FIRST answer for a day it tints twice', async () => {
    const { c } = controller(() => [
      tint({ dayId: 10, tone: 'success', label: 'first' }),
      tint({ dayId: 10, tone: 'danger', label: 'second' }),
    ]);
    const out = (await c.get('1', req(5))).tints;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ badgeTone: 'success', label: 'first' });
  });

  it('resolves a contested day WHOLE — the loser cannot fill in the winner\'s empty regions', async () => {
    const { c } = controller(
      (id) => (id === 'first'
        ? [{ dayId: 10, badgeTone: 'success' }]                        // badge only
        : [{ dayId: 10, tone: 'danger' }, { dayId: 11, tone: 'warn' }]), // would fill all three
      ['first', 'second'],
    );
    const out = (await c.get('1', req(5))).tints;
    // Day 10 is `first`'s badge-only contribution — `second` contributes nothing to
    // it, so two plugins can never each own part of one card. Day 11 is uncontested.
    expect(out).toEqual([
      { pluginId: 'first', dayId: 10, badgeTone: 'success' },
      { pluginId: 'second', dayId: 11, badgeTone: 'warn', headerTone: 'warn', activityTone: 'warn' },
    ]);
  });

  it('skips a failing provider without losing the healthy one', async () => {
    const { c } = controller(
      (id) => (id === 'bad' ? (() => { throw new Error('boom'); })() : [tint()]),
      ['bad', 'good'],
    );
    const out = (await c.get('1', req(5))).tints;
    expect(out.map(t => t.pluginId)).toEqual(['good']);
  });

  it('bounds work on an all-invalid oversized payload', async () => {
    const huge = Array.from({ length: 100_000 }, () => ({ dayId: 999, tone: 'success' })); // foreign day -> all dropped
    const { c } = controller(() => huge);
    expect((await c.get('1', req(5))).tints).toEqual([]);
  });

  it('slices the raw array at 2000 before validating it', async () => {
    // 2000 junk entries, then a legitimate one — past the slice, so it never lands.
    const raw = [...Array.from({ length: 2000 }, () => ({ dayId: 999 })), tint({ dayId: 11 })];
    const { c } = controller(() => raw);
    expect((await c.get('1', req(5))).tints).toEqual([]);
  });

  it('ignores a non-array payload', async () => {
    const { c } = controller(() => ({ tints: [tint()] }));
    expect((await c.get('1', req(5))).tints).toEqual([]);
  });

  it('skips the day lookup entirely when no provider is active', async () => {
    const { c, runtime } = controller(() => [tint()], []);
    expect((await c.get('1', req(5))).tints).toEqual([]);
    expect(runtime.dayTints).not.toHaveBeenCalled();
  });
});
