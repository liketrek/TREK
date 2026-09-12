import { z } from 'zod';
import type { ChargingInfo } from '@trek/shared';

const evse = z.object({
  uid: z.string(), evse_id: z.string().optional(), status: z.string(), last_updated: z.string(),
  status_last_updated: z.string().optional(),
  connectors: z.array(z.object({ tariff_ids: z.array(z.string()).optional() })).default([]),
});
export const chargingLocation = z.object({
  id: z.string(), source: z.string(), name: z.string().nullish(), address: z.string(),
  city: z.string(), last_updated: z.string(),
  coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
  operator: z.object({ name: z.string() }).optional(),
  charging_pool: z.array(z.object({ evses: z.array(evse).default([]) })).default([]),
});
export const chargingSource = z.object({
  uid: z.string(), name: z.string(), public_url: z.string().nullable(),
  attribution_license: z.string().nullable(), attribution_contributor: z.string().nullable(),
  realtime_data_updated_at: z.string().nullable(), realtime_status: z.string(),
});
export const chargingTariff = z.object({
  id: z.string(), original_id: z.string().optional(), source: z.string(), currency: z.string().regex(/^[A-Z]{3}$/), last_updated: z.string(),
  start_date_time: z.string().nullish(), end_date_time: z.string().nullish(),
  elements: z.array(z.object({
    restrictions: z.record(z.string(), z.unknown()).nullish(),
    price_components: z.array(z.object({
      type: z.string(), price: z.number().nonnegative(),
      taxes: z.array(z.object({ percentage: z.coerce.number().nonnegative() })).optional(),
    })),
  })),
});
export type ChargingLocation = z.infer<typeof chargingLocation>;
export type ChargingSource = z.infer<typeof chargingSource>;
export type ChargingTariff = z.infer<typeof chargingTariff>;

export function distanceMeters(lat: number, lng: number, location: ChargingLocation) {
  const rad = Math.PI / 180;
  const dLat = (location.coordinates.latitude - lat) * rad;
  const dLng = (location.coordinates.longitude - lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(location.coordinates.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
const words = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 2 && !['charging', 'station', 'ladestation', 'charger'].includes(word));

export function matchChargingLocation(locations: ChargingLocation[], lat: number, lng: number, name: string) {
  const candidates = locations.map(location => ({ location, distance: distanceMeters(lat, lng, location),
    named: words(name).some(word => words(`${location.name ?? ''} ${location.operator?.name ?? ''}`).includes(word)),
  })).filter(hit => hit.distance <= 100).sort((a, b) => Number(b.named) - Number(a.named) || a.distance - b.distance);
  if (!candidates.length) return null;
  const best = candidates[0];
  if (!best.named && best.distance > 30) return 'ambiguous';
  const competing = candidates.find(hit => hit !== best && hit.named === best.named &&
    hit.location.operator?.name !== best.location.operator?.name && hit.distance < best.distance + 25);
  return competing ? 'ambiguous' : best.location;
}

export function normalizeCharging(location: ChargingLocation, source: ChargingSource, tariffs: ChargingTariff[], now = Date.now()): ChargingInfo {
  const evses = [...new Map(location.charging_pool.flatMap(pool => pool.evses).map(point => [point.evse_id || point.uid, point])).values()];
  const timestamps = [source.realtime_data_updated_at, ...evses.map(point => point.status_last_updated)].filter((value): value is string => !!value && Number.isFinite(Date.parse(value)));
  const updatedAt = timestamps.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const stale = !updatedAt || now - Date.parse(updatedAt) > 20 * 60 * 1000 || Date.parse(updatedAt) > now + 60000 || source.realtime_status !== 'ACTIVE';
  const known = evses.filter(point => ['AVAILABLE', 'CHARGING', 'RESERVED', 'BLOCKED', 'INOPERATIVE', 'OUTOFORDER'].includes(point.status));
  const ids = new Set(evses.flatMap(point => point.connectors.flatMap(connector => connector.tariff_ids ?? [])));
  const matching = tariffs.filter(tariff => tariff.source === location.source && (ids.has(tariff.id) || ids.has(tariff.original_id ?? '')) &&
    (!tariff.start_date_time || Date.parse(tariff.start_date_time) <= now) && (!tariff.end_date_time || Date.parse(tariff.end_date_time) > now));
  return {
    checkedAt: new Date(now).toISOString(), status: 'ok', station: location.name || `${location.operator?.name ?? ''} ${location.address}, ${location.city}`.trim(),
    source: source.attribution_contributor || source.name, sourceUrl: source.public_url, license: source.attribution_license || 'Datenlizenz Deutschland Namensnennung 2.0 (MobiData BW)',
    updatedAt, stale, available: stale || !known.length ? null : known.filter(point => point.status === 'AVAILABLE').length,
    total: evses.length, unknown: evses.length - known.length, pricesUnavailable: false,
    tariffs: matching.map(tariff => ({ currency: tariff.currency, updatedAt: tariff.last_updated,
      components: tariff.elements.flatMap(element => element.price_components.map(component => ({
        kind: component.type, price: component.price * (1 + (component.taxes?.reduce((sum, tax) => sum + tax.percentage, 0) ?? 0) / 100),
        taxIncluded: component.taxes !== undefined,
        conditional: !!element.restrictions && Object.keys(element.restrictions).length > 0,
        afterSeconds: typeof element.restrictions?.min_duration === 'number' ? element.restrictions.min_duration : null,
      }))),
    })),
  };
}
