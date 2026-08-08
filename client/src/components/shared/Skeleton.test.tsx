// FE-W4SKEL-001 to FE-W4SKEL-008
import { describe, it, expect } from 'vitest'
import { render } from '../../../tests/helpers/render'
import Skeleton, { SpotlightSkeleton, TripCardSkeleton, DaySkeleton } from './Skeleton'

describe('Skeleton', () => {
  it('FE-W4SKEL-001: defaults to a 14px-high shimmer bar hidden from a11y', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('.trek-skeleton') as HTMLElement

    expect(el).not.toBeNull()
    expect(el.style.height).toBe('14px')
    expect(el).toHaveAttribute('aria-hidden')
  })

  it('FE-W4SKEL-002: applies width, height and radius', () => {
    const { container } = render(<Skeleton width={120} height={40} radius={8} />)
    const el = container.querySelector('.trek-skeleton') as HTMLElement

    expect(el.style.width).toBe('120px')
    expect(el.style.height).toBe('40px')
    expect(el.style.borderRadius).toBe('8px')
  })

  it('FE-W4SKEL-003: accepts string sizes and merges extra style', () => {
    const { container } = render(<Skeleton width="60%" style={{ marginBottom: 8 }} />)
    const el = container.querySelector('.trek-skeleton') as HTMLElement

    expect(el.style.width).toBe('60%')
    expect(el.style.marginBottom).toBe('8px')
  })

  it('FE-W4SKEL-004: appends a caller className without dropping the base class', () => {
    const { container } = render(<Skeleton className="mt-2" />)
    const el = container.querySelector('.trek-skeleton') as HTMLElement

    expect(el.className).toBe('trek-skeleton mt-2')
  })

  it('FE-W4SKEL-005: trims the class list when no className is given', () => {
    const { container } = render(<Skeleton />)
    expect((container.firstElementChild as HTMLElement).className).toBe('trek-skeleton')
  })
})

describe('composed skeletons', () => {
  it('FE-W4SKEL-006: SpotlightSkeleton renders the hero backdrop plus two bars', () => {
    const { container } = render(<SpotlightSkeleton />)

    expect(container.querySelectorAll('.trek-skeleton')).toHaveLength(3)
    expect((container.firstElementChild as HTMLElement).style.minHeight).toBe('340px')
  })

  it('FE-W4SKEL-007: TripCardSkeleton renders a cover plus two text bars', () => {
    const { container } = render(<TripCardSkeleton />)
    const bars = container.querySelectorAll('.trek-skeleton')

    expect(bars).toHaveLength(3)
    expect((bars[0] as HTMLElement).style.height).toBe('140px')
  })

  it('FE-W4SKEL-008: DaySkeleton renders three stacked bars', () => {
    const { container } = render(<DaySkeleton />)
    expect(container.querySelectorAll('.trek-skeleton')).toHaveLength(3)
  })
})
