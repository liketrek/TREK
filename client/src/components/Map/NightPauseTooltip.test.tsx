import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import NightPauseTooltip from './NightPauseTooltip'

afterEach(() => vi.restoreAllMocks())

it('keeps the full pause description inside the viewport at its lower right edge', () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 240, height: 56 } as DOMRect)
  const label = 'Tagesende von Tag 12 um 18:00 Uhr'
  render(<NightPauseTooltip label={label} x={window.innerWidth - 5} y={window.innerHeight - 5} />)
  const tooltip = screen.getByRole('tooltip')
  expect(tooltip).toHaveTextContent(label)
  expect(parseFloat(tooltip.style.left) + 240).toBeLessThanOrEqual(window.innerWidth - 12)
  expect(parseFloat(tooltip.style.top) + 56).toBeLessThanOrEqual(window.innerHeight - 12)
  expect(tooltip.style.overflowWrap).toBe('anywhere')
})

it('keeps descriptions visible at the upper left edge', () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 240, height: 56 } as DOMRect)
  render(<NightPauseTooltip label="End of day 1 at 18:00" x={-50} y={-50} />)
  expect(screen.getByRole('tooltip')).toHaveStyle({ left: '12px', top: '12px' })
})
