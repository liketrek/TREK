import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { toastHaptic } from './haptics'
import { isNativeApp } from './platform'

vi.mock('@capacitor/haptics', () => ({
  Haptics: { notification: vi.fn() },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}))
vi.mock('./platform', () => ({ isNativeApp: vi.fn() }))

beforeEach(() => {
  vi.mocked(Haptics.notification).mockReset().mockResolvedValue()
  vi.mocked(isNativeApp).mockReturnValue(true)
})

describe('toastHaptic', () => {
  it('taps for success, warning and error toasts in the app', () => {
    toastHaptic('success')
    toastHaptic('warning')
    toastHaptic('error')
    expect(vi.mocked(Haptics.notification).mock.calls.map(([o]) => o.type)).toEqual([
      NotificationType.Success, NotificationType.Warning, NotificationType.Error,
    ])
  })

  it('stays still for info toasts and in a browser', () => {
    toastHaptic('info')
    vi.mocked(isNativeApp).mockReturnValue(false)
    toastHaptic('success')
    expect(Haptics.notification).not.toHaveBeenCalled()
  })

  it('does not let a missing vibrator surface as an error', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.mocked(Haptics.notification).mockRejectedValue(new Error('not available'))
    toastHaptic('error')
    await vi.waitFor(() => expect(debug).toHaveBeenCalledWith('[haptics]', expect.any(Error)))
  })
})
