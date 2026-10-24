/*
 * The surfaces the day plan draws its rows and day heads on: the class strings
 * of the white controls a row and a route bar carry, and the colour mixes a day
 * head and a pinned stop take. Mixed from the scheme's tokens, so they follow
 * the user's accent and both themes.
 */

/** The round white button a row carries on its right (a route on the map, a journey's legs). */
export const ROW_ROUND = 'grid flex-none place-items-center rounded-full bg-surface-card shadow-sm transition-colors';
/** The white face every control of a day's route bar shares, so the row reads as one set. */
export const ROUTE_TOOL = 'bg-surface-card shadow-sm ring-1 ring-edge-faint';

// The day head's tones: hovered, open, and a drop landing on it. Mixed from the
// accent so they follow the user's scheme in both themes.
export const DAY_HEAD_HOVER = 'color-mix(in srgb, var(--accent) 10%, transparent)';
export const DAY_HEAD_SELECTED = 'color-mix(in srgb, var(--accent) 12%, transparent)';
export const DAY_HEAD_DROP = 'color-mix(in srgb, var(--accent) 9%, transparent)';
// A stop pinned in place: a whisper of the danger tone on the row, a stronger one over its avatar.
export const LOCKED_ROW = 'color-mix(in srgb, var(--danger) 7%, transparent)';
export const LOCK_OVERLAY = 'color-mix(in srgb, var(--danger) 62%, transparent)';
export const LOCK_OVERLAY_HOVER = 'color-mix(in srgb, var(--danger) 42%, transparent)';
