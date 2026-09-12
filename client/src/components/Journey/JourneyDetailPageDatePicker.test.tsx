// FE-COMP-JOURNEYDATEPICKER-001 to FE-COMP-JOURNEYDATEPICKER-006
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { DatePicker } from './JourneyDetailPageDatePicker'

function open(value = '2026-09-11') {
  const onChange = vi.fn()
  render(<DatePicker value={value} onChange={onChange} />)
  return { onChange }
}

const header = () => screen.getByRole('button', { name: /select month|select year|\d{4} – \d{4}/i })
const prev = (name: RegExp) => screen.getByRole('button', { name })

describe('DatePicker year navigation (#2318)', () => {
  it('FE-COMP-JOURNEYDATEPICKER-001: opens on the month of the value with weekday headers', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByText(/Sep 11, 2026/))
    expect(screen.getByText('Mo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select month' })).toHaveTextContent('September 2026')
  })

  it('FE-COMP-JOURNEYDATEPICKER-002: the header climbs to the months, then to the years', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByText(/Sep 11, 2026/))

    await user.click(screen.getByRole('button', { name: 'Select month' }))
    expect(screen.queryByText('Mo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select year' })).toHaveTextContent('2026')

    await user.click(screen.getByRole('button', { name: 'Select year' }))
    expect(screen.getByRole('button', { name: '2016' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2027' })).toBeInTheDocument()
    expect(header()).toHaveTextContent('2016 – 2027')
  })

  it('FE-COMP-JOURNEYDATEPICKER-003: picking a year three back lands on that year in one move', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByText(/Sep 11, 2026/))
    await user.click(screen.getByRole('button', { name: 'Select month' }))
    await user.click(screen.getByRole('button', { name: 'Select year' }))
    await user.click(screen.getByRole('button', { name: '2023' }))

    // Back on the months, of the chosen year.
    expect(screen.getByRole('button', { name: 'Select year' })).toHaveTextContent('2023')
    await user.click(screen.getByRole('button', { name: 'Mar' }))
    expect(screen.getByRole('button', { name: 'Select month' })).toHaveTextContent('March 2023')
    expect(screen.getByText('Mo')).toBeInTheDocument()
  })

  it('FE-COMP-JOURNEYDATEPICKER-004: the arrows step the level they are on', async () => {
    const user = userEvent.setup()
    open()
    await user.click(screen.getByText(/Sep 11, 2026/))

    await user.click(prev(/previous month/i))
    expect(screen.getByRole('button', { name: 'Select month' })).toHaveTextContent('August 2026')

    await user.click(screen.getByRole('button', { name: 'Select month' }))
    await user.click(prev(/previous year/i))
    expect(screen.getByRole('button', { name: 'Select year' })).toHaveTextContent('2025')

    await user.click(screen.getByRole('button', { name: 'Select year' }))
    await user.click(prev(/previous years/i))
    expect(header()).toHaveTextContent('2004 – 2015')
    await user.click(screen.getByRole('button', { name: /next years/i }))
    expect(header()).toHaveTextContent('2016 – 2027')
  })

  it('FE-COMP-JOURNEYDATEPICKER-005: a day picked after the jump is handed back as ISO', async () => {
    const user = userEvent.setup()
    const { onChange } = open()
    await user.click(screen.getByText(/Sep 11, 2026/))
    await user.click(screen.getByRole('button', { name: 'Select month' }))
    await user.click(screen.getByRole('button', { name: 'Select year' }))
    await user.click(screen.getByRole('button', { name: '2023' }))
    await user.click(screen.getByRole('button', { name: 'Mar' }))
    await user.click(screen.getByRole('button', { name: '15' }))
    expect(onChange).toHaveBeenCalledWith('2023-03-15')
    expect(screen.queryByText('Mo')).not.toBeInTheDocument()
  })

  it('FE-COMP-JOURNEYDATEPICKER-006: reopening starts on the days again', async () => {
    const user = userEvent.setup()
    open()
    const trigger = screen.getByText(/Sep 11, 2026/)
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Select month' }))
    await user.click(screen.getByRole('button', { name: 'Select year' }))
    await user.click(trigger)
    expect(screen.queryByRole('button', { name: '2023' })).not.toBeInTheDocument()
    await user.click(trigger)
    expect(screen.getByText('Mo')).toBeInTheDocument()
  })
})
