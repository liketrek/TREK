// FE-W4PCON-001 to FE-W4PCON-016
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import type { ViewContribution } from '../../api/client'

const viewContributions = vi.fn(async (_view: string, _tripId: string | number) => ({ contributions: [] as ViewContribution[] }))
const invoke = vi.fn(async (_id: string, _sub: string, _init?: unknown) => ({}))
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }

vi.mock('../../api/client', () => ({
  pluginsApi: {
    viewContributions: (view: string, tripId: string | number) => viewContributions(view, tripId),
    invoke: (id: string, sub: string, init?: unknown) => invoke(id, sub, init),
  },
}))
vi.mock('../shared/Toast', () => ({ useToast: () => toast }))
vi.mock('./PluginFrame', () => ({
  default: ({ pluginId, tripId, fill }: { pluginId: string; tripId: string | null; fill?: boolean }) =>
    <div data-testid="frame" data-plugin={pluginId} data-trip={tripId ?? ''} data-fill={String(!!fill)} />,
}))

import { usePluginViewContributions, PluginColumns, PluginCardFooter, PluginActions } from './PluginContributions'

function column(overrides: Partial<Extract<ViewContribution, { kind: 'column' }>> = {}): ViewContribution {
  return { kind: 'column', pluginId: 'p1', entityId: 1, id: 'c1', label: 'Range', value: '320 km', tone: 'default', ...overrides }
}
function action(overrides: Partial<Extract<ViewContribution, { kind: 'action' }>> = {}): ViewContribution {
  return { kind: 'action', pluginId: 'p1', entityId: 1, id: 'a1', label: 'Recalculate', target: { kind: 'route', method: 'POST', sub: 'recalc' }, ...overrides }
}

beforeEach(() => {
  viewContributions.mockReset()
  viewContributions.mockResolvedValue({ contributions: [] })
  invoke.mockReset()
  invoke.mockResolvedValue({})
  Object.values(toast).forEach(f => f.mockClear())
})

describe('usePluginViewContributions', () => {
  it('FE-W4PCON-001: buckets contributions by entity id', async () => {
    viewContributions.mockResolvedValue({
      contributions: [column({ entityId: 1, id: 'a' }), column({ entityId: 2, id: 'b' }), column({ entityId: 1, id: 'c' })],
    })

    const { result } = renderHook(() => usePluginViewContributions('places', 4))

    await waitFor(() => expect(result.current(1)).toHaveLength(2))
    expect(viewContributions).toHaveBeenCalledWith('places', 4)
    expect(result.current(2).map(c => c.id)).toEqual(['b'])
  })

  it('FE-W4PCON-002: returns a shared empty array for an entity nobody contributed to', async () => {
    viewContributions.mockResolvedValue({ contributions: [column()] })
    const { result } = renderHook(() => usePluginViewContributions('day', 1))

    await waitFor(() => expect(result.current(1)).toHaveLength(1))
    expect(result.current(77)).toBe(result.current(78))
  })

  it('FE-W4PCON-003: skips the request without a trip', () => {
    const { result } = renderHook(() => usePluginViewContributions('costs', null))

    expect(viewContributions).not.toHaveBeenCalled()
    expect(result.current(1)).toEqual([])
  })

  it('FE-W4PCON-004: yields an empty lookup when the endpoint fails', async () => {
    viewContributions.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => usePluginViewContributions('files', 1))

    await waitFor(() => expect(viewContributions).toHaveBeenCalled())
    expect(result.current(1)).toEqual([])
  })

  it('FE-W4PCON-005: tolerates a response without a contributions array', async () => {
    viewContributions.mockResolvedValue({} as { contributions: ViewContribution[] })
    const { result } = renderHook(() => usePluginViewContributions('todos', 1))

    await waitFor(() => expect(viewContributions).toHaveBeenCalled())
    expect(result.current(1)).toEqual([])
  })

  it('FE-W4PCON-006: refetches when the view changes', async () => {
    const { rerender } = renderHook(
      ({ view }: { view: 'places' | 'day' }) => usePluginViewContributions(view, 1),
      { initialProps: { view: 'places' as const } },
    )
    await waitFor(() => expect(viewContributions).toHaveBeenCalledTimes(1))

    rerender({ view: 'day' })
    await waitFor(() => expect(viewContributions).toHaveBeenLastCalledWith('day', 1))
  })
})

