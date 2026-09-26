/**
 * iPhone and iPad facts that more than one feature has to know about: file
 * opening needs to know whether a new tab would leave the installed app, and
 * Web Push needs to know whether it can work here at all.
 */

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

/**
 * True only on iOS and iPadOS while TREK runs as an app added to the Home
 * Screen. `navigator.standalone` is Apple's own flag and exists nowhere else,
 * so every other platform answers false.
 */
export function isIosStandalone(): boolean {
  return typeof navigator !== 'undefined' && (navigator as NavigatorWithStandalone).standalone === true
}

/**
 * True on iPhone, iPod touch and iPad. iPadOS 13 and later asks for the desktop
 * site by default and then introduces itself as a Mac, so a Mac with a touch
 * screen counts too: no real Mac has one.
 */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1
}
