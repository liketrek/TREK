import { useCallback, useEffect, useRef, useState } from 'react'

// Permission-gated orientation listener with iOS support. iOS 13+ requires
// an explicit user gesture to request permission, so the caller triggers
// this from the "enable location" button click.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export interface GeoPosition {
  lat: number
  lng: number
  accuracy: number    // meters
  heading: number | null   // 0-360°, null when unavailable (stationary, indoor, no sensor)
  speed: number | null
  timestamp: number
}

export type TrackingMode = 'off' | 'show' | 'follow'

export interface UseGeolocationReturn {
  position: GeoPosition | null
  mode: TrackingMode
  error: string | null
  /** Toggle through off → show → follow → off. Also triggers iOS orientation permission on first call. */
  cycleMode: () => Promise<void>
  /** Force-set mode. Accepts a function for derived updates like `prev => prev === 'follow' ? 'show' : prev`. */
  setMode: (m: TrackingMode | ((prev: TrackingMode) => TrackingMode)) => void
}

// Keep a tiny EMA on heading so the compass cone doesn't jitter on every
// device orientation event. Mobile sensors fire at 60Hz and raw readings
// swing ±5° even when the phone is still — smoothing to ~0.25 weight
// gives a stable-but-responsive needle.
function smoothAngle(prev: number | null, next: number, alpha = 0.25): number {
  if (prev === null) return next
  // Take the shortest angular distance so we don't lerp the long way around
  let delta = next - prev
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return (prev + delta * alpha + 360) % 360
}

export type GeoOnceErrorCode = 'unsupported' | 'insecure-context' | 'permission-denied' | 'unavailable' | 'timeout'

export class GeoOnceError extends Error {
  code: GeoOnceErrorCode

  constructor(code: GeoOnceErrorCode, message?: string) {
    super(message || code)
    this.name = 'GeoOnceError'
    this.code = code
  }
}

// One-shot position fix for form fields (e.g. journal entry location).
// Unlike the watch below, a cached fix up to a minute old is fine here —
// the user is standing where they're journaling — so maximumAge is
// generous to make the button feel instant when the OS already has a fix.
const ONCE_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }

export function getCurrentPositionOnce(
  options: PositionOptions = ONCE_OPTIONS,
): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoOnceError('unsupported'))
      return
    }
    // Browsers hard-block geolocation outside secure contexts; surface that
    // explicitly since self-hosted instances served over plain HTTP hit it.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      reject(new GeoOnceError('insecure-context'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
        timestamp: pos.timestamp,
      }),
      (err) => reject(new GeoOnceError(
        err.code === err.PERMISSION_DENIED ? 'permission-denied'
          : err.code === err.TIMEOUT ? 'timeout'
          : 'unavailable',
        err.message,
      )),
      options,
    )
  })
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [mode, setModeState] = useState<TrackingMode>('off')
  // What setMode's updater form reads instead of a state updater's argument:
  // React may run an updater more than once per commit, and subscribing from
  // inside one would leak a watch (see setMode below).
  const modeRef = useRef<TrackingMode>(mode)
  modeRef.current = mode
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  // True between the start of startWatch and the watchPosition call it awaits.
  const startingRef = useRef(false)
  // Bumped by every start and by every stop, so a run parked on the iOS prompt can
  // tell it has been superseded — clearing startingRef alone can't, a start that came
  // after the stop has set it again by then.
  const startRunRef = useRef(0)
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null)
  const headingRef = useRef<number | null>(null)

  const stopWatch = useCallback(() => {
    startingRef.current = false
    startRunRef.current++
    if (watchIdRef.current !== null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current) } catch { /* noop */ }
      watchIdRef.current = null
    }
    if (orientationHandlerRef.current) {
      window.removeEventListener('deviceorientationabsolute', orientationHandlerRef.current as EventListener)
      window.removeEventListener('deviceorientation', orientationHandlerRef.current as EventListener)
      orientationHandlerRef.current = null
    }
    headingRef.current = null
  }, [])

  const startWatch = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser')
      return false
    }
    // Already watching, or still waiting on the iOS prompt below: a second
    // subscription would overwrite watchIdRef and leave the first one running
    // with nobody left holding its id.
    if (startingRef.current || watchIdRef.current !== null) return true
    startingRef.current = true
    const run = ++startRunRef.current
    setError(null)

    // iOS: ask for orientation permission up front; on Android and desktop
    // no prompt is needed and the method is undefined.
    const DOE = (window.DeviceOrientationEvent || {}) as DeviceOrientationEventIOS
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission()
        if (res !== 'granted') {
          // Permission denied — we still enable location, just no heading cone.
        }
      } catch { /* older webkit throws — ignore and proceed */ }
    }
    // Stopped (or restarted) while the prompt was open: subscribing now would leave a
    // watch running that nobody holds the id of any more.
    if (startRunRef.current !== run) return false

    // Device orientation → compass heading. `alpha` is rotation around the
    // Z-axis (0 = facing magnetic north on most devices). The webkit-only
    // `webkitCompassHeading` is already geographic north + clockwise, so
    // prefer it when available.
    const onOrientation = (e: DeviceOrientationEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any
      let heading: number | null = null
      if (typeof ev.webkitCompassHeading === 'number') {
        heading = ev.webkitCompassHeading
      } else if (e.absolute && typeof e.alpha === 'number') {
        // alpha is CCW from North; convert to CW heading
        heading = (360 - e.alpha) % 360
      } else if (typeof e.alpha === 'number') {
        // Non-absolute orientation: better than nothing but drifts over time
        heading = (360 - e.alpha) % 360
      }
      if (heading === null || Number.isNaN(heading)) return
      headingRef.current = smoothAngle(headingRef.current, heading)
      // Merge into position without triggering a refetch
      setPosition(p => p ? { ...p, heading: headingRef.current } : p)
    }
    orientationHandlerRef.current = onOrientation
    // Prefer "absolute" which is tied to magnetic north; fall back to plain.
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener)
    window.addEventListener('deviceorientation', onOrientation as EventListener)

    startingRef.current = false
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          // GPS heading is reliable when moving; keep compass reading
          // otherwise so the arrow still points correctly when stationary.
          heading: pos.coords.heading ?? headingRef.current,
          speed: pos.coords.speed ?? null,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        setError(err.message || 'Location unavailable')
        // Stay subscribed so a later fix can still recover (e.g. GPS
        // lock takes a while indoors). Only fully stop on permission denial.
        if (err.code === err.PERMISSION_DENIED) {
          stopWatch()
          setModeState('off')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    )
    return true
  }, [stopWatch])

  const setMode = useCallback((m: TrackingMode | ((prev: TrackingMode) => TrackingMode)) => {
    const next = typeof m === 'function' ? m(modeRef.current) : m
    // Kept in step here as well, so two setMode calls batched into one commit
    // still see each other's result.
    modeRef.current = next
    setModeState(next)
    if (next === 'off') {
      stopWatch()
      setPosition(null)
    } else if (watchIdRef.current === null) {
      // started externally but no watch yet — start it
      void startWatch()
    }
  }, [startWatch, stopWatch])

  const cycleMode = useCallback(async () => {
    if (mode === 'off') {
      const ok = await startWatch()
      if (ok) setModeState('show')
    } else if (mode === 'show') {
      setModeState('follow')
    } else {
      setModeState('off')
      stopWatch()
      setPosition(null)
    }
  }, [mode, startWatch, stopWatch])

  useEffect(() => stopWatch, [stopWatch])

  return { position, mode, error, cycleMode, setMode }
}
