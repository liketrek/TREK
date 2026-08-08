// FE-W4PDS-001 to FE-W4PDS-013
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { render, screen } from '../../../tests/helpers/render'
import type { PluginDayScheduleItem } from '../../api/client'

const daySchedule = vi.fn(async (_tripId: number | string) => ({ items: [] as PluginDayScheduleItem[] }))

vi.mock('../../api/client', () => ({
  pluginsApi: { daySchedule: (tripId: number | string) => daySchedule(tripId) },
}))

import { usePluginDaySchedule, formatScheduleMinutes, PluginDayScheduleRow, dayTintBackground, dayTinted } from './PluginDaySchedule'

function item(overrides: Partial<PluginDayScheduleItem> = {}): PluginDayScheduleItem {
  return { pluginId: 'ev', id: 'i1', dayId: 1, label: 'Charging', tone: 'default', ...overrides }
}

beforeEach(() => {
  daySchedule.mockReset()
  daySchedule.mockResolvedValue({ items: [] })
})

describe('formatScheduleMinutes', () => {
  it('FE-W4PDS-001: formats sub-hour durations in minutes', () => {
    expect(formatScheduleMinutes(35)).toBe('35 min')
    expect(formatScheduleMinutes(0)).toBe('0 min')
  })

  it('FE-W4PDS-002: splits an hour or more into h + min', () => {
    expect(formatScheduleMinutes(60)).toBe('1 h 0 min')
    expect(formatScheduleMinutes(95)).toBe('1 h 35 min')
    expect(formatScheduleMinutes(1440)).toBe('24 h 0 min')
  })
})

describe('usePluginDaySchedule', () => {
  it('FE-W4PDS-003: returns the shared empty schedule without a trip', () => {
    const { result } = renderHook(() => usePluginDaySchedule(null))

    expect(daySchedule).not.toHaveBeenCalled()
    expect(result.current).toEqual({ byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {} })
  })

  it('FE-W4PDS-004: groups place-anchored rows by day and assignment', async () => {
    daySchedule.mockResolvedValue({
      items: [
        item({ id: 'a', dayId: 3, assignmentId: 10, minutes: 35 }),
        item({ id: 'b', dayId: 3, assignmentId: 10, minutes: 5 }),
        item({ id: 'c', dayId: 3, assignmentId: 11 }),
      ],
    })

    const { result } = renderHook(() => usePluginDaySchedule(7))

    await waitFor(() => expect(result.current.byAssignment[3]).toBeDefined())
    expect(result.current.byAssignment[3][10].map(i => i.id)).toEqual(['a', 'b'])
    expect(result.current.byAssignment[3][11].map(i => i.id)).toEqual(['c'])
    expect(daySchedule).toHaveBeenCalledWith(7)
  })

  it('FE-W4PDS-005: groups booking-anchored rows by day and reservation', async () => {
    daySchedule.mockResolvedValue({
      items: [
        item({ id: 'a', dayId: 2, reservationId: 55, minutes: 45 }),
        item({ id: 'b', dayId: 2, reservationId: 55 }),
      ],
    })

    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(result.current.byReservation[2]).toBeDefined())
    expect(result.current.byReservation[2][55].map(i => i.id)).toEqual(['a', 'b'])
  })

  it('FE-W4PDS-006: pins unanchored rows to the start or end of the day', async () => {
    daySchedule.mockResolvedValue({
      items: [
        item({ id: 'first', dayId: 4, position: 'start' }),
        item({ id: 'last', dayId: 4, position: 'end' }),
        item({ id: 'default', dayId: 4 }),
      ],
    })

    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(result.current.byPosition[4]).toBeDefined())
    expect(result.current.byPosition[4].start.map(i => i.id)).toEqual(['first'])
    expect(result.current.byPosition[4].end.map(i => i.id)).toEqual(['last', 'default'])
  })

  it('FE-W4PDS-007: sums the contributed minutes per day', async () => {
    daySchedule.mockResolvedValue({
      items: [
        item({ id: 'a', dayId: 1, assignmentId: 1, minutes: 35 }),
        item({ id: 'b', dayId: 1, reservationId: 2, minutes: 45 }),
        item({ id: 'c', dayId: 2, minutes: 10 }),
        item({ id: 'd', dayId: 2 }),
      ],
    })

    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(result.current.minutesByDay[1]).toBe(80))
    expect(result.current.minutesByDay[2]).toBe(10)
  })

  it('FE-W4PDS-008: prefers the assignment anchor when both ids are present', async () => {
    daySchedule.mockResolvedValue({ items: [item({ dayId: 1, assignmentId: 9, reservationId: 8 })] })
    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(result.current.byAssignment[1]).toBeDefined())
    expect(result.current.byReservation).toEqual({})
  })

  it('FE-W4PDS-009: falls back to no extra rows when the endpoint fails', async () => {
    daySchedule.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(daySchedule).toHaveBeenCalled())
    expect(result.current.minutesByDay).toEqual({})
  })

  it('FE-W4PDS-010: tolerates a response without an items array', async () => {
    daySchedule.mockResolvedValue({} as { items: PluginDayScheduleItem[] })
    const { result } = renderHook(() => usePluginDaySchedule(1))

    await waitFor(() => expect(daySchedule).toHaveBeenCalled())
    expect(result.current.byPosition).toEqual({})
  })

  it('FE-W4PDS-011: refetches when the trip changes', async () => {
    const { rerender } = renderHook(({ id }: { id: number }) => usePluginDaySchedule(id), { initialProps: { id: 1 } })
    await waitFor(() => expect(daySchedule).toHaveBeenCalledTimes(1))

    rerender({ id: 2 })
    await waitFor(() => expect(daySchedule).toHaveBeenLastCalledWith(2))
  })
})

