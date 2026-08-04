// FE-MOB-COLKIT-001 to FE-MOB-COLKIT-006
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../helpers/render'
import {
  CancelPill, Eyebrow, INPUT_CLS, PrimaryPill, SheetFooter, SheetHeader, TEXTAREA_CLS,
} from '../../../../src/mobile/screens/collections/MCollSheetKit'

describe('MCollSheetKit', () => {
  it('FE-MOB-COLKIT-001: the sheet header shows the title and closes through its labelled button', () => {
    const onClose = vi.fn()
    render(<SheetHeader title="Edit list" onClose={onClose} closeLabel="Close" />)

    expect(screen.getByText('Edit list')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLKIT-002: the eyebrow renders its children and merges an extra class', () => {
    const { container } = render(<Eyebrow className="mt-4">Cover</Eyebrow>)

    const el = container.firstElementChild as HTMLElement
    expect(el).toHaveTextContent('Cover')
    expect(el.className).toContain('mt-4')
    expect(el.className).toContain('text-m-faint')
  })

  it('FE-MOB-COLKIT-003: the cancel pill fires onClick and honours disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(<CancelPill onClick={onClick}>Cancel</CancelPill>)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<CancelPill onClick={onClick} disabled>Cancel</CancelPill>)
    const btn = screen.getByRole('button', { name: 'Cancel' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLKIT-004: the primary pill fires onClick, honours disabled and keeps the accent surface', () => {
    const onClick = vi.fn()
    const { rerender } = render(<PrimaryPill onClick={onClick} className="!bg-red-500">Save</PrimaryPill>)

    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn.className).toContain('bg-m-act')
    expect(btn.className).toContain('!bg-red-500')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<PrimaryPill onClick={onClick} disabled>Save</PrimaryPill>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('FE-MOB-COLKIT-005: a pill without onClick stays inert on click', () => {
    render(<PrimaryPill>Add</PrimaryPill>)
    // No handler wired — clicking must not throw.
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
  })

  it('FE-MOB-COLKIT-006: the footer renders its children and the field classes use mobile tokens', () => {
    render(<SheetFooter><span>footer slot</span></SheetFooter>)
    expect(screen.getByText('footer slot')).toBeInTheDocument()

    // Both field presets have to sit on the sheet surface token, not a raw colour.
    expect(INPUT_CLS).toContain('bg-[color:var(--m-sheet)]')
    expect(TEXTAREA_CLS).toContain('bg-[color:var(--m-sheet)]')
  })
})
