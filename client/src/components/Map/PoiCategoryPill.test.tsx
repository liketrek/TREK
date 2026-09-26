// FE-COMP-POIPILL-001 to FE-COMP-POIPILL-018
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { fireEvent } from '@testing-library/react'
import PoiCategoryPill from './PoiCategoryPill'
import { POI_CATEGORIES } from './poiCategories'
import { corePoiCategories, pluginPoiCategories, type PoiCategoryGroups } from './usePoiCategories'

const CAFE = POI_CATEGORIES.find(c => c.key === 'cafe')!
const BAR = POI_CATEGORIES.find(c => c.key === 'bar')!

// The labels the English UI gives the core chips, as usePoiCategories hands them over.
const EN: Record<string, string> = {
  'poi.cat.restaurants': 'Restaurants', 'poi.cat.cafes': 'Cafés', 'poi.cat.bars': 'Bars & nightlife',
  'poi.cat.hotels': 'Accommodation', 'poi.cat.sights': 'Sights', 'poi.cat.museums': 'Museums & culture',
  'poi.cat.nature': 'Nature & parks', 'poi.cat.activities': 'Activities',
}
const CORE_ONLY: PoiCategoryGroups = { core: corePoiCategories(key => EN[key] ?? key), plugin: [] }
const WITH_PLUGINS: PoiCategoryGroups = {
  core: CORE_ONLY.core,
  plugin: pluginPoiCategories([{
    id: 'trail-finder', name: 'Trail finder', type: 'integration', icon: null,
    poiCategories: [
      { id: 'trailheads', label: 'Trailheads', icon: 'Signpost', color: '#2f855a' },
      { id: 'water', label: 'Drinking water', icon: 'Droplet', color: '#0369a1' },
    ],
  }], 'en'),
}
const TRAILHEADS = 'plugin:trail-finder/trailheads'

function pill(props: Partial<React.ComponentProps<typeof PoiCategoryPill>> = {}) {
  return render(
    <PoiCategoryPill categories={CORE_ONLY} active={new Set()} onToggle={vi.fn()} {...props} />,
  )
}

// The spinner replaces the category icon, so "is this segment spinning" reads as
// "does its button hold an .animate-spin element".
const spinning = () => screen.getAllByRole('button')
  .filter(b => b.querySelector('.animate-spin'))
  .map(b => b.getAttribute('aria-label'))

const labels = () => screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))

