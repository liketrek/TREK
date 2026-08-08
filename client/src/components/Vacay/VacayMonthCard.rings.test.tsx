// FE-COMP-VCYMC-001 to FE-COMP-VCYMC-004
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import VacayMonthCard from './VacayMonthCard'
import type { HolidaysMap, VacayEntry } from '../../types'

interface CardProps {
  entryMap?: Record<string, VacayEntry[]>
  sharedMap?: Record<string, { color: string }[]>
  holidays?: HolidaysMap
  companyHolidaySet?: Set<string>
  weekStart?: number
  onCellHover?: (date: string | null, el: HTMLElement | null) => void
}

function renderCard(over: CardProps & { year?: number; month?: number } = {}) {
  const {
    entryMap = {}, sharedMap, holidays = {}, companyHolidaySet = new Set<string>(),
    weekStart = 1, onCellHover, year = 2026, month = 5,
  } = over
  return render(
    <VacayMonthCard
      year={year}
      month={month}
      holidays={holidays}
      companyHolidaySet={companyHolidaySet}
      entryMap={entryMap}
      sharedMap={sharedMap}
      onCellClick={() => {}}
      onCellHover={onCellHover}
      companyMode={false}
      blockWeekends={false}
      weekStart={weekStart}
    />,
  )
}

/** Day cells carry the number as their only text. */
function cell(day: number): HTMLElement {
  return screen.getByText(String(day)).closest('div[style]') as HTMLElement
}

/** Position of the 1st inside the day grid — the lead depends on the week start. */
function firstOfMonthSlot(container: HTMLElement): number {
  const first = within(container).getByText('1')
  const grid = first.closest('.grid') as HTMLElement
  return [...grid.children].findIndex(c => c.contains(first))
}

describe('VacayMonthCard rings', () => {
  it('FE-COMP-VCYMC-001: a Sunday week start pushes the 1st one slot further', () => {
    // 2026-06-01 is a Monday: first slot with Monday first, second with Sunday first.
    expect(firstOfMonthSlot(renderCard().container)).toBe(0)
    expect(firstOfMonthSlot(renderCard({ weekStart: 0 }).container)).toBe(1)
  })

  it('FE-COMP-VCYMC-001b: a month starting on Sunday fills a whole leading week', () => {
    // 2026-02-01 is a Sunday, so a Monday-first grid needs six blanks in front.
    expect(firstOfMonthSlot(renderCard({ month: 1 }).container)).toBe(6)
  })

  it('FE-COMP-VCYMC-001c: today is outlined, nested inside any shared rings', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    renderCard({
      year: now.getFullYear(),
      month: now.getMonth(),
      sharedMap: { [today]: [{ color: '#f59e0b' }] },
    })

    const shadow = cell(now.getDate()).style.boxShadow
    expect(shadow).toContain('inset 0 0 0 2px var(--vg-ink)')
    expect(shadow).toContain('inset 0 0 0 4px #f59e0b')
  })

  it('FE-COMP-VCYMC-002: shared calendars stack up to two inset rings on a day', () => {
    renderCard({
      sharedMap: {
        '2026-06-10': [{ color: '#f59e0b' }, { color: '#10b981' }, { color: '#3b82f6' }],
      },
    })

    const shadow = cell(10).style.boxShadow
    expect(shadow).toContain('#f59e0b')
    expect(shadow).toContain('#10b981')
    expect(shadow).not.toContain('#3b82f6')
  })

  it('FE-COMP-VCYMC-003: hovering only reports days that have something to explain', () => {
    const onCellHover = vi.fn((_date: string | null, _el: HTMLElement | null) => {})
    renderCard({
      onCellHover,
      entryMap: { '2026-06-10': [{ date: '2026-06-10', user_id: 1, person_color: '#3b82f6' }] },
    })

    fireEvent.mouseEnter(cell(11))
    expect(onCellHover).not.toHaveBeenCalled()

    fireEvent.mouseEnter(cell(10))
    expect(onCellHover).toHaveBeenCalledWith('2026-06-10', expect.anything())

    fireEvent.mouseLeave(cell(10))
    expect(onCellHover).toHaveBeenLastCalledWith(null, null)
  })

  it('FE-COMP-VCYMC-004: a plain day gets a hover background that is restored on leave', () => {
    renderCard()
    const plain = cell(11)

    fireEvent.mouseEnter(plain)
    expect(plain.style.background).toBe('var(--vg-surf2)')

    fireEvent.mouseLeave(plain)
    expect(plain.style.background).toBe('transparent')
  })
})
