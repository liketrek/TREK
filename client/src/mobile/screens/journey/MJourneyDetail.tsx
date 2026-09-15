import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronLeft, MapPin, Grid3x3, MoreHorizontal, Play, Image, Camera, EyeOff, Settings2 } from 'lucide-react'
import JourneyMap from '../../../components/Journey/JourneyMapAuto'
import type { JourneyMapAutoHandle } from '../../../components/Journey/JourneyMapAuto'
import PhotoLightbox from '../../../components/Journey/PhotoLightbox'
import ContributorInviteDialog from '../../../components/Journey/ContributorInviteDialog'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { ProviderPicker } from '../../../components/Journey/JourneyDetailPageProviderPicker'
import { photoUrl } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import { useJourneyDetail } from '../../../pages/journeyDetail/useJourneyDetail'
import { useJourneyStore } from '../../../store/journeyStore'
import { useAddonStore } from '../../../store/addonStore'
import DawarichIcon from '../../../components/shared/DawarichIcon'
import DawarichSuggestionsPanel from '../../../components/Dawarich/DawarichSuggestionsPanel'
import { FormSheetHeader } from '../trip/sheets/PlSheetChrome'
import type { JourneyEntry, GalleryPhoto } from '../../../store/journeyStore'
import { useAuthStore } from '../../../store/authStore'
import { journeyApi, addonsApi, memoriesApi } from '../../../api/client'
import { normalizeImageFiles } from '../../../utils/convertHeic'
import { isVideoFile } from '../../../utils/videoPoster'
import { getApiErrorMessage } from '../../../types'
import MSheet from '../../components/MSheet'
import MDancingTrek from '../../components/MDancingTrek'
import MListRow from '../../components/MListRow'
import MToggle from '../../components/MToggle'
import JourneyEntryCover from '../../../components/Journey/JourneyEntryCover'
import JourneyDayScrubber from '../../../components/Journey/JourneyDayScrubber'
import { dayColorOf, journeyDays } from '../../../components/Journey/journeyCard'
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
    hideSkeletons, setHideSkeletons,
    sidebarMapItems, tracks,
    dismissSuggestion, restoreSuggestions, openAtEntryId,
    loadJourney, updateEntry, deleteEntry, reorderEntries, uploadPhotos,
  } = useJourneyDetail()

  // The dock's FAB is a sibling of this screen: on the Gallery it becomes the
  // upload button, so it has to know which tab is open — and it stops knowing
  // when this screen goes away.
  const setMobileGalleryOpen = useJourneyStore(state => state.setMobileGalleryOpen)
  useEffect(() => {
    setMobileGalleryOpen(view === 'gallery')
    return () => setMobileGalleryOpen(false)
  }, [view, setMobileGalleryOpen])

  const mapRef = useRef<JourneyMapAutoHandle>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [activeIndex, setActiveIndex] = useState(0)

  // Stable identity: the scroll effect below re-attaches on every change and
  // would otherwise drop the pending settle timer on any unrelated render.
  const entries = useMemo(
    () => (current?.entries || []).filter(e => !hideSkeletons || e.type !== 'skeleton'),
    [current?.entries, hideSkeletons],
  )

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

  // Initial focus — give Leaflet time to initialise and fit bounds first. Opens on
  // today when today is part of the journey (see openAtEntryId), rather than always
  // at the first entry (discussion #2299).
  useEffect(() => {
    if (entries.length === 0) return
    const target = openAtEntryId ? entries.findIndex(e => String(e.id) === openAtEntryId) : -1
    const index = target === -1 ? 0 : target
    const timer = window.setTimeout(() => {
      setActiveIndex(index)
      syncMapToCard(index)
      if (index > 0) cardRefs.current.get(index)?.scrollIntoView({ inline: 'center', block: 'nearest' })
    }, 500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, openAtEntryId])

  const scrollCardIntoCenter = useCallback((idx: number) => {
    cardRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  const scrubberDays = useMemo(() => journeyDays(entries), [entries])

  /**
   * Move an entry within its day, from the entry sheet's header.
   *
   * Same rules as the desktop arrows: suggestions do not take part, because they
   * are the trip's order rather than the traveller's, and a day with one entry
   * has nothing to reorder. The whole day goes back to the server, which is what
   * the reorder endpoint expects.
   */
  const moveWithinDay = useCallback(async (entry: JourneyEntry, direction: -1 | 1) => {
    if (!current) return
    const sameDay = entries.filter(e => e.entry_date === entry.entry_date && e.type !== 'skeleton')
    const index = sameDay.findIndex(e => e.id === entry.id)
    const target = index + direction
    if (index === -1 || target < 0 || target >= sameDay.length) return
    const reordered = [...sameDay]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    try {
      await reorderEntries(current.id, reordered.map(e => e.id))
      await loadJourney(current.id)
    } catch {
      toast.error(t('common.errorTitle'))
    }
  }, [current, entries, reorderEntries, loadJourney, toast, t])

  /** Where in the day's run an entry sits, so the sheet knows which arrows to offer. */
  const dayNeighbours = useCallback((entry: JourneyEntry) => {
    const sameDay = entries.filter(e => e.entry_date === entry.entry_date && e.type !== 'skeleton')
    const index = sameDay.findIndex(e => e.id === entry.id)
    return { canMoveUp: index > 0, canMoveDown: index >= 0 && index < sameDay.length - 1 }
  }, [entries])

  /** The day bar lands on the first entry of that day. */
  const jumpToDay = useCallback((date: string) => {
    const idx = entries.findIndex(e => e.entry_date === date)
    if (idx === -1) return
    setActiveIndex(idx)
    syncMapToCard(idx)
    scrollCardIntoCenter(idx)
  }, [entries, scrollCardIntoCenter, syncMapToCard])

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
  // Whether the probe below has finished — not whether it found anything.
  const [providersReady, setProvidersReady] = useState(false)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [pickerProvider, setPickerProvider] = useState<string | null>(null)
  const dawarichEnabled = useAddonStore(state => state.isEnabled)('dawarich')
  const [dawarichOpen, setDawarichOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const openUpload = useCallback(() => {
    if (availableProviders.length > 0) setShowUploadMenu(true)
    else galleryFileRef.current?.click()
  }, [availableProviders.length])

  // The dock's FAB asks through the URL, the way every other "+" in the shell
  // does. The parameter is cleared straight away so going back does not reopen
  // the picker; the intent is held in state until the provider probe has
  // answered, because "device or Immich?" cannot be asked before we know
  // whether there is an Immich.
  const [params, setParams] = useSearchParams()
  const [pendingUpload, setPendingUpload] = useState(false)
  useEffect(() => {
    if (params.get('create') !== 'photo') return
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('create')
      return next
    }, { replace: true })
    if (!canEditEntries) return
    setView('gallery')
    setPendingUpload(true)
  }, [params, setParams, canEditEntries, setView])

  useEffect(() => {
    if (!pendingUpload || !providersReady) return
    setPendingUpload(false)
    openUpload()
  }, [pendingUpload, providersReady, openUpload])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const addonsData = await addonsApi.enabled()
        const enabled = (addonsData.addons || []).filter(
          (a: { type: string; enabled: boolean }) => a.type === 'photo_provider' && a.enabled,
        )
        const connected: { id: string; name: string }[] = []
        for (const p of enabled) {
          // The probes run one after another, so leaving the screen has to stop
          // the queue rather than let every remaining provider be asked anyway.
          if (!active) return
          try {
            // Same probe the desktop gallery uses, so a NAS cannot read as
            // connected on one surface and not the other.
            if ((await memoriesApi.status(p.id)).connected) connected.push({ id: p.id, name: p.name })
          } catch { /* provider stays hidden */ }
        }
        if (active) setAvailableProviders(connected)
      } catch { /* no providers */ }
      finally { if (active) setProvidersReady(true) }
    })()
    return () => { active = false }
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
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-ink" />
      </div>
    )
  }

  const gallery = current.gallery || []
  const dark = document.documentElement.classList.contains('dark')

  // The suggestions switch used to be desktop-only (#1848). It lives in the
  // header overflow sheet here, together with the settings entry, so the header
  // keeps a single "more" affordance.
  //
  // There is no book export here any more: the book is a Studio document now,
  // and Studio is a desktop editor. A phone-sized PDF of a book laid out for
  // print was the old export's answer to a question nobody was asking.
  const toggleSkeletons = async (next: boolean) => {
    setHideSkeletons(next)
    try {
      await journeyApi.updatePreferences(current.id, { hide_skeletons: next })
    } catch {
      /* cosmetic preference — the local flip stands until the next load */
    }
  }

  return (
    // h-dvh, not h-full: the shell stopped providing a definite height (#1809)
    // and a map on a percentage of an auto-height parent collapses to zero.
    <div className="relative h-dvh overflow-hidden">
      {/* Integrated map — always mounted, the gallery overlays it */}
      <div className="absolute inset-0 z-0">
        <JourneyMap
          ref={mapRef}
          checkins={[]}
          entries={sidebarMapItems}
          tracks={tracks}
          height={9999}
          dark={dark}
          activeMarkerId={entries[activeIndex] ? String(entries[activeIndex].id) : null}
          onMarkerClick={handleMarkerClick}
          fullScreen
          paddingBottom={250}
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

      {/* Header: back — segment — upload / overflow menu */}
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
          {/* Uploading lives on the dock's FAB while the Gallery is open — the
              one big action on the screen. A second button up here would be the
              same thing twice, so it only appears while an upload is running,
              as its progress. */}
          {view === 'gallery' && canEditEntries && uploading && (
            <span
              role="status"
              aria-label={t('common.upload')}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-m-act text-m-actfg shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)]"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowActionMenu(true)}
            aria-label={t('files.menu')}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_14px_-6px_rgba(0,0,0,.3)]"
          >
            <MoreHorizontal size={17} strokeWidth={2} />
          </button>
        </span>
      </div>

      {/* The stays Dawarich recorded for these dates, as candidate entries. Over
          the map rather than in the header: it belongs to what is on the map,
          and the header is already three controls wide on a phone. Sits above
          the card rail so it never covers the card somebody is reading. */}
      {dawarichEnabled && canEditEntries && view === 'timeline' && (
        <button
          type="button"
          onClick={() => setDawarichOpen(true)}
          aria-label={t('dawarich.suggestions.title')}
          className="absolute right-4 z-[9] flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] shadow-[0_6px_18px_-8px_rgba(0,0,0,.35)] bottom-[calc(var(--bottom-nav-h,84px)+16px+128px)]"
        >
          <DawarichIcon size={46} />
        </button>
      )}

      {dawarichOpen && current && (
        <MSheet open onClose={() => setDawarichOpen(false)} variant="bottom" material="glass" ariaLabel={t('dawarich.suggestions.title')}>
          <div className="flex max-h-[82dvh] min-h-0 flex-col">
            <FormSheetHeader
              leading={
                <span className="flex h-10 w-10 flex-none overflow-hidden rounded-[13px]">
                  <DawarichIcon size={40} />
                </span>
              }
              title={t('dawarich.suggestions.title')}
              onClose={() => setDawarichOpen(false)}
              closeLabel={t('common.close')}
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-4">
              {/* Journal entries and nothing else: a journey is for writing, and
                  the trip planner already offers the same stay as a place. */}
              <DawarichSuggestionsPanel
                bare
                journals={[{ id: current.id, label: current.title }]}
                onAccepted={() => { void loadJourney(current.id) }}
              />
            </div>
          </div>
        </MSheet>
      )}

      {/* Day bar + horizontal card timeline. The dock is a floating pill 62px tall
          inside the 84px the variable reserves, so +16 left a band of map doing
          nothing between the cards and it; two pixels keeps a hair of daylight and
          gives the strip the rest. */}
      {view === 'timeline' && entries.length > 0 && (
        <div className="absolute left-0 right-0 z-[8] bottom-[calc(var(--bottom-nav-h,84px)+2px)]">
        <JourneyDayScrubber
          days={scrubberDays}
          activeDate={entries[activeIndex]?.entry_date ?? null}
          onPick={jumpToDay}
        />
        <div
          ref={carouselRef}
          className="flex items-end gap-[10px] overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              ref={node => { if (node) cardRefs.current.set(i, node); else cardRefs.current.delete(i) }}
              style={{ scrollSnapAlign: 'center' }}
            >
              <JourneyEntryCover
                entry={entry}
                dayColor={dayColorOf(scrubberDays, entry.entry_date)}
                isActive={i === activeIndex}
                onClick={() => handleCardTap(entry, i)}
                showMood={current.show_mood !== 0}
                showWeather={current.show_weather !== 0}
                tone="mobile"
              />
            </div>
          ))}
        </div>
        </div>
      )}

      <input ref={galleryFileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleGalleryUpload} />

      {/* Upload source chooser (device / providers) */}
      {/* Opaque, not the glass default: these two sit over a full-screen map whose
          card carousel is bright and busy, and the frosted material let the titles
          behind read straight through the menu. */}
      <MSheet open={showUploadMenu} onClose={() => setShowUploadMenu(false)} variant="bottom" material="opaque" ariaLabel={t('common.upload')}>
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

      {/* Journey actions: book export, suggestions switch, settings */}
      <MSheet open={showActionMenu} onClose={() => setShowActionMenu(false)} variant="bottom" material="opaque" ariaLabel={t('files.menu')}>
        <div className="flex flex-col gap-1 p-[10px]">
          <div className="flex items-center gap-[11px] px-[10px] py-[11px]">
            <EyeOff size={16} strokeWidth={2} className="flex-none text-m-muted" />
            <span className="min-w-0 flex-1 truncate text-[0.84375rem] font-semibold">{t('journey.skeletons.hide')}</span>
            <MToggle checked={hideSkeletons} onChange={toggleSkeletons} ariaLabel={t('journey.skeletons.hide')} />
          </div>
          {canEditJourney && (
            <MListRow
              icon={Settings2}
              label={t('journey.settings.title')}
              onClick={() => { setShowActionMenu(false); setShowSettings(true) }}
            />
          )}
        </div>
      </MSheet>

      {/* Entry sheet (new / edit / read-only) */}
      {editingEntry && (
        <MJourneyEntrySheet
          entry={editingEntry}
          galleryPhotos={gallery}
          quickCapture={editingEntry.id === 0}
          readOnly={!canEditEntries}
          showVerdict={current.show_verdict !== 0}
          showMood={current.show_mood !== 0}
          showWeather={current.show_weather !== 0}
          userId={useAuthStore.getState().user?.id || 0}
          trips={current.trips}
          onMoveEarlier={
            canEditEntries && editingEntry.id !== 0 && editingEntry.type !== 'skeleton' && dayNeighbours(editingEntry).canMoveUp
              ? () => { void moveWithinDay(editingEntry, -1) }
              : undefined
          }
          onMoveLater={
            canEditEntries && editingEntry.id !== 0 && editingEntry.type !== 'skeleton' && dayNeighbours(editingEntry).canMoveDown
              ? () => { void moveWithinDay(editingEntry, 1) }
              : undefined
          }
          onDismiss={
            canEditEntries && editingEntry.type === 'skeleton' && editingEntry.id !== 0
              ? () => { setEditingEntry(null); void dismissSuggestion(editingEntry) }
              : undefined
          }
          onClose={() => setEditingEntry(null)}
          onSave={async (data, existingEntryId) => {
            // existingEntryId is what the sheet already persisted in an earlier
            // save attempt — without it a retry would create a second entry.
            const currentEntryId = existingEntryId ?? editingEntry.id
            let entryId = currentEntryId
            if (currentEntryId === 0) {
              const created = await useJourneyStore.getState().createEntry(current.id, data)
              entryId = created.id
            } else {
              await updateEntry(currentEntryId, data)
            }
            return entryId
          }}
          onUploadPhotos={uploadPhotos}
          onAddProviderPhotos={async (entryId, group) => {
            await journeyApi.addProviderPhotos(entryId, group.provider, group.assetIds, undefined, group.passphrase, group.mediaTypes)
          }}
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
          onRestoreSuggestions={canEditEntries ? restoreSuggestions : undefined}
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
