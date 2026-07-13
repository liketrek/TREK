import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIntlLanguage, getLocaleForLanguage, useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import apiClient, { mapsApi, pluginsApi, type PluginAtlasLayer } from '../../api/client'
import L from 'leaflet'
import type { GeoJsonFeatureCollection } from '../../types'
import { A2_TO_A3, normalizeRegionName, type AtlasData, type CountryDetail, type BucketItem } from './atlasModel'
import { continentForCountry } from '@trek/shared'

function useCountryNames(language: string): (code: string) => string {
  const [resolver, setResolver] = useState<(code: string) => string>(() => (code: string) => code)
  useEffect(() => {
    try {
      const dn = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' })
      setResolver(() => (code: string) => { try { return dn.of(code) || code } catch { return code } })
    } catch { /* */ }
  }, [language])
  return resolver
}

/**
 * Atlas page logic — the whole interactive globe lives here: atlas/bucket-list
 * loading, the Leaflet map lifecycle (country + sub-national region layers,
 * bucket markers, viewport-driven region fetching), country/region mark/unmark
 * flows and the country search. AtlasPage stays a wiring container that renders
 * the returned state via its presentational SidebarContent/MobileStats helpers.
 * Behaviour is identical to the previous in-component logic.
 */
export function useAtlas() {
  const { t, language } = useTranslation()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()
  const resolveName = useCountryNames(language)
  const dm = settings.dark_mode
  const dark = dm === true || dm === 'dark' || (dm === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const borderGlareRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const country_layer_by_a2_ref = useRef<Record<string, any>>({})

  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!panelRef.current || !glareRef.current || !borderGlareRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Subtle inner glow
    glareRef.current.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, ${dark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.25)'} 0%, transparent 70%)`
    glareRef.current.style.opacity = '1'
    // Border glow that follows cursor
    borderGlareRef.current.style.opacity = '1'
    borderGlareRef.current.style.maskImage = `radial-gradient(circle 150px at ${x}px ${y}px, black 0%, transparent 100%)`
    borderGlareRef.current.style.webkitMaskImage = `radial-gradient(circle 150px at ${x}px ${y}px, black 0%, transparent 100%)`
  }
  const handlePanelMouseLeave = () => {
    if (glareRef.current) glareRef.current.style.opacity = '0'
    if (borderGlareRef.current) borderGlareRef.current.style.opacity = '0'
  }

  const [data, setData] = useState<AtlasData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null)
  const [geoData, setGeoData] = useState<GeoJsonFeatureCollection | null>(null)
  const [visitedRegions, setVisitedRegions] = useState<Record<string, { code: string; name: string; placeCount: number; manuallyMarked?: boolean }[]>>({})
  const [pluginLayers, setPluginLayers] = useState<PluginAtlasLayer[]>([])
  const pluginLayerRef = useRef<L.GeoJSON | null>(null)
  const regionLayerRef = useRef<L.GeoJSON | null>(null)
  const regionGeoCache = useRef<Record<string, GeoJsonFeatureCollection>>({})
  const [showRegions, setShowRegions] = useState(false)
  const [regionGeoLoaded, setRegionGeoLoaded] = useState(0)
  const regionTooltipRef = useRef<HTMLDivElement>(null)
  const loadCountryDetailRef = useRef<(code: string) => void>(() => {})
  const handleMarkCountryRef = useRef<(code: string, name: string) => void>(() => {})
  const setConfirmActionRef = useRef<typeof setConfirmAction>(() => {})
  const [confirmAction, setConfirmAction] = useState<{ type: 'mark' | 'unmark' | 'choose' | 'bucket' | 'choose-region' | 'unmark-region'; code: string; name: string; regionCode?: string; countryName?: string } | null>(null)
  const [bucketMonth, setBucketMonth] = useState(0)
  const [bucketYear, setBucketYear] = useState(0)

  // Bucket list
  const [bucketList, setBucketList] = useState<BucketItem[]>([])
  const [showBucketAdd, setShowBucketAdd] = useState(false)
  const [bucketForm, setBucketForm] = useState({ name: '', notes: '', lat: '', lng: '', target_date: '' })
  const [bucketSearch, setBucketSearch] = useState('')
  const [bucketSearchResults, setBucketSearchResults] = useState<any[]>([])
  const [bucketSearching, setBucketSearching] = useState(false)
  const [bucketPoiMonth, setBucketPoiMonth] = useState(0)
  const [bucketPoiYear, setBucketPoiYear] = useState(0)
  const [bucketTab, setBucketTab] = useState<'stats' | 'bucket'>('stats')
  const bucketMarkersRef = useRef<any>(null)

  const [atlas_country_search, set_atlas_country_search] = useState('')
  const [atlas_country_results, set_atlas_country_results] = useState<{ code: string; label: string }[]>([])
  const [atlas_country_open, set_atlas_country_open] = useState(false)

  const atlas_country_options = useMemo(() => {
    if (!geoData) return []
    // Precompute A3 → A2 reverse lookup once per geoData change instead of
    // scanning A2_TO_A3 for every feature that needs the fallback.
    const a3ToA2 = new Map<string, string>()
    for (const [a2Key, a3Val] of Object.entries(A2_TO_A3)) a3ToA2.set(a3Val, a2Key)

    const opts: { code: string; label: string }[] = []
    const seen = new Set<string>()
    for (const f of (geoData as any).features || []) {
      const rawA2 = f?.properties?.ISO_A2
      let resolvedA2: string | null = (typeof rawA2 === 'string' && rawA2.length === 2 && rawA2 !== '-99') ? rawA2 : null
      if (!resolvedA2) {
        const a3 = f?.properties?.ADM0_A3 || f?.properties?.ISO_A3 || f?.properties?.['ISO3166-1-Alpha-3'] || null
        if (a3 && a3 !== '-99') resolvedA2 = a3ToA2.get(a3) ?? null
      }
      if (!resolvedA2 || seen.has(resolvedA2)) continue
      seen.add(resolvedA2)
      const label = String(resolveName(resolvedA2) || f?.properties?.NAME || f?.properties?.ADMIN || resolvedA2)
      opts.push({ code: resolvedA2, label })
    }
    opts.sort((a, b) => a.label.localeCompare(b.label))
    return opts
  }, [geoData, resolveName])

  // Load atlas data + bucket list
  useEffect(() => {
    Promise.all([
      apiClient.get('/addons/atlas/stats'),
      apiClient.get('/addons/atlas/bucket-list'),
    ]).then(([statsRes, bucketRes]) => {
      setData(statsRes.data)
      setBucketList(bucketRes.data.items || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Load country-border GeoJSON from our API (geoBoundaries, served server-side —
  // no third-party fetch from the browser). Even gzipped the payload is a few MB, so
  // it gets a longer timeout than the global 8s default to survive slow links and
  // reverse-proxy / Cloudflare-Tunnel setups instead of aborting and leaving the map
  // with no countries (#1254).
  useEffect(() => {
    apiClient.get('/addons/atlas/countries/geo', { timeout: 30000 })
      .then(res => {
        const geo = res.data
        // Dynamically build A2→A3 mapping from GeoJSON
        for (const f of geo.features) {
          const a2 = f.properties?.ISO_A2
          const a3 = f.properties?.ADM0_A3 || f.properties?.ISO_A3
          // Only accept clean 2-letter ISO codes and never overwrite an existing
          // mapping: some datasets carry subdivision-style values like "CN-TW" for
          // Taiwan, which would clobber the legitimate TWN->TW entry (#1049).
          if (a2 && a3 && a2.length === 2 && a2 !== '-99' && a3 !== '-99' && !A2_TO_A3[a2]) {
            A2_TO_A3[a2] = a3
          }
        }
        setGeoData(geo)
      })
      .catch(() => {})
  }, [])

  // Load visited regions (geocoded from places/trips) — once on mount
  useEffect(() => {
    apiClient.get(`/addons/atlas/regions?_t=${Date.now()}`)
      .then(r => setVisitedRegions(r.data?.regions || {}))
      .catch(() => {})
  }, [])

  // Load plugin tint layers (atlasLayerProvider hook) — once on mount. Fail-safe:
  // an error just means no plugin overlay, the core map is untouched.
  useEffect(() => {
    pluginsApi.atlasLayers()
      .then(r => setPluginLayers(r.layers || []))
      .catch(() => setPluginLayers([]))
  }, [])

  // Load admin-1 GeoJSON for countries visible in the current viewport
  const loadRegionsForViewportRef = useRef<() => void>(() => {})
  const loadRegionsForViewport = (): void => {
    if (!mapInstance.current) return
    const bounds = mapInstance.current.getBounds()
    const toLoad: string[] = []
    for (const [code, layer] of Object.entries(country_layer_by_a2_ref.current)) {
      if (regionGeoCache.current[code]) continue
      try {
        if (bounds.intersects((layer as any).getBounds())) toLoad.push(code)
      } catch {}
    }
    if (!toLoad.length) return
    apiClient.get(`/addons/atlas/regions/geo?countries=${toLoad.join(',')}`)
      .then(geoRes => {
        const geo = geoRes.data
        if (!geo?.features) return
        let added = false
        for (const c of toLoad) {
          const features = geo.features.filter((f: any) => f.properties?.iso_a2?.toUpperCase() === c)
          if (features.length > 0) { regionGeoCache.current[c] = { type: 'FeatureCollection', features }; added = true }
        }
        if (added) setRegionGeoLoaded(v => v + 1)
      })
      .catch(() => {})
  }
  loadRegionsForViewportRef.current = loadRegionsForViewport

  // Initialize map — runs after loading is done and mapRef is available
  useEffect(() => {
    if (loading || !mapRef.current) return
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }

    const map = L.map(mapRef.current, {
      center: [25, 0],
      zoom: 3,
      minZoom: 3,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-90, -220], [90, 220]],
      maxBoundsViscosity: 1.0,
      fadeAnimation: false,
      preferCanvas: true,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const tileUrl = dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      maxZoom: 10,
      keepBuffer: 25,
      updateWhenZooming: true,
      updateWhenIdle: false,
      tileSize: 256,
      zoomOffset: 0,
      crossOrigin: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
    } as any).addTo(map)

    // Preload adjacent zoom level tiles
    L.tileLayer(tileUrl, {
      maxZoom: 10,
      keepBuffer: 10,
      opacity: 0,
      tileSize: 256,
      crossOrigin: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).addTo(map)

    // Custom pane for region layer — above overlay (z-index 400)
    map.createPane('regionPane')
    map.getPane('regionPane')!.style.zIndex = '401'

    mapInstance.current = map

    // Zoom-based region switching
    map.on('zoomend', () => {
      const z = map.getZoom()
      const shouldShow = z >= 5
      setShowRegions(shouldShow)
      const overlayPane = map.getPane('overlayPane')
      if (overlayPane) {
        overlayPane.style.opacity = shouldShow ? '0.35' : '1'
        overlayPane.style.pointerEvents = shouldShow ? 'none' : 'auto'
      }
      if (shouldShow) {
        // Re-add region layer if it was removed while zoomed out
        if (regionLayerRef.current && !map.hasLayer(regionLayerRef.current)) {
          regionLayerRef.current.addTo(map)
        }
        loadRegionsForViewportRef.current()
      } else {
        // Physically remove region layer so its SVG paths can't intercept events
        if (regionTooltipRef.current) regionTooltipRef.current.style.display = 'none'
        if (regionLayerRef.current && map.hasLayer(regionLayerRef.current)) {
          regionLayerRef.current.resetStyle()
          regionLayerRef.current.removeFrom(map)
        }
      }
    })

    map.on('moveend', () => {
      if (map.getZoom() >= 6) loadRegionsForViewportRef.current()
    })

    return () => { map.remove(); mapInstance.current = null }
  }, [dark, loading])

  // Render GeoJSON countries
  useEffect(() => {
    if (!mapInstance.current || !geoData || !data) return

    const visitedA3 = new Set(data.countries.map(c => A2_TO_A3[c.code]).filter(Boolean))
    const countryMap = {}
    data.countries.forEach(c => { if (A2_TO_A3[c.code]) countryMap[A2_TO_A3[c.code]] = c })

    // Preserve current map view
    const currentCenter = mapInstance.current.getCenter()
    const currentZoom = mapInstance.current.getZoom()

    if (geoLayerRef.current) {
      mapInstance.current.removeLayer(geoLayerRef.current)
    }

    // Generate deterministic color per country code
    const VISITED_COLORS = ['#6366f1','#ec4899','#14b8a6','#f97316','#8b5cf6','#ef4444','#3b82f6','#22c55e','#06b6d4','#f43f5e','#a855f7','#10b981','#0ea5e9','#e11d48','#0d9488','#7c3aed','#2563eb','#dc2626','#059669','#d946ef']
    // Assign colors in order of visit (by index in countries array) so no two neighbors share a color easily
    const visitedA3List = [...visitedA3]
    const colorMap = {}
    visitedA3List.forEach((a3, i) => { colorMap[a3] = VISITED_COLORS[i % VISITED_COLORS.length] })
    const colorForCode = (a3) => colorMap[a3] || VISITED_COLORS[0]

    const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 5 })

    geoLayerRef.current = L.geoJSON(geoData, {
      renderer: canvasRenderer,
      interactive: true,
      bubblingMouseEvents: false,
      style: (feature) => {
        const a3 = feature.properties?.ADM0_A3 || feature.properties?.ISO_A3 || feature.properties?.['ISO3166-1-Alpha-3'] || feature.id
        const visited = visitedA3.has(a3)
        return {
          fillColor: visited ? colorForCode(a3) : (dark ? '#1e1e2e' : '#e2e8f0'),
          fillOpacity: visited ? 0.7 : 0.3,
          color: dark ? '#333' : '#cbd5e1',
          weight: 0.5,
        }
      },
      onEachFeature: (feature, layer) => {
        const a3 = feature.properties?.ADM0_A3 || feature.properties?.ISO_A3 || feature.properties?.['ISO3166-1-Alpha-3'] || feature.id
        const c = countryMap[a3]
        if (c) {
          country_layer_by_a2_ref.current[c.code] = layer
          const name = resolveName(c.code)
          const formatDate = (d) => { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString(getLocaleForLanguage(language), { month: 'short', year: 'numeric' }) }
          const tooltipHtml = `
            <div style="display:flex;flex-direction:column;gap:8px;min-width:160px">
              <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:6px;border-bottom:1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}">${name}</div>
              <div style="display:flex;gap:14px">
                <div><span style="font-size:16px;font-weight:800">${c.tripCount}</span> <span style="font-size:10px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">${c.tripCount === 1 ? t('atlas.tripSingular') : t('atlas.tripPlural')}</span></div>
                <div><span style="font-size:16px;font-weight:800">${c.placeCount}</span> <span style="font-size:10px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">${c.placeCount === 1 ? t('atlas.placeVisited') : t('atlas.placesVisited')}</span></div>
              </div>
              <div style="display:flex;gap:2px;border-top:1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};padding-top:8px">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                  <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4">${t('atlas.firstVisit')}</span>
                  <span style="font-size:12px;font-weight:700">${formatDate(c.firstVisit)}</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                  <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4">${t('atlas.lastVisitLabel')}</span>
                  <span style="font-size:12px;font-weight:700">${formatDate(c.lastVisit)}</span>
                </div>
              </div>
              </div>
            </div>`
          layer.bindTooltip(tooltipHtml, {
            // sticky so the tooltip tracks the cursor; non-sticky anchors it at the feature's
            // bounds centre, which for countries with overseas territories (e.g. France) lands
            // far out in the ocean instead of over the area being hovered.
            sticky: true, permanent: false, className: 'atlas-tooltip', direction: 'top', offset: [0, -10], opacity: 1
          })
          layer.on('click', () => {
            if (c.placeCount === 0 && c.tripCount === 0) {
              handleUnmarkCountry(c.code)
            }
          })
          layer.on('mouseover', (e) => {
            e.target.setStyle({ fillOpacity: 0.9, weight: 2, color: dark ? '#818cf8' : '#4f46e5' })
          })
          layer.on('mouseout', (e) => {
            geoLayerRef.current.resetStyle(e.target)
          })
        } else {
          // Unvisited country — allow clicking to mark as visited
          // Reverse lookup: find A2 code from A3, or use A3 directly
          const a3ToA2Entry = Object.entries(A2_TO_A3).find(([, v]) => v === a3)
          const isoA2 = feature.properties?.ISO_A2
          const countryCode = a3ToA2Entry ? a3ToA2Entry[0] : (isoA2 && isoA2 !== '-99' ? isoA2 : null)
          if (countryCode && countryCode !== '-99') {
            country_layer_by_a2_ref.current[countryCode] = layer
            const name = feature.properties?.NAME || feature.properties?.ADMIN || resolveName(countryCode)
            layer.bindTooltip(`<div style="font-size:12px;font-weight:600">${name}</div>`, {
              sticky: true, className: 'atlas-tooltip', direction: 'top', offset: [0, -10], opacity: 1
            })
            layer.on('click', () => handleMarkCountry(countryCode, name))
            layer.on('mouseover', (e) => {
              e.target.setStyle({ fillOpacity: 0.5, weight: 1.5, color: dark ? '#555' : '#94a3b8' })
            })
            layer.on('mouseout', (e) => {
              geoLayerRef.current.resetStyle(e.target)
            })
          }
        }
      }
    } as L.GeoJSONOptions & { renderer?: L.Renderer }).addTo(mapInstance.current)

    // Restore map view after re-render
    mapInstance.current.setView(currentCenter, currentZoom, { animate: false })
  }, [geoData, data, dark])

  // Render plugin tint layers (atlasLayerProvider hook) — a dashed wash over the
  // countries a plugin flagged, in its own non-interactive pane above the country
  // fills. pointer-events stay off so clicks/hovers fall through to the country
  // layer and the mark/unmark flows are untouched.
  useEffect(() => {
    if (!mapInstance.current) return
    if (pluginLayerRef.current) {
      mapInstance.current.removeLayer(pluginLayerRef.current)
      pluginLayerRef.current = null
    }
    if (!geoData || pluginLayers.length === 0) return

    // Same tone palette as the plugin map markers; the last layer naming a country wins.
    const TONE_COLORS: Record<string, string> = { default: '#4F46E5', success: '#10b981', warn: '#f59e0b', danger: '#ef4444' }
    const toneByA3: Record<string, string> = {}
    for (const layer of pluginLayers) {
      for (const c of layer.countries) {
        const a3 = A2_TO_A3[c.code]
        if (a3) toneByA3[a3] = c.tone || 'default'
      }
    }
    const featureA3 = (f: any) => f?.properties?.ADM0_A3 || f?.properties?.ISO_A3 || f?.properties?.['ISO3166-1-Alpha-3'] || f?.id
    const features = ((geoData as any).features || []).filter((f: any) => toneByA3[featureA3(f)] !== undefined)
    if (features.length === 0) return

    if (!mapInstance.current.getPane('atlasPluginPane')) {
      mapInstance.current.createPane('atlasPluginPane')
      const pane = mapInstance.current.getPane('atlasPluginPane')!
      pane.style.zIndex = '402'
      pane.style.pointerEvents = 'none'
    }
    pluginLayerRef.current = L.geoJSON({ type: 'FeatureCollection', features } as any, {
      pane: 'atlasPluginPane',
      interactive: false,
      style: (feature) => {
        const color = TONE_COLORS[toneByA3[featureA3(feature)]] || TONE_COLORS.default
        return { fillColor: color, fillOpacity: 0.18, color, weight: 1.4, dashArray: '4 3' }
      },
    } as L.GeoJSONOptions).addTo(mapInstance.current)
    // `loading` is a dep because the map itself is created once loading flips —
    // layers fetched before that would otherwise never get drawn.
  }, [geoData, pluginLayers, dark, loading])

  // Render sub-national region layer (zoom >= 5)
  useEffect(() => {
    if (!mapInstance.current) return

    // Remove existing region layer
    if (regionLayerRef.current) {
      mapInstance.current.removeLayer(regionLayerRef.current)
      regionLayerRef.current = null
    }

    if (Object.keys(regionGeoCache.current).length === 0) return

    // Build set of visited region codes and per-country name sets
    const visitedRegionCodes = new Set<string>()
    const visitedRegionNamesByCountry = new Map<string, Set<string>>()
    const regionPlaceCounts: Record<string, number> = {}
    for (const [countryCode, regions] of Object.entries(visitedRegions)) {
      const names = new Set<string>()
      for (const r of regions) {
        visitedRegionCodes.add(r.code)
        names.add(normalizeRegionName(r.name))
        regionPlaceCounts[r.code] = r.placeCount
        regionPlaceCounts[`${countryCode}:${normalizeRegionName(r.name)}`] = r.placeCount
      }
      visitedRegionNamesByCountry.set(countryCode, names)
    }

    // Match feature by ISO code OR region name scoped to the feature's country. Names are
    // normalized (diacritics/dash variants folded) since the geocoder's cached region_name
    // and the bundled boundaries' name don't always agree on accenting (e.g. a cached
    // "Ile-de-France" must still match the bundle's "Île-de-France") (#atlas-region-match).
    const isVisitedFeature = (f: any) => {
      if (visitedRegionCodes.has(f.properties?.iso_3166_2)) return true
      const countryA2 = (f.properties?.iso_a2 || '').toUpperCase()
      const countryNames = visitedRegionNamesByCountry.get(countryA2)
      if (!countryNames) return false
      const name = normalizeRegionName(f.properties?.name || '')
      if (countryNames.has(name)) return true
      const nameEn = normalizeRegionName(f.properties?.name_en || '')
      if (nameEn && countryNames.has(nameEn)) return true
      return false
    }

    // Include ALL region features — visited ones get colored fill, unvisited get outline only
    const allFeatures: any[] = []
    for (const geo of Object.values(regionGeoCache.current)) {
      for (const f of geo.features) {
        allFeatures.push(f)
      }
    }
    if (allFeatures.length === 0) return

    // Use same colors as country layer
    const VISITED_COLORS = ['#6366f1','#ec4899','#14b8a6','#f97316','#8b5cf6','#ef4444','#3b82f6','#22c55e','#06b6d4','#f43f5e','#a855f7','#10b981','#0ea5e9','#e11d48','#0d9488','#7c3aed','#2563eb','#dc2626','#059669','#d946ef']
    const countryA3Set = data ? data.countries.map(c => A2_TO_A3[c.code]).filter(Boolean) : []
    const countryColorMap: Record<string, string> = {}
    countryA3Set.forEach((a3, i) => { countryColorMap[a3] = VISITED_COLORS[i % VISITED_COLORS.length] })
    // Map country A2 code to country color
    const a2ColorMap: Record<string, string> = {}
    if (data) data.countries.forEach(c => { if (A2_TO_A3[c.code] && countryColorMap[A2_TO_A3[c.code]]) a2ColorMap[c.code] = countryColorMap[A2_TO_A3[c.code]] })

    const mergedGeo = { type: 'FeatureCollection', features: allFeatures }

    const svgRenderer = L.svg({ pane: 'regionPane' })

    regionLayerRef.current = L.geoJSON(mergedGeo as any, {
      renderer: svgRenderer,
      interactive: true,
      pane: 'regionPane',
      style: (feature) => {
        const countryA2 = (feature?.properties?.iso_a2 || '').toUpperCase()
        const visited = isVisitedFeature(feature)
        return visited ? {
          fillColor: a2ColorMap[countryA2] || '#6366f1',
          fillOpacity: 0.85,
          color: dark ? '#888' : '#64748b',
          weight: 1.2,
        } : {
          fillColor: dark ? '#ffffff' : '#000000',
          fillOpacity: 0.03,
          color: dark ? '#555' : '#94a3b8',
          weight: 1,
        }
      },
      onEachFeature: (feature, layer) => {
        const regionName = feature?.properties?.name || ''
        const regionNameEn = feature?.properties?.name_en || ''
        const countryName = feature?.properties?.admin || ''
        const regionCode = feature?.properties?.iso_3166_2 || ''
        const countryA2 = (feature?.properties?.iso_a2 || '').toUpperCase()
        const visited = isVisitedFeature(feature)
        const count = regionPlaceCounts[regionCode] || regionPlaceCounts[`${countryA2}:${normalizeRegionName(regionName)}`] || regionPlaceCounts[`${countryA2}:${normalizeRegionName(regionNameEn)}`] || 0
        layer.on('click', () => {
          if (!countryA2) return
          if (visited) {
            // Any visited region can be hidden now, not just a manually-marked one — a
            // region derived from a real place (e.g. one a border-simplification gap
            // misassigned) is exactly the case that needs it. Country details remain
            // reachable via the country search/sidebar.
            setConfirmActionRef.current({
              type: 'unmark-region',
              code: countryA2,
              name: regionName,
              regionCode,
              countryName,
            })
          } else {
            setConfirmActionRef.current({
              type: 'choose-region',
              code: countryA2,       // country A2 code — used for flag display
              name: regionName,      // region name — shown as heading
              regionCode,
              countryName,
            })
          }
        })
        layer.on('mouseover', (e: any) => {
          e.target.setStyle(visited
            ? { fillOpacity: 0.95, weight: 2, color: dark ? '#818cf8' : '#4f46e5' }
            : { fillOpacity: 0.15, fillColor: dark ? '#818cf8' : '#4f46e5', weight: 1.5, color: dark ? '#818cf8' : '#4f46e5' }
          )
          const tt = regionTooltipRef.current
          if (tt) {
            tt.style.display = 'block'
            tt.style.left = e.originalEvent.clientX + 12 + 'px'
            tt.style.top = e.originalEvent.clientY - 10 + 'px'
            tt.innerHTML = visited
              ? `<div style="font-weight:600;margin-bottom:3px">${regionName}</div><div style="opacity:0.5;font-size:10px">${countryName}</div><div style="margin-top:5px;font-size:11px"><b>${count}</b> ${count === 1 ? 'place' : 'places'}</div>`
              : `<div style="font-weight:600;margin-bottom:3px">${regionName}</div><div style="opacity:0.5;font-size:10px">${countryName}</div>`
          }
        })
        layer.on('mousemove', (e: any) => {
          const tt = regionTooltipRef.current
          if (tt) { tt.style.left = e.originalEvent.clientX + 12 + 'px'; tt.style.top = e.originalEvent.clientY - 10 + 'px' }
        })
        layer.on('mouseout', (e: any) => {
          regionLayerRef.current?.resetStyle(e.target)
          const tt = regionTooltipRef.current
          if (tt) tt.style.display = 'none'
        })
      },
    } as L.GeoJSONOptions & { renderer?: L.Renderer })
    // Only add to map if currently in region mode — otherwise hold it ready for when user zooms in
    if (mapInstance.current.getZoom() >= 6) {
      regionLayerRef.current.addTo(mapInstance.current)
    }
  }, [regionGeoLoaded, visitedRegions, dark, t])

  const handleMarkCountry = (code: string, name: string): void => {
    setConfirmAction({ type: 'choose', code, name })
  }
  handleMarkCountryRef.current = handleMarkCountry
  setConfirmActionRef.current = setConfirmAction

  const handleUnmarkCountry = (code: string): void => {
    const country = data?.countries.find(c => c.code === code)
    setConfirmAction({ type: 'unmark', code, name: resolveName(code) })
  }

  const select_country_from_search = (country_code: string): void => {
    const country_label = resolveName(country_code)
    set_atlas_country_search(country_label)
    set_atlas_country_open(false)
    set_atlas_country_results([])

    const layer = country_layer_by_a2_ref.current[country_code]
    try {
      if (layer?.getBounds && mapInstance.current) {
        mapInstance.current.fitBounds(layer.getBounds(), { padding: [24, 24], animate: true, maxZoom: 6 })
      }
    } catch (e ) {
      console.error('Error fitting bounds', e)
     }

    // Mirror the map-click behaviour so an already-visited country can be removed
    // straight from search. Tiny countries (Vatican City, Singapore) are hard to
    // hit on the map, so search was the only way in — but it always opened the
    // "Mark / Bucket" dialog with no Remove option.
    const visited = data?.countries.find(c => c.code === country_code)
    if (visited) {
      if (visited.placeCount === 0 && visited.tripCount === 0) {
        handleUnmarkCountry(country_code)
      } else {
        loadCountryDetailRef.current(country_code)
      }
      return
    }
    setConfirmAction({ type: 'choose', code: country_code, name: country_label })
  }

  const executeConfirmAction = async (): Promise<void> => {
    if (!confirmAction) return
    const { type, code } = confirmAction
    setConfirmAction(null)

    // Update local state immediately (no API reload = no map re-render flash)
    if (type === 'mark') {
      apiClient.post(`/addons/atlas/country/${code}/mark`).catch(() => {})
      setData(prev => {
        if (!prev || prev.countries.find(c => c.code === code)) return prev
        const cont = continentForCountry(code)
        return {
          ...prev,
          countries: [...prev.countries, { code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }],
          stats: { ...prev.stats, totalCountries: prev.stats.totalCountries + 1 },
          continents: { ...prev.continents, [cont]: (prev.continents?.[cont] || 0) + 1 },
        }
      })
    } else {
      apiClient.delete(`/addons/atlas/country/${code}/mark`).catch(() => {})
      setSelectedCountry(null)
      setCountryDetail(null)
      setData(prev => {
        if (!prev) return prev
        const c = prev.countries.find(c => c.code === code)
        if (!c || c.placeCount > 0 || c.tripCount > 0) return prev
        const cont = continentForCountry(code)
        return {
          ...prev,
          countries: prev.countries.filter(c => c.code !== code),
          stats: { ...prev.stats, totalCountries: Math.max(0, prev.stats.totalCountries - 1) },
          continents: { ...prev.continents, [cont]: Math.max(0, (prev.continents?.[cont] || 0) - 1) },
        }
      })
      setVisitedRegions(prev => {
        if (!prev[code]) return prev
        const next = { ...prev }
        delete next[code]
        return next
      })
    }
  }

  const handleAddBucketItem = async (): Promise<void> => {
    if (!bucketForm.name.trim()) return
    try {
      const data: Record<string, unknown> = { name: bucketForm.name.trim() }
      if (bucketForm.notes.trim()) data.notes = bucketForm.notes.trim()
      if (bucketForm.lat && bucketForm.lng) { data.lat = parseFloat(bucketForm.lat); data.lng = parseFloat(bucketForm.lng) }
      const targetDate = bucketForm.target_date || (bucketPoiMonth > 0 && bucketPoiYear > 0 ? `${bucketPoiYear}-${String(bucketPoiMonth).padStart(2, '0')}` : null)
      if (targetDate) data.target_date = targetDate
      const r = await apiClient.post('/addons/atlas/bucket-list', data)
      setBucketList(prev => [r.data.item, ...prev])
      setBucketForm({ name: '', notes: '', lat: '', lng: '', target_date: '' })
      setBucketSearch(''); setBucketSearchResults([]); setBucketPoiMonth(0); setBucketPoiYear(0)
      setShowBucketAdd(false)
    } catch { /* */ }
  }

  const handleDeleteBucketItem = async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/addons/atlas/bucket-list/${id}`)
      setBucketList(prev => prev.filter(i => i.id !== id))
    } catch { /* */ }
  }

  const handleBucketPoiSearch = async () => {
    if (!bucketSearch.trim()) return
    setBucketSearching(true)
    try {
      const result = await mapsApi.search(bucketSearch, language)
      setBucketSearchResults(result.places || [])
    } catch (err) { console.error('Bucket-list place search failed:', err) } finally { setBucketSearching(false) }
  }

  const handleSelectBucketPoi = (result: any) => {
    const targetDate = bucketPoiMonth > 0 && bucketPoiYear > 0 ? `${bucketPoiYear}-${String(bucketPoiMonth).padStart(2, '0')}` : null
    setBucketForm({
      name: result.name || bucketSearch,
      notes: '',
      lat: String(result.lat || ''),
      lng: String(result.lng || ''),
      target_date: targetDate || '',
    })
    setBucketSearchResults([])
    setBucketSearch('')
  }

  // Render bucket list markers on map
  useEffect(() => {
    if (!mapInstance.current) return
    if (bucketMarkersRef.current) {
      mapInstance.current.removeLayer(bucketMarkersRef.current)
    }
    if (bucketList.length === 0) return
    const markers = bucketList.filter(b => b.lat && b.lng).map(b => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:rgba(251,191,36,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      return L.marker([b.lat!, b.lng!], { icon }).bindTooltip(
        `<div style="font-size:12px;font-weight:600">${b.name}</div>${b.notes ? `<div style="font-size:10px;opacity:0.7;margin-top:2px">${b.notes}</div>` : ''}`,
        { className: 'atlas-tooltip', direction: 'top', offset: [0, -14] }
      )
    })
    bucketMarkersRef.current = L.layerGroup(markers).addTo(mapInstance.current)
  }, [bucketList])

  const loadCountryDetail = async (code: string): Promise<void> => {
    setSelectedCountry(code)
    try {
      const r = await apiClient.get(`/addons/atlas/country/${code}`)
      setCountryDetail(r.data)
    } catch { /* */ }
  }
  loadCountryDetailRef.current = loadCountryDetail

  const stats = data?.stats || { totalTrips: 0, totalPlaces: 0, totalCountries: 0, totalDays: 0 }
  const countries = data?.countries || []

  return {
    t, language, navigate, resolveName, dark, loading,
    mapRef, regionTooltipRef, panelRef, glareRef, borderGlareRef,
    handlePanelMouseMove, handlePanelMouseLeave,
    data, setData, stats, countries, selectedCountry, countryDetail,
    loadCountryDetail, handleUnmarkCountry, select_country_from_search,
    visitedRegions, setVisitedRegions,
    atlas_country_search, set_atlas_country_search,
    atlas_country_results, set_atlas_country_results,
    atlas_country_open, set_atlas_country_open, atlas_country_options,
    confirmAction, setConfirmAction, executeConfirmAction,
    bucketMonth, setBucketMonth, bucketYear, setBucketYear,
    bucketList, setBucketList, bucketTab, setBucketTab,
    showBucketAdd, setShowBucketAdd, bucketForm, setBucketForm,
    handleAddBucketItem, handleDeleteBucketItem, handleBucketPoiSearch, handleSelectBucketPoi,
    bucketSearchResults, setBucketSearchResults,
    bucketPoiMonth, setBucketPoiMonth, bucketPoiYear, setBucketPoiYear,
    bucketSearching, bucketSearch, setBucketSearch,
  }
}
