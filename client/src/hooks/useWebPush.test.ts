/**
 * FE-WEBPUSH-HOOK-001 to FE-WEBPUSH-HOOK-015: the one hook behind the desktop
 * and phone "Push notifications on this device" cards.
 *
 * The browser glue (`push/webPush.ts`) has its own spec against a fake browser
 * and is mocked here, so these cases are about what the card does with it:
 *
 *  1. **Every state has its sentence.** Unsupported, insecure, "install first",
 *     blocked and on each read differently, and "off" adds nothing to the hint.
 *  2. **The gesture.** The key and the registration are fetched on mount, so
 *     the click can hand them straight to `enableWebPush` in the same tick.
 *  3. **The browser is re-read** after every switch and when the page becomes
 *     visible again, so the card never shows a state of its own invention.
 *  4. **Toasts only for real failures.** A block or a dismissed prompt is the
 *     user's answer, not an error.
 *
 * Translation is the real provider, so the sentences asserted are the shipped
 * English.
 */
import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TranslationProvider } from '../i18n/TranslationContext'
import { WebPushError, type WebPushDeviceState } from '../push/webPush'
import { useWebPush } from './useWebPush'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('../components/shared/Toast', () => ({ useToast: () => toast, default: () => toast }))

const push = vi.hoisted(() => ({
  readWebPushDeviceState: vi.fn(),
  getWebPushSupport: vi.fn(),
  loadPushPublicKey: vi.fn(),
  waitForPushRegistration: vi.fn(),
  enableWebPush: vi.fn(),
  disableWebPush: vi.fn(),
}))
vi.mock('../push/webPush', async importOriginal => {
  const actual = await importOriginal<typeof import('../push/webPush')>()
  return { ...actual, ...push }
})

const testChannel = vi.hoisted(() => vi.fn())
vi.mock('../api/client', () => ({ notificationsApi: { testChannel } }))

const REGISTRATION = { scope: '/' } as unknown as ServiceWorkerRegistration

const EN = {
  on: 'On for this device',
  enable: 'Turn on for this device',
  disable: 'Turn off for this device',
  unsupported: 'This browser cannot receive push notifications.',
  insecure: 'Push needs TREK to be opened over HTTPS.',
  iosInstall: 'On iPhone and iPad, add TREK to the Home Screen first and open it from there.',
  denied: 'Notifications are blocked for TREK in this browser. Allow them in the browser settings, then try again.',
  failed: 'Push could not be turned on for this device.',
  testSuccess: 'Test notification sent.',
  testFailed: 'Test failed.',
}

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

async function mounted(state: WebPushDeviceState) {
  push.readWebPushDeviceState.mockResolvedValue(state)
  const hook = renderHook(() => useWebPush(), { wrapper })
  await waitFor(() => expect(hook.result.current.state).toBe(state))
  return hook
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
  push.getWebPushSupport.mockReturnValue({ supported: true, reason: null })
  push.loadPushPublicKey.mockResolvedValue('BAECAwQ')
  push.waitForPushRegistration.mockResolvedValue(REGISTRATION)
  push.enableWebPush.mockResolvedValue(undefined)
  push.disableWebPush.mockResolvedValue(undefined)
  testChannel.mockResolvedValue({ success: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWebPush: what the card says', () => {
  it('FE-WEBPUSH-HOOK-001: nothing is claimed before the device has been read', () => {
    push.readWebPushDeviceState.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useWebPush(), { wrapper })
    expect(result.current.state).toBeNull()
    expect(result.current.stateText).toBeNull()
    expect(result.current.canSwitch).toBe(false)
    expect(result.current.canTest).toBe(false)
  })

  it.each([
    ['unsupported', EN.unsupported],
    ['insecure', EN.insecure],
    ['ios-install', EN.iosInstall],
    ['denied', EN.denied],
  ] as const)('FE-WEBPUSH-HOOK-002: %s has its own sentence and no switch', async (state, text) => {
    const { result } = await mounted(state)
    expect(result.current.stateText).toBe(text)
    expect(result.current.canSwitch).toBe(false)
    expect(result.current.canTest).toBe(false)
  })

  it('FE-WEBPUSH-HOOK-003: off offers to switch on and adds no sentence', async () => {
    const { result } = await mounted('off')
    expect(result.current.stateText).toBeNull()
    expect(result.current.canSwitch).toBe(true)
    expect(result.current.on).toBe(false)
    expect(result.current.switchLabel).toBe(EN.enable)
    expect(result.current.canTest).toBe(false)
  })

  it('FE-WEBPUSH-HOOK-004: on says so, offers to switch off and allows a test', async () => {
    const { result } = await mounted('on')
    expect(result.current.stateText).toBe(EN.on)
    expect(result.current.on).toBe(true)
    expect(result.current.switchLabel).toBe(EN.disable)
    expect(result.current.canTest).toBe(true)
  })
})

describe('useWebPush: ahead of the click', () => {
  it('FE-WEBPUSH-HOOK-005: fetches the key and the registration on mount where push is supported', async () => {
    await mounted('off')
    expect(push.loadPushPublicKey).toHaveBeenCalledTimes(1)
    expect(push.waitForPushRegistration).toHaveBeenCalledTimes(1)
  })

  it('FE-WEBPUSH-HOOK-006: fetches neither where push cannot work', async () => {
    push.getWebPushSupport.mockReturnValue({ supported: false, reason: 'insecure' })
    await mounted('insecure')
    expect(push.loadPushPublicKey).not.toHaveBeenCalled()
    expect(push.waitForPushRegistration).not.toHaveBeenCalled()
  })
})

