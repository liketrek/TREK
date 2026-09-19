import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import StopKindPicker from './StopKindPicker'
import { STOP_KINDS } from './stopKinds'

/**
 * FE-STOPKIND-001..009 — turning a place on the drive into a pause, and back.
 *
 * Opened from the stop's own number, because the number is what changes: a
 * service stop has none. The popover is a portal hung under that element, so
 * what is worth pinning is the part a portal makes easy to get wrong — that it
 * renders nothing without an anchor, that clicking outside and Escape both close
 * it, and that picking the kind a stop already has takes it back off rather than
 * setting it twice.
 */

let anchor: HTMLElement

beforeEach(() => {
  anchor = document.createElement('button')
  document.body.appendChild(anchor)
})
afterEach(() => { anchor.remove() })

function open(over: { current?: string | null; onPick?: (k: string | null) => void; onClose?: () => void } = {}) {
  const onPick = over.onPick ?? vi.fn()
  const onClose = over.onClose ?? vi.fn()
  render(
    <StopKindPicker
      anchor={anchor}
      current={over.current ?? null}
      onPick={onPick as never}
      onClose={onClose}
    />,
  )
  return { onPick, onClose }
}

describe('StopKindPicker', () => {
  it('FE-STOPKIND-001: without an anchor there is nothing to hang under', () => {
    const onPick = vi.fn()
    render(<StopKindPicker anchor={null} current={null} onPick={onPick} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-STOPKIND-002: every kind the rail draws is offered, as a disc rather than a word', () => {
    open()
    const dialog = screen.getByRole('dialog')
    // One button per kind, plus none extra: six rows of text for six icons would
    // be a menu where a palette does.
    const buttons = dialog.querySelectorAll('button[aria-pressed]')
    expect(buttons).toHaveLength(STOP_KINDS.length)
  })

  it('FE-STOPKIND-003: picking a kind reports it', () => {
    const { onPick } = open()
    const first = STOP_KINDS[0]
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0])
    expect(onPick).toHaveBeenCalledWith(first.key)
  })

  it('FE-STOPKIND-004: picking the kind it already is takes it back off', () => {
    // The control is its own toggle. Without this, changing your mind about a
    // fuel stop means finding the separate undo below.
    const kind = STOP_KINDS[0].key
    const { onPick } = open({ current: kind })

    fireEvent.click(screen.getByRole('button', { pressed: true }))

    expect(onPick).toHaveBeenCalledWith(null)
  })

  it('FE-STOPKIND-005: the current kind is the pressed one, and it is the only one', () => {
    open({ current: STOP_KINDS[1].key })
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
  })

  it('FE-STOPKIND-006: the way back to a destination appears only once there is one', () => {
    const { onPick } = open({ current: STOP_KINDS[0].key })
    const back = screen.getByRole('button', { name: /destination/i })
    fireEvent.click(back)
    expect(onPick).toHaveBeenCalledWith(null)
  })

  it('FE-STOPKIND-007: on an ordinary place it would say "leave everything as it is", so it is absent', () => {
    open({ current: null })
    expect(screen.queryByRole('button', { name: /destination/i })).not.toBeInTheDocument()
  })

  it('FE-STOPKIND-008: a click outside closes it, a click inside does not', () => {
    const { onClose } = open()

    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    // The anchor is not "outside" either: clicking the number again is what
    // toggles the picker, and closing here would fight that.
    fireEvent.mouseDown(anchor)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-STOPKIND-009: Escape closes it, and so does scrolling the rail underneath', () => {
    const { onClose } = open()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // Following the anchor would mean measuring on every frame for a menu that
    // is open for two seconds; closing is the cheaper honest answer.
    fireEvent.scroll(window)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
