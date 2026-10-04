import ChargingInfo from '../Roadtrip/ChargingInfo'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { safeHttpUrl } from '../../utils/safeUrl'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { markdownLinkComponents } from '../shared/markdownLink'
import { X, Clock, MapPin, ExternalLink, Phone, Mail, Banknote, Pencil, Plus, Minus, ChevronDown, ChevronUp, ChevronRight, FileText, Upload, File, FileImage, Star, Navigation, Mountain, Bookmark, BookmarkCheck, Copy } from 'lucide-react'
import { hoursLines, periodsFromWeek } from './placeHours'
import PlaceAvatar from '../shared/PlaceAvatar'
import PlaceAvatarUpload, { pickableImages } from '../shared/PlaceAvatarUpload'
import { BlurredCode } from '../shared/BookingCode'
import PlaceRating from '../shared/StarRating'
import TrackColorPicker from '../shared/TrackColorPicker'
import { resolveTrackColor, inheritedTrackColor } from '../Map/trackColors'
import { filesForPlace } from '../../utils/placeFiles'
import GuestBadge from '../shared/GuestBadge'
import StatusBadge from '../Collections/StatusBadge'
import { mapsApi, pluginsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import DawarichIcon from '../shared/DawarichIcon'
import { Tooltip } from '../shared/Tooltip'
import { useToast } from '../shared/Toast'
import { useTranslation, translateApiError } from '../../i18n'
import { usePluginStore } from '../../store/pluginStore'
import PluginFrame from '../Plugins/PluginFrame'
import type { Place, Category, Day, Reservation, TripFile, AssignmentsMap, DistanceUnit } from '../../types'
import type { CollectionStatus } from '@trek/shared'
import { splitReservationDateTime, formatTime, formatMoney } from '../../utils/formatters'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { formatDistance, formatElevation } from '../../utils/units'
import { navigationTargetLabel, getNavigationTargets, openNavigationTarget } from './placeNavigation'
import { TRANSPORT_TYPES, getPlaceBookings } from '../../utils/dayMerge'
import { NavigationMenu } from '../shared/NavigationMenu'
import { resolveOpenNow, resolvePlaceTimeZone, placeWeekdayIndex, type OpeningPeriod } from './placeOpenState'
import { convertHoursLine } from './placeHoursFormat'
import type { EndDayControlProps } from '../Roadtrip/EndDayControl'
import VisitControls, { type RoadtripStayControl } from '../Roadtrip/VisitControls'
import { DialogButton, DialogSection, DeleteButton, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { BOX, Field, TypeTile, toneOf, toneTint, useOpenFile } from './bookings/bookingParts'
import { parseMeta } from './bookings/bookingsModel'
import { SoftPill, TimePill, tintOf } from './planParts'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'

const detailsCache = new Map()

function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch { return undefined }
}

function setSessionCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/** What the maps details endpoint adds to a place: ratings, hours, contact. */
interface GoogleDetails {
  rating?: number | null
  rating_count?: number | null
  reviews?: Array<{ text?: string | null }> | null
  phone?: string | null
  summary?: string | null
  website?: string | null
  opening_hours?: string[] | null
  opening_periods?: OpeningPeriod[] | null
  opening_special_days?: string[] | null
  open_now?: boolean | null
  lat?: number | null
  lng?: number | null
  google_ftid?: string | null
  google_maps_url?: string | null
}

const creditCache = new Map()

/**
 * Names whoever made the picture shown in the avatar.
 *
 * Only cached provider photos carry a credit, and their proxy URL embeds the
 * cache key. Anything else (an uploaded image, a legacy remote URL) renders
 * nothing. Commons pictures are largely CC BY-SA, so this is an obligation
 * rather than a nicety — the picker credits them while choosing, this keeps the
 * credit visible afterwards, whatever else the avatar shows.
 */
function PhotoCredit({ imageUrl }: { imageUrl?: string | null }) {
  const [credit, setCredit] = useState(null)
  const key = useMemo(() => {
    const match = /^\/api\/maps\/place-photo\/(.+)\/bytes$/.exec(imageUrl || '')
    return match ? decodeURIComponent(match[1]) : null
  }, [imageUrl])

  useEffect(() => {
    if (!key) { setCredit(null); return }
    if (creditCache.has(key)) { setCredit(creditCache.get(key)); return }
    let alive = true
    mapsApi.placePhotoCredit(key).then(data => {
      creditCache.set(key, data.credit)
      if (alive) setCredit(data.credit)
    }).catch(() => {})
    return () => { alive = false }
  }, [key])

  if (!credit) return null
  return (
    <Tooltip label={credit}>
      <span className="mt-1 block max-w-[72px] truncate text-center leading-tight text-content-faint" style={fs(9)}>{credit}</span>
    </Tooltip>
  )
}

function usePlaceDetails(googlePlaceId, osmId, language) {
  const [details, setDetails] = useState<GoogleDetails | null>(null)
  const detailId = googlePlaceId || osmId
  const cacheKey = `gdetails_${detailId}_${language}`
  useEffect(() => {
    if (!detailId) { setDetails(null); return }
    if (detailsCache.has(cacheKey)) { setDetails(detailsCache.get(cacheKey)); return }
    const cached = getSessionCache(cacheKey)
    if (cached) { detailsCache.set(cacheKey, cached); setDetails(cached); return }
    mapsApi.details(detailId, language).then(data => {
      detailsCache.set(cacheKey, data.place)
      setSessionCache(cacheKey, data.place)
      setDetails(data.place)
    }).catch(() => {})
  }, [detailId, language])
  return details
}

function getWeekdayIndex(dateStr, timeZone) {
  // weekdayDescriptions[0] = Monday … [6] = Sunday
  if (!dateStr) return placeWeekdayIndex(new Date(), timeZone)
  const jsDay = new Date(dateStr + 'T12:00:00').getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface TripMember {
  id: number
  username: string
  avatar?: string | null
  avatar_url?: string | null
  is_guest?: boolean
}

interface PlaceInspectorProps {
  roadtripActive?: boolean
  roadtripEndDay?: EndDayControlProps
  roadtripStay?: RoadtripStayControl
  place: Place | null
  categories: Category[]
  /** 'trip' (default) keeps every existing trip-planner behaviour byte-identical;
   *  'collection' hides the day/reservation/file sub-panels and swaps the footer
   *  for the saved-place actions (copy to trip, status, remove from list). */
  mode?: 'trip' | 'collection'
  // ── Trip-only props (optional so the collection detail panel can omit them) ──
  days?: Day[]
  selectedDayId?: number | null
  selectedAssignmentId?: number | null
  assignments?: AssignmentsMap
  reservations?: Reservation[]
  /** Editors for the linked booking, each omitted when the user lacks that right —
   *  a transport needs day_edit, anything else reservation_edit. Both absent leaves
   *  the strip the read-only summary it has always been (#2012). */
  onEditTransport?: (reservation: Reservation) => void
  onEditReservation?: (reservation: Reservation) => void
  /** Shows a linked booking's detail. Given, every booking card opens that detail
   *  (its Edit leads on to the editor); without it a card opens its editor. */
  onOpenBooking?: (reservation: Reservation) => void
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAssignToDay?: (placeId: number, dayId?: number) => void
  onRemoveAssignment?: (dayId: number, assignmentId: number) => void
  files?: TripFile[]
  onFileUpload?: (fd: FormData) => Promise<unknown>
  tripMembers?: TripMember[]
  onSetParticipants?: (assignmentId: number, dayId: number, participantIds: number[]) => void
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => void
  /** Upload a custom thumbnail (#1136); enables the click-to-change avatar in trip mode. */
  onUploadImage?: (placeId: number, file: File) => Promise<void>
  /** Takes a picture already attached to the place as its image (#1242). */
  onImageFromFile?: (placeId: number, fileId: number) => Promise<void>
  /** Cast/clear the current user's star vote (#1435); enables the rating row. */
  onRate?: (placeId: number, rating: number | null) => Promise<void> | void
  leftWidth?: number
  rightWidth?: number
  // ── Collection-mode props ──
  collectionStatus?: CollectionStatus
  onCopyToTrip?: () => void
  onSetStatus?: (status: CollectionStatus) => void
  onRemoveFromList?: () => void
}

/** The small pill of the head band, the size of a SoftPill but raised on the tint. */
const HEAD_PILL = 'inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-card px-2 py-[2px] font-semibold text-content shadow-sm'

/**
 * The card a selected place opens over the map, in the planner's dialog
 * language: a head band tinted by its category with the avatar, the name, the
 * address and the facts as pills, then everything else about the place under
 * its own label, and the actions in a bar that stays in reach.
 */
export default function PlaceInspector({
  place, categories, mode = 'trip', days = [], selectedDayId = null, selectedAssignmentId = null,
  assignments = {}, reservations = [], onEditTransport, onEditReservation, onOpenBooking,
  onClose, onEdit: editPlace, onDelete: deletePlace, onAssignToDay, onRemoveAssignment,
  files = [], onFileUpload, tripMembers = [], onSetParticipants, onUpdatePlace: updatePlace, onUploadImage, onImageFromFile, onRate,
  leftWidth = 0, rightWidth = 0,
  collectionStatus, onCopyToTrip, onSetStatus, onRemoveFromList, roadtripEndDay, roadtripStay, roadtripActive,
}: PlaceInspectorProps) {
  // Editing the place is a place right. The planner hands the handlers over
  // regardless, and a member without the right saw Edit, Delete and the inline
  // rename and got the server's 403 for each (#2446). Collection mode gates
  // its own actions.
  const can = useCanDo()
  const trip = useTripStore(s => s.trip)
  const mayEditPlace = mode !== 'trip' || can('place_edit', trip)
  const onEdit = mayEditPlace ? editPlace : undefined
  const onDelete = mayEditPlace ? deletePlace : undefined
  const onUpdatePlace = mayEditPlace ? updatePlace : undefined
  // Plugins that declared a place-detail slot mount at the bottom of this panel,
  // scoped to the open place (trip mode only). Inline-filter like the other sites.
  const placeDetailPlugins = usePluginStore((s) => s.plugins).filter((p) => p.type === 'widget' && p.slot === 'place-detail')
  // Extra native rows contributed by placeDetailProvider plugins (#1429). Fail-safe:
  // any provider error/timeout is dropped server-side, so this only ever adds rows.
  const [providerDetails, setProviderDetails] = useState<Array<{ pluginId: string; items: Array<{ label: string; value?: string; url?: string }> }>>([])
  const [navOpen, setNavOpen] = useState(false)
  const navAnchorRef = useRef<HTMLSpanElement>(null)
  const placeIdForDetails = mode === 'trip' ? place?.id : undefined
  useEffect(() => {
    if (placeIdForDetails == null) { setProviderDetails([]); return }
    let cancelled = false
    pluginsApi.placeDetails(placeIdForDetails)
      .then((d) => { if (!cancelled) setProviderDetails((d.providers || []).filter((p) => Array.isArray(p.items) && p.items.length > 0)) })
      .catch(() => { if (!cancelled) setProviderDetails([]) })
    return () => { cancelled = true }
  }, [placeIdForDetails])
  const { t, locale, language } = useTranslation()
  const placeLang = usePlaceLanguage()
  // Currency-less prices mean "the trip's currency"; null in collection mode (EUR fallback below).
  const tripCurrency = useTripStore(s => s.trip?.currency)
  // The day list handed in is the one the planner shows, and in the day view that
  // list leaves out the stop a booking wrote. The store still holds it, so the
  // booked-night check below reads the day from there as well: on the list alone
  // the hotel of a booked night looked unassigned and could be put on the day a
  // second time, which is the duplicate that check exists to prevent.
  const storedDayAssignments = useTripStore(s => (selectedDayId ? s.assignments[String(selectedDayId)] : undefined))
  const toast = useToast()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit) || 'metric'
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
  const openSavePicker = useSaveToCollectionStore(s => s.open)
  const saveVersion = useSaveToCollectionStore(s => s.version)
  const [savedInCollection, setSavedInCollection] = useState(false)
  const [hoursExpanded, setHoursExpanded] = useState(false)
  const [filesExpanded, setFilesExpanded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const googleDetails = usePlaceDetails(place?.google_place_id, place?.osm_id, placeLang)

  // Library-wide "is this place already saved anywhere I can see?" indicator for
  // the trip-planner footer bookmark. Re-checks when the place changes or after
  // the save picker reports a change (saveVersion bump).
  const showSaveToCollection = mode === 'trip' && collectionsEnabled
  useEffect(() => {
    if (!showSaveToCollection || !place) { setSavedInCollection(false); return }
    let cancelled = false
    collectionsApi.membership({
      google_place_id: place.google_place_id ?? undefined,
      google_ftid: place.google_ftid ?? undefined,
      name: place.name,
      lat: place.lat ?? undefined,
      lng: place.lng ?? undefined,
    }).then(m => { if (!cancelled) setSavedInCollection(m.saved) }).catch(() => { if (!cancelled) setSavedInCollection(false) })
    return () => { cancelled = true }
    // Re-check on place identity + after the picker reports a change; the other
    // place fields are read at fire-time only, like the existing detail caches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSaveToCollection, place?.id, saveVersion])

  const handleSaveToCollection = useCallback(() => {
    if (!place) return
    openSavePicker({
      name: place.name,
      source_trip_id: place.trip_id ?? null,
      source_place_id: place.id,
      description: place.description ?? null,
      lat: place.lat ?? null,
      lng: place.lng ?? null,
      address: place.address ?? null,
      category_id: place.category_id ?? null,
      price: place.price ?? null,
      currency: place.currency ?? null,
      notes: place.notes ?? null,
      image_url: place.image_url ?? null,
      google_place_id: place.google_place_id ?? null,
      google_ftid: place.google_ftid ?? null,
      osm_id: place.osm_id ?? null,
      website: place.website ?? null,
      phone: place.phone ?? null,
    })
  }, [place, openSavePicker])

  // Sits above the `if (!place)` bail-out below: a hook after an early return is
  // only reached while a place is selected, so deselecting one mid-session
  // changes the hook count and React tears the tree down.
  const placeId = place?.id
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length || !onFileUpload || !placeId) return
    setIsUploading(true)
    try {
      for (const file of selectedFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('place_id', String(placeId))
        await onFileUpload(fd)
      }
      setFilesExpanded(true)
    } catch (err: unknown) {
      console.error('Upload failed', err)
      toast.error(translateApiError(t, err, 'files.uploadError'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [onFileUpload, placeId, toast, t])

  const startNameEdit = () => {
    if (!onUpdatePlace) return
    setNameValue(place.name || '')
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const commitNameEdit = () => {
    if (!editingName) return
    const trimmed = nameValue.trim()
    setEditingName(false)
    if (!trimmed || trimmed === place.name) return
    onUpdatePlace(place.id, { name: trimmed })
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitNameEdit() }
    if (e.key === 'Escape') setEditingName(false)
  }

  if (!place) return null

  const category = categories?.find(c => c.id === place.category_id)
  const dayAssignments = selectedDayId ? (assignments[String(selectedDayId)] || []) : []
  const assignmentInDay = selectedDayId
    ? ((selectedAssignmentId ? dayAssignments.find(a => a.id === selectedAssignmentId) : null)
      ?? dayAssignments.find(a => a.place?.id === place.id))
    : null
  /** This stop belongs to a booked night rather than to the traveller. */
  const bookedNight = assignmentInDay
    ? assignmentInDay.accommodation_id != null
    : !!storedDayAssignments?.some(a => a.place?.id === place.id && a.accommodation_id != null)

  // The weekday lines are display text; the ring is computed from the structured
  // periods next to them, in the place's own timezone. open_now stays the fallback.
  // Hours the traveller typed in win over looked-up ones (#2472): they are what
  // somebody actually checked, and a place nobody listed has no other source.
  const ownHours = hoursLines(place.opening_hours, locale, t('places.hoursClosed'))
  const openingHours = ownHours ?? googleDetails?.opening_hours ?? null
  const detailLat = place.lat ?? googleDetails?.lat
  const detailLng = place.lng ?? googleDetails?.lng
  const placeTimeZone = resolvePlaceTimeZone(detailLat, detailLng)
  const openNow = ownHours
    ? resolveOpenNow({ periods: periodsFromWeek(place.opening_hours) }, detailLat, detailLng, null)
    : resolveOpenNow(
      { periods: googleDetails?.opening_periods, specialDays: googleDetails?.opening_special_days },
      detailLat,
      detailLng,
      googleDetails?.open_now,
    )
  // Allow-listed rather than passed straight through: window.open runs a
  // javascript: URL in this origin, and the stored value predates the check the
  // server does on the way in now.
  const websiteUrl = safeHttpUrl(place.website) ?? safeHttpUrl(googleDetails?.website)
  // Prefer the place's stored ftid; if it has none yet, use the one just fetched from Google.
  const navigationTargets = getNavigationTargets(
    place ? { ...place, google_ftid: place.google_ftid || googleDetails?.google_ftid || null } : null,
    googleDetails?.google_maps_url,
  )
  const navigationLabel = navigationTargets.length === 1 ? navigationTargetLabel(navigationTargets[0], t) : t('inspector.navigation')
  const selectedDay = days?.find(d => d.id === selectedDayId)
  const weekdayIndex = getWeekdayIndex(selectedDay?.date, placeTimeZone)

  // Its own files plus the ones on the bookings that hang on it (#2217).
  const placeFiles = filesForPlace(files, place.id, reservations, selectedAssignmentId != null ? [selectedAssignmentId] : [])

  const shortReview = (googleDetails?.reviews || []).find(r => r.text && r.text.length > 5)
  const phone = place.phone || googleDetails?.phone
  const description = place.description || googleDetails?.summary
  const showRating = (mode === 'trip' && !!onRate) || !!shortReview

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: `calc(${leftWidth}px + (100% - ${leftWidth}px - ${rightWidth}px) / 2)`,
        transform: 'translateX(-50%)',
        width: `min(800px, calc(100% - ${leftWidth}px - ${rightWidth}px - 32px))`,
        zIndex: 50,
        fontFamily: 'var(--font-system)',
      }}
    >
      <div className="flex max-h-[60vh] flex-col overflow-hidden rounded-[20px] border border-edge-faint bg-surface-elevated shadow-popover backdrop-blur-[40px] backdrop-saturate-[1.8]">
        <InspectorHead place={place} category={category} openNow={openNow} phone={phone} email={place.email}
          rating={googleDetails?.rating ?? null} ratingCount={googleDetails?.rating_count ?? null}
          price={place.price > 0 ? formatMoney(Number(place.price) || 0, place.currency || tripCurrency || 'EUR', locale) : null}
          time={place.place_time ? `${formatTime(place.place_time, locale, timeFormat)}${place.end_time ? ` – ${formatTime(place.end_time, locale, timeFormat)}` : ''}` : null}
          editingName={editingName} nameInputRef={nameInputRef} nameValue={nameValue} setNameValue={setNameValue}
          commitNameEdit={commitNameEdit} handleNameKeyDown={handleNameKeyDown} startNameEdit={startNameEdit}
          onUpdatePlace={onUpdatePlace}
          onUploadImage={mode === 'trip' && onUpdatePlace ? onUploadImage : undefined}
          attachedImages={pickableImages(placeFiles)}
          onImageFromFile={mode === 'trip' && onUpdatePlace ? onImageFromFile : undefined}
          onClose={onClose} />

        {/* The body scrolls inside the capped card; each block keeps its natural height (#1195). */}
        <div data-testid="inspector-scroll" className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-4 py-3.5 empty:hidden">

          {/* Collaborative rating (#1435): every member's own vote, shown as the
              average, and the first review worth quoting. */}
          {showRating && (
            // The review alone is a desktop extra, as it always was; without the vote row the block goes with it below md.
            <DialogSection className={mode === 'trip' && onRate ? 'flex-none' : 'hidden flex-none md:block'} label={t('places.details.fact.rating')}>
              <div className="flex flex-col gap-1.5">
                {mode === 'trip' && onRate && (
                  <div className={`${BOX} px-3 py-2`}>
                    <PlaceRating ratings={place.ratings ?? []} ratingAvg={place.rating_avg} onRate={rating => onRate(place.id, rating)} />
                  </div>
                )}
                {shortReview && (
                  <p className="m-0 hidden italic text-content-muted md:block" style={{ ...fs(12, 'body'), overflowWrap: 'anywhere' }}>„{shortReview.text}"</p>
                )}
              </div>
            </DialogSection>
          )}

          {roadtripActive && place.stop_type === 'charging' && <ChargingInfo placeId={place.id} />}
          {(roadtripEndDay || roadtripStay) && <VisitControls endDay={roadtripEndDay} stay={roadtripStay} />}

          {description && (
            <DialogSection className="flex-none" label={t('places.formDescription')}>
              <MarkdownBox>{description}</MarkdownBox>
            </DialogSection>
          )}

          {place.notes && (
            <DialogSection className="flex-none" label={t('places.formNotes')}>
              <MarkdownBox>{place.notes}</MarkdownBox>
            </DialogSection>
          )}

          {/* Day-specific assignment note (#2163) — written via MCP/API or the
              edit form; distinct from the pool-wide place.notes above, so its
              label says which day-scope it belongs to. */}
          {assignmentInDay?.notes && (
            <DialogSection className="flex-none" label={t('places.assignmentNotes')}>
              <MarkdownBox>{assignmentInDay.notes}</MarkdownBox>
            </DialogSection>
          )}

          {/* Bookings + participants — trip-only (collections have no days) */}
          {mode === 'trip' && (
            <PlaceBookingsAndPeople selectedAssignmentId={selectedAssignmentId} placeId={place.id} reservations={reservations}
              assignments={assignments} selectedDayId={selectedDayId} tripMembers={tripMembers}
              timeFormat={timeFormat} onSetParticipants={onSetParticipants}
              onEditTransport={onEditTransport} onEditReservation={onEditReservation} onOpenBooking={onOpenBooking} />
          )}

          <PlaceExtras openingHours={openingHours} weekdayIndex={weekdayIndex} hoursExpanded={hoursExpanded}
            setHoursExpanded={setHoursExpanded} timeFormat={timeFormat} place={place} placeFiles={placeFiles}
            onFileUpload={onFileUpload} filesExpanded={filesExpanded} setFilesExpanded={setFilesExpanded}
            fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isUploading={isUploading}
            distanceUnit={distanceUnit} onUpdatePlace={onUpdatePlace} />

          {/* Extra native rows from placeDetailProvider plugins (#1429). */}
          {mode === 'trip' && providerDetails.length > 0 && (
            <div className={`${BOX} flex flex-none flex-col gap-1.5 px-3 py-2.5`}>
              {providerDetails.flatMap((p) => p.items.map((it, i) => (
                <div key={`${p.pluginId}-${i}`} className="flex items-baseline justify-between gap-3" style={fs(12.5, 'body')}>
                  <span className="flex-none font-medium text-content-secondary">{it.label}</span>
                  {it.url
                    ? <a href={it.url} target="_blank" rel="noreferrer noopener" className="truncate text-right text-accent-on hover:underline">{it.value ?? '↗'}</a>
                    : <span className="text-right text-content-muted">{it.value}</span>}
                </div>
              )))}
            </div>
          )}

          {/* Place-detail plugin slots (#1429): sandboxed, scoped to this place. */}
          {mode === 'trip' && placeDetailPlugins.length > 0 && (
            <div className="flex flex-none flex-col gap-2">
              {placeDetailPlugins.map((p) => {
                const tid = (place as { trip_id?: number | string }).trip_id
                return (
                  <div key={p.id} className={`${BOX} overflow-hidden`}>
                    <PluginFrame pluginId={p.id} tripId={tid != null ? String(tid) : null} placeId={String(place.id)} title={p.name} surface="detail-slot" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: the day action and the ways out on the left, delete and edit on the right. */}
        <footer className="flex flex-none flex-wrap items-center gap-2 border-t border-edge-faint px-4 py-2.5">
          {/* Collection mode — copy to trip + per-place status */}
          {mode === 'collection' && onCopyToTrip && (
            <DialogButton variant="primary" onClick={onCopyToTrip} icon={<Copy size={14} strokeWidth={2} />} aria-label={t('collections.copyToTrip')}>
              <span className="max-sm:hidden">{t('collections.copyToTrip')}</span>
            </DialogButton>
          )}
          {mode === 'collection' && collectionStatus && onSetStatus && (
            <StatusBadge status={collectionStatus} onChange={onSetStatus} t={t} />
          )}
          {/* Trip mode — day assignment.
              A stop a lodging booking put there is not offered either way. Taking it off
              the day would leave the booking behind with nothing on the drive and no way
              back short of saving it again, and putting a second one beside it is the
              duplicate the stop exists to prevent. The booking is removed where it is
              made: in the day's overnight block, or by turning the night back into a
              pause in road trip mode. */}
          {mode === 'trip' && !!selectedDayId && !bookedNight && (
            assignmentInDay ? (
              <DialogButton onClick={() => onRemoveAssignment?.(selectedDayId, assignmentInDay.id)} icon={<Minus size={14} strokeWidth={2} />} aria-label={t('inspector.removeFromDay')}>
                <span className="max-sm:hidden">{t('inspector.removeFromDay')}</span>
              </DialogButton>
            ) : (
              <DialogButton variant="primary" onClick={() => onAssignToDay?.(place.id)} icon={<Plus size={14} strokeWidth={2} />}>
                {t('inspector.addToDay')}
              </DialogButton>
            )
          )}
          {navigationTargets.length > 0 && (
            <>
              {/* One target left (a place without coordinates) opens straight
                  away, exactly as this button always did. */}
              <span ref={navAnchorRef} className="inline-flex">
                <DialogButton
                  onClick={() => {
                    if (navigationTargets.length === 1) openNavigationTarget(navigationTargets[0])
                    else setNavOpen(o => !o)
                  }}
                  aria-label={navigationLabel}
                  aria-haspopup={navigationTargets.length > 1 ? 'menu' : undefined}
                  aria-expanded={navigationTargets.length > 1 ? navOpen : undefined}
                  icon={<Navigation size={14} strokeWidth={2} />}
                >
                  <span className="max-sm:hidden">{navigationLabel}</span>
                </DialogButton>
              </span>
              {navOpen && (
                <NavigationMenu
                  targets={navigationTargets}
                  anchor={navAnchorRef.current}
                  onClose={() => setNavOpen(false)}
                />
              )}
            </>
          )}
          {websiteUrl && (
            <DialogButton onClick={() => window.open(websiteUrl, '_blank', 'noopener,noreferrer')} icon={<ExternalLink size={14} strokeWidth={2} />} aria-label={t('inspector.website')}>
              <span className="max-sm:hidden">{t('inspector.website')}</span>
            </DialogButton>
          )}
          {/* Save to Collection — trip mode, independent of the Google Maps link */}
          {showSaveToCollection && (
            <DialogButton onClick={handleSaveToCollection}
              icon={savedInCollection ? <BookmarkCheck size={14} strokeWidth={2} /> : <Bookmark size={14} strokeWidth={2} />}
              aria-label={savedInCollection ? t('inspector.savedToCollection') : t('inspector.saveToCollection')}>
              <span className="max-sm:hidden">{savedInCollection ? t('inspector.savedToCollection') : t('inspector.saveToCollection')}</span>
            </DialogButton>
          )}
          <FooterSpacer />
          {mode === 'collection'
            ? (onRemoveFromList && <DeleteButton onClick={onRemoveFromList} label={t('collections.removeFromList')} />)
            : (onDelete && <DeleteButton onClick={onDelete} />)}
          {mode === 'trip' && onEdit && (
            <DialogButton variant="primary" onClick={onEdit} icon={<Pencil size={14} strokeWidth={2} />} aria-label={t('common.edit')}>
              <span className="max-sm:hidden">{t('common.edit')}</span>
            </DialogButton>
          )}
        </footer>
      </div>
    </div>
  )
}

/** Markdown in a framed box; it wraps long words instead of pushing the card wider. */
function MarkdownBox({ children }: { children: string }) {
  return (
    <div className={`${BOX} collab-note-md px-3 py-2 text-content-secondary`}
      style={{ ...fs(12.5, 'body'), lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{children}</Markdown>
    </div>
  )
}

interface InspectorHeadProps {
  place: Place
  category: Category | undefined
  openNow: boolean | null
  phone: string | null | undefined
  /** Typed in by hand (#2472); there is no looked-up one. */
  email?: string | null
  rating: number | null
  ratingCount: number | null
  price: string | null
  time: string | null
  editingName: boolean
  nameInputRef: React.RefObject<HTMLInputElement | null>
  nameValue: string
  setNameValue: (value: string) => void
  commitNameEdit: () => void
  handleNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  startNameEdit: () => void
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => void
  onUploadImage?: (placeId: number, file: File) => Promise<void>
  attachedImages: TripFile[]
  onImageFromFile?: (placeId: number, fileId: number) => Promise<void>
  onClose: () => void
}

/**
 * The head band: the avatar with its open/closed ring and photo credit, the
 * name (a double-click renames it), the address, and the facts as pills.
 */
function InspectorHead({ place, category, openNow, phone, email, rating, ratingCount, price, time, editingName, nameInputRef,
  nameValue, setNameValue, commitNameEdit, handleNameKeyDown, startNameEdit, onUpdatePlace, onUploadImage, attachedImages, onImageFromFile, onClose }: InspectorHeadProps) {
  const { t, locale } = useTranslation()
  const ring = openNow === true ? 'bg-success' : openNow === false ? 'bg-danger' : 'bg-surface-card shadow-sm'
  const hasCoords = !!(place.lat && place.lng)
  const hasPills = openNow !== null || !!category || !!time || rating != null || !!price || place.source === 'dawarich' || !!phone || !!email || hasCoords
  return (
    <header className="flex-none border-b border-edge-faint px-4 pb-3 pt-3.5" style={{ background: category?.color ? tintOf(category.color) : NEUTRAL_TINT }}>
      <div className="flex items-start gap-3.5">
        <div className="flex w-[57px] flex-none flex-col items-center">
          <div className={`rounded-full p-[2.5px] ${ring}`}>
            {onUploadImage
              ? <PlaceAvatarUpload place={place} category={category} size={52}
                  onUpload={(file: File) => onUploadImage(place.id, file)}
                  onRemove={() => onUpdatePlace(place.id, { image_url: null })}
                  attachedImages={attachedImages}
                  onPickAttached={onImageFromFile ? (fileId: number) => onImageFromFile(place.id, fileId) : undefined} />
              : <PlaceAvatar place={place} category={category} size={52} />}
          </div>
          <PhotoCredit imageUrl={place.image_url} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={handleNameKeyDown}
              aria-label={t('places.formName')}
              className="-mx-1.5 block w-[calc(100%+12px)] rounded-[8px] border-0 bg-surface-card px-1.5 py-0.5 font-bold tracking-[-0.01em] text-content shadow-sm outline-none"
              style={fs(17, 'subtitle')}
            />
          ) : (
            <h2 onDoubleClick={startNameEdit}
              className={`m-0 break-words font-bold leading-snug tracking-[-0.01em] text-content ${onUpdatePlace ? 'cursor-text' : ''}`}
              style={fs(17, 'subtitle')}>
              {place.name}
            </h2>
          )}
          {place.address && (
            // One line, whatever its length; the whole address is in the tooltip.
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-content-muted" style={fs(12.5, 'body')}>
              <MapPin size={12} strokeWidth={2} className="flex-none text-content-faint" />
              <Tooltip label={place.address}>
                <span className="min-w-0 truncate">{place.address}</span>
              </Tooltip>
            </div>
          )}

          {hasPills && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {openNow !== null && (
                <SoftPill tone={openNow ? 'success' : 'danger'} icon={<span className="h-1.5 w-1.5 flex-none rounded-full bg-current" />}>
                  {openNow ? t('inspector.opened') : t('inspector.closed')}
                </SoftPill>
              )}
              {category && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: category.color || 'var(--text-faint)' }} />
                  {category.name}
                </span>
              )}
              {time && <TimePill>{time}</TimePill>}
              {rating != null && rating > 0 && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <Star size={11} strokeWidth={2} fill="currentColor" className="flex-none text-warning" />
                  {rating.toFixed(1)}
                  {ratingCount ? <span className="font-medium text-content-faint">({ratingCount.toLocaleString(locale)})</span> : null}
                </span>
              )}
              {price && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <Banknote size={11} strokeWidth={2} className="flex-none text-success" />
                  {price}
                </span>
              )}
              {/* Where the place came from, when it did not come from somebody
                  typing it: a stay accepted out of their own recordings. The mark
                  alone — the name beside it is already the place's name, and a
                  word here would only repeat the tooltip. */}
              {place.source === 'dawarich' && (
                <Tooltip label={t('dawarich.place.fromDawarich')} placement="top">
                  <span role="img" aria-label={t('dawarich.place.fromDawarich')} className={`${HEAD_PILL} px-1 py-[3px]`}>
                    <span className="inline-flex overflow-hidden rounded-[4px]"><DawarichIcon size={13} /></span>
                  </span>
                </Tooltip>
              )}
              {phone && (
                <a href={`tel:${phone}`} className={`${HEAD_PILL} hover:text-content-secondary`} style={fs(10.5)}>
                  <Phone size={11} strokeWidth={2} className="flex-none text-content-faint" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className={`${HEAD_PILL} min-w-0 hover:text-content-secondary`} style={fs(10.5)}>
                  <Mail size={11} strokeWidth={2} className="flex-none text-content-faint" />
                  <span className="truncate">{email}</span>
                </a>
              )}
              {hasCoords && (
                <span className="hidden flex-none items-center rounded-full border border-edge-faint px-2 py-[1px] font-geist tabular-nums text-content-faint sm:inline-flex" style={fs(10.5)}>
                  {Number(place.lat).toFixed(6)}, {Number(place.lng).toFixed(6)}
                </span>
              )}
            </div>
          )}
        </div>

        <Tooltip label={t('common.close')}>
          <button type="button" onClick={onClose} aria-label={t('common.close')}
            className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content">
            <X size={15} strokeWidth={2.2} />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}

interface PlaceBookingsAndPeopleProps {
  selectedAssignmentId: number | null
  placeId: number
  reservations: Reservation[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  tripMembers: TripMember[]
  timeFormat: string
  onSetParticipants?: (assignmentId: number, dayId: number, participantIds: number[]) => void
  onEditTransport?: (reservation: Reservation) => void
  onEditReservation?: (reservation: Reservation) => void
  onOpenBooking?: (reservation: Reservation) => void
}

/** The bookings pinned to this stop and who joins it, side by side from sm up. */
function PlaceBookingsAndPeople({ selectedAssignmentId, placeId, reservations, assignments, selectedDayId,
  tripMembers, timeFormat, onSetParticipants, onEditTransport, onEditReservation, onOpenBooking }: PlaceBookingsAndPeopleProps) {
  const { t } = useTranslation()
  const linked = getPlaceBookings<Reservation>(reservations, selectedAssignmentId, placeId)
  const assignment = selectedAssignmentId ? (assignments[String(selectedDayId)] || []).find(a => a.id === selectedAssignmentId) : null
  const currentParticipants = assignment?.participants || []
  const participantIds = currentParticipants.map(p => p.user_id)
  const allJoined = currentParticipants.length === 0
  const showParticipants = !!selectedAssignmentId && tripMembers.length > 1
  if (linked.length === 0 && !showParticipants) return null
  return (
    <div className={`grid flex-none items-start gap-3 ${linked.length > 0 && showParticipants ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {/* Bookings pinned to this stop; several can share one (#2201) */}
      {linked.length > 0 && (
        <DialogSection label={t('reservations.title')}>
          <div className="flex flex-col gap-2">
            {linked.map(res => {
              // The strip summarised the booking but went nowhere, so its
              // attachments and fields had no route from the map (#2012).
              // A transport has its own form; picking by type is what the day
              // sidebar does, and an absent handler means this user may not
              // open this one, so the strip stays inert rather than lying.
              // With a detail to show, the card is the booking itself and opens it;
              // the editor is one Edit further, under the same rights as before.
              if (onOpenBooking) return <LinkedBookingCard key={res.id} res={res} timeFormat={timeFormat} open={() => onOpenBooking(res)} opens="detail" />
              const editor = TRANSPORT_TYPES.has(res.type) ? onEditTransport : onEditReservation
              return <LinkedBookingCard key={res.id} res={res} timeFormat={timeFormat} open={editor ? () => editor(res) : undefined} />
            })}
          </div>
        </DialogSection>
      )}

      {showParticipants && (
        <ParticipantsBox
          tripMembers={tripMembers}
          participantIds={participantIds}
          allJoined={allJoined}
          onSetParticipants={onSetParticipants}
          selectedAssignmentId={selectedAssignmentId}
          selectedDayId={selectedDayId}
        />
      )}
    </div>
  )
}

/** The facts of a booking's metadata that the card has no field for, one pill each. */
function bookingMetaParts(res: Reservation, t: (key: string) => string): string[] {
  const meta = parseMeta(res)
  const parts: string[] = []
  if (meta.airline && meta.flight_number) parts.push(`${meta.airline} ${meta.flight_number}`)
  else if (meta.flight_number) parts.push(meta.flight_number)
  if (meta.departure_airport && meta.arrival_airport) parts.push(`${meta.departure_airport} → ${meta.arrival_airport}`)
  if (meta.train_number) parts.push(meta.train_number)
  if (meta.platform) parts.push(`${t('reservations.meta.platform')} ${meta.platform}`)
  if (meta.check_in_time) parts.push(`${t('reservations.meta.checkIn')} ${meta.check_in_time}`)
  if (meta.check_out_time) parts.push(`${t('reservations.meta.checkOut')} ${meta.check_out_time}`)
  return parts
}

/**
 * A booking on this stop as a small booking card: the head band tinted by its
 * status, then its date, time and code as fields. With `open` it opens the
 * booking's detail or its editor (`opens`) on a click, Enter or Space; without
 * it the card is a read-only summary.
 */
function LinkedBookingCard({ res, timeFormat, open, opens = 'editor' }: { res: Reservation; timeFormat: string; open?: () => void; opens?: 'detail' | 'editor' }) {
  const { t, locale } = useTranslation()
  const openLabel = t(opens === 'detail' ? 'roadtrip.ride.open' : 'inspector.editRes')
  // A stop can carry several bookings (#2201), so a card that opens its booking is
  // named by it; the editor's card keeps its old name.
  const cardName = opens === 'detail' ? `${openLabel}: ${res.title}` : openLabel
  const OpenGlyph = opens === 'detail' ? ChevronRight : Pencil
  const confirmed = res.status === 'confirmed'
  const { date, time: startTime } = splitReservationDateTime(res.reservation_time)
  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
  const metaParts = bookingMetaParts(res, t)
  const hasFields = !!(date || startTime || endTime || res.confirmation_number)
  const card = (
    <div
      role={open ? 'button' : undefined}
      // No press-scale on the composite card: shrinking it mid-click slides the
      // links inside out from under the pointer (#2158).
      data-no-press
      aria-label={open ? cardName : undefined}
      tabIndex={open ? 0 : undefined}
      onClick={open}
      onKeyDown={open ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() }
      } : undefined}
      className={`group flex flex-col overflow-hidden rounded-xl border border-edge-faint bg-surface-secondary text-left ${open ? 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--text-primary)]' : ''}`}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5" style={{ background: toneTint(toneOf(res)) }}>
        <TypeTile type={res.type} size={24} />
        <span className="min-w-0 flex-1 truncate font-bold text-content" style={fs(12.5, 'body')}>{res.title}</span>
        <SoftPill tone={confirmed ? 'success' : 'warning'} caps>{confirmed ? t('reservations.confirmed') : t('reservations.pending')}</SoftPill>
        {open && <OpenGlyph size={12} strokeWidth={2} aria-hidden className="flex-none text-content-faint opacity-60 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />}
      </div>
      {(hasFields || metaParts.length > 0 || res.notes) && (
        <div className="flex flex-col gap-2 border-t border-edge-faint px-2.5 pb-2.5 pt-2">
          {hasFields && (
            <div className="flex gap-2">
              {date && (
                <Field label={t('reservations.date')} className="flex-1">
                  {new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </Field>
              )}
              {(startTime || endTime) && (
                <Field label={t('reservations.time')} className="flex-1" tabular>
                  {startTime ? formatTime(startTime, locale, timeFormat) : ''}
                  {endTime ? ` – ${formatTime(endTime, locale, timeFormat)}` : ''}
                </Field>
              )}
              {res.confirmation_number && (
                <Field label={t('reservations.confirmationCode')} className="flex-1" tabular>
                  <BlurredCode className="font-geist">{res.confirmation_number}</BlurredCode>
                </Field>
              )}
            </div>
          )}
          {metaParts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {metaParts.map((part, i) => <SoftPill key={i}>{part}</SoftPill>)}
            </div>
          )}
          {res.notes && (
            <div className="collab-note-md text-content-muted" style={{ ...fs(11.5, 'body'), lineHeight: 1.45, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{res.notes}</Markdown>
            </div>
          )}
        </div>
      )}
    </div>
  )
  return open ? <Tooltip label={openLabel} placement="top">{card}</Tooltip> : card
}

function MemberAvatar({ member, size }: { member: TripMember; size: number }) {
  const src = member.avatar_url || avatarSrc(member.avatar)
  return (
    <span className="grid flex-none place-items-center overflow-hidden rounded-full bg-surface-tertiary font-bold text-content-muted" style={{ width: size, height: size, ...fs(8.5) }}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : member.username?.[0]?.toUpperCase()}
    </span>
  )
}

interface ParticipantsBoxProps {
  tripMembers: TripMember[]
  participantIds: number[]
  allJoined: boolean
  onSetParticipants?: (assignmentId: number, dayId: number, participantIds: number[]) => void
  selectedAssignmentId: number | null
  selectedDayId: number | null
}

/**
 * Who joins this stop. Nobody set means everyone; a chip takes its member off,
 * the last one stays, and the + adds a missing member back.
 */
function ParticipantsBox({ tripMembers, participantIds, allJoined, onSetParticipants, selectedAssignmentId, selectedDayId }: ParticipantsBoxProps) {
  const { t } = useTranslation()
  const [showAdd, setShowAdd] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)

  // The add list closes on a click elsewhere or on Escape, like every popover.
  useEffect(() => {
    if (!showAdd) return
    const onDown = (e: MouseEvent) => { if (!addRef.current?.contains(e.target as Node)) setShowAdd(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAdd(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showAdd])

  // Active participants: if allJoined, show all members; otherwise show only those in participantIds
  const activeMembers = allJoined ? tripMembers : tripMembers.filter(m => participantIds.includes(m.id))
  const availableToAdd = allJoined ? [] : tripMembers.filter(m => !participantIds.includes(m.id))
  const canRemove = activeMembers.length > 1

  const handleRemove = (userId: number) => {
    if (!onSetParticipants) return
    let newIds: number[]
    if (allJoined) {
      newIds = tripMembers.filter(m => m.id !== userId).map(m => m.id)
    } else {
      newIds = participantIds.filter(id => id !== userId)
    }
    if (newIds.length === tripMembers.length) newIds = []
    onSetParticipants(selectedAssignmentId, selectedDayId, newIds)
  }

  const handleAdd = (userId: number) => {
    if (!onSetParticipants) return
    const newIds = [...participantIds, userId]
    if (newIds.length === tripMembers.length) {
      onSetParticipants(selectedAssignmentId, selectedDayId, [])
    } else {
      onSetParticipants(selectedAssignmentId, selectedDayId, newIds)
    }
    setShowAdd(false)
  }

  return (
    <DialogSection label={t('inspector.participants')}>
      <div className="flex flex-wrap items-center gap-1.5">
        {activeMembers.map(member => (
          <button type="button" key={member.id} disabled={!canRemove}
            onClick={() => { if (canRemove) handleRemove(member.id) }}
            className="group/chip inline-flex max-w-full items-center gap-1.5 rounded-full border border-edge-faint bg-surface-card py-[2px] pl-[2px] pr-2.5 font-semibold text-content transition-colors enabled:hover:border-danger enabled:hover:bg-danger-soft enabled:hover:text-danger disabled:cursor-default"
            style={fs(11.5, 'body')}>
            <MemberAvatar member={member} size={18} />
            <span className={`truncate ${canRemove ? 'group-hover/chip:line-through' : ''}`}>{member.username}</span>
          </button>
        ))}

        {availableToAdd.length > 0 && (
          <div ref={addRef} className="relative">
            <Tooltip label={t('common.add')}>
              <button type="button" onClick={() => setShowAdd(!showAdd)} aria-label={t('common.add')} aria-expanded={showAdd}
                className="grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] border-dashed border-edge font-semibold leading-none text-content-faint transition-colors hover:border-content-muted hover:text-content"
                style={fs(12, 'body')}>+</button>
            </Tooltip>

            {showAdd && (
              <div className="absolute left-0 top-[26px] z-[100] min-w-[160px] rounded-[10px] border border-edge bg-surface-card p-1 shadow-dropdown">
                {availableToAdd.map(member => (
                  <button type="button" key={member.id} onClick={() => handleAdd(member.id)}
                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-content transition-colors hover:bg-surface-hover"
                    style={fs(11.5, 'body')}>
                    <MemberAvatar member={member} size={18} />
                    <span className="min-w-0 flex-1 truncate">{member.username}</span>
                    {member.is_guest && <GuestBadge size="xs" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DialogSection>
  )
}

/**
 * Track colour (#776) — only for places that carry GPX geometry. Sits next
 * to the stats block rather than inside it: that block bails out on unparsable
 * geometry, and the colour control has no business disappearing with it.
 */
function TrackColorRow({ place, trackColor, onUpdatePlace }: { place: Place; trackColor: string; onUpdatePlace?: (placeId: number, data: Partial<Place>) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <DialogSection className="flex-none" label={t('inspector.trackColor')}>
      <div className={BOX}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-surface-hover">
          <span className="h-4 w-4 flex-none rounded-full ring-1 ring-inset ring-edge" style={{ backgroundColor: trackColor }} />
          <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>
            <span className="sr-only">{t('inspector.trackColor')}: </span>
            {place.route_color ? place.route_color.toUpperCase() : t('inspector.trackColorAuto')}
          </span>
          {open ? <ChevronUp size={13} className="flex-none text-content-faint" /> : <ChevronDown size={13} className="flex-none text-content-faint" />}
        </button>
        {open && (
          <div className="border-t border-edge-faint px-3 py-2.5">
            <TrackColorPicker
              value={place.route_color ?? null}
              inheritedColor={inheritedTrackColor(place)}
              onChange={color => onUpdatePlace?.(place.id, { route_color: color })}
            />
          </div>
        )}
      </div>
    </DialogSection>
  )
}

interface TrackStats {
  distKm: number
  hasEle: boolean
  minEle: number
  maxEle: number
  totalUp: number
  totalDown: number
  /** The elevation profile as an SVG path in a CHART_W × CHART_H box, empty without elevations. */
  pathD: string
}

const CHART_W = 280
const CHART_H = 60

/** Distance, elevation extremes, climb and descent of a GPX track, or null when it cannot be read. */
function computeTrackStats(routeGeometry: string): TrackStats | null {
  try {
    const pts: number[][] = JSON.parse(routeGeometry)
    if (!pts || pts.length < 2) return null
    const hasEle = pts[0].length >= 3

    // Haversine distance
    const toRad = (d: number) => d * Math.PI / 180
    let totalDist = 0
    for (let i = 1; i < pts.length; i++) {
      const [lat1, lng1] = pts[i - 1], [lat2, lng2] = pts[i]
      const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
      totalDist += 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    // Elevation stats
    let minEle = Infinity, maxEle = -Infinity, totalUp = 0, totalDown = 0
    if (hasEle) {
      for (let i = 0; i < pts.length; i++) {
        const e = pts[i][2]
        if (e < minEle) minEle = e
        if (e > maxEle) maxEle = e
        if (i > 0) {
          const diff = e - pts[i - 1][2]
          if (diff > 0) totalUp += diff; else totalDown += Math.abs(diff)
        }
      }
    }

    // Elevation profile
    const elevations = hasEle ? pts.map(p => p[2]) : []
    let pathD = ''
    if (elevations.length > 1) {
      const step = Math.max(1, Math.floor(elevations.length / CHART_W))
      const sampled = elevations.filter((_, i) => i % step === 0)
      const eMin = Math.min(...sampled), eMax = Math.max(...sampled)
      const range = eMax - eMin || 1
      pathD = sampled.map((e, i) => {
        const x = (i / (sampled.length - 1)) * CHART_W
        const y = CHART_H - ((e - eMin) / range) * (CHART_H - 4) - 2
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    }
    return { distKm: totalDist / 1000, hasEle, minEle, maxEle, totalUp, totalDown, pathD }
  } catch { return null }
}

function TrackStatsSection({ place, trackColor, distanceUnit }: { place: Place; trackColor: string; distanceUnit: DistanceUnit }) {
  const { t } = useTranslation()
  const stats = computeTrackStats(place.route_geometry)
  if (!stats) return null
  return (
    <DialogSection className="flex-none" label={t('inspector.trackStats')}>
      <div className={`${BOX} flex flex-col gap-2 px-3 py-2.5`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <SoftPill icon={<MapPin size={11} strokeWidth={2} className="flex-none" style={{ color: trackColor }} />}>
            {formatDistance(stats.distKm, distanceUnit)}
          </SoftPill>
          {stats.hasEle && (
            <>
              <SoftPill icon={<Mountain size={11} strokeWidth={2} className="flex-none text-success" />}>{formatElevation(stats.maxEle, distanceUnit)}</SoftPill>
              <SoftPill icon={<Mountain size={11} strokeWidth={2} className="flex-none text-danger" />}>{formatElevation(stats.minEle, distanceUnit)}</SoftPill>
              <SoftPill>{'↑ '}{formatElevation(stats.totalUp, distanceUnit)}</SoftPill>
              <SoftPill>{'↓ '}{formatElevation(stats.totalDown, distanceUnit)}</SoftPill>
            </>
          )}
        </div>
        {stats.pathD && (
          <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" className="block rounded-[6px] bg-surface-tertiary">
            <defs>
              <linearGradient id={`ele-grad-${place.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trackColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={trackColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={`${stats.pathD} L${CHART_W},${CHART_H} L0,${CHART_H} Z`} fill={`url(#ele-grad-${place.id})`} />
            <path d={stats.pathD} fill="none" stroke={trackColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </DialogSection>
  )
}

interface PlaceExtrasProps {
  openingHours: string[] | null
  weekdayIndex: number
  hoursExpanded: boolean
  setHoursExpanded: React.Dispatch<React.SetStateAction<boolean>>
  timeFormat: string
  place: Place
  placeFiles: TripFile[]
  onFileUpload?: (fd: FormData) => Promise<unknown>
  filesExpanded: boolean
  setFilesExpanded: React.Dispatch<React.SetStateAction<boolean>>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
  distanceUnit: DistanceUnit
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => void
}

/** Opening hours, the track of a GPX place and the files, side by side from sm up when there are hours. */
function PlaceExtras({ openingHours, weekdayIndex, hoursExpanded, setHoursExpanded, timeFormat, place,
  placeFiles, onFileUpload, filesExpanded, setFilesExpanded, fileInputRef, handleFileUpload, isUploading, distanceUnit,
  onUpdatePlace }: PlaceExtrasProps) {
  const { t } = useTranslation()
  const openFile = useOpenFile()
  const hasHours = !!openingHours && openingHours.length > 0
  const showFiles = placeFiles.length > 0 || !!onFileUpload
  if (!hasHours && !place.route_geometry && !showFiles) return null
  const trackColor = resolveTrackColor(place)
  return (
    <div className={`grid flex-none grid-cols-1 items-start gap-3 ${hasHours ? 'sm:grid-cols-2' : ''}`}>
      {hasHours && (
        <DialogSection label={t('inspector.openingHours')}>
          <div className={`${BOX} relative`}>
            {hoursExpanded ? (
              <>
                <div className="flex flex-col py-2 pl-3 pr-10" style={fs(12, 'body')}>
                  {openingHours.map((line, i) => (
                    <span key={i} className={`py-[2px] ${i === weekdayIndex ? 'font-semibold text-content' : 'text-content-muted'}`}>
                      {convertHoursLine(line, timeFormat)}
                    </span>
                  ))}
                </div>
                <Tooltip label={t('common.collapse')}>
                  <button type="button" onClick={() => setHoursExpanded(false)} aria-expanded aria-label={t('common.collapse')}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-hover hover:text-content">
                    <ChevronUp size={14} strokeWidth={2} />
                  </button>
                </Tooltip>
              </>
            ) : (
              <button type="button" onClick={() => setHoursExpanded(true)} aria-expanded={false}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-surface-hover">
                <Clock size={13} strokeWidth={2} className="flex-none text-content-faint" />
                <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>
                  {convertHoursLine(openingHours[weekdayIndex] || '', timeFormat) || t('inspector.showHours')}
                </span>
                <ChevronDown size={13} className="flex-none text-content-faint" />
              </button>
            )}
          </div>
        </DialogSection>
      )}

      {place.route_geometry && <TrackColorRow place={place} trackColor={trackColor} onUpdatePlace={onUpdatePlace} />}
      {place.route_geometry && <TrackStatsSection place={place} trackColor={trackColor} distanceUnit={distanceUnit} />}

      {showFiles && (
        <DialogSection
          label={t('inspector.files')}
          action={onFileUpload && (
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-semibold text-content-muted shadow-sm transition-colors focus-within:ring-2 focus-within:ring-accent hover:text-content" style={fs(10.5)}>
              <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileUpload} />
              {isUploading ? <span aria-live="polite">…</span> : <><Upload size={11} strokeWidth={2} />{t('common.upload')}</>}
            </label>
          )}
        >
          <div className={BOX}>
            <button type="button" onClick={() => setFilesExpanded(f => !f)} aria-expanded={filesExpanded}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-surface-hover">
              <FileText size={13} strokeWidth={2} className="flex-none text-content-faint" />
              <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>
                {placeFiles.length > 0 ? t('inspector.filesCount', { count: placeFiles.length }) : t('inspector.files')}
              </span>
              {filesExpanded ? <ChevronUp size={13} className="flex-none text-content-faint" /> : <ChevronDown size={13} className="flex-none text-content-faint" />}
            </button>
            {filesExpanded && placeFiles.length > 0 && (
              <div className="flex flex-col gap-0.5 border-t border-edge-faint p-1">
                {placeFiles.map(f => (
                  <button type="button" key={f.id} onClick={() => openFile(f)}
                    className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-surface-hover">
                    {(f.mime_type || '').startsWith('image/')
                      ? <FileImage size={12} strokeWidth={2} className="flex-none text-content-muted" />
                      : <File size={12} strokeWidth={2} className="flex-none text-content-muted" />}
                    <span className="min-w-0 flex-1 truncate text-content-secondary" style={fs(12, 'body')}>{f.original_name}</span>
                    {f.file_size ? <span className="flex-none tabular-nums text-content-faint" style={fs(11)}>{formatFileSize(f.file_size)}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogSection>
      )}
    </div>
  )
}

