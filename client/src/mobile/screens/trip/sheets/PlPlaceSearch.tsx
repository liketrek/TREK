import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { mapsApi } from '../../../../api/client'
import { isGoogleMapsUrl } from '../../../../components/Planner/PlaceFormModal.helpers'
import { getApiErrorMessage } from '../../../../utils/apiError'
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
  website?: string
  phone?: string
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

type MapsPlace = Record<string, unknown>

interface PlPlaceSearchProps {
  planner: TripPlanner
  /** Search bias derived from the trip's existing places (trip centre). */
  locationBias?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } }
  onPick: (pick: PlSearchPick) => void
  /** True while a suggestion's details are being resolved (name spinner). */
  onResolvingChange?: (resolving: boolean) => void
}

/** "48.8566, 2.3522" (also ; or whitespace separated) → direct coordinates. */
const COORD_RE = /^(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)$/

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
    website: s(place.website),
    phone: s(place.phone),
  }
}

/**
 * Search row of the place form: Google/OSM text search biased on the trip
 * centre, autocomplete dropdown, plus Google-Maps-URL and "lat, lng" paste
 * detection — the mobile counterpart of PlaceFormModal's search block.
 */
export default function PlPlaceSearch({ planner, locationBias, onPick, onResolvingChange }: PlPlaceSearchProps) {
  const { t, language, toast } = planner
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapsPlace[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const setResolving = useCallback(
    (v: boolean) => {
      setSearching(v)
      onResolvingChange?.(v)
    },
    [onResolvingChange],
  )

  const fetchSuggestions = useCallback(
    async (input: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const result = await mapsApi.autocomplete(input, language, locationBias, controller.signal)
        setSuggestions(result.suggestions || [])
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        setSuggestions([])
      }
    },
    [language, locationBias],
  )

  // Debounced autocomplete — URLs and coordinate pastes go to the search button.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2 || isGoogleMapsUrl(trimmed) || COORD_RE.test(trimmed)) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  const applyPlace = (place: MapsPlace) => {
    onPick(placeToPick(place))
    setResults([])
    setSuggestions([])
    setQuery('')
  }

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSuggestions([])

    // "lat, lng" paste → straight to coordinates, no lookup needed.
    const coords = trimmed.match(COORD_RE)
    if (coords) {
      onPick({ lat: coords[1], lng: coords[2] })
      setQuery('')
      return
    }

    setResolving(true)
    try {
      if (isGoogleMapsUrl(trimmed)) {
        const resolved = await mapsApi.resolveUrl(trimmed)
        if (resolved.lat && resolved.lng) {
          onPick({
            name: resolved.name || undefined,
            address: resolved.address || undefined,
            lat: String(resolved.lat),
            lng: String(resolved.lng),
            google_ftid: resolved.google_ftid || undefined,
          })
          setQuery('')
          toast.success(t('places.urlResolved'))
          return
        }
      }
      const result = await mapsApi.search(trimmed, language)
      setResults(result.places || [])
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')))
    } finally {
      setResolving(false)
    }
  }

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setSuggestions([])
    const previousQuery = query
    setQuery('')
    onPick({ name: suggestion.mainText })
    setResolving(true)
    try {
      // Details are a fragile second hop (kill-switch, Overpass load) — fall
      // back to the text-search path so suggestions never dead-end. (#1192)
      let place: MapsPlace | null = null
      try {
        const result = await mapsApi.details(suggestion.placeId, language)
        if (result.place && result.place.lat != null && result.place.lng != null) place = result.place
      } catch {
        // fall through to text search
      }
      if (!place) {
        const fullQuery = [suggestion.mainText, suggestion.secondaryText].filter(Boolean).join(', ')
        const search = await mapsApi.search(fullQuery, language)
        place = (search.places?.[0] as MapsPlace | undefined) ?? null
      }
      if (place) {
        applyPlace(place)
      } else {
        setQuery(previousQuery)
        toast.error(t('places.mapsSearchError'))
      }
    } catch (err: unknown) {
      setQuery(previousQuery)
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')))
    } finally {
      setResolving(false)
    }
  }

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
              handleSearch()
            }
          }}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder={t('places.mapsSearchPlaceholder')}
          className={`${FIELD_CLS} flex-1`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          aria-label={t('common.search')}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-60"
        >
          {searching ? <Loader2 size={16} strokeWidth={2.2} className="animate-spin" /> : <Search size={16} strokeWidth={2.2} />}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-12 top-[calc(100%+6px)] z-10 max-h-[210px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]">
          {suggestions.map(s => (
            <button
              key={s.placeId}
              type="button"
              onPointerDown={e => e.preventDefault()}
              onClick={() => handleSelectSuggestion(s)}
              className="block w-full border-t border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-left first:border-t-0"
            >
              <div className="truncate text-[0.8125rem] font-semibold text-m-ink">{s.mainText}</div>
              {s.secondaryText && (
                <div className="truncate font-geist text-[0.65625rem] text-m-muted">{s.secondaryText}</div>
              )}
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
              onClick={() => applyPlace(result)}
              className="block w-full border-t border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-left first:border-t-0"
            >
              <div className="truncate text-[0.8125rem] font-semibold text-m-ink">{String(result.name ?? '')}</div>
              <div className="truncate font-geist text-[0.65625rem] text-m-muted">{String(result.address ?? '')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
