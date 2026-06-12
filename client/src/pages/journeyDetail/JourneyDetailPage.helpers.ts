import type { JourneyEntry } from '../../store/journeyStore'
import { GRADIENTS } from './JourneyDetailPage.constants'

export function pickGradient(id: number): string {
  return GRADIENTS[id % GRADIENTS.length]
}

export function groupByDate(entries: JourneyEntry[]): Map<string, JourneyEntry[]> {
  const groups = new Map<string, JourneyEntry[]>()
  for (const e of entries) {
    const d = e.entry_date
    if (!groups.has(d)) groups.set(d, [])
    groups.get(d)!.push(e)
  }
  return groups
}

export function formatDate(d: string, locale?: string): { weekday: string; month: string; day: number } {
  const date = new Date(d + 'T00:00:00')
  // Pass the app's selected locale so weekday/month follow the UI language
  // instead of the browser's navigator.language.
  return {
    weekday: date.toLocaleDateString(locale, { weekday: 'long' }),
    month: date.toLocaleDateString(locale, { month: 'long' }),
    day: date.getDate(),
  }
}

export function photoUrl(p: { photo_id: number }, size: 'thumbnail' | 'original' = 'thumbnail'): string {
  return `/api/photos/${p.photo_id}/${size}`
}

export function groupPhotosByDate(photos: any[]): { date: string; label: string; assets: any[] }[] {
  const map = new Map<string, any[]>()
  for (const asset of photos) {
    const key = asset.takenAt ? asset.takenAt.slice(0, 10) : '__unknown__'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(asset)
  }
  return [...map.entries()].map(([date, assets]) => ({
    date,
    label: date === '__unknown__'
      ? 'Unknown date'
      : new Date(date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    assets,
  }))
}
