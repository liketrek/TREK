import { type AssistantApplied, cumulativeMetres, type TourRouteCard, type TrekCard } from '@trek/shared';
import { Route } from 'lucide-react';

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
  },
  tools: {},
  steps: {
    propose_city_walk: { stepKey: 'assistant.step.planningWalk' },
    plan_paddle_route: { stepKey: 'assistant.step.planningRoute' },
    plan_ski_route: { stepKey: 'assistant.step.planningRoute' },
    get_tour_plan: { stepKey: 'assistant.step.readingTour' },
    list_tours: { stepKey: 'assistant.step.readingTours' },
    find_tours_for_day: { stepKey: 'assistant.step.readingTours' },
    search_tour_pois: { stepKey: 'assistant.step.tourPois' },
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
