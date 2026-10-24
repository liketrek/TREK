import { recordOf, type Row } from './cards/card-values';
import { haversineMetres } from '@trek/shared';
import { SUPPORTED_LANGUAGE_CODES } from '@trek/shared/i18n';

/**
 * "Plan this" on a paddle or ski plan an answer showed (plan_paddle_route,
 * plan_ski_route): the create it holds, from the plan's own arguments and
 * its answer read again whole. The legs of a plan must run on from one to
 * the next to be one tour; its points are the first leg's start and every
 * leg's end. A paddle tour's water is read from the plan (a river where any
 * stretch is on running water, else a lake), its name from the waters it
 * runs on, a ski tour's from its ski areas; where neither names one, the
 * tour type's own word in the user's language.
 */

/** The plans a tour can be taken from, and the create each one is saved through. */
export const SPORT_CREATES = {
  plan_paddle_route: 'create_paddle_tour',
  plan_ski_route: 'create_ski_tour',
} as const;
export type SportPlanTool = keyof typeof SPORT_CREATES;

/** Whether a tool is one of the plans a tour can be taken from. */
export function isSportPlan(toolName: string): toolName is SportPlanTool {
  return Object.hasOwn(SPORT_CREATES, toolName);
}

/** How near one leg's end must lie to the next leg's start for the two to be one tour, in metres. */
const JOINED_M = 5;
/** The longest name a tour is given from its waters or areas, well inside a tour's name. */
const NAME_CHARS = 120;

/** A point as the plan names it, or null. */
function pointOf(value: unknown): { lat: number; lng: number } | null {
  const point = recordOf(value);
  return typeof point.lat === 'number' && typeof point.lng === 'number' ? { lat: point.lat, lng: point.lng } : null;
}

/** The points of a plan's legs, the first leg's start then every leg's end; null where the legs do not join. */
export function waypointsOfLegs(legs: unknown): Array<{ lat: number; lng: number }> | null {
  const rows = Array.isArray(legs) ? legs.map(recordOf) : [];
  const first = pointOf(rows[0]?.from);
  if (!first) return null;
  const points = [first];
  for (const [index, leg] of rows.entries()) {
    const from = pointOf(leg.from);
    const to = pointOf(leg.to);
    const before = points[index];
    if (!from || !to || !before || haversineMetres(before.lat, before.lng, from.lat, from.lng) > JOINED_M) return null;
    points.push(to);
  }
  return points.length >= 2 ? points : null;
}

/** Each planned leg of an answer; null where one failed, which takes the whole plan out of reach. */
function plannedLegs(result: Row): Row[] | null {
  const legs = Array.isArray(result.legs) ? result.legs.map(recordOf) : [];
  return legs.length > 0 && legs.every((leg) => leg.status === 'ok') ? legs : null;
}

/** "Isar → Ammersee": the first and last names given, each once, clipped. */
function namedAlong(names: readonly unknown[]): string {
  const kept = names.flatMap((name) => (typeof name === 'string' && name.trim() !== '' ? [name.trim()] : []));
  const ends = [...new Set([kept[0], kept.at(-1)])].filter((name): name is string => !!name);
  const name = ends.join(' → ');
  return name.length > NAME_CHARS ? `${name.slice(0, NAME_CHARS - 1)}…` : name;
}

/** The water a paddle plan runs on: a river where any stretch is on running water, else a lake. */
function waterOf(legs: readonly Row[]): 'river' | 'lake' {
  const kinds = legs.flatMap((leg) => (Array.isArray(leg.segments) ? leg.segments.map((s) => recordOf(s).kind) : []));
  return kinds.some((kind) => kind === 'water' || kind === 'rapids' || kind === 'pass') ? 'river' : 'lake';
}

/**
 * The create a taken paddle or ski plan holds: its points, the plan's own
 * settings and a name; null where a leg failed or the legs do not join.
 */
export function sportTakeArgsOf(toolName: SportPlanTool, args: Row, result: Row, fallbackName: string): Row | null {
  const legs = plannedLegs(result);
  const waypoints = waypointsOfLegs(args.legs);
  if (!legs || !waypoints) return null;
  const via = SPORT_CREATES[toolName];
  if (via === 'create_paddle_tour') {
    const waters = legs.flatMap((leg) =>
      Array.isArray(leg.segments) ? leg.segments.map((s) => recordOf(s).name) : [],
    );
    const take: Row = { via, name: namedAlong(waters) || fallbackName, waypoints, water_context: waterOf(legs) };
    if (args.boat !== undefined) take.boat_type = args.boat;
    if (args.lake_style !== undefined) take.lake_style = args.lake_style;
    if (args.lock_policy !== undefined) take.lock_policy = args.lock_policy;
    return take;
  }
  const areas = Array.isArray(result.area_names) ? result.area_names : [];
  const take: Row = { via, name: namedAlong(areas) || fallbackName, waypoints, discipline: args.discipline };
  if (args.technique !== undefined && args.technique !== null) take.technique = args.technique;
  if (args.options !== undefined) take.options = args.options;
  return take;
}

/** The locale key each plan's tour type is named by. */
const TYPE_WORD_KEYS: Readonly<Record<SportPlanTool, string>> = {
  plan_paddle_route: 'tourTypes.kayak',
  plan_ski_route: 'tourTypes.ski',
};

/** The words of one locale's table, or none when it cannot be read. */
async function wordsOf(language: string): Promise<Record<string, unknown>> {
  try {
    // A supported code only, so the path is one of the package's own locale entries.
    const loaded: unknown = await import(`@trek/shared/i18n/${language}`);
    const words = (loaded as { default?: unknown } | null)?.default;
    return words !== null && typeof words === 'object' ? (words as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A plan's tour type in the user's language ("Paddeltour"), English where the language has no table. */
export async function tourTypeWord(locale: string, toolName: SportPlanTool): Promise<string> {
  const language = locale.split('-')[0] ?? 'en';
  const code = SUPPORTED_LANGUAGE_CODES.includes(locale)
    ? locale
    : SUPPORTED_LANGUAGE_CODES.includes(language)
      ? language
      : 'en';
  const key = TYPE_WORD_KEYS[toolName];
  const own = (await wordsOf(code))[key];
  if (typeof own === 'string') return own;
  const english = (await wordsOf('en'))[key];
  return typeof english === 'string' ? english : 'Tour';
}
