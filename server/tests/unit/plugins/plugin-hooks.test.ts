/**
 * The host-to-plugin hook contracts.
 *
 * The 15 hooks used to be invoked straight from the controllers, with the fn name and
 * the timeout spelled out at each call site. Nothing checked that a `hook:*` grant on
 * the consent screen had a consumer behind it, that the fn name matched what the SDK
 * documents, or that two call sites for the same hook agreed on the budget.
 *
 * These tests pin all three, plus the argument shape each hook is handed.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';
import { PluginsRuntimeModule } from '../../../src/nest/plugins/plugins-runtime.module';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { HOOK_PERMISSION } from '../../../src/nest/plugins/protocol/envelope';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

type Invocation = [string, string, string, unknown[], number | undefined, number];

function hooks() {
  const invokeHook = vi.fn(async () => ({ ok: true }));
  const providersOf = vi.fn(() => ['p1', 'p2']);
  const runtime = { invokeHook, providersOf } as unknown as PluginRuntimeService;
  return { hooks: new PluginHooks(runtime), invokeHook, providersOf };
}

/** The (hook, fn, timeout) triple every call site used to carry on its own. */
const CONTRACTS: Array<[hook: string, fn: string, timeoutMs: number]> = [
  ['photoProvider', 'search', 5000],
  ['photoProvider', 'getById', 5000],
  ['calendarSource', 'getName', 3000],
  ['calendarSource', 'getEvents', 5000],
  ['placeDetailProvider', 'getDetails', 5000],
  ['warningProvider', 'getWarnings', 5000],
  ['tableContributor', 'getContributions', 5000],
  ['mapMarkerProvider', 'getMarkers', 5000],
  ['mapLayerProvider', 'getLayers', 5000],
  ['routeProvider', 'getRoute', 20_000],
  ['dayScheduleProvider', 'getSchedule', 5000],
  ['dayTintProvider', 'getDayTints', 5000],
  ['pdfSectionProvider', 'getSections', 5000],
  ['atlasLayerProvider', 'getLayers', 5000],
  ['journalEntryProvider', 'getRows', 5000],
  ['tripCardProvider', 'getCards', 5000],
  ['notificationChannel', 'send', 8000],
  ['notificationChannel', 'test', 8000],
  ['mcpToolProvider', 'callTool', 15_000],
];

