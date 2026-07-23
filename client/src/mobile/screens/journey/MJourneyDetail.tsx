import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, MapPin, Grid3x3, Upload, MoreHorizontal, Play, Image, Camera } from 'lucide-react'
import JourneyMap from '../../../components/Journey/JourneyMapAuto'
import type { JourneyMapAutoHandle } from '../../../components/Journey/JourneyMapAuto'
import PhotoLightbox from '../../../components/Journey/PhotoLightbox'
import ContributorInviteDialog from '../../../components/Journey/ContributorInviteDialog'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { ProviderPicker } from '../../../components/Journey/JourneyDetailPageProviderPicker'
import { photoUrl } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import { useJourneyDetail } from '../../../pages/journeyDetail/useJourneyDetail'
import { useJourneyStore } from '../../../store/journeyStore'
import type { JourneyEntry, GalleryPhoto } from '../../../store/journeyStore'
import { useAuthStore } from '../../../store/authStore'
import { journeyApi, addonsApi } from '../../../api/client'
import { normalizeImageFiles } from '../../../utils/convertHeic'
import { isVideoFile } from '../../../utils/videoPoster'
import { getApiErrorMessage } from '../../../types'
import MSheet from '../../components/MSheet'
import MDancingTrek from '../../components/MDancingTrek'
import MListRow from '../../components/MListRow'
import MJourneyEntryCard from './MJourneyEntryCard'
import MJourneyEntrySheet from './MJourneyEntrySheet'
import MJourneySettingsSheet from './MJourneySettingsSheet'

/**
 * Journey detail — integrated map with the horizontal 280px card timeline
 * (Journey tab) and the 2-column photo gallery (Gallery tab). Cards and map
 * markers stay in sync; tapping the centered card opens the entry sheet.
 */
