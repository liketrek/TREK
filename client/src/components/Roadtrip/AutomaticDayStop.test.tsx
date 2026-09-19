import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AutomaticDayStop from './AutomaticDayStop'
import type { RoadtripStop } from './useRoadtripRoutes'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe('automatic pause row', () => {
  it('offers map focus and a custom hover without a native tooltip', async () => {
    const focus = vi.fn()
    render(<AutomaticDayStop
      stop={{ lat: 3, lng: 4, automaticNight: { phase: 'end', fromDayNumber: 1 } } as RoadtripStop}
      entry={{ arrival: '18:00', departure: '18:00', anchored: false, dayOffset: 0 }}
      onFocus={focus}
    />)
    expect(screen.getByText('18:00')).toBeInTheDocument()
    expect(screen.queryByText('roadtrip.window.pointHint')).not.toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('roadtrip.window.stop 18:00')
    expect(buttons[0]).not.toHaveAttribute('title')
    fireEvent.mouseEnter(buttons[0])
    expect(await screen.findByRole('tooltip')).toHaveTextContent('roadtrip.window.pointHint')
    fireEvent.click(screen.getByText('18:00'))
    expect(focus).toHaveBeenCalledWith(3, 4)
  })

  it('shows the next departure when a visit continues after the pause', () => {
    render(<AutomaticDayStop
      stop={{ automaticNight: { phase: 'start', fromDayNumber: 1 } } as RoadtripStop}
      entry={{ arrival: '08:00', departure: '09:00', anchored: false, dayOffset: 0 }}
    />)
    expect(screen.getByText('roadtrip.window.resume')).toBeInTheDocument()
    expect(screen.getByLabelText('roadtrip.window.departure')).toHaveTextContent('09:00')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
