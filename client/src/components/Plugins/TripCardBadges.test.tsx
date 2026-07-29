// FE-W4TCB-001 to FE-W4TCB-011
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import type { TripCardBadge } from '../../api/client'

const tripCardContributions = vi.fn(async (_ids: Array<number | string>) => ({ contributions: [] as TripCardBadge[] }))

vi.mock('../../api/client', () => ({
  pluginsApi: { tripCardContributions: (ids: Array<number | string>) => tripCardContributions(ids) },
}))

import { TripCardBadges, useTripCardBadges } from './TripCardBadges'

function badge(overrides: Partial<TripCardBadge> = {}): TripCardBadge {
  return { pluginId: 'p1', tripId: 1, id: 'b1', label: 'CO2', value: '12 kg', tone: 'default', ...overrides }
}

beforeEach(() => {
  tripCardContributions.mockReset()
  tripCardContributions.mockResolvedValue({ contributions: [] })
})

describe('useTripCardBadges', () => {
  it('FE-W4TCB-001: fetches all visible trip ids in one call and buckets by trip', async () => {
    tripCardContributions.mockResolvedValue({
      contributions: [
        badge({ tripId: 1, id: 'a' }),
        badge({ tripId: 2, id: 'b' }),
        badge({ tripId: 1, id: 'c' }),
      ],
    })

    const { result } = renderHook(() => useTripCardBadges([1, 2], true))

    await waitFor(() => expect(result.current(1)).toHaveLength(2))
    expect(tripCardContributions).toHaveBeenCalledExactlyOnceWith([1, 2])
    expect(result.current(1).map(b => b.id)).toEqual(['a', 'c'])
    expect(result.current(2).map(b => b.id)).toEqual(['b'])
  })

  it('FE-W4TCB-002: returns a stable empty array for a trip with no badges', async () => {
    tripCardContributions.mockResolvedValue({ contributions: [badge({ tripId: 1 })] })
    const { result } = renderHook(() => useTripCardBadges([1], true))

    await waitFor(() => expect(result.current(1)).toHaveLength(1))
    expect(result.current(99)).toBe(result.current(98))
  })

  it('FE-W4TCB-003: never hits the endpoint when no plugin is active', () => {
    renderHook(() => useTripCardBadges([1, 2], false))
    expect(tripCardContributions).not.toHaveBeenCalled()
  })

  it('FE-W4TCB-004: never hits the endpoint for an empty dashboard', () => {
    renderHook(() => useTripCardBadges([], true))
    expect(tripCardContributions).not.toHaveBeenCalled()
  })

  it('FE-W4TCB-005: yields an empty lookup when the endpoint fails', async () => {
    tripCardContributions.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useTripCardBadges([1], true))

    await waitFor(() => expect(tripCardContributions).toHaveBeenCalled())
    expect(result.current(1)).toEqual([])
  })

  it('FE-W4TCB-006: tolerates a response without a contributions array', async () => {
    tripCardContributions.mockResolvedValue({} as { contributions: TripCardBadge[] })
    const { result } = renderHook(() => useTripCardBadges([1], true))

    await waitFor(() => expect(tripCardContributions).toHaveBeenCalled())
    expect(result.current(1)).toEqual([])
  })

  it('FE-W4TCB-007: refetches when the visible id set changes', async () => {
    const { rerender } = renderHook(({ ids }: { ids: number[] }) => useTripCardBadges(ids, true), {
      initialProps: { ids: [1] },
    })
    await waitFor(() => expect(tripCardContributions).toHaveBeenCalledTimes(1))

    rerender({ ids: [1, 2] })
    await waitFor(() => expect(tripCardContributions).toHaveBeenCalledTimes(2))
    expect(tripCardContributions).toHaveBeenLastCalledWith([1, 2])
  })
})

describe('TripCardBadges', () => {
  it('FE-W4TCB-008: renders nothing when no plugin contributes', () => {
    const { container } = render(<TripCardBadges items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4TCB-009: renders a plain chip with label, value and tone class', () => {
    const { container } = render(<TripCardBadges items={[badge({ tone: 'warn' })]} />)

    expect(screen.getByText('CO2')).toBeInTheDocument()
    expect(screen.getByText('12 kg')).toBeInTheDocument()
    expect(container.querySelector('.trip-plugin-badge')).toHaveClass('tone-warn')
  })

  it('FE-W4TCB-010: omits the value span when the badge carries none', () => {
    const { container } = render(<TripCardBadges items={[badge({ value: undefined }), badge({ id: 'b2', value: '' })]} />)

    expect(container.querySelectorAll('.badge-value')).toHaveLength(0)
    expect(container.querySelectorAll('.badge-label')).toHaveLength(2)
  })

  it('FE-W4TCB-011: renders a url badge as a safe new-tab link that does not open the card', () => {
    render(<TripCardBadges items={[badge({ url: 'https://example.com/report' })]} />)
    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', 'https://example.com/report')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    const stopped = vi.spyOn(click, 'stopPropagation')
    fireEvent(link, click)
    expect(stopped).toHaveBeenCalled()
  })
})
