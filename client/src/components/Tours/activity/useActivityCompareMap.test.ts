// FE-ACT-COMPARE-MAP-001 to FE-ACT-COMPARE-MAP-006
// ACT-02 on the plan map: while a tour is compared with its actual track, the
// track leaves the map as a tour of its own and comes back as one dotted line
// of the route, the plan stays on the map, and the legend names both; off,
// the map gets exactly what it would have had. The map also says whether it
// can compare at all, and ends a comparison where it no longer can.
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildPlace } from '../../../../tests/helpers/factories';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import { compareMapLines, useActivityCompareMap } from './useActivityCompareMap';

const plan = buildPlace({ id: 7, name: 'Ridge', route_color: 'plan-paint' });
const track = buildPlace({
  id: 20,
  name: 'Watch export',
  route_geometry: JSON.stringify([
    [47, 11, 600],
    [47.01, 11, 640],
  ]),
});
const cafe = buildPlace({ id: 3, name: 'Cafe' });
const places = [plan, track, cafe];
const dayRoute: [number, number][][] = [
  [
    [46, 10],
    [46.1, 10],
  ],
  [
    [46.1, 10],
    [46.2, 10],
  ],
];
const paint = { line: 'actual-paint', casing: 'casing-paint' };
const input = {
  enabled: true,
  places,
  mapPlaces: [plan, track, cafe],
  route: dayRoute,
  routeWalking: [true],
  selectedPlaceId: 7,
};

beforeEach(() => {
  useTourActivityCompareStore.setState({ comparison: null, mapAvailable: false });
});

describe('compareMapLines (ACT-02)', () => {
  it('FE-ACT-COMPARE-MAP-001: lays the track into the route, dotted and in its own colour, and names both lines', () => {
    const drawn = compareMapLines(input, { tourPlaceId: 7, trackPlaceId: 20 }, paint);
    expect(drawn.places.map((place) => place.id)).toEqual([7, 3]);
    expect(drawn.route).toEqual([
      ...dayRoute,
      [
        [47, 11],
        [47.01, 11],
      ],
    ]);
    // The route's own flags run short of its lines; they are read by index.
    expect(drawn.routeWalking).toEqual([true, false, true]);
    expect(drawn.routeColors).toEqual([undefined, undefined, paint]);
    expect(drawn.legend).toEqual({ planName: 'Ridge', planColor: 'plan-paint', trackName: 'Watch export' });
  });

  it('FE-ACT-COMPARE-MAP-002: a plan hidden from the map comes back, and a day without a route has the track alone', () => {
    const drawn = compareMapLines(
      { ...input, mapPlaces: [cafe], route: null, routeWalking: null },
      { tourPlaceId: 7, trackPlaceId: 20 },
      paint
    );
    expect(drawn.places.map((place) => place.id)).toEqual([3, 7]);
    expect(drawn.route).toHaveLength(1);
    expect(drawn.routeWalking).toEqual([true]);
    expect(drawn.routeColors).toEqual([paint]);
  });

  it('FE-ACT-COMPARE-MAP-003: off, beside another tour, elsewhere on the map or without a line, the map gets what it had', () => {
    const cases = [
      compareMapLines(input, null, paint),
      compareMapLines({ ...input, selectedPlaceId: 3 }, { tourPlaceId: 7, trackPlaceId: 20 }, paint),
      compareMapLines({ ...input, enabled: false }, { tourPlaceId: 7, trackPlaceId: 20 }, paint),
      compareMapLines(input, { tourPlaceId: 7, trackPlaceId: 3 }, paint),
      compareMapLines(input, { tourPlaceId: 7, trackPlaceId: 99 }, paint),
    ];
    for (const drawn of cases) {
      expect(drawn.places).toBe(input.mapPlaces);
      expect(drawn.route).toBe(dayRoute);
      expect(drawn.routeWalking).toBe(input.routeWalking);
      expect(drawn.routeColors).toBeUndefined();
      expect(drawn.legend).toBeNull();
    }
  });
});

describe('useActivityCompareMap (ACT-02)', () => {
  it('FE-ACT-COMPARE-MAP-004: follows the comparison the detail switches on and off', () => {
    const { result } = renderHook(() => useActivityCompareMap(input));
    expect(result.current.legend).toBeNull();

    act(() => useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 }));
    expect(result.current.legend?.trackName).toBe('Watch export');
    expect(result.current.route).toHaveLength(3);

    act(() => useTourActivityCompareStore.getState().clear());
    expect(result.current.route).toBe(dayRoute);
  });

  it('FE-ACT-COMPARE-MAP-005: draws the track in the colour the theme gives done', () => {
    document.documentElement.style.setProperty('--success', 'success-paint');
    try {
      useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 });
      const { result } = renderHook(() => useActivityCompareMap(input));
      expect(result.current.routeColors?.[2]?.line).toBe('success-paint');
    } finally {
      document.documentElement.style.removeProperty('--success');
    }
  });

  it('FE-ACT-COMPARE-MAP-006: tells the store whether it can compare, and ends a comparison where it no longer can or is gone', () => {
    const { rerender, unmount } = renderHook((props: typeof input) => useActivityCompareMap(props), {
      initialProps: input,
    });
    expect(useTourActivityCompareStore.getState().mapAvailable).toBe(true);
    act(() => useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 }));

    rerender({ ...input, enabled: false });
    expect(useTourActivityCompareStore.getState()).toMatchObject({ mapAvailable: false, comparison: null });

    rerender(input);
    expect(useTourActivityCompareStore.getState().mapAvailable).toBe(true);
    act(() => useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 }));
    unmount();
    expect(useTourActivityCompareStore.getState()).toMatchObject({ mapAvailable: false, comparison: null });
  });
});
