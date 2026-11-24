/**
 * TRIPADDON-MCP-001..012: the MCP side of the per-trip addons.
 *
 * Two halves. A tool's `when:` gate (addonGate and its siblings) runs once, at
 * attach: it registers a trip addon's tools while the instance or any trip of
 * the user has the addon on, or, for a session pinned to one trip, while that
 * trip has it on. The host's tool gate (trekTripAddonToolGate) runs on every
 * call and asks the trip the call names, so a trip that has the addon off
 * refuses with the REST text and one that switched it on lets the call through.
 */
import type { McpContext, ToolOptions } from '../../../src/nest-mcp';
import { combineToolGates, errorResult } from '../../../src/nest-mcp';
import {
  addonGate,
  addonOffResource,
  addonsOfGate,
  allAddonsGate,
  collabFeatureGate,
  gateOnAddons,
  instanceAddonGate,
  type HasAddons,
} from '../../../src/nest/addons/addon-gate';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { trekTripAddonToolGate } from '../../../src/nest/addons/trip-addon-tool-gate';
import type { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';

import { describe, it, expect, vi } from 'vitest';

const ctx = (extra: Partial<McpContext> = {}): McpContext => ({
  userId: 7,
  scopes: null,
  isStaticToken: false,
  ...extra,
});

/**
 * The instance has `instance` on; trip 5 chose `trip5`; the user's trips have
 * `anywhere` on somewhere. Trip 5 is the user's, trip 9 is not.
 */
function addonsStub(o: { instance?: string[]; trip5?: Record<string, boolean>; anywhere?: string[] } = {}) {
  const instance = new Set(o.instance ?? []);
  const anywhere = new Set([...(o.anywhere ?? []), ...instance]);
  return {
    isAddonEnabled: vi.fn(async (id: string) => instance.has(id)),
    isEnabledForTrip: vi.fn(async (tripId: number, id: string) =>
      tripId === 5 ? (o.trip5?.[id] ?? instance.has(id)) : instance.has(id),
    ),
    isEnabledForUserAnywhere: vi.fn(async (_userId: number, id: string) => anywhere.has(id)),
    getCollabFeatures: vi.fn(async () => ({ chat: true, notes: false, links: true, polls: true, whatsnext: true })),
  };
}

const self = (addons: ReturnType<typeof addonsStub>): HasAddons => ({ addons: addons as unknown as AddonsService });

const trips = {
  findAccessible: vi.fn(async (tripId: number, userId: number) =>
    tripId === 5 && userId === 7 ? { id: 5 } : undefined,
  ),
} as unknown as TripAccessService;

const tool = (when?: unknown): ToolOptions => ({ name: 'some_tool', when }) as unknown as ToolOptions;

describe('the attach-time gates', () => {
  it('TRIPADDON-MCP-001: a trip addon is offered while it is on anywhere for the user, any other addon on the instance', async () => {
    const off = addonsStub({ anywhere: ['packing'] });
    expect(await addonGate('packing')(ctx(), self(off))).toBe(true);
    expect(off.isEnabledForUserAnywhere).toHaveBeenCalledWith(7, 'packing');
    expect(await addonGate('budget')(ctx(), self(off))).toBe(false);
    // Vacay has no trip side: only the instance switch counts.
    expect(await addonGate('vacay')(ctx(), self(addonsStub({ anywhere: ['vacay'] })))).toBe(false);
    expect(await addonGate('vacay')(ctx(), self(addonsStub({ instance: ['vacay'] })))).toBe(true);
  });

  it('TRIPADDON-MCP-002: a session pinned to one trip asks that trip alone', async () => {
    const addons = addonsStub({ instance: ['budget'], trip5: { budget: false, roadtrip: true } });
    expect(await addonGate('budget')(ctx({ tripId: 5 }), self(addons))).toBe(false);
    expect(await addonGate('roadtrip')(ctx({ tripId: 5 }), self(addons))).toBe(true);
    expect(addons.isEnabledForUserAnywhere).not.toHaveBeenCalled();
  });

  it('TRIPADDON-MCP-003: allAddonsGate needs every addon, collabFeatureGate the addon and its instance-wide flag', async () => {
    const addons = addonsStub({ anywhere: ['tours'], instance: ['collab'] });
    expect(await allAddonsGate('tours', 'packing')(ctx(), self(addons))).toBe(false);
    expect(await allAddonsGate('tours', 'collab')(ctx(), self(addons))).toBe(true);
    expect(await collabFeatureGate('chat')(ctx(), self(addons))).toBe(true);
    expect(await collabFeatureGate('notes')(ctx(), self(addons))).toBe(false);
    expect(await collabFeatureGate('chat')(ctx({ tripId: 5 }), self(addonsStub({ trip5: { collab: false } })))).toBe(
      false,
    );
  });

  it('TRIPADDON-MCP-004: instanceAddonGate reads the instance switch alone, a trip that switched it on aside', async () => {
    expect(await instanceAddonGate('documents')(ctx(), self(addonsStub({ anywhere: ['documents'] })))).toBe(false);
    expect(await instanceAddonGate('documents')(ctx(), self(addonsStub({ instance: ['documents'] })))).toBe(true);
  });

  it('TRIPADDON-MCP-005: every gate names the addons it stands for; anything else names none', () => {
    expect(addonsOfGate(addonGate('packing'))).toEqual(['packing']);
    expect(addonsOfGate(allAddonsGate('tours', 'packing'))).toEqual(['tours', 'packing']);
    expect(addonsOfGate(collabFeatureGate('polls'))).toEqual(['collab']);
    expect(addonsOfGate(instanceAddonGate('documents'))).toEqual(['documents']);
    expect(addonsOfGate(gateOnAddons(['tours'], async () => true))).toEqual(['tours']);
    expect(addonsOfGate(async () => true)).toEqual([]);
    expect(addonsOfGate(undefined)).toEqual([]);
    expect(addonsOfGate(Object.assign(async () => true, { addonIds: 'tours' }))).toEqual([]);
  });

  it('TRIPADDON-MCP-006: a trip resource whose addon is off answers with the REST text', () => {
    const uri = new URL('trek://trips/5/budget');
    expect(addonOffResource(uri, 'budget')).toEqual({
      contents: [
        { uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ error: 'Costs addon is not enabled' }) },
      ],
    });
  });
});

