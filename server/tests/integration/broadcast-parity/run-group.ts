import { openHarness, REST_SOCKET, sceneUsers, type ParityHarness, type Recorded } from './harness';
import type { CaseGroup, ExemptTool, Expect, ParityCase, Receivers, Scene, ToolCall } from './types';
import { TREK_WS_EVENTS, type TrekWsEventName } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * One group's cases (plan section 3.4). Each case runs its tool over MCP on
 * one scene and, when it has one, its REST twin on a second scene built the
 * same way, then holds both recordings to the case's list:
 *
 * 1. MCP: the tool answers without an error, and the events are exactly the
 *    list, in order and count, so a doubled broadcast shows.
 * 2. MCP: no room broadcast skips a socket (the asking tab hears everything),
 *    an event for the actor reaches the actor's own sockets, and a send
 *    limited to some users of the room reaches the actor too.
 * 3. No event leaves while a transaction is open.
 * 4. Every payload passes the registry's schema in @trek/shared.
 * 5. REST: the same events in the same order; MCP sends at least REST's
 *    payload keys and reaches the same users; REST leaves out the requesting
 *    socket unless the event is one every socket needs (`all`).
 *
 * On both surfaces a room broadcast goes to the scene's trip (or the room the
 * case names), and only to the users the case says it is limited to. Nothing
 * may be on the recorder when a write starts, so a send that lands late, after
 * its own case was read, fails rather than being thrown away.
 *
 * Each exemption runs too, over MCP: it must answer without an error and send
 * nothing at all.
 */

type Surface = 'MCP' | 'REST';

interface Wanted {
  channel: 'trip' | 'user';
  event: string;
  all: boolean;
  user?: 'actor' | 'others';
  /** The users of the room the send is limited to, per surface; none means the whole room. */
  only: Partial<Record<Surface, Receivers>>;
  /** The surfaces limit it differently on purpose, so their receivers are not compared. */
  onlyDiffers: boolean;
}

function wanted(e: Expect): Wanted {
  if (typeof e === 'string') return { channel: 'trip', event: e, all: false, only: {}, onlyDiffers: false };
  if ('user' in e) {
    return { channel: 'user', event: e.event, all: e.all === true, user: e.user, only: {}, onlyDiffers: false };
  }
  const only =
    e.only === undefined
      ? {}
      : typeof e.only === 'string'
        ? { MCP: e.only, REST: e.only }
        : { MCP: e.only.mcp, REST: e.only.rest };
  return { channel: 'trip', event: e.event, all: e.all === true, only, onlyDiffers: only.MCP !== only.REST };
}

const signature = (r: { channel: string; event: string }) => `${r.channel} ${r.event}`;

/** The recording as one line per send, for a failure message. */
function trace(records: Recorded[]): string {
  if (records.length === 0) return '  (nothing sent)';
  return records
    .map((r) => {
      const extra = [
        `to ${r.to.join(',')}`,
        r.excludeSid === undefined ? null : `skips ${String(r.excludeSid)}`,
        r.onlyUserIds ? `only ${r.onlyUserIds.join(',')}` : null,
        r.inTx ? 'IN TRANSACTION' : null,
      ].filter((part) => part !== null);
      return `  ${signature(r)} {${r.keys.join(', ')}} ${extra.join(', ')}`;
    })
    .join('\n');
}

/** Who a send reaches, by the scene's names for its users, so the two scenes compare. */
function receivers(r: Recorded, s: Scene): string {
  const ids = r.channel === 'user' ? r.to.map(Number) : r.onlyUserIds;
  if (!ids) return 'the whole room';
  const users = sceneUsers(s);
  return ids
    .map((id) => users.get(id) ?? `user ${id}`)
    .sort()
    .join(', ');
}

const isRegistered = (event: string): event is TrekWsEventName => Object.hasOwn(TREK_WS_EVENTS, event);

function actorOf(call: ToolCall, s: Scene) {
  return call.actor === 'admin' ? s.admin : s.owner;
}

