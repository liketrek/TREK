import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Nothing in a rendered test can see the notice's stacking order: jsdom applies
// no author stylesheet and resolves no custom properties, so the two real files
// are the only place the answer lives. Issue #2052 is exactly that gap, the
// overlay sat at a bare 50 and the Vacay mode bar covered it.
describe('release notice css', () => {
  // Vitest runs with the client package as its root, so cwd is stable here.
  const read = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')
  const notice = read('src/components/SystemNotices/releaseNotice.css')
  const tokens = read('src/index.css')

  const block = (selector: string): string => {
    const at = notice.indexOf(selector)
    expect(at, `${selector} missing from releaseNotice.css`).toBeGreaterThan(-1)
    return notice.slice(at, notice.indexOf('}', at) + 1)
  }

  const step = (name: string): number => {
    const found = new RegExp(`${name}:\\s*(\\d+);`).exec(tokens)
    expect(found, `${name} missing from index.css`).not.toBeNull()
    return Number(found![1])
  }

  it('FE-COMP-RELEASENOTICECSS-001: the overlay stacks from the token, not a bare 50', () => {
    const overlay = block('.rn-overlay {')
    expect(overlay).toMatch(/z-index:\s*var\(--z-notice/)
    expect(overlay).not.toMatch(/z-index:\s*50\b/)
  })

  it('FE-COMP-RELEASENOTICECSS-002: the notice step clears the navbar and the Vacay toolbar', () => {
    // The Vacay calendar's mode bar is sticky at 61 and no stacking context
    // separates the two, so it comes down to a plain number comparison.
    expect(step('--z-notice')).toBeGreaterThan(step('--z-nav'))
    expect(step('--z-notice')).toBeGreaterThan(61)
  })
})
