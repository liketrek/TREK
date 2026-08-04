import { describe, expect, it, vi } from 'vitest'
import PlCategoryPicker from '../../../../src/mobile/screens/trip/sheets/PlCategoryPicker'
import type { Category } from '../../../../src/types'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner, buildTripActions } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PLCAT-001 to FE-MOB-PLCAT-011
// planner.t echoes the key, so every visible label is asserted as its key.

const CATEGORIES = [
  { id: 3, name: 'Food', color: '#ef4444', icon: 'Coffee', user_id: 1 },
  { id: 4, name: 'Museums', color: '#22c55e', icon: 'Landmark', user_id: 1 },
] as unknown as Category[]

function setup(plannerOverrides: Partial<TripPlanner> = {}, value = '') {
  const onChange = vi.fn()
  const planner = buildPlanner({ categories: CATEGORIES, ...plannerOverrides })
  const view = render(<PlCategoryPicker planner={planner} value={value} onChange={onChange} />)
  return { ...view, planner, onChange }
}

describe('PlCategoryPicker', () => {
  it('FE-MOB-PLCAT-001: renders the no-category pill plus one pill per trip category', () => {
    setup()
    expect(screen.getByRole('button', { name: /places\.noCategory/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Food/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Museums/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mobileTrip\.newCategory/ })).toBeInTheDocument()
  })

  it('FE-MOB-PLCAT-002: marks the no-category pill active for the empty value', () => {
    setup()
    expect(screen.getByRole('button', { name: /places\.noCategory/ }).className).toContain('bg-m-act')
    expect(screen.getByRole('button', { name: /Food/ }).className).not.toContain('bg-m-act')
  })

  it('FE-MOB-PLCAT-003: marks the pill of the selected id active', () => {
    setup({}, '4')
    expect(screen.getByRole('button', { name: /Museums/ }).className).toContain('bg-m-act')
    expect(screen.getByRole('button', { name: /places\.noCategory/ }).className).not.toContain('bg-m-act')
  })

  it('FE-MOB-PLCAT-004: reports the picked category id as a string', () => {
    const { onChange } = setup({}, '')
    fireEvent.click(screen.getByRole('button', { name: /Food/ }))
    expect(onChange).toHaveBeenCalledWith('3')
  })

  it('FE-MOB-PLCAT-005: reports the empty value when the category is cleared', () => {
    const { onChange } = setup({}, '3')
    fireEvent.click(screen.getByRole('button', { name: /places\.noCategory/ }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('FE-MOB-PLCAT-006: creates a category inline and selects it right away', async () => {
    const tripActions = buildTripActions()
    tripActions.addCategory.mockResolvedValue({ id: 9, name: 'Bars' } as unknown as Category)
    const { onChange } = setup({ tripActions } as unknown as Partial<TripPlanner>)

    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    const input = screen.getByPlaceholderText('places.categoryNamePlaceholder')
    fireEvent.change(input, { target: { value: '  Bars  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('9'))
    expect(tripActions.addCategory).toHaveBeenCalledWith({ name: 'Bars', color: '#6366f1', icon: 'MapPin' })
    // The inline row collapses back to the dashed pill.
    await waitFor(() => expect(screen.queryByPlaceholderText('places.categoryNamePlaceholder')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: /mobileTrip\.newCategory/ })).toBeInTheDocument()
  })

  it('FE-MOB-PLCAT-007: Enter in the name field creates the category', async () => {
    const tripActions = buildTripActions()
    tripActions.addCategory.mockResolvedValue({ id: 12, name: 'Beaches' } as unknown as Category)
    const { onChange } = setup({ tripActions } as unknown as Partial<TripPlanner>)

    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    const input = screen.getByPlaceholderText('places.categoryNamePlaceholder')
    fireEvent.change(input, { target: { value: 'Beaches' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('12'))
  })

  it('FE-MOB-PLCAT-008: ignores Enter and keeps the confirm disabled while the name is blank', () => {
    const tripActions = buildTripActions()
    setup({ tripActions } as unknown as Partial<TripPlanner>)

    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    const input = screen.getByPlaceholderText('places.categoryNamePlaceholder')
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(tripActions.addCategory).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLCAT-009: does not fire a second create while the first is in flight', async () => {
    const tripActions = buildTripActions()
    let release: (cat: Category) => void = () => {}
    tripActions.addCategory.mockReturnValue(new Promise<Category>(resolve => { release = resolve }))
    const { onChange } = setup({ tripActions } as unknown as Partial<TripPlanner>)

    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    const input = screen.getByPlaceholderText('places.categoryNamePlaceholder')
    fireEvent.change(input, { target: { value: 'Bars' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(tripActions.addCategory).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'common.add' })).toBeDisabled()

    release({ id: 21 } as unknown as Category)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('21'))
  })

  it('FE-MOB-PLCAT-010: toasts and keeps the draft when the create fails', async () => {
    const tripActions = buildTripActions()
    tripActions.addCategory.mockRejectedValue(new Error('409'))
    const { planner, onChange } = setup({ tripActions } as unknown as Partial<TripPlanner>)

    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    fireEvent.change(screen.getByPlaceholderText('places.categoryNamePlaceholder'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('places.categoryCreateError'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('places.categoryNamePlaceholder')).toHaveValue('Bars')
  })

  it('FE-MOB-PLCAT-011: cancelling drops the draft and restores the dashed pill', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    fireEvent.change(screen.getByPlaceholderText('places.categoryNamePlaceholder'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))

    expect(screen.queryByPlaceholderText('places.categoryNamePlaceholder')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /mobileTrip\.newCategory/ }))
    expect(screen.getByPlaceholderText('places.categoryNamePlaceholder')).toHaveValue('')
  })

  it('FE-MOB-PLCAT-012: tolerates a trip without any categories', () => {
    setup({ categories: undefined } as unknown as Partial<TripPlanner>)
    expect(screen.getByRole('button', { name: /places\.noCategory/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Food/ })).not.toBeInTheDocument()
  })
})
