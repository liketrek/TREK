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
  /**
   * Stretches to mark behind the line, in metres along the route (the via
   * ferratas a tour climbs, the hard grades of a hike), in their own colour
   * where they bring one.
   */
  bands?: ReadonlyArray<{ fromM: number; toM: number; color?: string }>
  /** Spots to mark across the profile, in metres along the route (where the stages of a multi-day tour end). */
  marks?: readonly number[]
  /** Other ways of the same route, drawn thin on the same axes so they compare at a glance. */
  compare?: ReadonlyArray<{ key: string; samples: readonly DistanceIndexedProfileSample[]; color: string }>
  /** Where the spot in focus is said: in a box over the chart, or nowhere (the caller says it itself). */
  readout?: 'tooltip' | 'none'
  /** Keeps the spot a finger lifted from in focus, so it can still be read; a mouse leaving clears it as ever. */
  keepFocusOnLift?: boolean
}

/** A route profile whose horizontal axis represents travelled distance. */
export default function ElevationProfile({ samples, color, height = 100, gradientId, ariaLabel, focus = null, onFocusChange, formatFocus, bands, marks, compare, readout = 'tooltip', keepFocusOnLift = false }: ElevationProfileProps) {
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState('')
  const pointerFrameRef = useRef<number | null>(null)
  const pendingPointerDistanceRef = useRef<number | null>(null)
  const width = 440
  const domain = useMemo(
    () => compare?.length ? elevationProfileModel.sharedProfileDomain([samples, ...compare.map(other => other.samples)]) : null,
    [samples, compare],
  )
  const chart = useMemo(() => elevationProfileModel.prepareElevationProfileChart(samples, width, height, domain), [samples, height, domain])
  const compared = useMemo(
    () => (compare ?? []).map(other => ({
      key: other.key,
      color: other.color,
      path: elevationProfileModel.prepareElevationProfileChart(other.samples, width, height, domain).linePath,
    })),
    [compare, height, domain],
  )
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
  const clearPointerFocus = (event: React.PointerEvent<SVGSVGElement>): void => {
    cancelPendingPointerFocus()
    if (keepFocusOnLift && event.pointerType !== 'mouse') return
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
      {bands?.map(band => (
        <rect key={`${band.fromM}-${band.toM}`} data-profile-band="true" x={(band.fromM / chart.maxDistance) * width} y={0}
          width={Math.max(1, ((band.toM - band.fromM) / chart.maxDistance) * width)} height={height}
          fill={band.color ?? 'var(--map-ferrata)'} fillOpacity={band.color ? 0.22 : 0.16} />
      ))}
      {marks?.map(atM => (
        <line key={atM} data-profile-mark="true" x1={(atM / chart.maxDistance) * width} x2={(atM / chart.maxDistance) * width}
          y1={0} y2={height} stroke="var(--accent)" strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      ))}
      {compared.map(other => (
        <path key={other.key} data-profile-compare={other.key} d={other.path} fill="none" stroke={other.color} strokeOpacity={0.55}
          strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={chart.areaPath} fill={`url(#${gradientId})`} />
      <path d={chart.linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {focusX != null && (
        <g pointerEvents="none" aria-hidden="true">
          <line data-profile-focus-line="true" x1={focusX} x2={focusX} y1={4} y2={height - 4} stroke="var(--text-muted)" strokeOpacity="0.85" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
    {/* The point in an unscaled layer of its own: the chart above stretches to the width, which would squash a circle drawn in it into an ellipse. */}
    {focusX != null && focusY != null && (
      <svg width="100%" height={height} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 overflow-visible">
        <circle data-profile-focus-point="true" cx={`${(focusX / width) * 100}%`} cy={focusY} r={4} fill={color} stroke="var(--bg-card)" strokeWidth={2} />
      </svg>
    )}
    {interactive && readout === 'tooltip' && focusX != null && (
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
