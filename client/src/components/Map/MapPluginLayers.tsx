import { useEffect, useState } from 'react'
import { Circle, Polygon, Polyline, Tooltip, useMap } from 'react-leaflet'
import { pluginsApi, type PluginMapLayer, type PluginMapLayerFeature } from '../../api/client'
import { useLngFrame } from './lngFrameContext'
import { frameLine, frameLng } from '../../utils/lngFrame'

/**
 * Host-rendered overlay for the `mapLayerProvider` plugin hook. A plugin returns
 * bounded geometry specs (polylines/polygons/metric circles + tone/width/dash);
 * the server range-checks + clamps them, and this layer draws them with plain
 * react-leaflet primitives. Plugin JS NEVER runs on the map canvas — every value
 * here is host-vetted data, and the only text (label) renders as a tooltip.
 *
 * Drawn in a dedicated pane just under Leaflet's overlayPane so core geometry
 * (day routes, transport arcs) always stays on top of plugin shapes. Features
 * without a label are non-interactive so they never steal map clicks.
 */
const TONE_COLORS: Record<PluginMapLayerFeature['tone'], string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
}

const PANE = 'trek-plugin-layers'

const DASH_ARRAYS: Record<PluginMapLayerFeature['dash'], string | undefined> = {
  solid: undefined,
  dash: '8, 8',
  dot: '1, 7',
}

function pathOptions(f: PluginMapLayerFeature, pane: string | undefined) {
  const color = TONE_COLORS[f.tone] ?? TONE_COLORS.default
  return {
    ...(pane ? { pane } : {}),
    color,
    weight: f.width,
    opacity: f.opacity,
    dashArray: DASH_ARRAYS[f.dash],
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    fill: f.fill,
    fillColor: color,
    fillOpacity: f.fill ? Math.min(0.25, f.opacity) : 0,
    interactive: !!f.label,
  }
}

export function PluginMapLayers({ tripId }: { tripId?: number | string }) {
  const map = useMap()
  const frame = useLngFrame()
  const [layers, setLayers] = useState<PluginMapLayer[]>([])
  // Whether our dedicated below-overlay pane exists. Pane support is a Leaflet
  // optimization — if the map has no pane API (e.g. a minimal renderer), the
  // features still draw, just without the z-index separation, so we don't gate on it.
  const [hasPane, setHasPane] = useState(false)

  useEffect(() => {
    if (typeof map.getPane !== 'function' || typeof map.createPane !== 'function') return
    if (!map.getPane(PANE)) {
      const pane = map.createPane(PANE)
      if (pane) pane.style.zIndex = '399' // under overlayPane (400): core routes/arcs win
    }
    setHasPane(true)
  }, [map])

  useEffect(() => {
    if (tripId == null) { setLayers([]); return }
    let alive = true
    pluginsApi.mapLayers(tripId)
      .then(r => { if (alive) setLayers(r.layers || []) })
      .catch(() => { if (alive) setLayers([]) }) // fail-safe: no extra layers
    return () => { alive = false }
  }, [tripId])

  if (layers.length === 0) return null
  const pane = hasPane ? PANE : undefined
  // Drawn in the map's longitude frame, with the trip (#2975).

  return (
    <>
      {layers.map(layer => layer.features.map((f, i) => {
        const key = `${layer.pluginId}:${layer.id}:${i}`
        const tooltip = f.label ? <Tooltip sticky>{f.label}</Tooltip> : null
        if (f.type === 'polyline' && f.points) {
          return <Polyline key={key} positions={frameLine(frame, f.points)} pathOptions={pathOptions(f, pane)}>{tooltip}</Polyline>
        }
        if (f.type === 'polygon' && f.points) {
          return <Polygon key={key} positions={frameLine(frame, f.points)} pathOptions={pathOptions(f, pane)}>{tooltip}</Polygon>
        }
        if (f.type === 'circle' && f.center && f.radiusM) {
          return <Circle key={key} center={frame ? [f.center[0], frameLng(frame, f.center[1])] : f.center} radius={f.radiusM} pathOptions={pathOptions(f, pane)}>{tooltip}</Circle>
        }
        return null
      }))}
    </>
  )
}
