import { beforeEach, describe, expect, it, vi } from 'vitest'
import MNoteSheet, { type MNoteSheetPayload } from '../../../../src/mobile/screens/trip/sheets/MNoteSheet'
import { useTripStore } from '../../../../src/store/tripStore'
import type { Assignment, DayNote } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-NOTESH-001 to FE-MOB-NOTESH-018
// planner.t echoes the key, so every assertion here is against keys.

const NOTE = {
  id: 88,
  day_id: 7,
  text: 'Buy museum tickets',
  time: '09:30 at the kiosk',
  icon: 'Ticket',
  color: null,
  sort_order: 2,
} as unknown as DayNote

function renderSheet(overrides: {
  planner?: ReturnType<typeof buildPlanner>
  open?: boolean
  payload?: MNoteSheetPayload
} = {}) {
  const planner = overrides.planner ?? buildPlanner({ tripId: 3, selectedDayId: 7 })
  const onClose = vi.fn()
  const payload = 'payload' in overrides ? overrides.payload : { dayId: 7 }
  const view = render(
    <MNoteSheet planner={planner} open={overrides.open ?? true} payload={payload} onClose={onClose} />,
  )
  return { ...view, planner, onClose, payload }
}

function typeTitle(value: string) {
  fireEvent.change(screen.getByPlaceholderText('dayplan.noteTitle *'), { target: { value } })
}

// The icon grid is folded away behind the chosen icon (#1629) — a phone cannot
// spare 290px for 32 icons — so reaching one means opening the grid first.
const openIconGrid = () => fireEvent.click(screen.getByRole('button', { name: 'dayplan.noteIcon' }))
const pickIcon = (id: string) => {
  openIconGrid()
  fireEvent.click(screen.getByRole('button', { name: id }))
}

