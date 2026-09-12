import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../../src/mcp/nest-mcp-policy';
import type { McpContext } from '../../../src/nest-mcp';
import { createTestRegistry } from '../../../src/nest-mcp';
import { PlacesMcp } from '../../../src/nest/places/places.mcp';
import { RoadtripPlanService } from '../../../src/nest/roadtrip/roadtrip-plan.service';
import { RoadtripPlanningMcp } from '../../../src/nest/roadtrip/roadtrip-planning.mcp';
import { RoadtripPreferencesMcp } from '../../../src/nest/roadtrip/roadtrip-preferences.mcp';
import { RoadtripPreferencesService } from '../../../src/nest/roadtrip/roadtrip-preferences.service';
import { RoadtripMcp } from '../../../src/nest/roadtrip/roadtrip.mcp';
import { roadtripPreferencesUpdateSchema } from '@trek/shared';

import { describe, it, expect, vi } from 'vitest';

const ctx = { userId: 5 } as McpContext;
function setup() {
  const settings: Record<string, unknown> = {
    roadtrip_day_start: '08:00',
    roadtrip_day_end: '10:00',
    roadtrip_vehicle: 'electric',
    roadtrip_range_km: 100,
    roadtrip_fill_percent: 80,
    routing_base_url: 'https://private.example',
    llm_api_key: 'secret',
  };
  const store = {
    getUserSettings: vi.fn(() => settings),
  };
  const realtime = { broadcast: vi.fn() };
  const tripSettings = new Map<number, Record<string, unknown>>([[10, { ...settings }]]);
  const preferenceDb = {
    all: (_sql: string, tripId: number) =>
      Object.entries(tripSettings.get(tripId) ?? {}).map(([key, value]) => ({ key, value: JSON.stringify(value) })),
    run: vi.fn((_sql: string, tripId: number, key: string, value: string) =>
      tripSettings.set(tripId, { ...tripSettings.get(tripId), [key]: JSON.parse(value) }),
    ),
    transaction: (fn: () => unknown) => fn(),
  };
  const preferences = new RoadtripPreferencesService(preferenceDb as never, realtime as never);
  const days = [{ id: 1, day_number: 1, title: null, date: '2026-09-11', default_transport_mode: 'driving' }];
  const visits = [1, 2, 3].map((id) => ({
    id,
    day_id: 1,
    place_id: id + 10,
    name: `Stop ${id}`,
    lat: 48,
    lng: id,
    time: id === 1 ? '07:00' : null,
    duration_minutes: 30,
    end_day: 0,
    leg_transport_mode: null,
    incoming_leg_transport_mode: null,
    stop_type: null,
    fill_percent: null,
  }));
  const db = {
    canAccessTrip: vi.fn(() => true),
    all: vi.fn((sql: string) => (sql.includes('FROM day_assignments') ? visits : days)),
  };
  const router = {
    profiles: () => ['driving'],
    route: vi.fn(async (_user: number, _trip: number, _day: number, points: { lat: number; lng: number }[]) => ({
      parts: points.slice(1).map(() => ({ distance: 120000, duration: 7200 })),
      avoidMissed: [],
      leg: {
        line: points.map((p) => [p.lat, p.lng]),
        vias: [],
        seg: {
          from: [48, 1],
          to: [48, 3],
          mid: [48, 2],
          distance: 240000,
          duration: 14400,
          mode: 'driving',
          distanceText: '',
          drivingText: '',
          walkingText: '',
        },
      },
    })),
  };
  const roadtrip = { listForTrip: vi.fn(() => []), tracksForTrip: vi.fn(() => []) };
  const boundaries = { list: vi.fn(() => []) };
  const plans = new RoadtripPlanService(
    db as never,
    store as never,
    preferences,
    router as never,
    roadtrip as never,
    boundaries as never,
  );
  return { preferenceDb, preferences, store, realtime, db, plans, router, visits, days, boundaries };
}

