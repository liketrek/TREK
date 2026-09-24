import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Footprints } from 'lucide-react'
import FigureBadge from './FigureBadge'

// FE-FIGURE-BADGE-001 to FE-FIGURE-BADGE-005

/** The classes a cell carries, as a set, so the order they are written in does not matter. */
const classes = (el: Element | null): string[] => (el?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort()
const of = (list: string): string[] => list.split(' ').sort()

describe('FigureBadge', () => {
  it('FE-FIGURE-BADGE-001: the neutral shell is the one the stay, the walk and the fill-up wore before', () => {
    const { container } = render(<FigureBadge lead={<Footprints size={9} aria-hidden />} value="240 m" />)
    const shell = container.firstElementChild!
    expect(classes(shell)).toEqual(of('inline-flex h-[16px] items-stretch self-start overflow-hidden rounded border border-edge'))
    expect(classes(shell.children[0])).toEqual(of('flex items-center gap-0.5 px-1 bg-surface-tertiary text-content-faint'))
    expect(classes(shell.children[1])).toEqual(
      of('flex items-center border-s bg-surface-card px-1.5 font-semibold tabular-nums border-edge text-content-secondary'),
    )
    expect(shell.children[1]).toHaveTextContent('240 m')
  })

  it('FE-FIGURE-BADGE-002: the warning tone edges both halves in the warning colour itself', () => {
    const { container } = render(<FigureBadge tone="warning" dir="ltr" lead="!" value="+30 min" />)
    const shell = container.firstElementChild!
    expect(shell).toHaveAttribute('dir', 'ltr')
    expect(classes(shell)).toContain('border-warning')
    expect(classes(shell.children[0])).toEqual(expect.arrayContaining(['bg-warning-soft', 'text-warning']))
    expect(classes(shell.children[1])).toEqual(expect.arrayContaining(['border-warning', 'text-warning']))
  })

  it('FE-FIGURE-BADGE-003: a word in the lead is a caption, a figure can be quiet, and without one the sign stands alone', () => {
    const caption = render(<FigureBadge caption lead="Stay" value="+" faint valueSize="micro" />)
    const shell = caption.container.firstElementChild!
    expect(classes(shell.children[0])).toEqual(expect.arrayContaining(['font-geist', 'font-semibold', 'uppercase', 'tracking-[0.12em]']))
    expect(classes(shell.children[1])).toEqual(expect.arrayContaining(['text-content-faint']))
    expect((shell.children[1] as HTMLElement).style.fontSize).toContain('8px')
    caption.unmount()

    const sign = render(<FigureBadge lead={<Footprints size={9} aria-label="Walk" />} />)
    expect(sign.container.firstElementChild!.children).toHaveLength(1)
    expect(screen.getByLabelText('Walk')).toBeInTheDocument()
  })

  it('FE-FIGURE-BADGE-004: as a control it is a focusable button role that answers the keys meaning press and keeps them from the row', () => {
    const onActivate = vi.fn()
    const onRow = vi.fn()
    render(
      <div role="presentation" onClick={onRow} onKeyDown={onRow}>
        <FigureBadge lead="Stay" value="1 h" onActivate={onActivate} ariaLabel="Stay: 1 h" />
      </div>,
    )
    const badge = screen.getByRole('button', { name: 'Stay: 1 h' })
    fireEvent.click(badge)
    fireEvent.keyDown(badge, { key: 'Enter' })
    fireEvent.keyDown(badge, { key: ' ' })
    fireEvent.keyDown(badge, { key: 'Tab' })
    expect(onActivate).toHaveBeenCalledTimes(3)
    expect(onActivate).toHaveBeenCalledWith(badge)
    // Only the Tab went on to the row.
    expect(onRow).toHaveBeenCalledTimes(1)
  })

  it('FE-FIGURE-BADGE-005: without a handler it is no control at all', () => {
    render(<FigureBadge lead="Stay" value="1 h" tooltip="How long you stay" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
