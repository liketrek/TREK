import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import RoadtripStayModal, { type StayDraft } from './RoadtripStayModal'

/**
 * FE-STAYMODAL-001..022: how long the traveller stays at one stop.
 *
 * The value is `places.duration_minutes`, which the schedule has read for years
 * and nothing could write. Two things are worth pinning: that clearing sends a
 * zero rather than a null — the update statement folds a null into "leave it
 * alone", so a null could give a stop a stay but never take one away — and that
 * the dialog answers the question the number is chosen for, which is when the
 * drive leaves again.
 */

const draft = (over: Partial<StayDraft> = {}): StayDraft => ({
  placeId: 9,
  name: 'Rasthof Dammer Berge',
  minutes: null,
  arrival: '12:00',
  ...over,
})

function open(over: Partial<StayDraft> = {}, onSave = vi.fn(), onClose = vi.fn()) {
  render(<RoadtripStayModal stop={draft(over)} onClose={onClose} onSave={onSave} />)
  return { onSave, onClose }
}

const slider = () => screen.getByRole('slider') as HTMLInputElement

beforeEach(() => {
  useSettingsStore.setState({ settings: { time_format: '24h' } as never })
})

describe('RoadtripStayModal', () => {
  it('FE-STAYMODAL-001: no stop means no dialog', () => {
    const { container } = render(<RoadtripStayModal stop={null} onClose={vi.fn()} onSave={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-STAYMODAL-002: it opens on the stop own length, not on the last one looked at', () => {
    open({ minutes: 45 })
    expect(slider().value).toBe('45')
  })

  it('FE-STAYMODAL-003: a stop with no stay opens at nothing rather than at a guess', () => {
    open({ minutes: null })
    expect(slider().value).toBe('0')
    expect(screen.getAllByText(/no stay|none/i).length).toBeGreaterThan(0)
  })

  it('FE-STAYMODAL-004: it answers the question the number is chosen for', () => {
    // The arrival is fixed by the drive; the departure is the only thing this
    // dialog moves, and seeing it move is the point of a slider over a box.
    open({ minutes: 30, arrival: '12:00' })

    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('12:30')).toBeInTheDocument()

    fireEvent.change(slider(), { target: { value: '90' } })
    expect(screen.getByText('13:30')).toBeInTheDocument()
  })

  it('FE-STAYMODAL-005: a stop the drive has not timed shows no clock at all', () => {
    // Better than inventing one: a departure without an arrival is a number with
    // nothing behind it.
    open({ minutes: 30, arrival: null })
    expect(screen.queryByText(/\d\d:\d\d/)).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-006: the clock follows the reader own format', () => {
    useSettingsStore.setState({ settings: { time_format: '12h' } as never })
    open({ minutes: 60, arrival: '13:00' })
    expect(screen.getByText(/1:00\s*PM/i)).toBeInTheDocument()
    expect(screen.getByText(/2:00\s*PM/i)).toBeInTheDocument()
  })

  it('FE-STAYMODAL-007: the two buttons nudge, and stop at the ends', () => {
    open({ minutes: 0 })

    // Nothing below zero: the minus is off rather than silently doing nothing.
    expect(screen.getByRole('button', { name: '-5' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '+5' }))
    expect(slider().value).toBe('5')
    fireEvent.click(screen.getByRole('button', { name: '-5' }))
    expect(slider().value).toBe('0')
  })

  it('FE-STAYMODAL-008: the presets are one tap, which is the point of them', () => {
    open({ minutes: 0 })
    fireEvent.click(screen.getByRole('button', { name: '1 h' }))
    expect(slider().value).toBe('60')
  })

  it('FE-STAYMODAL-009: saving reports the stop and the chosen length, then closes', async () => {
    const { onSave, onClose } = open({ minutes: 0 })

    fireEvent.change(slider(), { target: { value: '45' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(9, 45))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('FE-STAYMODAL-010: clearing sends a zero, never a null', async () => {
    // The update statement folds a null into "leave it alone", so a null could
    // give a stop a stay and never take one away.
    const { onSave } = open({ minutes: 90 })

    fireEvent.click(screen.getByRole('button', { name: /no stay|none/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(9, 0))
    expect(onSave.mock.calls[0][1]).not.toBeNull()
  })

  it('FE-STAYMODAL-011: a save already running is not started twice', async () => {
    // Two clicks on Save wrote the same value twice and closed on the first
    // answer, which on a slow connection is easy to do.
    let release: () => void = () => {}
    const onSave = vi.fn(() => new Promise<void>(r => { release = r }))
    open({ minutes: 30 }, onSave as never)

    const save = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)

    release()
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  })

  it('FE-STAYMODAL-012: cancelling changes nothing', () => {
    const { onSave, onClose } = open({ minutes: 30 })
    fireEvent.change(slider(), { target: { value: '120' } })
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-STAYMODAL-013: a stay running past midnight says which day it leaves on', () => {
    // The clock wraps modulo 24 h, so without the carry this reads "01:00" for a
    // departure the chain places on the next day — the rail says +1 beside it and
    // the dialog used to say nothing.
    open({ minutes: 180, arrival: '22:00' })

    expect(screen.getByText('01:00')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('FE-STAYMODAL-014: a stay inside one day carries no day marker', () => {
    open({ minutes: 60, arrival: '12:00' })

    expect(screen.getByText('13:00')).toBeInTheDocument()
    expect(screen.queryByText('+1')).not.toBeInTheDocument()
  })
})

describe('RoadtripStayModal for a stop left at a set time', () => {
  // The visit's End is when the drive leaves it, so there is no length to choose: the
  // stay is what the time leaves of it. What the dialog offers instead is taking the end
  // time off, after which the stay is a choice again.
  const leaving = { minutes: 30, arrival: '10:00', departure: '14:00', leaveAt: '14:00', assignmentId: 102, dayId: 11 }
  let setAssignmentTimes: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetAllStores()
    useSettingsStore.setState({ settings: { time_format: '24h' } as never })
    setAssignmentTimes = vi.fn(async () => undefined)
    seedStore(useAuthStore, { user: { id: 1, role: 'user' } })
    seedStore(useTripStore, {
      trip: { id: 4, user_id: 1 },
      assignments: { '11': [{ id: 102, day_id: 11, place_id: 9, order_index: 0, assignment_time: null, assignment_end_time: '14:00' }] },
    })
    useTripStore.setState({ setAssignmentTimes, refreshDays: vi.fn(async () => undefined) } as never)
  })

  it('FE-STAYMODAL-015: shows the stay the time makes and when the drive leaves, with nothing to slide', () => {
    open(leaving)
    expect(screen.getByText('4 h')).toBeInTheDocument()
    expect(screen.getByText('This visit has an end time, so the drive leaves at 14:00.')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('14:00')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-016: taking the end time off writes it through the visit and brings the slider back', async () => {
    const { onSave } = open(leaving)
    fireEvent.click(screen.getByRole('button', { name: 'Remove end time' }))
    await waitFor(() => expect(setAssignmentTimes).toHaveBeenCalledWith(4, 11, 102, { place_time: null, end_time: null }))
    // The stay the place carries is where the slider starts again.
    await waitFor(() => expect(slider().value).toBe('30'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('FE-STAYMODAL-017: a traveller who may not change the day can read it but not remove it', () => {
    usePermissionsStore.setState({ permissions: { day_edit: 'trip_owner' } })
    seedStore(useTripStore, { trip: { id: 4, user_id: 2 } })
    open(leaving)
    expect(screen.getByText('4 h')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove end time' })).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-018: without an arrival it can only say until when', () => {
    open({ ...leaving, arrival: null, departure: '14:00' })
    expect(screen.getByText('until 14:00')).toBeInTheDocument()
    expect(screen.queryByText('10:00')).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-019: closing changes nothing', () => {
    const { onClose, onSave } = open(leaving)
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    expect(onClose).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
    expect(setAssignmentTimes).not.toHaveBeenCalled()
  })

  it('FE-STAYMODAL-020: reached after the time, it says so and shows the departure the drive actually makes', () => {
    open({ ...leaving, arrival: '14:30', departure: '14:30', missedBy: 30 })
    expect(screen.getByText('0 min')).toBeInTheDocument()
    expect(screen.getAllByText('14:30')).toHaveLength(2)
    // One departure, not two: the promise of 14:00 is gone, the finding takes its place.
    expect(screen.getByText('Arrives 30 min after the time you set to leave')).toBeInTheDocument()
    expect(screen.queryByText('This visit has an end time, so the drive leaves at 14:00.')).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-021: travel hours over before the time say so, with no length and no departure', () => {
    // The window shut at 18:00, the End is 20:00: the drive goes on the next morning.
    open({ ...leaving, arrival: '10:30', departure: '18:00', leaveAt: '20:00' })
    expect(screen.getByText('until 20:00')).toBeInTheDocument()
    expect(screen.getByText('The travel day ends before 20:00, so the drive goes on the next morning.')).toBeInTheDocument()
    expect(screen.queryByText('18:00')).not.toBeInTheDocument()
    expect(screen.queryByText('7 h 30 min')).not.toBeInTheDocument()
  })

  it('FE-STAYMODAL-022: an End the place carries too goes with the removal, or the slider would not be the truth', async () => {
    const updatePlace = vi.fn(async () => undefined)
    seedStore(useTripStore, { places: [{ id: 9, name: 'Rasthof Dammer Berge', end_time: '14:00' }] })
    useTripStore.setState({ updatePlace } as never)
    open(leaving)
    fireEvent.click(screen.getByRole('button', { name: 'Remove end time' }))
    await waitFor(() => expect(updatePlace).toHaveBeenCalledWith(4, 9, { end_time: null }))
    expect(setAssignmentTimes).toHaveBeenCalledWith(4, 11, 102, { place_time: null, end_time: null })
    await waitFor(() => expect(slider().value).toBe('30'))
  })
})
