import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChargingService } from '../../../src/nest/roadtrip/charging.service';
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
