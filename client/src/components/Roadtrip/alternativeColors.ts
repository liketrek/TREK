/**
 * How the offered routes are drawn, after Apple Maps.
 *
 * All of them blue, not one blue and the rest grey: they are all the same road network
 * and all equally drivable, so the difference between them is emphasis, not category. The
 * chosen one is the full-strength blue the route already uses; the others are a pale blue
 * that stays visible on a grey basemap — Positron is almost entirely greys, and a grey
 * line on it disappears, which is exactly what happened when these were grey.
 *
 * Fixed values rather than theme tokens: they have to match the blue the route itself is
 * drawn in, which is fixed too, and a token that shifted with the colour scheme would
 * break the pairing.
 */

/** The route as chosen — same blue as the drawn trip route. */
export const ALT_PRIMARY = '#0a84ff'
/** The other offers: unmistakably blue, unmistakably secondary. */
export const ALT_SECONDARY = '#7eb8f0'
/** Under both, so either reads on a pale map, a dark one or a satellite tile. */
export const ALT_CASING = '#ffffff'

/**
 * The label colours, again after Apple: the chosen route's time is a filled blue pill,
 * the alternatives' are near-black. Both carry white text.
 */
export const ALT_LABEL_PRIMARY_BG = '#0a84ff'
export const ALT_LABEL_SECONDARY_BG = '#2b2f36'
export const ALT_LABEL_TEXT = '#ffffff'
