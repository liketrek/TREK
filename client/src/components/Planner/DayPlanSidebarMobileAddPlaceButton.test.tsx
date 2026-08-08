// FE-PLANNER-DPADDPLACE-001 to FE-PLANNER-DPADDPLACE-009
import { render, screen } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { buildAssignment, buildPlace } from '../../../tests/helpers/factories'
import { MobileAddPlaceButton } from './DayPlanSidebarMobileAddPlaceButton'
import type { AssignmentsMap, Place } from '../../types'

const louvre = buildPlace({ id: 11, name: 'Louvre' })
const eiffel = buildPlace({ id: 12, name: 'Eiffel Tower' })

function makeProps(overrides: Partial<React.ComponentProps<typeof MobileAddPlaceButton>> = {}) {
  return {
    dayId: 5,
    places: [louvre, eiffel] as Place[],
    assignments: {} as AssignmentsMap,
    onAssign: vi.fn(),
    onAddNew: vi.fn(),
    ...overrides,
  }
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add Place' }))
}

describe('MobileAddPlaceButton', () => {
  it('FE-PLANNER-DPADDPLACE-001: renders only the collapsed trigger initially', () => {
    render(<MobileAddPlaceButton {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Add Place' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search places...')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-002: opening lists every place not yet on the day', async () => {
    const user = userEvent.setup()
    render(<MobileAddPlaceButton {...makeProps()} />)
    await openPicker(user)
    expect(screen.getByPlaceholderText('Search places...')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-003: places already assigned to this day are filtered out', async () => {
    const user = userEvent.setup()
    const assignments = { '5': [buildAssignment({ id: 1, day_id: 5, place_id: 11, place: louvre })] } as AssignmentsMap
    render(<MobileAddPlaceButton {...makeProps({ assignments })} />)
    await openPicker(user)
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-004: the search box narrows the list case-insensitively', async () => {
    const user = userEvent.setup()
    render(<MobileAddPlaceButton {...makeProps()} />)
    await openPicker(user)
    await user.type(screen.getByPlaceholderText('Search places...'), 'eIFf')
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-005: a search with no hits shows the no-match hint', async () => {
    const user = userEvent.setup()
    render(<MobileAddPlaceButton {...makeProps()} />)
    await openPicker(user)
    await user.type(screen.getByPlaceholderText('Search places...'), 'zzz')
    expect(screen.getByText('No match')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-006: with everything already assigned it shows the all-assigned hint', async () => {
    const user = userEvent.setup()
    const assignments = {
      '5': [
        buildAssignment({ id: 1, day_id: 5, place_id: 11, place: louvre }),
        buildAssignment({ id: 2, day_id: 5, place_id: 12, place: eiffel }),
      ],
    } as AssignmentsMap
    render(<MobileAddPlaceButton {...makeProps({ assignments })} />)
    await openPicker(user)
    expect(screen.getByText('All places assigned')).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-007: picking a place assigns it to this day and closes the picker', async () => {
    const user = userEvent.setup()
    const onAssign = vi.fn()
    render(<MobileAddPlaceButton {...makeProps({ onAssign })} />)
    await openPicker(user)
    await user.click(screen.getByText('Eiffel Tower'))
    expect(onAssign).toHaveBeenCalledWith(12, 5)
    expect(screen.getByRole('button', { name: 'Add Place' })).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-008: "Create new place" calls onAddNew and closes the picker', async () => {
    const user = userEvent.setup()
    const onAddNew = vi.fn()
    render(<MobileAddPlaceButton {...makeProps({ onAddNew })} />)
    await openPicker(user)
    await user.click(screen.getByRole('button', { name: 'Create new place' }))
    expect(onAddNew).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Add Place' })).toBeInTheDocument()
  })

  it('FE-PLANNER-DPADDPLACE-009: without onAddNew there is no create row, and the X closes the picker', async () => {
    const user = userEvent.setup()
    render(<MobileAddPlaceButton {...makeProps({ onAddNew: undefined })} />)
    await openPicker(user)
    expect(screen.queryByRole('button', { name: 'Create new place' })).not.toBeInTheDocument()
    // The unlabelled button next to the search field is the close X.
    const closeBtn = screen.getByPlaceholderText('Search places...').parentElement!.querySelector('button')!
    await user.click(closeBtn)
    expect(screen.getByRole('button', { name: 'Add Place' })).toBeInTheDocument()
  })
})
