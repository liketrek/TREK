import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GoogleMapsIcon from './GoogleMapsIcon'

describe('GoogleMapsIcon', () => {
  it('FE-COMP-GMAPS-001: renders a pin, not the four-segment Google search "G" (#2005)', () => {
    const { container } = render(<GoogleMapsIcon />)
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    // The old mark was four paths lifted from the Google Search logo.
    expect(container.innerHTML).not.toContain('M24 9.5c3.54')
  })

  it('FE-COMP-GMAPS-002: sizes itself and inherits the button colour', () => {
    const { container } = render(<GoogleMapsIcon size={19} />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('width')).toBe('19')
    expect(svg.getAttribute('height')).toBe('19')
    expect(svg.getAttribute('fill')).toBe('currentColor')
  })

  it('FE-COMP-GMAPS-003: stays out of the accessibility tree — the button carries the label', () => {
    const { container } = render(<GoogleMapsIcon />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
  })

  it('FE-COMP-GMAPS-004: passes className and style through', () => {
    const { container } = render(<GoogleMapsIcon className="text-m-faint" style={{ opacity: 0.5 }} />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('class')).toBe('text-m-faint')
    expect(svg.style.opacity).toBe('0.5')
  })
})
