import { Clock, ExternalLink, FileText, Globe, MapPin, Phone } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { getGoogleMapsUrlForPlace } from '../../components/Planner/placeGoogleMaps'
import { formatDurationMinutes, isHttpUrl } from './sharedTripModel'

/**
 * The read-only detail of one stop on a shared plan (#2320).
 *
 * The page used to show a place as a name and, under it, the address *or* the
 * description, one string on one line. The owner had written both, and had
 * usually also left a note on the place and another on the day it was
 * planned for, and a link would show none of that. This shows what the owner
 * chose to share, laid out the way the planner lays it out: address, then
 * description, then the two notes, then how long they meant to stay, then
 * the ways to reach the place.
 *
 * Nothing here is editable and nothing here is a route into the app: every
 * link leaves the page, in a new tab, with no opener. The server has already
 * decided what a public viewer may see; this only renders what arrived.
 */
export interface SharedPlaceLike {
  name: string
  address?: string | null
  description?: string | null
  notes?: string | null
  lat?: number | null
  lng?: number | null
  duration_minutes?: number | null
  website?: string | null
  phone?: string | null
  place_time?: string | null
  end_time?: string | null
}

export function SharedPlaceDetails({ place, assignmentNotes }: { place: SharedPlaceLike; assignmentNotes?: string | null }) {
  const { t } = useTranslation()
  const website = isHttpUrl(place.website) ? place.website : null
  const phone = place.phone?.trim() || null
  const mapsUrl = getGoogleMapsUrlForPlace({
    name: place.name, address: place.address ?? null, lat: place.lat ?? null, lng: place.lng ?? null,
    google_place_id: null, google_ftid: null,
  })
  const duration = formatDurationMinutes(place.duration_minutes)
  const dayNote = assignmentNotes?.trim() || null
  const placeNote = place.notes?.trim() || null
  const hasLinks = !!(website || phone || mapsUrl)

  return (
    <div className="shared-place-details" style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      {place.address && (
        <div className="text-[#6b7280]" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', display: 'flex', alignItems: 'flex-start', gap: 4 }}> {/* theme-lint-disable — public page, no user theme */}
          <MapPin size={10} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{place.address}</span>
        </div>
      )}
      {place.description && (
        <div className="text-[#4b5563]" style={{ fontSize: 'calc(11px * var(--fs-scale-body, 1))', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}> {/* theme-lint-disable — public page, no user theme */}
          {place.description}
        </div>
      )}
      {dayNote && (
        <div className="text-[#374151]" style={{ fontSize: 'calc(11px * var(--fs-scale-body, 1))', display: 'flex', alignItems: 'flex-start', gap: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} title={t('places.assignmentNotes')}> {/* theme-lint-disable — public page, no user theme */}
          <FileText size={10} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{dayNote}</span>
        </div>
      )}
      {placeNote && (
        <div className="text-[#6b7280]" style={{ fontSize: 'calc(11px * var(--fs-scale-body, 1))', display: 'flex', alignItems: 'flex-start', gap: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} title={t('places.formNotes')}> {/* theme-lint-disable — public page, no user theme */}
          <FileText size={10} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{placeNote}</span>
        </div>
      )}
      {(duration || hasLinks) && (
        <div className="text-[#6b7280]" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 10px', marginTop: 1 }}> {/* theme-lint-disable — public page, no user theme */}
          {duration && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />
              {duration}
            </span>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563eb]" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}> {/* theme-lint-disable — public page, no user theme */}
              <ExternalLink size={10} />
              {t('planner.openGoogleMaps')}
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#2563eb]" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}> {/* theme-lint-disable — public page, no user theme */}
              <Globe size={10} />
              {t('places.formWebsite')}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="text-[#2563eb]" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}> {/* theme-lint-disable — public page, no user theme */}
              <Phone size={10} />
              {phone}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
