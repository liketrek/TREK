import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Clock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { formatLocationName } from '../../utils/formatters'
import { useTranslation } from '../../i18n'
import { pluginsApi } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'
import type { JourneyEntry, JourneyPhoto } from '../../store/journeyStore'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'
import { photoUrl } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import { PhotoGrid } from './JourneyDetailPagePhotoGrid'
import { MoodChip, WeatherChip } from './JourneyDetailPageChips'
import { ExpandableStory } from './JourneyDetailPageExpandableStory'
import { VerdictSection } from './JourneyDetailPageVerdictSection'

export function EntryCard({ entry, readOnly, onEdit, onDelete, onPhotoClick }: {
  entry: JourneyEntry
  readOnly?: boolean
  onEdit: () => void
  onDelete: () => void
  onPhotoClick: (photos: JourneyPhoto[], index: number) => void
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  // Extra rows contributed by journalEntryProvider plugins — same pattern as the
  // PlaceInspector provider details: fetched only when plugins are active at all,
  // fail-safe (the server drops slow/failing providers), only ever additive.
  const hasPlugins = usePluginStore((s) => s.plugins.length > 0)
  const [providerRows, setProviderRows] = useState<Array<{ pluginId: string; items: Array<{ label: string; value?: string; url?: string }> }>>([])
  useEffect(() => {
    if (!hasPlugins) { setProviderRows([]); return }
    let cancelled = false
    pluginsApi.journalEntryRows(entry.id)
      .then((d) => { if (!cancelled) setProviderRows((d.providers || []).filter((p) => Array.isArray(p.items) && p.items.length > 0)) })
      .catch(() => { if (!cancelled) setProviderRows([]) })
    return () => { cancelled = true }
  }, [entry.id, hasPlugins])
  const photos = entry.photos || []
  const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null
  const weather = entry.weather ? WEATHER_CONFIG[entry.weather] : null

  const prosArr = entry.pros_cons?.pros ?? []
  const consArr = entry.pros_cons?.cons ?? []
  const hasProscons = prosArr.length > 0 || consArr.length > 0

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-sm">

      {/* Hero area: photos with title overlay */}
      {photos.length > 0 ? (
        <div className="relative">
          <PhotoGrid photos={photos} onClick={(idx) => onPhotoClick(photos, idx)} />
          {/* Gradient overlay for title */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', height: '60%' }} />

          {/* Badges top-left */}
          <div className="absolute top-3 left-4 right-14 flex items-center gap-1.5 z-[2]">
            {entry.location_name && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white tracking-wide max-w-full overflow-hidden">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{formatLocationName(entry.location_name)}</span>
              </span>
            )}
            {entry.entry_time && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white tracking-wide">
                <Clock size={10} />
                {entry.entry_time}
              </span>
            )}
          </div>

          {/* Menu top-right */}
          {!readOnly && (
            <div className="absolute top-2.5 right-3 z-[2]">
              <button ref={menuBtnRef} onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-[10px] bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50">
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setMenuOpen(false)} />
                  <div className="fixed z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[120px]" style={{ top: (menuBtnRef.current?.getBoundingClientRect().bottom || 0) + 4, right: window.innerWidth - (menuBtnRef.current?.getBoundingClientRect().right || 0) }}>
                    <button onClick={() => { setMenuOpen(false); onEdit() }} className="w-full text-left px-3 py-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"><Pencil size={12} /> {t('common.edit')}</button>
                    <button onClick={() => { setMenuOpen(false); onDelete() }} className="w-full text-left px-3 py-1.5 text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><Trash2 size={12} /> {t('common.delete')}</button>
                  </div>
                </>,
                document.body,
              )}
            </div>
          )}

          {/* Title on photo */}
          {entry.title && (
            <div className="absolute bottom-4 left-5 right-5 z-[2] pointer-events-none">
              <h3 className="text-[22px] font-bold text-white tracking-[-0.02em] leading-tight drop-shadow-sm">{entry.title}</h3>
            </div>
          )}
        </div>
      ) : (
        /* No photos: simple header */
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            {entry.location_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-semibold text-zinc-500 max-w-full overflow-hidden">
                <MapPin size={10} className="flex-shrink-0" /> <span className="truncate">{formatLocationName(entry.location_name)}</span>
              </span>
            )}
            {entry.entry_time && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-semibold text-zinc-500">
                <Clock size={10} /> {entry.entry_time}
              </span>
            )}
          </div>
          {!readOnly && (
            <div className="relative">
              <button ref={menuBtnRef} onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setMenuOpen(false)} />
                  <div className="fixed z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[120px]" style={{ top: (menuBtnRef.current?.getBoundingClientRect().bottom || 0) + 4, right: window.innerWidth - (menuBtnRef.current?.getBoundingClientRect().right || 0) }}>
                    <button onClick={() => { setMenuOpen(false); onEdit() }} className="w-full text-left px-3 py-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"><Pencil size={12} /> {t('common.edit')}</button>
                    <button onClick={() => { setMenuOpen(false); onDelete() }} className="w-full text-left px-3 py-1.5 text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><Trash2 size={12} /> {t('common.delete')}</button>
                  </div>
                </>,
                document.body,
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-5 pt-4 pb-5">
        {/* Title (only if no photos — otherwise shown on image) */}
        {!photos.length && entry.title && (
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug mb-1">{entry.title}</h3>
        )}
        {!photos.length && entry.location_name && !entry.title && (
          <div className="mb-2" />
        )}
        {entry.story && (
          <ExpandableStory story={entry.story} />
        )}

        {/* Pros & Cons — "Pros & Cons" style */}
        {hasProscons && (
          <VerdictSection pros={prosArr} cons={consArr} />
        )}

        {(mood || weather || (entry.tags && entry.tags.length > 0)) && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              {mood && <MoodChip mood={entry.mood!} />}
              {weather && <WeatherChip weather={entry.weather!} />}
            </div>
            <div className="flex gap-1">
              {entry.tags?.map((tag, i) => (
                <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Plugin provider rows — host-vetted label/value/url, plain text only */}
        {providerRows.length > 0 && (
          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
            {providerRows.flatMap((p) => p.items.map((it, i) => (
              <div key={`${p.pluginId}-${i}`} className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">{it.label}</span>
                {it.url
                  ? <a href={it.url} target="_blank" rel="noreferrer noopener" className="text-indigo-600 dark:text-indigo-400 truncate text-right">{it.value ?? it.url}</a>
                  : <span className="text-zinc-600 dark:text-zinc-300 truncate text-right">{it.value}</span>}
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SkeletonCard({ entry, onClick }: { entry: JourneyEntry; onClick?: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-[border-color,border-style] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${onClick ? 'hover:border-solid hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer' : ''}`}
    >
      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 flex-shrink-0">
        <MapPin size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-zinc-900 dark:text-white">
          {entry.title || t('journey.detail.newEntry')}
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          {formatLocationName(entry.location_name)}{entry.entry_time ? ` · ${entry.entry_time}` : ''}
        </div>
      </div>
      <div className="text-[11px] text-zinc-500 font-medium flex-shrink-0">
        {t('journey.detail.addEntry')} &rarr;
      </div>
    </div>
  )
}

export function CheckinCard({ entry, onClick }: { entry: JourneyEntry; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${onClick ? 'hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer' : ''}`}
    >
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
        <MapPin size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
          {entry.title}
          {entry.location_name && <span className="text-zinc-500 font-normal text-xs">· {entry.location_name}</span>}
        </div>
        {entry.story && <div className="text-[11px] text-zinc-500 mt-0.5">{entry.story}</div>}
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {entry.entry_time && <span className="text-[11px] text-zinc-400 tabular-nums">{entry.entry_time}</span>}
      </div>
    </div>
  )
}
