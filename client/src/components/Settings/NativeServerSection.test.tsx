// FE-SETTINGS-NATIVE-SERVER-001 to FE-SETTINGS-NATIVE-SERVER-004
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import NativeServerSection from './NativeServerSection'
import MSettingsServer from '../../mobile/screens/settings/MSettingsServer'
import { nativeServerHost } from '../../native/platform'
import { TrekShell } from '../../native/trekShell'

vi.mock('../../native/platform', () => ({ nativeServerHost: vi.fn() }))
vi.mock('../../native/trekShell', () => ({ TrekShell: { resetServer: vi.fn() } }))

beforeEach(() => {
  vi.mocked(TrekShell.resetServer).mockReset().mockResolvedValue()
})

describe.each([
  ['desktop', NativeServerSection],
  ['mobile', MSettingsServer],
])('the %s server section', (_shell, Section) => {
  it('renders nothing in a browser', () => {
    vi.mocked(nativeServerHost).mockReturnValue(null)
    const { container } = render(<Section />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names the server and leads back to the address screen', () => {
    vi.mocked(nativeServerHost).mockReturnValue('trek.example.com')
    render(<Section />)
    expect(screen.getByText('This app is connected to trek.example.com.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Change server' }))
    expect(TrekShell.resetServer).toHaveBeenCalled()
  })
})
