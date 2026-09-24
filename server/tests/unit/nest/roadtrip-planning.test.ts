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
  // The trip's stays, none unless a case books one.
  const stays: Record<string, unknown>[] = [];
  const db = {
    canAccessTrip: vi.fn(() => true),
    all: vi.fn((sql: string) =>
      sql.includes('FROM day_assignments') ? visits : sql.includes('FROM day_accommodations') ? stays : days,
    ),
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
  return { preferenceDb, preferences, store, realtime, db, plans, router, visits, days, boundaries, stays };
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
    // The fourth argument is the socket that saved, so the tab that made the
    // change is left out of its own echo. Undefined here: no header was sent.
    expect(s.realtime.broadcast).toHaveBeenCalledWith('10', 'roadtripPreferences:changed', {
      preferences: s.preferences.read(10),
    }, undefined);
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
  it('saves the switch that starts and ends each day at the stay, through the tool too, and reads it back', async () => {
    const s = setup();
    expect(s.preferences.read(10).roadtrip_hotel_bookends).toBeUndefined();
    const mcp = new RoadtripPreferencesMcp(
      s.preferences,
      { isDemoUser: () => false } as never,
      {} as never,
      s.db as never,
      { hasTripPermission: () => true } as never,
    );
    const res = await mcp.update({ tripId: 10, settings: { roadtrip_hotel_bookends: true } }, ctx);
    expect(JSON.parse(res.content[0].text as string).settings.roadtrip_hotel_bookends).toBe(true);
    expect(s.preferences.read(10).roadtrip_hotel_bookends).toBe(true);
    s.preferences.update(10, { roadtrip_hotel_bookends: false });
    expect(s.preferences.read(10).roadtrip_hotel_bookends).toBe(false);
    expect(roadtripPreferencesUpdateSchema.safeParse({ roadtrip_hotel_bookends: 'yes' }).success).toBe(false);
  });
  it('tells the assistant why a window was refused instead of the exception class name', async () => {
    // The service refuses an inverted window with the `{ error }` body the route
    // sends verbatim; left to the SDK the tool would answer "Http Exception".
    const s = setup();
    const mcp = new RoadtripPreferencesMcp(
      s.preferences,
      { isDemoUser: () => false } as never,
      {} as never,
      s.db as never,
      { hasTripPermission: () => true } as never,
    );
    const res = await mcp.update({ tripId: 10, settings: { roadtrip_day_end: '06:00' } }, ctx);
    expect([res.isError, res.content[0].text]).toEqual([true, 'Day end must be later than day start.']);
    expect(s.preferences.read(10).roadtrip_day_end).toBe('10:00');
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
  it('previews a day that ends at tonight’s stay without saving the switch, and leaves it off otherwise', async () => {
    const s = setup();
    s.stays.push({
      id: 7,
      place_id: 70,
      start_day_id: 1,
      end_day_id: 2,
      check_in: '15:00',
      check_out: '10:00',
      place_name: 'Tonight',
      place_lat: 48.5,
      place_lng: 4,
      reservation_id: null,
    });
    const stored = await s.plans.calculate(10, 5);
    expect(stored.calculated.days.flatMap((d) => d.stops).some((stop) => stop.bookend)).toBe(false);

    const preview = await s.plans.calculate(10, 5, { roadtrip_hotel_bookends: true });
    const hotel = preview.calculated.days.flatMap((d) => d.stops).find((stop) => stop.bookend);
    expect(hotel).toMatchObject({ name: 'Tonight', bookend: { phase: 'evening', accommodationId: 7, checkingIn: true } });
    expect(s.preferences.read(10).roadtrip_hotel_bookends).toBeUndefined();
    expect(s.preferenceDb.run).not.toHaveBeenCalled();
  });
  it('checks trip access before reading or routing', async () => {
    const s = setup();
    s.db.canAccessTrip.mockReturnValue(false);
    await expect(s.plans.calculate(20, 5)).rejects.toThrow();
    expect(s.db.all).not.toHaveBeenCalled();
    expect(s.router.route).not.toHaveBeenCalled();
  });
  it('tells the assistant why a read, a calculation or a corridor search was refused', async () => {
    // The service refuses with the `{ error }` body the route sends verbatim. Left
    // to the SDK, the tool would answer "Http Exception" and the assistant could
    // name no reason.
    const s = setup();
    const mcp = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
    const reason = (res: { content: { text: string }[]; isError?: boolean }) => [res.isError, res.content[0].text];
    s.db.canAccessTrip.mockReturnValue(false);
    expect(reason(await mcp.context({ tripId: 20 }, ctx))).toEqual([true, 'Trip not found']);
    expect(reason(await mcp.calculate({ tripId: 20, includeGeometry: false }, ctx))).toEqual([true, 'Trip not found']);
    expect(reason(await mcp.corridor({ tripId: 20, dayNumber: 1, category: 'fuel', widthKm: 5, offset: 0 } as never, ctx))).toEqual([true, 'Trip not found']);
    s.db.canAccessTrip.mockReturnValue(true);
    const window = await mcp.calculate({ tripId: 10, includeGeometry: false, settings: { roadtrip_day_start: '18:00', roadtrip_day_end: '08:00' } }, ctx);
    expect(reason(window)).toEqual([true, 'Day end must be later than day start.']);
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
  it('hands calculate_roadtrip the end time of a visit as the moment the drive leaves it', async () => {
    const s = setup();
    // Stop 1 is left at 07:30 and the road takes two hours, so stop 2 is reached half an
    // hour after the 09:00 it was meant to be left at. Stop 3 is left at noon, whatever
    // its stay says.
    Object.assign(s.visits[1], { end_time: '09:00' });
    Object.assign(s.visits[2], { end_time: '12:00' });
    const mcp = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
    const answer = await mcp.calculate(
      { tripId: 10, includeGeometry: false, settings: { roadtrip_day_start: '', roadtrip_day_end: '' } },
      ctx,
    );
    const body = JSON.parse(answer.content[0].text as string);
    const [day] = body.days;
    expect(day.stops.map((stop: { leaveAt: string | null }) => stop.leaveAt)).toEqual([undefined, '09:00', '12:00']);
    expect(day.schedule.entries.map((e: { departure: string }) => e.departure)).toEqual(['07:30', '09:30', '12:00']);
    expect(day.schedule.warnings).toEqual([{ index: 1, code: 'missedLeave', minutes: 30 }]);
  });
  it('keeps the per-leg lines the browser planner reads out of the calculate_roadtrip answer', async () => {
    // The shared assembler now carries each leg's line beside its figures, for the picker of
    // other ways in the browser. A tool answer carries geometry only when asked, and then
    // once per day: the same road a second time, split by leg, is weight and nothing else.
    const s = setup();
    const settings = { roadtrip_day_start: '', roadtrip_day_end: '' };
    const plan = await s.plans.calculate(10, 5, settings);
    expect(plan.calculated.days[0].legLines).toHaveLength(plan.calculated.days[0].legs.length);

    const mcp = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
    const answer = await mcp.calculate({ tripId: 10, includeGeometry: true, settings }, ctx);
    const [day] = JSON.parse(answer.content[0].text as string).days;
    expect(day).toHaveProperty('geometry');
    expect(day).not.toHaveProperty('legLines');
    expect(day).not.toHaveProperty('arrivingLine');
  });
  it('answers calculate_roadtrip with the rides on no day, an empty list when there are none (#2461)', async () => {
    // Additive: the rest of the answer is what it was. The rides themselves are read off the
    // real tables in roadtrip-plan.service.test.ts; this pins the field and the words for it.
    const s = setup();
    const mcp = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
    const body = JSON.parse((await mcp.calculate({ tripId: 10, includeGeometry: false }, ctx)).content[0].text as string);
    expect(body.undatedRides).toEqual([]);
    expect(body.days.length).toBeGreaterThan(0);
    // And the tool says what the field is, or an assistant has no reason to read it.
    const addons = { isAddonEnabled: vi.fn(() => true) };
    const registry = createTestRegistry([new RoadtripPlanningMcp(s.plans, {} as never, addons as never)], {
      accessPolicy: trekMcpAccessPolicy,
      validateAccess: trekMcpValidateAccess,
    });
    const described = new Map<string, string>();
    const registrar = {
      registerTool: (name: string, config: { description?: string }) => {
        described.set(name, config.description ?? '');
      },
    };
    registry.attach(registrar as never, { ...ctx, scopes: ['trips:read'] });
    expect(described.get('calculate_roadtrip')).toContain('undatedRides');
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
  it('tells the assistant the stay switch is off until it is set, on every tool the switch changes', () => {
    const s = setup();
    const registry = createTestRegistry(
      [
        new RoadtripPreferencesMcp(s.preferences, {} as never, { isAddonEnabled: () => true } as never, s.db as never, {} as never),
        new RoadtripPlanningMcp(s.plans, {} as never, { isAddonEnabled: () => true } as never),
      ],
      { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess },
    );
    const descriptions: Record<string, string> = {};
    registry.attach(
      {
        registerTool: (name: string, config: Record<string, unknown>) => {
          descriptions[name] = String(config.description);
        },
      } as never,
      { ...ctx, scopes: null },
    );
    expect(descriptions.get_roadtrip_settings).toContain('Missing roadtrip_hotel_bookends means off.');
    expect(descriptions.update_roadtrip_settings).toContain('Set roadtrip_hotel_bookends true to start and end each day at the stay');
    expect(descriptions.calculate_roadtrip).toContain('With roadtrip_hotel_bookends switched on (missing means off)');
    expect(descriptions.calculate_roadtrip).toContain('{roadtrip_hotel_bookends:true}');
    expect(descriptions.get_roadtrip_context).toContain('stays lists every booked stay');
    expect(descriptions.search_roadtrip_corridor).toContain('With roadtrip_hotel_bookends on');
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
              stops: [],
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
    const plan = { failures: [] as unknown[], omittedVisits: [] as number[], calculated: { dayWindowIssue: null as string | null, days: [{ dayNumber: 1, stops: [], geometry: [[48, 10], [48, 10.1]] }] } };
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
  it('leaves the ride between two terminals out of the search and drops a hit under the flight path (#2428)', async () => {
    // The day drives to the airport, flies two degrees north and east, and drives on
    // from the far one: the geometry jumps straight between the terminals, and the
    // browser hook already cuts that stretch out. The tool tiles the same pieces.
    const terminal = (role: 'departure' | 'arrival', lat: number, lng: number) => ({
      carrier: { reservationId: 7, type: 'flight', role, title: 'LH 2020', code: null, at: null },
      lat,
      lng,
    });
    const plan = {
      failures: [],
      omittedVisits: [],
      calculated: {
        dayWindowIssue: null,
        days: [
          {
            dayNumber: 1,
            stops: [{ lat: 48, lng: 10 }, terminal('departure', 48, 10.1), terminal('arrival', 50, 12), { lat: 50, lng: 12.1 }],
            geometry: [[48, 10], [48, 10.1], [50, 12], [50, 12.1]],
          },
        ],
      },
    };
    const underTheFlight = { lat: 49, lng: 11 };
    type Box = { south: number; north: number; west: number; east: number };
    const maps = { search: vi.fn(async (_query: { bbox: Box }) => ({ pois: [
      { osm_id: 'road', name: 'On the road', lat: 48, lng: 10.05, category: 'fuel' },
      { osm_id: 'field', name: 'Under the flight', ...underTheFlight, category: 'fuel' },
    ], sources: ['osm'], failedSources: [], truncated: false, clamped: false })) };
    const mcp = new RoadtripPlanningMcp({ calculate: async () => plan } as never, maps as never, {} as never);
    const body = JSON.parse((await mcp.corridor({ ...input, category: 'fuel' }, ctx)).content[0].text as string);
    const asked = maps.search.mock.calls.map(([query]) => query.bbox);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.some((b) => b.south <= underTheFlight.lat && b.north >= underTheFlight.lat && b.west <= underTheFlight.lng && b.east >= underTheFlight.lng)).toBe(false);
    expect(body.hits.map((h: { poi: { osm_id: string } }) => h.poi.osm_id)).toEqual(['road']);
    expect(body.totalAreas).toBe(asked.length);
    expect(body.complete).toBe(true);
  });
});
it('reads the saved roadtrip context without routing', async () => {
  const s = setup();
  const tool = new RoadtripPlanningMcp(s.plans, {} as never, {} as never);
  expect(JSON.stringify(await tool.context({ tripId: 10 }, ctx))).toContain('Stop 1');
  expect(s.router.route).not.toHaveBeenCalled();
});