import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useLocationBias } from '../../hooks/useLocationBias'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'
import { useSuggestionDropdown } from './useSuggestionDropdown'
import { PlaceSuggestion, SuggestionInputBox, SuggestionList, SuggestionRow } from './SuggestionDropdown'

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
  style?: React.CSSProperties
  /**
   * The trip's own places, offered while the field is empty or holds fewer than three
   * characters, the way the transit search offers them (#2468). Typing narrows them by
   * name; from the third character on the map search answers instead.
   */
  places?: LocationPoint[]
}

export default function LocationSelect({ value, onChange, placeholder, style, places }: Props) {
  const { t, locale } = useTranslation()
  const placeLang = usePlaceLanguage()
  // Ohne Reisekontext ist der Hinweis leer, und die Suche laeuft wie bisher.
  const { point: locationBias } = useLocationBias()
  const [query, setQuery] = useState(value?.name || '')
  const { open, setOpen, highlight, setHighlight, wrapRef, handleKey } = useSuggestionDropdown()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value?.name || '')
  }, [value])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 3 || (value && trimmed === value.name)) {
      setResults([])
      return
    }
    // Clearing the timer does nothing to a request already out: an answer for
    // text the user has since changed, or that lands after a pick, is dropped.
    let stale = false
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await mapsApi.search(trimmed, placeLang, locationBias)
        if (stale) return
        setResults(data.places || [])
        setHighlight(-1)
      } catch {
        if (!stale) setResults([])
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
    setResults([])
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setResults([])
  }

  // The trip's places stand in for the search below three characters. Derived rather
  // than written into `results`, so a search answer that lands after the field was
  // shortened cannot replace them, and a place already picked does not reopen them.
  const typed = query.trim()
  const showPicks = !value && typed.length < 3 && !!places?.length
  const rows = showPicks
    ? (places ?? []).filter(p => !typed || p.name.toLowerCase().includes(typed.toLowerCase()))
    : results

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <SuggestionInputBox
        icon={<MapPin size={14} className="text-content-faint" style={{ flexShrink: 0 }} />}
        query={query}
        placeholder={placeholder ?? t('reservations.searchLocation')}
        onType={(text) => { setQuery(text); setOpen(true); setHighlight(-1); if (value) onChange(null) }}
        onOpen={() => setOpen(true)}
        onKeyDown={(e) => handleKey(e, rows, pick)}
        onClear={value ? clear : undefined}
      />

      {open && (
        <SuggestionList loading={loading && !showPicks} rowCount={rows.length}>
          {rows.map((r, i) => (
            <SuggestionRow
              key={showPicks ? `pick:${r.name}:${r.lat}:${r.lng}` : `${r.osm_id || r.google_place_id || i}`}
              active={i === highlight}
              onPick={() => pick(r)}
              onHover={() => setHighlight(i)}
              align="flex-start"
            >
              <PlaceSuggestion name={r.name} address={r.address} />
            </SuggestionRow>
          ))}
        </SuggestionList>
      )}
    </div>
  )
}
