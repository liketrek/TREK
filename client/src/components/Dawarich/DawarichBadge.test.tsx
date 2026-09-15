// FE-DAWARICH-BADGE-001 to FE-DAWARICH-BADGE-007
/**
 * The one pill the whole Dawarich surface is drawn from, pinned prop by prop.
 *
 * It is nine lines of JSX, which is exactly why it is worth a test: the review
 * list, the accept dialog and the Atlas dialog all render it, so a change here
 * lands in three places at once and none of their tests would name it as the
 * culprit.
 *
 * What is worth holding still, roughly in the order of what breaks worst:
 *
 *  - **Icon-only means named.** `children === undefined` is the switch that
 *    turns a badge into a round dot of colour, and it is the same switch that
 *    adds `role="img"` and the accessible name. Lose the pairing and the low
 *    confidence flag, the "source gone" flag and the "source changed" flag all
 *    become unlabelled squares that a screen reader reads as nothing at all.
 *  - **`children === undefined`, not `!children`.** The day header counts its
 *    stays with the array length, so a falsy check would turn a legitimate
 *    count of zero into an unlabelled dot.
 *  - **The tone is the meaning.** Five tones, each a pair of theme tokens; a
 *    warning that quietly maps to the neutral pair still reads as a fact worth
 *    ignoring, which is the opposite of what it is there to say.
 *  - **The type scales with the reader's setting.** Both sizes go through
 *    `--fs-scale-caption`; a raw `fontSize: 11` would look identical in review
 *    and ignore the text-size preference entirely.
 *  - **A badge with something to add gets TREK's tooltip, one without gets
 *    none.** `title` wins over `label` as the hover text, so a pointer user can
 *    be told more than the accessible name says.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '../../../tests/helpers/render'
import { fireEvent } from '@testing-library/react'
import DawarichBadge from './DawarichBadge'

type BadgeProps = React.ComponentProps<typeof DawarichBadge>

// The clock goes in before anything renders, the way Tooltip's own suite does
// it: swapping timers out from under a mounted tree leaves whatever it already
// scheduled on the real clock. `shouldAdvanceTime` keeps real time moving, so
// the locale promise the render helper's provider starts still settles.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * Stands in for a lucide icon. All the badge does with one is hand it a
 * className, so that string is the only thing worth asserting about it.
 */
function StubIcon({ className }: { className?: string }) {
  return <svg data-testid="badge-icon" className={className} />
}

function badge(props: BadgeProps) {
  const view = render(<DawarichBadge {...props} />)
  return { ...view, el: view.container.firstElementChild as HTMLElement }
}

/**
 * What the badge says on hover, or null when it has nothing to add and is
 * therefore not wrapped in a tooltip at all. The tooltip opens on a 250 ms
 * timer, so the clock has to be moved on by hand for either answer to be true
 * rather than merely early.
 */
function hoverText(el: HTMLElement): string | null {
  fireEvent.mouseEnter(el)
  // One window covers both steps: the 250 ms open timer, and the effect that
  // measures the trigger afterwards. Until that effect lands the portal is
  // `visibility: hidden`, which is invisible to a role query as well as to a
  // reader, so a half-flushed tooltip would read as no tooltip at all.
  act(() => { vi.advanceTimersByTime(300) })
  return screen.queryByRole('tooltip')?.textContent ?? null
}

