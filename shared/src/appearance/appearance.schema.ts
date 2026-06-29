import { z } from 'zod';

/**
 * Appearance contract — the per-user "look & feel" config stored as ONE JSON
 * blob under the `appearance` settings key (see /api/settings). Shared by the
 * server (validation on write) and the client (the single DOM writer
 * applyAppearance + the pre-paint boot script).
 *
 * Design rules that keep this safe and non-breaking:
 *  - DEFAULT_APPEARANCE reproduces TREK's current look byte-for-byte, so a user
 *    with no `appearance` key (or a malformed one) is indistinguishable from
 *    today.
 *  - Every field is individually resilient (`.catch` + `.default`) and
 *    normalizeAppearance() never throws — a bad blob can never reach the DOM.
 *  - Unknown future fields are stripped, and an unrecognised `version` collapses
 *    to the known default rather than mis-applying.
 */

/** Curated v1 color schemes (light + dark token sets live client-side). */
export const APPEARANCE_PRESET_SCHEMES = [
  'default', // monochrome — today's look, sets no data-scheme attribute
  'highContrast', // raises neutral text/border contrast (#951/#1025)
  'indigo', // TREK's classic indigo accent
  'teal', // calm green-blue
  'rose', // warm rose/coral
  'amber', // warm gold/sunrise
  'violet', // purple/plum
] as const;

/** All selectable scheme ids, including the user-defined custom accent. */
export const APPEARANCE_SCHEME_IDS = [...APPEARANCE_PRESET_SCHEMES, 'custom'] as const;

export type AppearanceSchemeId = (typeof APPEARANCE_SCHEME_IDS)[number];

export const APPEARANCE_DENSITIES = ['comfortable', 'compact'] as const;
export type AppearanceDensity = (typeof APPEARANCE_DENSITIES)[number];

/** Text-tier scale bounds — clamped so layouts never blow out. */
export const APPEARANCE_SCALE_MIN = 0.8;
export const APPEARANCE_SCALE_MAX = 1.6;

const clampScale = (n: number): number =>
  Number.isFinite(n) ? Math.min(APPEARANCE_SCALE_MAX, Math.max(APPEARANCE_SCALE_MIN, n)) : 1;

/** #RGB or #RRGGBB — solid colors only (alpha would break accent-text derivation). */
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

const scaleField = z.number().catch(1).default(1);

const typeScaleSchema = z
  .object({
    title: scaleField,
    subtitle: scaleField,
    body: scaleField,
    caption: scaleField,
  })
  .catch({ title: 1, subtitle: 1, body: 1, caption: 1 })
  .default({ title: 1, subtitle: 1, body: 1, caption: 1 });

// ── Dashboard widget visibility (per device) ──────────────────────────────
// Consumed by the Dashboard for conditional rendering + column reflow — NOT by
// the DOM token writer. Desktop and mobile are independent so a widget can be
// shown on one and hidden on the other. All-true = today's full layout.
const widgetFlag = z.boolean().catch(true).default(true);

const DEFAULT_DASHBOARD_DESKTOP = {
  sidebar: true, // master toggle for the whole right sidebar (off → center)
  currency: true,
  timezones: true,
  upcomingReservations: true,
  atlas: true, // the "countries visited" passport tile
  tripsTotal: true,
  daysTraveled: true,
  distanceFlown: true,
};
const DEFAULT_DASHBOARD_MOBILE = {
  tripsTotal: true,
  daysTraveled: true,
  currency: true,
  timezones: true,
  upcomingReservations: true,
};
export const DEFAULT_DASHBOARD_WIDGETS = {
  desktop: DEFAULT_DASHBOARD_DESKTOP,
  mobile: DEFAULT_DASHBOARD_MOBILE,
};

const dashboardWidgetsSchema = z
  .object({
    desktop: z
      .object({
        sidebar: widgetFlag,
        currency: widgetFlag,
        timezones: widgetFlag,
        upcomingReservations: widgetFlag,
        atlas: widgetFlag,
        tripsTotal: widgetFlag,
        daysTraveled: widgetFlag,
        distanceFlown: widgetFlag,
      })
      .catch(DEFAULT_DASHBOARD_DESKTOP)
      .default(DEFAULT_DASHBOARD_DESKTOP),
    mobile: z
      .object({
        tripsTotal: widgetFlag,
        daysTraveled: widgetFlag,
        currency: widgetFlag,
        timezones: widgetFlag,
        upcomingReservations: widgetFlag,
      })
      .catch(DEFAULT_DASHBOARD_MOBILE)
      .default(DEFAULT_DASHBOARD_MOBILE),
  })
  .catch(DEFAULT_DASHBOARD_WIDGETS)
  .default(DEFAULT_DASHBOARD_WIDGETS);

export const appearanceConfigSchema = z.object({
  version: z.literal(1).catch(1).default(1),
  schemeId: z.enum(APPEARANCE_SCHEME_IDS).catch('default').default('default'),
  // Only consulted when schemeId === 'custom'. {light, dark} so the picker can
  // tune each mode independently.
  accent: z.object({ light: hexColor, dark: hexColor }).nullable().catch(null).default(null),
  // true = translucency ON (today's behaviour). false = solid surfaces.
  transparency: z.boolean().catch(true).default(true),
  typeScale: typeScaleSchema,
  fontScale: scaleField,
  density: z.enum(APPEARANCE_DENSITIES).catch('comfortable').default('comfortable'),
  reduceMotion: z.boolean().catch(false).default(false),
  // Per-device dashboard widget visibility (not a DOM token — read by the Dashboard).
  dashboard: dashboardWidgetsSchema,
});

export type AppearanceConfig = z.infer<typeof appearanceConfigSchema>;

/** The neutral default — must equal TREK's current appearance exactly. */
export const DEFAULT_APPEARANCE: AppearanceConfig = {
  version: 1,
  schemeId: 'default',
  accent: null,
  transparency: true,
  typeScale: { title: 1, subtitle: 1, body: 1, caption: 1 },
  fontScale: 1,
  density: 'comfortable',
  reduceMotion: false,
  dashboard: DEFAULT_DASHBOARD_WIDGETS,
};

/**
 * Coerce any stored/posted value into a valid AppearanceConfig. Never throws:
 * a non-object, partial, malformed, or future-versioned blob degrades to the
 * neutral default (field-by-field where possible). Used on the server before
 * persisting and on the client before touching the DOM.
 */
export function normalizeAppearance(raw: unknown): AppearanceConfig {
  const input = raw && typeof raw === 'object' ? raw : {};
  const parsed = appearanceConfigSchema.safeParse(input);
  const cfg = parsed.success ? parsed.data : { ...DEFAULT_APPEARANCE };
  return {
    ...cfg,
    fontScale: clampScale(cfg.fontScale),
    typeScale: {
      title: clampScale(cfg.typeScale.title),
      subtitle: clampScale(cfg.typeScale.subtitle),
      body: clampScale(cfg.typeScale.body),
      caption: clampScale(cfg.typeScale.caption),
    },
  };
}
