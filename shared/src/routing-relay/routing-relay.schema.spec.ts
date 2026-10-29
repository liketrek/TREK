import {
  VALHALLA_RELAY_MAX_LOCATIONS,
  valhallaHeightRequestSchema,
  valhallaRouteRequestSchema,
  valhallaTraceRequestSchema,
} from './routing-relay.schema';
import { compactValhallaRequest, encodePolyline6, resolveValhallaProvider } from './valhalla-provider';

import { describe, expect, it } from 'vitest';

const route = {
  locations: [
    { lat: 48.2, lon: 16.37, radius: 50 },
    { lat: 47.8, lon: 13.04, radius: 50, search_filter: { exclude_ferry: true } },
  ],
  costing: 'auto',
  costing_options: { auto: { use_tolls: 0, use_ferry: 1 } },
  directions_options: { units: 'kilometers' },
};

const line = (count: number) => Array.from({ length: count }, (_, i) => ({ lat: 47 + i / 1e4, lon: 11.123456789 }));

describe('valhallaRouteRequestSchema', () => {
  it('takes the route the planner asks for, its costing options included', () => {
    expect(valhallaRouteRequestSchema.parse(route)).toEqual(route);
    expect(valhallaRouteRequestSchema.parse({ ...route, alternates: 3 }).alternates).toBe(3);
    const bike = {
      ...route,
      costing: 'bicycle',
      costing_options: { bicycle: { bicycle_type: 'Road', use_hills: 0.2 } },
    };
    expect(valhallaRouteRequestSchema.safeParse(bike).success).toBe(true);
  });

  it('refuses one location, more than the relay allows, a costing TREK never asks and a point off the globe', () => {
    expect(valhallaRouteRequestSchema.safeParse({ ...route, locations: route.locations.slice(0, 1) }).success).toBe(
      false,
    );
    const many = Array.from({ length: VALHALLA_RELAY_MAX_LOCATIONS + 1 }, () => route.locations[0]);
    expect(valhallaRouteRequestSchema.safeParse({ ...route, locations: many }).success).toBe(false);
    expect(valhallaRouteRequestSchema.safeParse({ ...route, costing: 'truck' }).success).toBe(false);
    const off = [{ lat: 91, lon: 0 }, route.locations[1]];
    expect(valhallaRouteRequestSchema.safeParse({ ...route, locations: off }).success).toBe(false);
  });

  it('drops what it does not know instead of passing it on', () => {
    const parsed = valhallaRouteRequestSchema.parse({ ...route, id: 'x', date_time: { type: 0 } });
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('date_time');
  });

  it('refuses a body past 64 KB', () => {
    const options = Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`option_${i}`, 'x'.repeat(40)]));
    expect(valhallaRouteRequestSchema.safeParse({ ...route, costing_options: { auto: options } }).success).toBe(false);
  });
});

describe('valhallaTraceRequestSchema', () => {
  const trace = {
    costing: 'pedestrian',
    costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
    shape_match: 'map_snap',
    filters: { attributes: ['edge.way_id', 'edge.length'], action: 'include' },
  };

  it('takes a line point by point or encoded, but not both and not neither', () => {
    expect(valhallaTraceRequestSchema.safeParse({ ...trace, shape: line(2) }).success).toBe(true);
    expect(valhallaTraceRequestSchema.safeParse({ ...trace, encoded_polyline: 'abc' }).success).toBe(true);
    expect(valhallaTraceRequestSchema.safeParse({ ...trace, shape: line(2), encoded_polyline: 'abc' }).success).toBe(
      false,
    );
    expect(valhallaTraceRequestSchema.safeParse(trace).success).toBe(false);
  });

  it('carries a line of four thousand points once it is encoded', () => {
    const shape = line(4000);
    expect(valhallaTraceRequestSchema.safeParse({ ...trace, shape }).success).toBe(false);
    const compact = compactValhallaRequest('trace_attributes', { ...trace, shape });
    expect(compact).not.toHaveProperty('shape');
    expect(valhallaTraceRequestSchema.safeParse(compact).success).toBe(true);
  });
});

describe('valhallaHeightRequestSchema', () => {
  it('takes a piece of a line and refuses an empty one', () => {
    expect(valhallaHeightRequestSchema.safeParse({ shape: line(500), range: true }).success).toBe(true);
    expect(valhallaHeightRequestSchema.safeParse({ shape: [] }).success).toBe(false);
  });
});

describe('compactValhallaRequest', () => {
  it('leaves a route and a height question as they are', () => {
    expect(compactValhallaRequest('route', route)).toBe(route);
    const heights = { shape: line(3), range: true };
    expect(compactValhallaRequest('height', heights)).toBe(heights);
  });
});

describe('encodePolyline6', () => {
  it('writes the reference polyline, read at precision 6', () => {
    const points = [
      { lat: 3.85, lon: -12.02 },
      { lat: 4.07, lon: -12.095 },
      { lat: 4.3252, lon: -12.6453 },
    ];
    expect(encodePolyline6(points)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(encodePolyline6([])).toBe('');
  });
});

describe('resolveValhallaProvider', () => {
  const unset = { provider: undefined, valhallaUrl: '', routingUrl: '', trekAvailable: true };

  it('asks the TREK services by default, and FOSSGIS where they cannot be asked', () => {
    expect(resolveValhallaProvider(unset)).toBe('trek');
    expect(resolveValhallaProvider({ ...unset, trekAvailable: false })).toBe('fossgis');
  });

  it('reads an own Valhalla without a choice as custom, and an own OSRM alone as no Valhalla', () => {
    expect(resolveValhallaProvider({ ...unset, valhallaUrl: 'https://v.example.org' })).toBe('custom');
    expect(resolveValhallaProvider({ ...unset, routingUrl: 'https://osrm.example.org' })).toBeNull();
    expect(
      resolveValhallaProvider({
        ...unset,
        routingUrl: 'https://osrm.example.org',
        valhallaUrl: 'https://v.example.org',
      }),
    ).toBe('custom');
  });

  it('keeps the admin choice, falling back to FOSSGIS from an unavailable TREK and to the defaults from custom without a URL', () => {
    expect(resolveValhallaProvider({ ...unset, provider: 'fossgis', valhallaUrl: 'https://v.example.org' })).toBe(
      'fossgis',
    );
    expect(resolveValhallaProvider({ ...unset, provider: 'trek', routingUrl: 'https://osrm.example.org' })).toBe(
      'trek',
    );
    expect(resolveValhallaProvider({ ...unset, provider: 'trek', trekAvailable: false })).toBe('fossgis');
    expect(resolveValhallaProvider({ ...unset, provider: 'custom' })).toBe('trek');
    expect(
      resolveValhallaProvider({ ...unset, provider: 'custom', routingUrl: 'https://osrm.example.org' }),
    ).toBeNull();
    expect(resolveValhallaProvider({ ...unset, provider: 'nonsense', valhallaUrl: ' ' })).toBe('trek');
  });
});
