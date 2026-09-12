import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import VisitControls from './VisitControls'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

it('edits the shared stay without changing the day ending', () => {
  const edit = vi.fn(), toggle = vi.fn(async () => {})
  render(<VisitControls endDay={{ active: false, onToggle: toggle }} stay={{ minutes: 90, onEdit: edit }} />)
  fireEvent.click(screen.getByRole('button', { name: 'roadtrip.stop.stayShort 1 h 30 min' }))
  expect(edit).toHaveBeenCalledOnce()
  expect(toggle).not.toHaveBeenCalled()
})

it('keeps stay editing when daily travel times are off', () => {
  render(<VisitControls stay={{ minutes: null, onEdit: vi.fn() }} />)
  expect(screen.getByRole('button', { name: 'roadtrip.stop.stayShort +' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'roadtrip.window.endHere' })).not.toBeInTheDocument()
})
