import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import VacayMonthCard from './VacayMonthCard'

const baseProps = {
  year: 2025,
  month: 0, // January 2025
  holidays: {},
  companyHolidaySet: new Set<string>(),
  companyHolidaysEnabled: true,
  entryMap: {},
  onCellClick: vi.fn(),
  companyMode: false,
  blockWeekends: true,
  weekendDays: [0, 6],
}

afterEach(() => {
  resetAllStores()
  vi.clearAllMocks()
})

describe('VacayMonthCard', () => {
  it('FE-COMP-VACAYMONTHCARD-001: Renders the month name', () => {
    render(<VacayMonthCard {...baseProps} />)
    // January in en-US locale via Intl.DateTimeFormat
    expect(screen.getByText(/january/i)).toBeInTheDocument()
  })

  it('FE-COMP-VACAYMONTHCARD-002: Renders correct number of day cells for January 2025', () => {
    render(<VacayMonthCard {...baseProps} />)
    // January 2025 has 31 days
    for (let d = 1; d <= 31; d++) {
      expect(screen.getByText(String(d))).toBeInTheDocument()
    }
  })

  it('FE-COMP-VACAYMONTHCARD-003: Calls onCellClick with the correct ISO date string', async () => {
    const user = userEvent.setup()
    render(<VacayMonthCard {...baseProps} />)
    // January 15, 2025 is a Wednesday (not blocked)
    await user.click(screen.getByText('15'))
    expect(baseProps.onCellClick).toHaveBeenCalledWith('2025-01-15')
  })

  it('FE-COMP-VACAYMONTHCARD-004: Holiday cell has tooltip with localName', () => {
    const props = {
      ...baseProps,
      holidays: { '2025-01-01': { name: 'Neujahr', localName: 'Neujahr', label: null, color: '#ef4444' } },
    }
    render(<VacayMonthCard {...props} />)
    // Jan 1 is a Wednesday — there may be multiple "1" text nodes, find the one with a title
    const cell = screen.getByTitle('Neujahr')
    expect(cell).toBeInTheDocument()
  })

  it('FE-COMP-VACAYMONTHCARD-005: Holiday cell with label shows combined tooltip', () => {
    const props = {
      ...baseProps,
      holidays: { '2025-01-01': { name: 'New Year', localName: 'New Year', label: 'DE', color: '#ef4444' } },
    }
    render(<VacayMonthCard {...props} />)
    const cell = screen.getByTitle('DE: New Year')
    expect(cell).toBeInTheDocument()
  })

  it('FE-COMP-VACAYMONTHCARD-014: School holiday markers do not recolor the day number', () => {
    const props = {
      ...baseProps,
      holidays: { '2025-01-02': { name: 'School holiday', localName: 'School holiday', label: 'NL', color: '#22c55e', type: 'school_holiday' as const } },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('2')
    expect(daySpan.style.color).toBe('var(--vg-ink2)')
  })

  it('FE-COMP-VACAYMONTHCARD-006: Weekend cell has default cursor (blocked)', () => {
    render(<VacayMonthCard {...baseProps} />)
    // January 5, 2025 is a Sunday (getDay() === 0), which is in weekendDays [0, 6]
    // isBlocked = weekend && blockWeekends = true
    const daySpan = screen.getByText('5')
    const cell = daySpan.closest('div') as HTMLElement
    expect(cell.style.cursor).toBe('default')
  })

  it('FE-COMP-VACAYMONTHCARD-006a: a blocked weekend cell that still holds an entry stays clickable (#1897)', () => {
    const props = {
      ...baseProps,
      entryMap: { '2025-01-05': [{ date: '2025-01-05', user_id: 1, person_color: '#6366f1' }] },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('5')
    const cell = daySpan.closest('div') as HTMLElement
    expect(cell.style.cursor).toBe('pointer')
  })

  it('FE-COMP-VACAYMONTHCARD-007: Company holiday cell shows amber fill', () => {
    const props = {
      ...baseProps,
      companyHolidaySet: new Set(['2025-01-10']),
      companyHolidaysEnabled: true,
    }
    render(<VacayMonthCard {...props} />)
    // January 10, 2025 is a Friday (not a weekend)
    const daySpan = screen.getByText('10')
    const cell = daySpan.closest('div') as HTMLElement
    // Amber fill is applied to the cell background itself (glass facelift).
    expect(cell.style.background).toMatch(/245,\s*158,\s*11/)
  })

  it('FE-COMP-VACAYMONTHCARD-008: Single vacation entry fills the cell with the person colour', () => {
    const props = {
      ...baseProps,
      entryMap: { '2025-01-15': [{ date: '2025-01-15', user_id: 1, person_color: '#6366f1' }] },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('15')
    const cell = daySpan.closest('div') as HTMLElement
    // Person colour is the cell background; the day number flips to white.
    expect(cell.style.background).toMatch(/#6366f1|99,\s*102,\s*241/i)
    expect(daySpan.style.color).toMatch(/#fff|255,\s*255,\s*255/i)
  })

  it('FE-COMP-VACAYMONTHCARD-009: Day number font-weight is bold when entries exist', () => {
    const props = {
      ...baseProps,
      entryMap: { '2025-01-20': [{ date: '2025-01-15', user_id: 1, person_color: '#6366f1' }] },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('20')
    expect(daySpan.style.fontWeight).toBe('700')
  })

  it('FE-COMP-VACAYMONTHCARD-010: Renders 7 weekday header labels', () => {
    render(<VacayMonthCard {...baseProps} />)
    // Weekday labels from translations: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (const wd of weekdays) {
      expect(screen.getByText(wd)).toBeInTheDocument()
    }
  })

  it('FE-COMP-VACAYMONTHCARD-013: Recomputes day positions when week start changes', () => {
    const { container, rerender } = render(<VacayMonthCard {...baseProps} weekStart={1} />)

    const getFirstWeekLabels = () =>
      Array.from(container.querySelectorAll('.grid.grid-cols-7')[1].children)
        .slice(0, 7)
        .map((cell) => cell.textContent?.trim() || '')

    // January 1, 2025 is Wednesday: two leading blanks for Monday-first weeks.
    expect(getFirstWeekLabels()).toEqual(['', '', '1', '2', '3', '4', '5'])

    rerender(<VacayMonthCard {...baseProps} weekStart={0} />)

    // Sunday-first weeks need three leading blanks; this must update after the
    // setting changes so Saturday/Sunday weekends stay under their real headers.
    expect(getFirstWeekLabels()).toEqual(['', '', '', '1', '2', '3', '4'])
  })

  it('FE-COMP-VACAYMONTHCARD-011: Two vacation entries split the cell into two clipped halves', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [{ date: '2025-01-15', user_id: 1, person_color: '#6366f1' }, { date: '2025-01-15', user_id: 2, person_color: '#f43f5e' }],
      },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('15')
    const cell = daySpan.closest('div') as HTMLElement
    // Each half is its own clipped overlay so it can be solid or hatched on its
    // own (#1074) — the diagonal is no longer one gradient on the cell itself.
    // jsdom normalises the hex inside color-mix() to rgb().
    const halves = [...cell.querySelectorAll<HTMLElement>('div')].filter(d => d.style.clipPath)
    expect(halves).toHaveLength(2)
    expect(halves[0].style.background).toContain('rgb(99, 102, 241)')
    expect(halves[1].style.background).toContain('rgb(244, 63, 94)')
    expect(halves.map(h => h.style.background).join()).not.toContain('repeating-linear-gradient')
  })

  it('FE-COMP-VACAYMONTHCARD-011a: a comp day hatches only its own half of the split (#1074)', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [
          { date: '2025-01-15', user_id: 1, person_color: '#6366f1', kind: 'comp' as const },
          { date: '2025-01-15', user_id: 2, person_color: '#f43f5e' },
        ],
      },
    }
    render(<VacayMonthCard {...props} />)
    const cell = screen.getByText('15').closest('div') as HTMLElement
    const halves = [...cell.querySelectorAll<HTMLElement>('div')].filter(d => d.style.clipPath)
    expect(halves[0].style.background).toContain('repeating-linear-gradient')
    expect(halves[1].style.background).not.toContain('repeating-linear-gradient')
  })

  it('FE-COMP-VACAYMONTHCARD-011b: a single comp day hatches the whole cell (#1074)', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [{ date: '2025-01-15', user_id: 1, person_color: '#6366f1', kind: 'comp' as const }],
      },
    }
    render(<VacayMonthCard {...props} />)
    const cell = screen.getByText('15').closest('div') as HTMLElement
    expect(cell.style.background).toContain('repeating-linear-gradient')
  })

  it('FE-COMP-VACAYMONTHCARD-011c: an all-comp day keeps the white digit and gains a shadow to carry it (#1074)', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [{ date: '2025-01-15', user_id: 1, person_color: '#6366f1', kind: 'comp' as const }],
        // A solid vacation fill needs no shadow — the fill itself is the contrast.
        '2025-01-16': [{ date: '2025-01-16', user_id: 1, person_color: '#6366f1' }],
      },
    }
    render(<VacayMonthCard {...props} />)
    const comp = screen.getByText('15')
    const vacation = screen.getByText('16')
    expect(comp).toHaveStyle({ color: '#fff' })
    // Only that the shadow is there — its exact strength is a design value.
    expect(comp.style.textShadow).not.toBe('')
    expect(vacation).toHaveStyle({ color: '#fff' })
    expect(vacation.style.textShadow).toBe('')
  })

  it('FE-COMP-VACAYMONTHCARD-011d: a mixed comp/vacation day needs no shadow — a solid half sits under the digit (#1074)', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [
          { date: '2025-01-15', user_id: 1, person_color: '#6366f1', kind: 'comp' as const },
          { date: '2025-01-15', user_id: 2, person_color: '#f43f5e' },
        ],
      },
    }
    render(<VacayMonthCard {...props} />)
    expect(screen.getByText('15')).toHaveStyle({ color: '#fff' })
    expect(screen.getByText('15').style.textShadow).toBe('')
  })

  it('FE-COMP-VACAYMONTHCARD-012: Four vacation entries render quadrant overlay', () => {
    const props = {
      ...baseProps,
      entryMap: {
        '2025-01-15': [
          { date: '2025-01-15', user_id: 1, person_color: '#6366f1' },
          { date: '2025-01-15', user_id: 1, person_color: '#f43f5e' },
          { date: '2025-01-15', user_id: 1, person_color: '#22c55e' },
          { date: '2025-01-15', user_id: 1, person_color: '#f59e0b' },
        ],
      },
    }
    render(<VacayMonthCard {...props} />)
    const daySpan = screen.getByText('15')
    const cell = daySpan.closest('div') as HTMLElement
    // Quadrant overlay wrapper div (4 entries) has 4 sub-divs
    const wrapperDiv = cell.querySelector(':scope > div') as HTMLElement
    expect(wrapperDiv).toBeTruthy()
    const quadrants = wrapperDiv.querySelectorAll(':scope > div')
    expect(quadrants).toHaveLength(4)
  })
})
