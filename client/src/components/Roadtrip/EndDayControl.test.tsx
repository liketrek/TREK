import { fireEvent, render, screen, act } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import EndDayControl from './EndDayControl'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

it('shows the saved state and blocks a second click while saving', async () => {
  let finish!: () => void
  const onToggle = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
  render(<EndDayControl active onToggle={onToggle} />)
  const toggle = screen.getByRole('button', { name: 'roadtrip.window.endHere' })
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(toggle)
  expect(toggle).toBeDisabled()
  fireEvent.click(toggle)
  expect(onToggle).toHaveBeenCalledTimes(1)
  await act(async () => finish())
  expect(toggle).toBeEnabled()
})