describe('roadtrip preferences', () => {
  it('reads only public driving preferences and never endpoint URLs or credentials', () => {
    const s = setup();
    expect(s.preferences.read(10)).toMatchObject({ roadtrip_range_km: 100 });
    expect(JSON.stringify(s.preferences.read(10))).not.toMatch(/secret|private.example|routing_base_url/);
  });
  it('validates the complete window before an atomic write and broadcasts to every member of its trip', () => {
    const s = setup();
    expect(() => s.preferences.update(10, { roadtrip_day_end: '06:00', roadtrip_range_km: 200 })).toThrow();
    expect(s.preferenceDb.run).not.toHaveBeenCalled();
    s.preferences.update(10, { roadtrip_day_start: '06:00', roadtrip_day_end: '09:00' });
    expect(s.realtime.broadcast).toHaveBeenCalledWith('10', 'roadtripPreferences:changed', {
      preferences: s.preferences.read(10),
    });
    expect(s.preferences.read(10).roadtrip_range_km).toBe(100);
  });
  it.each([
    { llm_api_key: 'x' },
    { routing_base_url: 'http://localhost' },
    { roadtrip_day_start: '25:00' },
    { roadtrip_fill_percent: 101 },
    { roadtrip_avoid: 'anything' },
    {},
  ])('refuses invalid or unrelated preference %j', (patch) => {
    expect(roadtripPreferencesUpdateSchema.safeParse(patch).success).toBe(false);
  });
  it('allows clearing daily times and limits and refuses demo writes', async () => {
    const s = setup();
    s.preferences.update(10, { roadtrip_day_start: '', roadtrip_range_km: 0 });
    expect(s.preferences.read(10).roadtrip_day_start).toBe('');
    const mcp = new RoadtripPreferencesMcp(
      s.preferences,
      { isDemoUser: () => true } as never,
      {} as never,
      s.db as never,
      {} as never,
    );
    s.preferenceDb.run.mockClear();
    await mcp.update({ tripId: 10, settings: { roadtrip_range_km: 300 } }, ctx);
    expect(s.preferenceDb.run).not.toHaveBeenCalled();
  });
});

describe('browser-independent roadtrip calculation', () => {
  it('uses the shared scheduler, preserves the manually pinned start and routes a whole day in one request', async () => {
    const s = setup();
    const before = structuredClone(s.visits);
    const plan = await s.plans.calculate(10, 5);
    expect(s.router.route).toHaveBeenCalledTimes(1);
    expect(plan.calculated.days[0].schedule.entries[0].arrival).toBe('07:00');
    expect(plan.calculated.days.length).toBeGreaterThan(1);
    expect(plan.calculated.days[0].stops.some((stop) => stop.automaticNight?.phase === 'end')).toBe(true);
    expect(plan.calculated.days[0].driveWarnings.some((w) => w.code === 'range')).toBe(true);
    expect(s.visits).toEqual(before);
  });
  it('previews settings without saving them', async () => {
    const s = setup();
    await s.plans.calculate(10, 5, { roadtrip_day_end: '20:00' });
    expect(s.preferences.read(10).roadtrip_day_end).toBe('10:00');
    expect(s.preferenceDb.run).not.toHaveBeenCalled();
  });
  it('checks trip access before reading or routing', async () => {
    const s = setup();
    s.db.canAccessTrip.mockReturnValue(false);
    await expect(s.plans.calculate(20, 5)).rejects.toThrow();
    expect(s.db.all).not.toHaveBeenCalled();
    expect(s.router.route).not.toHaveBeenCalled();
  });
  it('marks provider failures incomplete and never leaks an endpoint from its exception', async () => {
    const s = setup();
    s.router.route.mockRejectedValue(new Error('secret https://private.example'));
    const mcp = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
    const answer = await mcp.calculate({ tripId: 10, includeGeometry: false }, ctx);
    expect(JSON.stringify(answer)).toContain('incomplete');
    expect(JSON.stringify(answer)).not.toContain('private.example');
    expect(JSON.stringify(answer)).toContain('false');
  });
  it('reports coordinate-less visits instead of inventing a location', async () => {
    const s = setup();
    Object.assign(s.visits[1], { lat: null });
    const plan = await s.plans.calculate(10, 5);
    expect(plan.omittedVisits).toEqual([2]);
  });
  it('keeps explicit end-day visits and manual boundaries in the shared planning path', async () => {
    const s = setup();
    s.visits[0].end_day = 1;
    const plan = await s.plans.calculate(10, 5);
    expect(plan.calculated.days[0].stops.find((stop) => stop.assignmentId === 1)?.endDay).toBe(true);
    expect(plan.calculated.days[0].schedule.entries.some((entry) => entry.departure === '07:30')).toBe(true);
  });
});

