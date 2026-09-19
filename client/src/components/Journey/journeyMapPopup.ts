import { escapeHtml } from '@trek/shared'

/**
 * The card a journey marker shows: what the entry is called, where and when, and
 * a glimpse of its photos.
 *
 * One module for both renderers. Leaflet had a plain one-line label and the GL
 * map a two-line card, so the same marker said different things depending on a
 * setting nobody links to the journey — and adding the photo strip to only one
 * of them would have widened that split (discussion #2299).
 *
 * It is an HTML string rather than a component because both map libraries take
 * markup, not React: MapLibre through `Popup.setHTML`, Leaflet through
 * `bindTooltip`. Everything that comes from a person — a title, a place — is
 * escaped here, once, because this markup is also what the public journey page
 * hands to strangers.
 */

export interface JourneyPopupContent {
  title: string
  place?: string
  date?: string
  /** Already-resolved thumbnail URLs. The share view signs its own, so the caller builds them. */
  photoUrls?: string[]
}

/**
 * The attribute a clickable thumbnail carries, holding its index in the entry.
 *
 * A delegated listener on the popup reads it: the card is an HTML string handed
 * to a map library, so there is no React tree to hang an onClick on.
 */
export const SHOT_INDEX_ATTR = 'data-shot'

/** At most this many thumbnails; beyond three the strip stops being a glimpse. */
const MAX_PHOTOS = 3

/**
 * The short date for a marker card: "12 Sep", in the reader's own order.
 *
 * Takes the entry's stored date, which is a plain day with no clock, and pins it
 * to local midnight — parsed bare, a `YYYY-MM-DD` is UTC and slides a day back
 * for every reader west of Greenwich.
 */
export function formatMarkerDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d)
  } catch {
    return iso
  }
}

export function journeyPopupHtml({ title, place, date, photoUrls = [] }: JourneyPopupContent): string {
  const shots = photoUrls.slice(0, MAX_PHOTOS)
  // Columns from the count, not a fixed three: two pictures should fill the card,
  // not sit next to a gap where a third would have gone.
  const photos = shots.length
    ? `<div class="trek-journey-popup-shots${shots.length === 1 ? ' is-single' : ''}" style="grid-template-columns:repeat(${shots.length},1fr)">${shots
        .map((url, i) => `<span class="trek-journey-popup-shot" ${SHOT_INDEX_ATTR}="${i}" style="background-image:url('${escapeHtml(url)}')"></span>`)
        .join('')}</div>`
    : ''

  const chips: string[] = []
  if (place) chips.push(`<span class="trek-journey-popup-chip trek-journey-popup-place">${PIN_ICON}<span>${escapeHtml(place)}</span></span>`)
  if (date) chips.push(`<span class="trek-journey-popup-chip trek-journey-popup-date">${CAL_ICON}<span>${escapeHtml(date)}</span></span>`)

  return `${photos}
      <div class="trek-journey-popup-title">${escapeHtml(title)}</div>
      ${chips.length ? `<div class="trek-journey-popup-sub">${chips.join('')}</div>` : ''}`
}

// Inline rather than the lucide components: this markup lives outside React's tree.
const PIN_ICON =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
const CAL_ICON =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'

/**
 * Inject the card's styles once per document.
 *
 * A stylesheet rather than inline styles because the card has states (dark, the
 * single-photo strip) and two hosts. `.trek-journey-popup` is MapLibre's popup
 * shell; `.trek-journey-tooltip` is Leaflet's, whose own chrome is stripped back
 * so the card inside provides all of it.
 */
