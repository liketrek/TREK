/**
 * FE-AI-TOUR-017 to FE-AI-TOUR-020
 *
 * The tours' part of the chat's pure look: the verbs drawn with the route
 * icon, the reading steps named, an applied tour shown by its line and opened
 * in the Tours tab (on the phone, which has none, by its pin), proposals of
 * one activity grouped as ways, and the lines the plan's map draws for a
 * route and for the way a change replaces.
 */
import type { AssistantApplied } from '@trek/shared';
import { Route } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { GENTLE, HIKE, HIKE_LINE, SAVED } from '../../../../../tests/helpers/assistantTour';
import { CARD_MAP_LOOK, CARD_RULES, ENTITY_LOOK, STEP_LOOKS, VERB_LOOK } from '../cardLooks';
import { tourRouteLines } from './tourLook';

const applied = (ids: number[]): AssistantApplied => ({
  toolCallId: 'c1',
  entity: 'tour',
  ids,
  dayId: 3,
  undoUntil: null,
});

describe('tourLook', () => {
  it('FE-AI-TOUR-017: adding and changing a tour wear the route icon, and the tour reads have their steps', () => {
    expect(VERB_LOOK.addTour).toMatchObject({ Icon: Route, tone: 'success' });
    expect(VERB_LOOK.updateTour).toMatchObject({ Icon: Route, tone: 'info' });
    expect(STEP_LOOKS.propose_city_walk?.stepKey).toBe('assistant.step.planningWalk');
    expect(STEP_LOOKS.plan_ski_route?.stepKey).toBe('assistant.step.planningRoute');
    expect(STEP_LOOKS.find_tours_for_day?.stepKey).toBe('assistant.step.readingTours');
  });

  it('FE-AI-TOUR-018: an applied tour shows its line on the plan and opens in the Tours tab, on the phone by its pin alone', () => {
    const tour = ENTITY_LOOK.tour;
    expect(tour.openLabelKey).toBe('assistant.card.tour.open');
    expect(tour.phoneOpen?.(applied([41]), null)).toBeNull();
    expect(tour.onMap?.(applied([41]), null)).toEqual({ placeId: 41, dayId: null });
    expect(tour.open?.(applied([41]), null)).toEqual({ kind: 'tab', tab: 'tour-planner', params: { tour: '41' } });
    expect(tour.onMap?.(applied([]), SAVED)).toEqual({ placeId: 41, dayId: null });
    expect(tour.onMap?.(applied([]), null)).toBeNull();
    expect(tour.open?.(applied([]), HIKE)).toBeNull();
  });

  it('FE-AI-TOUR-019: proposals of one activity share a group, so an answer shows them as ways', () => {
    expect(CARD_RULES.group(HIKE)).toBe('tourRoute:ways:hike');
    expect(CARD_RULES.group(GENTLE)).toBe('tourRoute:ways:hike');
    expect(CARD_RULES.group({ ...HIKE, activity: 'walk' })).toBe('tourRoute:ways:walk');
    expect(CARD_RULES.group(SAVED)).toBe('tourRoute');
  });

  it('FE-AI-TOUR-020: the map draws the route with its named stops and hard grades, dashed while straight, the replaced way faint, and no pin over a routed way', () => {
    expect(CARD_MAP_LOOK.lines(HIKE, 'look')).toEqual([
      {
        id: 'route',
        lines: [HIKE_LINE.map(([lat, lng]) => [lat, lng])],
        color: 'var(--hike-variant-current)',
        casing: 'var(--bike-highlight-casing)',
        dashed: false,
        stops: [
          { lat: 47.77, lng: 12.59, label: 'Bergen' },
          { lat: 47.78, lng: 12.59, label: 'Strausshütte' },
          { lat: 47.795, lng: 12.59, label: 'Hochfelln' },
          { lat: 47.77, lng: 12.59, label: 'Bergen' },
        ],
        tints: [
          {
            line: [
              [47.79, 12.62],
              [47.795, 12.625],
            ],
            color: 'var(--hike-sac-t3)',
          },
        ],
      },
    ]);
    expect(tourRouteLines({ ...HIKE, routed: false }, 'pending')[0]?.dashed).toBe(true);
    expect(tourRouteLines({ ...HIKE, routed: false }, 'pending')[0]?.tints).toBeUndefined();
    expect(tourRouteLines(HIKE, 'before')).toEqual([]);
    const line = HIKE_LINE.map(([lat, lng]): [number, number] => [lat, lng]);
    const previous = { line, distanceM: 1, ascentM: null, minutes: null };
    expect(tourRouteLines({ ...HIKE, previous }, 'before')).toEqual([
      { id: 'previous', lines: [line], color: 'var(--text-faint)', casing: 'var(--bike-highlight-casing)', dim: true },
    ]);
    expect(tourRouteLines({ ...HIKE, line: [] }, 'look')).toEqual([]);
    expect(CARD_MAP_LOOK.hidesEffectGhost(HIKE)).toBe(true);
    expect(CARD_MAP_LOOK.hidesEffectGhost({ ...HIKE, routed: false })).toBe(false);
  });
});
