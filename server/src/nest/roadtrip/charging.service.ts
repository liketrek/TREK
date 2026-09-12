import { HttpException, Injectable } from '@nestjs/common';
import type { ChargingInfo } from '@trek/shared';
import { z } from 'zod';
import { DatabaseService } from '../database/database.service';
import { readCappedJson } from '../../utils/cappedFetch';
import { chargingLocation, chargingSource, chargingTariff, matchChargingLocation, normalizeCharging, type ChargingSource, type ChargingTariff } from './charging.helpers';

const empty = (status: ChargingInfo['status']): ChargingInfo => ({ checkedAt: new Date().toISOString(), status, station: null, source: null, sourceUrl: null, license: null, updatedAt: null, stale: false, available: null, total: 0, unknown: 0, tariffs: [], pricesUnavailable: false });
async function request(path: string) {
  const fetched = await fetch(`https://api.mobidata-bw.de/ocpdb${path}`, { headers: { 'User-Agent': 'TREK Roadtrip (https://github.com/liketrek/TREK)' }, signal: AbortSignal.timeout(12000), redirect: 'error' });
  if (!fetched.ok) { await fetched.body?.cancel(); throw new Error('Charging source unavailable'); }
  return await readCappedJson<unknown>(fetched, 8_000_000);
}

@Injectable()
export class ChargingService {
  private cached = new Map<string, { expires: number; value: Promise<ChargingInfo> }>();
  private sources?: { expires: number; value: Promise<ChargingSource[]> };
  private tariffs = new Map<string, { expires: number; value: Promise<ChargingTariff[]> }>();
  constructor(private readonly db: DatabaseService) {}
  async read(tripId: number, placeId: number) {
    const place = this.db.get<{ name: string; lat: number | null; lng: number | null; stop_type: string }>('SELECT name, lat, lng, stop_type FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
    if (!place) throw new HttpException({ error: 'Place not found' }, 404);
    if (place.stop_type !== 'charging' || place.lat == null || place.lng == null) return empty('unknown');
    const key = `${place.lat},${place.lng}:${place.name}`;
    const cached = this.cached.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    if (this.cached.size >= 300) this.cached.delete(this.cached.keys().next().value!);
    const value = this.load(place.lat, place.lng, place.name).catch(() => empty('unavailable'));
    this.cached.set(key, { expires: Date.now() + 60000, value });
    return value;
  }
  private async load(lat: number, lng: number, name: string): Promise<ChargingInfo> {
    if (!this.sources || this.sources.expires < Date.now()) this.sources = { expires: Date.now() + 60000, value: request('/api/public/v1/sources').then(raw => z.object({ items: z.array(chargingSource) }).parse(raw).items) };
    const [sources, nearby] = await Promise.all([this.sources.value, request(`/api/ocpi/3.0/locations?lat=${lat}&lon=${lng}&radius=100&limit=100&exclude_source_uid=bnetza_api`)]);
    const page = z.object({ items: z.array(z.unknown()), total_count: z.number() }).parse(nearby);
    if (page.total_count > 100) return empty('ambiguous');
    const locations = page.items.flatMap(item => { const parsed = chargingLocation.safeParse(item); return parsed.success ? [parsed.data] : []; });
    const location = matchChargingLocation(locations, lat, lng, name);
    if (!location) return empty('unknown');
    if (location === 'ambiguous') return empty('ambiguous');
    const source = sources.find(source => source.uid === location.source);
    if (!source) return empty('unknown');
    let pricesUnavailable = false;
    const tariffs = await this.loadTariffs(source.uid).catch(() => { pricesUnavailable = true; return []; });
    return { ...normalizeCharging(location, source, tariffs), pricesUnavailable };
  }
  private loadTariffs(source: string): Promise<ChargingTariff[]> {
    const cached = this.tariffs.get(source);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = this.fetchTariffs(source);
    this.tariffs.set(source, { expires: Date.now() + 300000, value });
    return value;
  }
  private async fetchTariffs(source: string) {
    const tariffs: ChargingTariff[] = [];
    for (let offset = 0; offset < 5000; offset += 1000) {
      const page = z.object({ items: z.array(z.unknown()), total_count: z.number() }).parse(await request(`/api/ocpi/3.0/tariffs?source_uid=${encodeURIComponent(source)}&limit=1000&offset=${offset}`));
      for (const item of page.items) { const parsed = chargingTariff.safeParse(item); if (parsed.success) tariffs.push(parsed.data); }
      if (offset + page.items.length >= page.total_count) return tariffs;
    }
    throw new Error('Incomplete charging tariffs');
  }
}
