import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within, act } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { useHelpStore } from '../../store/helpStore'
import HelpPanel from './HelpPanel'
import HelpButton from './HelpButton'
import HelpAnchor from './HelpAnchor'

/**
 * The dialog end to end against the real registry and the English catalogue:
 * open it from the navbar button, read the overview, open a guide, search,
 * close it again. The wiki index and search are served by msw.
 */

const initial = useHelpStore.getState()

beforeEach(() => {
  useHelpStore.setState(initial, true)
  server.use(
    http.get('/api/help/index', () =>
      HttpResponse.json({ sections: [{ title: 'Planning', pages: [{ slug: 'Creating-a-Trip', title: 'Creating a Trip' }, { slug: 'My-Trips-Dashboard', title: 'My Trips Dashboard' }] }] }),
    ),
    http.get('/api/help/search', ({ request }) => {
      const q = new URL(request.url).searchParams.get('q') ?? ''
      if (q === 'zzqx') return HttpResponse.json({ hits: [] })
      return HttpResponse.json({ hits: [{ slug: 'Calendar-Feeds', title: 'Calendar Feeds', section: 'Planning', anchor: 'turning-a-feed-on', heading: 'Turning a feed on', snippet: 'Click Enable calendar subscription…', score: 9 }] })
    }),
  )
})

function mount(): void {
  render(
    <>
      <HelpButton />
      <HelpAnchor id="dashboard" />
      <HelpPanel />
    </>,
  )
}