/** A room broadcast limited to some users of the room, held to what the case says. */
function checkLimit(limit: Receivers | undefined, r: Recorded, actorId: number, where: string): void {
  if (limit === undefined) {
    expect(r.onlyUserIds, `limited to some users of the room: ${where}`).toBeUndefined();
    return;
  }
  expect(
    r.onlyUserIds,
    `sent to the whole room, not to its ${limit === 'actor' ? 'writer' : 'viewers'}: ${where}`,
  ).toBeDefined();
  if (limit === 'actor') expect(r.onlyUserIds, `not limited to the writer alone: ${where}`).toEqual([actorId]);
  else expect(r.onlyUserIds, `the writer is not among the viewers it reaches: ${where}`).toContain(actorId);
}

/** Checks 1 to 4 for one surface, the room and its limits, and the socket rule of check 5 for REST. */
function checkSurface(surface: Surface, c: ParityCase, records: Recorded[], s: Scene): void {
  const actorId = actorOf(c, s).id;
  const room = c.room?.(s) ?? s.trip.id;
  const expected = c.expect.map(wanted);
  const seen = trace(records);
  expect(records.map(signature), `${c.tool} over ${surface} sent:\n${seen}`).toEqual(expected.map(signature));
  records.forEach((r, i) => {
    const want = expected[i];
    const where = `${c.tool} over ${surface}, send ${i + 1} (${signature(r)}):\n${seen}`;
    expect(r.inTx, `sent inside a transaction, before the commit: ${where}`).toBe(false);
    expect(isRegistered(r.event), `not an event of the registry: ${where}`).toBe(true);
    if (isRegistered(r.event)) {
      const parsed = TREK_WS_EVENTS[r.event].payload.safeParse(r.payload);
      expect(parsed.success, `payload fails the registry schema (${parsed.error?.message ?? ''}): ${where}`).toBe(true);
    }
    if (!want) return;
    if (want.channel === 'user') {
      const reachesActor = r.to.includes(actorId);
      expect(reachesActor, `the actor ${want.user === 'actor' ? 'is not' : 'is'} among the receivers: ${where}`).toBe(
        want.user === 'actor',
      );
      if (want.user === 'others') return;
    } else {
      expect(Number(r.to[0]), `sent to another room than the trip's: ${where}`).toBe(room);
      checkLimit(want.only[surface], r, actorId, where);
    }
    const skips = surface === 'MCP' || want.all ? undefined : REST_SOCKET;
    expect(r.excludeSid, `skips the wrong socket: ${where}`).toBe(skips);
  });
}

/** Check 5 across the surfaces: MCP sends REST's payload keys, to the same users. */
function compareSurfaces(c: ParityCase, mcp: Recorded[], mcpScene: Scene, rest: Recorded[], restScene: Scene): void {
  const expected = c.expect.map(wanted);
  mcp.forEach((m, i) => {
    const r = rest[i];
    if (!r) return;
    const missing = r.keys.filter((key) => !m.keys.includes(key));
    expect(missing, `${c.tool}: MCP's ${m.event} lacks payload keys REST sends`).toEqual([]);
    if (expected[i]?.onlyDiffers) return;
    expect(receivers(r, restScene), `${c.tool}: ${m.event} reaches other users over REST than over MCP`).toBe(
      receivers(m, mcpScene),
    );
  });
}

/** Nothing may wait on the recorder when a write starts: a late send of the case before, or a scene that sent. */
function nothingSentYet(h: ParityHarness, before: string): void {
  const early = h.recorder.take();
  expect(early, `sent before ${before}, by the case before it or by the scene:\n${trace(early)}`).toEqual([]);
}

const nextMacrotask = () => new Promise<void>((resolve) => setImmediate(resolve));