describe('Roadtrip MCP registration and search', () => {
  it('imports GPX through the existing service and broadcasts the imported places', async () => {
    const places = { importGpx: vi.fn(() => ({ places: [{ id: 12 }], count: 1, skipped: 0 })) };
    const auth = { isDemoUser: vi.fn(() => false) };
    const guards = { hasTripPermission: () => true, safeBroadcast: vi.fn() };
    const mcp = new PlacesMcp(
      places as never,
      {} as never,
      { canAccessTrip: () => true } as never,
      auth as never,
      {} as never,
      {} as never,
      guards as never,
    );
    const input = {
      tripId: 1,
      gpx: '<gpx/>',
      name: 'Track',
      importTracks: true,
      importRoutes: false,
      importWaypoints: false,
    };
    await mcp.importGpx(input, ctx);
    expect(places.importGpx).toHaveBeenCalledWith('1', Buffer.from('<gpx/>'), {
      defaultName: 'Track',
      importTracks: true,
      importRoutes: false,
      importWaypoints: false,
    });
    expect(guards.safeBroadcast).toHaveBeenCalledWith(1, 'place:created', { place: { id: 12 } });
    places.importGpx.mockClear();
    auth.isDemoUser.mockReturnValue(true);
    await mcp.importGpx(input, ctx);
    expect(places.importGpx).not.toHaveBeenCalled();
  });
  it('hides addon tools when disabled and separates settings reads from writes', () => {
    const s = setup();
    const addons = { isAddonEnabled: vi.fn(() => true) };
    const registry = createTestRegistry(
      [
        new RoadtripPreferencesMcp(s.preferences, {} as never, addons as never, s.db as never, {} as never),
        new RoadtripPlanningMcp(s.plans, {} as never, addons as never),
      ],
      { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess },
    );
    const names: string[] = [];
    const registrar = {
      registerTool: (name: string) => {
        names.push(name);
      },
    };
    registry.attach(registrar as never, { ...ctx, scopes: ['trips:read'] });
    expect(names).toContain('get_roadtrip_settings');
    expect(names).not.toContain('update_roadtrip_settings');
    names.length = 0;
    addons.isAddonEnabled.mockReturnValue(false);
    registry.attach(registrar as never, { ...ctx, scopes: null });
    expect(names).toEqual([]);
  });
  it('returns corridor sources, truncation and matching brands without adding stops', async () => {
    const plans = {
      calculate: vi.fn(async () => ({
        failures: [],
        omittedVisits: [],
        calculated: {
          days: [
            {
              dayNumber: 1,
              geometry: [
                [48, 10],
                [48, 10.1],
              ],
            },
          ],
          dayWindowIssue: null,
        },
      })),
    };
    const maps = {
      search: vi.fn(async () => ({
        pois: [{ osm_id: 'n1', name: 'Fuel', brand: 'Example', lat: 48, lng: 10.05, category: 'fuel' }],
        sources: ['trek-places'], failedSources: [],
        truncated: true,
        clamped: false,
      })),
    };
    const mcp = new RoadtripPlanningMcp(plans as never, maps as never, {} as never);
    const answer = await mcp.corridor(
      { tripId: 1, dayNumber: 1, category: 'fuel', widthKm: 5, offset: 0, name: 'example' },
      ctx,
    );
    const body = JSON.parse(answer.content[0].text as string);
    expect(body.hits).toHaveLength(1);
    expect(body.sources).toEqual(['trek-places']);
    expect(body.truncatedAreas).toBeGreaterThan(0);
    expect(body.complete).toBe(false);
    maps.search.mockRejectedValue(new Error('private endpoint'));
    const failed = await mcp.corridor({ tripId: 1, dayNumber: 1, category: 'fuel', widthKm: 5, offset: 0 }, ctx);
    expect(JSON.stringify(failed)).toContain('failedAreas');
    expect(JSON.stringify(failed)).not.toContain('private endpoint');
  });
  it('checks visit editing permission and ownership before moving a via', async () => {
    const service = {
      dayExists: vi.fn(() => true),
      move: vi.fn(() => ({ id: 4 })),
      listForDay: () => [],
      broadcast: vi.fn(),
    };
    const guards = { hasTripPermission: vi.fn(() => false) };
    const mcp = new RoadtripMcp(
      service as never,
      { canAccessTrip: () => true } as never,
      guards as never,
      { isDemoUser: () => false } as never,
      {} as never,
    );
    const input = { tripId: 1, dayId: 2, viaId: 4, lat: 48, lng: 10 };
    await mcp.updateVia(input, ctx);
    expect(service.move).not.toHaveBeenCalled();
    guards.hasTripPermission.mockReturnValue(true);
    service.dayExists.mockReturnValue(false);
    await mcp.updateVia(input, ctx);
    expect(service.move).not.toHaveBeenCalled();
    service.dayExists.mockReturnValue(true);
    await mcp.updateVia(input, ctx);
    expect(service.move).toHaveBeenCalledWith(4, 2, 48, 10, undefined);
    expect(service.broadcast).toHaveBeenCalled();
  });
});

