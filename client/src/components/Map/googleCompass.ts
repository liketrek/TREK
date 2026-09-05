import type { CompassMap } from './MapCompassPill'

/**
 * Adapts a Google map to the compass pill's map contract.
 *
 * The pill was written against the GL camera API, which is the one thing the two
 * GL engines agree on and Google does not: bearing is "heading" there, rotation
 * arrives as a `heading_changed` property event rather than a `rotate` event, and
 * the camera is moved through moveCamera rather than easeTo. All four operations
 * exist on both sides, so this is a rename rather than a reimplementation — which
 * is why the pill is adapted instead of forked.
 *
 * Rotation itself needs a vector map (a mapId), which MapViewGoogle always sets.
 */
export function toCompassMap(map: google.maps.Map): CompassMap {
  // google.maps.MapsEventListener has no type-safe key, so listeners are tracked
  // by the callback identity the pill hands back to off().
  const listeners = new Map<() => void, google.maps.MapsEventListener>()

  return {
    // getHeading() is undefined until the camera has a heading; north is 0.
    getBearing: () => map.getHeading() ?? 0,

    on: (_type, listener) => {
      listeners.set(listener, map.addListener('heading_changed', listener))
    },

    off: (_type, listener) => {
      listeners.get(listener)?.remove()
      listeners.delete(listener)
    },

    // The pill only ever asks for north + flat, and Google has no eased camera
    // move with a duration, so the transition is instant rather than animated.
    easeTo: ({ bearing, pitch }) => {
      map.moveCamera({ heading: bearing, tilt: pitch })
    },
  }
}
