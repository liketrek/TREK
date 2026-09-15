import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chargingLookupSchema } from '@trek/shared';
import { ChargingService, empty } from '../../../src/nest/roadtrip/charging.service';
import { ChargingLookupController, ChargingLookupDto } from '../../../src/nest/roadtrip/charging-lookup.controller';
import { ChargingMcp } from '../../../src/nest/roadtrip/charging.mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { matchChargingLocation, normalizeCharging, type ChargingLocation, type ChargingSource, type ChargingTariff } from '../../../src/nest/roadtrip/charging.helpers';

const now = Date.parse('2026-09-12T12:00:00Z');
const source: ChargingSource = { uid: 'test', name: 'Test operator', public_url: 'https://example.com', attribution_license: 'CC-0', attribution_contributor: null, realtime_data_updated_at: new Date(now).toISOString(), realtime_status: 'ACTIVE' };
const station: ChargingLocation = { id: '1', source: 'test', name: 'Test charging', operator: { name: 'Test' }, address: 'Main street', city: 'City', last_updated: new Date(now).toISOString(), coordinates: { latitude: 48, longitude: 11 }, charging_pool: [{ evses: [
  { uid: '1', evse_id: 'DE*TEST*1', status: 'AVAILABLE', last_updated: new Date(now - 86400000).toISOString(), connectors: [{ tariff_ids: ['original'] }] },
  { uid: '2', status: 'CHARGING', last_updated: new Date(now).toISOString(), connectors: [] },
  { uid: '3', status: 'STATIC', last_updated: new Date(now).toISOString(), connectors: [] },
] }] };
const tariff: ChargingTariff = { id: '2', original_id: 'original', source: 'test', currency: 'EUR', last_updated: new Date(now).toISOString(), elements: [
  { price_components: [{ type: 'ENERGY', price: 0.5, taxes: [{ percentage: 19 }] }] },
  { restrictions: { min_duration: 1800 }, price_components: [{ type: 'TIME', price: 12, taxes: [] }] },
] };

afterEach(() => vi.unstubAllGlobals());
describe('Open charging data', () => {
  it('keeps unchanged availability live when the source has refreshed, and does not count unknown as free', () => {
    const info = normalizeCharging(station, source, [], now);
    expect(info).toMatchObject({ available: 1, total: 3, unknown: 1, stale: false });
  });
  it('never shows old, future or failed source status as current availability', () => {
    for (const date of [new Date(now - 3600000).toISOString(), new Date(now + 3600000).toISOString(), null]) {
      expect(normalizeCharging(station, { ...source, realtime_data_updated_at: date }, [], now).available).toBeNull();
    }
    expect(normalizeCharging(station, { ...source, realtime_status: 'FAILED' }, [], now).stale).toBe(true);
  });
  it('matches tariff identifiers only within their source and retains taxes and conditions', () => {
    const info = normalizeCharging(station, source, [tariff, { ...tariff, source: 'other' }], now);
    expect(info.tariffs).toHaveLength(1);
    expect(info.tariffs[0].components[0]).toMatchObject({ price: 0.595, taxIncluded: true, conditional: false });
    expect(info.tariffs[0].components[1]).toMatchObject({ afterSeconds: 1800, conditional: true });
  });
  it('rejects distant or ambiguous stations instead of attaching another operator’s data', () => {
    expect(matchChargingLocation([station], 0, 0, 'Test')).toBeNull();
    expect(matchChargingLocation([station, { ...station, id: 'other', operator: { name: 'Other' } }], 48, 11, 'Charging')).toBe('ambiguous');
    expect(matchChargingLocation([station], 48, 11, 'Test')).toEqual(station);
  });
  it('checks trip/place scope and ignores non-charging places', async () => {
    const get = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce({ name: 'Hotel', lat: 48, lng: 11, stop_type: 'hotel' });
    const service = new ChargingService({ get } as never);
    await expect(service.read(1, 2)).rejects.toThrow();
    expect((await service.read(1, 2)).status).toBe('unknown');
    expect(get).toHaveBeenCalledWith(expect.stringContaining('trip_id = ?'), 2, 1);
  });
  it('coalesces station requests and preserves availability if tariffs fail', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes('/sources')) return new Response(JSON.stringify({ items: [source] }));
      if (url.includes('/locations')) return new Response(JSON.stringify({ items: [station], total_count: 1 }));
      return new Response('', { status: 503 });
    });
    vi.stubGlobal('fetch', fetcher);
    const service = new ChargingService({ get: () => ({ name: 'Test', lat: 48, lng: 11, stop_type: 'charging' }) } as never);
    const [first, second] = await Promise.all([service.read(1, 2), service.read(1, 2)]);
    expect(first).toEqual(second);
    expect(first.status).toBe('ok');
    expect(first.pricesUnavailable).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});

/**
 * The same data for a station nobody has added yet (#1797 feedback: "it would be useful
 * to see this data also before the add"). One service, one cache, one answer: the only
 * difference is how the station is named.
 */