describe('dayTintBackground', () => {
  it('FE-W4PDS-015: mixes a tone at the region\'s own alpha, over the caller\'s base', () => {
    expect(dayTintBackground({ headerTone: 'warn' }, 'header', '--day-tint-header'))
      .toBe('color-mix(in srgb, #f59e0b var(--day-tint-header), transparent)')
    expect(dayTintBackground({ badgeTone: 'danger' }, 'badge', '--day-tint-badge', 'var(--bg-hover)'))
      .toBe('color-mix(in srgb, #ef4444 var(--day-tint-badge), var(--bg-hover))')
  })

  it('FE-W4PDS-016: clamps a plugin\'s own colour into the theme\'s lightness band', () => {
    // The plugin owns the hue and the chroma (`c h` pass through); only `l` is bounded,
    // so no colour it sends can wash out on the light sidebar or vanish on the dark one.
    expect(dayTintBackground({ badgeColor: '#00ff00' }, 'badge', '--day-tint-badge'))
      .toBe('color-mix(in srgb, oklch(from #00ff00 clamp(var(--day-tint-l-min), l, var(--day-tint-l-max)) c h) var(--day-tint-badge), transparent)')
  })

  it('FE-W4PDS-017: paints a region\'s colour over its tone', () => {
    // The server never sends both, but the precedence has to be unambiguous here too.
    const bg = dayTintBackground({ badgeTone: 'danger', badgeColor: '#123456' }, 'badge', '--a')
    expect(bg).toContain('#123456')
    expect(bg).not.toContain('#ef4444')
  })

  it('FE-W4PDS-018: leaves an unpainted region alone so the caller keeps its own look', () => {
    expect(dayTintBackground(undefined, 'header', '--day-tint-header')).toBeUndefined()
    // Named elsewhere on the card, but not here — this region must stay untouched.
    expect(dayTintBackground({ badgeTone: 'success' }, 'activity', '--day-tint-activity')).toBeUndefined()
  })

  it('FE-W4PDS-019: falls back to the default hex for an unknown tone', () => {
    expect(dayTintBackground({ headerTone: 'nope' as 'default' }, 'header', '--a'))
      .toBe('color-mix(in srgb, #4F46E5 var(--a), transparent)')
  })

  it('FE-W4PDS-020: dayTinted reports either channel, per region', () => {
    expect(dayTinted({ badgeTone: 'success' }, 'badge')).toBe(true)
    expect(dayTinted({ badgeColor: '#123456' }, 'badge')).toBe(true)
    expect(dayTinted({ badgeColor: '#123456' }, 'header')).toBe(false)
    expect(dayTinted(undefined, 'badge')).toBe(false)
  })
})

describe('PluginDayScheduleRow', () => {
  it('FE-W4PDS-012: renders the duration, separator and label', () => {
    render(<PluginDayScheduleRow item={item({ minutes: 95, label: 'Charging stop' })} />)

    expect(screen.getByText('1 h 35 min')).toBeInTheDocument()
    expect(screen.getByText('·')).toBeInTheDocument()
    expect(screen.getByText('Charging stop')).toBeInTheDocument()
  })

  it('FE-W4PDS-013: drops the duration when the plugin contributes none', () => {
    render(<PluginDayScheduleRow item={item({ label: 'Security check' })} />)

    expect(screen.getByText('Security check')).toBeInTheDocument()
    expect(screen.queryByText('·')).toBeNull()
  })

  it('FE-W4PDS-014: colours the icon by tone and falls back for an unknown tone', () => {
    const { container, unmount } = render(<PluginDayScheduleRow item={item({ tone: 'danger' })} />)
    expect((container.querySelector('svg') as SVGElement).style.color).toBe('rgb(239, 68, 68)')
    unmount()

    const odd = render(<PluginDayScheduleRow item={item({ tone: 'nope' as PluginDayScheduleItem['tone'] })} />)
    expect((odd.container.querySelector('svg') as SVGElement).style.color).toBe('rgb(79, 70, 229)')
  })
})
