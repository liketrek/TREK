import type { CardReader, PreviewContext, ToolArgs } from '../card-types';
import { clipped, finite, recordOf, type Row } from '../card-values';
import type { RoadtripRulesCard, RoadtripSettingChange } from '@trek/shared';

/**
 * The card of a change to the rules a road trip drives by: the driving
 * settings update_roadtrip_settings changes, each read against what is saved
 * now (`get_roadtrip_settings`, once per turn), and where set_day_boundary
 * makes a day end. Values travel as the planner stores them; the client
 * words them.
 */

/** The saved settings, as get_roadtrip_settings answers them. */
export interface SavedSettings {
  settings: Row;
}

const MAX_SETTINGS = 24;
const KEY = /^roadtrip_[a-z0-9_]{1,40}$/;

/** A setting's value as the card carries it; anything else reads as not set. */
function settingValue(value: unknown): RoadtripSettingChange['after'] {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.slice(0, 40);
  const number = finite(value);
  return number === null || number < 0 ? null : Math.min(100_000, number);
}

/** The saved settings; null when the read failed. */
export async function loadSavedSettings(_args: ToolArgs, read: CardReader): Promise<SavedSettings | null> {
  const answer = await read('get_roadtrip_settings', {});
  return answer && typeof answer === 'object' ? { settings: recordOf(recordOf(answer).settings) } : null;
}

/** The settings a call changes, each from what is saved now to what it asks for. */
export function settingChanges(args: ToolArgs, saved: SavedSettings | null): RoadtripSettingChange[] {
  return Object.entries(recordOf(args.settings))
    .filter(([key]) => KEY.test(key))
    .slice(0, MAX_SETTINGS)
    .map(([key, value]) => ({
      key,
      before: saved ? settingValue(saved.settings[key]) : null,
      after: settingValue(value),
    }));
}

/** update_roadtrip_settings as a card; none for a call that changes nothing it can name. */
export function settingsCard(
  _ctx: PreviewContext,
  args: ToolArgs,
  saved: SavedSettings | null,
): RoadtripRulesCard | null {
  const settings = settingChanges(args, saved);
  return settings.length > 0 ? { kind: 'roadtripRules', settings, dayEnd: null } : null;
}

/** The name of the place an assignment of the trip stands for. */
function stopName(ctx: PreviewContext, assignmentId: unknown): string | null {
  if (typeof assignmentId !== 'number') return null;
  const assignment = ctx.card.assignments.get(assignmentId);
  return assignment ? clipped(ctx.card.places.get(assignment.placeId)?.name, 80) : null;
}

/** Where set_day_boundary makes the day end: at a stop, part way along a drive, or automatically again. */
export function dayEndOf(ctx: PreviewContext, args: ToolArgs): RoadtripRulesCard['dayEnd'] {
  const dayNumber = finite(args.dayNumber);
  if (dayNumber === null || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 999) return null;
  const dayId = ctx.card.days.find((day) => day.number === dayNumber)?.id ?? null;
  if (args.boundary === null) return { dayId, dayNumber, mode: 'auto', from: null, to: null, percent: null };
  const boundary = recordOf(args.boundary);
  const from = stopName(ctx, boundary.from_assignment_id);
  if (boundary.to_assignment_id === null || boundary.to_assignment_id === undefined) {
    return { dayId, dayNumber, mode: 'stop', from, to: null, percent: null };
  }
  const fraction = finite(boundary.fraction);
  return {
    dayId,
    dayNumber,
    mode: 'along',
    from,
    to: stopName(ctx, boundary.to_assignment_id),
    percent: fraction === null ? null : Math.round(Math.min(1, Math.max(0, fraction)) * 100),
  };
}

/** set_day_boundary as a card. */
export function dayEndCard(ctx: PreviewContext, args: ToolArgs): RoadtripRulesCard | null {
  const dayEnd = dayEndOf(ctx, args);
  return dayEnd ? { kind: 'roadtripRules', settings: [], dayEnd } : null;
}
