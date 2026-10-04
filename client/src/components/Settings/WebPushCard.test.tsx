/**
 * FE-COMP-WEBPUSHCARD-001 to FE-COMP-WEBPUSHCARD-004: the desktop device card.
 *
 * Markup only: `useWebPush` is mocked and has its own spec, so these cases pin
 * what each hook state puts on screen and that the buttons reach the hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../../tests/helpers/render'
import type { WebPushCardState } from '../../hooks/useWebPush'
import WebPushCard from './WebPushCard'

const hookState = vi.hoisted(() => ({ current: null as unknown as WebPushCardState }))
vi.mock('../../hooks/useWebPush', () => ({ useWebPush: () => hookState.current }))

function state(over: Partial<WebPushCardState> = {}): WebPushCardState {
  return {
    state: 'off',
    stateText: null,
    canSwitch: true,
    on: false,
    switchLabel: 'Turn on for this device',
    busy: false,
    canTest: false,
    toggle: vi.fn(),
    sendTest: vi.fn(),
    ...over,
  }
}

beforeEach(() => {
  hookState.current = state()
})

describe('WebPushCard', () => {
  it('FE-COMP-WEBPUSHCARD-001: explains itself and offers to switch on', async () => {
    render(<WebPushCard />)
    expect(screen.getByText('Push notifications on this device')).toBeInTheDocument()
    expect(screen.getByText(/Shows TREK notifications on this device/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    const turnOn = screen.getByRole('button', { name: 'Turn on for this device' })
    expect(turnOn.className).toContain('bg-accent')
    expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled()

    await userEvent.click(turnOn)
    expect(hookState.current.toggle).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-WEBPUSHCARD-002: when on, says so, offers to switch off and to test', async () => {
    hookState.current = state({ state: 'on', on: true, stateText: 'On for this device', switchLabel: 'Turn off for this device', canTest: true })
    render(<WebPushCard />)
    expect(screen.getByRole('status')).toHaveTextContent('On for this device')
    expect(screen.getByRole('button', { name: 'Turn off for this device' }).className).not.toContain('bg-accent')

    await userEvent.click(screen.getByRole('button', { name: 'Send test' }))
    expect(hookState.current.sendTest).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-WEBPUSHCARD-003: a state that cannot be switched shows its sentence and no buttons', () => {
    hookState.current = state({ state: 'ios-install', canSwitch: false, stateText: 'Add TREK to the Home Screen first.' })
    render(<WebPushCard />)
    expect(screen.getByRole('status')).toHaveTextContent('Add TREK to the Home Screen first.')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('FE-COMP-WEBPUSHCARD-004: the switch is disabled while busy', () => {
    hookState.current = state({ busy: true })
    render(<WebPushCard />)
    expect(screen.getByRole('button', { name: 'Turn on for this device' })).toBeDisabled()
  })
})