describe('DawarichBadge', () => {
  it('FE-DAWARICH-BADGE-001: the default pill is neutral, xs, and says nothing on hover', () => {
    const { el } = badge({ children: '3 stays' })

    expect(el).toHaveTextContent('3 stays')
    expect(el).toHaveClass('h-[18px]', 'px-1.5', 'bg-surface-secondary', 'text-content-secondary')
    // A pill that already reads "3 stays" needs no image role and no name of
    // its own: both would make a screen reader announce the same thing twice.
    expect(el).not.toHaveAttribute('role')
    expect(el).not.toHaveAttribute('aria-label')
    expect(el.style.fontSize).toBe('calc(10px * var(--fs-scale-caption, 1))')
    expect(el.querySelector('[data-testid="badge-icon"]')).toBeNull()
    // No title and no label, so there is nothing a tooltip could add.
    expect(hoverText(el)).toBeNull()
  })

  it('FE-DAWARICH-BADGE-002: sm raises the box, the icon and the type together', () => {
    const { el } = badge({ icon: StubIcon, size: 'sm', children: '2 h 25 min' })

    expect(el).toHaveClass('h-[20px]', 'px-1.5')
    expect(el.style.fontSize).toBe('calc(11px * var(--fs-scale-caption, 1))')
    expect(screen.getByTestId('badge-icon').getAttribute('class')).toBe('w-3 h-3 flex-shrink-0')
    // The text truncates and the glyph does not: a long name must run out of
    // room before it squeezes the icon out of shape.
    expect(el.querySelector('.truncate')).toHaveTextContent('2 h 25 min')
  })

  it('FE-DAWARICH-BADGE-003: an icon-only pill is square, named, and offers its name on hover', () => {
    const { el } = badge({ icon: StubIcon, tone: 'warning', label: 'Low confidence' })

    expect(el).toHaveAttribute('role', 'img')
    expect(el).toHaveAttribute('aria-label', 'Low confidence')
    expect(el).toHaveClass('w-[18px]', 'justify-center', 'bg-warning-soft', 'text-warning')
    // Side padding would make the circle an oval, and there is no text to pad
    // away from in the first place.
    expect(el).not.toHaveClass('px-1.5')
    expect(el.querySelector('.truncate')).toBeNull()
    expect(screen.getByTestId('badge-icon').getAttribute('class')).toBe('w-2.5 h-2.5 flex-shrink-0')
    // No title, so the accessible name doubles as the hover text and a pointer
    // user is told exactly what a screen reader is told.
    expect(hoverText(el)).toBe('Low confidence')
  })

  it('FE-DAWARICH-BADGE-004: the square grows with the size, so the dot stays a circle', () => {
    const { el } = badge({ icon: StubIcon, size: 'sm', label: 'Source gone' })

    expect(el).toHaveClass('h-[20px]', 'w-[20px]', 'justify-center')
    expect(el).not.toHaveClass('w-[18px]')
  })

  it('FE-DAWARICH-BADGE-005: title is the hover text, label stays the name', () => {
    const { el } = badge({
      icon: StubIcon,
      tone: 'warning',
      label: 'Low confidence',
      title: 'Dawarich is not sure this stay happened',
    })

    // The two are not interchangeable: the name is what the badge is, the title
    // is what it has to add, and a screen reader would drown in the long one.
    expect(el).toHaveAttribute('aria-label', 'Low confidence')
    expect(hoverText(el)).toBe('Dawarich is not sure this stay happened')
  })

  it('FE-DAWARICH-BADGE-006: every tone keeps its own pair of theme tokens', () => {
    const tones: Array<[NonNullable<BadgeProps['tone']>, string[]]> = [
      ['neutral', ['bg-surface-secondary', 'text-content-secondary']],
      ['quiet', ['bg-surface-secondary', 'text-content-faint']],
      ['accent', ['bg-accent-subtle', 'text-accent-on']],
      ['success', ['bg-success-soft', 'text-success']],
      ['warning', ['bg-warning-soft', 'text-warning']],
    ]

    for (const [tone, classes] of tones) {
      const { el, unmount } = badge({ tone, children: tone })
      // Tokens rather than colour literals, or the badge stops following the
      // user's scheme the moment they pick one.
      expect(el).toHaveClass(...classes)
      unmount()
    }
  })

  it('FE-DAWARICH-BADGE-007: a zero is a child, not an absent one', () => {
    // The day header counts its stays with the array length. Icon-only is
    // `children === undefined` and not a falsy check for exactly this reason: a
    // count of 0 that turned into an unlabelled dot would be a day that lost
    // its number.
    const { el } = badge({ tone: 'quiet', children: 0 })

    expect(el).toHaveTextContent('0')
    expect(el).not.toHaveAttribute('role')
    expect(el).toHaveClass('px-1.5')
  })
})
