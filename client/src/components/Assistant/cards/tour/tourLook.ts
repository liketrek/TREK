import { type AssistantApplied, cumulativeMetres, type TourRouteCard, type TrekCard } from '@trek/shared';
import {
  ArrowLeftRight,
  ChartNoAxesColumn,
  Circle,
  CircleCheck,
  CircleSlash,
  Copy,
  Footprints,
  History,
  Luggage,
  MapPinMinus,
  MapPinPlus,
  Palette,
  Repeat,
  Route,
  Snowflake,
  TriangleAlert,
  Waves,
} from 'lucide-react';

import type { RouteLineSpec, RouteUse } from '../../../../types/assistantMap';
import type { EntityTarget, PackLook } from '../cardTypes';

/**
 * What the tours bring to the chat's pure look: the verbs of their changes,
 * the names of their reading steps, what an applied tour opens (its line on
 * the plan, the tour in the Tours tab) and the look of each of their kinds:
 * how an answer groups the ways it proposed, what to ask next and the lines
 * the plan's map draws for a route. A look stays pure, icons and literals
 * only: the chat's main chunk reads every look, so whatever a look imports
 * ships with it.
 */

/** The colours a route is drawn in on the plan, the planner's own for the way taken now (styles/hike.css). */
const ROUTE_PAINT = { line: 'var(--hike-variant-current)', casing: 'var(--bike-highlight-casing)' } as const;

/** The tour a change or a card is about: the applied change's id, else the saved tour the card shows. */
function tourIdOf(applied: AssistantApplied, card: TrekCard | null): number | null {
  return applied.ids[0] ?? (card?.kind === 'tourRoute' ? card.placeId : null);
}

/** A saved tour opened in the Tours tab; the planner takes `?tour=` once and opens it. The phone has no such tab. */
export function tourTarget(placeId: number): EntityTarget {
  return { kind: 'tab', tab: 'tour-planner', params: { tour: String(placeId) } };
}

/**
 * What the plan's map draws for a route: the way itself, dashed while it is
 * only its stops joined straight; for the way a held change replaces, the old
 * line faint beside it.
 */
export function tourRouteLines(card: TourRouteCard, use: RouteUse): RouteLineSpec[] {
  if (use === 'before') {
    if (!card.previous) return [];
    const lines = [card.previous.line];
    return [{ id: 'previous', lines, color: 'var(--text-faint)', casing: ROUTE_PAINT.casing, dim: true }];
  }
  if (card.line.length < 2) return [];
  const line = card.line.map(([lat, lng]): [number, number] => [lat, lng]);
  const spec: RouteLineSpec = {
    id: 'route',
    lines: [line],
    color: ROUTE_PAINT.line,
    casing: ROUTE_PAINT.casing,
    dashed: !card.routed,
  };
  const stops = card.stops.flatMap((stop) => (stop.name ? [{ lat: stop.lat, lng: stop.lng, label: stop.name }] : []));
  const tints = card.routed ? hardStretches(card, line) : [];
  if (stops.length > 0) spec.stops = stops;
  if (tints.length > 0) spec.tints = tints;
  return [spec];
}

/** The hard grades' colours (styles/hike.css), from T3 on: the easy ones stay the way's own colour. */
const HARD_GRADE_PAINT: Readonly<Record<number, string>> = {
  3: 'var(--hike-sac-t3)',
  4: 'var(--hike-sac-t4)',
  5: 'var(--hike-sac-t5)',
  6: 'var(--hike-sac-t6)',
};

/**
 * The stretches graded T3 or harder, cut out of the line by how far along
 * it they lie (scaled to the route's own length, as the card measures its
 * stops), each in its grade's colour.
 */
function hardStretches(card: TourRouteCard, line: [number, number][]): NonNullable<RouteLineSpec['tints']> {
  const along = cumulativeMetres(card.line);
  const total = along[along.length - 1] ?? 0;
  const scale = card.distanceM !== null && total > 0 ? card.distanceM / total : 1;
  return card.stretches.flatMap((stretch) => {
    const color = stretch.facet === 'sac' ? HARD_GRADE_PAINT[stretch.step] : undefined;
    if (!color) return [];
    const part = line.filter((_, index) => {
      const at = (along[index] ?? 0) * scale;
      return at >= stretch.fromM && at <= stretch.toM;
    });
    return part.length >= 2 ? [{ line: part, color }] : [];
  });
}

