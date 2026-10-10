import { Loader2, RotateCcw, Search } from 'lucide-react'
import { offersGoogleRetry } from '../../../../utils/placeSource'
import { usePlaceSearch, type MapsPlace } from '../../../../components/Planner/usePlaceSearch'
import { FIELD_CLS } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'

/** Fields a search pick can contribute to the place form. */
export interface PlSearchPick {
  name?: string
  address?: string
  lat?: string
  lng?: string
  google_place_id?: string
  google_ftid?: string
  osm_id?: string
  amap_poi_id?: string
  website?: string
  phone?: string
  /**
   * The full record the pick came from. mergeResult ignores unknown keys, so
   * this rides along for free, and the details block hands it to the server so
   * the enrichment call can skip its own details lookup — one fewer provider
   * round trip on a phone network.
   */
  details?: MapsPlace
}

/** The same mark the desktop form shows, in the sheet's own tokens. */
function SourceMark({ label }: { label: string | null }) {
  if (!label) return null
  return (
    <span className="shrink-0 rounded-md border border-[color:var(--m-rowbr)] px-1.5 py-0.5 font-geist text-[0.5625rem] font-medium text-m-muted">
      {label}
    </span>
  )
}

interface PlPlaceSearchProps {
  planner: TripPlanner
  /** Search bias derived from the trip's existing places (trip centre). */
  locationBias?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } }
  onPick: (pick: PlSearchPick) => void
  /**
   * A suggestion was tapped: only its name goes into the form while its place is
   * looked up, as on the desktop. Handing it over as a pick would clear every
   * field the previous pick filled, and a failed lookup would leave them empty.
   */
  onSuggestionName: (name: string) => void
  /** True while a suggestion's details are being resolved (name spinner). */
  onResolvingChange?: (resolving: boolean) => void
}

function placeToPick(place: MapsPlace): PlSearchPick {
  const s = (v: unknown) => (v == null ? undefined : String(v))
  return {
    name: s(place.name),
    address: s(place.address),
    lat: s(place.lat),
    lng: s(place.lng),
    google_place_id: s(place.google_place_id),
    google_ftid: s(place.google_ftid),
    osm_id: s(place.osm_id),
    amap_poi_id: s(place.amap_poi_id),
    website: s(place.website),
    phone: s(place.phone),
    details: place,
  }
}

/**
 * Search row of the place form: Google/OSM text search biased on the trip
 * centre, autocomplete dropdown, plus Google-Maps-URL and "lat, lng" paste
 * detection — the mobile counterpart of PlaceFormModal's search block, on the
 * same search logic (usePlaceSearch).
 */
export default function PlPlaceSearch({ planner, locationBias, onPick, onSuggestionName, onResolvingChange }: PlPlaceSearchProps) {
  const { t, toast } = planner
  const {
    query, setQuery, results, suggestions, setSuggestions, acSource, searchSource, searching, googleAnswers,
    sourceLabel, runSearch: handleSearch, pickPlace: applyPlace, selectSuggestion: handleSelectSuggestion,
  } = usePlaceSearch({
    variant: 'sheet',
    locationBias,
    t,
    toast,
    onPlace: place => onPick(placeToPick(place)),
    onSuggestionName,
    onMapLink: resolved => onPick({
      name: resolved.name || undefined,
      address: resolved.address || undefined,
      lat: String(resolved.lat),
      lng: String(resolved.lng),
      google_ftid: resolved.google_ftid || undefined,
    }),
    onCoordinates: (lat, lng) => onPick({ lat, lng }),
    onResolvingChange,
  })

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleSearch()
            }
          }}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder={t('places.mapsSearchPlaceholder')}
          className={`${FIELD_CLS} flex-1`}
        />
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={searching}
          aria-label={t('common.search')}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-60"
        >
          {searching ? <Loader2 size={16} strokeWidth={2.2} className="animate-spin" /> : <Search size={16} strokeWidth={2.2} />}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute start-0 end-12 top-[calc(100%+6px)] z-10 max-h-[210px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]">
          {suggestions.map(s => (
            <button
              key={s.placeId}
              type="button"
              onPointerDown={e => e.preventDefault()}
              onClick={() => handleSelectSuggestion(s)}
              className="block w-full border-t border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start first:border-t-0"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.8125rem] font-semibold text-m-ink">{s.mainText}</div>
                  {s.secondaryText && (
                    <div className="truncate font-geist text-[0.65625rem] text-m-muted">{s.secondaryText}</div>
                  )}
                </div>
                <SourceMark label={sourceLabel(s, acSource)} />
              </div>
            </button>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
          {results.map((result, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPlace(result, { mode: 'search', rank: idx, count: results.length })}
              className="block w-full border-t border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start first:border-t-0"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.8125rem] font-semibold text-m-ink">{String(result.name ?? '')}</div>
                  <div className="truncate font-geist text-[0.65625rem] text-m-muted">{String(result.address ?? '')}</div>
                </div>
                <SourceMark label={sourceLabel(result, searchSource)} />
              </div>
            </button>
          ))}
        </div>
      )}
      {/* The same quiet line the desktop form has: the index answers first and
          Google only when it finds nothing, so this is how a list with the wrong
          place on it reaches Google, where Google holds the key slot. */}
      {results.length > 0 && offersGoogleRetry(searchSource, googleAnswers) && (
        <button
          type="button"
          onClick={() => handleSearch('google')}
          disabled={searching}
          className="mt-2 inline-flex items-center gap-1 font-geist text-[0.6875rem] text-m-muted disabled:opacity-60"
        >
          <RotateCcw size={11} strokeWidth={2} aria-hidden="true" />
          {t('places.searchGoogleInstead')}
        </button>
      )}
    </div>
  )
}
