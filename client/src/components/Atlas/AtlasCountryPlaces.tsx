import { useState } from 'react'
import { Briefcase, ChevronRight, MapPin, Search, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { groupCountryPlaces, type CountryDetail } from '../../pages/atlas/atlasModel'

interface AtlasCountryPlacesProps {
  detail: Pick<CountryDetail, 'places' | 'trips'>
  onOpenTrip: (tripId: number) => void
  /** Phone sheets use their own tokens; the desktop dialog reads the planner's. */
  variant?: 'desktop' | 'mobile'
}

/**
 * Every place counted for a country, by trip (#2174), so an old trip imported into
 * the wrong country, or a place that is missing, can be found and opened. A search
 * narrows long lists; a click opens the trip the place belongs to.
 */
export default function AtlasCountryPlaces({ detail, onOpenTrip, variant = 'desktop' }: AtlasCountryPlacesProps) {
  const { t, locale } = useTranslation()
  const [query, setQuery] = useState('')
  const groups = groupCountryPlaces(detail, query, locale)
  const mobile = variant === 'mobile'
  const ink = mobile ? 'text-m-ink' : 'text-content'
  const muted = mobile ? 'text-m-muted' : 'text-content-muted'
  const faint = mobile ? 'text-m-faint' : 'text-content-faint'
  const rowHover = mobile ? 'active:bg-[color:var(--m-ic)]' : 'hover:bg-surface-hover'
  const placeholder = mobile ? 'placeholder:text-m-faint' : 'placeholder:text-content-faint'

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {detail.places.length > 6 && (
        <div className={`flex h-9 flex-none items-center gap-2 rounded-[10px] px-3 ${mobile ? 'bg-[color:var(--m-ic)]' : 'border border-edge bg-surface-input'} ${faint}`}>
          <Search size={14} strokeWidth={2} className="flex-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('atlas.placesSearch')}
            aria-label={t('atlas.placesSearch')}
            className={`min-w-0 flex-1 border-0 bg-transparent text-[0.8125rem] outline-none ${ink} ${placeholder}`}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')} className={`flex-none ${faint}`}>
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {groups.length === 0 ? (
        <p className={`m-0 py-4 text-center text-[0.8125rem] ${faint}`}>{t('atlas.placesNone')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(({ trip, places }) => (
            <section key={trip.id} className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => onOpenTrip(trip.id)}
                className={`group flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-left ${rowHover}`}
              >
                <Briefcase size={13} strokeWidth={2} className={`flex-none ${muted}`} />
                <span className={`min-w-0 flex-1 truncate text-[0.8125rem] font-bold ${ink}`}>{trip.title}</span>
                <span className={`flex-none rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums ${mobile ? 'bg-[color:var(--m-ic)]' : 'bg-surface-tertiary'} ${muted}`}>{places.length}</span>
                <ChevronRight size={14} strokeWidth={2} className={`flex-none ${faint}`} />
              </button>
              {places.map(place => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => onOpenTrip(trip.id)}
                  className={`flex items-start gap-2 rounded-[10px] py-1.5 pl-7 pr-2 text-left ${rowHover}`}
                >
                  <MapPin size={12} strokeWidth={2} className={`mt-[3px] flex-none ${faint}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[0.8125rem] font-medium ${ink}`}>{place.name}</span>
                    {place.address && <span className={`block truncate text-[0.6875rem] ${faint}`}>{place.address}</span>}
                  </span>
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
