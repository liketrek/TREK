import { useEffect, useId, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useLocationBias } from '../../hooks/useLocationBias'
import { usePlaceSuggestions } from '../../hooks/usePlaceSuggestions'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'
import { useSuggestionDropdown } from './useSuggestionDropdown'
import { PlaceSuggestion, SuggestionInputBox, SuggestionList, SuggestionRow } from './SuggestionDropdown'
import { SoftPill } from './planParts'

export interface LocationPoint {
  name: string
  lat: number
  lng: number
  address?: string | null
}

interface Props {
  value: LocationPoint | null
  onChange: (loc: LocationPoint | null) => void
  placeholder?: string
  ariaLabel?: string
  /** Announces the field as a combobox and says "nothing found" or an error in its list. */
  showSearchStatus?: boolean
  /** Floats over a map as a frosted pill, like the map controls. */
  floating?: boolean
  style?: React.CSSProperties
  /**
   * The trip's own places, offered while the field is empty or holds fewer than three
   * characters, the way the transit search offers them (#2468). Typing narrows them by
   * name; from the third character on the map search answers instead.
   */
  places?: LocationPoint[]
  /** Marks each search result with where it came from (OSM, Google, TREK, a plugin), as the place form does. */
  showSource?: boolean
}

export default function LocationSelect({ value, onChange, placeholder, ariaLabel, showSearchStatus = false, floating = false, style, places, showSource = false }: Props) {
  const { t, locale } = useTranslation()
  const placeLang = usePlaceLanguage()
  // Ohne Reisekontext ist der Hinweis leer, und die Suche laeuft wie bisher.
  const { point: locationBias } = useLocationBias()
  const [query, setQuery] = useState(value?.name || '')
  const { open, setOpen, highlight, setHighlight, wrapRef, handleKey } = useSuggestionDropdown()
  const [results, setResults] = useState<any[]>([])
  // What answered the last search, for the rows that do not name their own source.
  const [listSource, setListSource] = useState('')
  const { sourceLabel } = usePlaceSuggestions()
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  // The text the last answer was for, so a status never describes older text.
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null)
  const listId = `${useId()}-location-results`
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value?.name || '')
  }, [value])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 3 || (value && trimmed === value.name)) {
      setResults([])
      setLoading(false)
      setSearchError(false)
      setSearchedQuery(null)
      return
    }
    // Clearing the timer does nothing to a request already out: an answer for
    // text the user has since changed, or that lands after a pick, is dropped.
    let stale = false
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSearchError(false)
      setSearchedQuery(null)
      try {
        const data = await mapsApi.search(trimmed, placeLang, locationBias)
        if (stale) return
        setResults(data.places || [])
        setListSource(data.source || '')
        setHighlight(-1)
        setSearchedQuery(trimmed)
      } catch {
        if (!stale) {
          setResults([])
          setSearchError(true)
          setSearchedQuery(trimmed)
        }
      } finally {
        if (!stale) setLoading(false)
      }
    }, 320)
    return () => {
      stale = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, value, locale, placeLang, setHighlight])

  const pick = (r: any) => {
    const lat = Number(r.lat)
    const lng = Number(r.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const loc: LocationPoint = { name: r.name || r.address || 'Location', lat, lng, address: r.address || null }
    onChange(loc)
    setQuery(loc.name)
    setOpen(false)
    resetSearch()
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    resetSearch()
  }

  function resetSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setResults([])
    setLoading(false)
    setSearchError(false)
    setSearchedQuery(null)
  }

  // The trip's places stand in for the search below three characters. Derived rather
  // than written into `results`, so a search answer that lands after the field was
  // shortened cannot replace them, and a place already picked does not reopen them.
  const typed = query.trim()
  const { showPicks, rows } = pickRows(value, typed, places, results)
  const { showNoResults, showError, listOpen } = searchStatus({
    showSearchStatus, showPicks, searchedQuery, typed, rowCount: rows.length, loading, searchError, open,
  })
  const accessibleLabel = ariaLabel ?? placeholder ?? t('reservations.searchLocation')
  const statusLine = renderStatusLine(showError, showNoResults, typed, t)

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape closes the list even while it only shows a status line.
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
      return
    }
    handleKey(e, rows, pick)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <SuggestionInputBox
        icon={floating
          ? <Search size={16} strokeWidth={2} className="text-content-muted" style={{ flexShrink: 0 }} />
          : <MapPin size={14} className="text-content-faint" style={{ flexShrink: 0 }} />}
        floating={floating}
        query={query}
        placeholder={placeholder ?? t('reservations.searchLocation')}
        onType={(text) => { setQuery(text); setOpen(true); setHighlight(-1); setSearchError(false); setSearchedQuery(null); if (value) onChange(null) }}
        onOpen={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onClear={value ? clear : undefined}
        inputAria={showSearchStatus ? comboboxAria(accessibleLabel, listOpen, listId, highlight) : undefined}
      />

      {open && (
        <SuggestionList
          loading={loading && !showPicks}
          rowCount={rows.length}
          status={statusLine}
          listbox={showSearchStatus ? { id: listId, label: accessibleLabel } : undefined}
          floating={floating}
        >
          {rows.map((r, i) => (
            <SuggestionRow
              key={showPicks ? `pick:${r.name}:${r.lat}:${r.lng}` : `${r.osm_id || r.google_place_id || i}`}
              active={i === highlight}
              onPick={() => pick(r)}
              onHover={() => setHighlight(i)}
              align="flex-start"
              optionId={showSearchStatus ? `${listId}-option-${i}` : undefined}
            >
              <PlaceSuggestion name={r.name} address={r.address} />
              {showSource && !showPicks && <SourceMark label={sourceLabel(r, listSource)} />}
            </SuggestionRow>
          ))}
        </SuggestionList>
      )}
    </div>
  )
}

