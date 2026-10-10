/**
 * The zoom of a photo in the lightbox (#1484), as plain arithmetic so it can be
 * tested without a browser: a scale and how far the photo is moved off centre.
 */
export interface ZoomState {
  scale: number
  x: number
  y: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
/** What a double click or a double tap jumps to. */
export const TAP_ZOOM = 2.5

export const NO_ZOOM: ZoomState = { scale: 1, x: 0, y: 0 }

/** The photo may move only as far as its enlarged edge still covers where it sat. */
export function clampOffset(state: ZoomState, width: number, height: number): ZoomState {
  if (state.scale <= MIN_ZOOM) return NO_ZOOM
  const maxX = ((state.scale - 1) * width) / 2
  const maxY = ((state.scale - 1) * height) / 2
  return {
    scale: state.scale,
    x: Math.max(-maxX, Math.min(maxX, state.x)),
    y: Math.max(-maxY, Math.min(maxY, state.y)),
  }
}

/**
 * Zoom to `nextScale` keeping the point under the finger or the pointer where it
 * is. `px`/`py` are measured from the photo's centre, in screen pixels.
 */
export function zoomAt(state: ZoomState, nextScale: number, px: number, py: number, width: number, height: number): ZoomState {
  const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale))
  const ratio = scale / state.scale
  return clampOffset({ scale, x: px - (px - state.x) * ratio, y: py - (py - state.y) * ratio }, width, height)
}

/** A double click: in to the tapped spot from rest, back to rest from anywhere else. */
export function toggleZoom(state: ZoomState, px: number, py: number, width: number, height: number): ZoomState {
  return state.scale > MIN_ZOOM ? NO_ZOOM : zoomAt(state, TAP_ZOOM, px, py, width, height)
}

export function panBy(state: ZoomState, dx: number, dy: number, width: number, height: number): ZoomState {
  return clampOffset({ scale: state.scale, x: state.x + dx, y: state.y + dy }, width, height)
}
