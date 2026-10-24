import { createElement } from 'react'
import { escapeHtml } from '@trek/shared'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import { poiAppearance, type Poi } from './poiCategories'
import { poiDetailRows } from './poiMarker'
import type { Place } from '../../types'

// HTML builders for the Mapbox GL hover popup. The Leaflet map already shows a
// name/category/address card on hover (a cursor-following overlay); Mapbox GL has
// no equivalent, so these produce the same card as an HTML string for a
// mapboxgl.Popup. Kept framework-agnostic (plain strings) on purpose.

type PlaceWithCategory = Place & {
  category_color?: string | null
  category_icon?: string | null
  category_name?: string | null
}

function esc(s: string | null | undefined): string {
  return s ? escapeHtml(String(s)) : ''
}

// Render a lucide category icon to an inline SVG string in the given colour.
function iconSvg(iconName: string | null | undefined, size: number, color: string): string {
  const Icon = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin']
  try {
    return renderIconMarkup(createElement(Icon, { size, color, strokeWidth: 2 }))
  } catch {
    return ''
  }
}

// Only data: thumbnails and our own photo-proxy URLs are safe to drop straight
// into an <img src> — everything else is a fetch seed, not a displayable URL.
function isDisplayablePhoto(url: string | null | undefined): url is string {
  return !!url && (url.startsWith('data:') || url.startsWith('/api/maps/place-photo/'))
}

const CARD_OPEN = '<div style="font-family:var(--font-system);max-width:220px;">'
const NAME_STYLE = 'font-weight:600;font-size:12.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
const ADDR_STYLE = 'font-size:11px;color:#9ca3af;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
// A plugin POI's detail rows: label and value side by side, the value free to wrap so a
// long one grows the card downwards instead of pushing it off the side of the map. The
// label column stops at 45% and wraps too, so a long label cannot squeeze its value
// into a strip a few letters wide.
const DETAILS_STYLE = 'display:grid;grid-template-columns:fit-content(45%) 1fr;gap:1px 6px;margin-top:4px;font-size:11px;line-height:1.35;'
const DETAIL_LABEL_STYLE = 'color:#6b7280;overflow-wrap:anywhere;'
const DETAIL_VALUE_STYLE = 'color:#111827;overflow-wrap:anywhere;'

/** Hover-popup card for a planned place: optional photo, name, category row, address. */
export function buildPlacePopupHtml(place: PlaceWithCategory, photoUrl: string | null): string {
  const img = isDisplayablePhoto(photoUrl)
    ? `<div style="width:100%;height:84px;border-radius:8px;overflow:hidden;margin-bottom:6px;background:#f3f4f6;"><img src="${esc(photoUrl)}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`
    : ''
  const category =
    place.category_name && place.category_icon
      ? `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">${iconSvg(place.category_icon, 11, place.category_color || '#6b7280')}<span style="font-size:11px;color:#6b7280;">${esc(place.category_name)}</span></div>`
      : ''
  const address = place.address ? `<div style="${ADDR_STYLE}">${esc(place.address)}</div>` : ''
  return `${CARD_OPEN}${img}<div style="${NAME_STYLE}">${esc(place.name)}</div>${category}${address}</div>`
}

/**
 * Hover-popup card for an "explore" POI: category-coloured icon, name, address, and
 * for a plugin POI the rows the plugin knows about it. The colour and icon come from
 * poiAppearance, so a plugin's are checked before they are written into the card, and
 * every piece of text is escaped.
 */
export function buildPoiPopupHtml(poi: Poi): string {
  const { color, Icon } = poiAppearance(poi)
  const icon = Icon ? renderIconMarkup(createElement(Icon, { size: 12, color, strokeWidth: 2 })) : ''
  const head = `<div style="display:flex;align-items:center;gap:5px;"><span style="flex-shrink:0;display:inline-flex;line-height:0;">${icon}</span><span style="${NAME_STYLE}">${esc(poi.name)}</span></div>`
  const address = poi.address ? `<div style="${ADDR_STYLE}">${esc(poi.address)}</div>` : ''
  return `${CARD_OPEN}${head}${address}${poiDetailsHtml(poi)}</div>`
}

function poiDetailsHtml(poi: Poi): string {
  const rows = poiDetailRows(poi)
  if (!rows.length) return ''
  const cells = rows.map(row => `<span style="${DETAIL_LABEL_STYLE}">${esc(row.label)}</span><span style="${DETAIL_VALUE_STYLE}">${esc(row.value)}</span>`)
  return `<div style="${DETAILS_STYLE}">${cells.join('')}</div>`
}
