import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { McpContext } from '../../../src/nest-mcp';
import { ChargingMcp } from '../../../src/nest/roadtrip/charging.mcp';
import { RoadtripHazardsMcp } from '../../../src/nest/roadtrip/roadtrip-hazards.mcp';
import { GoogleRouteMcp } from '../../../src/nest/roadtrip/google-route.mcp';
import { DayBoundariesMcp } from '../../../src/nest/roadtrip/day-boundaries.mcp';
import { createTestRegistry } from '../../../src/nest-mcp';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../../src/mcp/nest-mcp-policy';

const ctx = { userId: 5 } as McpContext;
describe('roadtrip read tools', () => {
  it('checks trip access before querying charging and hazards', async () => {
    const db = { canAccessTrip: vi.fn(() => false) };
    const source = { read: vi.fn(async () => ({ sources: ['public'] })) };
    const charging = new ChargingMcp(source as never, db as never, {} as never);
    const hazards = new RoadtripHazardsMcp(source as never, db as never, {} as never);
    expect((await charging.read({ tripId: 10, placeId: 2 }, ctx)).isError).toBe(true);
    expect((await hazards.read({ tripId: 10 }, ctx)).isError).toBe(true);
    expect(source.read).not.toHaveBeenCalled();
    db.canAccessTrip.mockReturnValue(true);
    expect(JSON.stringify(await charging.read({ tripId: 10, placeId: 2 }, ctx))).toContain('public');
    expect(source.read).toHaveBeenCalledWith(10, 2);
    expect(JSON.stringify(await hazards.read({ tripId: 10 }, ctx))).toContain('public');
  });
  it('passes reviewed Google stops and the authenticated user to the importer', async () => {
    const routes = { preview: vi.fn(async () => ({ stops: [] })), import: vi.fn(() => ({ imported: 2 })) };
    const auth = { isDemoUser: vi.fn(() => false) };
    const tool = new GoogleRouteMcp(routes as never, auth as never, {} as never);
    await tool.preview({ url: 'https://www.google.com/maps/dir/A/B' });
    expect(routes.preview).toHaveBeenCalledWith('https://www.google.com/maps/dir/A/B');
    const input = { tripId: 10, dayId: 1, stops: [{ name: 'A', lat: 1, lng: 2 }] };
    expect(JSON.stringify(tool.import(input, ctx))).toContain('2');
    expect(routes.import).toHaveBeenCalledWith(10, 5, input);
  });

  it('refuses the Google import for the demo account, like every other write tool', () => {
    // The one non-admin write tool that had no gate: a demo session could write
    // thirty places and their assignments onto the shared demo trip.
    const routes = { preview: vi.fn(), import: vi.fn() };
    const auth = { isDemoUser: vi.fn(() => true) };
    const tool = new GoogleRouteMcp(routes as never, auth as never, {} as never);

    const res = tool.import({ tripId: 10, dayId: 1, stops: [{ name: 'A', lat: 1, lng: 2 }] } as never, ctx);

    expect(res.isError).toBe(true);
    expect(routes.import).not.toHaveBeenCalled();
  });
  it('answers a refusal from the service with its reason, not with the exception class name', async () => {
    // The services refuse with `{ error }` bodies the REST filter sends verbatim. Let
    // through as exceptions, the SDK would show the assistant "Http Exception" and
    // nothing else, so every tool on this surface answers them as error results.
    const refuse = (error: string, status: number) => () => { throw new HttpException({ error }, status); };
    const text = (res: { content: { text: string }[]; isError?: boolean }) => [res.isError, res.content[0].text];

    const db = { canAccessTrip: vi.fn(() => true) };
    const charging = new ChargingMcp({ read: refuse('Place not found', 404) } as never, db as never, {} as never);
    expect(text(await charging.read({ tripId: 10, placeId: 2 }, ctx))).toEqual([true, 'Place not found']);

    const auth = { isDemoUser: vi.fn(() => false) };
    const routes = { preview: refuse('Use a Google Maps directions link.', 400), import: refuse('Permission denied', 403) };
    const google = new GoogleRouteMcp(routes as never, auth as never, {} as never);
    expect(text(await google.preview({ url: 'https://www.google.com/maps/place/A' }))).toEqual([true, 'Use a Google Maps directions link.']);
    expect(text(google.import({ tripId: 10, dayId: 1, stops: [{ name: 'A', lat: 1, lng: 2 }] } as never, ctx))).toEqual([true, 'Permission denied']);

    const realtime = { broadcast: vi.fn() };
    const guards = { hasTripPermission: vi.fn(() => true) };
    const boundaries = new DayBoundariesMcp({ save: refuse('Stop not found', 404) } as never, db as never, auth as never, guards as never, realtime as never, {} as never);
    const boundary = { day_number: 1, from_assignment_id: 11, to_assignment_id: 12, fraction: 0.4 };
    expect(text(await boundaries.save({ tripId: 10, dayNumber: 1, boundary }, ctx))).toEqual([true, 'Stop not found']);
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });

  it('tells the assistant that a boundary over a booked night is ignored while the stay switch is on', () => {
    const tool = new DayBoundariesMcp({} as never, {} as never, {} as never, {} as never, {} as never, { isAddonEnabled: () => true } as never);
    const registry = createTestRegistry([tool], { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess });
    const descriptions: Record<string, string> = {};
    registry.attach(
      { registerTool: (name: string, config: Record<string, unknown>) => { descriptions[name] = String(config.description); } } as never,
      { ...ctx, scopes: null },
    );
    expect(descriptions.set_day_boundary).toContain(
      'With roadtrip_hotel_bookends on, a boundary between two stops a booked night separates is ignored: the night ends the day.',
    );
  });
  it('does not expose manual boundaries to nonmembers', async () => {
    const boundaries = { list: vi.fn(() => [{ day_number: 1 }]) };
    const db = { canAccessTrip: vi.fn(() => false) };
    const tool = new DayBoundariesMcp(boundaries as never, db as never, {} as never, {} as never, {} as never, {} as never);
    expect((await tool.list({ tripId: 10 }, ctx)).isError).toBe(true);
    expect(boundaries.list).not.toHaveBeenCalled();
    db.canAccessTrip.mockReturnValue(true);
    expect(JSON.stringify(await tool.list({ tripId: 10 }, ctx))).toContain('day_number');
    expect(boundaries.list).toHaveBeenCalledWith(10);
  });
});