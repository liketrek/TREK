// FE-JRN-COVER-001 to FE-JRN-COVER-008

import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../../tests/helpers/render'
import JourneyEntryCover, { type CoverEntry } from './JourneyEntryCover'

function buildEntry(overrides: Partial<CoverEntry> = {}): CoverEntry {
  return {
    id: 10,
    type: 'entry',
    title: 'Mercado da Ribeira',
    entry_date: '2026-03-15',
    location_name: 'Lisbon, Portugal',
    country_code: 'PT',
    photos: [{ photo_id: 7 }],
    ...overrides,
  }
}

describe('JourneyEntryCover', () => {
  it('FE-JRN-COVER-001: the photo fills the card, with the name and place on it', () => {
    // Queried by tag: the photo is decoration behind the words, so it carries an
    // empty alt and no img role.
    const { container } = render(<JourneyEntryCover entry={buildEntry()} dayColor="#6366f1" isActive={false} onClick={() => {}} />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/7/thumbnail')
    expect(screen.getByText('Mercado da Ribeira')).toBeInTheDocument()
    expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument()
  })

  it('FE-JRN-COVER-002: an entry with no photo still reads as a card', () => {
    // The day colour carries it, so the carousel does not go blank where somebody
    // wrote something down without taking a picture.
    const { container } = render(<JourneyEntryCover entry={buildEntry({ photos: [] })} dayColor="#6366f1" isActive={false} onClick={() => {}} />)

    // The country's flag is an <img> of its own, so the photo is queried by source.
    expect(container.querySelector('img[src*="/thumbnail"]')).toBeNull()
    expect(screen.getByText('Mercado da Ribeira')).toBeInTheDocument()
  })

  it('FE-JRN-COVER-003: the country rides in the corner, and only with a country', () => {
    const { rerender } = render(
      <JourneyEntryCover entry={buildEntry()} dayColor="#6366f1" isActive={false} onClick={() => {}} />,
    )
    expect(screen.getByAltText('PT')).toBeInTheDocument()

    rerender(
      <JourneyEntryCover entry={buildEntry({ country_code: null })} dayColor="#6366f1" isActive={false} onClick={() => {}} />,
    )
    expect(screen.queryByAltText('PT')).toBeNull()
  })

  it('FE-JRN-COVER-004: a suggestion says so, so it is not mistaken for somewhere you have been', () => {
    render(
      <JourneyEntryCover
        entry={buildEntry({ type: 'skeleton', title: null })}
        dayColor="#6366f1"
        isActive={false}
        onClick={() => {}}
      />,
    )

    // The corner mark says it to a screen reader; the title says it in words,
    // since a suggestion pulled from a trip place is the one card with no story.
    expect(screen.getByLabelText('Suggestion')).toBeInTheDocument()
    expect(screen.getByText('Suggestion')).toBeInTheDocument()
  })

  it('FE-JRN-COVER-005: mood and weather appear only while the journey keeps those fields', () => {
    const entry = buildEntry({ mood: 'good', weather: 'sunny' })
    const { container, rerender } = render(
      <JourneyEntryCover entry={entry} dayColor="#6366f1" isActive={false} onClick={() => {}} />,
    )
    const withBoth = container.querySelectorAll('svg').length

    rerender(
      <JourneyEntryCover entry={entry} dayColor="#6366f1" isActive={false} onClick={() => {}} showMood={false} showWeather={false} />,
    )
    expect(container.querySelectorAll('svg').length).toBe(withBoth - 2)
  })

  it('FE-JRN-COVER-006: the active card is the larger one', () => {
    const { container, rerender } = render(
      <JourneyEntryCover entry={buildEntry()} dayColor="#6366f1" isActive={false} onClick={() => {}} />,
    )
    expect(container.querySelector('button')!.className).toContain('w-[136px]')

    rerender(<JourneyEntryCover entry={buildEntry()} dayColor="#6366f1" isActive onClick={() => {}} />)
    expect(container.querySelector('button')!.className).toContain('w-[164px]')
  })

  it('FE-JRN-COVER-007: a shared journey serves its photos through the share token', () => {
    const { container } = render(
      <JourneyEntryCover
        entry={buildEntry()}
        dayColor="#6366f1"
        isActive={false}
        onClick={() => {}}
        photoUrlFor={id => `/api/public/journey/tok/photos/${id}/original`}
      />,
    )

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/public/journey/tok/photos/7/original')
  })

  it('FE-JRN-COVER-008: tapping it opens the entry', async () => {
    const onClick = vi.fn()
    render(<JourneyEntryCover entry={buildEntry()} dayColor="#6366f1" isActive onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
