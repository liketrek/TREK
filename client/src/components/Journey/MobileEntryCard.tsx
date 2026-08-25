import { MapPin, Camera, Smile, Laugh, Meh, Frown, Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake } from 'lucide-react'
import { formatLocationName } from '../../utils/formatters'
import type { JourneyEntry } from '../../store/journeyStore'

const MOOD_ICONS: Record<string, typeof Smile> = {
  amazing: Laugh,
  good: Smile,
  neutral: Meh,
  rough: Frown,
}

const MOOD_COLORS: Record<string, string> = {
  amazing: 'text-pink-500',
  good: 'text-amber-500',
  neutral: 'text-zinc-400',
  rough: 'text-violet-500',
}

const WEATHER_ICONS: Record<string, typeof Sun> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  cold: Snowflake,
}

// Shared journeys hand us photos that only carry `id`, the journey's own
// photos carry `photo_id` — accept either.
function photoId(p: { photo_id?: number; id?: number }): number | undefined {
  return p.photo_id ?? p.id
}

function photoUrl(id: number): string {
  return `/api/photos/${id}/thumbnail`
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!|-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

interface Props {
  entry: JourneyEntry | { id: number; type: string; title?: string | null; location_name?: string | null; location_lat?: number | null; location_lng?: number | null; entry_date: string; entry_time?: string | null; mood?: string | null; weather?: string | null; photos?: { photo_id: number }[]; story?: string | null }
  dayLabel: number
  dayColor: string
  isActive: boolean
  onClick: () => void
  publicPhotoUrl?: (photoId: number) => string
}

export default function MobileEntryCard({ entry, dayLabel, dayColor, isActive, onClick, publicPhotoUrl }: Props) {
  const hasLocation = !!(entry.location_lat && entry.location_lng)
  const hasPhotos = entry.photos && entry.photos.length > 0
  const firstPhoto = hasPhotos ? entry.photos![0] : null
  const MoodIcon = entry.mood ? MOOD_ICONS[entry.mood] : null
  const moodColor = entry.mood ? MOOD_COLORS[entry.mood] : ''
  const WeatherIcon = entry.weather ? WEATHER_ICONS[entry.weather] : null

  const firstPhotoId = firstPhoto ? photoId(firstPhoto) : undefined
  const thumbSrc = firstPhotoId == null
    ? null
    : publicPhotoUrl
      ? publicPhotoUrl(firstPhotoId)
      : photoUrl(firstPhotoId)

  const date = new Date(entry.entry_date + 'T00:00:00')
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const storyPreview = entry.story ? stripMarkdown(entry.story) : ''

  return (
    <button type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-xl overflow-hidden text-left transition-all duration-100 ${
        isActive
          ? 'w-[320px] sm:w-[340px] bg-white dark:bg-zinc-800 shadow-lg ring-2 ring-zinc-900/70 dark:ring-white/60'
          : 'w-[240px] sm:w-[260px] bg-white/90 dark:bg-zinc-800/90 shadow-md'
      } backdrop-blur-lg`}
    >
      <div className={`flex ${isActive ? 'h-[140px]' : 'h-[110px]'} transition-all duration-100`}>
        {/* Photo thumbnail */}
        {thumbSrc ? (
          <div className={`${isActive ? 'w-[110px]' : 'w-[90px]'} flex-shrink-0 relative overflow-hidden transition-all duration-100`}>
            <img
              src={thumbSrc}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {hasPhotos && entry.photos!.length > 1 && (
              <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 text-white rounded px-1 py-0.5 text-[10px] font-medium">
                <Camera size={10} />
                {entry.photos!.length}
              </div>
            )}
          </div>
        ) : (
          <div className={`${isActive ? 'w-[110px]' : 'w-[90px]'} flex-shrink-0 bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center transition-all duration-100`}>
            <MapPin size={20} className="text-zinc-300 dark:text-zinc-500" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col min-w-0">
          {/* Day number + date + mood/weather */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: dayColor }}>
              {dayLabel}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">{dateStr}</span>
            {entry.entry_time && (
              <span className="text-[11px] text-zinc-400">· {entry.entry_time.slice(0, 5)}</span>
            )}
            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
              {MoodIcon && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  entry.mood === 'amazing' ? 'bg-pink-100 dark:bg-pink-900/30' :
                  entry.mood === 'good' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  entry.mood === 'rough' ? 'bg-violet-100 dark:bg-violet-900/30' :
                  'bg-zinc-100 dark:bg-zinc-700'
                }`}>
                  <MoodIcon size={11} className={moodColor} />
                </span>
              )}
              {WeatherIcon && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-700">
                  <WeatherIcon size={11} className="text-zinc-500 dark:text-zinc-400" />
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-white leading-tight truncate">
            {entry.title || (entry.type === 'checkin' ? 'Check-in' : entry.type === 'skeleton' ? 'Add your story…' : 'Untitled')}
          </h4>

          {/* Story preview (1-2 lines, only on active card) */}
          {isActive && storyPreview && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug mt-0.5 line-clamp-2">
              {storyPreview}
            </p>
          )}

          {/* Location badge */}
          <div className="flex items-center gap-1 mt-auto">
            {hasLocation ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 max-w-full overflow-hidden">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{formatLocationName(entry.location_name) || 'On the map'}</span>
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 italic">No location</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
