/**
 * `drag-drop-touch` bridges native HTML5 drag-and-drop to touch so the planner's
 * place/day reordering works on touch input (#1265). It installs document-level touch
 * listeners on import and, on every single-finger touch, records the touchend time and
 * synthesises a `dblclick` when the next touch starts within 500 ms. On the map that
 * dblclick fires the default double-click-zoom, so two quick one-finger pans zoomed
 * instead of panning (#1440).
 *
 * Reorder DnD is disabled on mobile viewports (#1432), so the polyfill has no job below
 * the lg breakpoint — skip it there to remove the phantom-dblclick source on phones
 * while keeping touch DnD on desktop / large (touch) viewports.
 */
export function maybeInstallTouchDragPolyfill(): Promise<unknown> | void {
  if (typeof window === 'undefined') return
  // Mirrors useIsMobile's SSR-safe initial check (lg breakpoint = 1024px).
  if (window.innerWidth < 1024) return
  return import('drag-drop-touch')
}
