/**
 * Community values for places outside the index: the key a details id maps to,
 * what is laid over the record, and that a place without published values, or
 * a service that does not answer, leaves the details as they were.
 */
import { osmDetailsWithCommunity, withCommunityValues } from '../../../src/nest/maps/community-overlay';
import { communityKeyOf } from '../../../src/nest/maps/trek-community.service';
import { trekCommunityByKeys } from '../../../src/nest/maps/trek-places.client';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/nest/maps/trek-places.client', () => ({ trekCommunityByKeys: vi.fn() }));
const ask = vi.mocked(trekCommunityByKeys);

const DETAILS = {
  name: 'Umeda Sky Building',
  website: null,
  phone: null,
  opening_hours: null,
  osm_id: 'relation:3389505',
};

beforeEach(() => ask.mockReset());

describe('community values on OSM details', () => {
  it('COMOV-001: maps an OSM details id onto the service key, and nothing else', () => {
    expect(communityKeyOf('relation:3389505')).toBe('osm:relation/3389505');
    expect(communityKeyOf('node:1')).toBe('osm:node/1');
    expect(communityKeyOf('way:22')).toBe('osm:way/22');
    expect(communityKeyOf('gers:abc')).toBeNull();
    expect(communityKeyOf('relation:12;out')).toBeNull();
  });

  it('COMOV-002: lays the published values over the record, with the version', () => {
    const got = withCommunityValues(DETAILS, {
      contact: { website: 'www.skybldg.co.jp', phone: '+81 6 6440 3855', email: null },
      hours: { osm: 'Mo-Su 09:30-22:30' },
      description: { text: 'A tower of two linked blocks.' },
      community: { version: 3, fields: ['website', 'phone', 'opening_hours', 'description'] },
    });
    expect(got.website).toMatch(/^https:\/\/www\.skybldg\.co\.jp\/?$/);
    expect(got).toMatchObject({
      phone: '+81 6 6440 3855',
      summary: 'A tower of two linked blocks.',
      summary_source: 'community',
      community_version: 3,
      name: 'Umeda Sky Building',
    });
    expect(got.opening_hours).toEqual(expect.arrayContaining(['Monday: 09:30-22:30', 'Sunday: 09:30-22:30']));
    expect(got.opening_periods).toBeTruthy();
    expect(got.email).toBeUndefined();
  });

  it('COMOV-003: a place without published values keeps its record as it was', () => {
    expect(withCommunityValues(DETAILS, undefined)).toBe(DETAILS);
    expect(withCommunityValues(DETAILS, { contact: { website: 'https://x.example' } })).toBe(DETAILS);
  });

  it('COMOV-004: asks the service once for the element and merges its answer', async () => {
    ask.mockResolvedValueOnce({
      'osm:relation/3389505': {
        contact: { website: 'https://www.skybldg.co.jp/' },
        community: { version: 1, fields: ['website'] },
      },
    });
    const got = await osmDetailsWithCommunity('relation:3389505', DETAILS);
    expect(ask).toHaveBeenCalledWith(['osm:relation/3389505']);
    expect(got?.website).toBe('https://www.skybldg.co.jp/');
  });

  it('COMOV-005: no details, an id without a key, or an empty answer ask nothing more', async () => {
    expect(await osmDetailsWithCommunity('relation:3389505', null)).toBeNull();
    expect(await osmDetailsWithCommunity('gers:abc', DETAILS)).toBe(DETAILS);
    expect(ask).not.toHaveBeenCalled();
    ask.mockResolvedValueOnce({});
    expect(await osmDetailsWithCommunity('node:7', DETAILS)).toEqual(DETAILS);
  });
});

describe('records that carry the community answer already', () => {
  it('COMOV-006: are not asked about a second time', async () => {
    const { markCommunityAsked } = await import('../../../src/nest/maps/community-overlay');
    const record = markCommunityAsked({ ...DETAILS });
    expect(await osmDetailsWithCommunity('relation:3389505', record)).toBe(record);
    expect(ask).not.toHaveBeenCalled();
  });
});