describe('PluginHooks contracts', () => {
  const registry = createTestPluginRegistry([new PluginHooks({} as never)]);

  it('PLUGHOOK-001 every hook the consent screen offers has a host-side consumer', () => {
    // A plain string set on purpose: the keys probed against it come from
    // HOOK_PERMISSION, and whether each one is a hook the host consumes is the
    // very thing under test, not something to assert into the element type.
    const covered = new Set<string>([...registry.hookContracts().values()].map((c) => c.hook));
    expect([...Object.keys(HOOK_PERMISSION)].filter((h) => !covered.has(h))).toEqual([]);
  });

  it('PLUGHOOK-002 the declared (hook, fn) pairs are exactly the ones the host calls', () => {
    const declared = [...registry.hookContracts().keys()].sort();
    expect(declared).toEqual(CONTRACTS.map(([hook, fn]) => `${hook}#${fn}`).sort());
  });

  it('PLUGHOOK-003 each contract carries the permission HOOK_PERMISSION assigns and its own budget', () => {
    for (const [hook, fn, timeoutMs] of CONTRACTS) {
      const contract = registry.hookContract(hook, fn);
      expect(contract.permission).toBe((HOOK_PERMISSION as Record<string, string>)[hook]);
      expect(contract.timeoutMs).toBe(timeoutMs);
      expect(contract.consumer).toMatch(/^PluginHooks\./);
    }
  });

  it('PLUGHOOK-004 a call site asking for a fn nobody declared is a throw, not a silent miss', () => {
    expect(() => registry.hookContract('photoProvider', 'searchAll')).toThrow(/no @PluginHook declaration/);
  });

  it('PLUGHOOK-005 providersOf is passed straight through to the runtime', () => {
    const { hooks: h, providersOf } = hooks();
    expect(h.providersOf('photoProvider')).toEqual(['p1', 'p2']);
    expect(providersOf).toHaveBeenCalledWith('photoProvider');
  });

  it('PLUGHOOK-006 the read hooks forward their arguments and the acting user', async () => {
    const { hooks: h, invokeHook } = hooks();
    const last = (): Invocation => invokeHook.mock.calls.at(-1) as unknown as Invocation;

    await h.searchPhotos('p', 'beach', 3, 60, 7);
    expect(last()).toEqual(['p', 'photoProvider', 'search', ['beach', { page: 3, limit: 60 }], 7, 5000]);
    await h.getPhoto('p', 'ph-1', 7);
    expect(last()).toEqual(['p', 'photoProvider', 'getById', ['ph-1'], 7, 5000]);
    await h.calendarName('p', 9);
    expect(last()).toEqual(['p', 'calendarSource', 'getName', [], 9, 3000]);
    await h.calendarEvents('p', 9, 'a', 'b');
    expect(last()).toEqual(['p', 'calendarSource', 'getEvents', [9, 'a', 'b'], 9, 5000]);
    await h.placeDetails('p', 7, 5);
    expect(last()).toEqual(['p', 'placeDetailProvider', 'getDetails', [7], 5, 5000]);
    await h.tripWarnings('p', 1, 5);
    expect(last()).toEqual(['p', 'warningProvider', 'getWarnings', [1], 5, 5000]);
    await h.tableContributions('p', 'places', 1, 5);
    expect(last()).toEqual(['p', 'tableContributor', 'getContributions', ['places', 1], 5, 5000]);
    await h.mapMarkers('p', 1, 5);
    expect(last()).toEqual(['p', 'mapMarkerProvider', 'getMarkers', [1], 5, 5000]);
    await h.mapLayers('p', 1, 5);
    expect(last()).toEqual(['p', 'mapLayerProvider', 'getLayers', [1], 5, 5000]);
    await h.daySchedule('p', 1, 5);
    expect(last()).toEqual(['p', 'dayScheduleProvider', 'getSchedule', [1], 5, 5000]);
    await h.dayTints('p', 1, 5);
    expect(last()).toEqual(['p', 'dayTintProvider', 'getDayTints', [1], 5, 5000]);
    await h.pdfSections('p', 1, 5);
    expect(last()).toEqual(['p', 'pdfSectionProvider', 'getSections', [1], 5, 5000]);
    await h.atlasLayers('p', 5);
    expect(last()).toEqual(['p', 'atlasLayerProvider', 'getLayers', [], 5, 5000]);
    await h.journalRows('p', 7, 5);
    expect(last()).toEqual(['p', 'journalEntryProvider', 'getRows', [7], 5, 5000]);
    await h.tripCards('p', [1, 2], 5);
    expect(last()).toEqual(['p', 'tripCardProvider', 'getCards', [[1, 2]], 5, 5000]);
  });

  it('PLUGHOOK-007 a route solve gets four times the budget of a plain read', async () => {
    const { hooks: h, invokeHook } = hooks();
    const request = { tripId: 1, dayId: 7, profile: 'ev', waypoints: [] };
    await h.route('p', request, 5);
    expect(invokeHook).toHaveBeenCalledWith('p', 'routeProvider', 'getRoute', [request], 5, 20_000);
  });

  it('PLUGHOOK-008 both notification-channel calls run with NO acting user', async () => {
    // A notification is host-initiated for an arbitrary recipient, so the hook is
    // handed that recipient's own decrypted config rather than the right to read
    // anything as them. A bound acting user here would be exactly that right.
    const { hooks: h, invokeHook } = hooks();
    const message = { event: 'trip_reminder', title: 't', body: 'b' };
    await h.sendNotification('p', message, { token: 'x' });
    expect(invokeHook).toHaveBeenCalledWith('p', 'notificationChannel', 'send', [message, { token: 'x' }], undefined, 8000);
    await h.testNotification('p', { token: 'x' });
    expect(invokeHook).toHaveBeenCalledWith('p', 'notificationChannel', 'test', [{ token: 'x' }], undefined, 8000);
  });

  it('PLUGHOOK-010 an MCP tool call binds the requesting user and takes the long budget', async () => {
    // The acting user is the whole reason this goes through a hook rather than a
    // bespoke invoke: it is bound host-side from the supervisor's invocation map,
    // so a tool called by user A reaches A's data whatever the model put in args.
    const { hooks: h, invokeHook } = hooks();
    const call = { name: 'echo', args: { value: 'x' } };
    await h.callMcpTool('p', call, 7);
    expect(invokeHook).toHaveBeenCalledWith('p', 'mcpToolProvider', 'callTool', [call], 7, 15_000);
  });

  it('PLUGHOOK-009 the class is listed in its module providers', () => {
    // A decorated class no module registers is invisible to discovery, which would
    // now fail boot on "no host-side consumer" rather than fail quietly. Cheapest
    // possible guard against getting there.
    expectRegisteredProvider(PluginsRuntimeModule, PluginHooks);
  });
});
