// FE-DAWARICH-ACCEPT-001 to FE-DAWARICH-ACCEPT-026
/**
 * The review step between a detector's guess and a row in somebody's trip.
 *
 * This dialog is the only thing standing between Dawarich's visit detector and
 * real data, and almost all of its behaviour is invisible until it is wrong:
 * which fields are prefilled, which of them are sent back, and which are left
 * out because the user did not actually change them. The server takes the body
 * at face value (an accidental `name` or `date` in it silently overrides the
 * recording), so "only what was corrected travels" is the contract worth
 * pinning, and it is the one a refactor breaks first.
 *
 * The rest is the shape of the three targets. `place` needs a trip and offers a
 * day (and no date: the day IS where it lands, and the server reads no date for
 * a place), `journal` needs a journey, a date and a story, `bucket_list` needs a
 * matched wish and hides the clock entirely because ticking a wish off uses the
 * recorded timestamp and nothing else. Each of the three can be in a state
 * where there is nothing to write to (no trips, no journeys, no matched wish),
 * and in each of those the confirm button has to be inert rather than sending a
 * body the server will reject with a 400.
 *
 * The seeding is keyed on the stay, not on the target, and one live instance
 * serves all three rails. That makes two things true at once that are easy to
 * get wrong together: what the user typed survives a switch from the place rail
 * to the journal rail, and the trip and day they chose under the place rail
 * must not travel in the journal body they then confirm.
 *
 * Both shells are covered: the phone gets an MSheet with its own footer, the
 * desktop a Modal, and the fields in between are the same element tree. A
 * regression that dropped one shell would otherwise only show up on a device.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import type { DawarichSuggestion } from '@trek/shared'
import { render, screen } from '../../../tests/helpers/render'
import DawarichAcceptDialog, { type AcceptTargetOption } from './DawarichAcceptDialog'

// The one thing the dialog reads about the device. A hoisted flag rather than a
// resize: useIsPhone is matchMedia-driven and the global stub always answers false.
const phone = vi.hoisted(() => ({ value: false }))
vi.mock('../../mobile/useIsPhone', () => ({ useIsPhone: () => phone.value }))

/**
 * A stay as the suggestions endpoint hands it over. The offsets are real ones:
 * `clockOf` slices the local wall clock straight out of the string rather than
 * converting it, so a fixture in UTC would quietly test a different code path
 * than the one production sees.
 */
function stay(over: Partial<DawarichSuggestion> = {}): DawarichSuggestion {
  return {
    id: 1,
    sourceVisitId: '1',
    tripId: null,
    tripTitle: null,
    name: 'Cafe Reichard',
    lat: 50.94,
    lng: 6.96,
    startedAt: '2026-09-10T10:15:00+02:00',
    endedAt: '2026-09-10T12:40:00+02:00',
    durationMinutes: 145,
    localDate: '2026-09-10',
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
    firstSeenAt: '2026-09-10T06:00:00Z',
    lastSeenAt: '2026-09-10T06:00:00Z',
    ...over,
  }
}

const TRIPS: AcceptTargetOption[] = [
  { id: 31, label: 'Rhineland' },
  { id: 32, label: 'Alps' },
]

// Distinct labels per trip so "the day list followed the trip" is observable
// without reading ids out of the DOM.
const DAYS: Record<number, AcceptTargetOption[]> = {
  31: [
    { id: 401, label: 'Day 1', badge: '10 Sept' },
    { id: 402, label: 'Day 2', badge: '11 Sept' },
  ],
  32: [{ id: 501, label: 'Alpine day', badge: '01 Oct' }],
}
const daysForTrip = (tripId: number): AcceptTargetOption[] => DAYS[tripId] ?? []

const JOURNALS: AcceptTargetOption[] = [
  { id: 71, label: 'Rhine notebook' },
  { id: 72, label: 'Alpine notebook' },
]

type Props = React.ComponentProps<typeof DawarichAcceptDialog>

