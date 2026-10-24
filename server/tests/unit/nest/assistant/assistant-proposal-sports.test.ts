/**
 * ASTPROP-SPORT-001 to ASTPROP-SPORT-007
 *
 * "Plan this" on every tour type: what a proposed bike tour or run and a
 * paddle or ski plan are taken as, the points a plan's legs make, the water
 * and the name a paddle tour gets, and the tour type's word in the user's
 * language where nothing names the tour.
 */
import {
  isSportPlan,
  sportTakeArgsOf,
  tourTypeWord,
  waypointsOfLegs,
} from '../../../../src/nest/assistant/assistant-proposal-sports';
import { takeArgsOf } from '../../../../src/nest/assistant/assistant-proposals.service';
import { writeToolOf } from '../../../../src/nest/assistant/assistant-tools.constants';
import { tourRouteCard } from '../../../helpers/assistant-tour-cards';

import { describe, expect, it } from 'vitest';

const A = { lat: 48.1, lng: 11.6 };
const B = { lat: 48.11, lng: 11.6 };
const C = { lat: 48.12, lng: 11.6 };

const ok = (segments: Array<{ kind: string; name: string | null }>) => ({ status: 'ok', segments });

describe('the points of a plan', () => {
  it('ASTPROP-SPORT-001: are the first start and every end, where each leg goes on from the one before', () => {
    expect(
      waypointsOfLegs([
        { from: A, to: B },
        { from: B, to: C },
      ]),
    ).toEqual([A, B, C]);
    // A leg that starts elsewhere is no part of one tour.
    expect(
      waypointsOfLegs([
        { from: A, to: B },
        { from: C, to: A },
      ]),
    ).toBeNull();
    expect(waypointsOfLegs([])).toBeNull();
    expect(waypointsOfLegs('legs')).toBeNull();
  });
});

describe('a paddle or ski plan taken', () => {
  it('ASTPROP-SPORT-002: a paddle plan is created with its boat, styles, water and the waters it runs on', () => {
    const args = {
      legs: [
        { from: A, to: B },
        { from: B, to: C },
      ],
      boat: 'canoe',
      lake_style: 'shore',
      lock_policy: 'use',
    };
    const result = {
      legs: [ok([{ kind: 'water', name: 'Isar' }]), ok([{ kind: 'lake', name: 'Ammersee' }])],
    };
    expect(sportTakeArgsOf('plan_paddle_route', args, result, 'Paddle tour')).toEqual({
      via: 'create_paddle_tour',
      name: 'Isar → Ammersee',
      waypoints: [A, B, C],
      water_context: 'river',
      boat_type: 'canoe',
      lake_style: 'shore',
      lock_policy: 'use',
    });
    const lake = sportTakeArgsOf(
      'plan_paddle_route',
      { legs: [{ from: A, to: B }] },
      { legs: [ok([{ kind: 'lake', name: null }])] },
      'Paddeltour',
    );
    expect(lake).toMatchObject({ name: 'Paddeltour', water_context: 'lake' });
  });

  it('ASTPROP-SPORT-003: a ski plan is created with its discipline, technique and options, named by its areas', () => {
    const args = {
      legs: [{ from: A, to: B }],
      discipline: 'cross_country',
      technique: 'classic',
      options: { lit_only: true },
    };
    expect(sportTakeArgsOf('plan_ski_route', args, { legs: [ok([])], area_names: ['Seefeld'] }, 'Ski')).toEqual({
      via: 'create_ski_tour',
      name: 'Seefeld',
      waypoints: [A, B],
      discipline: 'cross_country',
      technique: 'classic',
      options: { lit_only: true },
    });
  });

  it('ASTPROP-SPORT-004: a plan with a failed leg, or legs that do not join, cannot be taken', () => {
    const args = { legs: [{ from: A, to: B }], discipline: 'alpine' };
    expect(sportTakeArgsOf('plan_ski_route', args, { legs: [{ status: 'failed' }] }, 'Ski')).toBeNull();
    expect(sportTakeArgsOf('plan_ski_route', { ...args, legs: [] }, { legs: [] }, 'Ski')).toBeNull();
    expect(isSportPlan('plan_ski_route')).toBe(true);
    expect(isSportPlan('propose_hike')).toBe(false);
  });

  it("ASTPROP-SPORT-005: a tour nothing names is called by its type in the user's language, English for one TREK has none of", async () => {
    expect(await tourTypeWord('de-DE', 'plan_paddle_route')).toBe('Paddeltour');
    expect(await tourTypeWord('en', 'plan_ski_route')).toBe('Ski & winter');
    expect(await tourTypeWord('xx', 'plan_paddle_route')).toBe('Paddle tour');
  });
});

describe('a proposed bike tour or run taken', () => {
  const card = tourRouteCard({ activity: 'bike', routingProfile: 'road' });
  const args = { name: 'Lake', activity: 'bike', bike_profile: 'road', waypoints: [A, B], day_id: 3, along: false };

  it('ASTPROP-SPORT-006: is created as create_tour with the arguments it was proposed with, what create_tour takes', () => {
    expect(takeArgsOf({ toolName: 'propose_tour', args, result: {}, card })).toEqual({
      via: 'create_tour',
      name: 'Lake',
      activity: 'bike',
      bike_profile: 'road',
      waypoints: [A, B],
      day_id: 3,
    });
    expect(writeToolOf('take_proposal', { via: 'create_tour' })).toBe('create_tour');
    expect(writeToolOf('take_proposal', { via: 'create_paddle_tour' })).toBe('create_paddle_tour');
    expect(writeToolOf('take_proposal', { via: 'create_ski_tour' })).toBe('create_ski_tour');
  });

  it("ASTPROP-SPORT-007: a run without the runner's pace, or a way not planned, cannot be taken", () => {
    const run = { ...args, activity: 'run', bike_profile: undefined, run_profile: 'trail' };
    expect(takeArgsOf({ toolName: 'propose_tour', args: run, result: {}, card })).toBeNull();
    expect(
      takeArgsOf({ toolName: 'propose_tour', args: { ...run, run_pace_seconds_per_km: 330 }, result: {}, card }),
    ).toMatchObject({ via: 'create_tour', run_pace_seconds_per_km: 330 });
    expect(takeArgsOf({ toolName: 'propose_tour', args, result: {}, card: { ...card, routed: false } })).toBeNull();
  });
});
