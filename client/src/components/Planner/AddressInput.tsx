import { useEffect, useRef, useState } from 'react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useLocationBias } from '../../hooks/useLocationBias'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'
import { useSuggestionDropdown } from './useSuggestionDropdown'
import { PlaceSuggestion, SuggestionList, SuggestionRow } from './SuggestionDropdown'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Free-text address input with location autocomplete, backed by the same maps
// search as LocationSelect. Unlike LocationSelect the typed text is
// authoritative: every keystroke reaches the parent so a hand-written address
// is never lost, and picking a suggestion just replaces the text (#1496).
export default function AddressInput({ value, onChange, placeholder, className }: Props) {
  const { locale } = useTranslation()
  const placeLang = usePlaceLanguage()
  // Ohne Reisekontext ist der Hinweis leer, und die Suche laeuft wie bisher.
  const { point: locationBias } = useLocationBias()
  const { open, setOpen, highlight, setHighlight, wrapRef, handleKey } = useSuggestionDropdown()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Clearing the timer does nothing to a request that is already out, and
  // mapsApi.search takes no signal, so results are matched by ticket instead.
  const reqIdRef = useRef(0)

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Search on typing only (not on focus or external value changes), so opening
  // a modal with a saved address doesn't fire a request.
  const search = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = text.trim()
    // Same reason as in pick(): a request for the longer text may still land.
    if (trimmed.length < 3) { reqIdRef.current++; setResults([]); setLoading(false); return }
    debounceRef.current = setTimeout(async () => {
      const myReq = ++reqIdRef.current
      setLoading(true)
      try {
        const data = await mapsApi.search(trimmed, placeLang, locationBias)
        if (myReq !== reqIdRef.current) return
        setResults(data.places || [])
        setHighlight(-1)
      } catch {
        if (myReq === reqIdRef.current) setResults([])
      } finally {
        if (myReq === reqIdRef.current) setLoading(false)
      }
    }, 320)
  }

  const pick = (r: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // A response still on its way must not repopulate the list behind the pick.
    reqIdRef.current++
    onChange(r.address || r.name || '')
    setOpen(false)
    setResults([])
    setLoading(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); search(e.target.value) }}
        // Opens its list on focus, so a dialog must not focus it by itself (#1302).
        data-no-autofocus
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => handleKey(e, results, pick)}
        className={className}
      />
      {open && (
        <SuggestionList loading={loading} rowCount={results.length}>
          {results.map((r, i) => (
            <SuggestionRow
              key={`${r.osm_id || r.google_place_id || i}`}
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
