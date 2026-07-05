import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { openFile } from '../../utils/fileDownload'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { X, Clock, MapPin, ExternalLink, Phone, Euro, Edit2, Trash2, Plus, Minus, ChevronDown, ChevronUp, FileText, Upload, File, FileImage, Star, Navigation, Map as MapIcon, Users, Mountain, TrendingUp, Bookmark, BookmarkCheck, Copy } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import GuestBadge from '../shared/GuestBadge'
import StatusBadge from '../Collections/StatusBadge'
import { mapsApi, pluginsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useToast } from '../shared/Toast'
import { useTranslation, translateApiError } from '../../i18n'
import { usePluginStore } from '../../store/pluginStore'
import PluginFrame from '../Plugins/PluginFrame'
import type { Place, Category, Day, Assignment, Reservation, TripFile, AssignmentsMap } from '../../types'
import type { CollectionStatus } from '@trek/shared'
import { splitReservationDateTime, formatTime } from '../../utils/formatters'
import { formatDistance, formatElevation } from '../../utils/units'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'
import { getOpenStreetMapUrlForPlace } from './placeOpenStreetMap'

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

function usePlaceDetails(googlePlaceId, osmId, language) {
  const [details, setDetails] = useState(null)
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

function getWeekdayIndex(dateStr) {
  // weekdayDescriptions[0] = Monday … [6] = Sunday
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const jsDay = d.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function convertHoursLine(line, timeFormat) {
  if (!line) return ''
  const hasAmPm = /\d{1,2}:\d{2}\s*(AM|PM)/i.test(line)

  if (timeFormat === '12h' && !hasAmPm) {
    // 24h → 12h: "10:00" → "10:00 AM", "21:00" → "9:00 PM", "Uhr" entfernen
    return line.replace(/\s*Uhr/g, '').replace(/(\d{1,2}):(\d{2})/g, (match, h, m) => {
      const hour = parseInt(h)
      if (isNaN(hour)) return match
      const period = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${h12}:${m} ${period}`
    })
  }
  if (timeFormat !== '12h' && hasAmPm) {
    // 12h → 24h: "10:00 AM" → "10:00", "9:00 PM" → "21:00"
    return line.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (_, h, m, p) => {
      let hour = parseInt(h)
      if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12
      if (p.toUpperCase() === 'AM' && hour === 12) hour = 0
      return `${String(hour).padStart(2, '0')}:${m}`
    })
  }
  return line
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
  leftWidth?: number
  rightWidth?: number
  // ── Collection-mode props ──
  collectionStatus?: CollectionStatus
  onCopyToTrip?: () => void
  onSetStatus?: (status: CollectionStatus) => void
  onRemoveFromList?: () => void
}

export default function PlaceInspector({
  place, categories, mode = 'trip', days = [], selectedDayId = null, selectedAssignmentId = null,
  assignments = {}, reservations = [],
  onClose, onEdit, onDelete, onAssignToDay, onRemoveAssignment,
  files = [], onFileUpload, tripMembers = [], onSetParticipants, onUpdatePlace,
  leftWidth = 0, rightWidth = 0,
  collectionStatus, onCopyToTrip, onSetStatus, onRemoveFromList,
}: PlaceInspectorProps) {
  // Plugins that declared a place-detail slot mount at the bottom of this panel,
  // scoped to the open place (trip mode only). Inline-filter like the other sites.
  const placeDetailPlugins = usePluginStore((s) => s.plugins).filter((p) => p.type === 'widget' && p.slot === 'place-detail')
  // Extra native rows contributed by placeDetailProvider plugins (#1429). Fail-safe:
  // any provider error/timeout is dropped server-side, so this only ever adds rows.
  const [providerDetails, setProviderDetails] = useState<Array<{ pluginId: string; items: Array<{ label: string; value?: string; url?: string }> }>>([])
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
  const nameInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const googleDetails = usePlaceDetails(place?.google_place_id, place?.osm_id, language)

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

  const handleNameKeyDown = (e) => {
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

  const openingHours = googleDetails?.opening_hours || null
  const openNow = googleDetails?.open_now ?? null
  // Prefer the place's stored ftid; if it has none yet, use the one just fetched from Google.
  const googleMapsUrl = getGoogleMapsUrlForPlace(
    place ? { ...place, google_ftid: place.google_ftid || googleDetails?.google_ftid || null } : null,
    googleDetails?.google_maps_url,
  )
  const openStreetMapUrl = getOpenStreetMapUrlForPlace(place)
  const selectedDay = days?.find(d => d.id === selectedDayId)
  const weekdayIndex = getWeekdayIndex(selectedDay?.date)

  const placeFiles = (files || []).filter(f => String(f.place_id) === String(place.id) || (f.linked_place_ids || []).includes(place.id))

  const handleFileUpload = useCallback(async (e) => {
    const selectedFiles = Array.from((e.target as HTMLInputElement).files || [])
    if (!selectedFiles.length || !onFileUpload) return
    setIsUploading(true)
    try {
      for (const file of selectedFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('place_id', String(place.id))
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
  }, [onFileUpload, place.id, toast, t])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: `calc(${leftWidth}px + (100% - ${leftWidth}px - ${rightWidth}px) / 2)`,
        transform: 'translateX(-50%)',
        width: `min(800px, calc(100% - ${leftWidth}px - ${rightWidth}px - 32px))`,
        zIndex: 50,
        fontFamily: "var(--font-system)",
      }}
    >
      <div className="bg-surface-elevated" style={{
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <PlaceInspectorHeader openNow={openNow} place={place} category={category} t={t} editingName={editingName}
          nameInputRef={nameInputRef} nameValue={nameValue} setNameValue={setNameValue} commitNameEdit={commitNameEdit}
          handleNameKeyDown={handleNameKeyDown} startNameEdit={startNameEdit} onUpdatePlace={onUpdatePlace}
          locale={locale} timeFormat={timeFormat} onClose={onClose} />

        {/* Content — scrollable */}
        <div data-testid="inspector-scroll" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Info-Chips — hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex" style={{ flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {googleDetails?.rating && (() => {
              const shortReview = (googleDetails.reviews || []).find(r => r.text && r.text.length > 5)
              return (
                <Chip
                  icon={<Star size={12} fill="#facc15" color="#facc15" />}
                  text={<>
                    {googleDetails.rating.toFixed(1)}
                    {googleDetails.rating_count ? <span style={{ opacity: 0.5 }}> ({googleDetails.rating_count.toLocaleString(locale)})</span> : ''}
                    {shortReview && <span className="hidden md:inline" style={{ opacity: 0.6, fontWeight: 400, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> · „{shortReview.text}"</span>}
                  </>}
                  color="var(--text-secondary)" bg="var(--bg-hover)"
                />
              )
            })()}
            {place.price > 0 && (
              <Chip icon={<Euro size={12} />} text={`${place.price} ${place.currency || '€'}`} color="#059669" bg="#ecfdf5" />
            )}
          </div>

          {/* Telefon */}
          {(place.phone || googleDetails?.phone) && (
            <div style={{ display: 'flex', gap: 12 }}>
              <a href={`tel:${place.phone || googleDetails.phone}`}
                className="text-content"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', textDecoration: 'none' }}>
                <Phone size={12} /> {place.phone || googleDetails.phone}
              </a>
            </div>
          )}

          {/* Description / Summary */}
          {(place.description || googleDetails?.summary) && (
            <div className="collab-note-md bg-surface-hover text-content-muted" style={{ borderRadius: 10, overflow: 'hidden', flexShrink: 0, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: '1.5', padding: '8px 12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{place.description || googleDetails?.summary || ''}</Markdown>
            </div>
          )}

          {/* Notes */}
          {place.notes && (
            <div className="collab-note-md bg-surface-hover text-content-muted" style={{ borderRadius: 10, overflow: 'hidden', flexShrink: 0, fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: '1.5', padding: '8px 12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{place.notes}</Markdown>
            </div>
          )}

          {/* Reservation + Participants — trip-only (collections have no days) */}
          {mode === 'trip' && (
            <PlaceReservationParticipants selectedAssignmentId={selectedAssignmentId} reservations={reservations}
              assignments={assignments} selectedDayId={selectedDayId} tripMembers={tripMembers} locale={locale}
              timeFormat={timeFormat} t={t} onSetParticipants={onSetParticipants} />
          )}

          {/* Opening hours + Files — side by side on desktop only if both exist */}
          <PlaceExtras openingHours={openingHours} weekdayIndex={weekdayIndex} hoursExpanded={hoursExpanded}
            setHoursExpanded={setHoursExpanded} timeFormat={timeFormat} t={t} place={place} placeFiles={placeFiles}
            onFileUpload={onFileUpload} filesExpanded={filesExpanded} setFilesExpanded={setFilesExpanded}
            fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isUploading={isUploading}
            distanceUnit={distanceUnit} />

          {/* Extra native rows from placeDetailProvider plugins (#1429). */}
          {mode === 'trip' && providerDetails.length > 0 && (
            <div className="bg-surface-hover" style={{ borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {providerDetails.flatMap((p) => p.items.map((it, i) => (
                <div key={`${p.pluginId}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))' }}>
                  <span className="text-content-secondary" style={{ fontWeight: 500, flexShrink: 0 }}>{it.label}</span>
                  {it.url
                    ? <a href={it.url} target="_blank" rel="noreferrer noopener" className="text-accent" style={{ textDecoration: 'none', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.value ?? '↗'}</a>
                    : <span className="text-content-muted" style={{ textAlign: 'right' }}>{it.value}</span>}
                </div>
              )))}
            </div>
          )}

          {/* Place-detail plugin slots (#1429): sandboxed, scoped to this place. */}
          {mode === 'trip' && placeDetailPlugins.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {placeDetailPlugins.map((p) => {
                const tid = (place as { trip_id?: number | string }).trip_id
                return (
                  <div key={p.id} className="bg-surface-hover" style={{ borderRadius: 10, overflow: 'hidden' }}>
                    <PluginFrame pluginId={p.id} tripId={tid != null ? String(tid) : null} placeId={String(place.id)} title={p.name} />
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="border-t border-edge-faint" style={{ padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          {/* Collection mode — copy to trip + per-place status */}
          {mode === 'collection' && onCopyToTrip && (
            <ActionButton onClick={onCopyToTrip} variant="primary" icon={<Copy size={13} />}
              label={<span className="hidden sm:inline">{t('collections.copyToTrip')}</span>} />
          )}
          {mode === 'collection' && collectionStatus && onSetStatus && (
            <StatusBadge status={collectionStatus} onChange={onSetStatus} t={t} />
          )}
          {/* Trip mode — day assignment */}
          {mode === 'trip' && selectedDayId && (
            assignmentInDay ? (
              <ActionButton onClick={() => onRemoveAssignment?.(selectedDayId, assignmentInDay.id)} variant="ghost" icon={<Minus size={13} />}
                label={<span className="hidden sm:inline">{t('inspector.removeFromDay')}</span>} />
            ) : (
              <ActionButton onClick={() => onAssignToDay?.(place.id)} variant="primary" icon={<Plus size={13} />} label={t('inspector.addToDay')} />
            )
          )}
          {/* Save to Collection — trip mode, independent of the Google Maps link */}
          {showSaveToCollection && (
            <ActionButton onClick={handleSaveToCollection} variant="ghost"
              icon={savedInCollection ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              label={<span className="hidden sm:inline">{savedInCollection ? t('inspector.savedToCollection') : t('inspector.saveToCollection')}</span>} />
          )}
          {googleMapsUrl && (
            <ActionButton onClick={() => window.open(googleMapsUrl, '_blank')} variant="ghost" icon={<Navigation size={13} />}
              label={<span className="hidden sm:inline">{t('inspector.google')}</span>} />
          )}
          {openStreetMapUrl && (
            <ActionButton onClick={() => window.open(openStreetMapUrl, '_blank')} variant="ghost" icon={<MapIcon size={13} />}
              label={<span className="hidden sm:inline">{t('inspector.openStreetMap')}</span>} />
          )}
          {(place.website || googleDetails?.website) && (
            <ActionButton onClick={() => window.open(place.website || googleDetails?.website, '_blank')} variant="ghost" icon={<ExternalLink size={13} />}
              label={<span className="hidden sm:inline">{t('inspector.website')}</span>} />
          )}
          <div style={{ flex: 1 }} />
          {mode === 'trip' && onEdit && (
            <ActionButton onClick={onEdit} variant="ghost" icon={<Edit2 size={13} />} label={<span className="hidden sm:inline">{t('common.edit')}</span>} />
          )}
          {mode === 'collection'
            ? (onRemoveFromList && (
                <ActionButton onClick={onRemoveFromList} variant="danger" icon={<Trash2 size={13} />}
                  label={<span className="hidden sm:inline">{t('collections.removeFromList')}</span>} />
              ))
            : (onDelete && (
                <ActionButton onClick={onDelete} variant="danger" icon={<Trash2 size={13} />} label={<span className="hidden sm:inline">{t('common.delete')}</span>} />
              ))}
        </div>
      </div>
    </div>
  )
}

interface ChipProps {
  icon: React.ReactNode
  text: React.ReactNode
  color?: string
  bg?: string
}

function Chip({ icon, text, color = 'var(--text-secondary)', bg = 'var(--bg-hover)' }: ChipProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: bg, color, fontSize: 'calc(12px * var(--fs-scale-body, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

interface RowProps {
  icon: React.ReactNode
  children: React.ReactNode
}

function Row({ icon, children }: RowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

interface ActionButtonProps {
  onClick: () => void
  variant: 'primary' | 'ghost' | 'danger'
  icon: React.ReactNode
  label: React.ReactNode
}

export function ActionButton({ onClick, variant, icon, label }: ActionButtonProps) {
  const base = {
    primary: { background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', hoverBg: 'var(--text-secondary)' },
    ghost: { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', hoverBg: 'var(--bg-tertiary)' },
    danger: { background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'none', hoverBg: 'rgba(239,68,68,0.16)' },
  }
  const s = base[variant] || base.ghost
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 10, minHeight: 30,
        fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'background 0.15s, opacity 0.15s',
        background: s.background, color: s.color, border: s.border,
      }}
      onMouseEnter={e => e.currentTarget.style.background = s.hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = s.background}
    >
      {icon}{label}
    </button>
  )
}

interface ParticipantsBoxProps {
  tripMembers: TripMember[]
  participantIds: number[]
  allJoined: boolean
  onSetParticipants: (assignmentId: number, dayId: number, participantIds: number[]) => void
  selectedAssignmentId: number | null
  selectedDayId: number | null
  t: (key: string) => string
}

function ParticipantsBox({ tripMembers, participantIds, allJoined, onSetParticipants, selectedAssignmentId, selectedDayId, t }: ParticipantsBoxProps) {
  const [showAdd, setShowAdd] = React.useState(false)
  const [hoveredId, setHoveredId] = React.useState(null)

  // Active participants: if allJoined, show all members; otherwise show only those in participantIds
  const activeMembers = allJoined ? tripMembers : tripMembers.filter(m => participantIds.includes(m.id))
  const availableToAdd = allJoined ? [] : tripMembers.filter(m => !participantIds.includes(m.id))

  const handleRemove = (userId) => {
    if (!onSetParticipants) return
    let newIds
    if (allJoined) {
      newIds = tripMembers.filter(m => m.id !== userId).map(m => m.id)
    } else {
      newIds = participantIds.filter(id => id !== userId)
    }
    if (newIds.length === tripMembers.length) newIds = []
    onSetParticipants(selectedAssignmentId, selectedDayId, newIds)
  }

  const handleAdd = (userId) => {
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
    <div style={{ borderRadius: 12, border: '1px solid var(--border-faint)', padding: '8px 10px' }}>
      <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Users size={10} /> {t('inspector.participants')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {activeMembers.map(member => {
          const isHovered = hoveredId === member.id
          const canRemove = activeMembers.length > 1
          return (
            <div key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => { if (canRemove) handleRemove(member.id) }}
              className={isHovered && canRemove ? 'bg-[rgba(239,68,68,0.06)] text-[#ef4444]' : 'bg-surface-hover text-content'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px 2px 3px', borderRadius: 99,
                border: `1.5px solid ${isHovered && canRemove ? 'rgba(239,68,68,0.4)' : 'var(--accent)'}`,
                fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 500,
                cursor: canRemove ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}>
              <div className="bg-surface-tertiary text-content-muted" style={{
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 700,
                overflow: 'hidden', flexShrink: 0,
              }}>
                {(member.avatar_url || member.avatar) ? <img src={member.avatar_url || avatarSrc(member.avatar)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ textDecoration: isHovered && canRemove ? 'line-through' : 'none' }}>{member.username}</span>
            </div>
          )
        })}

        {/* Add button */}
        {availableToAdd.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAdd(!showAdd)} className="text-content-faint" style={{
              width: 22, height: 22, borderRadius: '50%', border: '1.5px dashed var(--border-primary)',
              background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', transition: 'all 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-faint)' }}
            >+</button>

            {showAdd && (
              <div className="bg-surface-card" style={{
                position: 'absolute', top: 26, left: 0, zIndex: 100,
                border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 140,
              }}>
                {availableToAdd.map(member => (
                  <button key={member.id} onClick={() => handleAdd(member.id)} className="text-content" style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px',
                    borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div className="bg-surface-tertiary text-content-muted" style={{
                      width: 18, height: 18, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 700,
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {(member.avatar_url || member.avatar) ? <img src={member.avatar_url || avatarSrc(member.avatar)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.username?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.username}</span>
                    {member.is_guest && <GuestBadge size="xs" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


function PlaceInspectorHeader({ openNow, place, category, t, editingName, nameInputRef, nameValue, setNameValue,
  commitNameEdit, handleNameKeyDown, startNameEdit, onUpdatePlace, locale, timeFormat, onClose }: any) {
  return (
        <div style={{ display: 'flex', alignItems: 'center', gap: openNow !== null ? 26 : 14, padding: openNow !== null ? '18px 16px 14px 28px' : '18px 16px 14px', borderBottom: '1px solid var(--border-faint)', flexShrink: 0 }}>
          {/* Avatar with open/closed ring + tag */}
          <div style={{ position: 'relative', flexShrink: 0, marginBottom: openNow !== null ? 8 : 0 }}>
            <div style={{
              borderRadius: '50%', padding: 2.5,
              background: openNow === true ? '#22c55e' : openNow === false ? '#ef4444' : 'transparent',
            }}>
              <PlaceAvatar place={place} category={category} size={52} />
            </div>
            {openNow !== null && (
              <span style={{
                position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
                fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 500, letterSpacing: '0.02em',
                color: 'white',
                background: openNow ? '#16a34a' : '#dc2626',
                padding: '1.5px 7px', borderRadius: 99,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}>
                {openNow ? t('inspector.opened') : t('inspector.closed')}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onBlur={commitNameEdit}
                  onKeyDown={handleNameKeyDown}
                  className="text-content bg-surface-secondary"
                  style={{ fontWeight: 600, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', lineHeight: '1.3', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '1px 6px', fontFamily: 'inherit', outline: 'none', width: '100%' }}
                />
              ) : (
                <span
                  onDoubleClick={startNameEdit}
                  className="text-content"
                  style={{ fontWeight: 600, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', lineHeight: '1.3', cursor: onUpdatePlace ? 'text' : 'default' }}
                >{place.name}</span>
              )}
              {category && (() => {
                const CatIcon = getCategoryIcon(category.icon)
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
                    color: category.color || '#6b7280',
                    background: category.color ? `${category.color}18` : 'rgba(0,0,0,0.06)',
                    border: `1px solid ${category.color ? `${category.color}30` : 'transparent'}`,
                    padding: '2px 8px', borderRadius: 99,
                  }}>
                    <CatIcon size={10} />
                    <span className="hidden sm:inline">{category.name}</span>
                  </span>
                )
              })()}
            </div>
            {place.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 6 }}>
                <MapPin size={11} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{place.address}</span>
              </div>
            )}
            {place.place_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Clock size={10} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                <span className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{formatTime(place.place_time, locale, timeFormat)}{place.end_time ? ` – ${formatTime(place.end_time, locale, timeFormat)}` : ''}</span>
              </div>
            )}
            {place.lat && place.lng && (
              <div className="hidden sm:block text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {Number(place.lat).toFixed(6)}, {Number(place.lng).toFixed(6)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-surface-hover"
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          >
            <X size={14} strokeWidth={2} color="var(--text-secondary)" />
          </button>
        </div>
  )
}

function PlaceReservationParticipants({ selectedAssignmentId, reservations, assignments, selectedDayId,
  tripMembers, locale, timeFormat, t, onSetParticipants }: any) {
  return (
    <>
          {(() => {
            const res = selectedAssignmentId ? reservations.find(r => r.assignment_id === selectedAssignmentId) : null
            const assignment = selectedAssignmentId ? (assignments[String(selectedDayId)] || []).find(a => a.id === selectedAssignmentId) : null
            const currentParticipants = assignment?.participants || []
            const participantIds = currentParticipants.map(p => p.user_id)
            const allJoined = currentParticipants.length === 0
            const showParticipants = selectedAssignmentId && tripMembers.length > 1
            if (!res && !showParticipants) return null
            return (
              <div className={`grid ${res && showParticipants ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
                {/* Reservation */}
                {res && (() => {
                  const confirmed = res.status === 'confirmed'
                  return (
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${confirmed ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}` }}>
                      <div className={confirmed ? 'bg-[rgba(22,163,74,0.08)]' : 'bg-[rgba(217,119,6,0.08)]'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
                        <div className={confirmed ? 'bg-[#16a34a]' : 'bg-[#d97706]'} style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0 }} />
                        <span className={confirmed ? 'text-[#16a34a]' : 'text-[#d97706]'} style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700 }}>{confirmed ? t('reservations.confirmed') : t('reservations.pending')}</span>
                        <span style={{ flex: 1 }} />
                        <span className="text-content" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</span>
                      </div>
                      <div style={{ padding: '6px 10px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {(() => {
                          const { date, time: startTime } = splitReservationDateTime(res.reservation_time)
                          const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
                          return (
                            <>
                              {date && (
                                <div>
                                  <div className="text-content-faint" style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase' }}>{t('reservations.date')}</div>
                                  <div className="text-content" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 500, marginTop: 1 }}>{new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
                                </div>
                              )}
                              {(startTime || endTime) && (
                                <div>
                                  <div className="text-content-faint" style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase' }}>{t('reservations.time')}</div>
                                  <div className="text-content" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 500, marginTop: 1 }}>
                                    {startTime ? formatTime(startTime, locale, timeFormat) : ''}
                                    {endTime ? ` – ${formatTime(endTime, locale, timeFormat)}` : ''}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()}
                        {res.confirmation_number && (
                          <div>
                            <div className="text-content-faint" style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase' }}>{t('reservations.confirmationCode')}</div>
                            <div className="text-content" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 500, marginTop: 1 }}>{res.confirmation_number}</div>
                          </div>
                        )}
                      </div>
                      {res.notes && <div className="collab-note-md text-content-faint" style={{ padding: '0 10px 6px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'anywhere' }}><Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{res.notes}</Markdown></div>}
                      {(() => {
                        const meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {})
                        if (!meta || Object.keys(meta).length === 0) return null
                        const parts: string[] = []
                        if (meta.airline && meta.flight_number) parts.push(`${meta.airline} ${meta.flight_number}`)
                        else if (meta.flight_number) parts.push(meta.flight_number)
                        if (meta.departure_airport && meta.arrival_airport) parts.push(`${meta.departure_airport} → ${meta.arrival_airport}`)
                        if (meta.train_number) parts.push(meta.train_number)
                        if (meta.platform) parts.push(`Gl. ${meta.platform}`)
                        if (meta.check_in_time) parts.push(`Check-in ${meta.check_in_time}`)
                        if (meta.check_out_time) parts.push(`Check-out ${meta.check_out_time}`)
                        if (parts.length === 0) return null
                        return <div className="text-content-muted" style={{ padding: '0 10px 6px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 500 }}>{parts.join(' · ')}</div>
                      })()}
                    </div>
                  )
                })()}

                {/* Participants */}
                {showParticipants && (
                  <ParticipantsBox
                    tripMembers={tripMembers}
                    participantIds={participantIds}
                    allJoined={allJoined}
                    onSetParticipants={onSetParticipants}
                    selectedAssignmentId={selectedAssignmentId}
                    selectedDayId={selectedDayId}
                    t={t}
                  />
                )}
              </div>
            )
          })()}
    </>
  )
}

function PlaceExtras({ openingHours, weekdayIndex, hoursExpanded, setHoursExpanded, timeFormat, t, place,
  placeFiles, onFileUpload, filesExpanded, setFilesExpanded, fileInputRef, handleFileUpload, isUploading, distanceUnit }: any) {
  return (
          <div className={`grid grid-cols-1 ${openingHours?.length > 0 ? 'sm:grid-cols-2' : ''} gap-2`}>
          {openingHours && openingHours.length > 0 && (
            <div className="bg-surface-hover" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <button
                onClick={() => setHoursExpanded(h => !h)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#9ca3af" />
                  <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
                    {hoursExpanded ? t('inspector.openingHours') : (convertHoursLine(openingHours[weekdayIndex] || '', timeFormat) || t('inspector.showHours'))}
                  </span>
                </div>
                {hoursExpanded ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
              </button>
              {hoursExpanded && (
                <div style={{ padding: '0 12px 10px' }}>
                  {openingHours.map((line, i) => (
                    <div key={i} className={i === weekdayIndex ? 'text-content' : 'text-content-muted'} style={{
                      fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                      fontWeight: i === weekdayIndex ? 600 : 400,
                      padding: '2px 0',
                    }}>{convertHoursLine(line, timeFormat)}</div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* GPX Track stats */}
          {place.route_geometry && (() => {
            try {
              const pts: number[][] = JSON.parse(place.route_geometry)
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
              const distKm = totalDist / 1000

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

              // Elevation profile SVG
              const chartW = 280, chartH = 60
              const elevations = hasEle ? pts.map(p => p[2]) : []
              let pathD = ''
              if (elevations.length > 1) {
                const step = Math.max(1, Math.floor(elevations.length / chartW))
                const sampled = elevations.filter((_, i) => i % step === 0)
                const eMin = Math.min(...sampled), eMax = Math.max(...sampled)
                const range = eMax - eMin || 1
                pathD = sampled.map((e, i) => {
                  const x = (i / (sampled.length - 1)) * chartW
                  const y = chartH - ((e - eMin) / range) * (chartH - 4) - 2
                  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
                }).join(' ')
              }

              return (
                <div className="bg-surface-hover" style={{ borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={13} color="#9ca3af" />
                    <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{t('inspector.trackStats')}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <div className="text-content" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
                      <MapPin size={12} color="#3b82f6" />
                      {formatDistance(distKm, distanceUnit)}
                    </div>
                    {hasEle && (
                      <>
                        <div className="text-content" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
                          <Mountain size={12} color="#22c55e" />
                          {formatElevation(maxEle, distanceUnit)}
                        </div>
                        <div className="text-content" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
                          <Mountain size={12} color="#ef4444" />
                          {formatElevation(minEle, distanceUnit)}
                        </div>
                        <div className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                          ↑{formatElevation(totalUp, distanceUnit)} &nbsp;↓{formatElevation(totalDown, distanceUnit)}
                        </div>
                      </>
                    )}
                  </div>
                  {pathD && (
                    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="bg-surface-tertiary" style={{ display: 'block', borderRadius: 6 }}>
                      <defs>
                        <linearGradient id={`ele-grad-${place.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d={`${pathD} L${chartW},${chartH} L0,${chartH} Z`} fill={`url(#ele-grad-${place.id})`} />
                      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                </div>
              )
            } catch { return null }
          })()}

          {/* Files section */}
          {(placeFiles.length > 0 || onFileUpload) && (
            <div className="bg-surface-hover" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 6 }}>
                <button
                  onClick={() => setFilesExpanded(f => !f)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <FileText size={13} color="#9ca3af" />
                  <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
                    {placeFiles.length > 0 ? t('inspector.filesCount', { count: placeFiles.length }) : t('inspector.files')}
                  </span>
                  {filesExpanded ? <ChevronUp size={12} color="#9ca3af" /> : <ChevronDown size={12} color="#9ca3af" />}
                </button>
                {onFileUpload && (
                  <label className="text-content-muted bg-surface-tertiary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', padding: '2px 6px', borderRadius: 6 }}>
                    <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                    {isUploading ? (
                      <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>…</span>
                    ) : (
                      <><Upload size={11} strokeWidth={2} /> {t('common.upload')}</>
                    )}
                  </label>
                )}
              </div>
              {filesExpanded && placeFiles.length > 0 && (
                <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {placeFiles.map(f => (
                    <button key={f.id} onClick={() => openFile(f.url).catch(() => {})} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
                      {(f.mime_type || '').startsWith('image/') ? <FileImage size={12} color="#6b7280" /> : <File size={12} color="#6b7280" />}
                      <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                      {f.file_size && <span className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', flexShrink: 0 }}>{formatFileSize(f.file_size)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
  )
}
