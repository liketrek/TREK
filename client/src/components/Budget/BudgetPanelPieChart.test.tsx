// FE-W4PIE-001 to FE-W4PIE-006
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import PieChart from './BudgetPanelPieChart'

const SEGMENTS = [
  { label: 'Food', value: 300, color: '#ef4444' },
  { label: 'Hotels', value: 100, color: '#3b82f6' },
]

describe('BudgetPanelPieChart', () => {
  it('FE-W4PIE-001: renders nothing without segments', () => {
    const { container } = render(<PieChart segments={[]} totalLabel="1.200 €" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PIE-002: renders nothing when every segment is zero', () => {
    const { container } = render(
      <PieChart segments={[{ label: 'Food', value: 0, color: '#ef4444' }]} totalLabel="0 €" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PIE-003: turns the segment shares into consecutive conic-gradient stops', () => {
    const { container } = render(<PieChart segments={SEGMENTS} totalLabel="400 €" />)
    const pie = container.querySelector('.trek-pie-reveal') as HTMLElement

    expect(pie.style.background).toBe('conic-gradient(rgb(239, 68, 68) 0deg 270deg, rgb(59, 130, 246) 270deg 360deg)')
  })

  it('FE-W4PIE-004: shows the total label in the donut hole', () => {
    render(<PieChart segments={SEGMENTS} totalLabel="400 €" />)

    expect(screen.getByText('400 €')).toBeInTheDocument()
  })

  it('FE-W4PIE-005: defaults to a 200px pie with a 55% hole', () => {
    const { container } = render(<PieChart segments={SEGMENTS} totalLabel="400 €" />)
    const root = container.firstElementChild as HTMLElement
    const hole = screen.getByText('400 €').parentElement as HTMLElement

    expect(root.style.width).toBe('200px')
    expect(Math.round(parseFloat(hole.style.width))).toBe(110)
  })

  it('FE-W4PIE-006: scales pie and hole from the size prop', () => {
    const { container } = render(<PieChart segments={SEGMENTS} size={120} totalLabel="400 €" />)
    const root = container.firstElementChild as HTMLElement
    const hole = screen.getByText('400 €').parentElement as HTMLElement

    expect(root.style.height).toBe('120px')
    expect(Math.round(parseFloat(hole.style.height))).toBe(66)
  })
})
