import { useAuthStore } from '../store/authStore'
import { journeyApi } from '../api/client'
import Navbar from '../components/Layout/Navbar'
import JourneyMap from '../components/Journey/JourneyMapAuto'
import { DAY_COLORS } from '../components/Journey/dayColors'
import PhotoLightbox from '../components/Journey/PhotoLightbox'
import ContributorInviteDialog from '../components/Journey/ContributorInviteDialog'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import EmptyState from '../components/shared/EmptyState'
import { Outlet } from 'react-router'
import {
  ArrowLeft, MoreHorizontal, List, Grid, MapPin,
  Plus, ChevronUp, ChevronDown, Eye, EyeOff, BookOpen,
} from 'lucide-react'
import MobileMapTimeline from '../components/Journey/MobileMapTimeline'
import MobileEntryView from '../components/Journey/MobileEntryView'
import { useJourneyStore } from '../store/journeyStore'
import { computeJourneyLifecycle } from '../utils/journeyLifecycle'
import { useJourneyDetail } from './journeyDetail/useJourneyDetail'
import { createDraftJourneyEntry, pickGradient, groupByDate, formatDate, photoUrl } from './journeyDetail/JourneyDetailPage.helpers'
import { EntryCard, SkeletonCard, CheckinCard } from '../components/Journey/JourneyDetailPageEntryCard'
import { GalleryView } from '../components/Journey/JourneyDetailPageGalleryView'
import { EntryEditor } from '../components/Journey/JourneyDetailPageEntryEditor'
import { AddTripDialog } from '../components/Journey/JourneyDetailPageAddTripDialog'
import { JourneySettingsDialog } from '../components/Journey/JourneyDetailPageSettingsDialog'

export default function JourneyDetailPage() {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <JourneyDetailPageDesktop />
}

