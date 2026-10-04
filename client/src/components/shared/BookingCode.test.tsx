// FE-COMP-BOOKCODE-001 to FE-COMP-BOOKCODE-014
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { isBlurred } from '../../../tests/helpers/bookingCodeBlur'
import { useBlurBookingCodes } from '../../hooks/useBlurBookingCodes'
import { BlurredCode, BookingCodeInput } from './BookingCode'

const blurOn = (on: boolean) => seedStore(useSettingsStore, { settings: { blur_booking_codes: on } })

function Field({ initial = 'PNR-1', ...rest }: { initial?: string; onFocus?: () => void; onBlur?: () => void; className?: string }) {
  const [v, setV] = useState(initial)
  return <BookingCodeInput value={v} onChange={e => setV(e.target.value)} placeholder="ABC-12345" aria-label="code" {...rest} />
}

describe('useBlurBookingCodes', () => {
  beforeEach(() => resetAllStores())

  it('FE-COMP-BOOKCODE-001: follows the setting and reads an unset one as off', () => {
    seedStore(useSettingsStore, { settings: { blur_booking_codes: undefined } })
    const { result } = renderHook(() => useBlurBookingCodes())
    expect(result.current).toBe(false)
    act(() => blurOn(true))
    expect(result.current).toBe(true)
  })
})

describe('BookingCodeInput', () => {
  beforeEach(() => resetAllStores())

  it('FE-COMP-BOOKCODE-002: with the setting off the field is a plain text input with the caller classes only', () => {
    blurOn(false)
    render(<Field className="w-full border" />)
    const field = screen.getByLabelText('code') as HTMLInputElement
    expect(field.type).toBe('text')
    expect(field.className).toBe('w-full border')
    expect(isBlurred(field)).toBe(false)
  })

  it('FE-COMP-BOOKCODE-003: without caller classes and the setting off it adds no class attribute at all', () => {
    blurOn(false)
    render(<Field />)
    expect(screen.getByLabelText('code').hasAttribute('class')).toBe(false)
  })

  it('FE-COMP-BOOKCODE-004: with the setting on a filled field is blurred and keeps the caller classes', () => {
    blurOn(true)
    render(<Field className="w-full border" />)
    const field = screen.getByLabelText('code') as HTMLInputElement
    expect(field.value).toBe('PNR-1')
    expect(field.className.startsWith('w-full border ')).toBe(true)
    expect(isBlurred(field)).toBe(true)
  })

  it('FE-COMP-BOOKCODE-005: focus lifts the blur and leaving the field brings it back', () => {
    blurOn(true)
    render(<Field />)
    const field = screen.getByLabelText('code') as HTMLInputElement
    act(() => field.focus())
    expect(isBlurred(field)).toBe(false)
    act(() => field.blur())
    expect(isBlurred(field)).toBe(true)
  })

  it('FE-COMP-BOOKCODE-006: an empty field is never blurred, so its placeholder stays readable', () => {
    blurOn(true)
    render(<Field initial="" />)
    expect(isBlurred(screen.getByPlaceholderText('ABC-12345'))).toBe(false)
  })

  it('FE-COMP-BOOKCODE-007: what is typed into a blurred field is the value, and the caller focus handlers still run', async () => {
    blurOn(true)
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(<Field onFocus={onFocus} onBlur={onBlur} />)
    const field = screen.getByLabelText('code') as HTMLInputElement
    await userEvent.clear(field)
    await userEvent.type(field, 'NEW-2')
    expect(field.value).toBe('NEW-2')
    expect(onFocus).toHaveBeenCalled()
    act(() => field.blur())
    expect(onBlur).toHaveBeenCalled()
    expect(isBlurred(field)).toBe(true)
  })

  it('FE-COMP-BOOKCODE-008: the ref reaches the input element', () => {
    blurOn(true)
    const ref = createRef<HTMLInputElement>()
    render(<BookingCodeInput ref={ref} value="X" onChange={() => {}} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.value).toBe('X')
  })
})

describe('BlurredCode', () => {
  beforeEach(() => resetAllStores())

  it('FE-COMP-BOOKCODE-009: with the setting off it renders the bare code and no element around it', () => {
    blurOn(false)
    const { container } = render(<div data-testid="host"><BlurredCode>ABC999</BlurredCode></div>)
    expect(screen.getByTestId('host').innerHTML).toBe('ABC999')
    expect(container.querySelector('button')).toBeNull()
  })

  it('FE-COMP-BOOKCODE-010: with the setting on the code is a blurred toggle that a click reveals and hides again', () => {
    blurOn(true)
    render(<BlurredCode>ABC999</BlurredCode>)
    const code = screen.getByRole('button', { name: 'ABC999' })
    expect(code).toHaveAttribute('aria-pressed', 'false')
    expect(isBlurred(code)).toBe(true)
    fireEvent.click(code)
    expect(code).toHaveAttribute('aria-pressed', 'true')
    expect(isBlurred(code)).toBe(false)
    fireEvent.click(code)
    expect(isBlurred(code)).toBe(true)
  })

  it('FE-COMP-BOOKCODE-011: revealing the code does not also trigger the clickable strip around it', () => {
    blurOn(true)
    const onRowClick = vi.fn()
    render(<div role="button" aria-label="Open booking" tabIndex={0} onClick={onRowClick}><BlurredCode>ABC999</BlurredCode></div>)
    fireEvent.click(screen.getByRole('button', { name: 'ABC999' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('FE-COMP-BOOKCODE-012: Enter and Space stay with the code, other keys still reach the strip', () => {
    blurOn(true)
    const onRowKey = vi.fn()
    render(<div role="button" aria-label="Open booking" tabIndex={0} onKeyDown={e => onRowKey(e.key)}><BlurredCode>ABC999</BlurredCode></div>)
    const code = screen.getByRole('button', { name: 'ABC999' })
    fireEvent.keyDown(code, { key: 'Enter' })
    fireEvent.keyDown(code, { key: ' ' })
    expect(onRowKey).not.toHaveBeenCalled()
    fireEvent.keyDown(code, { key: 'Escape' })
    expect(onRowKey).toHaveBeenCalledWith('Escape')
  })

  it('FE-COMP-BOOKCODE-013: the non-interactive variant is a blurred span with the caller classes, not a button', () => {
    blurOn(true)
    render(<button type="button"><BlurredCode interactive={false} className="font-geist">#X9</BlurredCode></button>)
    const code = screen.getByText('#X9')
    expect(code.tagName).toBe('SPAN')
    expect(code.className.startsWith('font-geist ')).toBe(true)
    expect(isBlurred(code)).toBe(true)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('FE-COMP-BOOKCODE-014: the non-interactive variant is bare text as well once the setting is off', () => {
    blurOn(false)
    render(<span data-testid="host">Confirmed · <BlurredCode interactive={false}>#X9</BlurredCode></span>)
    expect(screen.getByTestId('host').innerHTML).toBe('Confirmed · #X9')
  })
})