export function ensureJourneyPopupStyle(): void {
  if (document.getElementById('trek-journey-popup-style')) return
  const s = document.createElement('style')
  s.id = 'trek-journey-popup-style'
  s.textContent = `
    .mapboxgl-popup.trek-journey-popup,
    .maplibregl-popup.trek-journey-popup { pointer-events: none; animation: trek-journey-popup-in 180ms ease-out; }
    /* The card as a whole never takes the pointer — it sits over the map and would
       swallow drags. The photo strip is the one exception, and only where the host
       wired a handler for it. */
    .trek-journey-popup.is-interactive .trek-journey-popup-shots { pointer-events: auto; cursor: zoom-in; }
    .trek-journey-popup.is-interactive .trek-journey-popup-shot:hover { filter: brightness(1.06); }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-content,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-content,
    .leaflet-tooltip.trek-journey-tooltip {
      padding: 9px 14px 10px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06);
      font-family: var(--font-system);
      min-width: 160px;
      max-width: 280px;
      white-space: normal;
    }
    /* Leaflet paints its own tip and font on the tooltip; the card supplies both. */
    .leaflet-tooltip.trek-journey-tooltip { color: #18181B; font-weight: 400; }
    .leaflet-tooltip.trek-journey-tooltip::before { display: none; }
    .mapboxgl-popup.trek-journey-popup.trek-dark .mapboxgl-popup-content,
    .maplibregl-popup.trek-journey-popup.trek-dark .maplibregl-popup-content,
    .dark .leaflet-tooltip.trek-journey-tooltip {
      background: rgba(24, 24, 27, 0.88);
      border-color: rgba(255, 255, 255, 0.08);
      color: #FAFAFA;
    }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-tip,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.94);
      border-bottom-color: rgba(255, 255, 255, 0.94);
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .mapboxgl-popup-tip,
    .maplibregl-popup.trek-journey-popup.trek-dark .mapboxgl-popup-tip {
      border-top-color: rgba(24, 24, 27, 0.88);
      border-bottom-color: rgba(24, 24, 27, 0.88);
    }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-close-button,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-close-button { display: none; }
    /* A glimpse of the entry's own pictures, above its name. Backgrounds rather
       than <img>: no layout shift while they load, and no broken-image glyph if
       one 404s — the strip just stays the placeholder grey.

       Out to the card's edges via negative margins, and the rounding lives on the
       strip rather than on each tile: the two corners that meet the card's top are
       round, the edges where two pictures touch stay square. */
    .trek-journey-popup-shots {
      display: grid;
      gap: 2px;
      margin: -9px -14px 9px;
      border-radius: 13px 13px 0 0;
      overflow: hidden;
    }
    .trek-journey-popup-shot {
      display: block;
      height: 62px;
      background-color: rgba(0, 0, 0, 0.06);
      background-size: cover;
      background-position: center;
    }
    .trek-journey-popup-shots.is-single .trek-journey-popup-shot { height: 96px; }
    .mapboxgl-popup.trek-journey-popup.trek-dark .trek-journey-popup-shot,
    .maplibregl-popup.trek-journey-popup.trek-dark .trek-journey-popup-shot,
    .dark .leaflet-tooltip.trek-journey-tooltip .trek-journey-popup-shot {
      background-color: rgba(255, 255, 255, 0.08);
    }
    .trek-journey-popup-title {
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #18181B;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .trek-journey-popup-title,
    .maplibregl-popup.trek-journey-popup.trek-dark .trek-journey-popup-title,
    .dark .leaflet-tooltip.trek-journey-tooltip .trek-journey-popup-title { color: #FAFAFA; }
    /* Place and date as their own chips rather than one grey line divided by a
       middle dot: two different kinds of fact should not read as one sentence. */
    .trek-journey-popup-sub {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 6px;
      line-height: 1;
    }
    .trek-journey-popup-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.05);
      color: #52525B;
      font-size: 10.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .trek-journey-popup-chip,
    .maplibregl-popup.trek-journey-popup.trek-dark .trek-journey-popup-chip,
    .dark .leaflet-tooltip.trek-journey-tooltip .trek-journey-popup-chip {
      background: rgba(255, 255, 255, 0.1);
      color: #D4D4D8;
    }
    .trek-journey-popup-chip svg { flex: 0 0 auto; opacity: 0.7; }
    .trek-journey-popup-chip span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .trek-journey-popup-place { min-width: 0; }
    .trek-journey-popup-date { flex: 0 0 auto; }
    @keyframes trek-journey-popup-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `
  document.head.appendChild(s)
}
