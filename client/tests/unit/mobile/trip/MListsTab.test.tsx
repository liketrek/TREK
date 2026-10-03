import { describe, expect, it, vi } from 'vitest'
import MListsTab from '../../../../src/mobile/screens/trip/tabs/MListsTab'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { render, screen } from '../../../helpers/render'
import type { MTripShellApi } from '../../../../src/mobile/screens/trip/MTripShell'

vi.mock('../../../../src/mobile/screens/trip/tabs/MPackingListTab', () => ({
  default: () => <div data-testid="m-packing-list-tab" />,
}))

vi.mock('../../../../src/mobile/screens/trip/tabs/MShoppingListTab', () => ({
  default: () => <div data-testid="m-shopping-list-tab" />,
}))

vi.mock('../../../../src/mobile/screens/trip/tabs/MTodoListTab', () => ({
  default: () => <div data-testid="m-todo-list-tab" />,
}))

describe('MListsTab', () => {
  it('renders MPackingListTab when shell.listsTab is packing', () => {
    const planner = buildPlanner()
    const shell = { listsTab: 'packing' } as unknown as MTripShellApi

    render(<MListsTab planner={planner} shell={shell} />)
    expect(screen.getByTestId('m-packing-list-tab')).toBeInTheDocument()
  })

  it('renders MShoppingListTab when shell.listsTab is shopping', () => {
    const planner = buildPlanner()
    const shell = { listsTab: 'shopping' } as unknown as MTripShellApi

    render(<MListsTab planner={planner} shell={shell} />)
    expect(screen.getByTestId('m-shopping-list-tab')).toBeInTheDocument()
  })

  it('renders MTodoListTab when shell.listsTab is todo', () => {
    const planner = buildPlanner()
    const shell = { listsTab: 'todo' } as unknown as MTripShellApi

    render(<MListsTab planner={planner} shell={shell} />)
    expect(screen.getByTestId('m-todo-list-tab')).toBeInTheDocument()
  })
})
