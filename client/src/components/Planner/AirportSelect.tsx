import { useEffect, useMemo, useRef, useState } from 'react'
import { Plane } from 'lucide-react'
import { airportsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useSuggestionDropdown } from './useSuggestionDropdown'
import { SuggestionInputBox, SuggestionList, SuggestionRow } from './SuggestionDropdown'

export interface Airport {
  iata: string
  icao: string | null
  name: string
  city: string
  country: string
  lat: number
  lng: number
  tz: string
}

interface Props {
  value: Airport | null
  onChange: (airport: Airport | null) => void
  placeholder?: string
  style?: React.CSSProperties
}

function formatLabel(a: Airport) {
  return `${a.city || a.name} (${a.iata})`
}

export default function AirportSelect({ value, onChange, placeholder, style }: Props) {
  const { t, locale } = useTranslation()
  const countryName = useMemo(() => {
    try { return new Intl.DisplayNames([locale || 'en'], { type: 'region' }) } catch { return null }
  }, [locale])
  const displayCountry = (code: string) => {
    if (!code) return ''
    try { return countryName?.of(code) || code } catch { return code }
  }
  const [query, setQuery] = useState(value ? formatLabel(value) : '')
  const { open, setOpen, highlight, setHighlight, wrapRef, handleKey } = useSuggestionDropdown()
  const [results, setResults] = useState<Airport[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value ? formatLabel(value) : '')
  }, [value])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2 || (value && trimmed === formatLabel(value))) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const data = await airportsApi.search(trimmed, controller.signal)
        setResults(Array.isArray(data) ? data : [])
        setHighlight(-1)
      } catch (err) {
        const name = (err as { name?: string } | null)?.name
        if (name !== 'AbortError' && name !== 'CanceledError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, value, setHighlight])

  const pick = (a: Airport) => {
    onChange(a)
    setQuery(formatLabel(a))
    setOpen(false)
    setResults([])
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <SuggestionInputBox
        icon={<Plane size={14} className="text-content-faint" style={{ flexShrink: 0 }} />}
        query={query}
        placeholder={placeholder ?? t('airport.searchPlaceholder')}
        onType={(text) => { setQuery(text); setOpen(true); if (value) onChange(null) }}
        onOpen={() => setOpen(true)}
        onKeyDown={(e) => handleKey(e, results, pick)}
        onClear={value ? clear : undefined}
      />

      {open && (
        <SuggestionList loading={loading} rowCount={results.length}>
          {results.map((a, i) => (
            <SuggestionRow key={a.iata} active={i === highlight} onPick={() => pick(a)} onHover={() => setHighlight(i)} align="center">
              <span className="text-content-muted" style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, minWidth: 32 }}>{a.iata}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.city || a.name}</div>
                <div className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}{a.country ? ` · ${displayCountry(a.country)}` : ''}</div>
              </span>
            </SuggestionRow>
          ))}
        </SuggestionList>
      )}
    </div>
  )
}