describe('PoiCategoryPill', () => {
  it('FE-COMP-POIPILL-001: renders one segment per category, none pressed', () => {
    pill()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(POI_CATEGORIES.length)
    expect(buttons.every(b => b.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('FE-COMP-POIPILL-002: clicking a segment toggles its category', () => {
    const onToggle = vi.fn()
    pill({ onToggle })
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(onToggle).toHaveBeenCalledWith(POI_CATEGORIES[1].key)
  })

  it('FE-COMP-POIPILL-003: the active category spins while its fetch is in flight', () => {
    pill({ active: new Set([CAFE.key]), loadingKeys: new Set([CAFE.key]) })
    expect(spinning()).toEqual(['Cafés'])
  })

  it('FE-COMP-POIPILL-004: a deselected category never spins, even with a lingering loading key', () => {
    pill({ active: new Set([BAR.key]), loadingKeys: new Set([CAFE.key, BAR.key]) })
    expect(spinning()).toEqual(['Bars & nightlife'])
  })

  it('FE-COMP-POIPILL-005: a failed category offers a retry', () => {
    pill({ active: new Set([CAFE.key]), errorKeys: new Set([CAFE.key]) })
    expect(screen.getByText('Search this area')).toBeInTheDocument()
  })

  it('FE-COMP-POIPILL-006: "search this area" reports the moved viewport', () => {
    const onSearchArea = vi.fn()
    pill({ active: new Set([CAFE.key]), moved: true, onSearchArea })
    fireEvent.click(screen.getByText('Search this area'))
    expect(onSearchArea).toHaveBeenCalled()
  })

  // The phone map hands the bar the whole width between the screen margins, so
  // its segments end up the size of everything else the thumb aims at there.
  it('FE-COMP-POIPILL-007: fullWidth stretches the bar and spreads the segments', () => {
    pill({ fullWidth: true })
    const button = screen.getAllByRole('button')[0]
    expect(button.style.flexGrow).toBe('1')
    expect(button.style.width).toBe('auto')
    expect((button.parentElement as HTMLElement).style.display).toBe('flex')
  })

  it('FE-COMP-POIPILL-008: without it the bar stays content-width, as the desktop map floats it', () => {
    pill()
    const button = screen.getAllByRole('button')[0]
    expect(button.style.flexGrow).toBe('')
    expect(button.style.width).toBe('34px')
    expect((button.parentElement as HTMLElement).style.display).toBe('inline-flex')
  })

  it('FE-COMP-POIPILL-009: without plugin categories there is no divider and every segment sits in the bar', () => {
    pill()
    expect(screen.queryByRole('separator')).toBeNull()
    const bar = screen.getAllByRole('button')[0].parentElement as HTMLElement
    expect(bar.children).toHaveLength(POI_CATEGORIES.length)
  })

  it('FE-COMP-POIPILL-010: plugin categories follow the core ones after a labelled divider', () => {
    pill({ categories: WITH_PLUGINS })
    expect(labels()).toEqual([...CORE_ONLY.core.map(c => c.label), 'Trailheads', 'Drinking water'])
    const divider = screen.getByRole('separator', { name: 'Categories from plugins' })
    const bar = divider.parentElement as HTMLElement
    // In the same bar, straight after the last core segment.
    expect(Array.from(bar.children).indexOf(divider)).toBe(POI_CATEGORIES.length)
    expect(divider.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('FE-COMP-POIPILL-011: a plugin segment toggles its namespaced key and fills with its own colour', () => {
    const onToggle = vi.fn()
    const { rerender } = pill({ categories: WITH_PLUGINS, onToggle })
    fireEvent.click(screen.getByRole('button', { name: 'Trailheads' }))
    expect(onToggle).toHaveBeenCalledWith(TRAILHEADS)

    rerender(<PoiCategoryPill categories={WITH_PLUGINS} active={new Set([TRAILHEADS])} onToggle={onToggle} errorKeys={new Set([TRAILHEADS])} />)
    const segment = screen.getByRole('button', { name: 'Trailheads' })
    expect(segment.getAttribute('aria-pressed')).toBe('true')
    expect(segment.style.background).toBe('rgb(47, 133, 90)')
    // A failing plugin category offers the same retry a core one does.
    expect(screen.getByText('Search this area')).toBeInTheDocument()
  })

  it('FE-COMP-POIPILL-012: the bar scrolls sideways once it runs out of room', () => {
    pill({ categories: WITH_PLUGINS, fullWidth: true })
    const bar = screen.getAllByRole('button')[0].parentElement as HTMLElement
    expect(bar.style.overflowX).toBe('auto')
    expect(bar.style.maxWidth).toBe('100%')
    // The column around it may shrink, or the bar would push past its container instead.
    expect((bar.parentElement as HTMLElement).style.minWidth).toBe('0px')
  })

  it('FE-COMP-POIPILL-013: a phone segment never shrinks below the 34px touch target', () => {
    pill({ categories: WITH_PLUGINS, fullWidth: true })
    for (const button of screen.getAllByRole('button')) {
      expect(button.style.minWidth).toBe('34px')
      expect(button.style.height).toBe('34px')
    }
  })

  it('FE-COMP-POIPILL-014: a desktop segment keeps its 34px instead of shrinking in a narrow corridor', () => {
    pill({ categories: WITH_PLUGINS })
    for (const button of screen.getAllByRole('button')) {
      expect(button.style.flexShrink).toBe('0')
      expect(button.style.minWidth).toBe('34px')
    }
    expect((screen.getByRole('separator').style.flexShrink)).toBe('0')
  })

  it('FE-COMP-POIPILL-015: hovering highlights an idle segment and leaves an active one its colour', () => {
    pill({ categories: WITH_PLUGINS, active: new Set([TRAILHEADS]) })
    const idle = screen.getByRole('button', { name: 'Drinking water' })
    fireEvent.mouseEnter(idle)
    expect(idle.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(idle)
    expect(idle.style.background).toBe('transparent')

    const on = screen.getByRole('button', { name: 'Trailheads' })
    fireEvent.mouseEnter(on)
    fireEvent.mouseLeave(on)
    expect(on.style.background).toBe('rgb(47, 133, 90)')
  })

  // jsdom lays nothing out, so the bar is given the widths a narrow desktop corridor would.
  const barOf = (clientWidth: number, scrollWidth: number) => {
    const bar = screen.getByRole('separator').parentElement as HTMLElement
    Object.defineProperty(bar, 'clientWidth', { configurable: true, value: clientWidth })
    Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: scrollWidth })
    return bar
  }

  it('FE-COMP-POIPILL-016: a mouse wheel scrolls an overflowing desktop bar sideways, in pixels, lines or pages', () => {
    pill({ categories: WITH_PLUGINS })
    const bar = barOf(300, 450)
    fireEvent.wheel(bar, { deltaY: 100 })
    expect(bar.scrollLeft).toBe(100)
    fireEvent.wheel(bar, { deltaY: 1, deltaMode: WheelEvent.DOM_DELTA_LINE })
    expect(bar.scrollLeft).toBe(134)
    fireEvent.wheel(bar, { deltaY: 0.5, deltaMode: WheelEvent.DOM_DELTA_PAGE })
    expect(bar.scrollLeft).toBe(284)
  })

  it('FE-COMP-POIPILL-017: the wheel is left alone when the bar fits or the turn is already sideways', () => {
    pill({ categories: WITH_PLUGINS })
    const bar = barOf(450, 450)
    fireEvent.wheel(bar, { deltaY: 100 })
    expect(bar.scrollLeft).toBe(0)
    // A trackpad swipe or Shift+wheel scrolls the bar natively; adding to it would double it.
    barOf(300, 450)
    fireEvent.wheel(bar, { deltaX: 40, deltaY: 10 })
    expect(bar.scrollLeft).toBe(0)
  })

  it('FE-COMP-POIPILL-018: in a right-to-left language a wheel-down still moves toward the plugin chips', () => {
    // The app sets the page direction from the language (TranslationContext) and the bar
    // inherits it. The test provider renders in English, so a wrapper stands in for Arabic.
    render(
      <div dir="rtl">
        <PoiCategoryPill categories={WITH_PLUGINS} active={new Set()} onToggle={vi.fn()} />
      </div>,
    )
    const bar = barOf(300, 450)
    // An RTL scroller counts scrollLeft from 0 at the start down to negative at the end.
    fireEvent.wheel(bar, { deltaY: 100 })
    expect(bar.scrollLeft).toBe(-100)
    fireEvent.wheel(bar, { deltaY: -40 })
    expect(bar.scrollLeft).toBe(-60)
  })
})
