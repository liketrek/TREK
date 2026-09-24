import type { RoadtripDayBoundary } from '@trek/shared'
import type { RouteVia } from '../../types'
import { nearestDayBoundary, type DayBoundaryLeg, type DayBoundaryTarget, type ProjectPoint } from '../Roadtrip/dayBoundaryPath'

export interface DayBoundaryControls {
  path: DayBoundaryLeg[]
  move: (day: number, boundary: RoadtripDayBoundary | null) => Promise<boolean>
  hint: string
}

interface DragMap {
  project: ProjectPoint
  setPosition: (lat: number, lng: number) => void
  lock: () => () => void
}

export function bindDayBoundaryDrag(el: HTMLElement, via: RouteVia, controls: DayBoundaryControls, map: DragMap) {
  const pause = via.nightPause!
  // Leaflet replaces the label contents when its icon changes, but keeps this root.
  const handle = el
  handle.style.cursor = 'grab'
  handle.style.touchAction = 'none'
  handle.tabIndex = 0
  handle.setAttribute('role', 'button')
  handle.setAttribute('aria-label', via.label ?? '')
  handle.setAttribute('aria-description', controls.hint)
  let origin: { x: number; y: number } | null = null
  let target: DayBoundaryTarget | null = null
  let unlock: (() => void) | null = null
  let moved = false
  let saving = false
  let disposed = false
  const restore = () => map.setPosition(via.lat, via.lng)
  const detach = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('pointercancel', cancel)
    document.removeEventListener('keydown', escape)
    unlock?.()
    unlock = null
    origin = null
    handle.style.cursor = 'grab'
  }
  const cancel = () => { detach(); restore() }
  const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); cancel() } }
  const commit = async (boundary: RoadtripDayBoundary | null) => {
    saving = true
    handle.setAttribute('aria-busy', 'true')
    try { if (!await controls.move(pause.day, boundary) && !disposed) restore() }
    finally { saving = false; handle.removeAttribute('aria-busy') }
  }
  const move = (event: PointerEvent) => {
    if (!origin) return
    if (!moved && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 4) return
    moved = true
    event.preventDefault()
    target = nearestDayBoundary(controls.path, pause.day, { x: event.clientX, y: event.clientY }, map.project, pause.minPosition, pause.maxPosition)
    if (target) map.setPosition(target.lat, target.lng)
  }
  const up = () => {
    const next = moved ? target : null
    detach()
    if (next) void commit(next.boundary)
    else restore()
  }
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || saving) return
    event.stopPropagation()
    event.preventDefault()
    origin = { x: event.clientX, y: event.clientY }
    target = null
    moved = false
    unlock = map.lock()
    handle.style.cursor = 'grabbing'
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', cancel)
    document.addEventListener('keydown', escape)
  }
  const click = (event: Event) => {
    if (moved || saving) { event.preventDefault(); event.stopImmediatePropagation() }
  }
  const reset = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!saving && pause.manual) void commit(null)
  }
  const key = (event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') return reset(event)
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || saving) return
    event.preventDefault()
    event.stopPropagation()
    const position = (pause.position ?? 0) + (event.key === 'ArrowLeft' ? -0.05 : 0.05)
    const leg = controls.path.find(leg => position >= leg.position && position <= leg.position + 1)
    if (!leg || position <= (pause.minPosition ?? -1) || position >= (pause.maxPosition ?? Infinity)) return
    void commit({ day_number: pause.day, from_assignment_id: leg.from.assignmentId, to_assignment_id: leg.to.assignmentId, fraction: position - leg.position })
  }
  handle.addEventListener('pointerdown', down)
  el.addEventListener('click', click, true)
  handle.addEventListener('contextmenu', reset)
  handle.addEventListener('keydown', key)
  return () => {
    disposed = true
    detach()
    handle.removeEventListener('pointerdown', down)
    el.removeEventListener('click', click, true)
    handle.removeEventListener('contextmenu', reset)
    handle.removeEventListener('keydown', key)
  }
}
