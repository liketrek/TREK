import {
  settingUpsertRequestSchema,
  settingsBulkRequestSchema,
  MASKED_SETTING_VALUE,
  PLANNER_TRIP_VIEWS_MAX,
  compactPlannerTripViews,
  plannerTripViewsSchema,
  DASHBOARD_TIMEZONES_MAX,
  dashboardTimezonesSchema,
} from './settings.schema';

import { describe, it, expect } from 'vitest';

describe('settingUpsertRequestSchema', () => {
  it('requires a key; value is any/optional', () => {
    expect(settingUpsertRequestSchema.safeParse({ key: 'theme', value: 'dark' }).success).toBe(true);
    expect(settingUpsertRequestSchema.safeParse({ key: 'theme' }).success).toBe(true);
    expect(settingUpsertRequestSchema.safeParse({ value: 'dark' }).success).toBe(false);
  });
});

describe('settingsBulkRequestSchema', () => {
  it('requires a settings record', () => {
    expect(settingsBulkRequestSchema.safeParse({ settings: { a: 1, b: 'x' } }).success).toBe(true);
    expect(settingsBulkRequestSchema.safeParse({ settings: {} }).success).toBe(true);
    expect(settingsBulkRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('MASKED_SETTING_VALUE', () => {
  it('is the bullet sentinel the client echoes for unchanged secrets', () => {
    expect(MASKED_SETTING_VALUE).toBe('••••••••');
  });
});

describe('plannerTripViewsSchema (#2639)', () => {
  it('takes the three switches per trip id', () => {
    expect(
      plannerTripViewsSchema.safeParse({ '12': { roadtrip: true, dawarich: false, overview: true } }).success,
    ).toBe(true);
    expect(plannerTripViewsSchema.safeParse({}).success).toBe(true);
  });

  it('refuses a key that is not a trip id and a switch that is not a boolean', () => {
    expect(plannerTripViewsSchema.safeParse({ abc: { roadtrip: true } }).success).toBe(false);
    expect(plannerTripViewsSchema.safeParse({ '0': { roadtrip: true } }).success).toBe(false);
    expect(plannerTripViewsSchema.safeParse({ '12': { roadtrip: 'yes' } }).success).toBe(false);
    expect(plannerTripViewsSchema.safeParse(['12']).success).toBe(false);
  });

  it('refuses more trips than the row is meant to hold', () => {
    const many = Object.fromEntries(
      Array.from({ length: PLANNER_TRIP_VIEWS_MAX + 1 }, (_, i) => [String(i + 1), { roadtrip: true }]),
    );
    expect(plannerTripViewsSchema.safeParse(many).success).toBe(false);
  });
});

describe('compactPlannerTripViews', () => {
  it('keeps only the switches that are on and drops trips with none', () => {
    expect(
      compactPlannerTripViews({ '1': { roadtrip: true, dawarich: false }, '2': { overview: false }, '3': {} }),
    ).toEqual({
      '1': { roadtrip: true },
    });
  });
});

describe('dashboardTimezonesSchema', () => {
  it('takes IANA zone ids in order, and [] for no clocks', () => {
    expect(dashboardTimezonesSchema.parse(['Europe/Madrid', 'Africa/Cairo'])).toEqual([
      'Europe/Madrid',
      'Africa/Cairo',
    ]);
    expect(dashboardTimezonesSchema.safeParse([]).success).toBe(true);
    expect(dashboardTimezonesSchema.safeParse(['UTC']).success).toBe(true);
  });

  it('refuses an unknown zone, an empty id, a duplicate and a bare string', () => {
    expect(dashboardTimezonesSchema.safeParse(['Mars/Olympus_Mons']).success).toBe(false);
    expect(dashboardTimezonesSchema.safeParse(['']).success).toBe(false);
    expect(dashboardTimezonesSchema.safeParse(['Europe/Madrid', 'Europe/Madrid']).success).toBe(false);
    expect(dashboardTimezonesSchema.safeParse('Europe/Madrid').success).toBe(false);
  });

  it(`refuses more than ${DASHBOARD_TIMEZONES_MAX} zones`, () => {
    const zones = Intl.supportedValuesOf('timeZone').slice(0, DASHBOARD_TIMEZONES_MAX + 1);
    expect(dashboardTimezonesSchema.safeParse(zones.slice(0, DASHBOARD_TIMEZONES_MAX)).success).toBe(true);
    expect(dashboardTimezonesSchema.safeParse(zones).success).toBe(false);
  });
});
