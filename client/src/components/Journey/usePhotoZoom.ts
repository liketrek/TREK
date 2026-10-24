import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { MAX_ZOOM, NO_ZOOM, panBy, toggleZoom, zoomAt, type ZoomState } from './photoZoom'

const STEP = 1.5
const DOUBLE_TAP_MS = 300
/** How far a finger may move and still have tapped rather than swiped. */
const TAP_SLOP_PX = 10

/**
 * Zoom and pan for one photo of the lightbox (#1484): the wheel and a double click
 * on a desktop, a pinch and a double tap on a phone, and dragging once it is
 * enlarged. Starts over whenever `resetKey` changes, which is the photo shown.
 */
export function usePhotoZoom(resetKey: unknown) {
  const [zoom, setZoom] = useState<ZoomState>(NO_ZOOM)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const pinch = useRef<{ dist: number; scale: number } | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const lastTap = useRef(0)
  // Where a one finger touch began, so a swipe is never counted as a tap.
  const tapStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => { setZoom(NO_ZOOM) }, [resetKey])

  /** The photo's size at rest, and a point as measured from its centre. */
  const measure = useCallback((clientX?: number, clientY?: number) => {
    const img = imgRef.current
    const z = zoomRef.current
    if (!img) return null
    const rect = img.getBoundingClientRect()
    const width = rect.width / z.scale
    const height = rect.height / z.scale
    const cx = rect.left + rect.width / 2 - z.x
    const cy = rect.top + rect.height / 2 - z.y
    return { width, height, px: clientX == null ? 0 : clientX - cx, py: clientY == null ? 0 : clientY - cy }
  }, [])

  const scaleBy = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const m = measure(clientX, clientY)
    if (!m) return
    setZoom(z => zoomAt(z, z.scale * factor, m.px, m.py, m.width, m.height))
  }, [measure])

  const toggleAt = useCallback((clientX: number, clientY: number) => {
    const m = measure(clientX, clientY)
    if (!m) return
    setZoom(z => toggleZoom(z, m.px, m.py, m.width, m.height))
  }, [measure])

  const onWheel = useCallback((e: React.WheelEvent) => {
    scaleBy(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY)
  }, [scaleBy])

  const onDoubleClick = useCallback((e: React.MouseEvent) => toggleAt(e.clientX, e.clientY), [toggleAt])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomRef.current.scale <= 1) return
    e.preventDefault()
    drag.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current) return
    const m = measure()
    if (!m) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setZoom(z => panBy(z, dx, dy, m.width, m.height))
  }, [measure])

  const endDrag = useCallback(() => { drag.current = null }, [])

  /**
   * Touch goes through here before the lightbox's swipes. Answers true when the
   * gesture was a zoom or a pan, so a pinch never also turns the page.
   */
  const touchStart = useCallback((e: React.TouchEvent): boolean => {
    tapStart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      pinch.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: zoomRef.current.scale }
      return true
    }
    if (e.touches.length === 1 && zoomRef.current.scale > 1) {
      drag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      return true
    }
    return false
  }, [])

  const touchMove = useCallback((e: React.TouchEvent): boolean => {
    const m = measure()
    if (!m) return false
    if (pinch.current && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const mid = measure((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
      if (!mid) return true
      const target = (pinch.current.scale * dist) / pinch.current.dist
      setZoom(z => zoomAt(z, target, mid.px, mid.py, m.width, m.height))
      return true
    }
    if (drag.current && e.touches.length === 1) {
      const t = e.touches[0]
      const dx = t.clientX - drag.current.x
      const dy = t.clientY - drag.current.y
      drag.current = { x: t.clientX, y: t.clientY }
      setZoom(z => panBy(z, dx, dy, m.width, m.height))
      return true
    }
    return false
  }, [measure])

  const touchEnd = useCallback((e: React.TouchEvent): boolean => {
    const wasGesture = !!pinch.current || !!drag.current
    if (e.touches.length < 2) pinch.current = null
    if (e.touches.length === 0) drag.current = null
    // A double tap zooms in on the tapped spot, or back out.
    const t = e.changedTouches[0]
    const start = tapStart.current
    tapStart.current = null
    const isTap = !!start && !!t && Math.hypot(t.clientX - start.x, t.clientY - start.y) < TAP_SLOP_PX
    if (!wasGesture && e.changedTouches.length === 1 && isTap) {
      const now = Date.now()
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0
        toggleAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        return true
      }
      lastTap.current = now
    }
    return wasGesture || zoomRef.current.scale > 1
  }, [toggleAt])

  const zoomed = zoom.scale > 1
  const style: CSSProperties = {
    transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
    transition: drag.current || pinch.current ? 'none' : 'transform 160ms ease',
    cursor: zoomed ? (drag.current ? 'grabbing' : 'grab') : 'zoom-in',
    touchAction: 'none',
  }

  return {
    zoom, zoomed, imgRef, style,
    canZoomIn: zoom.scale < MAX_ZOOM,
    zoomIn: () => scaleBy(STEP),
    zoomOut: () => scaleBy(1 / STEP),
    reset: () => setZoom(NO_ZOOM),
    mouse: { onWheel, onDoubleClick, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag },
    touchStart, touchMove, touchEnd,
  }
}
