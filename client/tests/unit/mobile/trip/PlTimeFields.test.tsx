import { describe, expect, it, vi } from 'vitest'
import PlTimeFields from '../../../../src/mobile/screens/trip/sheets/PlTimeFields'
import type { Assignment } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen } from '../../../helpers/render'
import { seedStore } from '../../../helpers/store'
import { buildSettings } from '../../../helpers/factories'
import { useSettingsStore } from '../../../../src/store/settingsStore'

// FE-MOB-PLTIME-001 to FE-MOB-PLTIME-013

const planner = buildPlanner()

function assignment(
  id: number,
  name: string,
  place_time: string | null,
  end_time: string | null = null,
  day_id = 1,
): Assignment {
  return { id, day_id, place_id: id, order_index: 0, place: { id, name, place_time, end_time } } as unknown as Assignment
}

const SELF = assignment(1, 'Museum', '10:00', '11:00')

interface Options {
  startTime?: string
  endTime?: string
  dayAssignments?: Assignment[]
  hasTimeError?: boolean
  assignmentId?: number
}

function setup({
  startTime = '10:00',
  endTime = '11:00',
  dayAssignments = [SELF],
  hasTimeError = false,
  assignmentId = 1,
}: Options = {}) {
  const onChange = vi.fn()
  const view = render(
    <PlTimeFields
      planner={planner}
      startTime={startTime}
      endTime={endTime}
      onChange={onChange}
      assignmentId={assignmentId}
      dayAssignments={dayAssignments}
      hasTimeError={hasTimeError}
    />,
  )
  // Both fields are CustomTimePicker text inputs now, so they answer to its
  // 24h placeholder rather than to a native time input (#2067).
  // Both fields are CustomTimePicker text inputs now, and they are the only text
  // inputs this component renders — the placeholder itself changes with the
  // user's format, so it cannot be the hook (#2067).
  const inputs = Array.from(view.container.querySelectorAll('input[type="text"]')) as HTMLInputElement[]
  return { ...view, onChange, start: inputs[0], end: inputs[1] }
}

describe('PlTimeFields', () => {
  it('FE-MOB-PLTIME-001: renders both labelled time inputs with their current values', () => {
    const { start, end } = setup()
    expect(screen.getByText('places.startTime')).toBeInTheDocument()
    expect(screen.getByText('places.endTime')).toBeInTheDocument()
    expect(start).toHaveValue('10:00')
    expect(end).toHaveValue('11:00')
  })

  it('FE-MOB-PLTIME-002: editing the start reports the place_time field', () => {
    const { start, onChange } = setup()
    fireEvent.change(start, { target: { value: '09:15' } })
    expect(onChange).toHaveBeenCalledWith('place_time', '09:15')
  })

  it('FE-MOB-PLTIME-003: editing the end reports the end_time field', () => {
    const { end, onChange } = setup()
    fireEvent.change(end, { target: { value: '12:45' } })
    expect(onChange).toHaveBeenCalledWith('end_time', '12:45')
  })

  // #2067 — the desktop twin (PlaceFormModal) has used CustomTimePicker for ages;
  // the phone kept a native time input, so the same form obeyed the setting on one
  // shell and ignored it on the other.
  // The normalisation back to 24h on blur belongs to CustomTimePicker and is
  // covered by its own suite; what this file owns is that the phone shows the
  // user's format at all, which the native input it replaced never did.
  it('FE-MOB-PLTIME-013: a 12h user sees meridiem clocks, a 24h user does not', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '12h' }) })
    const twelve = setup()
    expect(twelve.start).toHaveValue('10:00 AM')
    expect(twelve.end).toHaveValue('11:00 AM')
    twelve.unmount()

    seedStore(useSettingsStore, { settings: buildSettings({ time_format: '24h' }) })
    const twentyFour = setup()
    expect(twentyFour.start).toHaveValue('10:00')
    expect(twentyFour.end).toHaveValue('11:00')
  })

  it('FE-MOB-PLTIME-004: shows the end-before-start warning only when the sheet flags it', () => {
    setup()
    expect(screen.queryByText('places.endTimeBeforeStart')).not.toBeInTheDocument()
    setup({ hasTimeError: true })
    expect(screen.getByText('places.endTimeBeforeStart')).toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-005: stays quiet without a usable start time', () => {
    setup({ startTime: '', dayAssignments: [assignment(1, 'Museum', null), assignment(2, 'Park', '10:30')] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-006: stays quiet when the edited assignment is not in the day', () => {
    setup({ assignmentId: 99, dayAssignments: [SELF, assignment(2, 'Park', '10:30')] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-007: names the overlapping places of the same day', () => {
    setup({
      dayAssignments: [SELF, assignment(2, 'Park', '10:30', '12:00'), assignment(3, 'Cafe', '10:45')],
    })
    expect(screen.getByText(/places.timeCollision/)).toHaveTextContent('places.timeCollision Park, Cafe')
  })

  it('FE-MOB-PLTIME-008: ignores places of other days', () => {
    setup({ dayAssignments: [SELF, assignment(2, 'Park', '10:30', '12:00', 2)] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-009: ignores untimed places', () => {
    setup({ dayAssignments: [SELF, assignment(2, 'Park', null)] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-010: back-to-back slots are not a collision', () => {
    setup({ dayAssignments: [SELF, assignment(2, 'Park', '11:00', '12:00')] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })

  it('FE-MOB-PLTIME-011: an open-ended slot still collides with a place starting later', () => {
    setup({
      endTime: '',
      dayAssignments: [assignment(1, 'Museum', '10:00'), assignment(2, 'Park', '09:00', '10:30')],
    })
    expect(screen.getByText(/places.timeCollision/)).toHaveTextContent('Park')
  })

  it('FE-MOB-PLTIME-012: a half-typed end time is discarded instead of widening the slot', () => {
    // With a complete 11:00 end the 10:30 place would overlap — '11:0' must not count.
    setup({ endTime: '11:0', dayAssignments: [SELF, assignment(2, 'Park', '10:30', '12:00')] })
    expect(screen.queryByText(/places.timeCollision/)).not.toBeInTheDocument()
  })
})
