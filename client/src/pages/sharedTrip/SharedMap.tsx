import L from 'leaflet'
import { createElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
// MapView brings these sheets for the planner, and this page never mounts it.
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { CLUSTER_OPTIONS, createClusterIcon } from '../../components/Map/markerCluster'
import VectorBasemap from '../../components/Map/VectorBasemap'
import { getCategoryIcon } from '../../components/shared/categoryIcons'
import CustomSelect from '../../components/shared/CustomSelect'
import { Tooltip as HintTooltip } from '../../components/shared/Tooltip'
import { OFM_POSITRON, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_MAX_ZOOM, attributionForTile } from '../../constants/mapDefaults'
import { useTranslation } from '../../i18n'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { computeMapViewport, TILE_SIZE_RASTER } from '../../utils/mapViewport'
import { safeHexColor } from '../../utils/safeColor'
import { resolveBasemap } from '../../utils/tileUrl'

// Injected into Leaflet's marker HTML, where CSS variables cannot reach, the same
// reason MapView.tsx is exempt from theme:lint outright.
const ORDER_BADGE_STYLE = 'position:absolute;bottom:-4px;right:-4px;min-width:16px;height:16px;border-radius:8px;padding:0 3px;background:rgba(255,255,255,0.94);border:1.5px solid rgba(0,0,0,0.15);box-shadow:0 1px 4px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;font-weight:800;color:#111827;line-height:1;box-sizing:border-box;white-space:nowrap;' // theme-lint-disable

export interface MapPlace {
  id: number
  name: string
  lat: number
  lng: number
  category?: { color?: string | null; icon?: string | null } | null
  category_color?: string | null
  category_icon?: string | null
}

function createMarkerIcon(place: MapPlace, orderNumbers?: number[] | null) {
  const cat = place.category
  // This page answers without a guard, so an unescaped colour here reaches
  // people who have no account on the instance at all.
  // The payload carries the category in two shapes: nested on a day's assignments,
  // flat on the trip-wide pool. Reading only the nested one dropped every marker
  // outside a day selection to the placeholder colour.
  const color = safeHexColor(cat?.color ?? place.category_color, '#6366f1')
  const CatIcon = getCategoryIcon(cat?.icon ?? place.category_icon)
  const iconSvg = renderIconMarkup(createElement(CatIcon, { size: 14, strokeWidth: 2, color: 'white' }))
  // Position in the day's order, same contract as the planner: a stop the day
  // visits twice shows both, e.g. "1, 3". The values are array indices, never payload.
  const badge = orderNumbers?.length
    ? `<span style="${ORDER_BADGE_STYLE}font-size:${orderNumbers.length > 1 ? 7.5 : 9}px;">${orderNumbers.join(', ')}</span>`
    : ''
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="position:relative;width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2.5px solid white;">${iconSvg}${badge}</div>`,
  })
}

// One frame for both the opening camera and every later fit, so the map opens on
// exactly the view that picking a day and going back to the whole trip produces.
// The top edge leaves room for the day picker floating over the map.
const FRAME_PADDING = { top: 64, right: 48, bottom: 48, left: 48 }
const FRAME_MAX_ZOOM = 14

function FitBoundsToPlaces({ places, framedOnMount }: { places: MapPlace[]; framedOnMount: boolean }) {
  const map = useMap()
  const fitRan = useRef(false)
  // The list is rebuilt on every render, so keying the effect on the coordinates
  // rather than the array identity is what stops an unrelated re-render (the
  // language picker, a late FX response) from throwing the viewer's pan and zoom away.
  const fitKey = places.map(p => `${p.lat},${p.lng}`).join('|')
  useEffect(() => {
    if (places.length === 0) return
    // The map already opened framed on these places; fitting again would only re-do it.
    // Picking a day afterwards still refits to that day.
    if (!fitRan.current && framedOnMount) {
      fitRan.current = true
      return
    }
    fitRan.current = true
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, {
      paddingTopLeft: [FRAME_PADDING.left, FRAME_PADDING.top],
      paddingBottomRight: [FRAME_PADDING.right, FRAME_PADDING.bottom],
      maxZoom: FRAME_MAX_ZOOM,
    })
  }, [fitKey, map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

interface SharedMapProps {
  places: MapPlace[]
  /** The selected day's stops in order, for the dashed line between them. */
  line: MapPlace[]
  orderByPlace: Record<number, number[]>
  cartoApiKey?: string | null
  days: { id: number; day_number: number; title?: string | null; date?: string | null }[]
  selectedDay: number | null
  onSelectDay: (id: number | null) => void
}

/**
 * The trip on a map, with the days as chips floating over its top edge the
 * way the planner floats its filters: the same setter as the day cards, so the
 * map and the list can never disagree on which day is open.
 */
export function SharedMap({ places, line, orderByPlace, cartoApiKey, days, selectedDay, onSelectDay }: SharedMapProps) {
  // The card's own size, read before the map mounts. Framing for the browser window
  // instead zoomed a card a fraction of its size far too close, and the fit below
  // then skipped the correction because it believed the map had opened framed (#2549).
  const cardRef = useRef<HTMLDivElement>(null)
  const [card, setCard] = useState<{ width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const el = cardRef.current
    if (el) setCard({ width: el.clientWidth, height: el.clientHeight })
  }, [])
  // A card with no layout yet (hidden, or a test DOM) has nothing to frame against,
  // so the map opens near the places and the first fit does the real framing.
  const measured = card !== null && card.width > 0 && card.height > 0
  // Open framed on the trip's places instead of on Paris. MapContainer only reads
  // center/zoom at mount, so recomputing this per render is free.
  const framed = computeMapViewport(places, {
    tileSize: TILE_SIZE_RASTER,
    padding: FRAME_PADDING,
    maxZoom: FRAME_MAX_ZOOM,
    ...(measured ? { width: card.width, height: card.height } : {}),
  })
  // Whole levels, as fitBounds settles on: Leaflet rounds a fractional opening zoom
  // to the nearest level, and rounding up crops the outermost places.
  const initialView = framed
    ? { center: framed.center, zoom: Math.floor(framed.zoom) }
    : { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM }
  // A visitor of a share link has no settings of their own, so the basemap is the
  // app default: OpenFreeMap, a vector style that needs no key at all. The owner's
  // CARTO key still travels in the payload and is still applied, because a raster
  // template reaching this page keeps working, and without the key CARTO would
  // stamp "API KEY REQUIRED" over it.
  const basemap = resolveBasemap(null, OFM_POSITRON, cartoApiKey)

  return (
    // `isolate` keeps Leaflet's pane z-indexes inside the card, under the sticky tab bar.
    <div ref={cardRef} className="relative isolate h-full w-full overflow-hidden rounded-2xl border border-edge-faint bg-surface-tertiary shadow-sm">
      {card && <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        zoomControl={false}
        // Same reason as the planner map: a vector basemap contributes
        // no zoom ceiling, and fitBounds below asks for one.
        maxZoom={MAP_MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
      >
        {basemap.kind === 'vector' ? (
          <VectorBasemap style={basemap.style} />
        ) : (
          <TileLayer url={basemap.url} attribution={attributionForTile(basemap.url)} referrerPolicy="strict-origin-when-cross-origin" />
        )}
        <FitBoundsToPlaces places={places} framedOnMount={measured && framed !== null} />
        {selectedDay != null && line.length > 1 && (
          <Polyline
            positions={line.map(p => [p.lat, p.lng])}
            // Dashed and straight on purpose: it shows the order of the day's stops,
            // not the roads between them. A real route would mean sending the
            // itinerary to a third party for every anonymous visitor of a shared
            // link, with no way for the trip's owner to opt out.
            pathOptions={{ color: '#0a84ff', weight: 3, opacity: 0.85, dashArray: '6 8', lineCap: 'round' }} // theme-lint-disable
            interactive={false}
          />
        )}
        {/* Clustered like the planner's map, so nearby stops stay tappable (#2343). */}
        <MarkerClusterGroup {...CLUSTER_OPTIONS} iconCreateFunction={createClusterIcon}>
          {places.map(p => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={createMarkerIcon(p, orderByPlace[p.id] ?? null)}>
              <Tooltip>{p.name}</Tooltip>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>}

      {days.length > 0 && <DayPicker days={days} selectedDay={selectedDay} onSelectDay={onSelectDay} />}
    </div>
  )
}

/**
 * Which day the map shows, as a select over the map's top edge with a step
 * back and forth beside it: a trip of three weeks does not fit a row of chips.
 */
function DayPicker({ days, selectedDay, onSelectDay }: Pick<SharedMapProps, 'days' | 'selectedDay' | 'onSelectDay'>) {
  const { t, locale } = useTranslation()
  const order: (number | null)[] = [null, ...days.map(d => d.id)]
  const at = Math.max(0, order.indexOf(selectedDay))
  const options = [
    { value: 'all', label: t('shared.wholeTrip') },
    ...days.map(d => ({
      value: d.id,
      label: d.title || t('dayplan.dayN', { n: d.day_number }),
      badge: d.date ? new Date(`${d.date}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }) : undefined,
    })),
  ]
  return (
    // The select's own frame would stack a second box inside the pill, so its trigger
    // goes flat here and the pill is the frame.
    <div data-testid="map-day-picker" className="absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-24px)] items-center gap-0.5 rounded-full bg-surface-card p-0.5 shadow-md [&>div>button]:!border-transparent [&>div>button]:!bg-transparent [&>div>button]:!py-[3px]">
      <StepButton label={t('reservations.timeline.prevDay')} disabled={at === 0} onClick={() => onSelectDay(order[at - 1])}>
        <ChevronLeft size={14} strokeWidth={2.2} />
      </StepButton>
      <CustomSelect
        value={selectedDay ?? 'all'}
        onChange={v => onSelectDay(v === 'all' ? null : Number(v))}
        options={options}
        size="sm"
        style={{ width: 210, minWidth: 0 }}
      />
      <StepButton label={t('reservations.timeline.nextDay')} disabled={at === order.length - 1} onClick={() => onSelectDay(order[at + 1])}>
        <ChevronRight size={14} strokeWidth={2.2} />
      </StepButton>
    </div>
  )
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <HintTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-muted transition-colors enabled:hover:bg-surface-hover enabled:hover:text-content disabled:opacity-35"
      >
        {children}
      </button>
    </HintTooltip>
  )
}
