/**
 * Why a leg is not planned (spec 7.6): each rule relaxed in turn names the
 * reason and the one change that would plan it; the way a relaxed search found
 * is never handed out as the leg. A point off every run, and two runs nothing
 * joins, are said as such.
 */
import { Kind, Lift, Use } from '../../../../src/nest/ski-routing/ski-graph.contract';
import { failedLeg, planOn } from '../../../helpers/ski-plan';
import { NORDIC_BOTH, SkiWorld } from '../../../helpers/ski-world';

import { describe, expect, it } from 'vitest';

/** A chair up and only a black run down. */
function steepAlp() {
  const world = new SkiWorld();
  const valley = world.node(0, 0, 1200);
  const top = world.node(0, 2000, 2200);
  world.lift(valley, top, { name: 'Sonnenbahn', sec: 420 });
  world.run(top, valley, 3, { name: 'Schwarze Wand', via: [[-300, 1000]] });
  return { world, valley: world.at(0, 0), top: world.at(0, 2000) };
}

describe('a leg one rule keeps from being planned', () => {
  it('SKIEXPLAIN-001: only a harder run joins the points: the level it needs and the run, never its line', () => {
    const { world, top, valley } = steepAlp();
    const leg = failedLeg(planOn(world, [[top, valley]])[0]);
    expect(leg).toEqual({
      status: 'failed',
      code: 'blocked_by_difficulty',
      at: null,
      hint: { raise_difficulty: 'advanced' },
      detail: { name: 'Schwarze Wand' },
    });
    expect(leg).not.toHaveProperty('geometry');
  });

  it('SKIEXPLAIN-002: only an avoided lift joins them: the class to allow, and the lift', () => {
    const { world, top, valley } = steepAlp();
    const leg = failedLeg(planOn(world, [[valley, top]], { options: { avoid_lifts: ['open_chair'] } })[0]);
    expect(leg).toMatchObject({
      code: 'blocked_by_lift_avoid',
      hint: { allow_lift: 'open_chair' },
      detail: { name: 'Sonnenbahn' },
    });
  });

  it('SKIEXPLAIN-003: only a trail of the other technique joins them: any technique will do', () => {
    const world = new SkiWorld();
    const a = world.node(0, 0, 1200);
    const b = world.node(2000, 0, 1210);
    world.edge(a, b, { kind: Kind.NORDIC, fwd: Use.NORDIC_SKATING, back: Use.NORDIC_SKATING, groom: 2 });
    const leg = failedLeg(
      planOn(world, [[world.at(0, 0), world.at(2000, 0)]], { discipline: 'cross_country', technique: 'classic' })[0],
    );
    expect(leg).toMatchObject({ code: 'blocked_by_technique', hint: { technique: 'unknown' } });
    // With either technique the same leg is planned.
    const either = planOn(world, [[world.at(0, 0), world.at(2000, 0)]], { discipline: 'cross_country' });
    expect(either[0]?.status).toBe('ok');
  });

  it('SKIEXPLAIN-004: only riding the gondola down joins them: allow it', () => {
    const world = new SkiWorld();
    const foot = world.node(0, 0, 1600);
    const summit = world.node(0, 1500, 2500);
    world.lift(foot, summit, { type: Lift.GONDOLA, name: 'Gondel', down: true });
    const leg = failedLeg(
      planOn(world, [[world.at(0, 1500), world.at(0, 0)]], { options: { allow_lift_down: false } })[0],
    );
    expect(leg).toMatchObject({ code: 'needs_ride_down', hint: { allow_lift_down: true }, detail: { name: 'Gondel' } });
  });

  it('SKIEXPLAIN-005: no way up without a lift: ski touring would go', () => {
    const world = new SkiWorld();
    const top = world.node(0, 2000, 2200);
    const valley = world.node(0, 0, 1200);
    world.run(top, valley, 1, { name: 'Talabfahrt' });
    const leg = failedLeg(planOn(world, [[world.at(0, 0), world.at(0, 2000)]])[0]);
    expect(leg).toMatchObject({ code: 'uphill_only', hint: { discipline: 'touring' } });
    // A ski tourer may climb a run only where asked to.
    const tour = planOn(world, [[world.at(0, 0), world.at(0, 2000)]], {
      discipline: 'touring',
      options: { touring_uphill_on_pistes: true },
    });
    expect(tour[0]).toMatchObject({ status: 'ok' });
  });
});

describe('a leg nothing joins', () => {
  it('SKIEXPLAIN-010: two runs that never meet: where the search stopped nearest the target', () => {
    const world = new SkiWorld();
    world.run(world.node(0, 2000, 2000), world.node(0, 1000, 1600), 1, { name: 'Links' });
    world.run(world.node(2000, 1000, 1600), world.node(2000, 0, 1200), 1, { name: 'Rechts' });
    const leg = failedLeg(planOn(world, [[world.at(0, 2000), world.at(2000, 0)]])[0]);
    expect(leg.code).toBe('disconnected');
    expect(leg.hint).toBeNull();
    expect(leg.at?.lat).toBeCloseTo(world.at(0, 1000).lat, 6);
  });

  it('SKIEXPLAIN-011: a point off every run says how far the nearest one is, and which', () => {
    const world = new SkiWorld();
    world.run(world.node(0, 2000, 2000), world.node(0, 1000, 1600), 1, { name: 'Gipfelhang' });
    const far = world.at(0, 3000);
    const leg = failedLeg(planOn(world, [[far, world.at(0, 1000)]])[0]);
    expect(leg).toEqual({
      status: 'failed',
      code: 'not_on_piste',
      at: far,
      hint: null,
      detail: { name: 'Gipfelhang', distance_m: 1000 },
    });
    const nowhere = world.at(0, 9000);
    expect(failedLeg(planOn(world, [[world.at(0, 2000), nowhere]])[0])).toMatchObject({
      code: 'not_on_piste',
      at: nowhere,
      detail: null,
    });
  });

  it('SKIEXPLAIN-012: a cross-country trail both ways still plans either way', () => {
    const world = new SkiWorld();
    world.nordic(world.node(0, 0, 1200), world.node(1000, 0, 1205), { fwd: NORDIC_BOTH, back: NORDIC_BOTH });
    const there = planOn(world, [[world.at(0, 0), world.at(1000, 0)]], { discipline: 'cross_country' });
    const back = planOn(world, [[world.at(1000, 0), world.at(0, 0)]], { discipline: 'cross_country' });
    expect([there[0]?.status, back[0]?.status]).toEqual(['ok', 'ok']);
  });
});
