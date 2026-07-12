import { useEffect, useMemo, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { pluginsApi, type PluginMapMarker } from '../../api/client'

/**
 * Host-rendered overlay for the `mapMarkerProvider` plugin hook (#587). A plugin
 * returns bounded marker specs (coordinates + plain text + an allowlisted url); the
 * server range-checks + normalizes them, and this layer draws them as plain Leaflet
 * markers. Plugin JS NEVER runs on the map canvas — every value here is host-vetted
 * data, and the popup renders it as text (the url is already http/https/mailto-only).
 *
 * Mounted inside the trip map's <MapContainer>; fail-safe — a fetch error just yields
 * no extra markers, the core map is untouched.
 */
const TONE_COLORS: Record<PluginMapMarker['tone'], string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
}

function markerIcon(tone: PluginMapMarker['tone']): L.DivIcon {
  const color = TONE_COLORS[tone] ?? TONE_COLORS.default
  return L.divIcon({
    className: 'plugin-map-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  })
}

export function PluginMapMarkers({ tripId }: { tripId?: number | string }) {
  const [markers, setMarkers] = useState<PluginMapMarker[]>([])

  useEffect(() => {
    if (tripId == null) { setMarkers([]); return }
    let alive = true
    pluginsApi.mapMarkers(tripId)
      .then(r => { if (alive) setMarkers(r.markers || []) })
      .catch(() => { if (alive) setMarkers([]) }) // fail-safe: no extra markers
    return () => { alive = false }
  }, [tripId])

  const icons = useMemo(() => {
    const m = new Map<PluginMapMarker['tone'], L.DivIcon>()
    for (const tone of ['default', 'success', 'warn', 'danger'] as const) m.set(tone, markerIcon(tone))
    return m
  }, [])

  if (markers.length === 0) return null

  return (
    <>
      {markers.map(mk => (
        <Marker key={`${mk.pluginId}:${mk.id}`} position={[mk.lat, mk.lng]} icon={icons.get(mk.tone)!}>
          {(mk.label || mk.popupText || mk.url) && (
            <Popup>
              <div style={{ minWidth: 120, fontSize: 13 }}>
                {mk.label && <div style={{ fontWeight: 600, marginBottom: mk.popupText ? 4 : 0 }}>{mk.label}</div>}
                {mk.popupText && <div style={{ color: '#4b5563' }}>{mk.popupText}</div>}
                {mk.url && (
                  <a href={mk.url} target="_blank" rel="noreferrer noopener" style={{ display: 'inline-block', marginTop: 6, color: TONE_COLORS.default }}>
                    {mk.url}
                  </a>
                )}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  )
}
