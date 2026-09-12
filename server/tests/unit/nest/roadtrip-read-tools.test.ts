import { describe, it, expect, vi } from 'vitest';
import type { McpContext } from '../../../src/nest-mcp';
import { ChargingMcp } from '../../../src/nest/roadtrip/charging.mcp';
import { RoadtripHazardsMcp } from '../../../src/nest/roadtrip/roadtrip-hazards.mcp';
import { GoogleRouteMcp } from '../../../src/nest/roadtrip/google-route.mcp';
import { DayBoundariesMcp } from '../../../src/nest/roadtrip/day-boundaries.mcp';

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
    const tool = new GoogleRouteMcp(routes as never, {} as never);
    await tool.preview({ url: 'https://www.google.com/maps/dir/A/B' });
    expect(routes.preview).toHaveBeenCalledWith('https://www.google.com/maps/dir/A/B');
    const input = { tripId: 10, dayId: 1, stops: [{ name: 'A', lat: 1, lng: 2 }] };
    expect(JSON.stringify(tool.import(input, ctx))).toContain('2');
    expect(routes.import).toHaveBeenCalledWith(10, 5, input);
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