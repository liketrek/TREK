import { z } from 'zod';

/**
 * SKI-02: a ski and winter tour, planned in the planner or imported from a
 * GPX file. A planned one has its legs planned by the piste router where the
 * piste data reaches (runs, lifts, cross-country trails, ski touring and
 * winter paths from OpenStreetMap), and drawn straight where it does not; an
 * imported one is kept as it was recorded. A ski time is worked out only for
 * legs the router planned, and nothing is said about snow, avalanches or
 * whether a run or a trail is open. What the traveller names on purpose is
 * the discipline: alpine, snowboard, cross-country, ski touring, snowshoeing
 * or winter hiking (both of which live here and not on a hike), and for
 * cross-country the technique.
 */
export const SKI_DISCIPLINES = ['alpine', 'snowboard', 'cross_country', 'touring', 'snowshoe', 'winter_hike'] as const;
export const skiDisciplineSchema = z.enum(SKI_DISCIPLINES);
export type SkiDiscipline = z.infer<typeof skiDisciplineSchema>;

/**
 * How a cross-country track is skied. `unknown` is an answer the skier gives
 * on purpose (a borrowed track, a mixed day), not a gap TREK fills in; every
 * other discipline has no technique at all.
 */
export const SKI_TECHNIQUES = ['classic', 'skating', 'unknown'] as const;
export const skiTechniqueSchema = z.enum(SKI_TECHNIQUES);
export type SkiTechnique = z.infer<typeof skiTechniqueSchema>;

type SkiIssue = { path: string[]; message: string };

/**
 * What a ski tour names, and what nothing else may: a ski tour its
 * discipline, a cross-country tour its technique as well; a technique on any
 * other discipline, and either field on another type, is refused. Planned and
 * imported ski tours are held to the same rule.
 */
export function skiIssues(
  isSki: boolean,
  value: { ski_discipline?: SkiDiscipline | null; ski_technique?: SkiTechnique | null },
): SkiIssue[] {
  if (!isSki) {
    return (['ski_discipline', 'ski_technique'] as const)
      .filter((field) => value[field] != null)
      .map((field) => ({ path: [field], message: `${field} belongs to a ski tour` }));
  }
  if (value.ski_discipline == null) return [{ path: ['ski_discipline'], message: 'a ski tour needs a discipline' }];
  const crossCountry = value.ski_discipline === 'cross_country';
  if (crossCountry && value.ski_technique == null)
    return [{ path: ['ski_technique'], message: 'a cross-country tour needs a technique' }];
  if (!crossCountry && value.ski_technique != null)
    return [{ path: ['ski_technique'], message: 'only a cross-country tour has a technique' }];
  return [];
}

/**
 * A ski tour classified again after its import: the discipline and the
 * technique, nothing of the track. Refused with a 409 once the tour moved on
 * past the revision the choice was made at.
 */
export const tourSkiClassificationRequestSchema = z
  .object({
    ski_discipline: skiDisciplineSchema,
    ski_technique: skiTechniqueSchema.nullable().optional(),
    /** P2C-03: the revision the classification was made at. */
    expected_revision: z.number().int().min(1).nullable().optional(),
  })
  .superRefine((value, ctx) =>
    skiIssues(true, value).forEach((issue) => ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue })),
  );
export type TourSkiClassificationRequest = z.infer<typeof tourSkiClassificationRequestSchema>;

/** The run difficulties a skier may set as a limit, easiest first (freeride and extreme are a switch of their own). */
export const SKI_DIFFICULTIES = ['novice', 'easy', 'intermediate', 'advanced', 'expert'] as const;
export const skiDifficultySchema = z.enum(SKI_DIFFICULTIES);
export type SkiDifficulty = z.infer<typeof skiDifficultySchema>;

/** The kinds of lift a skier may leave out: surface lifts, open chairs, gondolas, cable cars and rail. */
export const SKI_LIFT_CLASSES = ['drag', 'open_chair', 'gondola', 'cable_car', 'rail'] as const;
export const skiLiftClassSchema = z.enum(SKI_LIFT_CLASSES);
export type SkiLiftClass = z.infer<typeof skiLiftClassSchema>;

/** What the router weighs most: the quickest way, the most skiing, or the easiest runs. */
export const SKI_ROUTE_PRIORITIES = ['fastest', 'most_skiing', 'easiest'] as const;
export type SkiRoutePriority = (typeof SKI_ROUTE_PRIORITIES)[number];

/** How fast the skier goes down a run, against an average skier. */
export const SKI_PACES = ['relaxed', 'normal', 'sporty'] as const;
export type SkiPace = (typeof SKI_PACES)[number];

