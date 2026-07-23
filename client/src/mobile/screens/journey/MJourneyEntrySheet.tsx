import { useEffect, useRef, useState } from 'react'
import { Camera, Plus, Image, X, MapPin, Trash2, CheckCircle2, MinusCircle } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { journeyApi, mapsApi, weatherApi } from '../../../api/client'
import { getApiErrorMessage } from '../../../types'
import { normalizeImageFiles } from '../../../utils/convertHeic'
import type { ResilientResult, UploadProgress } from '../../../utils/uploadQueue'
import type { JourneyEntry, JourneyPhoto, GalleryPhoto } from '../../../store/journeyStore'
import { photoUrl } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import JournalBody from '../../../components/Journey/JournalBody'
import { journeyWeatherCategory, MOBILE_MOODS, MOBILE_WEATHERS } from './mobileJourneyMeta'

const PRO_COLOR = '#2FA37A'
const CON_COLOR = '#D6273B'

interface LocationResult {
  name: string
  address?: string
  lat: number
  lng: number
}

interface MJourneyEntrySheetProps {
  entry: JourneyEntry
  galleryPhotos: GalleryPhoto[]
  quickCapture?: boolean
  readOnly?: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => Promise<number>
  onUploadPhotos: (entryId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => Promise<ResilientResult<JourneyPhoto>>
  onDelete?: () => void
  onDone: () => void
}

/**
 * shJEntry — the journey entry sheet: title, photos (upload / from gallery),
 * markdown story, pros & cons, date + time, location search, mood (4),
 * weather (6) and tags. Read-only for viewer contributors.
 */
export default function MJourneyEntrySheet({
  entry, galleryPhotos, quickCapture = false, readOnly = false, onClose, onSave, onUploadPhotos, onDelete, onDone,
}: MJourneyEntrySheetProps) {
  const { t } = useTranslation()
  const toast = useToast()

  const [title, setTitle] = useState(entry.title || '')
  const [story, setStory] = useState(entry.story || '')
  const [entryDate, setEntryDate] = useState(entry.entry_date || new Date().toISOString().split('T')[0])
  const [entryTime, setEntryTime] = useState(entry.entry_time?.slice(0, 5) || '')
  const [locationName, setLocationName] = useState(entry.location_name || '')
  const [locationLat, setLocationLat] = useState<number | null>(entry.location_lat ?? null)
  const [locationLng, setLocationLng] = useState<number | null>(entry.location_lng ?? null)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mood, setMood] = useState(entry.mood || '')
  const [weather, setWeather] = useState(entry.weather || '')
  const [pros, setPros] = useState<string[]>(entry.pros_cons?.pros ?? [])
  const [cons, setCons] = useState<string[]>(entry.pros_cons?.cons ?? [])
  const [tags, setTags] = useState<string[]>(entry.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [photos, setPhotos] = useState<(JourneyPhoto | GalleryPhoto)[]>(entry.photos || [])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingLinkIds, setPendingLinkIds] = useState<number[]>([])
  const [showGalleryPick, setShowGalleryPick] = useState(false)
  const [saving, setSaving] = useState(false)
  const [captureOnly, setCaptureOnly] = useState(quickCapture)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!quickCapture || readOnly || entry.location_lat != null || entry.location_lng != null) return
    if (!navigator.geolocation) {
      setLocationError(t('common.error'))
      return
    }

    let active = true
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async position => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      if (!active) return
      setLocationLat(lat)
      setLocationLng(lng)

      const [placeResult, weatherResult] = await Promise.allSettled([
        mapsApi.reverse(lat, lng),
        weatherApi.getCurrent(lat, lng, 'en'),
      ])
      if (!active) return
      if (placeResult.status === 'fulfilled') {
        setLocationName(placeResult.value.name || placeResult.value.address || '')
      }
      if (weatherResult.status === 'fulfilled' && !weatherResult.value.error) {
        setWeather(current => current || journeyWeatherCategory(weatherResult.value.main, weatherResult.value.description))
      }
      setLocating(false)
    }, error => {
      if (!active) return
      setLocationError(error.message || t('common.error'))
      setLocating(false)
    }, { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 })

    return () => { active = false }
  }, [quickCapture, readOnly, entry.location_lat, entry.location_lng, entry.entry_date, t])

  const isDirty =
    title !== (entry.title || '') ||
    story !== (entry.story || '') ||
    entryDate !== (entry.entry_date || new Date().toISOString().split('T')[0]) ||
    entryTime !== (entry.entry_time?.slice(0, 5) || '') ||
    locationName !== (entry.location_name || '') ||
    mood !== (entry.mood || '') ||
    weather !== (entry.weather || '') ||
    pros.filter(p => p.trim()).join('\n') !== (entry.pros_cons?.pros ?? []).join('\n') ||
    cons.filter(c => c.trim()).join('\n') !== (entry.pros_cons?.cons ?? []).join('\n') ||
    tags.join('\n') !== (entry.tags ?? []).join('\n') ||
    pendingFiles.length > 0 ||
    pendingLinkIds.length > 0

  const handleClose = () => {
    if (!captureOnly && !readOnly && isDirty && !window.confirm(t('journey.editor.discardChangesConfirm'))) return
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
        mood: mood || null,
        weather: weather || null,
        tags: tags.filter(tag => tag.trim()),
        pros_cons: { pros: pros.filter(p => p.trim()), cons: cons.filter(c => c.trim()) },
        type: entry.type === 'skeleton' && (story.trim() || pendingFiles.length > 0 || pendingLinkIds.length > 0)
          ? 'entry'
          : undefined,
      })
      if (pendingFiles.length > 0 && entryId) {
        const toUpload = pendingFiles
        setUploadProgress({ done: 0, total: toUpload.length })
        try {
          const { failed } = await onUploadPhotos(entryId, toUpload, {
            onProgress: p => setUploadProgress({ done: p.done, total: p.total }),
          })
          setPendingFiles(failed)
          if (failed.length > 0) {
            toast.error(t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(toUpload.length) }))
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, t('journey.editor.uploadFailed')))
        } finally {
          setUploadProgress(null)
        }
      }
      if (pendingLinkIds.length > 0 && entryId) {
        for (const photoId of pendingLinkIds) {
          try { await journeyApi.linkPhoto(entryId, photoId) } catch { /* linked photo stays in gallery */ }
        }
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const normalized = await normalizeImageFiles(files)
    setPendingFiles(prev => [...prev, ...normalized])
  }

  const searchLocation = (query: string) => {
    setLocationQuery(query)
    setShowLocationResults(true)
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current)
    if (query.trim().length < 2) {
      setLocationResults([])
      return
    }
    locationTimerRef.current = setTimeout(async () => {
      try {
        const res = await mapsApi.search(query)
        setLocationResults((res.places || []).slice(0, 6).map((p: { name: string; address?: string; lat: number | string; lng: number | string }) => ({
          name: p.name, address: p.address, lat: Number(p.lat), lng: Number(p.lng),
        })))
      } catch {
        setLocationResults([])
      }
    }, 400)
  }

  const addTag = () => {
    const value = tagInput.trim().replace(/,+$/, '')
    if (!value) return
    if (!tags.includes(value)) setTags(prev => [...prev, value])
    setTagInput('')
  }

  const availableGalleryPhotos = galleryPhotos.filter(gp => !photos.some(p => p.id === gp.id))

  const eyebrow = 'font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint'
  const fieldShell = 'rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'

  return (
    <MSheet
      open
      onClose={handleClose}
      variant="card"
      material="opaque"
      ariaLabel={entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}
    >
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
        <span className="flex-1 text-[1.0625rem] font-bold">
          {entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}
        </span>
        <MIconBtn variant="neutral" size={34} onClick={handleClose} ariaLabel={t('common.cancel')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3">
        {!captureOnly && (readOnly ? (
          <div className="pb-[10px] pt-1 text-[1.25rem] font-extrabold">{title || t('journey.editor.titlePlaceholder')}</div>
        ) : (
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('journey.editor.titlePlaceholder')}
            className="w-full bg-transparent pb-[10px] pt-1 text-[1.25rem] font-extrabold text-m-ink outline-none placeholder:text-m-faint"
          />
        ))}

        {!readOnly && (
          <>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} />
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (captureOnly ? cameraRef : fileRef).current?.click()}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-rowbr)] p-3 text-[0.75rem] font-semibold text-m-muted disabled:opacity-50"
              >
                {uploadProgress ? (
                  <>
                    <span className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-muted" />
                    {t('journey.editor.uploadingProgress', { done: String(uploadProgress.done), total: String(uploadProgress.total) })}
                  </>
                ) : (
                  <>
                    {captureOnly ? <Camera size={14} strokeWidth={2.2} /> : <Plus size={14} strokeWidth={2.2} />}
                    {captureOnly ? t('journey.photo.add') : t('journey.editor.uploadPhotos')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => captureOnly ? fileRef.current?.click() : setShowGalleryPick(v => !v)}
                disabled={!captureOnly && galleryPhotos.length === 0}
                className={`flex flex-1 items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] p-3 text-[0.75rem] font-semibold disabled:opacity-40 ${
                  !captureOnly && showGalleryPick
                    ? 'border-[color:var(--m-act)] text-m-ink'
                    : 'border-dashed border-[color:var(--m-rowbr)] text-m-muted'
                }`}
              >
                <Image size={14} strokeWidth={2} />
                {captureOnly ? t('journey.share.gallery') : t('journey.editor.fromGallery')}
              </button>
            </div>

            {!captureOnly && showGalleryPick && (
              <div className="mt-2 max-h-[160px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-2">
                <div className="grid grid-cols-5 gap-[6px]">
                  {availableGalleryPhotos.map(gp => (
                    <button
                      key={gp.id}
                      type="button"
                      className="relative w-full overflow-hidden rounded-lg"
                      style={{ paddingTop: '100%' }}
                      onClick={async () => {
                        if (entry.id > 0) {
                          try {
                            const linked = await journeyApi.linkPhoto(entry.id, gp.id)
                            if (linked) setPhotos(prev => [...prev, linked])
                          } catch { /* keep picker open on failure */ }
                        } else {
                          setPendingLinkIds(prev => [...prev, gp.id])
                          setPhotos(prev => [...prev, gp])
                        }
                      }}
                    >
                      <img src={photoUrl(gp)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </button>
                  ))}
                  {availableGalleryPhotos.length === 0 && (
                    <div className="col-span-full py-3 text-center font-geist text-[0.6875rem] text-m-faint">
                      {t('journey.editor.allPhotosAdded')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {(photos.length > 0 || pendingFiles.length > 0) && (
          <div className="mt-[10px] flex flex-wrap gap-2">
            {photos.map((p, idx) => (
              <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-[13px]">
                <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                {!readOnly && idx > 0 && photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotos(prev => {
                        const next = [...prev]
                        const [moved] = next.splice(idx, 1)
                        next.unshift(moved)
                        next.forEach((ph, i) => { journeyApi.updatePhoto(ph.id, { sort_order: i }).catch(() => {}) })
                        return next
                      })
                    }}
                    className="absolute bottom-[3px] left-[3px] rounded-full bg-black/60 px-[6px] py-[1px] font-geist text-[0.5rem] font-bold text-white"
                  >
                    {t('journey.editor.photoFirst')}
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={async () => {
                      setPhotos(prev => prev.filter(x => x.id !== p.id))
                      if (entry.id > 0) {
                        try { await journeyApi.unlinkPhoto(entry.id, p.id) } catch { /* refreshed on next load */ }
                      } else {
                        setPendingLinkIds(prev => prev.filter(id => id !== p.id))
                      }
                    }}
                    aria-label={t('common.delete')}
                    className="absolute right-[3px] top-[3px] flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <div key={`pending-${i}`} className="relative h-16 w-16 overflow-hidden rounded-[13px]">
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                  aria-label={t('common.delete')}
                  className="absolute right-[3px] top-[3px] flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!captureOnly && <>
          {readOnly ? (
            story && (
              <div className="mt-[10px] font-geist text-[0.8125rem] leading-[1.5] text-m-ink">
                <JournalBody text={story} />
              </div>
            )
          ) : (
            <textarea
              rows={3}
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder={t('journey.editor.writeStory')}
              className={`mt-[10px] w-full resize-none px-[14px] py-3 font-geist text-[0.8125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint ${fieldShell} rounded-[14px]`}
            />
          )}

          {/* Pros & Cons */}
          {(!readOnly || pros.length > 0 || cons.length > 0) && (
          <div className="mt-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[13px]">
            <div className={`${eyebrow} mb-2`}>{t('journey.editor.prosCons')}</div>
            <div className="flex gap-[10px]">
              <div className="min-w-0 flex-1">
                <div className="mb-[6px] flex items-center gap-[5px] text-[0.75rem] font-bold" style={{ color: PRO_COLOR }}>
                  <CheckCircle2 size={13} strokeWidth={2.2} />
                  {t('journey.editor.pros')}
                </div>
                {pros.map((p, i) => (
                  <div key={i} className="mb-[6px] flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-sheetop px-2 py-[6px]">
                    <span className="h-[5px] w-[5px] flex-none rounded-full" style={{ background: PRO_COLOR }} />
                    <input
                      value={p}
                      readOnly={readOnly}
                      onChange={e => { const next = [...pros]; next[i] = e.target.value; setPros(next) }}
                      placeholder={t('journey.editor.proPlaceholder')}
                      className="min-w-0 flex-1 bg-transparent font-geist text-[0.6875rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
                    />
                    {!readOnly && (
                      <button type="button" onClick={() => setPros(pros.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setPros([...pros, ''])}
                    className="block w-full rounded-[10px] border border-dashed py-[9px] text-center font-geist text-[0.6875rem] font-semibold"
                    style={{ borderColor: 'rgba(47,163,122,.35)', color: PRO_COLOR }}
                  >
                    + {t('journey.editor.addAnother')}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-[6px] flex items-center gap-[5px] text-[0.75rem] font-bold" style={{ color: CON_COLOR }}>
                  <MinusCircle size={13} strokeWidth={2.2} />
                  {t('journey.editor.cons')}
                </div>
                {cons.map((c, i) => (
                  <div key={i} className="mb-[6px] flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-sheetop px-2 py-[6px]">
                    <span className="h-[5px] w-[5px] flex-none rounded-full" style={{ background: CON_COLOR }} />
                    <input
                      value={c}
                      readOnly={readOnly}
                      onChange={e => { const next = [...cons]; next[i] = e.target.value; setCons(next) }}
                      placeholder={t('journey.editor.conPlaceholder')}
                      className="min-w-0 flex-1 bg-transparent font-geist text-[0.6875rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
                    />
                    {!readOnly && (
                      <button type="button" onClick={() => setCons(cons.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setCons([...cons, ''])}
                    className="block w-full rounded-[10px] border border-dashed py-[9px] text-center font-geist text-[0.6875rem] font-semibold"
                    style={{ borderColor: 'rgba(214,39,59,.35)', color: CON_COLOR }}
                  >
                    + {t('journey.editor.addAnother')}
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
        </>}

        {/* Date + Time */}
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <div className={`${eyebrow} mb-[5px]`}>{t('journey.editor.date')}</div>
            <div className={`${fieldShell} overflow-hidden`}>
              <input
                type="date"
                value={entryDate}
                disabled={readOnly}
                onChange={e => setEntryDate(e.target.value)}
                className="block min-w-0 w-full box-border border-0 bg-transparent px-3 py-[10px] text-center text-[0.78125rem] font-semibold text-m-ink outline-none [font-variant-numeric:tabular-nums]"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className={`${eyebrow} mb-[5px]`}>{t('mobileJourney.time')}</div>
            <div className={`${fieldShell} overflow-hidden`}>
              <input
                type="time"
                value={entryTime}
                disabled={readOnly}
                onChange={e => setEntryTime(e.target.value)}
                className="block min-w-0 w-full box-border border-0 bg-transparent px-3 py-[10px] text-center text-[0.78125rem] font-semibold text-m-ink outline-none [font-variant-numeric:tabular-nums]"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="relative mt-3">
          <div className={`${eyebrow} mb-[5px]`}>{t('journey.editor.location')}</div>
          <div className={`flex items-center gap-2 px-3 py-[10px] ${fieldShell}`}>
            <input
              value={locationQuery || locationName}
              readOnly={readOnly}
              onChange={e => searchLocation(e.target.value)}
              onFocus={() => { if (locationResults.length > 0) setShowLocationResults(true) }}
              placeholder={t('journey.editor.searchLocation')}
              className="min-w-0 flex-1 bg-transparent font-geist text-[0.75rem] text-m-ink outline-none placeholder:text-m-faint"
            />
            {locationLat != null && <MapPin size={13} className="flex-none text-m-muted" />}
          </div>
          {showLocationResults && locationResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[200px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_16px_40px_-18px_rgba(0,0,0,.5)]">
              {locationResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLocationName(r.name)
                    setLocationLat(r.lat)
                    setLocationLng(r.lng)
                    setLocationQuery('')
                    setShowLocationResults(false)
                    setLocationResults([])
                  }}
                  className="flex w-full items-start gap-2 border-b border-[color:var(--m-rowbr)] px-3 py-[10px] text-left last:border-0"
                >
                  <MapPin size={13} className="mt-[2px] flex-none text-m-faint" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.78125rem] font-semibold">{r.name}</span>
                    {r.address && <span className="block truncate font-geist text-[0.65625rem] text-m-muted">{r.address}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          {locating && <div className="mt-[5px] font-geist text-[0.65625rem] text-m-muted">{t('common.loading')}</div>}
          {locationError && <div className="mt-[5px] font-geist text-[0.65625rem] text-[color:var(--m-st-danger)]">{locationError}</div>}
        </div>

        {/* Mood */}
        {!captureOnly && <>
          <div className={`${eyebrow} mb-[6px] mt-3`}>{t('journey.editor.mood')}</div>
          <div className="flex flex-wrap gap-[6px]">
            {MOBILE_MOODS.map(m => {
              const active = mood === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setMood(active ? '' : m.id)}
                  className={`flex items-center gap-[5px] rounded-full border px-3 py-[7px] text-[0.71875rem] font-semibold ${
                    active ? '' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                  }`}
                  style={active ? { background: `${m.color}24`, color: m.color, borderColor: `${m.color}4D` } : undefined}
                >
                  <m.icon size={13} strokeWidth={2.2} />
                  {t(m.labelKey)}
                </button>
              )
            })}
          </div>
        </>}

        {/* Weather */}
        <div className={`${eyebrow} mb-[6px] mt-3`}>{t('journey.editor.weather')}</div>
        <div className="flex flex-wrap gap-[6px]">
          {MOBILE_WEATHERS.map(w => {
            const active = weather === w.id
            return (
              <button
                key={w.id}
                type="button"
                disabled={readOnly}
                onClick={() => setWeather(active ? '' : w.id)}
                className={`flex items-center gap-[5px] rounded-full border px-3 py-[7px] text-[0.71875rem] font-semibold ${
                  active
                    ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
                    : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                }`}
              >
                <w.icon size={13} strokeWidth={2.2} />
                {t(w.labelKey)}
              </button>
            )
          })}
        </div>

        {/* Tags */}
        {!captureOnly && (!readOnly || tags.length > 0) && (
          <>
            <div className={`${eyebrow} mb-[6px] mt-3`}>{t('mobileJourney.tags')}</div>
            <div className={`flex flex-wrap items-center gap-[6px] px-3 py-2 ${fieldShell} rounded-[14px]`}>
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-m-sheetop px-[10px] py-[5px] font-geist text-[0.6875rem] font-semibold">
                  {tag}
                  {!readOnly && (
                    <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== tag))} aria-label={t('common.delete')} className="text-m-faint">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              ))}
              {!readOnly && (
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  onBlur={addTag}
                  placeholder={t('mobileJourney.addTag')}
                  className="min-w-[100px] flex-1 bg-transparent py-[3px] font-geist text-[0.71875rem] text-m-ink outline-none placeholder:text-m-faint"
                />
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        {!readOnly && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-[5px] text-[0.75rem] font-bold text-[color:var(--m-st-danger)]"
          >
            <Trash2 size={13} strokeWidth={2} />
            {t('common.delete')}
          </button>
        )}
        {!readOnly && captureOnly && (
          <button
            type="button"
            onClick={() => setCaptureOnly(false)}
            className="rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
          >
            {t('collections.addDetails')}
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="ml-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
        >
          {t('common.cancel')}
        </button>
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        )}
      </div>
    </MSheet>
  )
}
