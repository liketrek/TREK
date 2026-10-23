import type { AssistantApplied, TrekCard } from '@trek/shared';

import { entityLookOf } from './cards/cardLooks';
import type { EntityTarget } from './cards/cardTypes';

interface ShowOnMapTarget {
  /** The place the change made or changed. */
  placeId: number | null;
  /** The day it lives on, for a note or a stop. */
  dayId: number | null;
}

/**
 * Where "Show on map" takes an applied change, as its entity's look says: a
 * place shows itself, a stop or a note its day. Null for what has no place on
 * the map (a kept note, a to-do), which then shows no map button at all.
 */
export function showOnMapTarget(applied: AssistantApplied, card: TrekCard | null = null): ShowOnMapTarget | null {
  return entityLookOf(applied.entity).onMap?.(applied, card) ?? null;
}

/**
 * The planner's query for a target on the trip: `?place=` opens the place,
 * `?day=` selects the day, and a tab goes as `?tab=` with whatever the tab
 * reads beside it (`?tab=finanzplan&expense=7`).
 */
export function plannerSearchOf(target: Exclude<EntityTarget, { kind: 'page' }>): string {
  if (target.kind === 'tab') return `?${new URLSearchParams({ tab: target.tab, ...target.params }).toString()}`;
  if (target.placeId !== null) return `?place=${target.placeId}`;
  if (target.dayId !== null) return `?day=${target.dayId}`;
  return '';
}
