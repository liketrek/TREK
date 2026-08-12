/**
 * `drag-drop-touch` bridges native HTML5 drag-and-drop to touch so the planner's
 * place/day reordering works on touch input (#1265). It installs document-level touch
 * listeners on import and, on every single-finger touch, records the touchend time and
 * synthesises a `dblclick` when the next touch starts within 500 ms. On the map that
 * dblclick fires the default double-click-zoom, so two quick one-finger pans zoomed
 * instead of panning (#1440).
 *
 * Reorder DnD is disabled wherever the primary pointer is coarse (#1432), so the only
 * device class left with a job for the polyfill is the hybrid laptop: a mouse as the
 * primary pointer, with a touchscreen also available. Loading it anywhere else — notably
 * on tablets, which a width check misclassifies as desktop — re-arms the very gesture
 * hijack #1432 removed, and drags the #1440 phantom-dblclick along with it.
 */
export function maybeInstallTouchDragPolyfill(): Promise<unknown> | void {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(pointer: fine) and (any-pointer: coarse)').matches) return
  return import('drag-drop-touch')
}
