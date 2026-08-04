/**
 * Long-press touch drag for the three-column planner (#1616).
 *
 * Tablets run the desktop planner but have a coarse primary pointer, and a
 * finger never starts an HTML5 drag on Android (#1265). The old answer was
 * `drag-drop-touch`, a document-wide polyfill that turned every touch over a
 * draggable element into a drag: the places list stopped scrolling (#1432) and
 * the dblclick it synthesised zoomed the map (#1440). That polyfill is now
 * confined to hybrid laptops (see touchDragPolyfill.ts) and drag was switched
 * off outright wherever the pointer is coarse — which took tablets with it.
 *
 * This bridge takes the narrow path instead. It only watches touches that begin
 * on a draggable row inside an opted-in `[data-touch-drag]` container, it waits
 * out a long press before claiming the gesture — a swipe inside that window is
 * a scroll and is left alone — and it synthesises nothing but the drag events
 * themselves. Once armed it replays the real sequence (dragstart →
 * dragenter/dragover/dragleave → drop → dragend) on the element under the
 * finger, so every drop handler already in the planner keeps working unchanged.
 *
 * If the browser starts a drag of its own first — iPadOS does — the bridge
 * stands down the moment it sees a dragstart it did not fire itself.
 */

/** How long a finger must rest on a row before the gesture becomes a drag. */
const LONG_PRESS_MS = 320
/** Moving further than this before the press lands means the user is scrolling. */
const MOVE_TOLERANCE = 10
/** Distance from a scroll container's edge at which dragging scrolls it. */
const EDGE_ZONE = 56
/** Pixels per frame the edge scroll moves at full strength. */
const EDGE_SPEED = 14

interface Session {
  source: HTMLElement
  touchId: number
  startX: number
  startY: number
  x: number
  y: number
  armed: boolean
  pressTimer: number
  ghost: HTMLElement | null
  ghostDX: number
  ghostDY: number
  target: Element | null
  canDrop: boolean
  scroller: Element | null
  frame: number
  transfer: DataTransfer
}

let session: Session | null = null

/** Events this module dispatched, so a browser-driven drag stays recognisable. */
const ours = new WeakSet<Event>()

/**
 * A stand-in for the browsers that refuse `new DataTransfer()`. Only the parts
 * the planner's handlers reach for are implemented.
 */
function createTransfer(): DataTransfer {
  try {
    return new DataTransfer()
  } catch {
    const store = new Map<string, string>()
    return {
      dropEffect: 'move',
      effectAllowed: 'all',
      files: [] as unknown as FileList,
      items: [] as unknown as DataTransferItemList,
      get types() { return Array.from(store.keys()) },
      setData: (format: string, data: string) => { store.set(format, String(data)) },
      getData: (format: string) => store.get(format) ?? '',
      clearData: (format?: string) => { if (format) store.delete(format); else store.clear() },
      setDragImage: () => {},
    } as unknown as DataTransfer
  }
}

/** Dispatches one drag event and reports whether the target accepted it. */
function fire(type: string, target: EventTarget, s: Session): boolean {
  let event: Event
  try {
    event = new DragEvent(type, {
      bubbles: true, cancelable: true, composed: true,
      clientX: s.x, clientY: s.y, dataTransfer: s.transfer,
    })
  } catch {
    event = new Event(type, { bubbles: true, cancelable: true, composed: true })
  }
  // Safari builds the event but drops the dataTransfer, and the Event fallback
  // never had one. An own property shadows the prototype's read-only getter.
  if ((event as DragEvent).dataTransfer !== s.transfer) {
    Object.defineProperty(event, 'dataTransfer', { value: s.transfer, configurable: true })
  }
  for (const [key, value] of [['clientX', s.x], ['clientY', s.y]] as const) {
    if ((event as DragEvent)[key] !== value) {
      Object.defineProperty(event, key, { value, configurable: true })
    }
  }
  ours.add(event)
  // preventDefault on dragover is how a drop zone says yes, and dispatchEvent
  // reports that as false.
  return !target.dispatchEvent(event)
}

/** The nearest ancestor that actually scrolls vertically, if there is one. */
function scrollerFor(element: Element | null): Element | null {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return null
}

function buildGhost(s: Session): void {
  const box = s.source.getBoundingClientRect()
  const ghost = s.source.cloneNode(true) as HTMLElement
  ghost.removeAttribute('id')
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    position: 'fixed', left: '0', top: '0', margin: '0',
    width: `${box.width}px`, height: `${box.height}px`,
    pointerEvents: 'none', opacity: '0.92', zIndex: '10000',
    borderRadius: '8px', background: 'var(--bg-elevated, var(--bg-panel, #fff))',
    boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
    transform: `translate3d(${box.left}px, ${box.top}px, 0)`,
  })
  s.ghostDX = box.left - s.x
  s.ghostDY = box.top - s.y
  document.body.appendChild(ghost)
  s.ghost = ghost
}

function moveGhost(s: Session): void {
  if (!s.ghost) return
  s.ghost.style.transform = `translate3d(${s.x + s.ghostDX}px, ${s.y + s.ghostDY}px, 0)`
}

