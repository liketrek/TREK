// FE-DAWARICH-ATLASPANEL-001 to FE-DAWARICH-ATLASPANEL-007
/**
 * Dawarich's own panel on the Atlas, beside the stats.
 *
 * The panel itself holds almost no logic, and the little it does hold is the
 * kind that is invisible until it is wrong:
 *
 *  - **It has to disappear completely when the addon is off.** Not empty, not a
 *    blank pane of glass in the row beside the stats: absent, so an Atlas
 *    without Dawarich looks exactly as it did before the integration landed.
 *  - **It has to ask the question that was pressed.** Two tiles, one dialog, one
 *    `initialTab` between them. Wiring both tiles to the same tab is a bug that
 *    looks like a working panel.
 *  - **It mounts the dialog on open and throws it away on close**, deliberately,
 *    so a second visit starts from a fresh question rather than from a scan
 *    somebody ran an hour ago.
 *  - **It is made of the same glass as the Atlas panel next to it.** The tint
 *    and the cursor glare are hand-written rgba rather than tokens (a solid
 *    surface token would punch an opaque hole in a panel floating over a blurred
 *    map), so nothing but a test stops the two panels drifting apart in the
 *    dark theme.
 *
 * The dialog is pinned by its own file and stands in for itself here, so the
 * panel's decisions are observable without a scan and without mocking Dawarich.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { render, screen } from '../../../tests/helpers/render'
import { useAddonStore } from '../../store/addonStore'
import DawarichAtlasSidePanel from './DawarichAtlasSidePanel'

vi.mock('./DawarichAtlasDialog', () => ({
  default: ({
    initialTab,
    onClose,
    onChanged,
  }: {
    initialTab: string
    onClose: () => void
    onChanged?: () => void
  }) => (
    <div data-testid="atlas-dialog">
      <span>asked: {initialTab}</span>
      <button type="button" onClick={onClose}>
        dismiss
      </button>
      <button type="button" onClick={() => onChanged?.()}>
        wrote something
      </button>
    </div>
  ),
}))

const ADDON = { id: 'dawarich', name: 'Dawarich', type: 'integration', icon: 'route', enabled: true }

/** The glass the Atlas hands down, reduced to the one property jsdom can answer for. */
const GLASS: React.CSSProperties = { borderRadius: 20 }

/** Inline rgba comes back from jsdom respaced; nothing here cares about the spaces. */
const rgba = (el: HTMLElement): string => el.style.background.replace(/\s/g, '')

function mount(props: Partial<React.ComponentProps<typeof DawarichAtlasSidePanel>> = {}) {
  return render(<DawarichAtlasSidePanel style={GLASS} dark {...props} />)
}

beforeEach(() => {
  useAddonStore.setState({ addons: [ADDON], loaded: true })
})

afterEach(() => {
  useAddonStore.setState({ addons: [], loaded: false })
})

describe('DawarichAtlasSidePanel', () => {
  it('FE-DAWARICH-ATLASPANEL-001: an Atlas without the addon gets no panel at all', () => {
    useAddonStore.setState({ addons: [{ ...ADDON, enabled: false }] })

    const { container } = mount()

    // Nothing rendered, rather than an empty pane of glass in the row: the
    // panel is stretched to the height of the stats beside it, so an empty one
    // would be a visible hole.
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('button', { name: 'Wishlist' })).toBeNull()
  })

  it('FE-DAWARICH-ATLASPANEL-002: with the addon on it offers two questions and asks neither', () => {
    const { container } = mount()

    expect(screen.getByText('Dawarich')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wishlist' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Countries' })).toBeInTheDocument()
    // A scan costs one upstream request per wish. Nothing is asked until asked.
    expect(screen.queryByTestId('atlas-dialog')).toBeNull()
    // And it wears the glass it was handed rather than one of its own.
    expect(container.firstElementChild).toHaveStyle({ borderRadius: '20px' })
  })

  it('FE-DAWARICH-ATLASPANEL-003: the wishlist tile opens the dialog on the wishlist, and closing puts it away', () => {
    mount()

    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }))

    expect(screen.getByText('asked: wishes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }))

    // Unmounted, not hidden: the next visit starts from a clean question rather
    // than from an answer that is an hour old.
    expect(screen.queryByTestId('atlas-dialog')).toBeNull()
  })

  it('FE-DAWARICH-ATLASPANEL-004: the countries tile opens the same dialog on the other question', () => {
    mount()

    fireEvent.click(screen.getByRole('button', { name: 'Countries' }))

    expect(screen.getByText('asked: countries')).toBeInTheDocument()
    expect(screen.queryByText('asked: wishes')).toBeNull()
  })

  it('FE-DAWARICH-ATLASPANEL-005: what the dialog wrote is reported up to the Atlas', () => {
    // The Atlas keeps its own counts and its own map. Without this the confirmed
    // countries only appear after a reload.
    const onChanged = vi.fn()
    mount({ onChanged })

    fireEvent.click(screen.getByRole('button', { name: 'Countries' }))
    fireEvent.click(screen.getByRole('button', { name: 'wrote something' }))

    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-ATLASPANEL-006: the tiles are a tint of the light the panel is made of, per theme', () => {
    const { rerender } = render(<DawarichAtlasSidePanel style={GLASS} dark={false} />)
    const wishes = screen.getByRole('button', { name: 'Wishlist' })

    expect(rgba(wishes)).toBe('rgba(0,0,0,0.05)')
    fireEvent.mouseEnter(wishes)
    expect(rgba(wishes)).toBe('rgba(0,0,0,0.09)')
    fireEvent.mouseLeave(wishes)
    expect(rgba(wishes)).toBe('rgba(0,0,0,0.05)')

    rerender(<DawarichAtlasSidePanel style={GLASS} dark />)

    // Inverted on the dark map, not merely darkened: the tile is light added to
    // the glass, and a black tint on a dark blurred map is an invisible button.
    expect(rgba(screen.getByRole('button', { name: 'Wishlist' }))).toBe('rgba(255,255,255,0.07)')
  })

  it('FE-DAWARICH-ATLASPANEL-007: the glass glare follows the cursor and goes out behind it', () => {
    const { container } = mount()
    const panel = container.firstElementChild as HTMLElement
    const [glare, borderGlare] = Array.from(panel.children) as HTMLElement[]

    expect(glare.style.opacity).toBe('0')

    fireEvent.mouseMove(panel, { clientX: 140, clientY: 60 })

    // The pool of light has to sit under the pointer, not merely exist: the
    // panel's box measures as the origin here, so the cursor's own coordinates
    // are what should end up in the gradient. An effect that lit up in a fixed
    // spot would pass an opacity-only assertion and look broken on screen.
    expect(glare.style.background).toContain('at 140px 60px')
    expect(glare.style.opacity).toBe('1')
    expect(borderGlare.style.opacity).toBe('1')

    fireEvent.mouseLeave(panel)

    expect(glare.style.opacity).toBe('0')
    expect(borderGlare.style.opacity).toBe('0')
  })
})