/** Where a result came from, quiet on purpose, beside its name. */
function SourceMark({ label }: { label: string | null }) {
  if (!label) return null
  return <span className="flex-none self-center"><SoftPill>{label}</SoftPill></span>
}

function pickRows<T>(value: LocationPoint | null, typed: string, places: LocationPoint[] | undefined, results: T[]) {
  const showPicks = !value && typed.length < 3 && !!places?.length
  const rows: (T | LocationPoint)[] = showPicks
    ? (places ?? []).filter(p => !typed || p.name.toLowerCase().includes(typed.toLowerCase()))
    : results
  return { showPicks, rows }
}

interface SearchStatusInput {
  showSearchStatus: boolean
  showPicks: boolean
  searchedQuery: string | null
  typed: string
  rowCount: number
  loading: boolean
  searchError: boolean
  open: boolean
}

function searchStatus({ showSearchStatus, showPicks, searchedQuery, typed, rowCount, loading, searchError, open }: SearchStatusInput) {
  const showNoResults =
    showSearchStatus && !showPicks && searchedQuery === typed && rowCount === 0 && !loading && !searchError
  const showError = showSearchStatus && searchError && searchedQuery === typed
  const listOpen = open && ((loading && !showPicks) || rowCount > 0 || showNoResults || showError)
  return { showNoResults, showError, listOpen }
}

function renderStatusLine(
  showError: boolean,
  showNoResults: boolean,
  typed: string,
  t: ReturnType<typeof useTranslation>['t'],
) {
  return showError ? (
    <div role="alert" className="text-content-faint" style={{ padding: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
      {t('common.error')}
    </div>
  ) : showNoResults ? (
    <div role="status" className="text-content-faint" style={{ padding: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
      {t('help.center.searchEmpty', { query: typed })}
    </div>
  ) : null
}

function comboboxAria(
  accessibleLabel: string,
  listOpen: boolean,
  listId: string,
  highlight: number,
): React.AriaAttributes & { role?: React.AriaRole } {
  return {
    role: 'combobox',
    'aria-label': accessibleLabel,
    'aria-autocomplete': 'list',
    'aria-expanded': listOpen,
    'aria-controls': listOpen ? listId : undefined,
    'aria-activedescendant': listOpen && highlight >= 0 ? `${listId}-option-${highlight}` : undefined,
  }
}
