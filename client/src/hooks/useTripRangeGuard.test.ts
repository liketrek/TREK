/**
 * FE-HOOK-RANGEGUARD-001 to FE-HOOK-RANGEGUARD-006: the question before a trip
 * dialog saves new dates. The desktop dialog and the phone sheet both render
 * what this answers, so what it reads, when it reads nothing, and what it says
 * when it cannot read are pinned here once. The repos are mocked; the layout
 * rule is the real planDayGrid from shared, the one the server runs.
 */
import { createElement, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TranslationProvider } from '../i18n/TranslationContext'
import { buildAssignment, buildBudgetItem, buildDay, buildPlace, buildReservation } from '../../tests/helpers/factories'
import type { Accommodation, BudgetItem, Day, Reservation } from '../types'
import { useTripRangeGuard, type RangeCheck, type RangeRemoval } from './useTripRangeGuard'

const repos = {
  days: vi.fn<() => Promise<{ days: Day[] }>>(),
  reservations: vi.fn<() => Promise<{ reservations: Reservation[] }>>(),
  accommodations: vi.fn<() => Promise<{ accommodations: Accommodation[] }>>(),
  budget: vi.fn<() => Promise<{ items: BudgetItem[] }>>(),
}
vi.mock('../repo/dayRepo', () => ({ dayRepo: { list: () => repos.days() } }))
vi.mock('../repo/reservationRepo', () => ({ reservationRepo: { list: () => repos.reservations() } }))
vi.mock('../repo/accommodationRepo', () => ({ accommodationRepo: { list: () => repos.accommodations() } }))
vi.mock('../repo/budgetRepo', () => ({ budgetRepo: { list: () => repos.budget() } }))

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

const trip = { id: 7, start_date: '2026-10-01', end_date: '2026-10-05' }

/** Five dated days; the ones named get a place. */
function fiveDays(planned: number[] = []): Day[] {
  return Array.from({ length: 5 }, (_, i) => buildDay({
    id: i + 1,
    day_number: i + 1,
    date: `2026-10-0${i + 1}`,
    assignments: planned.includes(i + 1) ? [buildAssignment({ day_id: i + 1, place: buildPlace({ id: 90 + i }) })] : [],
  }))
}

async function ask(payload: Parameters<ReturnType<typeof useTripRangeGuard>['check']>[1]): Promise<RangeCheck> {
  const { result } = renderHook(() => useTripRangeGuard(), { wrapper })
  let answer: RangeCheck = null
  await act(async () => { answer = await result.current.check(trip, payload) })
  expect(result.current.checking).toBe(false)
  return answer
}

beforeEach(() => {
  repos.days.mockReset().mockResolvedValue({ days: fiveDays([4, 5]) })
  repos.reservations.mockReset().mockResolvedValue({ reservations: [] })
  repos.accommodations.mockReset().mockResolvedValue({ accommodations: [] })
  repos.budget.mockReset().mockResolvedValue({ items: [] })
})

describe('useTripRangeGuard', () => {
  it('FE-HOOK-RANGEGUARD-001: a save that keeps the dates is answered without reading anything', async () => {
    const rename = { title: 'Renamed', start_date: trip.start_date, end_date: trip.end_date }
    expect(await ask(rename)).toBeNull()
    expect(await ask({})).toBeNull()
    expect(repos.days).not.toHaveBeenCalled()
    expect(repos.reservations).not.toHaveBeenCalled()
    expect(repos.accommodations).not.toHaveBeenCalled()
  })

  it('FE-HOOK-RANGEGUARD-002: an earlier end reads the three repos and names the days it takes, with what is on them', async () => {
    const answer = await ask({ start_date: '2026-10-01', end_date: '2026-10-03' }) as RangeRemoval
    expect(repos.days).toHaveBeenCalledTimes(1)
    expect(repos.reservations).toHaveBeenCalledTimes(1)
    expect(repos.accommodations).toHaveBeenCalledTimes(1)
    expect(answer.removedDays.map(r => r.day.id)).toEqual([4, 5])
    expect(answer.content.places).toBe(2)
    expect(answer.startMoved).toBe(false)
    // Named the way the day list names them: the date, short.
    expect(answer.dayLabels).toEqual(['Sun, Oct 4', 'Mon, Oct 5'])
  })

  it('FE-HOOK-RANGEGUARD-003: days that go empty ask nothing', async () => {
    repos.days.mockResolvedValue({ days: fiveDays([1, 2]) })
    expect(await ask({ start_date: '2026-10-01', end_date: '2026-10-03' })).toBeNull()
  })

  it('FE-HOOK-RANGEGUARD-004: when the days cannot be read the answer is unknown, not silence', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    repos.reservations.mockRejectedValue(new Error('500'))
    expect(await ask({ start_date: '2026-10-01', end_date: '2026-10-03' })).toBe('unknown')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('FE-HOOK-RANGEGUARD-006: the expenses say whether the booking of a removed stay has one; unreadable ones cost no answer', async () => {
    repos.accommodations.mockResolvedValue({ accommodations: [{ id: 9, trip_id: 7, start_day_id: 4, end_day_id: 5, place_name: 'Harbour Hotel' } as Accommodation] })
    repos.reservations.mockResolvedValue({ reservations: [buildReservation({ id: 40, day_id: 4, type: 'hotel', title: 'Harbour, 1 night', accommodation_id: 9 })] })
    const shrink = { start_date: '2026-10-01', end_date: '2026-10-03' }

    // Read, and none written against the booking.
    expect((await ask(shrink) as RangeRemoval).content.stays[0].expense).toBeNull()
    // Read, with one: said, though not by its sum, since shortening keeps it.
    repos.budget.mockResolvedValue({ items: [buildBudgetItem({ reservation_id: 40, total_price: 120 })] })
    expect((await ask(shrink) as RangeRemoval).content.stays[0].expense).toEqual({ amount: null })
    // Not readable: the warning still comes, and says the booking may have one.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    repos.budget.mockRejectedValue(new Error('500'))
    const answer = await ask(shrink) as RangeRemoval
    expect(answer.content.stays[0]).toMatchObject({ booking: 'Harbour, 1 night', expense: { amount: null } })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('FE-HOOK-RANGEGUARD-005: a later start with the same end takes the last days and says the start moved', async () => {
    const answer = await ask({ start_date: '2026-10-03', end_date: '2026-10-05' }) as RangeRemoval
    expect(answer.removedDays.map(r => r.day.id)).toEqual([4, 5])
    expect(answer.startMoved).toBe(true)
  })
})
