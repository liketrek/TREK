import { describe, expect, it } from 'vitest';

import { CATEGORY_ICON_MAP, ICON_LABELS, getCategoryIcon } from './categoryIcons';

import { BusFront, Fuel, MapPin, ParkingSquare, PlaneTakeoff, TrainFront } from 'lucide-react';

describe('categoryIcons', () => {
  it('FE-COMP-CATICONS-001: every icon the category picker offers has a label for its tooltip', () => {
    expect(Object.keys(CATEGORY_ICON_MAP).filter((name) => !ICON_LABELS[name])).toEqual([]);
    expect(Object.keys(ICON_LABELS).filter((name) => !CATEGORY_ICON_MAP[name])).toEqual([]);
  });

  it('FE-COMP-CATICONS-002: parking, stops, stations, airports and fuel have icons of their own (#2706)', () => {
    expect(getCategoryIcon('ParkingSquare')).toBe(ParkingSquare);
    expect(getCategoryIcon('BusFront')).toBe(BusFront);
    expect(getCategoryIcon('TrainFront')).toBe(TrainFront);
    expect(getCategoryIcon('PlaneTakeoff')).toBe(PlaneTakeoff);
    expect(getCategoryIcon('Fuel')).toBe(Fuel);
    expect(ICON_LABELS.ParkingSquare).toBe('Parking');
    expect(ICON_LABELS.PlaneTakeoff).toBe('Airport');
    expect(ICON_LABELS.Ship).toBe('Ship / Ferry');
  });

  it('FE-COMP-CATICONS-003: an unknown or missing icon name falls back to the pin', () => {
    expect(getCategoryIcon('NoSuchIcon')).toBe(MapPin);
    expect(getCategoryIcon(null)).toBe(MapPin);
    expect(getCategoryIcon(undefined)).toBe(MapPin);
  });
});
