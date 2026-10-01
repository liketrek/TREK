import { Clock, ExternalLink, FileText, Globe, MapPin, Phone } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { fs } from '../../components/shared/DialogShell'
import { Tooltip } from '../../components/shared/Tooltip'
import { WhiteBadge } from '../../components/Planner/planParts'
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
/** A way off the page: a white pill like the planner's facts, quiet until hovered. */
export const LINK_PILL = 'inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-card px-2 py-[2px] font-geist font-medium text-content-secondary shadow-sm transition-colors hover:text-content'

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
    <div className="shared-place-details mt-1 flex min-w-0 flex-col gap-1">
      {place.address && (
        <div className="flex items-start gap-1 text-content-faint" style={fs(11)}>
          <MapPin size={11} strokeWidth={2} className="mt-px flex-none" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{place.address}</span>
        </div>
      )}
      {place.description && (
        <div className="whitespace-pre-wrap text-content-secondary [overflow-wrap:anywhere]" style={fs(12, 'body')}>{place.description}</div>
      )}
      {dayNote && <NoteLine label={t('places.assignmentNotes')} text={dayNote} strong />}
      {placeNote && <NoteLine label={t('places.formNotes')} text={placeNote} />}
      {(duration || hasLinks) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {duration && <WhiteBadge icon={<Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>{duration}</WhiteBadge>}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={LINK_PILL} style={fs(10.5)}>
              <ExternalLink size={10} strokeWidth={2.2} className="flex-none" />
              {t('planner.openGoogleMaps')}
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className={LINK_PILL} style={fs(10.5)}>
              <Globe size={10} strokeWidth={2.2} className="flex-none" />
              {t('places.formWebsite')}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className={LINK_PILL} style={fs(10.5)}>
              <Phone size={10} strokeWidth={2.2} className="flex-none" />
              {phone}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/** A note on the stop, the day's own a shade stronger than the place's, named in its tooltip. */
function NoteLine({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <Tooltip label={label} placement="top">
      <div className={`flex items-start gap-1.5 rounded-lg bg-surface-secondary px-2 py-1.5 ${strong ? 'text-content-secondary' : 'text-content-muted'}`} style={fs(11.5, 'body')}>
        <FileText size={11} strokeWidth={2} className="mt-0.5 flex-none text-content-faint" aria-label={label} />
        <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</span>
      </div>
    </Tooltip>
  )
}
