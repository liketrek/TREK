import {
  SmilePlus, Smile, Meh, Frown,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { pickGradient } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'

export interface MoodMeta {
  id: string
  icon: LucideIcon
  color: string
  labelKey: string
}

// Mood canon of the mobile design (4 moods, mood dot = color at 13% alpha).
export const MOBILE_MOODS: MoodMeta[] = [
  { id: 'amazing', icon: SmilePlus, color: '#EC4899', labelKey: 'journey.mood.amazing' },
  { id: 'good', icon: Smile, color: '#E8A13A', labelKey: 'journey.mood.good' },
  { id: 'neutral', icon: Meh, color: '#9A9AA1', labelKey: 'journey.mood.neutral' },
  { id: 'rough', icon: Frown, color: '#8B5CF6', labelKey: 'journey.mood.rough' },
]

export function moodMeta(id: string | null | undefined): MoodMeta | undefined {
  return id ? MOBILE_MOODS.find(m => m.id === id) : undefined
}

export interface WeatherMeta {
  id: string
  icon: LucideIcon
  labelKey: string
}

// Weather canon (6 states). 'cold' is the stored id for Snowy — same as desktop.
export const MOBILE_WEATHERS: WeatherMeta[] = [
  { id: 'sunny', icon: Sun, labelKey: 'journey.weather.sunny' },
  { id: 'partly', icon: CloudSun, labelKey: 'journey.weather.partly' },
  { id: 'cloudy', icon: Cloud, labelKey: 'journey.weather.cloudy' },
  { id: 'rainy', icon: CloudRain, labelKey: 'journey.weather.rainy' },
  { id: 'stormy', icon: CloudLightning, labelKey: 'journey.weather.stormy' },
  { id: 'cold', icon: Snowflake, labelKey: 'journey.weather.cold' },
]

export function weatherMeta(id: string | null | undefined): WeatherMeta | undefined {
  return id ? MOBILE_WEATHERS.find(w => w.id === id) : undefined
}

export function journeyWeatherCategory(main: string, description: string): string {
  const normalizedMain = main.toLowerCase()
  const normalizedDescription = description.toLowerCase()
  if (normalizedMain === 'clear') return 'sunny'
  if (normalizedMain === 'thunderstorm') return 'stormy'
  if (normalizedMain === 'snow') return 'cold'
  if (normalizedMain === 'rain' || normalizedMain === 'drizzle') return 'rainy'
  if (normalizedDescription.includes('partly') || normalizedDescription.includes('teilweise')) return 'partly'
  return 'cloudy'
}

/** Journey cover_image is stored relative — prefix /uploads/ unless it already is. */
export function journeyCoverSrc(coverImage: string | null | undefined): string | null {
  if (!coverImage) return null
  return coverImage.startsWith('/uploads/') ? coverImage : `/uploads/${coverImage}`
}

/** Cover surface for cards: photo when present, deterministic gradient otherwise. */
export function journeyCoverStyle(journey: { id: number; cover_image?: string | null }): CSSProperties {
  const src = journeyCoverSrc(journey.cover_image)
  if (src) return { backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  return { background: pickGradient(journey.id) }
}
