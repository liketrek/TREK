import { useEffect, useId, useMemo, useState, useRef, type SyntheticEvent } from 'react'
import { localIsoDate } from '../../utils/localDate'
import { Briefcase, X, Plus, Image, Minus, Check, MapPin, Locate, Camera, Play, Loader2, NotebookPen } from 'lucide-react'
import { normalizeImageFiles } from '../../utils/convertHeic'
import { isVideoFile } from '../../utils/videoPoster'
import { type ResilientResult, type UploadProgress } from '../../utils/uploadQueue'
import { useTranslation } from '../../i18n'
import { journeyApi, mapsApi, addonsApi, memoriesApi, weatherApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { getCurrentPositionOnce } from '../../hooks/useGeolocation'
import { getApiErrorMessage } from '../../types'
import type { JourneyEntry, JourneyPhoto, GalleryPhoto, JourneyTrip } from '../../store/journeyStore'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'
import { photoUrl, posterlessVideo, isValidGeoPoint, geoOnceErrorKey } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import MarkdownToolbar from './MarkdownToolbar'
import { DatePicker } from './JourneyDetailPageDatePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { ProviderPicker, type ProviderPhotoGroup } from './JourneyDetailPageProviderPicker'
import { journeyWeatherCategory } from '../../mobile/screens/journey/mobileJourneyMeta'
import ConfirmDialog from '../shared/ConfirmDialog'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, INPUT } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import { useJourneyTripSuggestion } from './useJourneyTripSuggestion'
import { useEntryPhotoOrder } from './useEntryPhotoOrder'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'

type PendingProviderGroup = ProviderPhotoGroup & { provider: string }

/** A chip of the mood and weather rows, as in the collection dialogs' category row. */
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition-colors'
const CHIP_OFF = 'border-edge-faint bg-surface-card text-content-muted hover:text-content'
/** The buttons that bring photos in: dashed while shut, framed solid while their panel is open. */
const SOURCE = 'flex items-center justify-center gap-1.5 rounded-[12px] border py-4 font-medium disabled:cursor-default disabled:opacity-50'
const SOURCE_OFF = 'border-dashed border-edge text-content-muted hover:border-content-faint hover:bg-surface-secondary hover:text-content'
const SOURCE_ON = 'border-content bg-surface-secondary text-content'
/** The panel a photo source opens under the buttons: the gallery grid, the provider browser. */
const PHOTO_PANEL = 'mt-2 rounded-[12px] border border-edge-faint bg-surface-secondary'
/** A control laid over a photo tile, raised on the card colour so it reads on any picture. */
const ON_PHOTO = 'bg-surface-card text-content shadow-sm'
const PHOTO_REMOVE = `absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${ON_PHOTO}`
/** What hangs under the location field: the search results, or the note that a search is running. */
const DROPDOWN = 'absolute left-0 right-0 top-full z-[100] mt-1 rounded-[12px] border border-edge-faint bg-surface-card shadow-dropdown'

const VERDICT_TONES = {
  pros: { Icon: Check, text: 'text-success', soft: 'bg-success-soft', dot: 'bg-success' },
  cons: { Icon: Minus, text: 'text-danger', soft: 'bg-danger-soft', dot: 'bg-danger' },
} as const

// A photo whose thumbnail is missing can still be drawn from its original. A
// clip's original is the video file, which no <img> can show, so a clip gets
// no fallback (#2341).
function thumbnailFallback(p: { photo_id: number; media_type?: string | null }) {
  if (p.media_type === 'video') return undefined
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (!img.src.includes('/original')) img.src = photoUrl(p, 'original')
  }
}

// No poster to show and falling back to /original would hand an <img> the clip
// itself, so this tile stays a play badge.
function ClipTile() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-tertiary text-content-muted">
      <Play size={18} className="ml-0.5" fill="currentColor" />
    </div>
  )
}

/**
 * One side of the verdict: a row per item and the button that adds one at the
 * end. Enter in a row opens the next one below it (see `addVerdictRow`).
 */
function VerdictColumn({ list, label, placeholder, removeLabel, addLabel, items, rowRef, onChange, onAddRow, onRemove }: {
  list: 'pros' | 'cons'
  label: string
  placeholder: string
  removeLabel: string
  addLabel: string
  items: string[]
  rowRef: (key: string) => (el: HTMLInputElement | null) => void
  onChange: (index: number, value: string) => void
  onAddRow: (index: number) => void
  onRemove: (index: number) => void
}) {
  const tone = VERDICT_TONES[list]
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-[7px]">
        <span className={`grid h-4 w-4 place-items-center rounded-full ${tone.soft}`}>
          <tone.Icon size={9} strokeWidth={3.5} className={tone.text} />
        </span>
        <span className={`font-semibold ${tone.text}`} style={fs(12, 'body')}>{label}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((value, i) => (
          <div key={i} className="flex h-9 items-center gap-2 rounded-[10px] border border-edge bg-surface-input px-3">
            <span className={`h-[5px] w-[5px] flex-none rounded-full ${tone.dot}`} />
            <input
              ref={rowRef(`${list}-${i}`)}
              value={value}
              onChange={e => onChange(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddRow(i) } }}
              placeholder={placeholder}
              className="min-w-0 flex-1 border-none bg-transparent text-content outline-none placeholder:text-content-faint dark:bg-transparent"
              style={fs(13, 'body')}
            />
            {items.length > 1 && (
              <Tooltip label={removeLabel}>
                <button type="button" onClick={() => onRemove(i)} aria-label={removeLabel}
                  className="flex-none rounded-[6px] p-1 text-content-faint hover:text-danger">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </Tooltip>
            )}
          </div>
        ))}
        <AddRowButton onClick={() => onAddRow(items.length - 1)}>{addLabel}</AddRowButton>
      </div>
    </div>
  )
}

