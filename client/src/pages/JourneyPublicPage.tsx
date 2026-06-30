import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import {
  List, Grid, MapPin, Camera, BookOpen, Image, Clock, Play,
  Laugh, Smile, Meh, Frown,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake,
  ThumbsUp, ThumbsDown,
} from 'lucide-react'
import JourneyMap from '../components/Journey/JourneyMap'
import JournalBody from '../components/Journey/JournalBody'
import PhotoLightbox from '../components/Journey/PhotoLightbox'
import MobileMapTimeline from '../components/Journey/MobileMapTimeline'
import MobileEntryView from '../components/Journey/MobileEntryView'
import { formatLocationName } from '../utils/formatters'
import { DAY_COLORS } from '../components/Journey/dayColors'
import { useJourneyPublic } from './journeyPublic/useJourneyPublic'

const MOOD_CONFIG: Record<string, { icon: typeof Smile; label: string; bg: string; text: string }> = {
  amazing: { icon: Laugh,  label: 'Amazing', bg: 'bg-pink-50 dark:bg-pink-900/20',   text: 'text-pink-600 dark:text-pink-400' },
  good:    { icon: Smile,  label: 'Good',    bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400' },
  neutral: { icon: Meh,    label: 'Neutral', bg: 'bg-zinc-100 dark:bg-zinc-800',       text: 'text-zinc-500 dark:text-zinc-400' },
  rough:   { icon: Frown,  label: 'Rough',   bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
}

const WEATHER_CONFIG: Record<string, { icon: typeof Sun; label: string }> = {
  sunny:  { icon: Sun,             label: 'Sunny' },
  partly: { icon: CloudSun,        label: 'Partly cloudy' },
  cloudy: { icon: Cloud,           label: 'Cloudy' },
  rainy:  { icon: CloudRain,       label: 'Rainy' },
  stormy: { icon: CloudLightning,  label: 'Stormy' },
  cold:   { icon: Snowflake,       label: 'Cold' },
}

function photoUrl(p: { photo_id: number }, shareToken: string, kind: 'thumbnail' | 'original' = 'original'): string {
  return `/api/public/journey/${shareToken}/photos/${p.photo_id}/${kind}`
}

function formatDate(d: string, locale?: string): { weekday: string; month: string; day: number } {
  const date = new Date(d + 'T00:00:00')
  return {
    weekday: date.toLocaleDateString(locale || 'en', { weekday: 'long' }),
    month: date.toLocaleDateString(locale || 'en', { month: 'long' }),
    day: date.getDate(),
  }
}

export default function JourneyPublicPage() {
  const { t } = useTranslation()
  // Page = wiring container: the share fetch, view state and all timeline/map
  // derivations live in the hook; the render helpers below stay next to the JSX.
  const {
    token, data, loading, error, isMobile, locale,
    view, setView, lightbox, setLightbox, showLangPicker, setShowLangPicker,
    mapRef, activeEntryId, setActiveEntryId, viewingEntry, setViewingEntry, handleMarkerClick,
    perms, journey, stats,
    timelineEntries, groupedEntries, sortedDates, sidebarMapItems, allPhotos,
    desktopTwoColumn,
  } = useJourneyPublic()

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t('journey.public.notFound')}</h1>
          <p className="text-zinc-500">{t('journey.public.notFoundMessage')}</p>
        </div>
      </div>
    )
  }

  // In desktop two-column mode the map is always visible — exclude the standalone 'map' tab
  const availableViews = [
    perms.share_timeline && { id: 'timeline' as const, icon: List, label: t('journey.share.timeline') },
    perms.share_gallery && { id: 'gallery' as const, icon: Grid, label: t('journey.share.gallery') },
    !desktopTwoColumn && !isMobile && perms.share_map && { id: 'map' as const, icon: MapPin, label: t('journey.share.map') },
  ].filter(Boolean) as { id: 'timeline' | 'gallery' | 'map'; icon: any; label: string }[]

  // Shared timeline renderer used in both layout modes
  const renderTimeline = () => (
    <div className="flex flex-col gap-6">
      {sortedDates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-zinc-400" />
          </div>
          <p className="text-[15px] font-medium text-zinc-700 dark:text-zinc-300">No entries yet</p>
        </div>
      )}
      {sortedDates.map((date, dayIdx) => {
        const dayEntries = groupedEntries.get(date)!
        const fd = formatDate(date, locale)
        const dayColor = DAY_COLORS[dayIdx % DAY_COLORS.length]
        return (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                style={{ background: dayColor }}
              >
                {dayIdx + 1}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-white">{fd.weekday}</div>
                <div className="text-[11px] text-zinc-500">{fd.month} {fd.day}</div>
              </div>
            </div>

            {/* Entries */}
            <div className="flex flex-col gap-4 pl-[52px]">
              {dayEntries.map(entry => {
                const photos = entry.photos || []
                const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null
                const weather = entry.weather ? WEATHER_CONFIG[entry.weather] : null
                const prosArr = entry.pros_cons?.pros ?? []
                const consArr = entry.pros_cons?.cons ?? []
                const hasProscons = prosArr.length > 0 || consArr.length > 0
                const lightboxPhotos = photos.map(p => ({ id: String(p.id), src: photoUrl(p, token!, 'original'), caption: p.caption, mediaType: (p as any).media_type }))

                const isActive = activeEntryId === String(entry.id)
                return (
                  <div
                    key={entry.id}
                    data-entry-id={String(entry.id)}
                    onMouseEnter={() => {
                      if (!desktopTwoColumn) return
                      setActiveEntryId(String(entry.id))
                      mapRef.current?.highlightMarker(String(entry.id))
                    }}
                    style={isActive && desktopTwoColumn ? { outline: `2px solid ${dayColor}`, outlineOffset: '3px', borderRadius: '16px' } : undefined}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">

                    {/* Photo area */}
                    {photos.length === 1 && (
                      <div className="relative cursor-pointer" onClick={() => setLightbox({ photos: lightboxPhotos, index: 0 })}>
                        <img src={photoUrl(photos[0], token!)} className="w-full h-64 object-cover" alt="" />
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)', height: '65%' }} />
                        {entry.location_name && (
                          <div className="absolute top-3 left-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white">
                              <MapPin size={10} className="flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{formatLocationName(entry.location_name)}</span>
                            </span>
                          </div>
                        )}
                        {entry.title && (
                          <div className="absolute bottom-4 left-5 right-5 pointer-events-none">
                            <h3 className="text-[18px] font-bold text-white drop-shadow-sm leading-tight">{entry.title}</h3>
                          </div>
                        )}
                      </div>
                    )}

                    {photos.length === 2 && (
                      <div className="grid grid-cols-2 gap-0.5 overflow-hidden">
                        {photos.slice(0, 2).map((p, i) => (
                          <img
                            key={p.id}
                            src={photoUrl(p, token!, 'thumbnail')}
                            alt=""
                            className="w-full h-52 object-cover cursor-pointer"
                            onClick={() => setLightbox({ photos: lightboxPhotos, index: i })}
                          />
                        ))}
                      </div>
                    )}

                    {photos.length >= 3 && (
                      <div className="overflow-hidden flex" style={{ height: 280, gap: 2 }}>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLightbox({ photos: lightboxPhotos, index: 0 })}>
                          <img src={photoUrl(photos[0], token!, 'thumbnail')} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 2 }}>
                          <div className="flex-1 min-h-0 cursor-pointer" onClick={() => setLightbox({ photos: lightboxPhotos, index: 1 })}>
                            <img src={photoUrl(photos[1], token!, 'thumbnail')} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-h-0 relative cursor-pointer" onClick={() => setLightbox({ photos: lightboxPhotos, index: 2 })}>
                            <img src={photoUrl(photos[2], token!, 'thumbnail')} alt="" className="w-full h-full object-cover" />
                            {photos.length > 3 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-[13px] font-semibold flex items-center gap-1">
                                  <Image size={13} /> +{photos.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="px-5 pt-4 pb-5 cursor-pointer" onClick={() => setViewingEntry(entry)}>
                      {/* Title (only when no single photo — photo has it in overlay) */}
                      {photos.length !== 1 && entry.title && (
                        <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug mb-2">{entry.title}</h3>
                      )}

                      {/* Location + time badges */}
                      {(entry.location_name || entry.entry_time) && photos.length !== 1 && (
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {entry.location_name && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                              <MapPin size={11} className="flex-shrink-0" />
                              {formatLocationName(entry.location_name)}
                            </span>
                          )}
                          {entry.entry_time && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                              <Clock size={11} />
                              {entry.entry_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      )}
                      {entry.entry_time && photos.length === 1 && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-2">
                          <Clock size={11} />
                          {entry.entry_time.slice(0, 5)}
                        </div>
                      )}

                      {/* Story */}
                      {entry.story && (
                        <div className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <JournalBody text={entry.story} />
                        </div>
                      )}

                      {/* Pros & Cons */}
                      {hasProscons && (
                        <div className={`grid gap-3 mt-4 ${prosArr.length > 0 && consArr.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {prosArr.length > 0 && (
                            <div className="rounded-xl border border-green-200 dark:border-green-800/30 p-3" style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, white 100%)' }}>
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-700 mb-2">
                                <ThumbsUp size={10} /> Pros
                              </div>
                              {prosArr.map((p, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[12px] text-green-900 mb-1">
                                  <span className="w-[5px] h-[5px] rounded-full bg-green-500 flex-shrink-0 mt-[6px]" />{p}
                                </div>
                              ))}
                            </div>
                          )}
                          {consArr.length > 0 && (
                            <div className="rounded-xl border border-red-200 dark:border-red-800/30 p-3" style={{ background: 'linear-gradient(180deg, #FEF2F2 0%, white 100%)' }}>
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-700 mb-2">
                                <ThumbsDown size={10} /> Cons
                              </div>
                              {consArr.map((c, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[12px] text-red-900 mb-1">
                                  <span className="w-[5px] h-[5px] rounded-full bg-red-500 flex-shrink-0 mt-[6px]" />{c}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mood + weather */}
                      {(mood || weather) && (
                        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                          {mood && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${mood.bg} ${mood.text}`}>
                              <mood.icon size={11} /> {mood.label}
                            </span>
                          )}
                          {weather && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              <weather.icon size={11} /> {weather.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // Shared gallery renderer
  const renderGallery = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
      {allPhotos.map((photo, idx) => (
        <div
          key={photo.id}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setLightbox({ photos: allPhotos.map(p => ({ id: String(p.id), src: photoUrl(p, token!, 'original'), caption: p.caption, mediaType: (p as any).media_type })), index: idx })}
        >
          <img src={photoUrl(photo, token!, 'thumbnail')} className="w-full h-full object-cover hover:scale-105 transition-transform" alt="" loading="lazy" />
          {(photo as any).media_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-9 h-9 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white">
                <Play size={16} className="ml-0.5" fill="currentColor" />
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // Shared view tab bar
  const renderTabs = (views: typeof availableViews) => views.length > 1 && (
    <div className="flex bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-6 w-fit">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => setView(v.id)}
          className={`flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium ${
            view === v.id
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <v.icon size={13} />
          {v.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <div className="relative text-center text-white" style={{ background: 'linear-gradient(135deg, #000 0%, #0f172a 50%, #1e293b 100%)', padding: '32px 20px 28px', overflow: 'hidden' }}>
        {journey.cover_image && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(/uploads/${journey.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        )}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

        {/* Language picker */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <button onClick={() => setShowLangPicker(v => !v)} style={{
            padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.7)', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {SUPPORTED_LANGUAGES.find(l => l.value === (locale?.split('-')[0] || 'en'))?.label || 'Language'}
          </button>
          {showLangPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', padding: 4, zIndex: 50, minWidth: 150 }}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button key={lang.value} onClick={() => {
                  useSettingsStore.setState(s => ({ settings: { ...s.settings, language: lang.value } }))
                  setShowLangPicker(false)
                }}
                  style={{ display: 'block', width: '100%', padding: '6px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: '#374151', borderRadius: 6, fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >{lang.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', marginBottom: 12, border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <img src="/icons/icon-white.svg" alt="TREK" width={26} height={26} />
        </div>

        <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.35, marginBottom: 12, position: 'relative' }}>{t('journey.public.tagline')}</div>

        <h1 className="relative" style={{ margin: '0 0 4px', fontSize: 'calc(26px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: -0.5 }}>{journey.title}</h1>

        {journey.subtitle && (
          <div className="relative" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', opacity: 0.5, maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>{journey.subtitle}</div>
        )}

        {/* Stats pill */}
        <div className="relative" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={12} /> {stats.entries} {t('journey.stats.entries')}</span>
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', opacity: 0.4 }}>·</span>
          <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={12} /> {stats.photos} {t('journey.stats.photos')}</span>
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', opacity: 0.4 }}>·</span>
          <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={12} /> {stats.places} {t('journey.stats.places')}</span>
        </div>

        <div className="relative" style={{ marginTop: 12, fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.25 }}>{t('journey.public.readOnly')}</div>
      </div>

      {/* Content */}
      {desktopTwoColumn ? (
        // ── Desktop two-column: scrollable timeline feed + sticky map ──────────
        <div className="max-w-[1440px] mx-auto flex" style={{ alignItems: 'flex-start' }}>
          {/* Left: feed */}
          <div className="flex-1 xl:max-w-[50%] min-w-0 px-8 py-6">
            {renderTabs(availableViews)}
            {view === 'timeline' && perms.share_timeline && renderTimeline()}
            {view === 'gallery' && perms.share_gallery && renderGallery()}
          </div>

          {/* Right: sticky map — matches auth page aside proportions */}
          <aside
            className="flex-shrink-0"
            style={{
              width: '44%', minWidth: 420, maxWidth: 760,
              position: 'sticky', top: 0, height: '100dvh',
              padding: '16px 16px 16px 0',
              alignSelf: 'flex-start',
            }}
          >
            <div className="h-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <JourneyMap
                ref={mapRef}
                checkins={[]}
                entries={sidebarMapItems as any}
                height={9999}
                fullScreen
                activeMarkerId={activeEntryId ?? undefined}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </aside>
        </div>
      ) : (
        // ── Single-column layout (mobile + desktop-without-map) ───────────────
        <div className="max-w-[900px] mx-auto px-4 md:px-8 py-6">

          {/* Floating view toggle — visible above the fullscreen map on mobile */}
          {isMobile && view === 'timeline' && perms.share_timeline && perms.share_map && availableViews.length > 1 && (
            <div className="fixed left-0 right-0 z-50 flex justify-center px-4" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
              <div className="flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-lg">
                {availableViews.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-[7px] text-[12px] font-medium ${
                      view === v.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <v.icon size={13} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderTabs(availableViews)}

          {/* Mobile combined map+timeline (public, read-only) */}
          {isMobile && view === 'timeline' && perms.share_timeline && perms.share_map && (
            <MobileMapTimeline
              entries={timelineEntries}
              mapEntries={sidebarMapItems as any}
              dark={document.documentElement.classList.contains('dark')}
              readOnly
              onEntryClick={(entry) => setViewingEntry(entry as any)}
              publicPhotoUrl={(photoId) => `/api/public/journey/${token}/photos/${photoId}/original`}
              carouselBottom="calc(env(safe-area-inset-bottom, 16px) + 8px)"
            />
          )}

          {/* Timeline (desktop, or mobile without map permission) */}
          {(!isMobile || !perms.share_map) && view === 'timeline' && perms.share_timeline && renderTimeline()}

          {/* Gallery */}
          {view === 'gallery' && perms.share_gallery && renderGallery()}

          {/* Map (standalone tab — only in single-column mode) */}
          {view === 'map' && perms.share_map && (
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <JourneyMap
                checkins={[]}
                entries={sidebarMapItems as any}
                height={500}
              />
            </div>
          )}
        </div>
      )}

      {/* Powered by */}
      <div className="flex flex-col items-center py-8 gap-2">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <img src="/icons/icon.svg" alt="TREK" width={18} height={18} style={{ borderRadius: 4 }} />
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#9ca3af' }}>{t('journey.public.sharedVia')} <strong style={{ color: '#6b7280' }}>TREK</strong></span>
        </div>
        <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: '#d1d5db' }}>
          Made with <span style={{ color: '#ef4444' }}>♥</span> by Maurice · <a href="https://github.com/mauriceboe/TREK" style={{ color: '#9ca3af', textDecoration: 'none' }}>GitHub</a>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Mobile entry detail view (public share) */}
      {viewingEntry && (
        <MobileEntryView
          entry={viewingEntry as any}
          readOnly
          publicPhotoUrl={(photoId) => `/api/public/journey/${token}/photos/${photoId}/original`}
          onClose={() => setViewingEntry(null)}
          onEdit={() => {}}
          onDelete={() => {}}
          onPhotoClick={(photos, idx) => setLightbox({
            photos: photos.map(p => ({
              id: String(p.id),
              src: photoUrl(p as any, token!, 'original'),
              caption: (p as any).caption ?? null,
              mediaType: (p as any).media_type,
            })),
            index: idx,
          })}
        />
      )}
    </div>
  )
}
