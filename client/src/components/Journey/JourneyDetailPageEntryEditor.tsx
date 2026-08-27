import { useEffect, useMemo, useState, useRef } from 'react'
import { localIsoDate } from '../../utils/localDate'
import { X, Plus, Image, Minus, Check, MapPin, Locate, Camera } from 'lucide-react'
import { normalizeImageFiles } from '../../utils/convertHeic'
import { type ResilientResult, type UploadProgress } from '../../utils/uploadQueue'
import { useTranslation } from '../../i18n'
import { journeyApi, mapsApi, addonsApi, memoriesApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { getCurrentPositionOnce } from '../../hooks/useGeolocation'
import { getApiErrorMessage } from '../../types'
import type { JourneyEntry, JourneyPhoto, GalleryPhoto, JourneyTrip } from '../../store/journeyStore'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'
import { photoUrl, isValidGeoPoint, geoOnceErrorKey } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import MarkdownToolbar from './MarkdownToolbar'
import { DatePicker } from './JourneyDetailPageDatePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import { ProviderPicker, type ProviderPhotoGroup } from './JourneyDetailPageProviderPicker'

type PendingProviderGroup = ProviderPhotoGroup & { provider: string }

export function EntryEditor({ entry, journeyId, tripDates, galleryPhotos, trips, userId = 0, onClose, onSave, onUploadPhotos, onAddProviderPhotos, onDone }: {
  entry: JourneyEntry
  journeyId: number
  tripDates: Set<string>
  galleryPhotos: GalleryPhoto[]
  trips: JourneyTrip[]
  userId?: number
  onClose: () => void
  onSave: (data: Record<string, unknown>, existingEntryId?: number) => Promise<number>
  onUploadPhotos: (entryId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => Promise<ResilientResult<JourneyPhoto>>
  onAddProviderPhotos?: (entryId: number, group: PendingProviderGroup) => Promise<void>
  onDone: () => void
}) {
  const { t, language } = useTranslation()
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
  const [pros, setPros] = useState<string[]>(entry.pros_cons?.pros?.length ? entry.pros_cons.pros : [''])
  const [cons, setCons] = useState<string[]>(entry.pros_cons?.cons?.length ? entry.pros_cons.cons : [''])
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [photos, setPhotos] = useState<(JourneyPhoto | GalleryPhoto)[]>(entry.photos || [])
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
  const persistedEntryIdRef = useRef<number | null>(entry.id > 0 ? entry.id : null)

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
    ;(async () => {
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

  const handleClose = () => {
    if (isDirty && !window.confirm(t('journey.editor.discardChangesConfirm'))) return
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
        const data = await mapsApi.reverse(pos.lat, pos.lng, language)
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

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: 'rgba(9,9,11,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      {/* The modal itself is constrained to the feed column on desktop so it
          centers there — but the backdrop stays full-width (covering the map
          too) for a uniform dim/blur across the whole page. */}
      <div
        className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-5"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-t-[24px] sm:rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] sm:max-w-[1040px] w-full flex flex-col overflow-hidden h-full sm:h-auto sm:max-h-[90vh]" style={{ paddingBottom: 'var(--bottom-nav-h)' }}>


        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">{entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}</h2>
          <button type="button" onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-stretch">
          <div className="flex flex-col gap-4 min-w-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('journey.editor.titlePlaceholder')}
            className="w-full text-[20px] font-medium bg-transparent border-0 border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 pb-2"
          />

          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} className="hidden" />
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { setPhotoTab('upload'); setShowGalleryPick(false); fileRef.current?.click() }}
                disabled={saving}
                className="flex-1 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl py-4 text-[12px] text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {uploadProgress ? (
                  <><div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" /> {t('journey.editor.uploadingProgress', { done: String(uploadProgress.done), total: String(uploadProgress.total) })}</>
                ) : (
                  <><Plus size={13} /> {t('journey.editor.uploadPhotos')}</>
                )}
              </button>
              {galleryPhotos.length > 0 && (
                <button type="button"
                  onClick={() => { setPhotoTab('gallery'); setShowGalleryPick(!showGalleryPick) }}
                  className={`flex-1 border rounded-xl py-4 text-[12px] text-zinc-500 flex items-center justify-center gap-1.5 ${
                    showGalleryPick
                      ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800'
                      : 'border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Image size={13} /> {t('journey.editor.fromGallery')}
                </button>
              )}
              <button type="button"
                onClick={() => { setPhotoTab('upload'); setShowGalleryPick(false); cameraRef.current?.click() }}
                disabled={saving}
                aria-label={t('journey.photo.add')}
                title={t('journey.photo.add')}
                className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl px-4 text-[12px] text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center disabled:opacity-50"
              >
                <Camera size={14} />
              </button>
              <button type="button"
                onClick={() => { setPhotoTab('external'); setShowGalleryPick(false) }}
                disabled={saving}
                className={`flex-1 border rounded-lg py-4 text-[12px] text-zinc-500 flex items-center justify-center gap-1.5 ${
                  photoTab === 'external'
                    ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800'
                    : 'border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Image size={13} /> {t('journey.editor.externalPhotos') || 'External photos'}
              </button>
            </div>

            {/* Gallery picker — directly below buttons. Safari collapses
                `aspect-square` items inside an overflow-scroll grid, so
                the square is enforced with a padding-top spacer + an
                absolutely positioned image (works across all browsers). */}
            {showGalleryPick && (
              <div className="mt-2 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-[160px] overflow-y-auto">
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
                      className="relative block w-full rounded-xl overflow-hidden border-0 p-0 bg-transparent cursor-pointer hover:ring-2 hover:ring-zinc-900 dark:hover:ring-white hover:ring-offset-1 dark:hover:ring-offset-zinc-900 transition-all"
                      style={{ paddingTop: '100%' }}
                    >
                      <img src={photoUrl(gp)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={e => { const img = e.currentTarget; const orig = photoUrl(gp, 'original'); if (!img.src.includes('/original')) img.src = orig }} />
                    </button>
                  ))}
                  {availableGalleryPhotos.length === 0 && (
                    <div className="col-span-full text-center py-3 text-[11px] text-zinc-400">{t('journey.editor.allPhotosAdded')}</div>
                  )}
                </div>
              </div>
            )}
            {photoTab === 'external' && (
              <div className="mt-2 flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50" style={{ height: 'min(56vh, 520px)' }}>
                <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                      {t('journey.editor.externalPhotosFor', { date: new Date(entryDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) })}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {contextLocation?.name
                        ? `${t('journey.editor.externalPhotosNearby') || 'Nearby photos first'} · ${contextLocation.name}`
                        : (t('journey.editor.externalPhotosNoLocation') || 'All photos from this day')}
                    </p>
                  </div>
                  {pendingProviderGroups.length > 0 && (
                    <button type="button" onClick={() => setPendingProviderGroups([])} className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap">
                      {pendingProviderGroups.reduce((sum, group) => sum + group.assetIds.length, 0)} {t('journey.editor.externalPhotosQueued') || 'queued'} · {t('common.clear') || 'Clear'}
                    </button>
                  )}
                </div>
                {providersLoading ? (
                  <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" /></div>
                ) : availableProviders.length === 0 ? (
                  <div className="text-center py-10 px-4 text-[12px] text-zinc-500">{t('journey.editor.externalPhotosUnavailable') || 'No connected photo providers are available.'}</div>
                ) : (
                  <div className="h-full min-h-0 flex flex-col">
                    <div className="flex gap-1 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
                      {availableProviders.map(provider => (
                        <button type="button"
                          key={provider.id}
                          data-testid={`journey-external-provider-${provider.id}`}
                          onClick={() => setExternalProvider(provider.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${externalProvider === provider.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                        >
                          {provider.name}
                        </button>
                      ))}
                    </div>
                    {activeExternalProvider && (
                      <div className="flex-1 min-h-0">
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
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {photos.map((p, idx) => (
                    <div key={p.id} className={`w-20 h-20 rounded-xl overflow-hidden relative group ${idx === 0 && photos.length > 1 ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-1 dark:ring-offset-zinc-900' : ''}`}>
                      <img src={photoUrl(p)} className="w-full h-full object-cover" alt="" onError={e => { const img = e.currentTarget; const orig = photoUrl(p, 'original'); if (!img.src.includes('/original')) img.src = orig }} />
                      {idx === 0 && photos.length > 1 && (
                        <span className="absolute bottom-0.5 left-0.5 px-1 py-px rounded text-[8px] font-bold bg-zinc-900/70 text-white">{t('journey.editor.photoFirst')}</span>
                      )}
                      {idx > 0 && photos.length > 1 && (
                        <button type="button"
                          onClick={e => {
                            e.stopPropagation()
                            const prevOrder = photos
                            const next = [...photos]
                            const [moved] = next.splice(idx, 1)
                            next.unshift(moved)
                            setPhotos(next)
                            // The order is shared: other members, the share view and the
                            // PDF all read it, so a rejected write has to go back. Every
                            // write is awaited first — snapping back on the first
                            // rejection would do it while the rest are still landing.
                            void (async () => {
                              const results = await Promise.allSettled(next.map((ph, i) => journeyApi.updatePhoto(ph.id, { sort_order: i })))
                              const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
                              if (rejected.length === 0) return
                              toast.error(getApiErrorMessage(rejected[0].reason, t('common.error')))
                              // Only a run where nothing landed can be put back: with a
                              // partial one the server already holds part of the new
                              // order, and hiding that would be the worse lie.
                              if (rejected.length === results.length) setPhotos(prevOrder)
                            })()
                          }}
                          className="absolute bottom-0.5 left-0.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t('journey.editor.makeFirst')}
                        </button>
                      )}
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
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {pendingFiles.map((f, i) => (
                    <div key={`pending-${i}`} className="w-20 h-20 rounded-xl overflow-hidden relative group">
                      <img src={pendingUrls[i]} className="w-full h-full object-cover" alt="" />
                      <button type="button"
                        onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-[220px] border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-500">
            <MarkdownToolbar textareaRef={storyRef} onUpdate={setStory} />
            <textarea
              ref={storyRef}
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder={t('journey.editor.writeStory')}
              rows={6}
              style={{ minHeight: '144px' }}
              className="w-full flex-1 px-3 py-2.5 text-[14px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none resize-none border-0"
            />
          </div>

          </div>

          <div className="flex flex-col gap-4 min-w-0">
          {/* Pros & Cons */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5">
            <div className="mb-4">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-500">{t('journey.editor.prosCons')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Pros */}
              <div>
                <div className="flex items-center gap-[7px] mb-2.5">
                  <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check size={9} className="text-green-700 dark:text-green-400" strokeWidth={3.5} />
                  </div>
                  <span className="text-[12px] font-semibold text-green-700 dark:text-green-400">{t('journey.editor.pros')}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {pros.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 h-9 px-3 border rounded-[10px] border-zinc-200 dark:border-zinc-700">
                      <span className="w-[5px] h-[5px] rounded-full bg-green-500 flex-shrink-0" />
                      <input
                        value={p}
                        onChange={e => { const next = [...pros]; next[i] = e.target.value; setPros(next) }}
                        placeholder={t('journey.editor.proPlaceholder')}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-green-400 dark:placeholder:text-green-600"
                      />
                      {pros.length > 1 && (
                        <button type="button" onClick={() => setPros(pros.filter((_, j) => j !== i))} className="p-1 text-green-300 dark:text-green-700 hover:text-green-600 dark:hover:text-green-400 flex-shrink-0">
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setPros([...pros, ''])}
                    className="flex items-center justify-center gap-1.5 h-9 w-full border border-dashed border-green-200 dark:border-green-800/40 rounded-[10px] text-[12px] font-medium text-green-700 dark:text-green-400 hover:border-green-300 dark:hover:border-green-700 transition-colors"
                  >
                    <Plus size={13} strokeWidth={2.5} /> {t('journey.editor.addAnother')}
                  </button>
                </div>
              </div>

              {/* Cons */}
              <div>
                <div className="flex items-center gap-[7px] mb-2.5">
                  <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Minus size={9} className="text-red-700 dark:text-red-400" strokeWidth={3.5} />
                  </div>
                  <span className="text-[12px] font-semibold text-red-700 dark:text-red-400">{t('journey.editor.cons')}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cons.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 h-9 px-3 border rounded-[10px] border-zinc-200 dark:border-zinc-700">
                      <span className="w-[5px] h-[5px] rounded-full bg-red-500 flex-shrink-0" />
                      <input
                        value={c}
                        onChange={e => { const next = [...cons]; next[i] = e.target.value; setCons(next) }}
                        placeholder={t('journey.editor.conPlaceholder')}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-red-400 dark:placeholder:text-red-600"
                      />
                      {cons.length > 1 && (
                        <button type="button" onClick={() => setCons(cons.filter((_, j) => j !== i))} className="p-1 text-red-300 dark:text-red-700 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0">
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setCons([...cons, ''])}
                    className="flex items-center justify-center gap-1.5 h-9 w-full border border-dashed border-red-200 dark:border-red-800/40 rounded-[10px] text-[12px] font-medium text-red-700 dark:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                  >
                    <Plus size={13} strokeWidth={2.5} /> {t('journey.editor.addAnother')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Time sat in state and went to the server, it just had no input here — so a
                draft's auto-stamped clock time showed up in the timeline, the map, the PDF
                and the public share, and the desktop had no way to correct it (#1614). */}
            {/* 136px, not 104: the custom picker adds a clock button and, in 12h,
                shows "2:30 PM" where the native input showed a fixed-width HH:MM. */}
            <div className="grid grid-cols-[1fr_136px] gap-2">
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.editor.date')}</label>
                <DatePicker value={entryDate} onChange={setEntryDate} tripDates={tripDates} />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('mobileJourney.time')}</label>
                {/* A native <input type="time"> paints 12h or 24h from the browser
                    locale, and no attribute overrides it — so it ignored the user's
                    setting outright (#2067). The rest of TREK has used this picker
                    for exactly that reason; the journey editor was never migrated. */}
                <CustomTimePicker value={entryTime} onChange={setEntryTime} />
              </div>
            </div>
            <div className="relative">
              <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.editor.location')}</label>
              <div className="relative">
                <input
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
                          const res = await mapsApi.search(q)
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
                  className="w-full pl-3 pr-9 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  title={t('journey.editor.useCurrentLocation')}
                  aria-label={t('journey.editor.useCurrentLocation')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  {locating
                    ? <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                    : <Locate size={14} />}
                </button>
              </div>
              {showLocationResults && locationResults.length > 0 && (
                <>
                  <div role="presentation" className="fixed inset-0 z-[99]" onClick={() => setShowLocationResults(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden max-h-[240px] overflow-y-auto">
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
                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-start gap-2.5 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                      >
                        <MapPin size={13} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-zinc-900 dark:text-white truncate">{r.name}</div>
                          {r.address && <div className="text-[11px] text-zinc-500 truncate">{r.address}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {locationSearching && (
                <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg px-3 py-3 text-center text-[12px] text-zinc-400">
                  {t('journey.editor.searching')}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.editor.mood')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MOOD_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const active = mood === key
                return (
                  <button type="button" key={key} onClick={() => setMood(active ? '' : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      active ? '' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                    }`}
                    style={active ? { background: config.bg, color: config.text, borderColor: config.text + '30' } : undefined}>
                    <Icon size={12} />
                    {t(config.label)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.editor.weather')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WEATHER_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const active = weather === key
                return (
                  <button type="button" key={key} onClick={() => setWeather(active ? '' : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      active ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                    }`}>
                    <Icon size={12} />
                    {t(config.label)}
                  </button>
                )
              })}
            </div>
          </div>
          </div>
          </div>
        </div>


        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
          <button type="button" onClick={handleClose} className="px-4 h-10 flex items-center rounded-full border border-zinc-200 dark:border-zinc-600 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">{t('common.cancel')}</button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-5 h-10 flex items-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
