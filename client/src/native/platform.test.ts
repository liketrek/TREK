import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { isNativeApp, isNativeIos, nativeServerHost } from './platform'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(), getPlatform: vi.fn() } }))

beforeEach(() => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
  vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
})

describe('platform', () => {
  it('tells the app from a browser', () => {
    expect(isNativeApp()).toBe(true)
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    expect(isNativeApp()).toBe(false)
  })

  it('narrows to iOS', () => {
    expect(isNativeIos()).toBe(true)
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
    expect(isNativeIos()).toBe(false)
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    expect(isNativeIos()).toBe(false)
  })

  it('names the server the WebView sits on, only inside the app', () => {
    expect(nativeServerHost()).toBe(window.location.host)
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    expect(nativeServerHost()).toBeNull()
  })
})
