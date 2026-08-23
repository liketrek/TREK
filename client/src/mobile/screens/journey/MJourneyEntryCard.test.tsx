// FE-COMP-MJOURNEYCARD-001 to FE-COMP-MJOURNEYCARD-003
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../../tests/helpers/render'
import MJourneyEntryCard from './MJourneyEntryCard'
import type { JourneyEntry } from '../../../store/journeyStore'

// #2022: a long entry comment grew the card, and with it the bottom-anchored
// carousel, until the timeline covered the map. jsdom does no layout, so these
// assert the class contract the browser cascade depends on, not pixel heights.
const LONG_STORY = Array.from({ length: 400 }, (_, i) => `wort${i % 7}`).join(' ')

// Tailwind emits the display plugin AFTER lineClamp, so any display utility on
// the same element overrides `line-clamp-*`'s own `-webkit-box` and the clamp
// silently stops working.
const DISPLAY_UTILITIES = ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'flow-root', 'contents', 'inline']

const buildEntry = (overrides: Partial<JourneyEntry> = {}): JourneyEntry => ({
  id: 1,
  journey_id: 7,
  author_id: 1,
  type: 'entry',
  title: 'Erster Tag',
  story: LONG_STORY,
  entry_date: '2026-03-03',
  visibility: 'private',
  sort_order: 0,
  photos: [],
  created_at: 0,
  updated_at: 0,
  ...overrides,
})

describe('MJourneyEntryCard', () => {
  it('FE-COMP-MJOURNEYCARD-001: keeps the story preview clamp free of a competing display utility', () => {
    render(<MJourneyEntryCard entry={buildEntry()} number={1} onClick={vi.fn()} />)

    const classes = screen.getByText(LONG_STORY).className.split(/\s+/)
    expect(classes).toContain('line-clamp-2')
    DISPLAY_UTILITIES.forEach(utility => expect(classes).not.toContain(utility))
  })

  it('FE-COMP-MJOURNEYCARD-002: caps the card height so the timeline cannot grow over the map', () => {
    render(<MJourneyEntryCard entry={buildEntry()} number={1} onClick={vi.fn()} />)

    const classes = screen.getByRole('button').className.split(/\s+/)
    expect(classes.some(c => /^max-h-\[\d+px\]$/.test(c))).toBe(true)
    expect(classes).toContain('overflow-hidden')
  })

  it('FE-COMP-MJOURNEYCARD-003: renders no preview for an entry without a story', () => {
    render(<MJourneyEntryCard entry={buildEntry({ story: null })} number={2} onClick={vi.fn()} />)

    expect(screen.queryByText(LONG_STORY)).not.toBeInTheDocument()
    expect(screen.getByText('Erster Tag')).toBeInTheDocument()
  })
})