describe('Open charging data before the stop exists', () => {
  /**
   * The clock, pinned to the instant the fixtures above are written at.
   *
   * `normalizeCharging` takes the current time as an argument and the tests further up
   * pass it; the service does not, so it reads the real one, and its freshness window is
   * twenty minutes. Left alone, every answer that goes through the service is stale by
   * construction and `available` comes back null, which is the field this is here to
   * prove survives the trip from the registry to the dialog.
   *
   * Only `Date.now` is pinned, never the timers: the outbound requests carry an
   * `AbortSignal.timeout` that has to keep running.
   */
  beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(now); });
  afterEach(() => { vi.restoreAllMocks(); });

  const answers = (tariffs: unknown) => vi.fn(async (url: string) => {
    if (url.includes('/sources')) return new Response(JSON.stringify({ items: [source] }));
    if (url.includes('/locations')) return new Response(JSON.stringify({ items: [station], total_count: 1 }));
    return new Response(JSON.stringify(tariffs));
  });

  it('answers for a coordinate and lets the saved stop reuse that answer', async () => {
    const fetcher = answers({ items: [tariff], total_count: 1 });
    vi.stubGlobal('fetch', fetcher);
    const service = new ChargingService({ get: () => ({ name: 'Test', lat: 48, lng: 11, stop_type: 'charging' }) } as never);

    const ahead = await service.lookup(48, 11, 'Test');
    expect(ahead.status).toBe('ok');
    // The count of individual charge points, which is what "how many chargers" means.
    expect(ahead).toMatchObject({ total: 3, available: 1, unknown: 1 });
    expect(ahead.tariffs[0].components[0]).toMatchObject({ kind: 'ENERGY', taxIncluded: true });
    // Added to the trip, the same coordinate and name key the same cache entry, so the
    // stop on the rail does not pay for the answer the dialog already got.
    expect(await service.read(1, 2)).toEqual(ahead);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('never reports a station it could not identify as free', async () => {
    // Two operators within the radius is the dense case a station found along a route
    // routinely is. Returning the nearest one would attach another operator's prices.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/sources')) return new Response(JSON.stringify({ items: [source] }));
      return new Response(JSON.stringify({ items: [station, { ...station, id: 'other', operator: { name: 'Other' } }], total_count: 2 }));
    }));
    const info = await new ChargingService({ get: () => null } as never).lookup(48, 11, 'Charging');
    expect(info.status).toBe('ambiguous');
    expect(info.available).toBeNull();
  });

  it('turns an unreachable source into an empty answer, not a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const info = await new ChargingService({ get: () => null } as never).lookup(48, 11, 'Test');
    expect(info).toEqual({ ...empty('unavailable'), checkedAt: info.checkedAt });
  });

  it('does not go to the database for a station that is not in it', async () => {
    vi.stubGlobal('fetch', answers({ items: [], total_count: 0 }));
    const get = vi.fn();
    await new ChargingService({ get } as never).lookup(48, 11, 'Test');
    expect(get).not.toHaveBeenCalled();
  });

  it('serves the route and the MCP tool from one contract and one access check', async () => {
    const charging = { read: vi.fn(), lookup: vi.fn(async () => empty('unknown')) };
    const db = { canAccessTrip: vi.fn(() => false) };
    const tool = new ChargingMcp(charging as never, db as never, {} as never);
    const input = { lat: 48.1, lng: 11.5, name: 'Ladepark Nord' };

    // A trip the caller cannot reach is refused before anything is fetched, exactly as
    // TripAccessGuard refuses it on the route.
    expect((await tool.lookup({ tripId: 3, ...input }, { userId: 5 } as never)).isError).toBe(true);
    expect(charging.lookup).not.toHaveBeenCalled();
    db.canAccessTrip.mockReturnValue(true);
    await tool.lookup({ tripId: 3, ...input }, { userId: 5 } as never);
    await new ChargingLookupController(charging as never).lookup(input as unknown as ChargingLookupDto);

    expect(charging.lookup.mock.calls).toEqual([[48.1, 11.5, 'Ladepark Nord'], [48.1, 11.5, 'Ladepark Nord']]);
    // Both surfaces validate through the shared contract rather than a restatement of
    // it, so a bound or a length limit cannot be tightened on one side only.
    for (const bad of [{ ...input, lat: 91 }, { ...input, lng: -181 }, { ...input, name: 'x'.repeat(201) }]) {
      expect(ChargingLookupDto.schema.safeParse(bad).success).toBe(false);
      expect(chargingLookupSchema.safeParse(bad).success).toBe(false);
    }
    expect(ChargingLookupDto.schema.safeParse(input).success).toBe(true);
    const declared = getEntry(ChargingMcp as unknown as ClassRef, 'lookup')?.options as { inputSchema: Record<string, unknown> };
    expect(Object.keys(declared.inputSchema).sort()).toEqual(['lat', 'lng', 'name', 'tripId']);
    for (const [field, type] of Object.entries(chargingLookupSchema.shape)) {
      expect(declared.inputSchema[field]).toBe(type);
    }
  });
});
