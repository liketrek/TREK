import React, { useEffect, useRef } from 'react'
import { Search, X, ChevronRight, MapPin, Loader2 } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { AtlasPlaceHit } from './atlasModel'

type CountryOption = { code: string; label: string }

interface AtlasCountrySearchProps {
  dark: boolean
  t: TranslationFn
  search: string
  setSearch: (v: string) => void
  results: CountryOption[]
  setResults: (v: CountryOption[]) => void
  open: boolean
  setOpen: (v: boolean) => void
  options: CountryOption[]
  onSelect: (code: string) => void
  /** Geocoded places for the same query (#1115) — a second, clearly separated
   *  section below the countries, so the instant local matches stay on top. */
  placeResults: AtlasPlaceHit[]
  placesLoading: boolean
  onQueryChange: (raw: string) => void
  onSelectPlace: (hit: AtlasPlaceHit) => void
}

// The floating country search box that overlays the globe (search input + results
// dropdown). Extracted from AtlasPage as a presentational sibling — behaviour and
// markup are byte-identical to the inline version it replaced.
export default function AtlasCountrySearch({
  dark, t, search, setSearch, results, setResults, open, setOpen, options, onSelect,
  placeResults, placesLoading, onQueryChange, onSelectPlace,
}: AtlasCountrySearchProps): React.ReactElement {
  const boxRef = useRef<HTMLDivElement>(null)

  // Close on a click outside rather than on mouseleave. Leaving the box used to
  // close it, which was survivable while the list was only local countries and
  // appeared complete in one go. Geocoded places arrive a moment later and make
  // the list grow under a cursor that is already resting there, so the panel
  // closed by itself seconds after opening.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, setOpen])

  return (
    <div
      className="absolute z-20 flex justify-center"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', left: 0, right: 0, pointerEvents: 'none' }}
    >
      <div ref={boxRef} style={{ width: 'min(520px, calc(100vw - 28px))', pointerEvents: 'auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 16,
          border: '1px solid ' + (dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
          background: dark ? 'rgba(10,10,15,0.55)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          boxShadow: dark ? '0 8px 26px rgba(0,0,0,0.25)' : '0 8px 26px rgba(0,0,0,0.10)',
        }}>
          <Search size={16} className="text-content-faint" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => {
              const raw = e.target.value
              setSearch(raw)
              onQueryChange(raw)
              const q = raw.trim().toLowerCase()
              if (!q) {
                setResults([])
                setOpen(false)
                return
              }
              const next = options
                .filter(o => o.label.toLowerCase().includes(q) || o.code.toLowerCase() === q)
                .slice(0, 8)
              setResults(next)
              setOpen(true)
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                return
              }
              if (e.key === 'Enter') {
                const first = results[0]
                if (first) { onSelect(first.code); return }
                const place = placeResults[0]
                if (place) onSelectPlace(place)
              }
            }}
            placeholder={t('atlas.searchCountry')}
            autoComplete="off"
            spellCheck={false}
            className="text-content"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'calc(13px * var(--fs-scale-body, 1))',
              fontFamily: 'inherit',
            }}
          />
          {search.trim() && (
            <button type="button"
              onClick={() => {
                setSearch('')
                setResults([])
                setOpen(false)
              }}
              className="text-content-faint"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {open && (results.length > 0 || placeResults.length > 0 || placesLoading) && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid ' + (dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
              background: dark ? 'rgba(10,10,15,0.75)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(18px) saturate(180%)',
              WebkitBackdropFilter: 'blur(18px) saturate(180%)',
              boxShadow: dark ? '0 12px 30px rgba(0,0,0,0.35)' : '0 12px 30px rgba(0,0,0,0.12)',
            }}
          >
            {results.map((r) => (
              <button type="button"
                key={r.code}
                onClick={() => onSelect(r.code)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  borderBottom: '1px solid ' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <img src={`https://flagcdn.com/w40/${r.code.toLowerCase()}.png`} alt={r.code} style={{ width: 28, height: 20, borderRadius: 4, objectFit: 'cover' }} />
                  <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.label}
                  </span>
                </span>
                <ChevronRight size={16} className="text-content-faint" style={{ flexShrink: 0 }} />
              </button>
            ))}

            {(placeResults.length > 0 || placesLoading) && (
              <div
                className="text-content-faint"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderTop: results.length > 0 ? '1px solid ' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : 'none',
                }}
              >
                {placesLoading && <Loader2 size={11} className="animate-spin" />}
                {t('atlas.searchPlaces')}
              </div>
            )}
            {placeResults.map((p) => (
              <button type="button"
                key={`${p.lat},${p.lng},${p.name}`}
                onClick={() => onSelectPlace(p)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  borderBottom: '1px solid ' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 28, height: 20, borderRadius: 4, flexShrink: 0,
                      display: 'grid', placeItems: 'center',
                      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <MapPin size={13} className="text-content-faint" />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {p.address && (
                      <span className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.address}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight size={16} className="text-content-faint" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
