import { fireEvent, render, screen } from '@testing-library/react';
import type { SkiLiftClass, SkiRouteOkLeg, SkiRouteSegment } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import type { SkiLegProblem, SkiTourRoute } from '../planner/skiRouting';
import { SkiLegFailureRow, SkiLegSteps } from './SkiLegRows';
import { skiFixesOf, skiSecondsOf, skiTallyOf } from './skiRouteFacts';
import { SkiRouteOptions } from './SkiRouteOptions';
import { skiPaintOf } from './skiRouteStyle';
import { SkiPlannerSummary, SkiRouteSummary } from './SkiRouteSummary';

// FE-TOUR-SKI-UI-001 to FE-TOUR-SKI-UI-013

function segment(kind: SkiRouteSegment['kind'], extra: Partial<SkiRouteSegment> = {}): SkiRouteSegment {
  return {
    kind,
    from: 0,
    to: 1,
    name: null,
    ref: null,
    difficulty: null,
    lift_type: null,
    grooming: [],
    seconds: 600,
    wait_seconds: 0,
    length_m: 1000,
    flags: [],
    osm_way: null,
    ...extra,
  };
}

function okLeg(extra: Partial<SkiRouteOkLeg> = {}): SkiRouteOkLeg {
  return {
    status: 'ok',
    geometry: [
      [47, 11, 1500],
      [47.01, 11, 2000],
      [47.02, 11, 1400],
    ],
    segments: [
      { ...segment('lift', { name: 'Gipfelbahn' }), from: 0, to: 1 },
      { ...segment('run', { difficulty: 'intermediate' }), from: 1, to: 2 },
    ],
    distance_m: 3000,
    climb_m: 500,
    descent_m: 600,
    seconds: { ski: 600, lift: 480, wait: 120, walk: 0 },
    snapped_m: { from: 0, to: 0 },
    area_ids: ['w:1'],
    why: [],
    alternatives: [],
    ...extra,
  };
}

function route(extra: Partial<SkiTourRoute> = {}): SkiTourRoute {
  return {
    coordinates: [
      [47, 11],
      [47.02, 11],
    ],
    parts: [],
    distanceMeters: 3000,
    durationSeconds: 1200,
    legs: [okLeg()],
    problems: [],
    elevations: null,
    build: '2026-11-02',
    stale: false,
    areaNames: ['Gletscherwelt'],
    colourScheme: 'europe',
    attribution: null,
    plannedLegs: [0],
    saved: false,
    ...extra,
  };
}

const problem = (extra: Partial<SkiLegProblem> = {}): SkiLegProblem => ({
  index: 0,
  code: 'blocked_by_difficulty',
  hint: { raise_difficulty: 'advanced' },
  name: 'Schwarze Wand',
  summer: false,
  ...extra,
});