describe('HelpPanel', () => {
  it('stays out of the DOM until opened, then shows the screen overview', () => {
    mount()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    const dialog = screen.getByRole('dialog', { name: 'Help' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    // Guides appear in the navigation and as cards.
    expect(screen.getAllByRole('button', { name: /Create a trip/ }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: 'Help for this screen' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens a guide with its steps, result and tips, and goes back to the overview', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Create a trip/ })[0])
    expect(screen.getByRole('heading', { level: 1, name: 'Create a trip' })).toBeInTheDocument()
    expect(screen.getByText(/Click Create New Trip\./)).toBeInTheDocument()
    expect(screen.getByText(/shown in the boarding pass at the top/)).toBeInTheDocument()
    expect(screen.getByText(/Dates can be changed later/)).toBeInTheDocument()
    // A picture for every step.
    expect(screen.getAllByRole('button', { name: /Step \d of/ })).toHaveLength(5)
    // Doc link resolves its title from the index once that has loaded.
    await waitFor(() => expect(screen.getAllByText('Creating a Trip').length).toBeGreaterThan(0))
    // Related guide opens in place (the last match is the one under "Related"; the nav lists it too).
    const related = screen.getAllByRole('button', { name: 'Set a cover photo' })
    fireEvent.click(related[related.length - 1])
    expect(screen.getByRole('heading', { level: 1, name: 'Set a cover photo' })).toBeInTheDocument()
    // The overview entry in the nav returns home.
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('enlarges a step picture in the lightbox and closes it on click', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Edit a trip/ })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /Step 1 of/ })[0])
    const box = screen.getByRole('dialog', { name: /Step 1 of/ })
    expect(box.querySelector('img')).toHaveAttribute('src', '/help-media/edit-trip/step-1.webp')
    fireEvent.click(box)
    expect(screen.queryByRole('dialog', { name: /Step 1 of/ })).toBeNull()
  })

  it('searches guides locally and the docs on the server', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    const box = screen.getByRole('searchbox')
    fireEvent.change(box, { target: { value: 'calendar' } })
    // Local guide match right away…
    expect(screen.getAllByRole('button', { name: /Subscribe to all trips in your calendar/ }).length).toBeGreaterThan(0)
    // …and the doc hit once the server answers.
    await waitFor(() => expect(screen.getByText('Calendar Feeds · Turning a feed on')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Calendar Feeds · Turning a feed on/ })).toHaveAttribute('href', '/help/Calendar-Feeds#turning-a-feed-on')
  })

  it('finds a guide by its words in any order, stop words and accents aside, title first', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    const box = screen.getByRole('searchbox')
    fireEvent.change(box, { target: { value: 'how do I create trip' } })
    // The result cards sit in the main pane's "Guides" list, the nav lists guides too.
    const first = () => screen.getByRole('main').querySelector('ul li button')!
    expect(first()).toHaveAccessibleName(/Create a trip/)
    fireEvent.change(box, { target: { value: 'Trip Créate' } })
    expect(first()).toHaveAccessibleName(/Create a trip/)
  })

  it('searches from inside a guide too, and returns to the guide once the box is cleared', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Create a trip/ })[0])
    expect(screen.getByRole('heading', { level: 1, name: 'Create a trip' })).toBeInTheDocument()
    const box = screen.getByRole('searchbox')
    fireEvent.change(box, { target: { value: 'calendar' } })
    expect(screen.queryByRole('heading', { level: 1, name: 'Create a trip' })).toBeNull()
    expect(screen.getAllByRole('button', { name: /Subscribe to all trips in your calendar/ }).length).toBeGreaterThan(0)
    fireEvent.change(box, { target: { value: '' } })
    expect(screen.getByRole('heading', { level: 1, name: 'Create a trip' })).toBeInTheDocument()
  })

  it('lists the sub-screens of a screen open on its overview and in the nav, and offers the way into the screen', () => {
    render(
      <>
        <HelpButton />
        <HelpAnchor id="settings" />
        <HelpPanel />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    // In view straight away: each sub-screen holds guides of its own, and a fold hid them.
    fireEvent.click(screen.getByRole('button', { name: /Appearance.*guides/ }))
    expect(useHelpStore.getState().browseId).toBe('settings-appearance')
    expect(screen.getByRole('heading', { level: 1, name: 'Appearance' })).toBeInTheDocument()
    // On a tab, the nav lists its siblings, open, with the shown one marked, and the header leads into the tab.
    // (The overview entry is also named "Appearance"; the sibling rows are the ones under "Sub-screens".)
    const nav = screen.getByRole('navigation', { name: 'Help' })
    expect(within(nav).getByRole('button', { name: /Sub-screens/ })).toHaveAttribute('aria-expanded', 'true')
    const rows = within(nav).getAllByRole('button', { name: 'Appearance' })
    expect(rows.some(b => b.getAttribute('aria-current') === 'page')).toBe(true)
    expect(within(nav).getByRole('button', { name: 'Map' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Appearance' })).toHaveAttribute('href', '/settings?tab=appearance')
  })

  it('links each docs page once, however many of its sections the screen names', () => {
    render(
      <>
        <HelpButton />
        <HelpAnchor id="trip-tour-planner" />
        <HelpPanel />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    const hrefs = screen.getAllByRole('link').map(a => a.getAttribute('href') ?? '').filter(h => h.startsWith('/help/'))
    const pages = hrefs.map(h => h.split('#')[0])
    expect(pages.length).toBeGreaterThan(0)
    expect(new Set(pages).size).toBe(pages.length)
  })

  it('says so when nothing matches', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzqx' } })
    await waitFor(() => expect(screen.getByText('Nothing found for “zzqx”.')).toBeInTheDocument())
  })

  it('closes on the close button, on the backdrop and on Escape', async () => {
    mount()
    const open = () => fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }))
    expect(useHelpStore.getState().open).toBe(false)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    open()
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(useHelpStore.getState().open).toBe(false)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    open()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useHelpStore.getState().open).toBe(false)
  })

  it('leaves Escape to a modal the reader opened while following a guide', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    const modal = document.createElement('div')
    modal.className = 'trek-modal-backdrop'
    document.body.appendChild(modal)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useHelpStore.getState().open).toBe(true)
    modal.remove()
  })

  it('shows the empty state on a screen without help', () => {
    render(
      <>
        <HelpButton />
        <HelpPanel />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    expect(screen.getAllByText('No guide for this screen yet.').length).toBeGreaterThan(0)
  })

  it('clears the screen when its anchor unmounts', () => {
    const { unmount } = render(<HelpAnchor id="dashboard" />)
    expect(useHelpStore.getState().contextId).toBe('dashboard')
    act(() => unmount())
    expect(useHelpStore.getState().contextId).toBeNull()
  })

  it('folds sub-screens under their screen in the switcher, one group open at a time', () => {
    render(
      <>
        <HelpButton />
        <HelpAnchor id="journey-detail" />
        <HelpPanel />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Help for this screen' }))
    // The trigger names the trail, and the list opens with the journal's group unfolded.
    const trigger = screen.getByRole('button', { name: /Journey › Journal/ })
    fireEvent.click(trigger)
    const list = screen.getByRole('listbox', { name: 'Screens' })
    expect(list).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Journal/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: /Studio/ })).toBeInTheDocument()
    // Folding the group hides the sub-screens; the top-level screens stay. The
    // toggle is looked up inside its own row: every screen with sub-screens has
    // one, and the trip has as many as the plan has columns, panels and tabs.
    const journeyFold = () => within(screen.getByRole('option', { name: /^Journey/ })).getByRole('button', { name: /sub-screens/ })
    fireEvent.click(journeyFold())
    expect(screen.queryByRole('option', { name: /Studio/ })).toBeNull()
    expect(screen.getByRole('option', { name: /Atlas/ })).toBeInTheDocument()
    // Picking a sub-screen browses to it; the breadcrumb on the overview shows the trail.
    fireEvent.click(journeyFold())
    fireEvent.click(screen.getByRole('option', { name: /Studio/ }).querySelector('button')!)
    expect(useHelpStore.getState().browseId).toBe('journey-studio')
    expect(screen.getByRole('heading', { level: 1, name: 'Studio' })).toBeInTheDocument()
  })

  it('does not clear a screen another anchor has already taken over', () => {
    const { unmount } = render(<HelpAnchor id="dashboard" />)
    act(() => useHelpStore.getState().setContext('settings'))
    act(() => unmount())
    expect(useHelpStore.getState().contextId).toBe('settings')
  })
})

