import { rangeFromSpec, effectiveRangeKm, showSpec, storeSpec, specUnit } from './vehicleRange';

import { describe, it, expect } from 'vitest';

/**
 * FE-ROADTRIP-VEHRANGE-001..013 — a range stated as the parts it is made of.
 *
 * Two things are worth guarding here. The arithmetic itself, because it decides where
 * every fuel warning lands, and the unit round trip, because an imperial traveller who
 * types 15 into a field labelled gallons must not end up with 15 litres in storage.
 */

describe('rangeFromSpec', () => {
  it('FE-ROADTRIP-VEHRANGE-001: a tank divided by a consumption is a range', () => {
    expect(rangeFromSpec('combustion', { tankLitres: 55, litresPer100: 7 })).toBe(786);
  });

  it('FE-ROADTRIP-VEHRANGE-002: a battery divided by a consumption is a range', () => {
    expect(rangeFromSpec('electric', { batteryKwh: 58, kwhPer100: 16 })).toBe(363);
  });

  it('FE-ROADTRIP-VEHRANGE-003: age comes off the battery before the division', () => {
    // 58 kWh minus a tenth is 52.2, and 52.2 at 16 per hundred is 326.25 km.
    expect(rangeFromSpec('electric', { batteryKwh: 58, kwhPer100: 16, degradationPercent: 10 })).toBe(326);
  });

  it('FE-ROADTRIP-VEHRANGE-004: half a pair is not a range', () => {
    // Guessing the missing half would put the warnings at the wrong place while
    // looking exact, which is worse than saying nothing.
    expect(rangeFromSpec('combustion', { tankLitres: 55 })).toBeNull();
    expect(rangeFromSpec('combustion', { litresPer100: 7 })).toBeNull();
    expect(rangeFromSpec('electric', { batteryKwh: 58 })).toBeNull();
  });

  it('FE-ROADTRIP-VEHRANGE-005: figures belong to the kind of car they came from', () => {
    // A tank size on an electric car is a leftover from before the picker changed,
    // not a battery.
    expect(rangeFromSpec('electric', { tankLitres: 55, litresPer100: 7 })).toBeNull();
    expect(rangeFromSpec('combustion', { batteryKwh: 58, kwhPer100: 16 })).toBeNull();
    expect(rangeFromSpec(null, { tankLitres: 55, litresPer100: 7 })).toBeNull();
  });

  it('FE-ROADTRIP-VEHRANGE-006: a battery reported as entirely gone is a typo, not a car', () => {
    // Capped at 90 %, because zero usable capacity would put the dry point at the
    // first metre of the trip and divide by nothing.
    expect(rangeFromSpec('electric', { batteryKwh: 58, kwhPer100: 16, degradationPercent: 100 })).toBe(36);
  });

  it('FE-ROADTRIP-VEHRANGE-007: nonsense in a field is the same as an empty field', () => {
    expect(rangeFromSpec('combustion', { tankLitres: 0, litresPer100: 7 })).toBeNull();
    expect(rangeFromSpec('combustion', { tankLitres: -55, litresPer100: 7 })).toBeNull();
    expect(rangeFromSpec('combustion', { tankLitres: Number.NaN, litresPer100: 7 })).toBeNull();
  });
});

describe('effectiveRangeKm', () => {
  it('FE-ROADTRIP-VEHRANGE-008: the parts win over a typed round number', () => {
    // Somebody who gave a tank size and a consumption said something more exact
    // than "about 500", and the dialog shows them the result.
    expect(effectiveRangeKm('combustion', { tankLitres: 55, litresPer100: 7 }, 500)).toBe(786);
  });

  it('FE-ROADTRIP-VEHRANGE-009: an incomplete pair hands the typed number straight back', () => {
    expect(effectiveRangeKm('combustion', { tankLitres: 55 }, 500)).toBe(500);
    expect(effectiveRangeKm(null, {}, 500)).toBe(500);
  });

  it('FE-ROADTRIP-VEHRANGE-010: no figures anywhere is no limit', () => {
    expect(effectiveRangeKm(null, {}, 0)).toBeNull();
    expect(effectiveRangeKm('electric', {}, undefined)).toBeNull();
  });
});

describe('unit round trip', () => {
  it('FE-ROADTRIP-VEHRANGE-011: metric figures are stored exactly as typed', () => {
    expect(storeSpec('tankLitres', 55, false)).toBe(55);
    expect(showSpec('tankLitres', 55, false)).toBe(55);
    expect(showSpec('litresPer100', 7.4, false)).toBe(7.4);
  });

  it('FE-ROADTRIP-VEHRANGE-012: gallons go in and come back out as the same gallons', () => {
    // 15 US gallons is 56.78 litres, and storage is litres — the same rule the
    // range itself follows, where storage is always kilometres.
    const stored = storeSpec('tankLitres', 15, true);
    expect(stored).toBe(56.78);
    expect(showSpec('tankLitres', stored, true)).toBe(15);
  });

  it('FE-ROADTRIP-VEHRANGE-013: miles per gallon is the inverse, and survives the trip', () => {
    // The one field that is not a scale factor: 30 mpg is 7.84 L/100 km, and a
    // straight multiplication would have stored a car four times as thirsty.
    const stored = storeSpec('litresPer100', 30, true);
    expect(stored).toBe(7.84);
    expect(showSpec('litresPer100', stored, true)).toBe(30);
    expect(specUnit('litresPer100', true)).toBe('mpg');
    expect(specUnit('litresPer100', false)).toBe('L/100 km');
  });

  it('FE-ROADTRIP-VEHRANGE-014: electric consumption is quoted per 100 miles', () => {
    // What the EPA prints on the window sticker, so the figure is one a US
    // traveller can copy rather than convert.
    expect(showSpec('kwhPer100', 16, true)).toBe(25.7);
    expect(specUnit('kwhPer100', true)).toBe('kWh/100 mi');
    // A capacity is a capacity everywhere.
    expect(specUnit('batteryKwh', true)).toBe('kWh');
    expect(showSpec('batteryKwh', 58, true)).toBe(58);
  });

  it('FE-ROADTRIP-VEHRANGE-016: a consumption typed a hundred times too high does not silence the typed range', () => {
    // A consumption of 500 rather than 5.0 makes the parts round to nothing. Zero used
    // to count as an answer, so the `??` in effectiveRangeKm never reached the 500 km
    // the traveller had typed by hand, and every range warning went quiet with nothing
    // on screen to say which field did it.
    expect(rangeFromSpec('combustion', { tankLitres: 1, litresPer100: 500 })).toBeNull();
    expect(effectiveRangeKm('combustion', { tankLitres: 1, litresPer100: 500 }, 500)).toBe(500);

    // Same shape on the other kind of car, where a decimal point is just as easy to lose.
    expect(rangeFromSpec('electric', { batteryKwh: 0.5, kwhPer100: 200 })).toBeNull();
    expect(effectiveRangeKm('electric', { batteryKwh: 0.5, kwhPer100: 200 }, 420)).toBe(420);

    // One kilometre is still a figure, so the cut is below it and not at some round guess.
    expect(rangeFromSpec('combustion', { tankLitres: 1, litresPer100: 100 })).toBe(1);
  });

  it('FE-ROADTRIP-VEHRANGE-015: an empty field stays empty rather than becoming a zero', () => {
    expect(showSpec('tankLitres', undefined, false)).toBeUndefined();
    expect(showSpec('tankLitres', 0, true)).toBeUndefined();
    expect(storeSpec('tankLitres', 0, true)).toBe(0);
  });
});
