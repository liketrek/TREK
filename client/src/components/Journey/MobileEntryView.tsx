import {
  X, Pencil, Trash2, MapPin, Clock, Camera, Play,
  Laugh, Smile, Meh, Frown,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake,
  ThumbsUp, ThumbsDown,
} from 'lucide-react'
import JournalBody from './JournalBody'
import { useTranslation } from '../../i18n'
import { formatLocationName } from '../../utils/formatters'
import type { JourneyEntry, JourneyPhoto } from '../../store/journeyStore'

// Labels are translation keys, like the desktop tables in
// pages/journeyDetail/JourneyDetailPage.constants.ts. The colour classes stay
// local because the desktop variant carries raw hex values and no dark-mode
// classes, so the two cannot share one table without changing how this looks.
const MOOD_CONFIG: Record<string, { icon: typeof Smile; label: string; bg: string; text: string }> = {
  amazing: { icon: Laugh, label: 'journey.mood.amazing', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
  good: { icon: Smile, label: 'journey.mood.good', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  neutral: { icon: Meh, label: 'journey.mood.neutral', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400' },
  rough: { icon: Frown, label: 'journey.mood.rough', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
}

const WEATHER_CONFIG: Record<string, { icon: typeof Sun; label: string }> = {
  sunny: { icon: Sun, label: 'journey.weather.sunny' },
  partly: { icon: CloudSun, label: 'journey.weather.partly' },
  cloudy: { icon: Cloud, label: 'journey.weather.cloudy' },
  rainy: { icon: CloudRain, label: 'journey.weather.rainy' },
  stormy: { icon: CloudLightning, label: 'journey.weather.stormy' },
  cold: { icon: Snowflake, label: 'journey.weather.cold' },
}

function photoUrl(
  p: JourneyPhoto,
  size: 'thumbnail' | 'original' = 'original',
  builder?: (id: number, size?: 'thumbnail' | 'original') => string
): string {
  if (builder) return builder(p.photo_id, size)
  return `/api/photos/${p.photo_id}/${size}`
}

interface Props {
  entry: JourneyEntry
  readOnly?: boolean
  publicPhotoUrl?: (
    photoId: number,
    size?: 'thumbnail' | 'original'
  ) => string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onPhotoClick: (photos: JourneyPhoto[], index: number) => void
}

export default function MobileEntryView({ entry, readOnly, publicPhotoUrl, onClose, onEdit, onDelete, onPhotoClick }: Props) {
  const { t, locale } = useTranslation()
  const photos = entry.photos || []
  const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null
  const weather = entry.weather ? WEATHER_CONFIG[entry.weather] : null
  const prosArr = entry.pros_cons?.pros ?? []
  const consArr = entry.pros_cons?.cons ?? []
  const hasProscons = prosArr.length > 0 || consArr.length > 0

  const date = new Date(entry.entry_date + 'T00:00:00')
  const dateStr = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <button type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>
        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <button type="button"
              onClick={() => { onClose(); onEdit(); }}
              className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[12px] font-medium flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Pencil size={13} />
              {t('common.edit')}
            </button>
            <button type="button"
              onClick={() => { onClose(); onDelete(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Hero photo(s) */}
        {photos.length > 0 && (
          <div className="relative">
            <button
              type="button"
              aria-label={photos[0].caption || t('journey.photos')}
              className={`relative block w-full max-h-[50vh] cursor-pointer border-0 p-0 ${photos[0].media_type === 'video' ? 'bg-black' : 'bg-transparent'
                }`}
              onClick={() => onPhotoClick(photos, 0)}
            >
              <img
                src={photoUrl(photos[0], 'original', publicPhotoUrl)}
                alt=""
                className={`w-full max-h-[50vh] ${photos[0].media_type === 'video' ? 'object-contain' : 'object-cover'
                  }`}
              />

              {photos[0].media_type === 'video' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                    <Play size={20} className="ml-0.5" fill="currentColor" />
                  </span>
                </div>
              )}
            </button>

            {photos.length > 1 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-full px-2.5 py-1 text-[11px] font-medium">
                <Camera size={12} />
                {t('mobileJourney.photosCount', { count: photos.length })}
              </div>
            )}

            {/* Photo strip for multiple photos */}
            {photos.length > 1 && (
              <div className="flex gap-1 px-4 py-2 overflow-x-auto bg-zinc-50 dark:bg-zinc-900">
                {photos.map((p, i) => (
                  <button
                    key={p.id || i}
                    type="button"
                    aria-label={p.caption || t('journey.photos')}
                    className={`relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-0 p-0 hover:ring-2 ring-zinc-900/30 dark:ring-white/30 transition-all ${p.media_type === 'video' ? 'bg-black' : 'bg-transparent'
                      }`}
                    onClick={() => onPhotoClick(photos, i)}
                  >
                    <img
                      src={photoUrl(p, 'thumbnail', publicPhotoUrl)}
                      alt=""
                      className={`h-full w-full ${p.media_type === 'video' ? 'object-contain' : 'object-cover'
                        }`}
                    />

                    {p.media_type === 'video' && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <Play
                          size={16}
                          className="text-white drop-shadow"
                          fill="currentColor"
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Content */}
        <div className="px-5 py-5 pb-32">

          {/* Date + time + location header */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-zinc-500">{dateStr}</span>
            {entry.entry_time && (
              <span className="flex items-center gap-1 text-[12px] text-zinc-400">
                <Clock size={11} />
                {entry.entry_time.slice(0, 5)}
              </span>
            )}
          </div>

          {entry.location_name && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                <MapPin size={12} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                {formatLocationName(entry.location_name)}
              </span>
            </div>
          )}

          {/* Title */}
          {entry.title && (
            <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight mb-4">
              {entry.title}
            </h1>
          )}

          {/* Mood + Weather chips */}
          {(mood || weather) && (
            <div className="flex items-center gap-2 mb-4">
              {mood && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${mood.bg} ${mood.text}`}>
                  <mood.icon size={13} />
                  {t(mood.label)}
                </span>
              )}
              {weather && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <weather.icon size={13} />
                  {t(weather.label)}
                </span>
              )}
            </div>
          )}

          {/* Story */}
          {entry.story && (
            <div className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300 mb-5">
              <JournalBody text={entry.story} />
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {entry.tags.map((tag, i) => (
                <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Pros & Cons */}
          {hasProscons && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden mb-5">
              {prosArr.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                    <ThumbsUp size={12} /> {t('journey.editor.pros')}
                  </div>
                  <ul className="space-y-1">
                    {prosArr.map((p, i) => (
                      <li key={i} className="text-[13px] text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {prosArr.length > 0 && consArr.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-700" />
              )}
              {consArr.length > 0 && (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mb-2">
                    <ThumbsDown size={12} /> {t('journey.editor.cons')}
                  </div>
                  <ul className="space-y-1">
                    {consArr.map((c, i) => (
                      <li key={i} className="text-[13px] text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">−</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  )
}
