/**
 * The one body scroll lock every overlay in the app shares.
 *
 * Below 768px the document itself is the scroller now (#1809), so locking is no
 * longer cosmetic: an overlay that resets `body.style.overflow` unconditionally
 * really does unlock the page behind another overlay that is still open (a
 * system notice re-running its effect used to do exactly that to an open
 * sheet). Overlays stack, so the first lock remembers the original value and
 * only the last release puts it back.
 */
let locks = 0
let savedOverflow = ''

/**
 * Locks body scrolling and returns the matching release. Releasing twice is a
 * no-op, so the return value can be used directly as an effect cleanup.
 */
export function lockBodyScroll(): () => void {
  if (locks === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  locks += 1

  let released = false
  return () => {
    if (released) return
    released = true
    locks = Math.max(0, locks - 1)
    if (locks === 0) document.body.style.overflow = savedOverflow
  }
}

/** How many locks are currently held. For tests and diagnostics. */
export function bodyScrollLocks(): number {
  return locks
}

/** Test seam: the counter is module state and outlives a single test case. */
export function resetBodyScrollLock(): void {
  locks = 0
  savedOverflow = ''
}
