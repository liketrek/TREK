import { chargingLookupSchema, cheapestEnergy, type ChargingInfo } from './charging.schema';

import { describe, expect, it } from 'vitest';

describe('Charging station lookup by coordinate', () => {
  const request = { lat: 48.137, lng: 11.575, name: 'Ladepark Nord' };
  it('accepts a bounded coordinate and a nameless station', () => {
    expect(chargingLookupSchema.safeParse(request).success).toBe(true);
    // OSM charging nodes are regularly untagged; the matcher has its own answer for
    // that case, so an empty name must reach it rather than being refused here.
    expect(chargingLookupSchema.safeParse({ ...request, name: '' }).success).toBe(true);
  });
  it('refuses coordinates off the globe and an unbounded name', () => {
    expect(chargingLookupSchema.safeParse({ ...request, lat: 91 }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, lng: -181 }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, lat: Number.NaN }).success).toBe(false);
    expect(chargingLookupSchema.safeParse({ ...request, name: 'x'.repeat(201) }).success).toBe(false);
  });
  it('has no batch form: the array a caller might send is not a station', () => {
    // The cache key upstream is one station, and a cache miss costs several requests
    // against a shared public registry. Anything list-shaped is refused outright.
    expect(chargingLookupSchema.safeParse([request]).success).toBe(false);
  });
});

describe('The cheapest energy price of a charger', () => {
  const component = (price: number, extra: Partial<ChargingInfo['tariffs'][number]['components'][number]> = {}) => ({
    kind: 'ENERGY',
    price,
    taxIncluded: true,
    conditional: false,
    afterSeconds: null,
    ...extra,
  });
  const tariff = (currency: string, components: ChargingInfo['tariffs'][number]['components']) => ({
    currency,
    updatedAt: '2026-10-01T10:00:00Z',
    components,
  });

  it('RTCARD-001: picks the cheapest unconditional energy price with tax, across tariffs of one currency', () => {
    const tariffs = [
      tariff('EUR', [component(0.69), component(0.39, { conditional: true }), component(0.29, { taxIncluded: false })]),
      tariff('EUR', [component(0.59), { ...component(9), kind: 'FLAT' }]),
    ];
    expect(cheapestEnergy(tariffs)).toEqual({ price: 0.59, currency: 'EUR' });
  });

  it('RTCARD-002: gives null for no energy price, and for energy prices in two currencies', () => {
    expect(cheapestEnergy([])).toBeNull();
    expect(cheapestEnergy([tariff('EUR', [{ ...component(2), kind: 'TIME' }])])).toBeNull();
    expect(cheapestEnergy([tariff('EUR', [component(0.5)]), tariff('CHF', [component(0.4)])])).toBeNull();
  });
});