describe('MCP trip preferences authorization', () => {
  it('reads shared preferences and refuses inaccessible trips', async () => {
    const s = setup();
    const tool = new RoadtripPreferencesMcp(s.preferences, { isDemoUser: () => false } as never, {} as never, s.db as never, { hasTripPermission: () => true } as never);
    expect(JSON.stringify(await tool.read({ tripId: 10 }, ctx))).toContain('100');
    s.db.canAccessTrip.mockReturnValue(false);
    expect((await tool.read({ tripId: 10 }, ctx)).isError).toBe(true);
    expect((await tool.update({ tripId: 10, settings: {} }, ctx)).isError).toBe(true);
  });
  it('rejects demos and readers, but permits a trip editor', async () => {
    const s = setup();
    const auth = { isDemoUser: vi.fn(() => true) };
    const guards = { hasTripPermission: vi.fn(() => false) };
    const tool = new RoadtripPreferencesMcp(s.preferences, auth as never, {} as never, s.db as never, guards as never);
    expect((await tool.update({ tripId: 10, settings: {} }, ctx)).isError).toBe(true);
    auth.isDemoUser.mockReturnValue(false);
    expect((await tool.update({ tripId: 10, settings: {} }, ctx)).isError).toBe(true);
    guards.hasTripPermission.mockReturnValue(true);
    expect(JSON.stringify(await tool.update({ tripId: 10, settings: { roadtrip_range_km: 120 } }, ctx))).toContain('120');
  });
});
describe('corridor filtering', () => {
  const input = { tripId: 10, dayNumber: 1, category: 'charging' as const, widthKm: 5, offset: 0 };
  function tool() {
    const plan = { failures: [] as unknown[], omittedVisits: [] as number[], calculated: { dayWindowIssue: null as string | null, days: [{ dayNumber: 1, geometry: [[48, 10], [48, 10.1]] }] } };
    const maps = { search: vi.fn(async () => ({ pois: [
      { osm_id: 'a', name: 'Fast', lat: 48, lng: 10.03, category: 'charging', charging: { sockets: [{ type: 'type2', kw: 150 }] } },
      { osm_id: 'b', name: 'Slow', lat: 48, lng: 10.07, category: 'charging', charging: { sockets: [{ type: 'type2', kw: 11 }] } },
      { osm_id: 'c', name: 'Unknown', lat: 48, lng: 10.05, category: 'charging', charging: { sockets: [{ type: 'ccs', kw: null }] } },
      { osm_id: 'd', name: 'Far', lat: 50, lng: 12, category: 'charging' },
    ], sources: ['osm'], failedSources: ['plugin'], truncated: false, clamped: false })) };
    return { plan, maps, mcp: new RoadtripPlanningMcp({ calculate: async () => plan } as never, maps as never, {} as never) };
  }
  it('refuses failed routes, absent days and reversed search ranges', async () => {
    const s = tool();
    s.plan.failures.push({});
    expect((await s.mcp.corridor(input, ctx)).isError).toBe(true);
    s.plan.failures = [];
    s.plan.omittedVisits = [1];
    expect((await s.mcp.corridor(input, ctx)).isError).toBe(true);
    s.plan.omittedVisits = [];
    s.plan.calculated.dayWindowIssue = 'conflict';
    expect((await s.mcp.corridor(input, ctx)).isError).toBe(true);
    s.plan.calculated.dayWindowIssue = null;
    expect((await s.mcp.corridor({ ...input, fromKm: 8, toKm: 2 }, ctx)).isError).toBe(true);
    expect((await s.mcp.corridor({ ...input, dayNumber: 2 }, ctx)).isError).toBe(true);
    expect(s.maps.search).not.toHaveBeenCalled();
  });
  it('filters sockets, power, name and along-route bounds without hiding source failures', async () => {
    const s = tool();
    const read = async (over: Partial<Parameters<RoadtripPlanningMcp['corridor']>[0]>) => JSON.parse((await s.mcp.corridor({ ...input, ...over }, ctx)).content[0].text as string);
    expect((await read({ socket: 'type2', minKw: 100 })).hits.map((h: { poi: { name: string } }) => h.poi.name)).toEqual(['Fast']);
    expect((await read({ name: 'unknown' })).hits).toHaveLength(1);
    expect((await read({ fromKm: 100 })).hits).toHaveLength(0);
    expect((await read({ toKm: 0 })).hits).toHaveLength(0);
    expect((await read({})).failedSources).toEqual(['plugin']);
  });
});
it('reads the saved roadtrip context without routing', async () => {
  const s = setup();
  const tool = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
  expect(JSON.stringify(await tool.context({ tripId: 10 }, ctx))).toContain('Stop 1');
  expect(s.router.route).not.toHaveBeenCalled();
});