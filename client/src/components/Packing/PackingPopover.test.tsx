// FE-PACKPOP-001 to FE-PACKPOP-008
import { describe, it, expect, vi } from 'vitest'
import { useRef } from 'react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { PopoverItem } from './PackingPopover'
import { composerConfirm, useDismissOnOutside } from './packingPopoverStyles'

function Harness({ open, onClose, laidOut = true }: { open: boolean; onClose: () => void; laidOut?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useDismissOnOutside(ref, open, onClose)
  return (
    <div>
      <div ref={el => {
        ref.current = el
        // jsdom lays nothing out; a displayed element has at least one box.
        if (el) el.getClientRects = () => ({ length: laidOut ? 1 : 0 }) as DOMRectList
      }} data-testid="inside"><button type="button">inside</button></div>
      <button type="button">outside</button>
    </div>
  )
}

describe('PopoverItem', () => {
  it('FE-PACKPOP-001: the current choice carries a tick and keeps its tint on hover', () => {
    const onClick = vi.fn()
    const { container } = render(<PopoverItem icon={<span />} label="Trolley" active onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Trolley' })

    expect(container.querySelector('svg.lucide-check')).not.toBeNull()
    fireEvent.mouseEnter(btn)
    fireEvent.mouseLeave(btn)
    expect(btn.style.background).toBe('var(--bg-tertiary)')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-PACKPOP-002: a trailing element replaces the tick', () => {
    const { container } = render(<PopoverItem icon={<span />} label="Move" active trailing={<i data-testid="arrow" />} onClick={() => {}} />)
    expect(screen.getByTestId('arrow')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-check')).toBeNull()
  })

  it('FE-PACKPOP-003: a muted entry reads faint and a danger entry red, with its own hover tint', () => {
    render(<>
      <PopoverItem icon={<span />} label="Add bag" muted onClick={() => {}} />
      <PopoverItem icon={<span />} label="Delete" danger onClick={() => {}} />
    </>)
    const muted = screen.getByRole('button', { name: 'Add bag' })
    const danger = screen.getByRole('button', { name: 'Delete' })

    expect(muted.style.color).toBe('var(--text-faint)')
    expect(danger.style.color).toBe('rgb(239, 68, 68)')
    fireEvent.mouseEnter(danger)
    expect(danger.style.background).toBe('rgba(239, 68, 68, 0.1)')
    fireEvent.mouseLeave(danger)
    expect(danger.style.background).toBe('none')
  })

  it('FE-PACKPOP-004: the composer button fades while there is nothing to add', () => {
    expect(composerConfirm(false)).toMatchObject({ opacity: 0.35, cursor: 'default' })
    expect(composerConfirm(true)).toMatchObject({ opacity: 1, cursor: 'pointer' })
  })
})

describe('useDismissOnOutside', () => {
  it('FE-PACKPOP-005: a press outside closes', () => {
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} />)

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-PACKPOP-006: a press inside leaves it open', () => {
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} />)

    fireEvent.mouseDown(screen.getByRole('button', { name: 'inside' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-PACKPOP-007: a copy that is mounted but not displayed never closes anything', () => {
    const onClose = vi.fn()
    render(<Harness open onClose={onClose} laidOut={false} />)

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-PACKPOP-008: nothing listens while closed', () => {
    const onClose = vi.fn()
    render(<Harness open={false} onClose={onClose} />)

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