describe('useWebPush: switching', () => {
  it('FE-WEBPUSH-HOOK-007: switching on hands the prefetched key and registration over in the same tick', async () => {
    const hook = await mounted('off')
    await waitFor(() => expect(push.waitForPushRegistration).toHaveBeenCalled())
    await act(async () => {})
    const pending = deferred<void>()
    push.enableWebPush.mockReturnValueOnce(pending.promise)

    act(() => hook.result.current.toggle())
    expect(push.enableWebPush).toHaveBeenCalledWith('BAECAwQ', REGISTRATION)
    expect(hook.result.current.busy).toBe(true)

    push.readWebPushDeviceState.mockResolvedValue('on')
    await act(async () => pending.resolve())
    await waitFor(() => expect(hook.result.current.state).toBe('on'))
    expect(hook.result.current.busy).toBe(false)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-WEBPUSH-HOOK-008: without a prefetched key it fetches one first, and fails cleanly without', async () => {
    push.loadPushPublicKey.mockResolvedValueOnce(null).mockResolvedValueOnce('LATEKEY')
    const hook = await mounted('off')
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(push.enableWebPush).toHaveBeenCalledWith('LATEKEY', REGISTRATION))

    push.loadPushPublicKey.mockResolvedValueOnce(null)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await waitFor(() => expect(hook.result.current.busy).toBe(false))
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(EN.failed))
  })

  it('FE-WEBPUSH-HOOK-009: a block or a dismissed prompt is an answer, not an error', async () => {
    const hook = await mounted('off')
    push.enableWebPush.mockRejectedValueOnce(new WebPushError('dismissed'))
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(hook.result.current.busy).toBe(false))

    push.enableWebPush.mockRejectedValueOnce(new WebPushError('denied'))
    push.readWebPushDeviceState.mockResolvedValue('denied')
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(hook.result.current.state).toBe('denied'))
    expect(hook.result.current.stateText).toBe(EN.denied)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-WEBPUSH-HOOK-010: a failure to switch on is toasted and the device read again', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hook = await mounted('off')
    push.enableWebPush.mockRejectedValueOnce(new WebPushError('failed'))
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(EN.failed))
    expect(push.readWebPushDeviceState).toHaveBeenCalledTimes(2)
  })

  it('FE-WEBPUSH-HOOK-011: switching off goes through disableWebPush', async () => {
    const hook = await mounted('on')
    push.readWebPushDeviceState.mockResolvedValue('off')
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(hook.result.current.state).toBe('off'))
    expect(push.disableWebPush).toHaveBeenCalledTimes(1)
    expect(push.enableWebPush).not.toHaveBeenCalled()
  })

  it('FE-WEBPUSH-HOOK-012: a browser that refuses to unsubscribe is toasted and stays on', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hook = await mounted('on')
    push.disableWebPush.mockRejectedValueOnce(new Error('refused'))
    await act(async () => hook.result.current.toggle())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error'))
    await waitFor(() => expect(hook.result.current.busy).toBe(false))
    expect(hook.result.current.state).toBe('on')
  })

  it('FE-WEBPUSH-HOOK-013: a second click while busy, or with nothing to switch, does nothing', async () => {
    const hook = await mounted('off')
    push.enableWebPush.mockReturnValueOnce(new Promise(() => {}))
    act(() => hook.result.current.toggle())
    act(() => hook.result.current.toggle())
    expect(push.enableWebPush).toHaveBeenCalledTimes(1)

    const denied = await mounted('denied')
    act(() => denied.result.current.toggle())
    expect(push.enableWebPush).toHaveBeenCalledTimes(1)
    expect(push.disableWebPush).not.toHaveBeenCalled()
  })
})

describe('useWebPush: the rest', () => {
  it('FE-WEBPUSH-HOOK-014: the test goes through the generic channel route', async () => {
    const hook = await mounted('on')
    const pending = deferred<{ success: boolean; error?: string }>()
    testChannel.mockReturnValueOnce(pending.promise)
    act(() => hook.result.current.sendTest())
    expect(testChannel).toHaveBeenCalledWith('push')
    expect(hook.result.current.canTest).toBe(false)
    act(() => hook.result.current.sendTest())
    expect(testChannel).toHaveBeenCalledTimes(1)
    await act(async () => pending.resolve({ success: true }))
    expect(toast.success).toHaveBeenCalledWith(EN.testSuccess)
    expect(hook.result.current.canTest).toBe(true)

    testChannel.mockResolvedValueOnce({ success: false, error: 'No devices' })
    await act(async () => hook.result.current.sendTest())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No devices'))

    testChannel.mockResolvedValueOnce({ success: false })
    await act(async () => hook.result.current.sendTest())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(EN.testFailed))

    testChannel.mockRejectedValueOnce(new Error('timeout'))
    toast.error.mockClear()
    await act(async () => hook.result.current.sendTest())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(EN.testFailed))
  })

  it('FE-WEBPUSH-HOOK-015: coming back to the page reads the device again, until unmount', async () => {
    const hook = await mounted('denied')
    push.readWebPushDeviceState.mockResolvedValue('off')
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(push.readWebPushDeviceState).toHaveBeenCalledTimes(1)

    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await waitFor(() => expect(hook.result.current.state).toBe('off'))

    hook.unmount()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(push.readWebPushDeviceState).toHaveBeenCalledTimes(2)
  })
})
