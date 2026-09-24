// FE-NATIVE-HANDOFF-PAGE-001 to FE-NATIVE-HANDOFF-PAGE-004
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../tests/helpers/render'
import NativeHandoffPage from './NativeHandoffPage'
import { useNativeHandoff } from './nativeHandoff/useNativeHandoff'

vi.mock('./nativeHandoff/useNativeHandoff', () => ({ useNativeHandoff: vi.fn() }))

const base = {
  valid: true,
  ready: true,
  userName: 'maria',
  status: 'idle' as const,
  openApp: vi.fn(),
  switchAccount: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useNativeHandoff).mockReturnValue({ ...base })
})

describe('NativeHandoffPage', () => {
  it('FE-NATIVE-HANDOFF-PAGE-001: asks before handing the session to the app', () => {
    render(<NativeHandoffPage />)
    expect(screen.getByText('You are signed in as maria. Open the TREK app to finish signing in there.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open the TREK app' }))
    expect(base.openApp).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Use a different account' }))
    expect(base.switchAccount).toHaveBeenCalled()
  })

  it('FE-NATIVE-HANDOFF-PAGE-002: shows the failure and keeps the button while sending disabled', () => {
    vi.mocked(useNativeHandoff).mockReturnValue({ ...base, status: 'failed' })
    const { rerender } = render(<NativeHandoffPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('Signing in did not work. Please try again.')

    vi.mocked(useNativeHandoff).mockReturnValue({ ...base, status: 'sending' })
    rerender(<NativeHandoffPage />)
    expect(screen.getByRole('button', { name: 'Open the TREK app' })).toBeDisabled()
  })

  it('FE-NATIVE-HANDOFF-PAGE-003: spins while the session is being checked', () => {
    vi.mocked(useNativeHandoff).mockReturnValue({ ...base, ready: false })
    render(<NativeHandoffPage />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('FE-NATIVE-HANDOFF-PAGE-004: says so when the link is broken', () => {
    vi.mocked(useNativeHandoff).mockReturnValue({ ...base, valid: false, ready: false })
    render(<NativeHandoffPage />)
    expect(screen.getByText('Signing in did not work. Please try again.')).toBeInTheDocument()
  })
})
