import { useEffect, useMemo, useRef, useState } from 'react'
import { focusRouteProfileAtDistance, type DistanceIndexedProfileSample, type RouteProfileFocus } from '../../utils/routeGeometry'
import * as elevationProfileModel from './elevationProfileModel'

interface ElevationProfileProps {
  samples: DistanceIndexedProfileSample[]
  color: string
  height?: number
  gradientId: string
  ariaLabel?: string
  focus?: RouteProfileFocus | null
  onFocusChange?: (focus: RouteProfileFocus | null) => void
  formatFocus?: (focus: RouteProfileFocus) => string
}

/** A route profile whose horizontal axis represents travelled distance. */
export default function ElevationProfile({ samples, color, height = 100, gradientId, ariaLabel, focus = null, onFocusChange, formatFocus }: ElevationProfileProps) {
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState('')
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerDistanceRef = useRef<number | null>(null)
  const width = 440
  const chart = useMemo(() => elevationProfileModel.prepareElevationProfileChart(samples, width, height), [samples, height])
  const interactive = samples.length >= 2 && !!onFocusChange && chart.hasGeographicCoordinates
  const focusAtDistance = (distanceMeters: number): RouteProfileFocus | null =>
    focusRouteProfileAtDistance(samples, distanceMeters)
  const cancelPendingPointerFocus = (): void => {
    if (pointerFrameRef.current != null) window.cancelAnimationFrame(pointerFrameRef.current)
    pointerFrameRef.current = null
    pendingPointerDistanceRef.current = null
  }
  useEffect(() => () => cancelPendingPointerFocus(), [samples])
  if (samples.length < 2) return null
  const focusAtPointer = (clientX: number, element: SVGSVGElement): void => {
    const bounds = element.getBoundingClientRect()
    if (bounds.width <= 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
    pendingPointerDistanceRef.current = ratio * chart.maxDistance
    if (pointerFrameRef.current != null) return
    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null
      const distance = pendingPointerDistanceRef.current
      pendingPointerDistanceRef.current = null
      if (distance != null) onFocusChange?.(focusAtDistance(distance))
    })
  }
  const focusText = focus
    ? formatFocus?.(focus) ?? (focus.elevationMeters == null
      ? `${Math.round(focus.distanceMeters)} m`
      : `${Math.round(focus.distanceMeters)} m · ${Math.round(focus.elevationMeters)} m`)
    : ''
  const focusX = focus ? (focus.distanceMeters / chart.maxDistance) * width : null
  const focusY = focus?.elevationMeters == null
    ? null
    : height - ((focus.elevationMeters - chart.minElevation) / chart.elevationSpan) * (height - 8) - 4
  const tooltipX = focusX == null ? 0 : Math.max(4, Math.min(width - 164, focusX + 8))
  const tooltipAtRight = focusX != null && focusX > width * 0.62
  const updateKeyboardFocus = (next: RouteProfileFocus | null): void => {
    if (next == null) cancelPendingPointerFocus()
    onFocusChange?.(next)
    if (next) setKeyboardAnnouncement(formatFocus?.(next) ?? (next.elevationMeters == null
      ? `${Math.round(next.distanceMeters)} m`
      : `${Math.round(next.distanceMeters)} m · ${Math.round(next.elevationMeters)} m`))
    else setKeyboardAnnouncement('')
  }
  const clearPointerFocus = (): void => {
    cancelPendingPointerFocus()
    onFocusChange?.(null)
    setKeyboardAnnouncement('')
  }
  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>): void => {
    if (!interactive) return
    if (event.key === 'Escape') {
      event.preventDefault()
      updateKeyboardFocus(null)
      return
    }
    const currentIndex = focus?.sampleIndex ?? 0
    let nextIndex: number | null = null
    if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = samples.length - 1
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
    else if (event.key === 'ArrowRight') nextIndex = Math.min(samples.length - 1, currentIndex + 1)
    if (nextIndex == null) return
    event.preventDefault()
    updateKeyboardFocus(focusAtDistance(samples[nextIndex].distanceMeters))
  }
  return (
    <div className="relative w-full">
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="bg-surface-tertiary"
      style={{ display: 'block', borderRadius: 6, touchAction: interactive ? 'pan-y' : undefined, fontFamily: 'var(--font-system)' }}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      aria-describedby={interactive ? `${gradientId}-keyboard-announcement` : undefined}
      aria-keyshortcuts={interactive ? 'ArrowLeft ArrowRight Home End Escape' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onFocus={interactive ? () => { if (!focus) updateKeyboardFocus(focusAtDistance(0)) } : undefined}
      onBlur={interactive ? () => updateKeyboardFocus(null) : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onPointerDown={interactive ? event => {
        if (event.pointerType !== 'mouse') {
          event.currentTarget.focus({ preventScroll: true })
          focusAtPointer(event.clientX, event.currentTarget)
        }
      } : undefined}
      onPointerMove={interactive ? event => focusAtPointer(event.clientX, event.currentTarget) : undefined}
      onPointerLeave={interactive ? clearPointerFocus : undefined}
      onPointerCancel={interactive ? clearPointerFocus : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={chart.areaPath} fill={`url(#${gradientId})`} />
      <path d={chart.linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {focusX != null && (
        <g pointerEvents="none" aria-hidden="true">
          <line data-profile-focus-line="true" x1={focusX} x2={focusX} y1={4} y2={height - 4} stroke="var(--text-muted)" strokeOpacity="0.85" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          {focusY != null && <circle data-profile-focus-point="true" cx={focusX} cy={focusY} r={4} fill={color} stroke="var(--bg-card)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        </g>
      )}
    </svg>
    {interactive && focusX != null && (
      <div
        data-profile-focus-readout="true"
        className="absolute top-1 z-10 overflow-hidden rounded-lg border border-edge-faint bg-surface-card px-2.5 py-1 text-content shadow-elevated"
        style={{
          left: tooltipAtRight ? undefined : `${tooltipX / width * 100}%`,
          right: tooltipAtRight ? 4 : undefined,
          maxWidth: 'min(164px, calc(100% - 8px))',
          pointerEvents: 'none',
          fontFamily: 'var(--font-system)',
          fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
          fontWeight: 500,
          lineHeight: 1.25,
          overflowWrap: 'anywhere',
        }}
      >
        {focusText}
      </div>
    )}
    {interactive && <span id={`${gradientId}-keyboard-announcement`} className="sr-only" aria-live="polite" aria-atomic="true">{keyboardAnnouncement}</span>}
    </div>
  )
}
