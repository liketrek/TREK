import { useRef } from 'react'
import type { RoadtripVia } from '@trek/shared'

/**
 * The trip's via points as an array that only changes when a via does.
 *
 * Both map renderers rebuild their via handles whenever this list changes, and the GL one
 * replaces the DOM element outright. The list it was given changed on every render: the
 * hook that loads vias returns a fresh object each time, and a fresh object arrives again
 * on every reload even when the rows came back identical.
 *
 * That made dragging a freshly placed via fail on the first try. Placing one triggers a
 * re-route, the re-route lands about a second later, the render it causes replaced the
 * handle under the pointer — and a pointerdown belongs to the element it happened on, so
 * the drag went to an element that no longer existed. The second attempt worked because
 * by then nothing was pending. An older via never showed it: nothing was re-routing.
 *
 * Keyed by id and position because those are the only fields a handle is built from. A
 * via that genuinely moved gets a new list, which is what redraws it where it now is.
 */
export function useStableVias(viasByDay: Record<number, RoadtripVia[]> | undefined): RoadtripVia[] {
  const flat = Object.values(viasByDay ?? {}).flat()
  const key = flat.map(v => `${v.id}@${v.lat},${v.lng}`).join('|')
  // Read and written during render on purpose: this is a cache of the argument, not
  // state — it never triggers a render of its own, and it has to be settled before the
  // effects that consume the list run.
  const held = useRef<{ key: string; list: RoadtripVia[] }>({ key: '', list: [] })
  if (held.current.key !== key) held.current = { key, list: flat }
  return held.current.list
}
