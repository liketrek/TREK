/**
 * ASSISTANT-WAYS-TAKE-001 to ASSISTANT-WAYS-TAKE-004: "Plan this" on a round
 * hike, another way of a leg and a wanderer trail: the change each holds,
 * taken from the stored proposal, never from the request.
 */
import { isWayProposal, wayTakeArgsOf } from '../../../../src/nest/assistant/assistant-proposal-ways';
import { takeArgsOf } from '../../../../src/nest/assistant/assistant-proposals.service';
import { writeToolOf } from '../../../../src/nest/assistant/assistant-tools.constants';
import type { TourRouteCard } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const CARD = { kind: 'tourRoute', source: 'proposal', routed: true, placeId: null } as TourRouteCard;
const START = { lat: 47.6, lng: 11.3, name: 'Car park', at_m: 0 };
const ROUND = {
  create_with: {
    waypoints: [START, { lat: 47.61, lng: 11.31 }, { lat: 47.62, lng: 11.3, poi_category: 'peak' }],
    round_trip: true,
  },
};

describe('taking a round or a leg’s way', () => {
  it('ASSISTANT-WAYS-TAKE-001: a round is created through the points it answered, under the rules it was asked with', () => {
    const args = { name: 'Round', start: START, distance_km: 10, max_hiking_difficulty: 3, day_id: 31, round: 'b' };
    expect(wayTakeArgsOf('propose_round_hike', args, ROUND, CARD)).toEqual({
      via: 'create_hike',
      name: 'Round',
      max_hiking_difficulty: 3,
      day_id: 31,
      round_trip: true,
      waypoints: [
        { lat: 47.6, lng: 11.3, name: 'Car park' },
        { lat: 47.61, lng: 11.31 },
        { lat: 47.62, lng: 11.3, poi_category: 'peak' },
      ],
    });
    expect(takeArgsOf({ toolName: 'propose_round_hike', args, result: ROUND, card: CARD })).toMatchObject({
      via: 'create_hike',
    });
    // A stop a day ends at stays one on a hike over several days.
    const trek = {
      create_with: { waypoints: [START, { lat: 47.7, lng: 11.4, stage_end: true }, START], round_trip: false },
    };
    expect(wayTakeArgsOf('propose_hike_leg_way', { name: 'Trek' }, trek, CARD)?.waypoints).toEqual([
      { lat: 47.6, lng: 11.3, name: 'Car park' },
      { lat: 47.7, lng: 11.4, stage_end: true },
      { lat: 47.6, lng: 11.3, name: 'Car park' },
    ]);
    expect(isWayProposal('propose_hike_leg_way')).toBe(true);
    expect(isWayProposal('toString')).toBe(false);
  });

  it('ASSISTANT-WAYS-TAKE-002: nothing is taken from a way not planned, a saved hike’s leg or broken points', () => {
    expect(wayTakeArgsOf('propose_round_hike', {}, ROUND, { ...CARD, routed: false })).toBeNull();
    expect(wayTakeArgsOf('propose_hike_leg_way', {}, ROUND, { ...CARD, placeId: 61 })).toBeNull();
    const broken = { create_with: { waypoints: [START, { lat: 'x' }], round_trip: false } };
    expect(wayTakeArgsOf('propose_hike_leg_way', {}, broken, CARD)).toBeNull();
    expect(wayTakeArgsOf('propose_hike_leg_way', {}, {}, CARD)).toBeNull();
  });
});

describe('taking a wanderer trail', () => {
  it('ASSISTANT-WAYS-TAKE-003: a trail is imported with the fingerprint its preview answered', () => {
    const result = { contentHash: 'h'.repeat(32), state: 'new' };
    expect(wayTakeArgsOf('preview_wanderer_trail', { trailId: 'trail-1' }, result, CARD)).toEqual({
      via: 'import_wanderer_trail',
      trailId: 'trail-1',
      contentHash: 'h'.repeat(32),
    });
    // The take runs the import itself.
    expect(writeToolOf('take_proposal', { via: 'import_wanderer_trail' })).toBe('import_wanderer_trail');
  });

  it('ASSISTANT-WAYS-TAKE-004: a trail already in the trip as it is, or a preview without its fingerprint, is not taken', () => {
    const args = { trailId: 'trail-1' };
    expect(wayTakeArgsOf('preview_wanderer_trail', args, { contentHash: 'h', state: 'unchanged' }, CARD)).toBeNull();
    expect(wayTakeArgsOf('preview_wanderer_trail', args, { state: 'new' }, CARD)).toBeNull();
    expect(wayTakeArgsOf('preview_wanderer_trail', {}, { contentHash: 'h', state: 'new' }, CARD)).toBeNull();
  });
});