describe('PluginColumns', () => {
  it('FE-W4PCON-007: renders nothing when only actions were contributed', () => {
    const { container } = render(<PluginColumns items={[action()]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PCON-008: renders a label/value pair with the tone class', () => {
    render(<PluginColumns items={[column({ tone: 'danger' })]} />)

    expect(screen.getByText('Range')).toBeInTheDocument()
    expect(screen.getByText('320 km')).toHaveClass('text-danger')
  })

  it('FE-W4PCON-009: falls back to the muted tone for an unknown tone', () => {
    render(<PluginColumns items={[column({ tone: 'weird' as Extract<ViewContribution, { kind: 'column' }>['tone'] })]} />)

    expect(screen.getByText('320 km')).toHaveClass('text-content-muted')
  })

  it('FE-W4PCON-010: renders a url column as a new-tab link that does not open the row', () => {
    render(<PluginColumns items={[column({ url: 'https://example.com' })]} />)
    const link = screen.getByRole('link', { name: '320 km' })

    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    const stopped = vi.spyOn(click, 'stopPropagation')
    fireEvent(link, click)
    expect(stopped).toHaveBeenCalled()
  })

  it('FE-W4PCON-011: uses an arrow glyph for a link without a value', () => {
    render(<PluginColumns items={[column({ url: 'https://example.com', value: undefined })]} />)

    expect(screen.getByRole('link')).toHaveTextContent('↗')
  })
})

describe('PluginActions', () => {
  it('FE-W4PCON-012: renders nothing when only columns were contributed', () => {
    const { container } = render(<PluginActions items={[column()]} tripId={1} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PCON-013: a route action invokes the plugin and toasts on success', async () => {
    render(<PluginActions items={[action()]} tripId={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'Recalculate' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Recalculate'))
    expect(invoke).toHaveBeenCalledWith('p1', 'recalc', { method: 'POST' })
  })

  it('FE-W4PCON-014: a failing route action toasts the error', async () => {
    invoke.mockRejectedValue(new Error('500'))
    render(<PluginActions items={[action()]} tripId={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'Recalculate' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Recalculate'))
  })

  it('FE-W4PCON-015: a frame action opens the sandboxed modal and closes on the X', () => {
    render(<PluginActions items={[action({ label: 'Configure', target: { kind: 'frame', sub: 'config' } })]} tripId={9} />)

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }))
    const frame = screen.getByTestId('frame')
    expect(frame).toHaveAttribute('data-plugin', 'p1')
    expect(frame).toHaveAttribute('data-trip', '9')
    expect(frame).toHaveAttribute('data-fill', 'true')
    expect(invoke).not.toHaveBeenCalled()

    fireEvent.click(screen.getAllByRole('button')[1])
    expect(screen.queryByTestId('frame')).toBeNull()
  })

  it('FE-W4PCON-016: the frame modal closes on backdrop click but not on card click', () => {
    const { container } = render(
      <PluginActions items={[action({ label: 'Configure', target: { kind: 'frame', sub: 'config' } })]} tripId={null} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Configure' }))
    expect(screen.getByTestId('frame')).toHaveAttribute('data-trip', '')

    fireEvent.click(container.querySelector('.bg-surface-card')!)
    expect(screen.getByTestId('frame')).toBeInTheDocument()

    fireEvent.click(container.querySelector('.fixed.inset-0')!)
    expect(screen.queryByTestId('frame')).toBeNull()
  })

  it('FE-W4PCON-017: accepts a caller className for the action buttons', () => {
    render(<PluginActions items={[action()]} tripId={1} className="btn-sm" />)

    expect(screen.getByRole('button', { name: 'Recalculate' })).toHaveClass('btn-sm')
  })
})

describe('PluginCardFooter', () => {
  it('FE-W4PCON-018: renders nothing without contributions', () => {
    const { container } = render(<PluginCardFooter items={[]} tripId={1} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PCON-019: renders columns and actions together under a divider', () => {
    render(<PluginCardFooter items={[column(), action()]} tripId={1} />)

    expect(screen.getByText('Range')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recalculate' })).toBeInTheDocument()
  })
})
