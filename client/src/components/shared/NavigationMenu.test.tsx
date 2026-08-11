import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { NavigationMenu } from './NavigationMenu'
import type { NavigationTarget } from '../Planner/placeNavigation'

// FE-COMP-NAVMENU-001 to FE-COMP-NAVMENU-007

const TARGETS: NavigationTarget[] = [
  { id: 'google', label: 'Google Maps', url: 'https://maps.example/g' },
  { id: 'waze', label: 'Waze', url: 'https://waze.example/w' },
]

/** A trigger at a chosen viewport position, so the flip can be provoked. */
function anchorAt(top: number, height = 30) {
  const el = document.createElement('button')
  document.body.appendChild(el)
  el.getBoundingClientRect = () => ({
    top, bottom: top + height, left: 40, right: 160, width: 120, height,
    x: 40, y: top, toJSON: () => ({}),
  }) as DOMRect
  return el
}

/** jsdom measures everything as 0, so the menu needs a size to be placed. */
function withMenuHeight(height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: height, left: 0, right: 200, width: 200, height,
    x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
}

beforeEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  window.innerHeight = 800
  window.innerWidth = 1200
})

describe('NavigationMenu', () => {
  it('FE-COMP-NAVMENU-001: lists one entry per target', () => {
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(100)} onClose={vi.fn()} />)
    expect(screen.getByRole('menuitem', { name: 'Google Maps' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Waze' })).toBeInTheDocument()
  })

  it('FE-COMP-NAVMENU-002: opening a target closes the menu', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(100)} onClose={onClose} />)

    fireEvent.click(screen.getByRole('menuitem', { name: 'Waze' }))

    expect(open).toHaveBeenCalledWith('https://waze.example/w', '_blank', 'noopener,noreferrer')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-NAVMENU-003: sits below the trigger when there is room', () => {
    withMenuHeight(120)
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(100)} onClose={vi.fn()} />)
    // Trigger ends at 130, so the menu starts just under it.
    expect(screen.getByRole('menu')).toHaveStyle({ top: '136px' })
  })

  it('FE-COMP-NAVMENU-004: flips above the trigger when the bottom edge is close', () => {
    // Trigger ends at 780 with a viewport of 800: a 120px menu would be cut off.
    withMenuHeight(120)
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(750)} onClose={vi.fn()} />)
    expect(screen.getByRole('menu')).toHaveStyle({ top: '624px' })
  })

  it('FE-COMP-NAVMENU-005: never leaves the viewport, even when neither side fits', () => {
    // Taller than the window: clamped to the top margin rather than negative.
    withMenuHeight(900)
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(700)} onClose={vi.fn()} />)
    expect(screen.getByRole('menu')).toHaveStyle({ top: '8px' })
  })

  it('FE-COMP-NAVMENU-006: Escape closes it', () => {
    const onClose = vi.fn()
    render(<NavigationMenu targets={TARGETS} anchor={anchorAt(100)} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-NAVMENU-007: renders nothing without targets', () => {
    render(<NavigationMenu targets={[]} anchor={anchorAt(100)} onClose={vi.fn()} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
