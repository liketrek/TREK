import type { AssistantApplied } from '@trek/shared';

import { plannerSearchOf, showOnMapTarget } from './assistantShowOnMap';

const applied = (entity: AssistantApplied['entity'], ids: number[], dayId: number | null): AssistantApplied => ({
  toolCallId: 'c1',
  entity,
  ids,
  dayId,
  undoUntil: null,
});

/** The planner's query for what "Show on map" points an applied change at. */
const searchOf = (change: AssistantApplied) => {
  const target = showOnMapTarget(change);
  return target ? plannerSearchOf({ kind: 'map', ...target }) : null;
};

describe('assistantShowOnMap', () => {
  it('FE-ASSIST-SHOW-001: a place goes to the place, even when it was put on a day', () => {
    expect(showOnMapTarget(applied('place', [7], 3))).toEqual({ placeId: 7, dayId: null });
    expect(searchOf(applied('place', [7], 3))).toBe('?place=7');
  });

  it('FE-ASSIST-SHOW-002: a stop, a note or a booking goes to its day', () => {
    expect(searchOf(applied('assignment', [41], 3))).toBe('?day=3');
    expect(searchOf(applied('day_note', [9], 4))).toBe('?day=4');
    expect(searchOf(applied('reservation', [5], 2))).toBe('?day=2');
  });

  it('FE-ASSIST-SHOW-003: no target where nothing shows on the map; a place without a spot opens the planner', () => {
    expect(showOnMapTarget(applied('packing', [2], null))).toBeNull();
    expect(showOnMapTarget(applied('tour', [], 3))).toBeNull();
    expect(showOnMapTarget(applied('memory', [], null))).toBeNull();
    expect(searchOf(applied('place', [], null))).toBe('');
  });

  it('FE-ASSIST-SHOW-005: an applied tour goes to its line on the plan, by the place it is', () => {
    expect(searchOf(applied('tour', [2], 3))).toBe('?place=2');
  });

  it('FE-ASSIST-SHOW-004: a tab of the trip goes as ?tab= with what the tab reads beside it', () => {
    const expense = plannerSearchOf({ kind: 'tab', tab: 'finanzplan', params: { expense: '7' } });
    expect(expense).toBe('?tab=finanzplan&expense=7');
    expect(plannerSearchOf({ kind: 'tab', tab: 'listen', sub: 'todo' })).toBe('?tab=listen');
  });
});