/** Keeps a long list reachable by scrolling once the finger nears an edge. */
function edgeScroll(): void {
  const s = session
  if (!s || !s.armed) return
  s.frame = requestAnimationFrame(edgeScroll)
  if (!s.scroller) return
  const box = s.scroller.getBoundingClientRect()
  const fromTop = s.y - box.top
  const fromBottom = box.bottom - s.y
  const before = s.scroller.scrollTop
  if (fromTop < EDGE_ZONE) {
    s.scroller.scrollTop -= EDGE_SPEED * Math.max(0.2, 1 - fromTop / EDGE_ZONE)
  } else if (fromBottom < EDGE_ZONE) {
    s.scroller.scrollTop += EDGE_SPEED * Math.max(0.2, 1 - fromBottom / EDGE_ZONE)
  }
  // The rows moved under a finger that did not, so whatever sits beneath it has
  // changed. Without this, holding at the edge drops onto a stale row.
  if (s.scroller.scrollTop !== before) retarget(s)
}

function arm(): void {
  const s = session
  if (!s) return
  s.armed = true
  buildGhost(s)
  // A source that vetoes its own dragstart gets the gesture handed back.
  if (fire('dragstart', s.source, s)) { endSession(false); return }
  s.frame = requestAnimationFrame(edgeScroll)
}

/** Reports the element under the finger, with the ghost kept out of the way. */
function targetAt(s: Session): Element | null {
  return document.elementFromPoint(s.x, s.y)
}

function retarget(s: Session): void {
  const next = targetAt(s)
  if (next === s.target) {
    if (next) s.canDrop = fire('dragover', next, s)
    return
  }
  if (s.target) fire('dragleave', s.target, s)
  s.target = next
  s.canDrop = false
  if (next) {
    fire('dragenter', next, s)
    s.canDrop = fire('dragover', next, s)
    s.scroller = scrollerFor(next)
  }
}

/** Swallows the click the browser sends after a drag so the row is not opened. */
function swallowNextClick(): void {
  const stop = (e: Event) => { e.stopPropagation(); e.preventDefault() }
  document.addEventListener('click', stop, { capture: true, once: true })
  setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 400)
}

/**
 * Ends the gesture. `silent` drops the session without replaying the tail of the
 * sequence — for when the browser has taken the drag over and its own events are
 * the ones the handlers should see.
 */
function endSession(drop: boolean, silent = false): void {
  const s = session
  if (!s) return
  session = null
  clearTimeout(s.pressTimer)
  cancelAnimationFrame(s.frame)
  s.ghost?.remove()
  detachGestureListeners()
  if (!s.armed || silent) return
  if (drop && s.target && s.canDrop) fire('drop', s.target, s)
  else if (s.target) fire('dragleave', s.target, s)
  fire('dragend', s.source, s)
  swallowNextClick()
}

function onTouchMove(e: TouchEvent): void {
  const s = session
  if (!s) return
  const touch = Array.from(e.touches).find(t => t.identifier === s.touchId)
  if (!touch) return
  s.x = touch.clientX
  s.y = touch.clientY
  if (!s.armed) {
    if (Math.hypot(s.x - s.startX, s.y - s.startY) > MOVE_TOLERANCE) endSession(false)
    return
  }
  // Armed: the gesture is a drag, so the page must not scroll under it.
  e.preventDefault()
  moveGhost(s)
  retarget(s)
}

function onTouchEnd(e: TouchEvent): void {
  const s = session
  if (!s) return
  if (Array.from(e.touches).some(t => t.identifier === s.touchId)) return
  endSession(e.type === 'touchend')
}

function onNativeDragStart(e: Event): void {
  // iPadOS starts a drag of its own from the same long press. Let it have the
  // gesture rather than running two sequences over one finger.
  if (!ours.has(e)) endSession(false, true)
}

function onContextMenu(e: Event): void {
  // Android raises this on the same long press that arms the drag.
  if (session) e.preventDefault()
}

function attachGestureListeners(): void {
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
  document.addEventListener('touchcancel', onTouchEnd)
  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('dragstart', onNativeDragStart, true)
}

function detachGestureListeners(): void {
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  document.removeEventListener('touchcancel', onTouchEnd)
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('dragstart', onNativeDragStart, true)
}

function onTouchStart(e: TouchEvent): void {
  if (session) { endSession(false); return }
  if (e.touches.length !== 1) return
  const start = e.target as Element | null
  const source = start?.closest?.('[draggable="true"]') as HTMLElement | null
  if (!source || !source.closest('[data-touch-drag]')) return
  const touch = e.touches[0]
  session = {
    source,
    touchId: touch.identifier,
    startX: touch.clientX, startY: touch.clientY,
    x: touch.clientX, y: touch.clientY,
    armed: false,
    pressTimer: window.setTimeout(arm, LONG_PRESS_MS),
    ghost: null, ghostDX: 0, ghostDY: 0,
    target: null, canDrop: false,
    scroller: scrollerFor(source),
    frame: 0,
    transfer: createTransfer(),
  }
  attachGestureListeners()
}

/**
 * Starts watching for long-press drags. Returns the teardown, which also ends
 * any drag still in flight.
 */
export function installTouchDragBridge(): () => void {
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  return () => {
    document.removeEventListener('touchstart', onTouchStart)
    endSession(false)
  }
}