/**
 * What the piste router is asked for besides the discipline. Every field has
 * its default, so an empty object is a complete answer. `use_lifts` left out
 * means the discipline's own default: lifts for alpine and snowboard, none for
 * the others.
 */
export const skiRouteOptionsSchema = z
  .object({
    max_difficulty: skiDifficultySchema.default('intermediate'),
    allow_freeride: z.boolean().default(false),
    avoid_lifts: z.array(skiLiftClassSchema).max(SKI_LIFT_CLASSES.length).default([]),
    allow_lift_down: z.boolean().default(true),
    priority: z.enum(SKI_ROUTE_PRIORITIES).default('fastest'),
    pace: z.enum(SKI_PACES).default('normal'),
    groomed_only: z.boolean().default(false),
    lit_only: z.boolean().default(false),
    touring_uphill_on_pistes: z.boolean().default(false),
    use_lifts: z.boolean().optional(),
    avoid_inferred_links: z.boolean().default(false),
  })
  .strict();
export type SkiRouteOptions = z.infer<typeof skiRouteOptionsSchema>;
export type SkiRouteOptionsInput = z.input<typeof skiRouteOptionsSchema>;

export const DEFAULT_SKI_ROUTE_OPTIONS: SkiRouteOptions = skiRouteOptionsSchema.parse({});

/** Disciplines that ride lifts unless the skier says otherwise. */
const LIFTS_BY_DEFAULT: ReadonlySet<SkiDiscipline> = new Set(['alpine', 'snowboard']);

/** Whether a discipline rides lifts with these options: the skier's word, else the discipline's default. */
export function skiUsesLifts(discipline: SkiDiscipline, options: Pick<SkiRouteOptions, 'use_lifts'>): boolean {
  return options.use_lifts ?? LIFTS_BY_DEFAULT.has(discipline);
}

/** The options a downhill skier reads, on skis or a board. */
const DOWNHILL_OPTIONS: ReadonlyArray<keyof SkiRouteOptions> = [
  'max_difficulty',
  'allow_freeride',
  'avoid_lifts',
  'allow_lift_down',
  'priority',
  'pace',
  'use_lifts',
  'avoid_inferred_links',
];

/** The options each discipline reads; the rest are put back to their defaults. */
const OPTIONS_BY_DISCIPLINE: Record<SkiDiscipline, ReadonlyArray<keyof SkiRouteOptions>> = {
  alpine: DOWNHILL_OPTIONS,
  snowboard: DOWNHILL_OPTIONS,
  cross_country: ['groomed_only', 'lit_only', 'use_lifts', 'avoid_inferred_links'],
  touring: [
    'max_difficulty',
    'allow_freeride',
    'avoid_lifts',
    'allow_lift_down',
    'touring_uphill_on_pistes',
    'use_lifts',
    'avoid_inferred_links',
  ],
  snowshoe: ['allow_lift_down', 'use_lifts', 'avoid_inferred_links'],
  winter_hike: ['allow_lift_down', 'use_lifts', 'avoid_inferred_links'],
};

/** The options a discipline reads, the ones the planner offers for it. */
export function skiOptionsReadBy(discipline: SkiDiscipline): ReadonlyArray<keyof SkiRouteOptions> {
  return OPTIONS_BY_DISCIPLINE[discipline];
}

/**
 * The options as a discipline reads them: whatever belongs to another
 * discipline goes back to its default rather than being refused, so switching
 * the discipline keeps a request that is valid as it is.
 */
export function skiOptionsForDiscipline(discipline: SkiDiscipline, options: SkiRouteOptionsInput): SkiRouteOptions {
  const parsed = skiRouteOptionsSchema.parse(options);
  const kept = new Set(OPTIONS_BY_DISCIPLINE[discipline]);
  const result: Record<string, unknown> = { ...DEFAULT_SKI_ROUTE_OPTIONS };
  for (const key of Object.keys(parsed) as Array<keyof SkiRouteOptions>) {
    if (kept.has(key)) result[key] = parsed[key];
  }
  if (!kept.has('use_lifts') || parsed.use_lifts === undefined) delete result.use_lifts;
  return result as SkiRouteOptions;
}

/**
 * The legs of a ski tour the piste router planned, each named by the index of
 * the control point it starts at; the others were drawn straight or by hand.
 */
export const skiPlannedLegsSchema = z.array(z.number().int().nonnegative()).max(5000);

/** The name of a piste data build a ski tour's legs were planned on, as the Places host names it. */
export const skiRouteBuildSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[0-9A-Za-z._-]+$/);