export default function MJourneyDetail() {
  const {
    id, navigate, toast, t,
    current, loading,
    canEditEntries, canEditJourney,
    view, setView,
    editingEntry, setEditingEntry,
    lightbox, setLightbox, deleteTarget, setDeleteTarget,
    showInvite, setShowInvite,
    showSettings, setShowSettings,
    hideSkeletons,
    sidebarMapItems,
    loadJourney, updateEntry, deleteEntry, uploadPhotos,
  } = useJourneyDetail()

  const mapRef = useRef<JourneyMapAutoHandle>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [activeIndex, setActiveIndex] = useState(0)

  const entries = (current?.entries || []).filter(e => !hideSkeletons || e.type !== 'skeleton')

  const syncMapToCard = useCallback((index: number) => {
    const entry = entries[index]
    if (!entry) return
    const mapEntry = sidebarMapItems.find(m => String(m.id) === String(entry.id))
    try {
      if (mapEntry) mapRef.current?.focusMarker(String(mapEntry.id))
      else mapRef.current?.highlightMarker(null)
    } catch { /* map not initialised yet */ }
  }, [entries, sidebarMapItems])

  // Pick the card closest to the horizontal center once scrolling settles.
  const pickNearestCard = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    const center = el.getBoundingClientRect().left + el.clientWidth / 2
    let bestIdx = 0
    let bestDist = Infinity
    cardRefs.current.forEach((node, idx) => {
      const r = node.getBoundingClientRect()
      const d = Math.abs(r.left + r.width / 2 - center)
      if (d < bestDist) { bestDist = d; bestIdx = idx }
    })
    setActiveIndex(prev => {
      if (prev !== bestIdx) syncMapToCard(bestIdx)
      return bestIdx
    })
  }, [syncMapToCard])

  useEffect(() => {
    const el = carouselRef.current
    if (!el || entries.length === 0) return
    let settleTimer: number | null = null
    const onScroll = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(pickNearestCard, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (settleTimer != null) window.clearTimeout(settleTimer)
    }
  }, [entries.length, pickNearestCard])

  // Initial focus — give Leaflet time to initialise and fit bounds first.
  useEffect(() => {
    if (entries.length === 0) return
    const timer = window.setTimeout(() => syncMapToCard(0), 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length])

  const scrollCardIntoCenter = useCallback((idx: number) => {
    cardRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  const handleMarkerClick = useCallback((markerId: string) => {
    const idx = entries.findIndex(e => String(e.id) === markerId)
    if (idx === -1) return
    setActiveIndex(idx)
    scrollCardIntoCenter(idx)
  }, [entries, scrollCardIntoCenter])

  const handleCardTap = (entry: JourneyEntry, idx: number) => {
    if (idx === activeIndex) setEditingEntry(entry)
    else {
      setActiveIndex(idx)
      scrollCardIntoCenter(idx)
      syncMapToCard(idx)
    }
  }

  // Gallery upload — device files plus the connected photo providers (Immich/Synology).
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const [availableProviders, setAvailableProviders] = useState<{ id: string; name: string }[]>([])
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [pickerProvider, setPickerProvider] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const addonsData = await addonsApi.enabled()
        const enabled = (addonsData.addons || []).filter(
          (a: { type: string; enabled: boolean }) => a.type === 'photo_provider' && a.enabled,
        )
        const connected: { id: string; name: string }[] = []
        for (const p of enabled) {
          try {
            const res = await fetch(`/api/integrations/memories/${p.id}/status`, { credentials: 'include' })
            if (res.ok && (await res.json()).connected) connected.push({ id: p.id, name: p.name })
          } catch { /* provider stays hidden */ }
        }
        setAvailableProviders(connected)
      } catch { /* no providers */ }
    })()
  }, [])

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !current) return
    setUploading(true)
    try {
      const all = Array.from(files)
      const videos = all.filter(isVideoFile)
      const images = all.filter(f => !isVideoFile(f))
      const normalized = [...(images.length ? await normalizeImageFiles(images) : []), ...videos]
      const { failed } = await useJourneyStore.getState().uploadGalleryPhotos(current.id, normalized)
      if (failed.length > 0) {
        toast.error(t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(normalized.length) }))
      } else {
        toast.success(t('journey.photosUploaded', { count: String(files.length) }))
      }
      loadJourney(Number(id))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('journey.photosUploadFailed')))
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const openLightbox = (photos: GalleryPhoto[], index: number) => {
    setLightbox({
      photos: photos.map(p => ({
        id: p.id,
        src: photoUrl(p, 'original'),
        caption: p.caption ?? null,
        provider: p.provider,
        asset_id: p.asset_id,
        owner_id: p.owner_id,
        mediaType: p.media_type,
      })),
      index,
    })
  }

  if (loading || !current) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-ink" />
      </div>
    )
  }

  const gallery = current.gallery || []
  const dark = document.documentElement.classList.contains('dark')

  return (
    <div className="relative h-full overflow-hidden">
      {/* Integrated map — always mounted, the gallery overlays it */}
      <div className="absolute inset-0 z-0">
        <JourneyMap
          ref={mapRef}
          checkins={[]}
          entries={sidebarMapItems}
          height={9999}
          dark={dark}
          activeMarkerId={entries[activeIndex] ? String(entries[activeIndex].id) : null}
          onMarkerClick={handleMarkerClick}
          fullScreen
          paddingBottom={200}
        />
      </div>

      {/* Gallery tab overlay */}
      {view === 'gallery' && (
        <div className="absolute inset-0 z-[5] overflow-y-auto bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] px-4 pt-[calc(var(--m-safe-top,12px)+56px)] pb-[calc(var(--bottom-nav-h,84px)+16px)]">
          {gallery.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-8 py-10 text-center">
              <MDancingTrek scene="journey" className="mb-2" />
              <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('journey.detail.noPhotos')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gallery.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => openLightbox(gallery, i)}
                  className="relative aspect-square overflow-hidden rounded-[14px]"
                >
                  {photo.media_type === 'video' && !photo.thumbnail_path ? (
                    <span className="block h-full w-full bg-[color:var(--m-ic)]" />
                  ) : (
                    <img src={photoUrl(photo, 'thumbnail')} alt={photo.caption || ''} loading="lazy" className="h-full w-full object-cover" />
                  )}
                  {photo.media_type === 'video' && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                        <Play size={16} className="ml-[2px]" fill="currentColor" />
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header: back — segment — upload/settings */}
      <div className="absolute left-4 right-4 top-[var(--m-safe-top,12px)] z-10 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/journey')}
          aria-label={t('journey.detail.backToJourney')}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 rounded-full bg-[color:var(--m-sheet)] p-[3px] shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)]">
          <button
            type="button"
            onClick={() => setView('timeline')}
            className={`flex items-center gap-[5px] rounded-full px-[13px] py-[6px] text-[0.75rem] font-bold ${
              view === 'timeline' ? 'bg-m-act text-m-actfg' : 'text-m-muted'
            }`}
          >
            <MapPin size={13} strokeWidth={2.2} />
            {t('journey.detail.journeyTab')}
          </button>
          <button
            type="button"
            onClick={() => setView('gallery')}
            className={`flex items-center gap-[5px] rounded-full px-[13px] py-[6px] text-[0.75rem] font-bold ${
              view === 'gallery' ? 'bg-m-act text-m-actfg' : 'text-m-muted'
            }`}
          >
            <Grid3x3 size={13} strokeWidth={2.2} />
            {t('journey.share.gallery')}
          </button>
        </div>
        <span className="ml-auto flex flex-none items-center gap-2">
          {view === 'gallery' && canEditEntries && (
            <button
              type="button"
              onClick={() => (availableProviders.length > 0 ? setShowUploadMenu(true) : galleryFileRef.current?.click())}
              disabled={uploading}
              aria-label={t('common.upload')}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-m-act text-m-actfg shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)] disabled:opacity-60"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Upload size={16} strokeWidth={2.2} />
              )}
            </button>
          )}
          {view === 'timeline' && canEditJourney && (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label={t('journey.settings.title')}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)]"
            >
              <MoreHorizontal size={17} strokeWidth={2} />
            </button>
          )}
        </span>
      </div>

      {/* Horizontal card timeline */}
      {view === 'timeline' && entries.length > 0 && (
        <div
          ref={carouselRef}
          className="absolute left-0 right-0 z-[8] flex gap-[10px] overflow-x-auto px-4 pb-1 bottom-[calc(var(--bottom-nav-h,84px)+16px)] [-webkit-overflow-scrolling:touch] [scrollbar-width:none]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              ref={node => { if (node) cardRefs.current.set(i, node); else cardRefs.current.delete(i) }}
              style={{ scrollSnapAlign: 'center' }}
            >
              <MJourneyEntryCard entry={entry} number={i + 1} onClick={() => handleCardTap(entry, i)} />
            </div>
          ))}
        </div>
      )}

      <input ref={galleryFileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleGalleryUpload} />

      {/* Upload source chooser (device / providers) */}
      <MSheet open={showUploadMenu} onClose={() => setShowUploadMenu(false)} variant="bottom" ariaLabel={t('common.upload')}>
        <div className="flex flex-col gap-2 p-[10px]">
          <MListRow
            icon={Camera}
            label={t('mobileJourney.uploadFromDevice')}
            onClick={() => { setShowUploadMenu(false); galleryFileRef.current?.click() }}
          />
          {availableProviders.map(p => (
            <MListRow
              key={p.id}
              icon={Image}
              label={t('mobileJourney.browseProvider', { name: p.name })}
              onClick={() => { setShowUploadMenu(false); setPickerProvider(p.id) }}
            />
          ))}
        </div>
      </MSheet>

      {/* Entry sheet (new / edit / read-only) */}
      {editingEntry && (
        <MJourneyEntrySheet
          entry={editingEntry}
          galleryPhotos={gallery}
          quickCapture={editingEntry.id === 0}
          readOnly={!canEditEntries}
          onClose={() => setEditingEntry(null)}
          onSave={async data => {
            let entryId = editingEntry.id
            if (editingEntry.id === 0) {
              const created = await useJourneyStore.getState().createEntry(current.id, data)
              entryId = created.id
            } else {
              await updateEntry(editingEntry.id, data)
            }
            return entryId
          }}
          onUploadPhotos={uploadPhotos}
          onDelete={editingEntry.id > 0 && canEditEntries
            ? () => { const target = editingEntry; setEditingEntry(null); setDeleteTarget(target) }
            : undefined}
          onDone={() => {
            setEditingEntry(null)
            loadJourney(Number(id))
          }}
        />
      )}

      {/* Journey settings */}
      {showSettings && (
        <MJourneySettingsSheet
          journey={current}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); loadJourney(Number(id)) }}
          onOpenInvite={() => setShowInvite(true)}
          onRefresh={() => loadJourney(Number(id))}
        />
      )}

      {/* Contributor invite */}
      {showInvite && (
        <ContributorInviteDialog
          journeyId={current.id}
          existingUserIds={current.contributors.map(c => c.user_id)}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadJourney(Number(id)) }}
        />
      )}

      {/* Provider photo picker (Immich / Synology) */}
      {pickerProvider && (
        <ProviderPicker
          provider={pickerProvider}
          userId={useAuthStore.getState().user?.id || 0}
          entries={current.entries.filter(e => e.type !== 'skeleton' || e.title)}
          trips={current.trips}
          existingAssetIds={new Set(gallery.filter(p => p.asset_id).map(p => p.asset_id!))}
          onClose={() => setPickerProvider(null)}
          onAdd={async (groups, entryId) => {
            let added = 0
            let anyFailed = false
            for (const group of groups) {
              try {
                const result = entryId
                  ? await journeyApi.addProviderPhotos(entryId, pickerProvider, group.assetIds, undefined, group.passphrase, group.mediaTypes)
                  : await journeyApi.addProviderPhotosToGallery(current.id, pickerProvider, group.assetIds, group.passphrase, group.mediaTypes)
                added += result.added || 0
              } catch {
                anyFailed = true
              }
            }
            if (added > 0) {
              toast.success(t('journey.photosAdded', { count: added }))
              loadJourney(Number(id))
            } else if (anyFailed) {
              toast.error(t('common.error'))
            }
            setPickerProvider(null)
          }}
        />
      )}

      {/* Delete entry confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await deleteEntry(deleteTarget.id)
          setDeleteTarget(null)
          loadJourney(Number(id))
        }}
        title={t('journey.entries.deleteTitle')}
        message={t('journey.deleteConfirmMessage', { title: deleteTarget?.title || '' })}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos.map(p => ({
            id: p.id.toString(),
            src: p.src,
            caption: p.caption,
            provider: p.provider,
            asset_id: p.asset_id,
            owner_id: p.owner_id,
            mediaType: p.mediaType,
          }))}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