describe('SkiRouteOptions (SKI-02)', () => {
  it('FE-TOUR-SKI-UI-001: a downhill skier sets the hardest runs, the pace, the switches and the lifts to leave out', () => {
    const onChange = vi.fn();
    render(<SkiRouteOptions discipline="alpine" options={{ avoid_lifts: ['gondola'] }} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'tours.ski.options.maxDifficulty' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.pace.sporty' }));
    expect(onChange).toHaveBeenLastCalledWith({ pace: 'sporty' });
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.priority.easiest' }));
    expect(onChange).toHaveBeenLastCalledWith({ priority: 'easiest' });
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.options.freeride' }));
    expect(onChange).toHaveBeenLastCalledWith({ allow_freeride: true });
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.options.useLifts' }));
    expect(onChange).toHaveBeenLastCalledWith({ use_lifts: false });
    expect(screen.getByRole('button', { name: 'tours.ski.lift.gondola' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.lift.drag' }));
    expect(onChange).toHaveBeenLastCalledWith({ avoid_lifts: ['gondola', 'drag'] });
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.lift.gondola' }));
    expect(onChange).toHaveBeenLastCalledWith({ avoid_lifts: [] });
  });

  it('FE-TOUR-SKI-UI-002: a cross-country skier sees the trail switches only, and no lift classes while riding none', () => {
    render(<SkiRouteOptions discipline="cross_country" options={null} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'tours.ski.options.groomedOnly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tours.ski.options.litOnly' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tours.ski.options.maxDifficulty' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'tours.ski.options.liftDown' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'tours.ski.options.avoidLifts' })).toBeNull();
  });
});

describe('ski leg rows (SKI-02)', () => {
  it('FE-TOUR-SKI-UI-003: each hint becomes the change of the choice that would plan the leg', () => {
    const avoided: SkiLiftClass[] = ['drag', 'gondola'];
    const alpine = { discipline: 'alpine' as const, technique: null, options: { avoid_lifts: avoided } };
    const [raise, lift] = skiFixesOf(problem({ hint: { raise_difficulty: 'advanced', allow_lift: 'drag' } }));
    expect(raise?.apply(alpine).options).toMatchObject({ max_difficulty: 'advanced' });
    expect(lift?.apply(alpine).options).toMatchObject({ avoid_lifts: ['gondola'] });
    const [freeride] = skiFixesOf(problem({ hint: { raise_difficulty: 'freeride' } }));
    expect(freeride?.apply(alpine).options).toMatchObject({ allow_freeride: true });
    const [down, technique, discipline] = skiFixesOf(
      problem({ hint: { allow_lift_down: true, technique: 'skating', discipline: 'touring' } })
    );
    expect(down?.apply(alpine).options).toMatchObject({ allow_lift_down: true });
    expect(technique?.apply(alpine).technique).toBe('skating');
    expect(discipline?.apply({ discipline: 'cross_country', technique: 'classic' })).toEqual({
      discipline: 'touring',
      technique: null,
    });
    expect(skiFixesOf(problem({ hint: null }))).toEqual([]);
    expect(skiFixesOf(problem({ hint: { allow_lift: 'teleporter' } }))).toEqual([]);
  });

  it('FE-TOUR-SKI-UI-004: a failed leg says why, names the run, applies its fix and offers to draw it', () => {
    const onChoice = vi.fn();
    const onDrawStraight = vi.fn();
    const choice = { discipline: 'alpine' as const, technique: null };
    render(
      <ul>
        <SkiLegFailureRow
          problem={problem()}
          choice={choice}
          disabled={false}
          onChoice={onChoice}
          onDrawStraight={onDrawStraight}
        />
      </ul>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('tours.ski.fail.blocked_by_difficulty');
    expect(screen.getByText('Schwarze Wand')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.fix.raiseDifficulty' }));
    expect(onChoice).toHaveBeenCalledWith({ ...choice, options: { max_difficulty: 'advanced' } });
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.drawStraight' }));
    expect(onDrawStraight).toHaveBeenCalled();
  });

  it('FE-TOUR-SKI-UI-005: a leg on summer paths is said calmly, not as a failure', () => {
    render(
      <ul>
        <SkiLegFailureRow
          problem={problem({ code: 'not_on_piste', hint: null, name: null, summer: true })}
          choice={{ discipline: 'snowshoe', technique: null }}
          disabled
          onChoice={vi.fn()}
          onDrawStraight={vi.fn()}
        />
      </ul>
    );
    expect(screen.getByRole('status')).toHaveTextContent('tours.ski.summerPath');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('FE-TOUR-SKI-UI-006: a planned leg lists its steps, named or by their kind, with the time on each', () => {
    render(
      <ul>
        <SkiLegSteps leg={okLeg()} scheme="europe" />
      </ul>
    );
    const steps = screen.getAllByRole('listitem').filter((item) => item.closest('ol'));
    expect(steps).toHaveLength(2);
    expect(steps[0]).toHaveTextContent('Gipfelbahn');
    expect(steps[1]).toHaveTextContent('tours.ski.kind.run');
    expect(steps[1]).toHaveTextContent('10');
  });
});

describe('SkiRouteSummary (SKI-02)', () => {
  it('FE-TOUR-SKI-UI-007: sums the time by what it is spent on, and says what the reader should weigh', () => {
    const avoided = { kind: 'avoided_difficulty', level: 'advanced', name: 'Schwarze Wand', saved_seconds: 0 } as const;
    const guessed = { kind: 'flag', flag: 'inferred_link', count: 1 } as const;
    const planned = route({
      legs: [okLeg({ why: [avoided, guessed] }), null],
      problems: [problem({ index: 1 })],
      stale: true,
    });
    expect(skiSecondsOf(planned)).toEqual({ ski: 600, lift: 480, wait: 120, walk: 0 });
    render(<SkiRouteSummary route={planned} />);
    const card = screen.getByTestId('ski-route-summary');
    expect(card).toHaveTextContent('tours.ski.summary.ski');
    expect(card).toHaveTextContent('tours.ski.difficulty.advanced: Schwarze Wand');
    expect(card).toHaveTextContent('tours.ski.summary.unplanned');
    expect(card).toHaveTextContent('tours.ski.summary.guessed');
    expect(card).toHaveTextContent('tours.ski.summary.stale');
    expect(card).toHaveTextContent('Gletscherwelt. tours.ski.summary.source');
  });

  it('FE-TOUR-SKI-UI-008: nothing while no leg was asked', () => {
    const { container } = render(<SkiRouteSummary route={route({ legs: [null] })} />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<SkiRouteSummary route={null} />).container).toBeEmptyDOMElement();
  });

  it('FE-TOUR-SKI-UI-010: counts the runs, the height skied down on them and the lift rides, and names the build', () => {
    const leg = okLeg({
      geometry: [
        [47, 11, 1500],
        [47.01, 11, 2000],
        [47.015, 11, null],
        [47.02, 11, 1400],
        [47.021, 11, 1450],
        [47.03, 11, 1200],
      ],
      segments: [
        { ...segment('lift'), from: 0, to: 1 },
        { ...segment('run', { length_m: 1800 }), from: 1, to: 5 },
        { ...segment('rail'), from: 5, to: 5 },
      ],
    });
    // 2000 down to 1400 past a point without a height, up 50 and down 250: 850 m skied down.
    expect(skiTallyOf(route({ legs: [leg, null] }))).toEqual({ runsM: 1800, downM: 850, rides: 2 });
    const credited = route({ legs: [leg], attribution: '© OpenStreetMap contributors. Terrain: Terrarium' });
    render(<SkiRouteSummary route={credited} />);
    const card = screen.getByTestId('ski-route-summary');
    expect(card).toHaveTextContent('tours.ski.summary.runs1.8 km');
    expect(card).toHaveTextContent('tours.ski.summary.descent850 m');
    expect(card).toHaveTextContent('tours.ski.summary.lifts2');
    expect(card).toHaveTextContent('tours.ski.summary.build');
    expect(card).toHaveTextContent('Gletscherwelt. © OpenStreetMap contributors. Terrain: Terrarium');
    expect(card).not.toHaveTextContent('tours.ski.summary.source');
  });

  it('FE-TOUR-SKI-UI-011: a tour opened as saved says so with its build, and the fixed credit where none was sent', () => {
    render(<SkiRouteSummary route={route({ legs: [], saved: true, areaNames: [] })} />);
    const card = screen.getByTestId('ski-route-summary');
    expect(card).toHaveTextContent('tours.ski.summary.saved');
    expect(card).toHaveTextContent('tours.ski.summary.build');
    expect(card).toHaveTextContent('tours.ski.summary.source');
    expect(card).not.toHaveTextContent('tours.ski.summary.ski');
  });

  it('FE-TOUR-SKI-UI-012: nothing for a tour saved without a leg the router planned, and no build line without a build', () => {
    const drawn = route({ legs: [], saved: true, plannedLegs: [], build: null });
    expect(render(<SkiRouteSummary route={drawn} />).container).toBeEmptyDOMElement();
    render(<SkiRouteSummary route={route({ saved: true, legs: [], build: null })} />);
    expect(screen.getByTestId('ski-route-summary')).not.toHaveTextContent('tours.ski.summary.build');
  });

  it('FE-TOUR-SKI-UI-013: the planner rail shows the summary for a ski tour only', () => {
    const planned = route({ legs: [okLeg()] });
    expect(render(<SkiPlannerSummary planner={{ isSki: false, skiRoute: planned }} />).container).toBeEmptyDOMElement();
    render(<SkiPlannerSummary planner={{ isSki: true, skiRoute: planned }} />);
    expect(screen.getByTestId('ski-route-summary')).toHaveTextContent('tours.ski.summary.ski');
  });
});

describe('skiPaintOf (SKI-02)', () => {
  it('FE-TOUR-SKI-UI-009: runs in the colours of their grade where they are, lifts and the rest by kind', () => {
    expect(skiPaintOf({ kind: 'run', difficulty: 'intermediate', scheme: 'europe' })).toBe('#d51e1e');
    expect(skiPaintOf({ kind: 'run', difficulty: 'intermediate', scheme: 'north_america' })).toBe('#2949ca');
    expect(skiPaintOf({ kind: 'run', difficulty: 'easy' })).toBe('#2949ca');
    expect(skiPaintOf({ kind: 'lift', difficulty: null })).toBe('#1f2937');
    expect(skiPaintOf({ kind: 'summer', difficulty: null })).toBe('#d97706');
    expect(skiPaintOf({ kind: 'run', difficulty: null })).toBe('#475569');
  });
});
