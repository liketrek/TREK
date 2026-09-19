// FE-COMP-MBADGE-001 to FE-COMP-MBADGE-006
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from 'lucide-react'
import MBadge from './MBadge'

describe('MBadge', () => {
  it('FE-COMP-MBADGE-001: renders its label in a span and is no control', () => {
    render(<MBadge>3 stops</MBadge>)

    const badge = screen.getByText('3 stops')
    expect(badge.tagName).toBe('SPAN')
    // It sits inside buttons, and a button inside a button is invalid markup.
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('FE-COMP-MBADGE-002: is neutral by default on the resting chip tokens, and strong on the active ones', () => {
    render(<MBadge>neutral</MBadge>)
    const neutral = screen.getByText('neutral')
    expect(neutral.className).toContain('bg-[color:var(--m-ic)]')
    expect(neutral.className).toContain('border-[color:var(--m-rowbr)]')
    expect(neutral.className).not.toContain('bg-m-act')

    render(<MBadge tone="strong">strong</MBadge>)
    const strong = screen.getByText('strong')
    expect(strong.className).toContain('bg-m-act')
    expect(strong.className).toContain('text-m-actfg')
    expect(strong.className).not.toContain('bg-[color:var(--m-ic)]')
  })

  it('FE-COMP-MBADGE-003: sets words in caps by default and leaves a unit symbol alone when asked', () => {
    render(<MBadge>Sat 2</MBadge>)
    expect(screen.getByText('Sat 2').className).toContain('uppercase')

    render(<MBadge caps={false}>300 m</MBadge>)
    // Uppercase would turn metres into megametres.
    expect(screen.getByText('300 m').className).not.toContain('uppercase')
  })

  it('FE-COMP-MBADGE-004: is 18px at xs, the default, and 22px at sm', () => {
    render(<MBadge>small</MBadge>)
    expect(screen.getByText('small').className).toContain('h-[18px]')

    render(<MBadge size="sm" className="ms-auto">larger</MBadge>)
    const larger = screen.getByText('larger')
    expect(larger.className).toContain('h-[22px]')
    expect(larger.className).toContain('ms-auto')
  })

  it('FE-COMP-MBADGE-005: draws an icon before the label, inside the same pill and out of its name', () => {
    render(<MBadge icon={<Route size={10} />}>412 km</MBadge>)

    const badge = screen.getByText('412 km')
    const icon = badge.firstElementChild as HTMLElement
    expect(icon.querySelector('svg')).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(badge.lastChild?.textContent).toBe('412 km')
  })

  it('FE-COMP-MBADGE-006: keeps a figure on one line, and lets a sentence wrap inside the width it is given', () => {
    render(<MBadge>412 km</MBadge>)
    const figure = screen.getByText('412 km')
    expect(figure.className).toContain('whitespace-nowrap')
    expect(figure.className).toContain('h-[18px]')

    render(<MBadge wrap size="sm">Still working out the rest of the drive</MBadge>)
    const sentence = screen.getByText('Still working out the rest of the drive')
    expect(sentence.className).toContain('whitespace-normal')
    expect(sentence.className).toContain('max-w-full')
    expect(sentence.className).toContain('min-h-[22px]')
    expect(sentence.className).not.toContain('whitespace-nowrap')
    expect(sentence.className).not.toMatch(/(^|\s)h-\[22px\]/)
  })
})
