import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Camera, Image, Plus, X, Play } from 'lucide-react'
import { normalizeImageFiles } from '../../utils/convertHeic'
import { isVideoFile } from '../../utils/videoPoster'
import { useJourneyStore } from '../../store/journeyStore'
import { useTranslation } from '../../i18n'
import { journeyApi, addonsApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'
import type { JourneyEntry, GalleryPhoto, JourneyTrip } from '../../store/journeyStore'
import { photoUrl } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import { ProviderPicker } from './JourneyDetailPageProviderPicker'

export function GalleryView({ entries, gallery, journeyId, userId, trips, onPhotoClick, onRefresh }: {
  entries: JourneyEntry[]
  gallery: GalleryPhoto[]
  journeyId: number
  userId: number
  trips: JourneyTrip[]
  onPhotoClick: (photos: GalleryPhoto[], index: number) => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const [showPicker, setShowPicker] = useState(false)
  const [pickerProvider, setPickerProvider] = useState<string | null>(null)
  const [availableProviders, setAvailableProviders] = useState<{ id: string; name: string }[]>([])
  const [galleryProgress, setGalleryProgress] = useState<{ done: number; total: number } | null>(null)
  const galleryUploading = galleryProgress !== null
  const toast = useToast()

  // check which providers are enabled AND connected for the current user
  useEffect(() => {
    (async () => {
      try {
        const addonsData = await addonsApi.enabled()
        const enabledProviders = (addonsData.addons || []).filter(
          (a: any) => a.type === 'photo_provider' && a.enabled
        )
        const connected: { id: string; name: string }[] = []
        for (const p of enabledProviders) {
          try {
            const res = await fetch(`/api/integrations/memories/${p.id}/status`, { credentials: 'include' })
            if (res.ok) {
              const status = await res.json()
              if (status.connected) connected.push({ id: p.id, name: p.name })
            }
          } catch {}
        }
        setAvailableProviders(connected)
      } catch {}
    })()
  }, [])

  const allPhotos = gallery

  const entriesWithContent = entries.filter(e => e.type !== 'skeleton' || e.title)

  const browseProvider = (provider: string) => {
    setPickerProvider(provider)
    setShowPicker(true)
  }

  const galleryFileRef = useRef<HTMLInputElement>(null)

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setGalleryProgress({ done: 0, total: files.length })
    try {
      // Videos skip HEIC normalization; only images are converted (#823).
      const all = Array.from(files)
      const videos = all.filter(isVideoFile)
      const images = all.filter(f => !isVideoFile(f))
      const normalized = [...(images.length ? await normalizeImageFiles(images) : []), ...videos]
      const { failed } = await useJourneyStore.getState().uploadGalleryPhotos(journeyId, normalized, {
        onProgress: p => setGalleryProgress({ done: p.done, total: p.total }),
      })
      if (failed.length > 0) {
        toast.error(t('journey.editor.uploadPartialFailed', { failed: String(failed.length), total: String(normalized.length) }))
      } else {
        toast.success(t('journey.photosUploaded', { count: String(files.length) }))
      }
      onRefresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('journey.photosUploadFailed')))
    } finally {
      setGalleryProgress(null)
    }
    e.target.value = ''
  }

  const handleDeletePhoto = async (galleryPhotoId: number) => {
    const store = useJourneyStore.getState()
    if (!store.current) return

    // Optimistic update — remove from gallery and all entry photo lists
    useJourneyStore.setState({
      current: {
        ...store.current,
        gallery: (store.current.gallery || []).filter(p => p.id !== galleryPhotoId),
        entries: store.current.entries.map(e => ({
          ...e,
          photos: e.photos.filter(p => p.id !== galleryPhotoId),
        })),
      },
    })

    try {
      await journeyApi.deleteGalleryPhoto(journeyId, galleryPhotoId)
    } catch {
      toast.error(t('common.error'))
      onRefresh()
    }
  }

  return (
    <div>
      <input ref={galleryFileRef} type="file" accept="image/*,video/*" multiple onChange={handleGalleryUpload} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          <Camera size={10} /> {allPhotos.length} {t('journey.detail.photos')}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => galleryFileRef.current?.click()}
            disabled={galleryUploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
          >
            {galleryUploading ? (
              <><div className="w-3 h-3 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" /> {galleryProgress ? t('journey.editor.uploadingProgress', { done: String(galleryProgress.done), total: String(galleryProgress.total) }) : t('journey.editor.uploading')}</>
            ) : (
              <><Plus size={12} /> {t('common.upload')}</>
            )}
          </button>
          {availableProviders.map(p => (
            <button
              key={p.id}
              onClick={() => browseProvider(p.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <Image size={12} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Image size={24} className="text-zinc-400" />
          </div>
          <p className="text-[15px] font-medium text-zinc-700 dark:text-zinc-300">{t('journey.detail.noPhotos')}</p>
          <p className="text-[12px] text-zinc-500 mt-1">{t('journey.detail.noPhotosHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pb-24 md:pb-6">
          {allPhotos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => onPhotoClick(allPhotos, i)}
            >
              {photo.media_type === 'video' && !photo.thumbnail_path ? (
                // Poster-less video (capture failed / unsupported codec): show a
                // neutral tile rather than a broken 404 thumbnail (#823).
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
              ) : (
                <img
                  src={photoUrl(photo, 'thumbnail')}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {photo.media_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-9 h-9 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white">
                    <Play size={16} className="ml-0.5" fill="currentColor" />
                  </span>
                </div>
              )}
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id) }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={12} />
              </button>
              {photo.provider && photo.provider !== 'local' && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur text-white flex items-center gap-1">
                    <RefreshCw size={7} />
                    {photo.provider === 'immich' ? 'Immich' : photo.provider === 'synology' ? 'Synology' : photo.provider}
                  </span>
                </div>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Provider Photo Picker Modal */}
      {showPicker && (
        <ProviderPicker
          provider={pickerProvider!}
          userId={userId}
          entries={entriesWithContent}
          trips={trips}
          existingAssetIds={new Set(gallery.filter(p => p.asset_id).map(p => p.asset_id!))}
          onClose={() => setShowPicker(false)}
          onAdd={async (groups, entryId) => {
            let added = 0
            let anyFailed = false
            for (const group of groups) {
              try {
                if (entryId) {
                  const result = await journeyApi.addProviderPhotos(entryId, pickerProvider!, group.assetIds, undefined, group.passphrase, group.mediaTypes)
                  added += result.added || 0
                } else {
                  const result = await journeyApi.addProviderPhotosToGallery(journeyId, pickerProvider!, group.assetIds, group.passphrase, group.mediaTypes)
                  added += result.added || 0
                }
              } catch {
                anyFailed = true
              }
            }
            if (added > 0) {
              toast.success(t('journey.photosAdded', { count: added }))
              onRefresh()
            } else if (anyFailed) {
              toast.error(t('common.error'))
            }
            setShowPicker(false)
          }}
        />
      )}
    </div>
  )
}
