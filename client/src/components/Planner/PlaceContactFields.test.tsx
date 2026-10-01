// FE-PLANNER-CONTACT-001 to FE-PLANNER-CONTACT-002
import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../../tests/helpers/render'
import { PlaceContactFields } from './PlaceContactFields'
import type { PlaceOpeningHours } from '@trek/shared'

function Harness({ onChange, start = '', suggested }: { onChange: (field: string, value: string) => void; start?: string; suggested?: PlaceOpeningHours | null }) {
  const [state, setState] = useState({ phone: '', email: '', opening_hours: start })
  return (
    <PlaceContactFields phone={state.phone} email={state.email} openingHours={state.opening_hours} suggestedHours={suggested}
      onChange={(field, value) => { onChange(field, value); setState(s => ({ ...s, [field]: value })) }} />
  )
}

describe('PlaceContactFields (#2472)', () => {
  it('FE-PLANNER-CONTACT-001: phone and e-mail are plain fields', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.type(screen.getByLabelText('Phone'), '+1 555')
    await user.type(screen.getByLabelText('E-mail'), 'a@b.co')
    expect(onChange).toHaveBeenLastCalledWith('email', 'a@b.co')
    expect(screen.getByLabelText('Phone')).toHaveValue('+1 555')
  })

  it('FE-PLANNER-CONTACT-002: the hours unfold from one row, close a day, copy Monday, and fold away again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    expect(screen.queryByRole('switch', { name: 'Monday: Closed' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add opening hours' }))

    await user.click(screen.getByRole('switch', { name: 'Monday: Closed' }))
    let stored = JSON.parse(onChange.mock.lastCall![1])
    expect(stored[0]).toEqual({ closed: true })

    await user.click(screen.getByRole('button', { name: "Use Monday's hours for every day" }))
    stored = JSON.parse(onChange.mock.lastCall![1])
    expect(stored.every((d: { closed: boolean }) => d.closed)).toBe(true)
    expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(7)

    await user.click(screen.getByRole('button', { name: 'Remove opening hours' }))
    expect(onChange).toHaveBeenLastCalledWith('opening_hours', '')
    expect(screen.getByRole('button', { name: 'Add opening hours' })).toBeInTheDocument()
  })

  it('FE-PLANNER-CONTACT-003: a time can be typed key by key without the field resetting', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Add opening hours' }))
    const opens = screen.getAllByRole('textbox', { name: /Monday opens/ })
    await user.type(opens[0], '0930')
    expect(opens[0]).toHaveValue('09:30')
    expect(JSON.parse(onChange.mock.lastCall![1])[0]).toEqual({ closed: false, open: '09:30' })
  })

  it('FE-PLANNER-CONTACT-004: looked-up hours fill an empty place, and an edited one offers to take them over', async () => {
    const user = userEvent.setup()
    const looked: PlaceOpeningHours = [{ closed: false, open: '10:00', close: '16:00' }, ...Array.from({ length: 6 }, () => ({ closed: true }))]
    const onChange = vi.fn()
    const { unmount } = render(<Harness onChange={onChange} suggested={looked} />)
    expect(JSON.parse(onChange.mock.lastCall![1])).toEqual(looked)
    expect(screen.queryByRole('button', { name: 'Take over from the place details' })).toBeNull()
    unmount()

    onChange.mockClear()
    const own = JSON.stringify([{ closed: false, open: '08:00', close: '09:00' }, ...Array.from({ length: 6 }, () => ({ closed: false }))])
    render(<Harness onChange={onChange} start={own} suggested={looked} />)
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Take over from the place details' }))
    expect(JSON.parse(onChange.mock.lastCall![1])).toEqual(looked)
  })
})

