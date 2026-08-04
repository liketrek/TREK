// FE-W4ATB-001 to FE-W4ATB-010
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { useTripStore } from '../../store/tripStore'

const listTemplates = vi.fn(async (_tripId: number | string) => ({ templates: [] as unknown[] }))
const applyTemplate = vi.fn(async (_tripId: number | string, _id: number, _vis: string) => ({ items: [] as unknown[], count: 0 }))
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }

vi.mock('../../api/client', () => ({
  packingApi: {
    listTemplates: (tripId: number | string) => listTemplates(tripId),
    applyTemplate: (tripId: number | string, id: number, vis: string) => applyTemplate(tripId, id, vis),
  },
}))
vi.mock('../shared/Toast', () => ({ useToast: () => toast }))

import ApplyTemplateButton from './ApplyTemplateButton'

const TEMPLATES = [
  { id: 1, name: 'Beach trip', item_count: 12 },
  { id: 2, name: 'City break', item_count: 7 },
]

function renderButton(visibility: 'common' | 'personal' = 'common') {
  return render(<ApplyTemplateButton tripId={4} visibility={visibility} style={{ gap: 6 }} />)
}

beforeEach(() => {
  listTemplates.mockReset()
  listTemplates.mockResolvedValue({ templates: TEMPLATES })
  applyTemplate.mockReset()
  applyTemplate.mockResolvedValue({ items: [], count: 0 })
  Object.values(toast).forEach(f => f.mockClear())
  useTripStore.setState({ packingItems: [] })
})

describe('ApplyTemplateButton', () => {
  it('FE-W4ATB-001: renders nothing while no template exists', async () => {
    listTemplates.mockResolvedValue({ templates: [] })
    const { container } = renderButton()

    await waitFor(() => expect(listTemplates).toHaveBeenCalledWith(4))
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4ATB-002: stays hidden when the template list fails to load', async () => {
    listTemplates.mockRejectedValue(new Error('offline'))
    const { container } = renderButton()

    await waitFor(() => expect(listTemplates).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4ATB-003: tolerates a response without a templates array', async () => {
    listTemplates.mockResolvedValue({} as { templates: unknown[] })
    const { container } = renderButton()

    await waitFor(() => expect(listTemplates).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4ATB-004: shows the trigger once templates arrive', async () => {
    renderButton()

    expect(await screen.findByRole('button')).toHaveTextContent(/apply template/i)
  })

  it('FE-W4ATB-005: the trigger toggles the template menu', async () => {
    renderButton()
    const trigger = await screen.findByRole('button')

    fireEvent.click(trigger)
    expect(screen.getByText('Beach trip')).toBeInTheDocument()
    expect(screen.getByText(/^12 /)).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByText('Beach trip')).toBeNull()
  })

  it('FE-W4ATB-006: a mousedown outside closes the menu', async () => {
    renderButton()
    fireEvent.click(await screen.findByRole('button'))
    expect(screen.getByText('City break')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('City break')).toBeNull()
  })

  it('FE-W4ATB-007: a mousedown inside keeps the menu open', async () => {
    renderButton()
    fireEvent.click(await screen.findByRole('button'))

    fireEvent.mouseDown(screen.getByText('Beach trip'))

    expect(screen.getByText('Beach trip')).toBeInTheDocument()
  })

  it('FE-W4ATB-008: applying a template appends its items to the trip store', async () => {
    applyTemplate.mockResolvedValue({ items: [{ id: 90 }, { id: 91 }], count: 2 })
    useTripStore.setState({ packingItems: [{ id: 1 }] as never })
    renderButton('personal')

    fireEvent.click(await screen.findByRole('button'))
    fireEvent.click(screen.getByText('Beach trip'))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('2')))
    expect(applyTemplate).toHaveBeenCalledWith(4, 1, 'personal')
    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([1, 90, 91])
    expect(screen.queryByText('Beach trip')).toBeNull()
  })

  it('FE-W4ATB-009: tolerates a response without an items array', async () => {
    applyTemplate.mockResolvedValue({ count: 0 } as { items: unknown[]; count: number })
    renderButton()

    fireEvent.click(await screen.findByRole('button'))
    fireEvent.click(screen.getByText('City break'))

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(useTripStore.getState().packingItems).toEqual([])
  })

  it('FE-W4ATB-010: a failing apply toasts an error and keeps the menu open', async () => {
    applyTemplate.mockRejectedValue(new Error('500'))
    renderButton()

    fireEvent.click(await screen.findByRole('button'))
    fireEvent.click(screen.getByText('Beach trip'))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(screen.getByText('Beach trip')).toBeInTheDocument()
  })

  it('FE-W4ATB-011: honours a caller className on the trigger', async () => {
    render(<ApplyTemplateButton tripId={4} visibility="common" style={{}} className="btn-ghost" />)

    expect(await screen.findByRole('button')).toHaveClass('btn-ghost')
  })
})