describe('MNoteSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-NOTESH-001: renders nothing while the sheet is closed', () => {
    renderSheet({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-NOTESH-002: opens in create mode with the default icon and no delete action', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'dayplan.noteAdd' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.add' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
    openIconGrid()
    expect(screen.getByRole('button', { name: 'FileText' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Train' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-MOB-NOTESH-003: picking an icon moves the pressed state', () => {
    renderSheet()
    pickIcon('Coffee')
    // Choosing closes the grid, so the assertion reopens it.
    openIconGrid()
    expect(screen.getByRole('button', { name: 'Coffee' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'FileText' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-MOB-NOTESH-004: keeps the submit disabled until a non-blank title is typed', () => {
    renderSheet()
    const submit = screen.getByRole('button', { name: 'common.add' })
    expect(submit).toBeDisabled()
    typeTitle('   ')
    expect(submit).toBeDisabled()
    typeTitle('Ferry tickets')
    expect(submit).toBeEnabled()
  })

  it('FE-MOB-NOTESH-005: appends the new note behind the last assignment and note of the day', async () => {
    seedStore(useTripStore, {
      assignments: { '7': [{ order_index: 3 }, { order_index: 1 }] as unknown as Assignment[] },
      dayNotes: { '7': [{ sort_order: 5 }] as unknown as DayNote[] },
    })
    const { planner, onClose } = renderSheet()
    pickIcon('Plane')
    typeTitle('  Check in online  ')
    fireEvent.change(screen.getByPlaceholderText('notes.bodyPlaceholder'), { target: { value: '18:00 at the gate' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.tripActions.addDayNote).toHaveBeenCalledTimes(1))
    expect(planner.tripActions.addDayNote).toHaveBeenCalledWith(3, 7, {
      text: 'Check in online',
      time: '18:00 at the gate',
      icon: 'Plane',
      color: null,
      sort_order: 6,
    })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-NOTESH-006: starts at sort order 0 on an empty day and stores an empty detail as null', async () => {
    const { planner } = renderSheet()
    typeTitle('Sunrise walk')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.tripActions.addDayNote).toHaveBeenCalledTimes(1))
    expect(planner.tripActions.addDayNote).toHaveBeenCalledWith(3, 7, {
      text: 'Sunrise walk',
      time: null,
      icon: 'FileText',
      color: null,
      sort_order: 0,
    })
  })

  it('FE-MOB-NOTESH-007: falls back to the selected day when the payload carries no dayId', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 12 })
    renderSheet({ planner, payload: {} })
    typeTitle('Laundry')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.tripActions.addDayNote).toHaveBeenCalledTimes(1))
    expect(planner.tripActions.addDayNote).toHaveBeenCalledWith(3, 12, expect.objectContaining({ text: 'Laundry' }))
  })

  it('FE-MOB-NOTESH-008: does not save without any day to attach the note to', () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: null })
    renderSheet({ planner, payload: undefined })
    typeTitle('Orphan note')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))
    expect(planner.tripActions.addDayNote).not.toHaveBeenCalled()
  })

  it('FE-MOB-NOTESH-009: prefills icon, title and detail when editing an existing note', () => {
    renderSheet({ payload: { dayId: 7, note: NOTE } })
    expect(screen.getByRole('dialog', { name: 'dayplan.noteEdit' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('dayplan.noteTitle *')).toHaveValue('Buy museum tickets')
    expect(screen.getByPlaceholderText('notes.bodyPlaceholder')).toHaveValue('09:30 at the kiosk')
    openIconGrid()
    expect(screen.getByRole('button', { name: 'Ticket' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeInTheDocument()
  })

  it('FE-MOB-NOTESH-010: updates the existing note instead of creating a second one', async () => {
    const { planner, onClose } = renderSheet({ payload: { dayId: 7, note: NOTE } })
    typeTitle('Buy museum tickets online')
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(planner.tripActions.updateDayNote).toHaveBeenCalledTimes(1))
    expect(planner.tripActions.updateDayNote).toHaveBeenCalledWith(3, 7, 88, {
      text: 'Buy museum tickets online',
      time: '09:30 at the kiosk',
      icon: 'Ticket',
      color: null,
    })
    expect(planner.tripActions.addDayNote).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-NOTESH-011: deletes the note and closes the sheet', async () => {
    const { planner, onClose } = renderSheet({ payload: { dayId: 7, note: NOTE } })
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.tripActions.deleteDayNote).toHaveBeenCalledWith(3, 7, 88))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-NOTESH-012: surfaces the save error and keeps the sheet open', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    vi.mocked(planner.tripActions.addDayNote).mockRejectedValueOnce(new Error('day is locked'))
    const { onClose } = renderSheet({ planner })
    typeTitle('Sunrise walk')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('day is locked'))
    expect(onClose).not.toHaveBeenCalled()
    // isSaving is released again, so a retry is possible.
    expect(screen.getByRole('button', { name: 'common.add' })).toBeEnabled()
  })

  it('FE-MOB-NOTESH-013: falls back to the generic message when the rejection is not an Error', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    vi.mocked(planner.tripActions.addDayNote).mockRejectedValueOnce('nope')
    renderSheet({ planner })
    typeTitle('Sunrise walk')
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('common.unknownError'))
  })

  it('FE-MOB-NOTESH-014: surfaces a failing delete without closing', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    vi.mocked(planner.tripActions.deleteDayNote).mockRejectedValueOnce(new Error('gone already'))
    const { onClose } = renderSheet({ planner, payload: { dayId: 7, note: NOTE } })
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('gone already'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-NOTESH-020: the icon grid stays folded until asked for (#1629)', () => {
    renderSheet()
    // 32 icons in a six-wide grid is most of a phone screen.
    expect(screen.queryByRole('button', { name: 'Train' })).toBeNull()

    openIconGrid()
    expect(screen.getByRole('button', { name: 'Train' })).toBeInTheDocument()

    // Choosing one closes it again.
    fireEvent.click(screen.getByRole('button', { name: 'Train' }))
    expect(screen.queryByRole('button', { name: 'Coffee' })).toBeNull()
  })

  it('FE-MOB-NOTESH-021: a colour is saved with the note (#1629)', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    render(<MNoteSheet planner={planner} open payload={{ dayId: 7 }} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('dayplan.noteTitle *'), { target: { value: 'Passport' } })
    fireEvent.click(screen.getByRole('button', { name: '#dc2626' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.tripActions.addDayNote).toHaveBeenCalledWith(3, 7, expect.objectContaining({
      color: '#dc2626',
    })))
  })

  it('FE-MOB-NOTESH-022: an existing colour is loaded and can be cleared again (#1629)', async () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    const note = { id: 88, day_id: 7, text: 'Ferry', time: '', icon: 'FileText', color: '#16a34a' } as unknown as DayNote
    render(<MNoteSheet planner={planner} open payload={{ dayId: 7, note }} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: '#16a34a' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'notes.color.none' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(planner.tripActions.updateDayNote).toHaveBeenCalledWith(3, 7, 88, expect.objectContaining({
      color: null,
    })))
  })

  it('FE-MOB-NOTESH-015: counts the detail characters and warns near the limit', () => {
    renderSheet()
    const detail = screen.getByPlaceholderText('notes.bodyPlaceholder')
    // The ceiling matches the desktop dialog since #1629 — a formatted note needs
    // the room, and the two fields write the same column.
    expect(screen.getByText('0/2000')).toBeInTheDocument()
    fireEvent.change(detail, { target: { value: 'a'.repeat(100) } })
    const relaxed = screen.getByText('100/2000')
    expect(relaxed.className).toContain('text-m-faint')

    fireEvent.change(detail, { target: { value: 'a'.repeat(1950) } })
    const warned = screen.getByText('1950/2000')
    expect(warned.className).toContain('--m-st-pending')
  })

  it('FE-MOB-NOTESH-016: cancel and the header close both report the close', () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-NOTESH-017: keeps the opened payload while the sheet animates out', () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    const onClose = vi.fn()
    const payload: MNoteSheetPayload = { dayId: 7, note: NOTE }
    const { rerender } = render(
      <MNoteSheet planner={planner} open payload={payload} onClose={onClose} />,
    )
    rerender(<MNoteSheet planner={planner} open={false} payload={undefined} onClose={onClose} />)
    // The parent drops the payload with the sheet id, but the exit animation
    // still shows the edit chrome.
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'dayplan.noteEdit' })).toBeInTheDocument()
  })

  it('FE-MOB-NOTESH-018: reopening on another note replaces the form state', () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    const onClose = vi.fn()
    const first: MNoteSheetPayload = { dayId: 7, note: NOTE }
    const second: MNoteSheetPayload = {
      dayId: 9,
      note: { id: 90, day_id: 9, text: 'Return the car', time: '', icon: 'Car' } as unknown as DayNote,
    }
    const { rerender } = render(
      <MNoteSheet planner={planner} open payload={first} onClose={onClose} />,
    )
    rerender(<MNoteSheet planner={planner} open payload={second} onClose={onClose} />)

    expect(screen.getByPlaceholderText('dayplan.noteTitle *')).toHaveValue('Return the car')
    expect(screen.getByPlaceholderText('notes.bodyPlaceholder')).toHaveValue('')
    openIconGrid()
    expect(screen.getByRole('button', { name: 'Car' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-NOTESH-019: a fresh payload object for the same note keeps the typed draft', () => {
    const planner = buildPlanner({ tripId: 3, selectedDayId: 7 })
    const onClose = vi.fn()
    const { rerender } = render(
      <MNoteSheet planner={planner} open payload={{ dayId: 7, note: NOTE }} onClose={onClose} />,
    )
    typeTitle('Buy museum tickets for four')
    // Same day, same note — only the wrapper object is new (inline payload or a
    // store refresh), so the draft must survive.
    rerender(
      <MNoteSheet planner={planner} open payload={{ dayId: 7, note: { ...NOTE } }} onClose={onClose} />,
    )

    expect(screen.getByPlaceholderText('dayplan.noteTitle *')).toHaveValue('Buy museum tickets for four')
  })
})
