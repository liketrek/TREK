// FE-JRN-DAYDAW-001 to FE-JRN-DAYDAW-008
/**
 * The fold a journal day carries for the stays Dawarich recorded on it.
 *
 * The rows inside it are `SuggestionRow`, which the panel's own suite pins end to end, so
 * what is worth holding here is the fold: that it says nothing on a quiet day, that the
 * line reads before it is opened, and that the two actions reach the journal with the
 * stay they belong to. The whole point of this component is that forty stays no longer
 * stand between a reader and their first entry, and that only works while it starts shut.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '../../../tests/helpers/render'
import { fireEvent } from '@testing-library/react'
import type { DawarichSuggestion } from '@trek/shared'
import { useSettingsStore } from '../../store/settingsStore'
import JourneyDayDawarich from './JourneyDayDawarich'

function stay(over: Partial<DawarichSuggestion> & { id: number }): DawarichSuggestion {
  const date = over.localDate ?? '2026-09-10'
  return {
    id: over.id,
    sourceVisitId: String(over.id),
    tripId: null,
    tripTitle: null,
    name: over.name ?? 'Cafe Reichard',
    lat: 50.94,
    lng: 6.96,
    startedAt: over.startedAt ?? `${date}T10:15:00+02:00`,
    endedAt: over.endedAt ?? `${date}T12:40:00+02:00`,
    durationMinutes: over.durationMinutes ?? 145,
    localDate: date,
    sourceStatus: 'suggested',
    confidence: null,
    confidenceBand: null,
    state: 'new',
    target: null,
    acceptedPlaceId: null,
    acceptedJournalEntryId: null,
    acceptedBucketListItemId: null,
    sourceChanged: false,
    sourceMissing: false,
    matchedBucketListItemId: null,
    matchedBucketListName: null,
    countryCode: null,
    firstSeenAt: `${date}T06:00:00Z`,
    lastSeenAt: `${date}T06:00:00Z`,
    ...over,
  } as DawarichSuggestion
}

function fold(suggestions: DawarichSuggestion[], over: Partial<{ busyId: number | null }> = {}) {
  const onAccept = vi.fn()
  const onDismiss = vi.fn()
  const view = render(
    <JourneyDayDawarich
      suggestions={suggestions}
      busyId={over.busyId ?? null}
      onAccept={onAccept}
      onDismiss={onDismiss}
    />,
  )
  return { onAccept, onDismiss, ...view }
}

const head = () => screen.getByRole('button', { expanded: false }) ?? screen.getByRole('button')

describe('JourneyDayDawarich', () => {
  it('FE-JRN-DAYDAW-001: a day with nothing pending draws nothing at all', () => {
    // Not an empty row saying so: a connected, quiet integration is invisible, and this
    // one would otherwise appear on every single day of the journey.
    const { container } = fold([])

    expect(container).toBeEmptyDOMElement()
  })

  it('FE-JRN-DAYDAW-002: shut, it says how many and which part of the day they cover', () => {
    fold([
      stay({ id: 1, startedAt: '2026-09-10T08:00:00+02:00', endedAt: '2026-09-10T09:30:00+02:00' }),
      stay({ id: 2, startedAt: '2026-09-10T14:00:00+02:00', endedAt: '2026-09-10T17:08:00+02:00' }),
    ])

    expect(screen.getByText('2 stays from Dawarich')).toBeInTheDocument()
    // First arrival to last departure, not each stay's own range.
    expect(screen.getByText('08:00 – 17:08')).toBeInTheDocument()
  })

  it('FE-JRN-DAYDAW-003: one stay takes the singular', () => {
    // A single key with a placeholder would read "1 stays".
    fold([stay({ id: 1 })])

    expect(screen.getByText('1 stay from Dawarich')).toBeInTheDocument()
  })

  it('FE-JRN-DAYDAW-004: it starts shut, and the stays are not in the page until it opens', () => {
    fold([stay({ id: 1, name: 'Cafe Reichard' })])

    expect(screen.queryByText('Cafe Reichard')).toBeNull()
    expect(head()).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(head())

    expect(screen.getByText('Cafe Reichard')).toBeInTheDocument()
  })

  it('FE-JRN-DAYDAW-005: open, each stay is a row with its own two actions', () => {
    const { onDismiss } = fold([stay({ id: 7, name: 'Cafe Reichard' })])
    fireEvent.click(head())

    const row = screen.getByText('Cafe Reichard').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: 'Not a place I visited' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onDismiss.mock.calls[0][0]).toMatchObject({ id: 7 })
  })

  it('FE-JRN-DAYDAW-006: accepting hands back the stay it was asked about and where it goes', () => {
    const { onAccept } = fold([stay({ id: 7, name: 'Cafe Reichard' })])
    fireEvent.click(head())

    fireEvent.click(screen.getByRole('button', { name: /journal|journey/i }))

    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onAccept.mock.calls[0][0]).toMatchObject({ id: 7 })
    expect(onAccept.mock.calls[0][1]).toBe('journal')
  })

  it('FE-JRN-DAYDAW-007: the stay a write is in flight for is the one that goes busy', () => {
    fold([stay({ id: 7, name: 'Cafe Reichard' }), stay({ id: 8, name: 'Zum Treppchen' })], { busyId: 7 })
    fireEvent.click(head())

    const busyRow = screen.getByText('Cafe Reichard').closest('div')!.parentElement!
    const idleRow = screen.getByText('Zum Treppchen').closest('div')!.parentElement!
    expect(within(busyRow).getAllByRole('button')[0]).toBeDisabled()
    expect(within(idleRow).getAllByRole('button')[0]).not.toBeDisabled()
  })

  it('FE-JRN-DAYDAW-008: the span follows the traveller own clock', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, time_format: '12h' } }))
    fold([
      stay({ id: 1, startedAt: '2026-09-10T08:00:00+02:00', endedAt: '2026-09-10T09:30:00+02:00' }),
      stay({ id: 2, startedAt: '2026-09-10T14:00:00+02:00', endedAt: '2026-09-10T17:08:00+02:00' }),
    ])

    expect(screen.getByText('8:00 AM – 5:08 PM')).toBeInTheDocument()
    useSettingsStore.setState(s => ({ settings: { ...s.settings, time_format: '24h' } }))
  })
})