export function EntryEditor({ entry, journeyId, tripDates, galleryPhotos, trips, userId = 0, showVerdict = true, showMood = true, showWeather = true, onClose, onSave, onUploadPhotos, onAddProviderPhotos, onDone }: {
  entry: JourneyEntry
  journeyId: number
  tripDates: Set<string>
  galleryPhotos: GalleryPhoto[]
  trips: JourneyTrip[]
  userId?: number
  /**
   * The optional fields this journey still keeps (discussion #2299).
   *
   * A field switched off disappears from the form but keeps whatever an entry
   * already holds: the value is not cleared, and switching it back on brings it
   * into view again. Nobody loses a verdict they wrote by tidying a form.
   */
  showVerdict?: boolean
  showMood?: boolean
  showWeather?: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>, existingEntryId?: number) => Promise<number>
  onUploadPhotos: (entryId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => Promise<ResilientResult<JourneyPhoto>>
  onAddProviderPhotos?: (entryId: number, group: PendingProviderGroup) => Promise<void>
  onDone: () => void
}) {
  const { t, language } = useTranslation()
  const placeLang = usePlaceLanguage()
  const toast = useToast()
  const [title, setTitle] = useState(entry.title || '')
  const [story, setStory] = useState(entry.story || '')
  const [entryDate, setEntryDate] = useState(entry.entry_date || localIsoDate())
  const [entryTime, setEntryTime] = useState(entry.entry_time?.slice(0, 5) || '')
  const [locationName, setLocationName] = useState(entry.location_name || '')
  const [locationLat, setLocationLat] = useState<number | null>(entry.location_lat ?? null)
  const [locationLng, setLocationLng] = useState<number | null>(entry.location_lng ?? null)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<{ name: string; address?: string; lat: number; lng: number }[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [locating, setLocating] = useState(false)
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mood, setMood] = useState(entry.mood || '')
  const [weather, setWeather] = useState(entry.weather || '')
  const [statsExcluded, setStatsExcluded] = useState(entry.stats_excluded ?? false)
  // The trip this day belongs to, when the journey does not follow it yet (#2265).
  const tripSuggestion = useJourneyTripSuggestion(journeyId, trips.map(tr => tr.trip_id), entryDate, true)
  const [isDraft, setIsDraft] = useState(entry.is_draft ?? false)
  const [pros, setPros] = useState<string[]>(entry.pros_cons?.pros?.length ? entry.pros_cons.pros : [''])
  const [cons, setCons] = useState<string[]>(entry.pros_cons?.cons?.length ? entry.pros_cons.cons : [''])
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [photos, setPhotos] = useState<(JourneyPhoto | GalleryPhoto)[]>(entry.photos || [])
  // Drag a photo onto another's place, or send it to the front (#824).
  const photoOrder = useEntryPhotoOrder(entry.id, photos, setPhotos)
  const canReorder = entry.id > 0 && photos.length > 1
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  // Minting the preview URL inline in the JSX would hand out a fresh blob on
  // every keystroke in the story field and never give one back.
  const pendingUrls = useMemo(() => pendingFiles.map(f => URL.createObjectURL(f)), [pendingFiles])
  useEffect(() => () => { pendingUrls.forEach(u => URL.revokeObjectURL(u)) }, [pendingUrls])
  const [pendingLinkIds, setPendingLinkIds] = useState<number[]>([])
  const [showGalleryPick, setShowGalleryPick] = useState(false)
  const [photoTab, setPhotoTab] = useState<'upload' | 'gallery' | 'external'>('upload')
  const [availableProviders, setAvailableProviders] = useState<{ id: string; name: string }[]>([])
  const [providersLoading, setProvidersLoading] = useState(false)
  const [externalProvider, setExternalProvider] = useState<string | null>(null)
  const [pendingProviderGroups, setPendingProviderGroups] = useState<PendingProviderGroup[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  // Own input: putting `capture` on the picker above would take the photo library
  // away on a phone, which is the more common way in. This one only ever opens the
  // camera, so tablets and laptops get the same route the phone sheet already has.
  const cameraRef = useRef<HTMLInputElement>(null)
  const storyRef = useRef<HTMLTextAreaElement>(null)
  // Which verdict row to put the caret in after the next render. Enter adds a row
  // and the caret has to follow it, or the key does half a job.
  const verdictFocusRef = useRef<string | null>(null)
  const persistedEntryIdRef = useRef<number | null>(entry.id > 0 ? entry.id : null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const labelId = useId()

  // Track which fields differ from the entry we started editing so we can
  // warn before discarding on close/cancel.
  const originalPros = (entry.pros_cons?.pros ?? []).join('\n')
  const originalCons = (entry.pros_cons?.cons ?? []).join('\n')
  const isDirty = (
    title !== (entry.title || '') ||
    story !== (entry.story || '') ||
    entryDate !== (entry.entry_date || localIsoDate()) ||
    entryTime !== (entry.entry_time?.slice(0, 5) || '') ||
    locationName !== (entry.location_name || '') ||
    (locationLat ?? null) !== (entry.location_lat ?? null) ||
    (locationLng ?? null) !== (entry.location_lng ?? null) ||
    mood !== (entry.mood || '') ||
    weather !== (entry.weather || '') ||
    statsExcluded !== (entry.stats_excluded ?? false) ||
    isDraft !== (entry.is_draft ?? false) ||
    pros.filter(p => p.trim()).join('\n') !== originalPros ||
    cons.filter(c => c.trim()).join('\n') !== originalCons ||
    pendingFiles.length > 0 ||
    pendingLinkIds.length > 0 ||
    pendingProviderGroups.length > 0
  )

  const availableGalleryPhotos = galleryPhotos.filter(gp => !photos.some(p => p.id === gp.id))

  useEffect(() => {
    if (photoTab !== 'external' || availableProviders.length > 0 || providersLoading) return
    setProvidersLoading(true)
    // The discovery is not tied to the open tab, so the result is applied even if
    // the user left the tab meanwhile — dropping it would leave providersLoading
    // stuck and block every later run of this effect.
    ;void (async () => {
      try {
        const addonsData = await addonsApi.enabled()
        const enabled = (addonsData.addons || []).filter((a: any) => a.type === 'photo_provider' && a.enabled)
        const connected: { id: string; name: string }[] = []
        for (const provider of enabled) {
          try {
            if ((await memoriesApi.status(provider.id)).connected) connected.push({ id: provider.id, name: provider.name })
          } catch {}
        }
        setAvailableProviders(connected)
        if (connected.length > 0) setExternalProvider(current => current || connected[0].id)
      } catch {}
      setProvidersLoading(false)
    })()
  }, [photoTab, availableProviders.length])

  const activeExternalProvider = externalProvider || availableProviders[0]?.id || null
  const providerExistingAssetIds = new Set<string>()
  if (activeExternalProvider) {
    photos.forEach(photo => {
      if (photo.provider === activeExternalProvider && photo.asset_id) providerExistingAssetIds.add(photo.asset_id)
    })
    pendingProviderGroups.forEach(group => {
      if (group.provider === activeExternalProvider) group.assetIds.forEach(assetId => providerExistingAssetIds.add(assetId))
    })
  }

  /**
   * Fill the weather in from the forecast once the entry knows where and when.
   *
   * The phone's quick capture has done this since it was built; typing an entry
   * up at a desk was the one place you still picked the icon by hand (discussion
   * #2299). The date decides the source on the server: today comes from the
   * forecast, a backdated day from the ERA5 archive, so writing up last Tuesday
   * gets last Tuesday's weather rather than this afternoon's.
   *
   * Only ever fills an empty field, and each place-and-day is tried once, so a
   * cleared icon stays cleared and a chosen one is never overwritten.
   */
  const weatherTriedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!showWeather) return
    if (typeof locationLat !== 'number' || typeof locationLng !== 'number') return
    if (weather) return
    const key = `${locationLat.toFixed(3)},${locationLng.toFixed(3)},${entryDate}`
    if (weatherTriedRef.current === key) return
    weatherTriedRef.current = key

    let active = true
    weatherApi.get(locationLat, locationLng, entryDate, language)
      .then(result => {
        // An error-shaped answer carries no `main`, and the dev-only schema check
        // does not stop it reaching here in production.
        if (!active || !result || result.error || typeof result.main !== 'string') return
        const category = journeyWeatherCategory(result.main, result.description ?? '')
        // Re-checked rather than trusted from the closure: the request is a
        // round trip and the traveller may have picked an icon while it was out.
        setWeather(current => current || category)
      })
      .catch(() => { /* no weather is a fine outcome for a journal entry */ })
    return () => { active = false }
  }, [showWeather, locationLat, locationLng, entryDate, weather, language])

  /**
   * Enter in a pro or con opens the next one, the way every list of short things
   * behaves. Reaching for the plus button between every item was the complaint
   * (discussion #2299); the button stays for the mouse.
   *
   * The new row goes directly below the one you are in rather than at the end, so
   * a thought inserted in the middle lands where you meant it.
   */
  const addVerdictRow = (list: 'pros' | 'cons', index: number) => {
    const [values, setValues] = list === 'pros' ? [pros, setPros] as const : [cons, setCons] as const
    const next = [...values]
    next.splice(index + 1, 0, '')
    setValues(next)
    verdictFocusRef.current = `${list}-${index + 1}`
  }

  /** Give the caret to the row `addVerdictRow` just made, once React has drawn it. */
  const verdictRowRef = (key: string) => (el: HTMLInputElement | null) => {
    if (el && verdictFocusRef.current === key) {
      verdictFocusRef.current = null
      el.focus()
    }
  }

  // Every way out (Cancel, the close button, Escape, the dimmed backdrop) comes
  // through here, so none of them drops an edit without asking first.
  const handleClose = () => {
    if (isDirty) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entryId = await onSave({
        title: title || null,
        story: story || null,
        entry_date: entryDate,
        entry_time: entryTime || null,
        location_name: locationName || null,
        location_lat: locationLat,
        location_lng: locationLng,
        stats_excluded: offersStatsToggle ? statsExcluded : undefined,
        is_draft: isDraft,
        mood: mood || null,
        weather: weather || null,
        pros_cons: { pros: pros.filter(p => p.trim()), cons: cons.filter(c => c.trim()) },
        // An explicit Save is the user saying this suggestion is now their entry —
        // it does not need a story to earn that (#2008).
        type: entry.type === 'skeleton' ? 'entry' : undefined,
      }, persistedEntryIdRef.current ?? undefined)
      if (entryId > 0) persistedEntryIdRef.current = entryId
      // upload queued files after entry is created
      if (pendingFiles.length > 0 && entryId) {
        const filesToUpload = pendingFiles
        setUploadProgress({ done: 0, total: filesToUpload.length })
        try {
          const { failed } = await onUploadPhotos(entryId, filesToUpload, {
            onProgress: p => setUploadProgress({ done: p.done, total: p.total }),
          })
          setPendingFiles(failed)
          if (failed.length > 0) {
            toast.error(t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(filesToUpload.length) }))
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, t('journey.editor.uploadFailed')))
        } finally {
          setUploadProgress(null)
        }
      }
      // link gallery photos that were picked before save
      if (pendingLinkIds.length > 0 && entryId) {
        for (const photoId of pendingLinkIds) {
          try { await journeyApi.linkPhoto(entryId, photoId) } catch {}
        }
      }
      if (pendingProviderGroups.length > 0 && entryId && onAddProviderPhotos) {
        const failed: PendingProviderGroup[] = []
        for (const group of pendingProviderGroups) {
          try { await onAddProviderPhotos(entryId, group) } catch { failed.push(group) }
        }
        if (failed.length > 0) {
          setPendingProviderGroups(failed)
          toast.error(t('journey.editor.externalPhotosPartialFailed', { failed: String(failed.length), total: String(pendingProviderGroups.length) }))
          return
        }
        setPendingProviderGroups([])
      }
      onDone()
    } catch (err) {
      // Neither the page callback nor journeyStore toasts, so without this the
      // whole entry just fails to save with no sign of it.
      toast.error(getApiErrorMessage(err, t('journey.settings.saveFailed')))
      return
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    // Queue files locally until Save so cancel/close actually discards. This
    // keeps photo behavior consistent with text fields — no silent persistence.
    const normalized = await normalizeImageFiles(files)
    setPendingFiles(prev => [...prev, ...normalized])
  }

  const contextLocation = isValidGeoPoint({ lat: locationLat ?? Number.NaN, lng: locationLng ?? Number.NaN })
    ? { lat: locationLat!, lng: locationLng!, name: locationName || undefined }
    : null

  // The route switch belongs to an entry that is a stop, or was one: an entry
  // without a point was never on the route, and a new one is not on it yet.
  const offersStatsToggle = entry.id > 0 && (contextLocation != null || !!entry.stats_excluded)

  const handleUseCurrentLocation = async () => {
    if (locating) return
    setLocating(true)
    try {
      const pos = await getCurrentPositionOnce()
      // Fill coordinates right away; the name is refined below once the
      // reverse geocode comes back.
      const fallbackName = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current)
      setLocationSearching(false)
      setLocationLat(pos.lat)
      setLocationLng(pos.lng)
      setLocationName(fallbackName)
      setLocationQuery('')
      setLocationResults([])
      setShowLocationResults(false)
      try {
        const data = await mapsApi.reverse(pos.lat, pos.lng, placeLang)
        const name = data.name || data.address
        // Only replace the coordinate fallback — don't clobber a search
        // result the user may have picked while the reverse call was in flight.
        if (name) setLocationName(prev => (prev === fallbackName ? name : prev))
      } catch { /* best effort — keep the coordinate fallback */ }
    } catch (err) {
      toast.error(t(geoOnceErrorKey(err)))
    } finally {
      setLocating(false)
    }
  }

  const header = (
    <DialogHeader
      tile={<DialogTile><NotebookPen size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={handleClose}
      eyebrow={entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}
      titleInput={{
        value: title,
        onChange: setTitle,
        label: t('journey.editor.titlePlaceholder'),
        placeholder: t('journey.editor.titlePlaceholder'),
      }}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={handleClose}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={() => void handleSave()} disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <>
      {/* Pinned at the top: the photo panels, the verdict rows and the photo
          strip all change the body's height while an entry is being written. */}
      <DialogShell onClose={handleClose} labelledBy={labelId} width="wide" align="top" blocked={confirmDiscard} header={header} footer={footer}>
        <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} className="hidden" />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} className="hidden" />
              <div className="flex gap-2" style={fs(12, 'body')}>
                <button type="button"
                  onClick={() => { setPhotoTab('upload'); setShowGalleryPick(false); fileRef.current?.click() }}
                  disabled={saving}
                  className={`${SOURCE} ${SOURCE_OFF} flex-1`}
                >
                  {uploadProgress ? (
                    <><Loader2 size={13} className="animate-spin" /> {t('journey.editor.uploadingProgress', { done: String(uploadProgress.done), total: String(uploadProgress.total) })}</>
                  ) : (
                    <><Plus size={13} /> {t('journey.editor.uploadPhotos')}</>
                  )}
                </button>
                {galleryPhotos.length > 0 && (
                  <button type="button"
                    onClick={() => { setPhotoTab('gallery'); setShowGalleryPick(!showGalleryPick) }}
                    aria-pressed={showGalleryPick}
                    className={`${SOURCE} flex-1 ${showGalleryPick ? SOURCE_ON : SOURCE_OFF}`}
                  >
                    <Image size={13} /> {t('journey.editor.fromGallery')}
                  </button>
                )}
                {/* Only where a camera is plausibly attached to the thing you are typing
                    on. On a desktop it was a second button to the same file dialog with a
                    different icon (discussion #2299); the phone shell has its own sheet,
                    and this dialog is what a tablet gets. */}
                <Tooltip label={t('journey.photo.add')}>
                  <button type="button"
                    onClick={() => { setPhotoTab('upload'); setShowGalleryPick(false); cameraRef.current?.click() }}
                    disabled={saving}
                    aria-label={t('journey.photo.add')}
                    className={`${SOURCE} ${SOURCE_OFF} px-4 md:hidden`}
                  >
                    <Camera size={14} />
                  </button>
                </Tooltip>
                <button type="button"
                  onClick={() => { setPhotoTab('external'); setShowGalleryPick(false) }}
                  disabled={saving}
                  aria-pressed={photoTab === 'external'}
                  className={`${SOURCE} flex-1 ${photoTab === 'external' ? SOURCE_ON : SOURCE_OFF}`}
                >
                  <Image size={13} /> {t('journey.editor.externalPhotos') || 'External photos'}
                </button>
              </div>

              {/* The gallery picker, directly below the buttons. Safari collapses
                  `aspect-square` items inside an overflow-scroll grid, so the square
                  is enforced with a padding-top spacer and an absolutely positioned
                  image (works across all browsers). */}
              {showGalleryPick && (
                <div className={`${PHOTO_PANEL} p-3`}>
                  <div className="grid max-h-[160px] grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-6">
                    {availableGalleryPhotos.map(gp => (
                      <button
                        type="button"
                        key={gp.id}
                        aria-label={t('journey.editor.fromGallery')}
                        onClick={async () => {
                          if (entry.id > 0) {
                            try {
                              const linked = await journeyApi.linkPhoto(entry.id, gp.id)
                              if (linked) setPhotos(prev => [...prev, linked])
                            } catch {}
                          } else {
                            setPendingLinkIds(prev => [...prev, gp.id])
                            setPhotos(prev => [...prev, gp])
                          }
                        }}
                        className="relative block w-full cursor-pointer overflow-hidden rounded-[10px] border-0 bg-transparent p-0 transition-shadow hover:ring-2 hover:ring-accent"
                        style={{ paddingTop: '100%' }}
                      >
                        {posterlessVideo(gp) ? (
                          <ClipTile />
                        ) : (
                          <img src={photoUrl(gp)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={thumbnailFallback(gp)} />
                        )}
                      </button>
                    ))}
                    {availableGalleryPhotos.length === 0 && (
                      <div className="col-span-full py-3 text-center text-content-faint" style={fs(11)}>{t('journey.editor.allPhotosAdded')}</div>
                    )}
                  </div>
                </div>
              )}
              {photoTab === 'external' && (
                <div className={`${PHOTO_PANEL} flex flex-col overflow-hidden`} style={{ height: 'min(56vh, 520px)' }}>
                  <div className="flex items-center justify-between gap-2 border-b border-edge-faint px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-content" style={fs(11.5)}>
                        {t('journey.editor.externalPhotosFor', { date: new Date(entryDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) })}
                      </p>
                      <p className="truncate text-content-faint" style={fs(10.5)}>
                        {contextLocation?.name
                          ? `${t('journey.editor.externalPhotosNearby') || 'Nearby photos first'}: ${contextLocation.name}`
                          : (t('journey.editor.externalPhotosNoLocation') || 'All photos from this day')}
                      </p>
                    </div>
                    {pendingProviderGroups.length > 0 && (
                      <button type="button" onClick={() => setPendingProviderGroups([])} className="inline-flex items-center gap-1.5 whitespace-nowrap text-content-muted hover:text-content" style={fs(10.5)}>
                        <span>{pendingProviderGroups.reduce((sum, group) => sum + group.assetIds.length, 0)} {t('journey.editor.externalPhotosQueued') || 'queued'}</span>{' '}
                        <span className="font-semibold text-content">{t('common.clear') || 'Clear'}</span>
                      </button>
                    )}
                  </div>
                  {providersLoading ? (
                    <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-content-faint" /></div>
                  ) : availableProviders.length === 0 ? (
                    <div className="px-4 py-10 text-center text-content-muted" style={fs(12, 'body')}>{t('journey.editor.externalPhotosUnavailable') || 'No connected photo providers are available.'}</div>
                  ) : (
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex gap-1 overflow-x-auto border-b border-edge-faint px-3 py-2" style={fs(11.5)}>
                        {availableProviders.map(provider => (
                          <button type="button"
                            key={provider.id}
                            data-testid={`journey-external-provider-${provider.id}`}
                            onClick={() => setExternalProvider(provider.id)}
                            aria-pressed={externalProvider === provider.id}
                            className={`whitespace-nowrap rounded-[8px] px-2.5 py-1 font-medium ${externalProvider === provider.id ? 'bg-accent text-accent-text' : 'text-content-muted hover:bg-surface-hover hover:text-content'}`}
                          >
                            {provider.name}
                          </button>
                        ))}
                      </div>
                      {activeExternalProvider && (
                        <div className="min-h-0 flex-1">
                          <ProviderPicker
                            key={`${activeExternalProvider}-${entryDate}`}
                            provider={activeExternalProvider}
                            userId={userId}
                            entries={[entry]}
                            trips={trips}
                            existingAssetIds={providerExistingAssetIds}
                            initialDate={entryDate}
                            contextLocation={contextLocation}
                            initialEntryId={entry.id || null}
                            embedded
                            onClose={() => setExternalProvider(null)}
                            onAdd={async groups => {
                              setPendingProviderGroups(previous => {
                                const next = [...previous]
                                for (const group of groups) {
                                  const existing = next.find(item => item.provider === activeExternalProvider && item.passphrase === group.passphrase)
                                  if (existing) {
                                    const seen = new Set(existing.assetIds)
                                    group.assetIds.forEach((assetId, index) => {
                                      if (seen.has(assetId)) return
                                      seen.add(assetId)
                                      existing.assetIds.push(assetId)
                                      existing.mediaTypes?.push(group.mediaTypes?.[index] || 'image')
                                    })
                                  } else {
                                    next.push({ ...group, provider: activeExternalProvider })
                                  }
                                }
                                return next
                              })
                              setExternalProvider(null)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {(photos.length > 0 || pendingFiles.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, idx) => (
                    <div key={p.id}
                      {...(canReorder ? photoOrder.dragProps(idx) : {})}
                      className={`group relative h-20 w-20 overflow-hidden rounded-[12px] ${canReorder ? 'cursor-grab active:cursor-grabbing' : ''} ${idx === 0 && photos.length > 1 ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface-card' : ''} ${photoOrder.overIndex === idx && photoOrder.dragIndex !== idx ? 'outline outline-2 outline-offset-2 outline-[color:var(--accent)]' : ''}`}
                      style={photoOrder.dragIndex === idx ? { opacity: 0.4 } : undefined}>
                      {posterlessVideo(p) ? (
                        <ClipTile />
                      ) : (
                        <img src={photoUrl(p)} className="h-full w-full object-cover" alt="" onError={thumbnailFallback(p)} />
                      )}
                      {idx === 0 && photos.length > 1 && (
                        <span className={`absolute bottom-0.5 left-0.5 rounded px-1 py-px font-bold ${ON_PHOTO}`} style={fs(8)}>{t('journey.editor.photoFirst')}</span>
                      )}
                      {idx > 0 && photos.length > 1 && (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); photoOrder.makeFirst(idx) }}
                          className={`absolute bottom-0.5 left-0.5 rounded px-1.5 py-0.5 font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${ON_PHOTO}`}
                          style={fs(8)}
                        >
                          {t('journey.editor.makeFirst')}
                        </button>
                      )}
                      <Tooltip label={t('common.delete')}>
                        <button type="button"
                          onClick={async (e) => {
                            e.stopPropagation()
                            setPhotos(prev => prev.filter(x => x.id !== p.id))
                            if (entry.id > 0) {
                              // unlink from entry; gallery row is preserved
                              try { await journeyApi.unlinkPhoto(entry.id, p.id) } catch {}
                            } else {
                              setPendingLinkIds(prev => prev.filter(id => id !== p.id))
                            }
                          }}
                          aria-label={t('common.delete')}
                          className={PHOTO_REMOVE}
                        >
                          <X size={10} />
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                  {pendingFiles.map((f, i) => (
                    <div key={`pending-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-[12px]">
                      {/* A clip in an <img> is a broken-image glyph (issue #2341). The
                          same object URL in a <video> shows its first frame, which is
                          the preview the poster frame will become after saving. */}
                      {isVideoFile(f) ? (
                        <video src={pendingUrls[i]} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={pendingUrls[i]} className="h-full w-full object-cover" alt="" />
                      )}
                      <Tooltip label={t('common.delete')}>
                        <button type="button"
                          onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                          aria-label={t('common.delete')}
                          className={PHOTO_REMOVE}
                        >
                          <X size={10} />
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-[10px] border border-edge bg-surface-input focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]">
              <MarkdownToolbar textareaRef={storyRef} onUpdate={setStory} />
              <textarea
                ref={storyRef}
                value={story}
                onChange={e => setStory(e.target.value)}
                placeholder={t('journey.editor.writeStory')}
                rows={6}
                className="w-full flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-content outline-none placeholder:text-content-faint dark:bg-transparent"
                style={{ ...fs(14, 'body'), minHeight: 144 }}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {/* Pros & Cons: gone entirely when the journey does not keep a verdict */}
            {showVerdict && (
              <DialogSection label={t('journey.editor.prosCons')}>
                <div className="grid grid-cols-2 gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-3">
                  <VerdictColumn
                    list="pros"
                    label={t('journey.editor.pros')}
                    placeholder={t('journey.editor.proPlaceholder')}
                    removeLabel={t('common.delete')}
                    addLabel={t('journey.editor.addAnother')}
                    items={pros}
                    rowRef={verdictRowRef}
                    onChange={(i, value) => { const next = [...pros]; next[i] = value; setPros(next) }}
                    onAddRow={i => addVerdictRow('pros', i)}
                    onRemove={i => setPros(pros.filter((_, j) => j !== i))}
                  />
                  <VerdictColumn
                    list="cons"
                    label={t('journey.editor.cons')}
                    placeholder={t('journey.editor.conPlaceholder')}
                    removeLabel={t('common.delete')}
                    addLabel={t('journey.editor.addAnother')}
                    items={cons}
                    rowRef={verdictRowRef}
                    onChange={(i, value) => { const next = [...cons]; next[i] = value; setCons(next) }}
                    onAddRow={i => addVerdictRow('cons', i)}
                    onRemove={i => setCons(cons.filter((_, j) => j !== i))}
                  />
                </div>
              </DialogSection>
            )}

            {/* Time sat in state and went to the server, it just had no input here, so a
                draft's auto-stamped clock time showed up in the timeline, the map, the PDF
                and the public share, and the desktop had no way to correct it (#1614).
                The row is split in the date's favour: a long localized date ("12. Sept.
                2026") wrapped onto a second line while the time field sat half empty
                beside it. 112px holds the clock button plus "2:30 PM" in 12h, and no more. */}
            <div className="grid grid-cols-[minmax(0,1fr)_112px] items-start gap-3">
              <EditorField label={t('journey.editor.date')}>
                <DatePicker value={entryDate} onChange={setEntryDate} tripDates={tripDates} />
              </EditorField>
              <EditorField label={t('mobileJourney.time')}>
                {/* A native <input type="time"> paints 12h or 24h from the browser
                    locale, and no attribute overrides it, so it ignored the user's
                    setting outright (#2067). The rest of TREK has used this picker
                    for exactly that reason; the journey editor was never migrated. */}
                <CustomTimePicker value={entryTime} onChange={setEntryTime} />
              </EditorField>
            </div>

            {tripSuggestion.trip && (
              <div className="flex flex-col gap-2.5 rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-muted shadow-sm"><Briefcase size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-content [overflow-wrap:anywhere]" style={fs(12.5, 'body')}>{tripSuggestion.trip.title}</div>
                    <div className="mt-0.5 leading-snug text-content-muted" style={fs(11)}>{t('journey.editor.tripSuggestionHint')}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogButton onClick={tripSuggestion.dismiss}>{t('journey.editor.tripSuggestionLater')}</DialogButton>
                  <DialogButton variant="primary" onClick={() => void tripSuggestion.link()} disabled={tripSuggestion.linking}>{t('journey.trips.linkTrip')}</DialogButton>
                </div>
              </div>
            )}

            {/* The location is a free-text search, so it gets the whole width. */}
            <EditorField label={t('journey.editor.location')} htmlFor={`${labelId}-location`} className="relative">
              <div className="relative">
                <input
                  id={`${labelId}-location`}
                  value={locationQuery || locationName}
                  onChange={e => {
                    const q = e.target.value
                    setLocationQuery(q)
                    setShowLocationResults(true)
                    if (locationTimerRef.current) clearTimeout(locationTimerRef.current)
                    if (q.trim().length >= 2) {
                      locationTimerRef.current = setTimeout(async () => {
                        setLocationSearching(true)
                        try {
                          const res = await mapsApi.search(q, placeLang)
                          setLocationResults((res.places || []).slice(0, 6).map((p: any) => ({
                            name: p.name, address: p.address, lat: Number(p.lat), lng: Number(p.lng),
                          })))
                        } catch { setLocationResults([]) }
                        finally { setLocationSearching(false) }
                      }, 400)
                    } else {
                      setLocationResults([])
                    }
                  }}
                  onFocus={() => { if (locationResults.length > 0) setShowLocationResults(true) }}
                  placeholder={t('journey.editor.searchLocation')}
                  className={`${INPUT} pr-9`}
                />
                <Tooltip label={t('journey.editor.useCurrentLocation')}>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    aria-label={t('journey.editor.useCurrentLocation')}
                    className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-content-faint hover:bg-surface-hover hover:text-content disabled:cursor-default disabled:opacity-50"
                  >
                    {locating ? <Loader2 size={14} className="animate-spin" /> : <Locate size={14} />}
                  </button>
                </Tooltip>
              </div>
              {showLocationResults && locationResults.length > 0 && (
                <>
                  <div role="presentation" className="fixed inset-0 z-[99]" onClick={() => setShowLocationResults(false)} />
                  <div className={`${DROPDOWN} flex max-h-[240px] flex-col gap-0.5 overflow-y-auto p-1`}>
                    {locationResults.map((r, i) => (
                      <button type="button"
                        key={i}
                        onClick={() => {
                          setLocationName(r.name)
                          setLocationLat(r.lat)
                          setLocationLng(r.lng)
                          setLocationQuery('')
                          setShowLocationResults(false)
                          setLocationResults([])
                        }}
                        className="flex w-full items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-surface-hover"
                      >
                        <MapPin size={13} className="mt-0.5 flex-none text-content-faint" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-content" style={fs(13, 'body')}>{r.name}</div>
                          {r.address && <div className="truncate text-content-muted" style={fs(11)}>{r.address}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {locationSearching && (
                <div className={`${DROPDOWN} px-3 py-3 text-center text-content-faint`} style={fs(12, 'body')}>
                  {t('journey.editor.searching')}
                </div>
              )}
            </EditorField>

            {/* Every located entry is a stop on the route Studio prints, the home
                airport included. This is the entry's own way off it, the same
                switch the Studio travel panel offers (#2064). */}
            {offersStatsToggle && (
              <div className="flex items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-content" style={fs(12.5, 'body')}>{t('journey.editor.statsExcluded')}</div>
                  <div className="mt-0.5 leading-snug text-content-muted" style={fs(11)}>{t('journey.editor.statsExcludedHint')}</div>
                </div>
                <ToggleSwitch on={statsExcluded} onToggle={() => setStatsExcluded(v => !v)} label={t('journey.editor.statsExcluded')} />
              </div>
            )}

            {/* A draft stays among the contributors until it is ready (#696). */}
            <div className="flex items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-content" style={fs(12.5, 'body')}>{t('journey.editor.draft')}</div>
                <div className="mt-0.5 leading-snug text-content-muted" style={fs(11)}>{t('journey.editor.draftHint')}</div>
              </div>
              <ToggleSwitch on={isDraft} onToggle={() => setIsDraft(v => !v)} label={t('journey.editor.draft')} />
            </div>

            {/* The size sits on the rows rather than on each chip, so a chip at rest
                carries no inline style and only a picked mood wears its palette. */}
            {showMood && (
              <EditorField label={t('journey.editor.mood')}>
                <div role="group" aria-label={t('journey.editor.mood')} className="flex flex-wrap gap-1.5" style={fs(12, 'body')}>
                  {Object.entries(MOOD_CONFIG).map(([key, config]) => {
                    const Icon = config.icon
                    const active = mood === key
                    return (
                      <button type="button" key={key} onClick={() => setMood(active ? '' : key)} aria-pressed={active}
                        className={active ? CHIP : `${CHIP} ${CHIP_OFF}`}
                        style={active ? { background: config.bg, color: config.text, borderColor: config.text + '30' } : undefined}>
                        <Icon size={12} />
                        {t(config.label)}
                      </button>
                    )
                  })}
                </div>
              </EditorField>
            )}

            {showWeather && (
              <EditorField label={t('journey.editor.weather')}>
                <div role="group" aria-label={t('journey.editor.weather')} className="flex flex-wrap gap-1.5" style={fs(12, 'body')}>
                  {Object.entries(WEATHER_CONFIG).map(([key, config]) => {
                    const Icon = config.icon
                    const active = weather === key
                    return (
                      <button type="button" key={key} onClick={() => setWeather(active ? '' : key)} aria-pressed={active}
                        className={`${CHIP} ${active ? 'border-accent bg-accent text-accent-text' : CHIP_OFF}`}>
                        <Icon size={12} />
                        {t(config.label)}
                      </button>
                    )
                  })}
                </div>
              </EditorField>
            )}
          </div>
        </div>
      </DialogShell>

      {/* Mounted only while asked, over the editor, which ignores Escape and its
          backdrop until the question is answered. */}
      {confirmDiscard && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmDiscard(false)}
          onConfirm={onClose}
          title={t('common.discardChanges')}
          message={t('journey.editor.discardChangesConfirm')}
          confirmLabel={t('common.discard')}
        />
      )}
    </>
  )
}
