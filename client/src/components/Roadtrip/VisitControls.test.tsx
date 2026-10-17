import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import VisitControls from './VisitControls'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

it('edits the shared stay without changing the day ending', () => {
  const edit = vi.fn(), toggle = vi.fn(async () => {})
  render(<VisitControls endDay={{ active: false, onToggle: toggle }} stay={{ minutes: 90, onEdit: edit }} />)
  // The caption is the section's eyebrow now, so the button reads the figure alone.
  expect(screen.getByText('roadtrip.stop.stayShort')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '1 h 30 min' }))
  expect(edit).toHaveBeenCalledOnce()
  expect(toggle).not.toHaveBeenCalled()
})

it('keeps stay editing when daily travel times are off', () => {
  render(<VisitControls stay={{ minutes: null, onEdit: vi.fn() }} />)
  expect(screen.getByRole('button', { name: '+' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'roadtrip.window.endHere' })).not.toBeInTheDocument()
})

it('reads the stay a set leave time makes, and says until when', () => {
  render(<VisitControls stay={{ minutes: 240, until: '14:00', onEdit: vi.fn() }} />)
  expect(screen.getByRole('button', { name: /^4 h\s*roadtrip\.stay\.until$/ })).toBeEnabled()
})

it('says only until when while the drive has not timed the arrival', () => {
  render(<VisitControls stay={{ minutes: null, until: '14:00' }} />)
  expect(screen.getByRole('button', { name: 'roadtrip.stay.until' })).toBeDisabled()
  expect(screen.queryByText('+')).not.toBeInTheDocument()
})
