// FE-DAWARICH-PANEL-001 to FE-DAWARICH-PANEL-033
/**
 * The review panel both shells share, pinned end to end.
 *
 * `useDawarichSuggestions` is mocked rather than the network: the hook is
 * already covered on its own, and driving the panel through six `status`
 * values, a busy row and a refused accept via MSW would mean six round trips to
 * assert one branch each. What is NOT mocked is anything the panel renders
 * itself, `DawarichAcceptDialog` included, because the wiring between a row's
 * button and that dialog's confirm is exactly the part that would rot silently.
 *
 * What is worth pinning here, roughly in the order of what breaks worst:
 *
 *  - **The panel renders nothing when there is nothing to review.** A connected,
 *    quiet integration is meant to be invisible; the moment that early return
 *    goes, every trip in the app grows a permanent empty card explaining that
 *    Dawarich found nothing.
 *  - **`accept` is the only path that writes.** The dialog closes and the host
 *    is notified only when the hook says the write landed, so a refused accept
 *    has to leave the dialog standing with the user's corrections still in it.
 *  - **The two accept buttons are conditional on there being somewhere to put
 *    the stay.** The planner has no journey list and the journal has no trip
 *    list; offering the missing one opens an empty picker.
 *  - **A shrinking place count means somebody deleted what an acceptance
 *    created**, which puts the stay back into review on the server. If that
 *    effect stops firing, the row stays hidden until a full reload.
 *  - **The phone shell paints from `--m-*`.** Both shells run this one
 *    component, so every palette fork inside it is real behaviour that no
 *    mobile-screen test covers.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, within } from '../../../tests/helpers/render'
import { fireEvent } from '@testing-library/react'
import type { DawarichSuggestion } from '@trek/shared'
import type { Place } from '../../types'
import type { DawarichSuggestionsState } from '../../hooks/useDawarichSuggestions'
import { useTripStore } from '../../store/tripStore'
import DawarichSuggestionsPanel from './DawarichSuggestionsPanel'

// The hook is the panel's whole world: status, rows, the busy row and the three
// mutations. Held in a `let` the factory reads lazily, so each test hands the
// panel a different world without re-importing the component.
let S: DawarichSuggestionsState
const seenFilter = vi.fn()
vi.mock('../../hooks/useDawarichSuggestions', () => ({
  useDawarichSuggestions: (filter?: { tripId?: number }) => {
    seenFilter(filter)
    return S
  },
}))

// Both the panel and the accept dialog read this module, and the relative
// specifier resolves to the same file from either, so one mock flips the whole
// tree between the desktop tokens and the phone's own palette.
let phone = false
vi.mock('../../mobile/useIsPhone', () => ({ useIsPhone: () => phone }))

function stay(over: Partial<DawarichSuggestion> & { id: number; localDate: string }): DawarichSuggestion {
  return {
    id: over.id,
    sourceVisitId: String(over.id),
    tripId: over.tripId ?? null,
    tripTitle: over.tripTitle ?? null,
    name: over.name ?? 'Cafe Reichard',
    lat: over.lat ?? 50.94,
    lng: over.lng ?? 6.96,
    startedAt: over.startedAt ?? `${over.localDate}T10:15:00+02:00`,
    endedAt: over.endedAt ?? `${over.localDate}T12:40:00+02:00`,
    durationMinutes: over.durationMinutes ?? 145,
    localDate: over.localDate,
    sourceStatus: over.sourceStatus ?? 'suggested',
    confidence: over.confidence ?? null,
    confidenceBand: over.confidenceBand ?? null,
    state: over.state ?? 'new',
    target: over.target ?? null,
    acceptedPlaceId: over.acceptedPlaceId ?? null,
    acceptedJournalEntryId: over.acceptedJournalEntryId ?? null,
    acceptedBucketListItemId: over.acceptedBucketListItemId ?? null,
    sourceChanged: over.sourceChanged ?? false,
    sourceMissing: over.sourceMissing ?? false,
    matchedBucketListItemId: over.matchedBucketListItemId ?? null,
    matchedBucketListName: over.matchedBucketListName ?? null,
    countryCode: over.countryCode ?? null,
    firstSeenAt: over.firstSeenAt ?? '2026-09-10T06:00:00Z',
    lastSeenAt: over.lastSeenAt ?? '2026-09-10T06:00:00Z',
  }
}

const accept = vi.fn<(id: number, body: unknown) => Promise<boolean>>()
const dismiss = vi.fn<(id: number) => Promise<void>>()
const restore = vi.fn<(id: number) => Promise<void>>()
const reload = vi.fn()

function hookState(over: Partial<DawarichSuggestionsState> = {}): DawarichSuggestionsState {
  return {
    suggestions: [],
    status: 'ready',
    lastSyncAt: null,
    lastSyncState: 'ok',
    lastSyncError: null,
    busyId: null,
    reload,
    accept,
    dismiss,
    restore,
    ...over,
  }
}

/** Only the one field the panel's place-count effect reads. */
function places(count: number): Place[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1 })) as unknown as Place[]
}

