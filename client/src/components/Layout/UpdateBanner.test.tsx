import userEvent from '@testing-library/user-event'
import { render, screen } from '../../../tests/helpers/render'
import UpdateBanner from './UpdateBanner'

const pwa = vi.hoisted(() => ({
  needRefresh: false,
  updateServiceWorker: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}))

vi.mock('../../pwaRegistration', () => ({
  useRegisterSW: () => ({
    needRefresh: [pwa.needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: pwa.updateServiceWorker,
  }),
}))

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'common.updateAvailable': 'A new version of TREK is available.',
      'common.reload': 'Reload',
    })[key] ?? key,
  }),
}))

describe('UpdateBanner', () => {
  beforeEach(() => {
    pwa.needRefresh = false
    pwa.updateServiceWorker.mockClear()
  })

  it('FE-COMP-UPDATE-001: stays hidden when no service worker is waiting', () => {
    render(<UpdateBanner />)
    expect(screen.queryByText('A new version of TREK is available.')).not.toBeInTheDocument()
  })

  it('FE-COMP-UPDATE-002: shows a persistent reload prompt for a waiting worker', () => {
    pwa.needRefresh = true
    render(<UpdateBanner />)
    expect(screen.getByRole('status')).toHaveTextContent('A new version of TREK is available.')
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  it('FE-COMP-UPDATE-003: activates the waiting worker only after user confirmation', async () => {
    pwa.needRefresh = true
    const user = userEvent.setup()
    render(<UpdateBanner />)

    expect(pwa.updateServiceWorker).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Reload' }))
    expect(pwa.updateServiceWorker).toHaveBeenCalledOnce()
    expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
