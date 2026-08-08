import { useEffect, useMemo, useState } from 'react'
import { Zap } from 'lucide-react'
import { pluginsApi, type PluginDayScheduleItem, type PluginDayTint } from '../../api/client'

/**
 * Host-rendered rows for the `dayScheduleProvider` plugin hook — time
 * contributions in the day plan ("35 min charging at this stop", "45 min
 * security before this flight"). Everything here is host-vetted data from
 * /api/day-schedule; the hook groups it by anchor so the timelines can slot
 * a row under the right place/booking (or at a day's start/end), and sums
 * the minutes per day for the route footer.
 */
const TONE_COLORS: Record<PluginDayScheduleItem['tone'], string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
}

export interface PluginDaySchedule {
  /** dayId → assignmentId → rows anchored under that place row. */
  byAssignment: Record<number, Record<number, PluginDayScheduleItem[]>>
  /** dayId → reservationId → rows anchored under that booking row. */
  byReservation: Record<number, Record<number, PluginDayScheduleItem[]>>
  /** dayId → rows pinned to the start / end of the day (end = default anchor). */
  byPosition: Record<number, { start: PluginDayScheduleItem[]; end: PluginDayScheduleItem[] }>
  /** dayId → total contributed minutes (for the route-footer "+X min"). */
  minutesByDay: Record<number, number>
}

const EMPTY: PluginDaySchedule = { byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {} }

export function usePluginDaySchedule(tripId?: number | string | null): PluginDaySchedule {
  const [items, setItems] = useState<PluginDayScheduleItem[]>([])

  useEffect(() => {
    if (tripId == null) { setItems([]); return }
    let alive = true
    pluginsApi.daySchedule(tripId)
      .then(r => { if (alive) setItems(r.items || []) })
      .catch(() => { if (alive) setItems([]) }) // fail-safe: no extra rows
    return () => { alive = false }
  }, [tripId])

  return useMemo(() => {
    if (items.length === 0) return EMPTY
    const out: PluginDaySchedule = { byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {} }
    for (const it of items) {
      if (it.assignmentId != null) {
        const day = (out.byAssignment[it.dayId] ??= {})
        ;(day[it.assignmentId] ??= []).push(it)
      } else if (it.reservationId != null) {
        const day = (out.byReservation[it.dayId] ??= {})
        ;(day[it.reservationId] ??= []).push(it)
      } else {
        const day = (out.byPosition[it.dayId] ??= { start: [], end: [] })
        day[it.position === 'start' ? 'start' : 'end'].push(it)
      }
      if (it.minutes) out.minutesByDay[it.dayId] = (out.minutesByDay[it.dayId] || 0) + it.minutes
    }
    return out
  }, [items])
}

/** dayId → the per-region paint (and optional tooltip) for that day's card. */
export type PluginDayTintRegions = Omit<PluginDayTint, 'pluginId' | 'dayId'>
export type PluginDayTints = Record<number, PluginDayTintRegions>

/** The three separately tintable regions of a day card. */
export type PluginDayTintRegion = 'badge' | 'header' | 'activity'

const EMPTY_TINTS: PluginDayTints = {}

/**
 * Host-rendered day colours for the `dayTintProvider` plugin hook — "day 12 belongs
 * to the Kanazawa leg". A sibling of usePluginDaySchedule in every respect: same
 * fail-safe fetch, same vetted-data-only contract. Separate from the schedule hook
 * because its output is bounded by the trip's day count rather than the schedule
 * hook's ≤60 items, which a long multi-destination trip would blow straight past.
 *
 * The server has already resolved precedence (one tint per day, first granted
 * provider wins), so this is a flat index — the callers just look a day up.
 */
export function usePluginDayTints(tripId?: number | string | null): PluginDayTints {
  const [tints, setTints] = useState<PluginDayTint[]>([])

  useEffect(() => {
    if (tripId == null) { setTints([]); return }
    let alive = true
    pluginsApi.dayTints(tripId)
      .then(r => { if (alive) setTints(r.tints || []) })
      .catch(() => { if (alive) setTints([]) }) // fail-safe: no tints
    return () => { alive = false }
  }, [tripId])

  return useMemo(() => {
    if (tints.length === 0) return EMPTY_TINTS
    const out: PluginDayTints = {}
    for (const t of tints) {
      const { pluginId: _pluginId, dayId: _dayId, ...regions } = t
      out[t.dayId] = regions
    }
    return out
  }, [tints])
}

/** True when a plugin paints this region at all — the callers that change more than a
 * background (the badge switches its text colour) need this without rebuilding the
 * background string. */
export function dayTinted(tint: PluginDayTintRegions | undefined, region: PluginDayTintRegion): boolean {
  return Boolean(tint?.[`${region}Tone`] || tint?.[`${region}Color`])
}

/** A plugin's own colour, pulled into the lightness band the current theme can render.
 * The plugin owns the hue and the chroma — only `l` is touched, and only when it falls
 * outside the band, so an ordinary colour comes through exactly as sent.
 *
 * Without this, "any hex" means any plugin can paint a day nobody can read: near-white
 * washes out against the light sidebar, near-black turns the dark one to mud. The band
 * is a CSS variable rather than a constant here because the answer is per theme. */
const clampLightness = (color: string) =>
  `oklch(from ${color} clamp(var(--day-tint-l-min), l, var(--day-tint-l-max)) c h)`

/** The `color-mix` background for one tinted region, or undefined when no plugin paints
 * it — in which case the caller keeps whatever it renders without plugins.
 *
 * `alphaVar` names a CSS custom property holding the strength, which varies per theme
 * AND per region: the tones are fixed hexes, so one alpha cannot serve both themes
 * (#4F46E5 is itself a dark colour and vanishes on a dark surface at a light theme's
 * alpha), and a large region behind dense text needs a fainter tint than a small badge.
 * A plugin's own colour rides the same alphas — it chooses the hue, not the weight. */
export function dayTintBackground(
  tint: PluginDayTintRegions | undefined,
  region: PluginDayTintRegion,
  alphaVar: string,
  base = 'transparent',
): string | undefined {
  const color = tint?.[`${region}Color`]
  const tone = tint?.[`${region}Tone`]
  // Server-resolved: a region carries a colour or a tone, never both.
  const paint = color ? clampLightness(color) : tone ? (TONE_COLORS[tone] ?? TONE_COLORS.default) : undefined
  if (!paint) return undefined
  return `color-mix(in srgb, ${paint} var(${alphaVar}), ${base})`
}

export function formatScheduleMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

/** One contributed row — a slim line in the timeline, styled like the route
 * connectors so it reads as schedule information, not as an itinerary item. */
export function PluginDayScheduleRow({ item }: { item: PluginDayScheduleItem }) {
  const color = TONE_COLORS[item.tone] ?? TONE_COLORS.default
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 14px', fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', lineHeight: 1.3 }}>
      <Zap size={11} strokeWidth={2} style={{ color, flexShrink: 0 }} />
      {item.minutes != null && <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatScheduleMinutes(item.minutes)}</span>}
      {item.minutes != null && <span style={{ opacity: 0.4 }}>·</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    </div>
  )
}
