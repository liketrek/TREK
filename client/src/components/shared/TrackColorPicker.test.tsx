import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { fireEvent } from '@testing-library/react'
import { resetAllStores } from '../../../tests/helpers/store'
import TrackColorPicker from './TrackColorPicker'

afterEach(() => {
  vi.clearAllMocks()
  resetAllStores()
})

function setup(props: Partial<React.ComponentProps<typeof TrackColorPicker>> = {}) {
  const onChange = vi.fn()
  render(<TrackColorPicker value={null} inheritedColor="#16a34a" onChange={onChange} {...props} />)
  return { onChange }
}

describe('TrackColorPicker (#776)', () => {
  it('FE-COMP-TRACKCOLOR-001: a swatch commits its colour', () => {
    const { onChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: '#059669' }))
    expect(onChange).toHaveBeenCalledWith('#059669')
  })

  it('FE-COMP-TRACKCOLOR-002: the auto cell commits null, not undefined', () => {
    const { onChange } = setup({ value: '#059669' })
    fireEvent.click(screen.getByRole('button', { name: 'Automatic color' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('FE-COMP-TRACKCOLOR-003: the auto cell previews what clearing would give, not the current colour', () => {
    setup({ value: '#e11d48' })
    const auto = screen.getByRole('button', { name: 'Automatic color' })
    // jsdom rewrites the hex to rgb(). #16a34a is the inherited colour; showing
    // the picked #e11d48 here would promise the opposite of what the button does.
    expect(auto.getAttribute('style')).toContain('rgb(22, 163, 74)')
    expect(auto.getAttribute('style')).not.toContain('rgb(225, 29, 72)')
  })

  it('FE-COMP-TRACKCOLOR-004: dragging inside the native picker does not commit', () => {
    const { onChange } = setup()
    const input = document.querySelector('input[type="color"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // React maps onChange on a colour input to the native `input` event, which
    // fires on every drag — each one would be a PUT and a 409 candidate.
    input.value = '#123456'
    fireEvent.input(input)
    expect(onChange).not.toHaveBeenCalled()

    // The native `change` fires once, when the picker closes.
    fireEvent.change(input)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('#123456')
  })
})