function open(props: Partial<Props> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const all: Props = { suggestion: stay(), target: 'place', ...props, onConfirm, onCancel }
  const view = render(<DawarichAcceptDialog {...all} />)
  return {
    ...view,
    onConfirm,
    onCancel,
    /** Re-render with the same props bar the ones named: the parent's own update path. */
    update: (next: Partial<Props>) => view.rerender(<DawarichAcceptDialog {...all} {...next} />),
  }
}

/** Open a CustomSelect by its trigger, then pick the option with this label. */
function pick(triggerName: string | RegExp, optionLabel: string): void {
  fireEvent.click(screen.getByRole('button', { name: triggerName }))
  fireEvent.click(screen.getByText(optionLabel))
}

/** Type into the date field's keyboard entry, which takes ISO as-is. */
function typeDate(iso: string): void {
  fireEvent.click(screen.getByRole('button', { name: 'Enter date manually' }))
  const input = screen.getByLabelText('Enter date manually')
  fireEvent.change(input, { target: { value: iso } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

beforeEach(() => {
  phone.value = false
})

describe('DawarichAcceptDialog', () => {
  it('FE-DAWARICH-ACCEPT-001: nothing is on screen while no stay is pending', () => {
    open({ suggestion: null, trips: TRIPS })
    // The panel portals to document.body, so "empty container" proves nothing:
    // the absence of the title and the confirm button does.
    expect(screen.queryByText('Add this stay as a place')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add place' })).toBeNull()
  })

  it('FE-DAWARICH-ACCEPT-002: every field opens prefilled from the recording', () => {
    open({ trips: TRIPS, daysForTrip })

    expect(screen.getByRole('heading', { name: 'Add this stay as a place' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Cafe Reichard')
    // The wall clock out of the offset the recording carries, not UTC.
    expect(screen.getByLabelText('Arrived')).toHaveValue('10:15')
    expect(screen.getByLabelText('Left')).toHaveValue('12:40')
    expect(screen.getByLabelText('Notes')).toHaveValue('')
    expect(screen.getByText(/^Recorded /)).toBeInTheDocument()
    expect(screen.getByText('145 min')).toBeInTheDocument()
    // No trip of its own, so the first trip the user may write to.
    expect(screen.getByRole('button', { name: 'Rhineland' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not on a day yet' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ACCEPT-003: an untouched stay sends only the target, its trip and the recorded clock', () => {
    const { onConfirm } = open({ suggestion: stay({ tripId: 32 }), trips: TRIPS, daysForTrip })

    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))

    // No name, no notes, no date: the server falls back to the recording for
    // each of those, and repeating them would turn every accept into an edit.
    expect(onConfirm).toHaveBeenCalledWith({ target: 'place', tripId: 32, time: '10:15', endTime: '12:40' })
  })

  it('FE-DAWARICH-ACCEPT-004: every correction travels, the day included', () => {
    const { onConfirm } = open({ trips: TRIPS, daysForTrip })

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Café Reichard am Dom' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Two hours and a lot of cake.' } })
    fireEvent.change(screen.getByLabelText('Arrived'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Left'), { target: { value: '11:45' } })
    pick('Not on a day yet', 'Day 1')

    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))

    // The day is the only calendar fact a place carries: there is no date in
    // this body because there is no date field on this rail.
    expect(onConfirm).toHaveBeenCalledWith({
      target: 'place',
      tripId: 31,
      dayId: 401,
      name: 'Café Reichard am Dom',
      notes: 'Two hours and a lot of cake.',
      time: '09:00',
      endTime: '11:45',
    })
  })

  it('FE-DAWARICH-ACCEPT-005: a name or note that says nothing new is left out of the body', () => {
    const { onConfirm } = open({ trips: TRIPS, daysForTrip })
    const untouched = { target: 'place', tripId: 31, time: '10:15', endTime: '12:40' }

    // Emptied entirely: the recording's own name is what should survive.
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenLastCalledWith(untouched)

    // Retyped with padding around it: after trimming this is the same name, and
    // sending it would write a "correction" nobody made.
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Cafe Reichard  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenLastCalledWith(untouched)
  })

  it('FE-DAWARICH-ACCEPT-006: unplanned is an answer, not a missing one', () => {
    const { onConfirm } = open({ trips: TRIPS, daysForTrip })

    pick('Not on a day yet', 'Day 1')
    // The date rides along as the trigger's badge rather than inside its label.
    expect(screen.getByRole('button', { name: /Day 1/ })).toHaveTextContent('10 Sept')

    // Back to "not on a day yet": the sentinel option has to clear the choice
    // rather than be stored as a day id of its own.
    pick(/Day 1/, 'Not on a day yet')

    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenCalledWith({ target: 'place', tripId: 31, time: '10:15', endTime: '12:40' })
  })

  it('FE-DAWARICH-ACCEPT-007: changing the trip drops the day that belonged to the old one', () => {
    const { onConfirm } = open({ trips: TRIPS, daysForTrip })

    pick('Not on a day yet', 'Day 2')
    pick('Rhineland', 'Alps')

    // Day 2 is a day of the Rhineland trip; keeping it would attach the place to
    // somebody else's day, which the server refuses with a 400.
    expect(screen.getByRole('button', { name: 'Not on a day yet' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Not on a day yet' }))
    expect(screen.getByText('Alpine day')).toBeInTheDocument()
    expect(screen.queryByText('Day 2')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenCalledWith({ target: 'place', tripId: 32, time: '10:15', endTime: '12:40' })
  })

  it('FE-DAWARICH-ACCEPT-008: the trip falls back from the stay to the first writable one to nothing', () => {
    // The stay's own trip wins: it is the one whose dates the recording fell into.
    const own = open({ suggestion: stay({ tripId: 32 }), trips: TRIPS, daysForTrip })
    expect(screen.getByRole('button', { name: 'Alps' })).toBeInTheDocument()
    own.unmount()

    const first = open({ trips: TRIPS, daysForTrip })
    expect(screen.getByRole('button', { name: 'Rhineland' })).toBeInTheDocument()
    first.unmount()

    // No trip at all: the picker admits it and the confirm is inert, because a
    // place with no trip is a 400 rather than a partial success.
    open({ trips: [], daysForTrip })
    expect(screen.getByRole('button', { name: 'Choose a trip' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add place' })).toBeDisabled()
  })

  it('FE-DAWARICH-ACCEPT-009: with no day resolver the day picker offers only "not on a day yet"', () => {
    // The trip rail passes a resolver; an Atlas-side or MCP-shaped caller need
    // not, and the picker has to survive that rather than throw.
    open({ trips: TRIPS })

    fireEvent.click(screen.getByRole('button', { name: 'Not on a day yet' }))
    expect(screen.getAllByText('Not on a day yet')).toHaveLength(2)
    expect(screen.queryByText('Day 1')).toBeNull()
  })

  it('FE-DAWARICH-ACCEPT-010: the journal target asks for a story and sends the chosen journey', () => {
    const { onConfirm } = open({ target: 'journal', journals: JOURNALS })

    expect(screen.getByRole('heading', { name: 'Write a journal entry' })).toBeInTheDocument()
    // A story gets room to be one; notes on a place do not need five rows.
    expect(screen.getByLabelText('Your story')).toHaveAttribute('rows', '5')
    expect(screen.getByText('Add photos to the entry after it is created.')).toBeInTheDocument()
    // No trip or day rail here: the entry belongs to a journey, not to a day.
    expect(screen.queryByText('Day')).toBeNull()
    expect(screen.queryByText('Trip')).toBeNull()

    fireEvent.change(screen.getByLabelText('Your story'), { target: { value: 'Cake, then the cathedral.' } })
    pick('Rhine notebook', 'Alpine notebook')
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))

    expect(onConfirm).toHaveBeenCalledWith({
      target: 'journal',
      journalId: 72,
      notes: 'Cake, then the cathedral.',
      time: '10:15',
      endTime: '12:40',
    })
  })

  it('FE-DAWARICH-ACCEPT-011: with no journey to write to, the journal confirm is inert', () => {
    open({ target: 'journal' })

    expect(screen.getByRole('button', { name: 'Choose a journal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()
  })

  it('FE-DAWARICH-ACCEPT-012: ticking a wish off states the rule and sends the matched wish', () => {
    const { onConfirm } = open({
      target: 'bucket_list',
      suggestion: stay({ matchedBucketListItemId: 88, matchedBucketListName: 'Museum Ludwig' }),
    })

    expect(screen.getByRole('heading', { name: 'Tick off a wish' })).toBeInTheDocument()
    // Why a stay at a café is being offered against a museum: the rule, spelled out.
    expect(screen.getByText(/On your wishlist: Museum Ludwig/)).toHaveTextContent('within 250 m and after 20 minutes')
    // Nothing here is editable but the wish it ticks off: the visit's own
    // timestamp is what gets stored, so a clock or a note would be theatre.
    expect(screen.queryByLabelText('Arrived')).toBeNull()
    expect(screen.queryByLabelText('Left')).toBeNull()
    expect(screen.queryByLabelText('Notes')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Tick it off' }))
    expect(onConfirm).toHaveBeenCalledWith({
      target: 'bucket_list',
      bucketListItemId: 88,
      time: '10:15',
      endTime: '12:40',
    })
  })

  it('FE-DAWARICH-ACCEPT-013: a stay that matched no wish cannot be ticked off', () => {
    open({ target: 'bucket_list', suggestion: stay() })

    expect(screen.getByRole('button', { name: 'Tick it off' })).toBeDisabled()
    expect(screen.queryByText(/On your wishlist/)).toBeNull()
  })

  it('FE-DAWARICH-ACCEPT-014: a write already in flight blocks a second one', () => {
    // Everything is answered, so only `busy` can be holding the button, which is
    // the point: double-accepting a stay creates two places out of one recording.
    open({ trips: TRIPS, daysForTrip, busy: true })

    expect(screen.getByRole('button', { name: 'Add place' })).toBeDisabled()
  })

  it('FE-DAWARICH-ACCEPT-015: backing out writes nothing, by button or by Escape', () => {
    const { onCancel, onConfirm } = open({ trips: TRIPS, daysForTrip })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("FE-DAWARICH-ACCEPT-016: the source's own verdict is shown only while it is unconfirmed", () => {
    const unconfirmed = open({ trips: TRIPS, suggestion: stay({ sourceStatus: 'suggested' }) })
    expect(screen.getByText('Detected, unconfirmed')).toBeInTheDocument()
    unconfirmed.unmount()

    // Confirmed in Dawarich: saying so would be noise, the badge is simply gone.
    open({ trips: TRIPS, suggestion: stay({ sourceStatus: 'confirmed' }) })
    expect(screen.queryByText('Detected, unconfirmed')).toBeNull()
  })

  it('FE-DAWARICH-ACCEPT-017: only the bands Dawarich actually emits are shown, and only "low" warns', () => {
    const low = open({ trips: TRIPS, suggestion: stay({ confidenceBand: 'low', confidence: 20 }) })
    expect(screen.getByText('Uncertain detection').parentElement?.className).toContain('text-warning')
    low.unmount()

    const high = open({ trips: TRIPS, suggestion: stay({ confidenceBand: 'high', confidence: 90 }) })
    // A confident detection is a fact, not a warning. Same badge, neutral tone.
    expect(screen.getByText('Confident detection').parentElement?.className).toContain('text-content-secondary')
    high.unmount()

    const none = open({ trips: TRIPS, suggestion: stay({ confidenceBand: null }) })
    expect(screen.queryByText(/detection$/)).toBeNull()
    none.unmount()

    // A band a later Dawarich invents: nothing at all, rather than a raw key.
    open({ trips: TRIPS, suggestion: stay({ confidenceBand: 'certain', confidence: 100 }) })
    expect(screen.queryByText(/dawarich\.confidence/)).toBeNull()
    expect(screen.queryByText(/detection$/)).toBeNull()
  })

  it('FE-DAWARICH-ACCEPT-018: a recording with no readable clock or date sends neither', () => {
    // Dawarich has shipped date-only and non-ISO timestamps; the clock parser
    // answers with an empty string rather than a guess, and an empty string must
    // not reach the body as `time: ""` or `date: ""`. On the journal rail,
    // because that is the one rail that shows the date beside the clock.
    const { onConfirm } = open({
      target: 'journal',
      journals: JOURNALS,
      suggestion: stay({ startedAt: '2026-09-10', endedAt: '2026-09-10', localDate: '' }),
    })

    expect(screen.getByLabelText('Arrived')).toHaveValue('')
    expect(screen.getByLabelText('Left')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Date' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    expect(onConfirm).toHaveBeenCalledWith({ target: 'journal', journalId: 71 })
  })

  it('FE-DAWARICH-ACCEPT-019: the fields follow the stay, and survive a re-render of the same one', () => {
    const { update } = open({ trips: TRIPS, daysForTrip })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Edited by hand' } })

    // A fresh object for the same row: a parent re-render, not a new decision.
    // Re-seeding here would eat what the user typed mid-sentence.
    update({ suggestion: stay() })
    expect(screen.getByLabelText('Name')).toHaveValue('Edited by hand')

    update({
      suggestion: stay({
        id: 2,
        name: 'Kölner Dom',
        tripId: 32,
        localDate: '2026-09-11',
        startedAt: '2026-09-11T08:00:00+02:00',
        endedAt: '2026-09-11T09:30:00+02:00',
      }),
    })
    expect(screen.getByLabelText('Name')).toHaveValue('Kölner Dom')
    expect(screen.getByLabelText('Arrived')).toHaveValue('08:00')
    expect(screen.getByRole('button', { name: 'Alps' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ACCEPT-020: on a phone it is a sheet, and its footer confirms', () => {
    phone.value = true
    const { onConfirm } = open({ trips: TRIPS, daysForTrip })

    expect(screen.getByRole('dialog', { name: 'Add this stay as a place' })).toBeInTheDocument()
    // The desktop modal's own heading is the tell that the wrong shell rendered.
    expect(screen.queryByRole('heading', { name: 'Add this stay as a place' })).toBeNull()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Reichard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))

    expect(onConfirm).toHaveBeenCalledWith({
      target: 'place',
      tripId: 31,
      name: 'Reichard',
      time: '10:15',
      endTime: '12:40',
    })
  })

  it('FE-DAWARICH-ACCEPT-021: the phone sheet backs out from its header and its footer, and blocks an impossible write', () => {
    phone.value = true
    const { onCancel, onConfirm } = open({ target: 'journal' })

    expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()

    // Two ways out of the sheet, both the same door: the header's close circle
    // and the footer's cancel pill.
    const exits = screen.getAllByRole('button', { name: 'Cancel' })
    expect(exits).toHaveLength(2)
    exits.forEach(button => fireEvent.click(button))

    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-ACCEPT-022: the name stays editable on the wishlist rail, and a correction travels', () => {
    // The clock, the date and the notes are all hidden for a wish, which is
    // exactly why the one field that survives is worth naming: the detector's
    // guess at a place name is what a tick-off is filed under, and "hide
    // everything that is not the wish" is the tidy-up that would take it away.
    const { onConfirm } = open({
      target: 'bucket_list',
      suggestion: stay({ matchedBucketListItemId: 88, matchedBucketListName: 'Museum Ludwig' }),
    })

    expect(screen.getByLabelText('Name')).toHaveValue('Cafe Reichard')
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Museum Ludwig' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tick it off' }))

    expect(onConfirm).toHaveBeenCalledWith({
      target: 'bucket_list',
      bucketListItemId: 88,
      name: 'Museum Ludwig',
      time: '10:15',
      endTime: '12:40',
    })
  })

  it('FE-DAWARICH-ACCEPT-023: a new stay arrives with no day chosen, whatever the last one had', () => {
    const { onConfirm, update } = open({ trips: TRIPS, daysForTrip })

    pick('Not on a day yet', 'Day 2')

    // Same trip, so the day list does not change and a stale `dayId` would stay
    // a legal value, which is the dangerous version of this bug: the second
    // stay is filed silently on the day somebody picked for the first.
    update({ suggestion: stay({ id: 3, name: 'Kölner Dom', tripId: 31 }) })
    expect(screen.getByRole('button', { name: 'Not on a day yet' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenCalledWith({ target: 'place', tripId: 31, time: '10:15', endTime: '12:40' })
  })

  it('FE-DAWARICH-ACCEPT-024: switching rails keeps what was typed and leaks no trip into the journal body', () => {
    const { onConfirm, update } = open({ trips: TRIPS, daysForTrip })

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Cake, then the cathedral.' } })
    pick('Not on a day yet', 'Day 1')

    // Backing out of "add as a place" and choosing "write a journal entry" on
    // the same row is one instance and one stay, so nothing is re-seeded.
    update({ target: 'journal', journals: JOURNALS })
    expect(screen.getByLabelText('Your story')).toHaveValue('Cake, then the cathedral.')

    // The journal was never chosen, because the seeding runs off the stay and
    // the stay has not changed. Offering a confirm here would send a body with
    // no journalId in it.
    expect(screen.getByRole('button', { name: 'Choose a journal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()

    pick('Choose a journal', 'Rhine notebook')
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))

    // Trip 31 and day 401 are still held in state. A journal entry belongs to a
    // journey, and the server reads the body at face value.
    expect(onConfirm).toHaveBeenCalledWith({
      target: 'journal',
      journalId: 71,
      notes: 'Cake, then the cathedral.',
      time: '10:15',
      endTime: '12:40',
    })
  })

  it('FE-DAWARICH-ACCEPT-025: the place rail offers no date, because the day picker is where a place lands', () => {
    open({ trips: TRIPS, daysForTrip })

    // A place has no date of its own: the server reads a date for a journal
    // entry and for nothing else, so a date field on this rail was one whose
    // change moved the place nowhere while the toast still said it landed.
    // The clock stays, the server does read that.
    expect(screen.queryByText('Date')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Enter date manually' })).toBeNull()
    expect(screen.getByLabelText('Arrived')).toHaveValue('10:15')
    expect(screen.getByLabelText('Left')).toHaveValue('12:40')
    expect(screen.getByRole('button', { name: 'Not on a day yet' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ACCEPT-026: a corrected date travels with a journal entry, and never with a place', () => {
    // Both rails on one stay, so the dialog holds the corrected date in state
    // across the switch: the same shape as switching rails with a note typed.
    const { onConfirm, update } = open({ target: 'journal', journals: JOURNALS, trips: TRIPS, daysForTrip })

    expect(screen.getByText('Date')).toBeInTheDocument()
    typeDate('2026-09-12')
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    expect(onConfirm).toHaveBeenLastCalledWith({
      target: 'journal',
      journalId: 71,
      date: '2026-09-12',
      time: '10:15',
      endTime: '12:40',
    })

    // Same stay, now as a place. The corrected date is still in state and would
    // be silently dropped by the server; it must not be in the body at all,
    // so what the dialog claims to send is what is actually written.
    update({ target: 'place' })
    expect(screen.queryByText('Date')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add place' }))
    expect(onConfirm).toHaveBeenLastCalledWith({ target: 'place', tripId: 31, time: '10:15', endTime: '12:40' })
  })
})
