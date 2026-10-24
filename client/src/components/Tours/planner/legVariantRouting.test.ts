// FE-TOUR-LEG-VARIANT-ROUTING-001 to FE-TOUR-LEG-VARIANT-ROUTING-005: asking the router for the
// other ways of a hike's section under its own rules, and routing a section through pins (RTE-02).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { valhallaAlternates, valhallaRun, enrichTourElevations } = vi.hoisted(() => ({
  valhallaAlternates: vi.fn(),
  valhallaRun: vi.fn(),
  enrichTourElevations: vi.fn(),
}));

vi.mock('../../Map/valhallaRoute', () => ({ valhallaAlternates, valhallaRun }));
vi.mock('./tourRouting', () => ({ enrichTourElevations }));

import { askOtherWays, routeSection, type OtherWaysAnswer } from './legVariantRouting';
import type { ComparedLeg, LegVariant } from './legVariants';

const LEG: ComparedLeg = {
  fromId: 'a',
  toId: 'b',
  from: { lat: 47, lng: 11 },
  to: { lat: 47, lng: 11.02 },
  costing: { max_hiking_difficulty: 3, use_hills: 0.2 },
  key: 'a>b',
};
const CURRENT: LegVariant = {
  key: 'current',
  current: true,
  coordinates: [
    [47, 11],
    [47.001, 11.01],
    [47, 11.02],
  ],
  distanceM: 1530,
  gainM: 50,
  lossM: 30,
  minutes: 30,
  heights: 'known',
};
const NORTH: [number, number][] = [
  [47, 11],
  [47.03, 11.01],
  [47, 11.02],
];
const leg = (coordinates: [number, number][]) => ({
  coordinates,
  distance: 6000,
  duration: 4000,
  hasToll: false,
  hasHighway: false,
  hasFerry: false,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('askOtherWays', () => {
  it('FE-TOUR-LEG-VARIANT-ROUTING-001: asks on foot between the two ends under the hike’s rules, then the heights of each way', async () => {
    valhallaAlternates.mockResolvedValue([leg(CURRENT.coordinates), leg(NORTH)]);
    enrichTourElevations.mockResolvedValue(
      NORTH.map(([lat, lng], i): [number, number, number] => [lat, lng, i === 1 ? 1100 : 1000])
    );
    const reports: OtherWaysAnswer[] = [];
    await askOtherWays(LEG, CURRENT, new AbortController().signal, (answer) => reports.push(answer));

    expect(valhallaAlternates).toHaveBeenCalledWith(
      LEG.from,
      LEG.to,
      'walking',
      [],
      3,
      expect.any(AbortSignal),
      LEG.costing
    );
    expect(enrichTourElevations).toHaveBeenCalledTimes(1);
    expect(enrichTourElevations).toHaveBeenCalledWith(NORTH, expect.any(AbortSignal));
    expect(reports.map((report) => report.phase)).toEqual(['choose', 'choose']);
    expect(reports[0].variants.map((variant) => [variant.key, variant.heights])).toEqual([
      ['current', 'known'],
      ['a', 'pending'],
    ]);
    expect(reports[1].variants[1]).toMatchObject({ heights: 'known', gainM: 100, lossM: 100 });
  });

  it('FE-TOUR-LEG-VARIANT-ROUTING-002: one way back is no choice, no answer is a failure; neither asks for heights', async () => {
    const reports: OtherWaysAnswer[] = [];
    valhallaAlternates.mockResolvedValueOnce([leg(CURRENT.coordinates)]);
    await askOtherWays(LEG, CURRENT, new AbortController().signal, (answer) => reports.push(answer));
    valhallaAlternates.mockResolvedValueOnce(null);
    await askOtherWays(LEG, CURRENT, new AbortController().signal, (answer) => reports.push(answer));

    expect(reports).toEqual([
      { phase: 'none', variants: [CURRENT] },
      { phase: 'failed', variants: [CURRENT] },
    ]);
    expect(enrichTourElevations).not.toHaveBeenCalled();
  });

  it('FE-TOUR-LEG-VARIANT-ROUTING-003: nothing is reported once the comparison is gone, not even what was asked before', async () => {
    const controller = new AbortController();
    const report = vi.fn();
    valhallaAlternates.mockImplementationOnce(async () => {
      controller.abort();
      return [leg(CURRENT.coordinates), leg(NORTH)];
    });
    await askOtherWays(LEG, CURRENT, controller.signal, report);
    expect(report).not.toHaveBeenCalled();

    const later = new AbortController();
    valhallaAlternates.mockResolvedValueOnce([leg(CURRENT.coordinates), leg(NORTH)]);
    enrichTourElevations.mockImplementationOnce(async () => {
      later.abort();
      return null;
    });
    await askOtherWays(LEG, CURRENT, later.signal, report);
    expect(report).toHaveBeenCalledTimes(1);
  });
});

describe('routeSection', () => {
  it('FE-TOUR-LEG-VARIANT-ROUTING-004: routes the section through the pins in order, under its own rules', async () => {
    valhallaRun.mockResolvedValue({ legs: [], total: { ...leg(NORTH), hasFerry: true }, snapped: [] });
    const signal = new AbortController().signal;
    const routed = await routeSection(LEG, [{ lat: 47.03, lng: 11.01 }], signal);

    expect(valhallaRun).toHaveBeenCalledWith(
      [LEG.from, { lat: 47.03, lng: 11.01 }, LEG.to],
      'walking',
      [],
      signal,
      LEG.costing
    );
    expect(routed).toEqual({ coordinates: NORTH, distance: 6000, duration: 4000, hasFerry: true });
  });

  it('FE-TOUR-LEG-VARIANT-ROUTING-005: a router without an answer is a failure, never an empty way', async () => {
    valhallaRun.mockResolvedValue(null);
    await expect(routeSection(LEG, [], new AbortController().signal)).rejects.toThrow('No route found');
  });
});
