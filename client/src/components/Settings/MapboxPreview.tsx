import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import maplibregl from 'maplibre-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { isStandardFamily, supportsCustom3d, addCustom3dBuildings, addTerrainAndSky } from '../Map/mapboxSetup'
import { MAPBOX_DEFAULT_STYLE, normalizeStyleForProvider, type GlMapProvider } from '../Map/glProviders'

interface Props {
  provider?: GlMapProvider
  token?: string
  style: string
  lat: number
  lng: number
  zoom: number
  enable3d: boolean
  quality?: boolean
  onClick?: (latlng: { lat: number; lng: number }) => void
}

export default function GlMapPreview({ provider = 'mapbox-gl', token = '', style, lat, lng, zoom, enable3d, quality = false, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any | null>(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick
  const isMapLibre = provider === 'maplibre-gl'
  const gl = (isMapLibre ? maplibregl : mapboxgl) as any
  const glStyle = normalizeStyleForProvider(provider, style)
  const enableMapbox3d = !isMapLibre && enable3d

  useEffect(() => {
    if (!containerRef.current || (!isMapLibre && !token)) return
    if (!isMapLibre) mapboxgl.accessToken = token

    const mapOptions: Record<string, unknown> = {
      container: containerRef.current,
      style: glStyle,
      center: [lng, lat],
      zoom,
      pitch: enableMapbox3d ? 45 : 0,
      attributionControl: true,
      antialias: quality,
    }
    if (!isMapLibre) mapOptions.projection = quality ? 'globe' : 'mercator'
    // MapLibre 5's around-center mouse rotate ping-pongs near mid-screen (#1545)
    // — see MapViewGL. Keep the plain dx-based rotate everywhere.
    if (isMapLibre) mapOptions.aroundCenter = false

    const map = new gl.Map(mapOptions as any)
    mapRef.current = map

    map.on('load', () => {
      if (enableMapbox3d) {
        if (!isStandardFamily(glStyle)) addTerrainAndSky(map)
        if (supportsCustom3d(glStyle)) {
          const dark = document.documentElement.classList.contains('dark')
          addCustom3dBuildings(map, dark)
        }
      }
      if (glStyle === MAPBOX_DEFAULT_STYLE) {
        try { map.setTerrain(null) } catch { /* noop */ }
      }
    })

    map.on('click', (e) => {
      onClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })

    return () => {
      try { map.remove() } catch { /* noop */ }
      mapRef.current = null
    }
  }, [provider, token, glStyle, enableMapbox3d, quality])

  // Recenter without rebuilding the map when lat/lng/zoom change externally
  useEffect(() => {
    if (!mapRef.current) return
    try { mapRef.current.jumpTo({ center: [lng, lat], zoom }) } catch { /* noop */ }
  }, [lat, lng, zoom])

  if (!isMapLibre && !token) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700">
        Enter a Mapbox access token to preview
      </div>
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }} />
}
