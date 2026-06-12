import {
  Laugh, Smile, Meh, Frown,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake,
} from 'lucide-react'

export const GRADIENTS = [
  'linear-gradient(135deg, #0F172A 0%, #6366F1 45%, #EC4899 100%)',
  'linear-gradient(135deg, #1E293B 0%, #7C3AED 50%, #F59E0B 100%)',
  'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
  'linear-gradient(135deg, #2D1B69 0%, #11998E 100%)',
  'linear-gradient(135deg, #4B134F 0%, #C94B4B 100%)',
  'linear-gradient(135deg, #373B44 0%, #4286F4 100%)',
]

export const MOOD_CONFIG: Record<string, { bg: string; text: string; icon: typeof Laugh; label: string }> = {
  amazing: { bg: '#FDF2F8', text: '#BE185D', icon: Laugh, label: 'journey.mood.amazing' },
  good: { bg: '#FFFBEB', text: '#B45309', icon: Smile, label: 'journey.mood.good' },
  neutral: { bg: '#F4F4F5', text: '#3F3F46', icon: Meh, label: 'journey.mood.neutral' },
  rough: { bg: '#F5F3FF', text: '#6D28D9', icon: Frown, label: 'journey.mood.rough' },
}

export const WEATHER_CONFIG: Record<string, { icon: typeof Sun; label: string }> = {
  sunny: { icon: Sun, label: 'journey.weather.sunny' },
  partly: { icon: CloudSun, label: 'journey.weather.partly' },
  cloudy: { icon: Cloud, label: 'journey.weather.cloudy' },
  rainy: { icon: CloudRain, label: 'journey.weather.rainy' },
  stormy: { icon: CloudLightning, label: 'journey.weather.stormy' },
  cold: { icon: Snowflake, label: 'journey.weather.cold' },
}
