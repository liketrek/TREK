/**
 * FE-IOS-001 to FE-IOS-004: the two iPhone and iPad facts shared by file
 * opening and Web Push.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { isIosDevice, isIosStandalone } from './iosDevice'

function define(name: 'userAgent' | 'maxTouchPoints' | 'standalone', value: unknown) {
  Object.defineProperty(navigator, name, { configurable: true, get: () => value })
}

afterEach(() => {
  for (const name of ['userAgent', 'maxTouchPoints', 'standalone']) {
    delete (navigator as unknown as Record<string, unknown>)[name]
  }
})

describe('isIosStandalone', () => {
  it("FE-IOS-001: is true only for Apple's own home-screen flag", () => {
    expect(isIosStandalone()).toBe(false)
    define('standalone', false)
    expect(isIosStandalone()).toBe(false)
    define('standalone', true)
    expect(isIosStandalone()).toBe(true)
  })
})

describe('isIosDevice', () => {
  it('FE-IOS-002: recognises iPhone, iPod and iPad by their user agent', () => {
    for (const device of ['iPhone', 'iPod touch', 'iPad']) {
      define('userAgent', `Mozilla/5.0 (${device}; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15`)
      expect(isIosDevice()).toBe(true)
    }
  })

  it('FE-IOS-003: an iPad asking for the desktop site is a Mac with a touch screen', () => {
    define('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')
    define('maxTouchPoints', 5)
    expect(isIosDevice()).toBe(true)
    define('maxTouchPoints', 0)
    expect(isIosDevice()).toBe(false)
  })

  it('FE-IOS-004: Android and Windows are not iOS', () => {
    define('maxTouchPoints', 5)
    define('userAgent', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36')
    expect(isIosDevice()).toBe(false)
    define('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36')
    expect(isIosDevice()).toBe(false)
  })
})