const TRIPS = [{ id: 5, label: 'Cologne' }]
const JOURNALS = [{ id: 9, label: 'Rhine notes' }]

function panel(props: Partial<React.ComponentProps<typeof DawarichSuggestionsPanel>> = {}) {
  return render(<DawarichSuggestionsPanel {...props} />)
}

/** The collapsible header, which is also the only element carrying aria-expanded. */
function header(): HTMLElement {
  return screen.getByRole('button', { name: /From Dawarich/ })
}

/** The row card holding a given stay name, for scoping a query to one row. */
function rowOf(container: HTMLElement, name: string): HTMLElement {
  const row = within(container).getByText(name).closest('.items-stretch')
  if (!row) throw new Error(`no row found for ${name}`)
  return row as HTMLElement
}

beforeEach(() => {
  phone = false
  S = hookState()
  seenFilter.mockReset()
  accept.mockReset().mockResolvedValue(true)
  dismiss.mockReset().mockResolvedValue(undefined)
  restore.mockReset().mockResolvedValue(undefined)
  reload.mockReset()
  useTripStore.setState({ places: [] })
})

afterEach(() => {
  useTripStore.setState({ places: [] })
})

describe('DawarichSuggestionsPanel: whether it shows up at all', () => {
  it('FE-DAWARICH-PANEL-001: an addon nobody switched on renders nothing', () => {
    S = hookState({ status: 'idle' })
    const { container } = panel()
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-DAWARICH-PANEL-002: connected and quiet is invisible, not an empty card', () => {
    // Read successfully, nothing pending and nothing in the history: the panel
    // stays out of the rail rather than explaining that it found nothing.
    S = hookState({ status: 'ready', suggestions: [] })
    const { container } = panel()
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-DAWARICH-PANEL-003: it does show up while it is still reading, before it knows', () => {
    S = hookState({ status: 'loading', suggestions: [] })
    panel()
    // Twice: once under the title, once in the opened body.
    expect(screen.getAllByText('Reading Dawarich…')).toHaveLength(2)
    expect(header()).toHaveAttribute('aria-expanded', 'true')
  })

  it('FE-DAWARICH-PANEL-004: a failed read is said in the danger colour, without the stale error under it', () => {
    S = hookState({ status: 'unavailable', lastSyncError: 'Dawarich rejected the API key.' })
    const { container } = panel()

    const line = container.querySelector('p.text-danger')
    expect(line).not.toBeNull()
    expect(line).toHaveTextContent('Dawarich could not be read.')
    // The sync error belongs above a list that did load. Beside "could not be
    // read" it is the same news twice in two different wordings.
    expect(screen.queryByText('Dawarich rejected the API key.')).toBeNull()
  })

  it('FE-DAWARICH-PANEL-005: not-connected and offline each get their own sentence', () => {
    S = hookState({ status: 'disconnected' })
    const { unmount } = panel()
    expect(screen.getAllByText('Connect Dawarich in Settings to see your stays here.')).toHaveLength(2)
    unmount()

    S = hookState({ status: 'offline' })
    panel()
    expect(screen.getAllByText('The recorded route needs a connection')).toHaveLength(2)
  })

  it('FE-DAWARICH-PANEL-006: freshness reads as a relative time, and says so when there is none', () => {
    S = hookState({
      suggestions: [stay({ id: 1, localDate: '2026-09-10' })],
      lastSyncAt: new Date(Date.now() - 120_000).toISOString(),
    })
    const { unmount } = panel()
    // "checked 2 minutes ago" answers the question; a stamp makes the reader
    // do the subtraction.
    expect(header()).toHaveTextContent(/checked 2 minutes ago/)
    unmount()

    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })], lastSyncAt: null })
    panel()
    expect(header()).toHaveTextContent('Not checked yet')
  })

  it('FE-DAWARICH-PANEL-007: the trip filter is handed to the hook', () => {
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
    panel({ tripId: 5 })
    expect(seenFilter).toHaveBeenCalledWith({ tripId: 5 })
  })
})

