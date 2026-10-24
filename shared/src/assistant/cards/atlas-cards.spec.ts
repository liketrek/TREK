import { atlasBucketCardSchema, type AtlasBucketCard, type AtlasBucketEntry } from './atlas-bucket.card';
import { atlasCountryCardSchema, type AtlasCountryCard } from './atlas-country.card';
import { atlasPassportCardSchema, type AtlasPassportCard } from './atlas-passport.card';
import { ATLAS_APPLIED_ENTITIES, ATLAS_CARD_SCHEMAS } from './atlas.contract';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

const passport: AtlasPassportCard = {
  kind: 'atlasPassport',
  countries: { visited: 23, planned: 4, idea: 1 },
  totals: { trips: 48, days: 410, places: 990, cities: 312, flownKm: 182_300 },
  flags: [
    { code: 'JP', status: 'visited' },
    { code: 'PT', status: 'planned' },
  ],
  moreFlags: 21,
  continents: [{ name: 'Europe', visited: 14, planned: 2 }],
  nextTrip: { title: 'Lisbon', startDate: '2026-11-03', daysUntil: 12 },
  streakYears: 3,
};

const kyoto = { code: 'JP-26', name: 'Kyoto', before: null, after: 'visited' as const };
const markJapan: NonNullable<AtlasCountryCard['change']> = {
  op: 'mark',
  region: kyoto,
  after: 'visited',
  countries: { before: 23, after: 24 },
  regions: { before: 0, after: 1 },
};
const kyotoTrip = { id: 7, title: 'Kyoto in spring', startDate: '2024-04-03', endDate: '2024-04-14' };

const country: AtlasCountryCard = {
  kind: 'atlasCountry',
  code: 'JP',
  status: 'planned',
  markedBy: null,
  placeCount: 14,
  tripCount: 2,
  trips: [kyotoTrip],
  moreTrips: 1,
  places: ['Fushimi Inari'],
  morePlaces: 13,
  change: markJapan,
};

const lights: AtlasBucketEntry = {
  id: null,
  name: 'Northern lights',
  countryCode: 'IS',
  regionCode: null,
  targetDate: '2027-02',
  notes: 'Glacier hike and hot springs',
  reachedOn: null,
  reachedFrom: null,
};

const bucket: AtlasBucketCard = {
  kind: 'atlasBucket',
  items: [lights],
  more: 0,
  change: { op: 'add', before: null, duplicate: false, wishes: { before: 7, after: 8 } },
};

describe('the atlas cards', () => {
  it('CARDS-ATLAS-001: the passport, a country change and a bucket wish parse as themselves and in the union', () => {
    expect(atlasPassportCardSchema.parse(passport)).toEqual(passport);
    expect(atlasCountryCardSchema.parse(country)).toEqual(country);
    expect(atlasBucketCardSchema.parse(bucket)).toEqual(bucket);
    for (const card of [passport, country, bucket]) {
      expect(trekCardSchema.parse(card)).toEqual(card);
      expect(JSON.stringify(card)).not.toMatch(/https?:/);
    }
    expect(ATLAS_CARD_SCHEMAS).toHaveLength(3);
    expect(ATLAS_APPLIED_ENTITIES).toEqual(['atlas']);
  });

  it('CARDS-ATLAS-002: a lower case or alpha-3 country code and a region outside the ISO form are refused', () => {
    expect(atlasCountryCardSchema.safeParse({ ...country, code: 'jp' }).success).toBe(false);
    expect(atlasCountryCardSchema.safeParse({ ...country, code: 'JPN' }).success).toBe(false);
    const region = { ...kyoto, code: 'Kyoto' };
    expect(atlasCountryCardSchema.safeParse({ ...country, change: { ...markJapan, region } }).success).toBe(false);
    const wish = { ...lights, countryCode: 'isl' };
    expect(atlasBucketCardSchema.safeParse({ ...bucket, items: [wish] }).success).toBe(false);
  });

  it('CARDS-ATLAS-003: lists past their bounds and an empty bucket card do not parse, and read as null', () => {
    const flags = Array.from({ length: 41 }, () => ({ code: 'FR', status: 'visited' as const }));
    expect(atlasPassportCardSchema.safeParse({ ...passport, flags }).success).toBe(false);
    const trips = Array.from({ length: 5 }, () => kyotoTrip);
    expect(atlasCountryCardSchema.safeParse({ ...country, trips }).success).toBe(false);
    expect(atlasBucketCardSchema.safeParse({ ...bucket, items: [] }).success).toBe(false);
    expect(storedTrekCardSchema.parse({ ...bucket, items: [] })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...passport, countries: { visited: -1, planned: 0, idea: 0 } })).toBeNull();
  });

  it('CARDS-ATLAS-004: a target date is a year, a month or a day, and a counter after a change may be unknown', () => {
    for (const targetDate of ['2027', '2027-05', '2027-05-14']) {
      const wish = { ...lights, targetDate };
      expect(atlasBucketCardSchema.safeParse({ ...bucket, items: [wish] }).success).toBe(true);
    }
    const wish = { ...lights, targetDate: 'May 2027' };
    expect(atlasBucketCardSchema.safeParse({ ...bucket, items: [wish] }).success).toBe(false);
    const unknown = { ...markJapan, after: 'unknown' as const, countries: { before: 23, after: null } };
    expect(atlasCountryCardSchema.parse({ ...country, change: unknown }).change?.countries?.after).toBeNull();
  });
});
