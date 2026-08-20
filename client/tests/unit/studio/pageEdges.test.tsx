import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '../../helpers/render'
import { TrimField } from '../../../src/components/Studio/TrimField'
import { PAGE_MAX_MM, PAGE_MIN_MM } from '../../../src/components/Studio/pagePresets'

/**
 * The bleed and the safe margin, which the press decides and not us (#1973).
 *
 * Both were hard-coded into every page preset at the values a photo-book vendor
 * most often asks for, 3mm and 5mm, and neither had a control anywhere. That is
 * fine until a printer asks for 5 and 10, at which point the book cannot be made
 * here at all — the export would carry the wrong bleed to the press and the
 * crop marks would sit in the wrong place, which is the kind of mistake nobody
 * finds until the guillotine has already run.
 *
 * They share the trim size's field, which is right — they are millimetres of
 * the same kind — but that field's floor was the smallest page a book may be.
 * A 3mm bleed against a 60mm floor is untypeable, so the range had to become a
 * property of the measurement rather than of the control. That is what these
 * cases pin.
 */

describe('a measurement field', () => {
  it('still keeps the page inside what a press takes, by default', () => {
    const onCommit = vi.fn()
    render(<TrimField label="W" value={210} onCommit={onCommit} />)
    const input = screen.getByRole('spinbutton')
    expect(input.getAttribute('min')).toBe(String(PAGE_MIN_MM))
    expect(input.getAttribute('max')).toBe(String(PAGE_MAX_MM))
  })

  it('takes a range of its own, so a 3mm bleed can be typed at all', () => {
    const onCommit = vi.fn()
    render(<TrimField label="Bleed" value={3} min={0} max={20} step={0.5} onCommit={onCommit} />)
    const input = screen.getByRole('spinbutton')
    expect(input.getAttribute('min')).toBe('0')
    expect(input.getAttribute('max')).toBe('20')

    fireEvent.change(input, { target: { value: '5' } })
    expect(onCommit).toHaveBeenCalledWith(5)
  })

  /*
   * The reason the field holds a draft at all: on the page size, typing "500"
   * used to be seen as "5", clamped to the floor and written back under the
   * cursor. The same trap applies to a bleed typed as "10".
   */
  it('lets a number be typed through a value it would otherwise refuse', () => {
    const onCommit = vi.fn()
    render(<TrimField label="Bleed" value={3} min={2} max={20} onCommit={onCommit} />)
    const input = screen.getByRole('spinbutton')

    fireEvent.change(input, { target: { value: '1' } })
    expect(onCommit).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '10' } })
    expect(onCommit).toHaveBeenCalledWith(10)
  })

  it('commits what is there when the field is left', () => {
    const onCommit = vi.fn()
    render(<TrimField label="Bleed" value={3} min={0} max={20} onCommit={onCommit} />)
    const input = screen.getByRole('spinbutton')

    fireEvent.change(input, { target: { value: '7.5' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenLastCalledWith(7.5)
  })
})