describe('DawarichSuggestionsPanel: the list', () => {
  it('FE-DAWARICH-PANEL-008: stays are grouped by day, newest day first, each day counted', () => {
    S = hookState({
      suggestions: [
        stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig', startedAt: '2026-09-10T18:00:00+02:00' }),
        stay({ id: 2, localDate: '2026-09-10', name: 'Cafe Reichard' }),
        stay({ id: 3, localDate: '2026-09-11', name: 'Koelner Dom' }),
      ],
    })
    const { container } = panel({ trips: TRIPS })

    const headings = Array.from(container.querySelectorAll('.uppercase')).map(node => node.textContent)
    expect(headings).toEqual(['Fri, Sep 11', 'Thu, Sep 10'])
    // The badge in the header repeats what the open list adds up to.
    expect(header()).toHaveTextContent('3')
    // The times, which are the only thing telling two stays on one day apart.
    const row = rowOf(container, 'Cafe Reichard')
    expect(row).toHaveTextContent('10:15')
    expect(row).toHaveTextContent('12:40')
    expect(row).toHaveTextContent('2 h 25 min')
  })

  it('FE-DAWARICH-PANEL-009: collapsed to start, and the header is the way back in', () => {
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig' })] })
    panel({ initiallyCollapsed: true, trips: TRIPS })

    expect(header()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Museum Ludwig')).toBeNull()

    fireEvent.click(header())

    expect(header()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Museum Ludwig')).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-010: bare drops the card and its header, and cannot be collapsed shut', () => {
    S = hookState({
      suggestions: [stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig' })],
      lastSyncAt: null,
    })
    // The phone journey opens this list inside a sheet that already carries a
    // title, and `initiallyCollapsed` must not fold it away in there.
    const { container } = panel({ bare: true, initiallyCollapsed: true, trips: TRIPS })

    expect(screen.queryByRole('button', { name: /From Dawarich/ })).toBeNull()
    expect(screen.getByText('Museum Ludwig')).toBeInTheDocument()
    // Read the property rather than the attribute: what matters is that the
    // card is gone, not how React chooses to serialise an empty className.
    expect(container.querySelector('section')?.className).toBe('')
    // The freshness line survives the missing header, as a plain paragraph.
    expect(screen.getByText('Not checked yet')).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-011: a sync error rides above a list that did load', () => {
    S = hookState({
      status: 'ready',
      suggestions: [stay({ id: 1, localDate: '2026-09-10' })],
      lastSyncError: 'Dawarich asked TREK to slow down. Try again shortly.',
    })
    panel({ trips: TRIPS })
    expect(screen.getByText('Dawarich asked TREK to slow down. Try again shortly.')).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-012: a row carries the flags worth interrupting for, and gone beats changed', () => {
    S = hookState({
      suggestions: [
        stay({
          id: 1,
          localDate: '2026-09-10',
          name: 'Museum Ludwig',
          confidenceBand: 'low',
          // Both set on purpose: a stay that vanished upstream may well have
          // changed before it went, and saying both is two warnings about one
          // row where only the fatal one matters.
          sourceChanged: true,
          sourceMissing: true,
        }),
      ],
    })
    panel({ trips: TRIPS })

    expect(screen.getByRole('img', { name: 'Unsure' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Gone from Dawarich' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Changed in Dawarich' })).toBeNull()
    expect(screen.getByText(/no longer exists in Dawarich/)).toBeInTheDocument()
    expect(screen.queryByText(/has changed in Dawarich/)).toBeNull()
  })

  it('FE-DAWARICH-PANEL-013: a stay that only changed says exactly that, in full', () => {
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10', sourceChanged: true })] })
    panel({ trips: TRIPS })

    expect(screen.getByRole('img', { name: 'Changed in Dawarich' })).toBeInTheDocument()
    expect(screen.getByText(/has changed in Dawarich since you used it/)).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-014: the trip name shows only where rows can come from more than one trip', () => {
    const rows = [stay({ id: 1, localDate: '2026-09-10', tripId: 5, tripTitle: 'Cologne' })]
    S = hookState({ suggestions: rows })
    const { unmount } = panel({ trips: TRIPS })
    expect(screen.getByText('Cologne')).toBeInTheDocument()
    unmount()

    // Inside one trip's rail every row is from that trip, so the name is noise.
    S = hookState({ suggestions: rows })
    panel({ tripId: 5, trips: TRIPS })
    expect(screen.queryByText('Cologne')).toBeNull()
  })

  it('FE-DAWARICH-PANEL-015: a stay with no trip behind it gets no empty badge', () => {
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10', tripId: null, tripTitle: null })] })
    const { container } = panel({ trips: TRIPS })
    // Two badges on the row, the clock and the duration, and nothing else.
    expect(rowOf(container, 'Cafe Reichard').querySelectorAll('.rounded-full.font-semibold')).toHaveLength(2)
  })
})

describe('DawarichSuggestionsPanel: acting on a stay', () => {
  it('FE-DAWARICH-PANEL-016: an action is offered only where there is somewhere to put the stay', () => {
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
    const { unmount } = panel({ trips: [], journals: [] })

    // No trips and no journeys: only "not a place I visited" is still an answer.
    expect(screen.queryByRole('button', { name: 'Add as a place' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Write a journal entry' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Not a place I visited' })).toBeInTheDocument()
    unmount()

    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
    panel({ trips: TRIPS, journals: JOURNALS })
    expect(screen.getByRole('button', { name: 'Add as a place' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write a journal entry' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-017: dismissing hands the row id straight to the hook', () => {
    S = hookState({ suggestions: [stay({ id: 42, localDate: '2026-09-10' })] })
    panel({ trips: TRIPS })

    fireEvent.click(screen.getByRole('button', { name: 'Not a place I visited' }))

    expect(dismiss).toHaveBeenCalledWith(42)
  })

  it('FE-DAWARICH-PANEL-018: the row being written is the row that goes dead, and only that one', () => {
    S = hookState({
      suggestions: [
        stay({ id: 42, localDate: '2026-09-10', name: 'Museum Ludwig' }),
        stay({ id: 43, localDate: '2026-09-11', name: 'Koelner Dom' }),
      ],
      busyId: 42,
    })
    const { container } = panel({ trips: TRIPS })

    expect(within(rowOf(container, 'Museum Ludwig')).getByRole('button', { name: 'Add as a place' })).toBeDisabled()
    expect(within(rowOf(container, 'Koelner Dom')).getByRole('button', { name: 'Add as a place' })).toBeEnabled()
  })

  it('FE-DAWARICH-PANEL-019: accepting opens the review step and reports a write that landed', async () => {
    const onAccepted = vi.fn()
    const daysForTrip = vi.fn((tripId: number) => [{ id: 70 + tripId, label: 'Day 1', badge: 'Thu, Sep 10' }])
    S = hookState({ suggestions: [stay({ id: 42, localDate: '2026-09-10', name: 'Museum Ludwig' })] })
    panel({ trips: TRIPS, journals: JOURNALS, daysForTrip, onAccepted })

    fireEvent.click(screen.getByRole('button', { name: 'Add as a place' }))

    // The dialog opens on the row that was pressed, for the target that was pressed.
    expect(screen.getByRole('heading', { name: 'Add this stay as a place' })).toBeInTheDocument()
    expect(daysForTrip).toHaveBeenCalledWith(5)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    })

    expect(accept).toHaveBeenCalledWith(42, expect.objectContaining({ target: 'place', tripId: 5 }))
    // Only now: the host refreshes its own list off the back of a write that landed.
    expect(onAccepted).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }))
    expect(screen.queryByRole('heading', { name: 'Add this stay as a place' })).toBeNull()
  })

  it('FE-DAWARICH-PANEL-020: a refused write leaves the dialog standing, with the correction still in it', async () => {
    const onAccepted = vi.fn()
    accept.mockResolvedValue(false)
    S = hookState({ suggestions: [stay({ id: 42, localDate: '2026-09-10' })] })
    panel({ trips: TRIPS, journals: JOURNALS, onAccepted })

    fireEvent.click(screen.getByRole('button', { name: 'Write a journal entry' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Corrected name' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    })

    expect(accept).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ target: 'journal', journalId: 9, name: 'Corrected name' }),
    )
    // Closing here would throw away what the user typed and leave them nothing
    // to retry with.
    expect(screen.getByRole('heading', { name: 'Write a journal entry' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Corrected name')
    expect(onAccepted).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-PANEL-021: a host that wants no callback still gets its dialog closed', async () => {
    S = hookState({ suggestions: [stay({ id: 42, localDate: '2026-09-10' })] })
    panel({ trips: TRIPS, journals: JOURNALS })

    fireEvent.click(screen.getByRole('button', { name: 'Write a journal entry' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    })

    expect(accept).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: 'Write a journal entry' })).toBeNull()
  })

  it('FE-DAWARICH-PANEL-022: cancelling writes nothing', () => {
    S = hookState({ suggestions: [stay({ id: 42, localDate: '2026-09-10' })] })
    panel({ trips: TRIPS, journals: JOURNALS })

    fireEvent.click(screen.getByRole('button', { name: 'Add as a place' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'Add this stay as a place' })).toBeNull()
    expect(accept).not.toHaveBeenCalled()
  })
})

describe('DawarichSuggestionsPanel: what was already dealt with', () => {
  const handledRows = [
    stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig', state: 'accepted', target: 'place' }),
    stay({ id: 2, localDate: '2026-09-09', name: 'Koelner Dom', state: 'dismissed' }),
    // Accepted before `target` was recorded: the wording falls back rather than
    // printing a missing translation key at somebody.
    stay({ id: 3, localDate: '2026-09-08', name: 'Rheinpark', state: 'accepted', target: null }),
  ]

  it('FE-DAWARICH-PANEL-023: the history stays folded away until it is asked for', () => {
    S = hookState({ suggestions: handledRows })
    panel({ trips: TRIPS })

    expect(screen.queryByText('Museum Ludwig')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show 3 already dealt with' }))

    expect(screen.getByText('Museum Ludwig')).toBeInTheDocument()
    expect(screen.getByText('Added as a place')).toBeInTheDocument()
    expect(screen.getByText('Dismissed')).toBeInTheDocument()
    expect(screen.getByText('In the journal')).toBeInTheDocument()
    // A history row carries its own date, which the open list keeps in the day
    // heading it no longer sits under.
    expect(screen.getByText('Thu, Sep 10')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide the ones already dealt with' }))
    expect(screen.queryByText('Museum Ludwig')).toBeNull()
  })

  it('FE-DAWARICH-PANEL-024: only a dismissal can be put back, and it goes through the hook', () => {
    S = hookState({ suggestions: handledRows })
    const { container } = panel({ trips: TRIPS })
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 already dealt with' }))

    // An accepted stay already produced a place or an entry; "put back" there
    // would mean silently unpicking something the user wrote.
    expect(within(rowOf(container, 'Museum Ludwig')).queryByRole('button', { name: 'Put back' })).toBeNull()
    // And no history row offers the accept buttons a second time.
    expect(within(rowOf(container, 'Koelner Dom')).queryByRole('button', { name: 'Add as a place' })).toBeNull()

    fireEvent.click(within(rowOf(container, 'Koelner Dom')).getByRole('button', { name: 'Put back' }))

    expect(restore).toHaveBeenCalledWith(2)
  })

  it('FE-DAWARICH-PANEL-025: a restore in flight disables the button that started it', () => {
    S = hookState({ suggestions: handledRows, busyId: 2 })
    const { container } = panel({ trips: TRIPS })
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 already dealt with' }))

    expect(within(rowOf(container, 'Koelner Dom')).getByRole('button', { name: 'Put back' })).toBeDisabled()
  })

  it('FE-DAWARICH-PANEL-026: nothing left open says so instead of showing an empty day', () => {
    S = hookState({ suggestions: [handledRows[0]] })
    const { container } = panel({ trips: TRIPS })

    expect(screen.getByText('Everything recorded here has been dealt with.')).toBeInTheDocument()
    // And the count badge goes with the last open row rather than showing a zero.
    expect(container.querySelector('.text-accent-text')).toBeNull()
  })
})

describe('DawarichSuggestionsPanel: the deleted-place hint', () => {
  it('FE-DAWARICH-PANEL-027: a shrinking place count reloads, a growing one does not', () => {
    useTripStore.setState({ places: places(3) })
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
    panel({ tripId: 5, trips: TRIPS })

    // Mounting is not a shrink.
    expect(reload).not.toHaveBeenCalled()

    // Deleting the place an acceptance created is how somebody says "not that
    // one" after the fact, and the server puts the stay back into review.
    act(() => { useTripStore.setState({ places: places(2) }) })
    expect(reload).toHaveBeenCalledTimes(1)

    // A place appearing is usually this panel's own doing.
    act(() => { useTripStore.setState({ places: places(6) }) })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-PANEL-028: outside a trip the place count is not this panel\'s business', () => {
    useTripStore.setState({ places: places(3) })
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
    // The journal shell mounts this without a trip, and whatever trip happens to
    // be loaded has nothing to do with the rows it shows.
    panel({ trips: TRIPS })

    act(() => { useTripStore.setState({ places: places(1) }) })

    expect(reload).not.toHaveBeenCalled()
  })
})

describe('DawarichSuggestionsPanel: the phone shell', () => {
  it('FE-DAWARICH-PANEL-029: the phone paints from its own palette, header to action pill', () => {
    phone = true
    S = hookState({
      suggestions: [
        stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig', sourceChanged: true }),
        stay({ id: 2, localDate: '2026-09-09', name: 'Koelner Dom', state: 'dismissed' }),
      ],
      lastSyncAt: new Date(Date.now() - 60_000).toISOString(),
    })
    const { container } = panel({ trips: TRIPS, journals: JOURNALS })
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 already dealt with' }))

    // A card in the desktop surface tokens glares inside the mobile shell, and
    // neither token set exists outside its own shell, so every surface here has
    // to come from the `--m-*` palette.
    expect(container.querySelector('section')?.className).toContain('var(--m-ic)')
    expect(header().className).toContain('var(--m-inner)')
    expect(container.querySelector('.bg-m-card')).not.toBeNull()
    expect(container.querySelector('.bg-m-act')).not.toBeNull()
    expect(container.querySelector('.text-m-ink')).not.toBeNull()
    expect(container.querySelectorAll('.text-m-muted').length).toBeGreaterThan(0)
    expect(container.querySelector('.text-m-faint')).not.toBeNull()
    // The actions keep their accessible names, which is what makes dropping the
    // hover-only tooltip on a touch device cost nothing.
    expect(screen.getByRole('button', { name: 'Add as a place' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-PANEL-030: bare on a phone, with nothing left open', () => {
    phone = true
    S = hookState({
      suggestions: [stay({ id: 1, localDate: '2026-09-10', state: 'accepted', target: 'journal' })],
      lastSyncAt: null,
    })
    const { container } = panel({ bare: true, trips: TRIPS })

    expect(screen.queryByRole('button', { name: /From Dawarich/ })).toBeNull()
    expect(screen.getByText('Everything recorded here has been dealt with.').className).toContain('text-m-muted')
    expect(screen.getByText('Not checked yet').className).toContain('text-m-muted')
    expect(container.querySelector('section')?.className).toBe('')
  })

  it('FE-DAWARICH-PANEL-033: folded shut on a phone, the arrow that says so comes from the phone palette', () => {
    phone = true
    S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig' })] })
    // The planner mounts this one collapsed, so on a phone the right-pointing
    // arrow is the header's ordinary state and not an edge case. It is also the
    // only part of the header an expanded phone never paints, which is exactly
    // how a desktop token would survive in there unnoticed.
    const { container } = panel({ initiallyCollapsed: true, trips: TRIPS })

    expect(header()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Museum Ludwig')).toBeNull()
    expect(container.querySelector('.lucide-chevron-right.text-m-faint')).not.toBeNull()
    expect(container.querySelector('.lucide-chevron-down')).toBeNull()
    expect(container.querySelector('.text-content-faint')).toBeNull()
  })
})

describe('DawarichSuggestionsPanel: the desktop tooltip', () => {
  it('FE-DAWARICH-PANEL-031: a row action explains itself on focus, where there is a pointer to do it with', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      S = hookState({ suggestions: [stay({ id: 1, localDate: '2026-09-10' })] })
      panel({ trips: TRIPS })

      fireEvent.focus(screen.getByRole('button', { name: 'Not a place I visited' }))
      act(() => { vi.advanceTimersByTime(300) })

      // The icon is the whole button, so without this a square is a mystery to
      // anybody who has not pressed one before. Reaching it by keyboard is the
      // one route where there is no hover to discover it with.
      expect(screen.getByRole('tooltip')).toHaveTextContent('Not a place I visited')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('DawarichSuggestionsPanel: open and handled in the same list', () => {
  it('FE-DAWARICH-PANEL-032: the two halves are counted separately and only the open half gets days', () => {
    S = hookState({
      suggestions: [
        stay({ id: 1, localDate: '2026-09-10', name: 'Museum Ludwig' }),
        stay({ id: 2, localDate: '2026-09-09', name: 'Koelner Dom', state: 'accepted', target: 'place' }),
        stay({ id: 3, localDate: '2026-09-08', name: 'Rheinpark', state: 'dismissed' }),
      ],
    })
    const { container } = panel({ trips: TRIPS })

    // Counting all three would send somebody looking for work that is done.
    expect(container.querySelector('.bg-accent')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Show 2 already dealt with' })).toBeInTheDocument()
    // And the day rail is built from the open half alone: a heading for a day
    // whose only stay was dismissed is an empty day with a coloured dot on it.
    expect(container.querySelectorAll('.uppercase')).toHaveLength(1)
    expect(screen.getByText('Thu, Sep 10')).toBeInTheDocument()
  })
})