describe('trekTripAddonToolGate, on every call', () => {
  it('TRIPADDON-MCP-007: a trip that has the addon off refuses the call; one that switched it on lets it through', async () => {
    const addons = addonsStub({ instance: ['budget'], trip5: { budget: false, roadtrip: true } });
    const gate = trekTripAddonToolGate(addons as unknown as AddonsService, trips);
    expect(await gate(tool(addonGate('budget')), ctx(), { tripId: 5 })).toEqual(
      errorResult('Costs addon is not enabled'),
    );
    expect(await gate(tool(addonGate('roadtrip')), ctx(), { tripId: '5' })).toBeUndefined();
    expect(addons.isEnabledForTrip).toHaveBeenCalledWith(5, 'roadtrip');
  });

  it('TRIPADDON-MCP-008: of several addons the first one off answers', async () => {
    const addons = addonsStub({ instance: ['tours', 'packing'], trip5: { packing: false } });
    const gate = trekTripAddonToolGate(addons as unknown as AddonsService, trips);
    expect(await gate(tool(allAddonsGate('tours', 'packing')), ctx(), { tripId: 5 })).toEqual(
      errorResult('Packing addon is not enabled'),
    );
  });

  it('TRIPADDON-MCP-009: a tool of no trip addon, or one gated some other way, is left alone', async () => {
    const addons = addonsStub();
    const gate = trekTripAddonToolGate(addons as unknown as AddonsService, trips);
    expect(await gate(tool(undefined), ctx(), { tripId: 5 })).toBeUndefined();
    expect(await gate(tool(addonGate('vacay')), ctx(), { tripId: 5 })).toBeUndefined();
    expect(
      await gate(
        tool(async () => true),
        ctx(),
        { tripId: 5 },
      ),
    ).toBeUndefined();
    expect(addons.isEnabledForTrip).not.toHaveBeenCalled();
  });

  it('TRIPADDON-MCP-010: a trip the caller cannot see is left to the tool, which answers not found', async () => {
    const addons = addonsStub({ trip5: { budget: false } });
    const gate = trekTripAddonToolGate(addons as unknown as AddonsService, trips);
    expect(await gate(tool(addonGate('budget')), ctx(), { tripId: 9 })).toBeUndefined();
    expect(addons.isEnabledForTrip).not.toHaveBeenCalled();
  });

  it('TRIPADDON-MCP-011: a call that names no trip asks the pinned trip, else the user anywhere', async () => {
    const addons = addonsStub({ trip5: { packing: false }, anywhere: ['packing'] });
    const gate = trekTripAddonToolGate(addons as unknown as AddonsService, trips);
    expect(await gate(tool(addonGate('packing')), ctx(), {})).toBeUndefined();
    expect(await gate(tool(addonGate('packing')), ctx(), undefined)).toBeUndefined();
    expect(addons.isEnabledForUserAnywhere).toHaveBeenCalledWith(7, 'packing');
    expect(await gate(tool(addonGate('packing')), ctx({ tripId: 5 }), {})).toEqual(
      errorResult('Packing addon is not enabled'),
    );
    expect(await gate(tool(addonGate('budget')), ctx(), {})).toEqual(errorResult('Costs addon is not enabled'));
  });
});

describe('combineToolGates', () => {
  it('TRIPADDON-MCP-012: asks the gates in order, answers with the first refusal and stops there', async () => {
    const first = vi.fn(async () => undefined);
    const second = vi.fn(() => errorResult('no'));
    const third = vi.fn(async () => errorResult('never asked'));
    const gate = combineToolGates(first, second, third);
    const options = tool();
    expect(await gate(options, ctx(), { tripId: 5 })).toEqual(errorResult('no'));
    expect(first).toHaveBeenCalledWith(options, ctx(), { tripId: 5 });
    expect(third).not.toHaveBeenCalled();
    expect(await combineToolGates(first)(options, ctx())).toBeUndefined();
    expect(await combineToolGates()(options, ctx())).toBeUndefined();
  });
});
