/**
 * `drag-drop-touch` bridges native HTML5 drag-and-drop to touch so the planner's
 * place/day reordering works on touch input (#1265). It installs document-level touch
 * listeners on import and, on every single-finger touch, records the touchend time and
 * synthesises a `dblclick` when the next touch starts within 500 ms. On the map that
 * dblclick fires the default double-click-zoom, so two quick one-finger pans zoomed
 * instead of panning (#1440).
 *
 * The hybrid laptop is the only device class left with a job for it: a mouse as the
 * primary pointer, with a touchscreen also available. Loading it anywhere else re-arms
 * the very gesture hijack #1432 removed, and drags the #1440 phantom-dblclick along
 * with it. Coarse-pointer devices get touchDragBridge instead, which waits out a long
 * press before it claims a gesture and so leaves scrolling alone (#1616).
 */
export function maybeInstallTouchDragPolyfill(): Promise<unknown> | void {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(pointer: fine) and (any-pointer: coarse)').matches) return
  return import('drag-drop-touch')
}
