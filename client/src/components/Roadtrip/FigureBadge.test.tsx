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
  it('FE-FIGURE-BADGE-001: the neutral badge is the white pill of the day plan, the word and the figure split by a hairline', () => {
    const { container } = render(<FigureBadge lead={<Footprints size={10} aria-hidden />} value="240 m" />)
    const pill = container.firstElementChild!
    expect(classes(pill)).toEqual(of(
      'inline-flex h-[20px] flex-none items-center gap-1 self-start whitespace-nowrap rounded-full bg-surface-card px-2 font-geist font-normal leading-none tabular-nums shadow-sm ring-1 ring-inset ring-edge-faint',
    ))
    expect(classes(pill.children[0])).toEqual(of('flex min-w-0 items-center gap-1 text-content-faint'))
    expect(pill.children[1]).toHaveAttribute('aria-hidden')
    expect(classes(pill.children[1])).toEqual(expect.arrayContaining(['w-px', 'bg-edge']))
    expect(classes(pill.children[2])).toEqual(of('flex items-center text-content-secondary'))
    expect(pill.children[2]).toHaveTextContent('240 m')
  })

  it('FE-FIGURE-BADGE-002: the warning tone sets both halves in the warning colour, a booking tone only its word', () => {
    const warning = render(<FigureBadge tone="warning" dir="ltr" lead="!" value="+30 min" />)
    const pill = warning.container.firstElementChild!
    expect(pill).toHaveAttribute('dir', 'ltr')
    expect(classes(pill.children[0])).toContain('text-warning')
    expect(classes(pill.children[2])).toContain('text-warning')
    warning.unmount()

    const booked = render(<FigureBadge tone="success" caption lead="Booked" value="#42" />)
    const bookedPill = booked.container.firstElementChild as Element
    expect(classes(bookedPill.children[0])).toContain('text-success')
    expect(classes(bookedPill.children[2])).toContain('text-content-secondary')
    booked.unmount()

    const pending = render(<FigureBadge tone="pending" caption lead="Pending" value="#42" />)
    const pendingPill = pending.container.firstElementChild as Element
    expect(classes(pendingPill.children[0])).toContain('text-warning')
    expect(classes(pendingPill.children[2])).toContain('text-content-secondary')
  })

  it('FE-FIGURE-BADGE-003: a word in the lead is a caption, a figure can be quiet, and without one the sign stands alone', () => {
    const caption = render(<FigureBadge caption lead="Stay" value="+" faint valueSize="micro" />)
    const pill = caption.container.firstElementChild!
    expect(classes(pill.children[0])).toEqual(expect.arrayContaining(['uppercase', 'tracking-[.05em]']))
    expect(classes(pill.children[2])).toEqual(expect.arrayContaining(['text-content-faint']))
    caption.unmount()

    const sign = render(<FigureBadge lead={<Footprints size={10} aria-label="Walk" />} />)
    const signPill = sign.container.firstElementChild!
    expect(signPill.children).toHaveLength(1)
    // Alone, the sign takes the figure's ink rather than the quiet one of a word beside a figure.
    expect(classes(signPill.children[0])).toContain('text-content-secondary')
    expect(screen.getByLabelText('Walk')).toBeInTheDocument()
    sign.unmount()

    const shrinking = render(<FigureBadge shrink lead="Hotel" value="1" />)
    const shrinkPill = shrinking.container.firstElementChild as Element
    expect(classes(shrinkPill)).toEqual(expect.arrayContaining(['min-w-0', 'shrink', 'overflow-hidden']))
    expect(classes(shrinkPill)).not.toContain('flex-none')
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
