import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../../tests/helpers/render'
import OfflineBanner from './OfflineBanner'

vi.mock('../../sync/mutationQueue', () => ({
  mutationQueue: {
    pendingCount: vi.fn(),
    failedCount: vi.fn(),
  },
}))

import { mutationQueue } from '../../sync/mutationQueue'

const pendingCount = mutationQueue.pendingCount as ReturnType<typeof vi.fn>
const failedCount = mutationQueue.failedCount as ReturnType<typeof vi.fn>

afterEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
})

describe('OfflineBanner (B3 surface)', () => {
  it('shows the failed pill when failedCount > 0 while online', async () => {
    pendingCount.mockResolvedValue(0)
    failedCount.mockResolvedValue(2)

    render(<OfflineBanner />)

    expect(await screen.findByText(/2 changes failed to sync/i)).toBeInTheDocument()
  })

  it('stays hidden when online with nothing pending or failed', async () => {
    pendingCount.mockResolvedValue(0)
    failedCount.mockResolvedValue(0)

    const { container } = render(<OfflineBanner />)
    // Give the async poll a tick to resolve.
    await waitFor(() => expect(failedCount).toHaveBeenCalled())
    expect(container.querySelector('[role="status"]')).toBeNull()
  })
})
