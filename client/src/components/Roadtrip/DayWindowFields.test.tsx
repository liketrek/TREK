import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DayWindowFields from './DayWindowFields'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe('daily travel time settings', () => {
  it('saves a complete custom time and preserves the other time', () => {
    const save = vi.fn()
    render(<DayWindowFields start="08:00" end="18:00" onSave={save} />)
    const start = screen.getByRole('textbox', { name: 'roadtrip.window.start' })
    fireEvent.change(start, { target: { value: '07:00' } })
    expect(save).toHaveBeenCalledWith('roadtrip_day_start', '07:00')
    expect(screen.getByLabelText('roadtrip.window.end')).toHaveValue('18:00')
  })

  it('allows clearing a time to turn automatic planning off', () => {
    const save = vi.fn()
    render(<DayWindowFields start="08:00" end="18:00" onSave={save} />)
    const end = screen.getByLabelText('roadtrip.window.end')
    fireEvent.change(end, { target: { value: '' } })
    fireEvent.blur(end)
    expect(save).toHaveBeenCalledWith('roadtrip_day_end', '')
  })

  it('announces a reversed window and does not offer disabled inputs as editable', () => {
    render(<DayWindowFields start="18:00" end="08:00" />)
    expect(screen.getByRole('alert')).toHaveTextContent('roadtrip.window.invalid')
    expect(screen.getByLabelText('roadtrip.window.start')).toBeDisabled()
    expect(screen.getByLabelText('roadtrip.window.end')).toBeDisabled()
  })
})
