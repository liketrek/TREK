/**
 * The drop shadow every floating map control carries.
 *
 * Tighter and darker than `--sidebar-shadow`, which is built for a panel resting on
 * the app background: over map tiles its 0.10 alpha spread over 32px all but
 * disappears, so a round control read as painted onto the map rather than floating
 * above it. This is the locate button's shadow, which was always the odd one out for
 * exactly that reason — the others were the ones that needed to match it.
 */
export const MAP_CONTROL_SHADOW = '0 2px 10px rgba(0,0,0,0.25)'
