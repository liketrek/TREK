// FE-JRN-SCRUBBER-001 to FE-JRN-SCRUBBER-005

import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../../tests/helpers/render'
import JourneyDayScrubber from './JourneyDayScrubber'

const DAYS = [
  { date: '2026-03-15', color: '#6366f1' },
  { date: '2026-03-16', color: '#f97316' },
  { date: '2026-03-17', color: '#14b8a6' },
]

describe('JourneyDayScrubber', () => {
  it('FE-JRN-SCRUBBER-001: one segment per day', () => {
    render(<JourneyDayScrubber days={DAYS} activeDate="2026-03-15" onPick={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('FE-JRN-SCRUBBER-002: says which day you are on, by its date', () => {
    render(<JourneyDayScrubber days={DAYS} activeDate="2026-03-16" onPick={() => {}} />)

    // The long date is the label the reader was missing on the cards. "Day 2"
    // stood beside it for a while and was the same fact told twice.
    expect(screen.getByText(/16/)).toBeInTheDocument()
    expect(screen.queryByText(/^Day \d/)).toBeNull()
  })

  it('FE-JRN-SCRUBBER-003: marks the day it is on', () => {
    render(<JourneyDayScrubber days={DAYS} activeDate="2026-03-17" onPick={() => {}} />)

    const marked = screen.getAllByRole('button').filter(b => b.getAttribute('aria-current') === 'true')
    expect(marked).toHaveLength(1)
  })

  it('FE-JRN-SCRUBBER-004: a tap asks for that day', async () => {
    const onPick = vi.fn()
    render(<JourneyDayScrubber days={DAYS} activeDate="2026-03-15" onPick={onPick} />)

    await userEvent.click(screen.getAllByRole('button')[2])

    expect(onPick).toHaveBeenCalledWith('2026-03-17')
  })

  it('FE-JRN-SCRUBBER-005: a one-day journey has nothing to scrub', () => {
    // The bar would say only what the card's own date already says, and it would
    // take a row of the map to do it.
    const { container } = render(
      <JourneyDayScrubber days={[DAYS[0]]} activeDate="2026-03-15" onPick={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
