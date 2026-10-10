import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/helpers/render'
import NewVersionNotice from './NewVersionNotice'
import { useServerVersionStore } from '../../store/serverVersionStore'
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode'

const switchToServerVersion = vi.fn(async (_version: string) => {})
vi.mock('../../utils/versionHandover', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/versionHandover')>()),
  switchToServerVersion: (version: string) => switchToServerVersion(version),
}))

// The version the bundle under test is built as (vite define, from package.json).
const BUILT = __TREK_UI_VERSION__
const NEXT = `${BUILT}-next`

beforeEach(() => {
  useServerVersionStore.setState({ first: null, reported: null })
})

/** The page starts on this build's version; then the server reports `version`. */
function deploy(version: string) {
  act(() => {
    useServerVersionStore.getState().note(BUILT)
    useServerVersionStore.getState().note(version)
  })
}

afterEach(() => {
  switchToServerVersion.mockClear()
  sessionStorage.removeItem('trek_app_version_reload')
  _resetNetworkMode()
})

describe('NewVersionNotice', () => {
  it('FE-LAYOUT-NEWVER-001: says nothing before the server reported, or while it runs this very build', () => {
    const { container } = render(<NewVersionNotice />)
    expect(container.querySelector('[role="status"]')).toBeNull()

    act(() => useServerVersionStore.getState().note(BUILT))
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('FE-LAYOUT-NEWVER-002: offers the reload once the server reports a newer build', async () => {
    render(<NewVersionNotice />)
    deploy(NEXT)

    expect(screen.getByRole('status')).toHaveTextContent('A new version is available')
    await userEvent.click(screen.getByRole('button', { name: 'Reload page' }))

    expect(switchToServerVersion).toHaveBeenCalledWith(NEXT)
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
  })

  it('FE-LAYOUT-NEWVER-003: closing it hides that version, and the next release asks again', async () => {
    render(<NewVersionNotice />)
    deploy(NEXT)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('status')).toBeNull()

    act(() => useServerVersionStore.getState().note(`${BUILT}-later`))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(switchToServerVersion).not.toHaveBeenCalled()
  })

  it('FE-LAYOUT-NEWVER-004: stays away offline, where a reload could not fetch the new build', () => {
    setForcedOffline(true)
    render(<NewVersionNotice />)
    deploy(NEXT)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('FE-LAYOUT-NEWVER-005: stays away once this session reloaded for that version without getting it', () => {
    sessionStorage.setItem('trek_app_version_reload', NEXT)
    render(<NewVersionNotice />)
    deploy(NEXT)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('FE-LAYOUT-NEWVER-006: a different version from the start is the launch handover\'s, not the notice\'s', () => {
    // Also an install whose server never reports the bundle's version: no notice every session.
    render(<NewVersionNotice />)
    act(() => useServerVersionStore.getState().note(NEXT))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