export const TOUR_LOOK = {
  verbs: {
    addTour: { Icon: Route, tone: 'success', labelKey: 'assistant.change.verb.addTour' },
    updateTour: { Icon: Route, tone: 'info', labelKey: 'assistant.change.verb.updateTour' },
    markVisited: { Icon: CircleCheck, tone: 'success', labelKey: 'assistant.change.verb.markVisited' },
    markSkipped: { Icon: CircleSlash, tone: 'info', labelKey: 'assistant.change.verb.markSkipped' },
    markPlanned: { Icon: Circle, tone: 'info', labelKey: 'assistant.change.verb.markPlanned' },
    assignTrack: { Icon: Footprints, tone: 'success', labelKey: 'assistant.change.verb.assignTrack' },
    unassignTrack: { Icon: Footprints, tone: 'danger', labelKey: 'assistant.change.verb.unassignTrack' },
    excludeTour: { Icon: ChartNoAxesColumn, tone: 'info', labelKey: 'assistant.change.verb.excludeTour' },
    countTour: { Icon: ChartNoAxesColumn, tone: 'success', labelKey: 'assistant.change.verb.countTour' },
    linkPacking: { Icon: Luggage, tone: 'success', labelKey: 'assistant.change.verb.linkPacking' },
    unlinkPacking: { Icon: Luggage, tone: 'info', labelKey: 'assistant.change.verb.unlinkPacking' },
    reverseTour: { Icon: ArrowLeftRight, tone: 'info', labelKey: 'assistant.change.verb.reverseTour' },
    closeLoop: { Icon: Repeat, tone: 'info', labelKey: 'assistant.change.verb.closeLoop' },
    copyTour: { Icon: Copy, tone: 'success', labelKey: 'assistant.change.verb.copyTour' },
    setRouteColor: { Icon: Palette, tone: 'info', labelKey: 'assistant.change.verb.setRouteColor' },
    classifySki: { Icon: Snowflake, tone: 'info', labelKey: 'assistant.change.verb.classifySki' },
    setPaddlePlan: { Icon: Waves, tone: 'info', labelKey: 'assistant.change.verb.setPaddlePlan' },
    decideObstacles: { Icon: TriangleAlert, tone: 'info', labelKey: 'assistant.change.verb.decideObstacles' },
    restoreTrack: { Icon: History, tone: 'info', labelKey: 'assistant.change.verb.restoreTrack' },
    addTourStop: { Icon: MapPinPlus, tone: 'success', labelKey: 'assistant.change.verb.addTourStop' },
    removeTourStop: { Icon: MapPinMinus, tone: 'danger', labelKey: 'assistant.change.verb.removeTourStop' },
  },
  tools: {},
  steps: {
    propose_city_walk: { stepKey: 'assistant.step.planningWalk' },
    propose_tour: { stepKey: 'assistant.step.planningRoute' },
    plan_paddle_route: { stepKey: 'assistant.step.planningRoute' },
    plan_ski_route: { stepKey: 'assistant.step.planningRoute' },
    get_tour_plan: { stepKey: 'assistant.step.readingTour' },
    list_tours: { stepKey: 'assistant.step.readingTours' },
    find_tours_for_day: { stepKey: 'assistant.step.readingTours' },
    search_tour_pois: { stepKey: 'assistant.step.tourPois' },
    get_city_walk_progress: { stepKey: 'assistant.step.readingTour' },
    get_tour_trail_details: { stepKey: 'assistant.step.readingTour' },
    propose_round_hike: { stepKey: 'assistant.step.findingRounds' },
    propose_hike_leg_way: { stepKey: 'assistant.step.findingWays' },
    search_wanderer_trails: { stepKey: 'assistant.step.searchingWanderer' },
    preview_wanderer_trail: { stepKey: 'assistant.step.readingTrail' },
    check_tour_source: { stepKey: 'assistant.step.checkingSource' },
    // P7: a route file attached in the chat, read by the server into its tracks.
    read_tour_file: { stepKey: 'assistant.step.readingTourFile' },
  },
  entities: {
    tour: {
      Icon: Route,
      openLabelKey: 'assistant.card.tour.open',
      onMap: (applied, card) => {
        const placeId = tourIdOf(applied, card);
        return placeId === null ? null : { placeId, dayId: null };
      },
      open: (applied, card) => {
        const placeId = tourIdOf(applied, card);
        return placeId === null ? null : tourTarget(placeId);
      },
      // The phone opens a tour as its place on the plan, which the map pin beside it already does.
      phoneOpen: () => null,
    },
  },
  cards: {
    // Two or three ways of one activity proposed in one answer read as one card to choose from.
    tourRoute: {
      group: (card) => (card.source === 'proposal' ? `tourRoute:ways:${card.activity}` : 'tourRoute'),
      followUps: [
        { id: 'tourEasier', labelKey: 'assistant.followUp.tourEasier' },
        { id: 'tourPacking', labelKey: 'assistant.followUp.tourPacking' },
      ],
      lines: tourRouteLines,
      // A routed way draws its own line and stops: the pin of the place it adds would only cover its start.
      hidesEffectGhost: (card) => card.routed && card.line.length >= 2,
      hidesFoundPlaces: true,
    },
    tourList: {
      hidesFoundPlaces: true,
      followUps: [{ id: 'tourFit', labelKey: 'assistant.followUp.tourFit' }],
    },
  },
} satisfies PackLook<'tourRoute' | 'tourList'>;