function JourneyDetailPageDesktop() {
  // Page = wiring container: load + live sync, view state, dialogs, the
  // scroll-synced map and the map/trip-date derivations live in the hook.
  const {
    id, navigate, toast, t, locale,
    openStudio, prefetchStudio,
    current, loading,
    canEditEntries, canEditJourney, myRole,
    view, setView, activeEntryId, setActiveEntryId, feedRef,
    viewingEntry, setViewingEntry, editingEntry, setEditingEntry,
    lightbox, setLightbox, deleteTarget, setDeleteTarget,
    showInvite, setShowInvite, showAddTrip, setShowAddTrip,
    unlinkTrip, setUnlinkTrip, showSettings, setShowSettings,
    hideSkeletons, setHideSkeletons,
    mapRef, fullMapRef, galleryUploadRef, activeLocationId, handleMarkerClick, handleLocationClick,
    mapEntries, sidebarMapItems, tripDates, isMobile, tracks,
    feedEdge, scrollFeedTo,
    loadJourney, updateEntry, deleteEntry, reorderEntries, uploadPhotos, deletePhoto,
  } = useJourneyDetail()

  if (loading || !current) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div style={{ paddingTop: 'var(--nav-h, 0px)' }} className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const timelineEntries = current.entries.filter(e => (!hideSkeletons || e.type !== 'skeleton'))
  const dayGroups = groupByDate(timelineEntries)
  const sortedDates = [...dayGroups.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  const tripDateMin = current.trips.length
    ? current.trips.reduce((min: string, t: any) => t.start_date && (!min || t.start_date < min) ? t.start_date : min, '')
    : null
  const tripDateMax = current.trips.length
    ? current.trips.reduce((max: string, t: any) => t.end_date && (!max || t.end_date > max) ? t.end_date : max, '')
    : null
  const lifecycle = computeJourneyLifecycle(current.status, tripDateMin || null, tripDateMax || null)

  const showMobileCombined = isMobile && view === 'timeline'
  const showMobileGallery = isMobile && view === 'gallery'
  const isMobileChromeless = showMobileCombined || showMobileGallery

  // Below 1024px the hero is gone, so its actions have to live in the floating
  // bar instead — they were unreachable there until #1848. Only one of the two
  // hosts is mounted at a time, so both can carry the same labels.
  const toggleSkeletons = async () => {
    const next = !hideSkeletons
    setHideSkeletons(next)
    await journeyApi.updatePreferences(current.id, { hide_skeletons: next })
  }
  const skeletonLabel = hideSkeletons ? t('journey.skeletons.show') : t('journey.skeletons.hide')
  const barButton = 'w-10 h-10 flex-shrink-0 rounded-lg bg-surface-elevated backdrop-blur-lg border border-edge shadow-lg text-content-secondary flex items-center justify-center hover:bg-surface-hover active:scale-95 transition-transform'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Mobile combined map+timeline (Polarsteps-style) — renders as fullscreen overlay */}
      {showMobileCombined && (
        <MobileMapTimeline
          entries={timelineEntries}
          mapEntries={sidebarMapItems}
          tracks={tracks}
          dark={document.documentElement.classList.contains('dark')}
          readOnly={!canEditEntries}
          onEntryClick={(entry) => setViewingEntry(entry)}
          onAddEntry={canEditEntries ? () => {
            setEditingEntry(createDraftJourneyEntry(current.id))
          } : undefined}
        />
      )}

      {/* Fullscreen entry view (mobile) */}
      {viewingEntry && (
        <MobileEntryView
          entry={viewingEntry}
          readOnly={!canEditEntries}
          onClose={() => setViewingEntry(null)}
          onEdit={() => { setViewingEntry(null); setEditingEntry(viewingEntry); }}
          onDelete={() => { setViewingEntry(null); setDeleteTarget(viewingEntry); }}
          onPhotoClick={(photos, idx) => setLightbox({ photos: photos.map(p => ({ id: p.id, src: photoUrl(p, 'original'), caption: p.caption, provider: p.provider, asset_id: p.asset_id, owner_id: p.owner_id, mediaType: p.media_type })), index: idx })}
        />
      )}

      {/* Floating top bar on mobile Journey + Gallery views:
          back | tabs+title | book export, suggestions, settings */}
      {isMobileChromeless && (
        <div
          className="fixed left-0 right-0 z-30 flex items-start justify-between gap-2 px-4"
          style={{ top: 'calc(var(--nav-h, 56px) + 12px)' }}
        >
          <button type="button"
            onClick={() => navigate('/journey')}
            aria-label={t('journey.detail.backToJourney')}
            className={barButton}
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0 flex justify-center">
            <div className="flex bg-surface-elevated backdrop-blur-lg border border-edge rounded-lg overflow-hidden shadow-lg">
              <button type="button"
                onClick={() => setView('timeline')}
                className={`flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium ${
                  view === 'timeline'
                    ? 'bg-inverse text-inverse-text'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                <MapPin size={13} />
                {t('journey.detail.journeyTab') || 'Journey'}
              </button>
              <button type="button"
                onClick={() => setView('gallery')}
                className={`flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium ${
                  view === 'gallery'
                    ? 'bg-inverse text-inverse-text'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                <Grid size={13} />
                {t('journey.share.gallery')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button"
              onClick={openStudio}
              onMouseEnter={prefetchStudio}
              aria-label={t('journey.studio.openAria')}
              className={barButton}
            >
              <BookOpen size={16} />
            </button>
            <button type="button"
              onClick={toggleSkeletons}
              aria-label={skeletonLabel}
              className={`${barButton} ${hideSkeletons ? 'bg-surface-selected' : ''}`}
            >
              {hideSkeletons ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {canEditJourney && (
              <button type="button"
                onClick={() => setShowSettings(true)}
                aria-label={t('journey.settings.title')}
                className={barButton}
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ paddingTop: 'var(--nav-h, 0px)' }} className={showMobileCombined ? 'hidden' : ''}>
        <div
          className={
            isMobile
              ? 'max-w-[1440px] mx-auto px-0 pt-0'
              : 'flex w-full max-w-[1800px] mx-auto overflow-hidden'
          }
          style={!isMobile ? { height: 'calc(100dvh - var(--nav-h, 56px))' } : undefined}
        >
          {/* LEFT column (full width on mobile, scrollable feed on desktop) */}
          <div
            ref={feedRef}
            className={
              isMobile
                ? ''
                : 'flex-1 overflow-y-auto journey-feed-scroll'
            }
          >
            <div className={isMobile ? '' : 'w-full px-8 py-6'}>

          {/* Hero card — dropped on mobile gallery/journey views (floating top bar
              handles branding there). Unmounted rather than `hidden`, so its
              actions don't sit in the DOM as a second, invisible copy (#1848). */}
          {!isMobileChromeless && (
          <div className="px-4 md:px-0 mb-6">
            <div className="rounded-none md:rounded-[28px] -mx-4 md:mx-0 overflow-hidden relative p-5 md:p-7" style={{ background: pickGradient(current.id), color: 'white' }}>
                {current.cover_image && (
                  <>
                    <div className="absolute inset-0 z-[1]">
                      <img src={`/uploads/${current.cover_image}`} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0" style={{ background: pickGradient(current.id), opacity: 0.28 }} />
                    </div>
                    {/* Frosted-left depth (own layer so nothing re-rasterizes it) */}
                    <div className="absolute inset-0 pointer-events-none z-[2]" style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 66%)', WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 66%)', transform: 'translateZ(0)' }} />
                  </>
                )}
                <div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: 'linear-gradient(120deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 45%, transparent 72%), linear-gradient(0deg, rgba(0,0,0,0.42) 0%, transparent 55%)' }} />

                <div className="relative z-[3] flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => navigate('/journey')}
                      aria-label={t('journey.detail.backToJourney')}
                      className="w-[34px] h-[34px] rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    {/* Status badge — keep completed/upcoming/draft/archived, but drop live + synced-with-trips per UX trim */}
                    <div className="hidden md:flex items-center gap-2">
                      {lifecycle !== 'live' && lifecycle !== 'archived' && (
                        <div className="inline-flex h-[34px] items-center gap-1.5 px-3.5 bg-white/[0.12] backdrop-blur border border-white/15 rounded-full text-[11px] font-medium">
                          {t(`journey.status.${lifecycle === 'upcoming' ? 'upcoming' : lifecycle === 'draft' ? 'draft' : 'completed'}`)}
                        </div>
                      )}
                      {lifecycle === 'archived' && (
                        <div className="inline-flex h-[34px] items-center gap-1.5 px-3.5 bg-white/[0.12] backdrop-blur border border-white/15 rounded-full text-[11px] font-medium">
                          {t('journey.status.archived')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button"
                      onClick={openStudio}
                      onMouseEnter={prefetchStudio}
                      className="inline-flex h-[34px] items-center gap-1.5 px-3.5 rounded-full bg-white/15 backdrop-blur border border-white/15 text-[12px] font-semibold hover:bg-white/25"
                    >
                      <BookOpen size={14} />
                      {t('journey.studio.open')}
                    </button>
                    <div className="relative group">
                      <button type="button"
                        onClick={toggleSkeletons}
                        aria-label={skeletonLabel}
                        className={`w-[34px] h-[34px] rounded-full backdrop-blur flex items-center justify-center ${hideSkeletons ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'}`}
                      >
                        {hideSkeletons ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <span className="absolute top-full mt-2 right-0 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                        {skeletonLabel}
                      </span>
                    </div>
                    {canEditJourney && (
                      <button type="button" onClick={() => setShowSettings(true)} aria-label={t('journey.settings.title')} className="w-[34px] h-[34px] rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25"><MoreHorizontal size={14} /></button>
                    )}
                  </div>
                </div>

                <div className="relative z-[3] mb-5">
                  <h1 className="text-[32px] font-bold tracking-[-0.02em] leading-tight mb-1.5">{current.title}</h1>
                  {current.subtitle && <p className="text-[13px] opacity-85">{current.subtitle}</p>}
                </div>

                <div className="relative z-[3]">
                  <div className="inline-flex items-center gap-7 md:gap-9" style={{ padding: '13px 26px', borderRadius: 18, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {[
                      { value: sortedDates.length, label: t('journey.stats.days') },
                      { value: current.stats.places, label: t('journey.stats.places') },
                      { value: current.stats.entries, label: t('journey.stats.entries') },
                      { value: current.stats.photos, label: t('journey.stats.photos') },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col gap-0.5">
                        <span style={{ fontFamily: 'var(--font-subtext)', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{s.value}</span>
                        <span className="uppercase" style={{ fontSize: 9.5, letterSpacing: '0.1em', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
          )}

          {/* Main content (was a 2-col grid with right-sidebar panels;
              now single column inside the left feed — right pane is a
              sticky fullscreen map further below). */}
          <div className={isMobile ? 'px-4' : ''}>
            <div>
              {/* View Controls — hidden on mobile (floating top bar has them) */}
              <div className={`flex items-center justify-between mt-5 mb-5 ${isMobileChromeless ? 'hidden' : ''}`}>
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'var(--vg-surf2)', border: '1px solid var(--vg-line)' }}>
                  {(isMobile
                    ? [
                        { id: 'timeline' as const, icon: MapPin, label: t('journey.detail.journeyTab') || 'Journey' },
                        { id: 'gallery' as const, icon: Grid, label: t('journey.share.gallery') },
                      ]
                    : [
                        { id: 'timeline' as const, icon: List, label: t('journey.share.timeline') },
                        { id: 'gallery' as const, icon: Grid, label: t('journey.share.gallery') },
                      ]
                  ).map(v => (
                    <button type="button"
                      key={v.id}
                      onClick={() => setView(v.id)}
                      className="flex items-center gap-1.5 px-3.5 py-[6px] text-[12px] font-semibold rounded-full transition-colors"
                      style={view === v.id
                        ? { background: 'var(--vg-ink)', color: 'var(--vg-bg)' }
                        : { color: 'var(--vg-ink3)' }}
                    >
                      <v.icon size={13} />
                      {v.label}
                    </button>
                  ))}
                </div>
                {canEditEntries && view === 'timeline' && (
                  <button type="button"
                    onClick={() => {
                      setEditingEntry(createDraftJourneyEntry(current.id))
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                    style={{ background: 'var(--vg-ink)', color: 'var(--vg-bg)' }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    {t('journey.detail.addEntry')}
                  </button>
                )}
                {canEditEntries && view === 'gallery' && (
                  <button type="button"
                    onClick={() => galleryUploadRef.current?.()}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                    style={{ background: 'var(--vg-ink)', color: 'var(--vg-bg)' }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    {t('common.upload')}
                  </button>
                )}
              </div>

              {/* Timeline (desktop only — mobile uses fullscreen combined view above) */}
              {!isMobile && (
                <div className={`flex flex-col gap-6 pb-24 md:pb-6${view === 'timeline' ? '' : ' hidden'}`}>
                  {sortedDates.length === 0 && (
                    <EmptyState scene="journey" title={t('journey.detail.noEntries')} />
                  )}

                  {sortedDates.map((date, dayIdx) => {
                    const entries = dayGroups.get(date)!
                    const fd = formatDate(date, locale)
                    const locations = [...new Set(entries.map(e => e.location_name).filter(Boolean))]

                    return (
                      <div key={date} className="flex flex-col gap-3 trek-stagger">
                        <div className="backdrop-blur border-y md:border rounded-none md:rounded-2xl -mx-4 md:mx-0 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--vg-surf)', borderColor: 'var(--vg-line)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white" style={{ background: DAY_COLORS[dayIdx % DAY_COLORS.length], boxShadow: `0 5px 14px -4px ${DAY_COLORS[dayIdx % DAY_COLORS.length]}` }}>
                              {dayIdx + 1}
                            </div>
                            <h3 className="text-[14px] font-semibold capitalize" style={{ color: 'var(--vg-ink)' }}>{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.07em]" style={{ background: 'var(--vg-surf2)', color: 'var(--vg-ink3)' }}><MapPin size={12} /> {entries.length} {t('journey.synced.places')}</span>
                        </div>

                        {entries.map((entry, idx) => {
                          // Skeletons are just "suggested" places pulled
                          // from the linked trip — they aren't real
                          // journey entries until the user edits them,
                          // so reordering them does not make sense.
                          const canReorder = !isMobile && canEditEntries && entries.length > 1 && entry.type !== 'skeleton'
                          const move = (direction: -1 | 1) => {
                            if (!current) return
                            const target = idx + direction
                            if (target < 0 || target >= entries.length) return
                            const reordered = [...entries]
                            const [moved] = reordered.splice(idx, 1)
                            reordered.splice(target, 0, moved)
                            reorderEntries(current.id, reordered.map(e => e.id))
                              .catch(() => toast.error(t('common.errorOccurred')))
                          }
                          return (
                            <div key={entry.id} data-entry-id={String(entry.id)} className={`relative ${canReorder ? 'flex items-stretch gap-2' : ''}`} onMouseEnter={() => { setActiveEntryId(String(entry.id)); mapRef.current?.highlightMarker(String(entry.id)) }} style={String(entry.id) === activeEntryId ? { outline: `2px solid ${DAY_COLORS[dayIdx % DAY_COLORS.length]}`, outlineOffset: '3px', borderRadius: '12px' } : undefined}>
                              {canReorder && (
                                <div className="flex flex-col gap-1 justify-center flex-shrink-0 py-1">
                                  <button
                                    type="button"
                                    onClick={() => move(-1)}
                                    disabled={idx === 0}
                                    aria-label="Move up"
                                    className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => move(1)}
                                    disabled={idx === entries.length - 1}
                                    aria-label="Move down"
                                    className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                              )}
                              <div className={canReorder ? 'flex-1 min-w-0' : ''}>
                                {entry.type === 'skeleton' ? (
                                  <SkeletonCard entry={entry} onClick={canEditEntries ? () => setEditingEntry(entry) : undefined} />
                                ) : entry.type === 'checkin' ? (
                                  <CheckinCard entry={entry} onClick={canEditEntries ? () => setEditingEntry(entry) : undefined} />
                                ) : (
                                  <EntryCard
                                    entry={entry}
                                    readOnly={!canEditEntries}
                                    onEdit={() => setEditingEntry(entry)}
                                    onDelete={() => setDeleteTarget(entry)}
                                    onPhotoClick={(photos, idx) => setLightbox({ photos: photos.map(p => ({ id: p.id, src: photoUrl(p, 'original'), caption: p.caption, provider: p.provider, asset_id: p.asset_id, owner_id: p.owner_id, mediaType: p.media_type })), index: idx })}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Gallery View — mobile gets extra top padding so the floating top bar doesn't overlap */}
              <div
                className={view === 'gallery' ? '' : 'hidden'}
                style={showMobileGallery ? { paddingTop: 'calc(var(--nav-h, 56px) + 64px)' } : undefined}
              >
                <GalleryView
                  onRegisterUpload={(fn) => { galleryUploadRef.current = fn }}
                  entries={current.entries}
                  gallery={current.gallery || []}
                  journeyId={current.id}
                  userId={useAuthStore.getState().user?.id || 0}
                  trips={current.trips}
                  onPhotoClick={(photos, idx) => setLightbox({ photos: photos.map(p => ({ id: p.id, src: photoUrl(p, 'original'), caption: p.caption ?? null, provider: p.provider, asset_id: p.asset_id, owner_id: p.owner_id, mediaType: p.media_type })), index: idx })}
                  onRefresh={() => loadJourney(Number(id))}
                />
              </div>

              {/* Jump to the top (where adding lives) and back to the last entry
                  (where reading left off) — #1088. Centred over the feed and
                  clear of both edges: the right one belongs to the Add Entry
                  buttons, the left to the reorder arrows. Zero-height sticky box
                  so it rides the scroll without taking layout space, and each
                  half appears only when there is somewhere to go. */}
              {!isMobile && (!feedEdge.atTop || !feedEdge.atBottom) && (
                <div className="sticky bottom-0 z-20 h-0 pointer-events-none">
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-auto">
                    {!feedEdge.atTop && (
                      <button type="button"
                        onClick={() => scrollFeedTo('top')}
                        aria-label={t('journey.detail.jumpToTop')}
                        title={t('journey.detail.jumpToTop')}
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                        style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)', color: 'var(--vg-ink)' }}
                      >
                        <ChevronUp size={16} strokeWidth={2.4} />
                      </button>
                    )}
                    {!feedEdge.atBottom && (
                      <button type="button"
                        onClick={() => scrollFeedTo('bottom')}
                        aria-label={t('journey.detail.jumpToLast')}
                        title={t('journey.detail.jumpToLast')}
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:translate-y-0.5"
                        style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)', color: 'var(--vg-ink)' }}
                      >
                        <ChevronDown size={16} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
            </div>
          </div>

          {/* RIGHT column on desktop — sticky rounded map (polarsteps-style).
              Hidden on mobile; mobile gets its own chromeless combined view. */}
          {!isMobile && (
            <aside className="w-[44%] max-w-[820px] min-w-[420px] pt-6 pr-4 pb-4 pl-0">
              <div className="h-full rounded-[22px] overflow-hidden shadow-sm" style={{ border: '1px solid var(--vg-line)' }}>
                <JourneyMap
                  ref={mapRef}
                  checkins={[]}
                  entries={sidebarMapItems as any}
                  tracks={tracks}
                  height={9999}
                  activeMarkerId={activeEntryId}
                  onMarkerClick={handleMarkerClick}
                  fullScreen
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Entry Editor */}
      {editingEntry && (
        <EntryEditor
          entry={editingEntry}
          journeyId={current.id}
          tripDates={tripDates}
          trips={current.trips}
          galleryPhotos={current.gallery || []}
          userId={useAuthStore.getState().user?.id || 0}
          onClose={() => setEditingEntry(null)}
          onSave={async (data, existingEntryId) => {
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
          onUploadPhotos={async (entryId, files, cbs) => {
            return await uploadPhotos(entryId, files, cbs)
          }}
          onAddProviderPhotos={async (entryId, group) => {
            await journeyApi.addProviderPhotos(entryId, group.provider, group.assetIds, undefined, group.passphrase, group.mediaTypes)
          }}
          onDone={() => {
            setEditingEntry(null)
            loadJourney(Number(id))
          }}
        />
      )}

      {/* Journey Settings */}
      {showSettings && (
        <JourneySettingsDialog
          journey={current}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); loadJourney(Number(id)) }}
          onOpenInvite={() => { setShowInvite(true) }}
          onRefresh={() => loadJourney(Number(id))}
        />
      )}

      {/* Add Trip Dialog */}
      {showAddTrip && current && (
        <AddTripDialog
          journeyId={current.id}
          existingTripIds={current.trips.map((t: any) => t.trip_id)}
          onClose={() => setShowAddTrip(false)}
          onAdded={() => { setShowAddTrip(false); loadJourney(Number(id)) }}
        />
      )}

      {/* Contributor Invite Dialog */}
      {showInvite && (
        <ContributorInviteDialog
          journeyId={current.id}
          existingUserIds={current.contributors.map((c: any) => c.user_id)}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadJourney(Number(id)) }}
        />
      )}

      {/* Delete confirm */}
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
        message={t('journey.deleteConfirmMessage', { title: deleteTarget?.title || 'this entry' })}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Unlink Trip confirm */}
      <ConfirmDialog
        isOpen={!!unlinkTrip}
        onClose={() => setUnlinkTrip(null)}
        onConfirm={async () => {
          if (!unlinkTrip || !current) return
          try {
            await journeyApi.removeTrip(current.id, unlinkTrip.trip_id)
            toast.success(t('journey.trips.tripUnlinked'))
            setUnlinkTrip(null)
            loadJourney(Number(id))
          } catch {
            toast.error(t('journey.trips.unlinkFailed'))
          }
        }}
        title={t('journey.trips.unlinkTrip')}
        message={t('journey.trips.unlinkMessage', { title: unlinkTrip?.title })}
        confirmLabel={t('journey.trips.unlink')}
        danger
      />

      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos.map(p => ({ id: p.id.toString(), src: p.src, caption: p.caption, provider: p.provider, asset_id: p.asset_id, owner_id: p.owner_id, mediaType: p.mediaType }))}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* TREK Studio. It portals itself over the page, so this journey keeps
          rendering underneath and shows through the panel's margin. */}
      <Outlet />
    </div>
  )
}