async function runCase(h: ParityHarness, c: ParityCase): Promise<void> {
  const restore = c.stub?.(h.app);
  try {
    const mcpScene = await h.scene(c.needs);
    await c.setup?.(mcpScene, h.app);
    nothingSentYet(h, `${c.tool} ran over MCP`);
    const outcome = await h.callTool(actorOf(c, mcpScene).id, c.tool, c.args(mcpScene));
    if (c.settle) await nextMacrotask();
    const mcp = h.recorder.take();
    expect(outcome.isError, `${c.tool} failed over MCP: ${outcome.text}`).toBe(false);
    checkSurface('MCP', c, mcp, mcpScene);

    if (!c.rest) return;
    const restScene = await h.scene(c.needs);
    await c.setup?.(restScene, h.app);
    nothingSentYet(h, `the REST twin of ${c.tool} ran`);
    const res = await h.rest(actorOf(c, restScene).id, c.rest, restScene);
    if (c.settle) await nextMacrotask();
    const rest = h.recorder.take();
    expect(res.status, `the REST twin of ${c.tool} answered ${res.status}: ${res.text}`).toBeGreaterThanOrEqual(200);
    expect(res.status, `the REST twin of ${c.tool} answered ${res.status}: ${res.text}`).toBeLessThan(300);
    checkSurface('REST', c, rest, restScene);
    compareSurfaces(c, mcp, mcpScene, rest, restScene);
  } finally {
    if (typeof restore === 'function') restore();
  }
}

/** An exemption, run: the tool answers without an error and sends nothing, not even one macrotask later. */
async function runExempt(h: ParityHarness, e: ExemptTool): Promise<void> {
  const s = await h.scene(e.needs);
  await e.setup?.(s, h.app);
  const actor = actorOf(e, s);
  nothingSentYet(h, `${e.tool} ran`);
  if (e.first) {
    const before = await h.callTool(actor.id, e.first.tool, e.first.args(s));
    expect(before.isError, `${e.first.tool}, run before ${e.tool}, failed: ${before.text}`).toBe(false);
  }
  const outcome = await h.callTool(actor.id, e.tool, e.args(s));
  await nextMacrotask();
  const sent = h.recorder.take();
  expect(outcome.isError, `${e.tool} failed over MCP: ${outcome.text}`).toBe(false);
  expect(sent, `${e.tool} is exempt as silent, yet sent:\n${trace(sent)}`).toEqual([]);
}

const caseId = (prefix: string, index: number) => `${prefix}-${String(index).padStart(3, '0')}`;

/** The rows of a group that the registry test cannot see from outside: each tool once, and every case well-formed. */
function groupProblems(group: CaseGroup): string[] {
  const problems: string[] = [];
  const rows = [...group.cases.map((c) => c.tool), ...group.exempt.map((e) => e.tool), ...(group.pending ?? [])];
  for (const tool of new Set(rows)) {
    const count = rows.filter((row) => row === tool).length;
    if (count > 1) problems.push(`${tool} has ${count} rows`);
  }
  for (const c of group.cases) {
    if (c.expect.length === 0) problems.push(`${c.tool} expects no event: a silent tool is an exemption`);
    if (!c.rest && !c.twin) problems.push(`${c.tool} has neither a REST twin nor a note naming the nearest one`);
  }
  const exempt = new Set(group.exempt.map((e) => e.tool));
  for (const e of group.exempt) {
    if (e.reason.trim().length < 20) problems.push(`${e.tool}'s exemption gives no real reason`);
    if (e.first && !exempt.has(e.first.tool))
      problems.push(`${e.tool} runs ${e.first.tool} first, which is no exemption here`);
  }
  return problems;
}

/** The test file of one group: one boot, one test per case and per exemption. */
export function runGroup(group: CaseGroup): void {
  describe(`broadcast parity: ${group.name}`, () => {
    let h: ParityHarness;

    // A group with nothing to run yet does not boot the app for it.
    if (group.cases.length > 0 || group.exempt.length > 0) {
      beforeAll(async () => {
        h = await openHarness();
      }, 60_000);

      afterAll(async () => {
        await h?.close();
      });
    }

    it(`${caseId(group.prefix, 0)}: names each of its write tools once, and every case can fail`, () => {
      expect(groupProblems(group)).toEqual([]);
    });

    group.cases.forEach((c, i) => {
      const title = c.rest
        ? `${c.tool} sends the same events over MCP and REST`
        : `${c.tool} sends its events to every tab over MCP (twin: ${c.twin ?? ''})`;
      it(`${caseId(group.prefix, i + 1)}: ${title}`, () => runCase(h, c));
    });

    group.exempt.forEach((e, i) => {
      it(`${caseId(`${group.prefix}-EX`, i + 1)}: ${e.tool} sends nothing, as its exemption says`, () =>
        runExempt(h, e));
    });
  });
}
