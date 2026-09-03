import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BookDocument, BookPageSetup, JourneyStats, JourneyStatsPoint } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { act, fireEvent, render, screen } from '../../helpers/render'
import { StudioTravelPanel } from '../../../src/components/Studio/StudioTravelPanel'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * Switching a stop off the route, from the Travel panel (#2064).
 *
 * The home airport is the case: written up as an entry so the journal has a
 * first day, it lands on the printed map and adds a leg to the distance that
 * nobody thinks of as the trip. The panel lists every stop with a switch, and
 * what these pin is the part that would rot quietly: the left-out stop stays
 * in the list among the others, in date order, because the only way to put a
 * stop back is to be able to see it; the switch asks for exactly the opposite
 * of what the row shows; and a viewer, or a stop the server took from a trip
 * place rather than from an entry, gets the label and no button.
 *
 * Nothing here is optimistic. The row reads the stats it was given, and the
 * hook behind `onToggleStop` fetches fresh ones; the only state the panel
 * keeps is which chips are held while an answer is on its way.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({ preset: 'square-210' })

const point = (over: Partial<JourneyStatsPoint> = {}): JourneyStatsPoint => ({
  lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS',
  tripId: null, photoId: null, entryId: 1,
  ...over,
})

const stats = (over: Partial<JourneyStats> = {}): JourneyStats => ({
  journeyId: 6, distance: 1_189_000, days: 14, steps: 2, photos: 0, places: 3, furthest: 408_000,
  countries: [{ code: 'IS', name: 'Iceland', places: 2, firstVisit: '2026-06-02' }],
  points: [
    point(),
    point({ lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', entryId: 2 }),
  ],
  excluded: [{ entryId: 3, label: 'Keflavík', date: '2026-06-01' }],
  trips: [], start: '2026-06-02', end: '2026-06-15',
  ...over,
})

type Toggle = (entryId: number, excluded: boolean) => Promise<boolean>

function open(journeyStats: JourneyStats, over: { canEdit?: boolean; onToggleStop?: Toggle; folded?: boolean } = {}) {
  const onToggleStop = over.onToggleStop ?? vi.fn(async () => true)
  render(
    <StudioTravelPanel
      page={page} stats={journeyStats} path={[]} t={k => k} locale="en"
      canEdit={over.canEdit ?? true} onToggleStop={onToggleStop}
    />,
  )
  // The section opens folded, since a fortnight of rows is longer than the
  // rest of the panel together. Every case below is about those rows, so
  // unfold unless the case is about the fold itself.
  const head = document.querySelector('.st-section-head')
  if (head && !over.folded) fireEvent.click(head)
  return { onToggleStop, head }
}

const rows = () => Array.from(document.querySelectorAll('.st-stop'))
const labels = () => rows().map(r => r.querySelector('.st-stop-label')?.textContent)
const switches = () => screen.queryAllByRole('button', { name: 'journey.studio.stopToggle' })
/** The switch of a row reads its state from the title, since it draws a mark. */
const stateOf = (row: Element) => row.querySelector('.st-chip')?.getAttribute('title') ?? ''

beforeEach(() => {
  useStudioStore.getState().load({
    version: 1, title: 'T', page,
    spreads: [{ id: 's1', role: 'inner', background: null, elements: [], parked: [], entryId: null }],
  } as unknown as BookDocument)
})

describe('what the stops section lists', () => {
  it('puts the left-out stop among the counting ones, in date order', () => {
    open(stats())

    expect(labels()).toEqual(['Keflavík', 'Reykjavík', 'Akureyri'])
  })

  it('dims the left-out row and says which way each switch stands', () => {
    open(stats())

    const [keflavik, reykjavik] = rows()
    expect(keflavik.className).toContain('is-off')
    expect(stateOf(keflavik)).toContain('journey.studio.stopOff')
    expect(reykjavik.className).not.toContain('is-off')
    expect(stateOf(reykjavik)).toContain('journey.studio.stopOn')
  })

  it('puts an undated stop last', () => {
    open(stats({ excluded: [{ entryId: 3, label: 'Somewhere', date: null }] }))

    expect(labels()).toEqual(['Reykjavík', 'Akureyri', 'Somewhere'])
  })

  /*
   * The country is the first thing a 236px row gives up, and on a journey
   * inside one country it was the same word on every line anyway.
   */
  it('leaves the country off a journey that only went to one', () => {
    open(stats())

    expect(rows().map(r => r.querySelector('.st-badge.is-quiet'))).toEqual([null, null, null])
  })

  it('names the country in the reader\'s language once there is more than one', () => {
    open(stats({
      countries: [
        { code: 'IS', name: 'Iceland', places: 2, firstVisit: '2026-06-02' },
        { code: 'DK', name: 'Denmark', places: 1, firstVisit: '2026-06-10' },
      ],
    }))

    const quiet = rows().map(r => r.querySelector('.st-badge.is-quiet')?.textContent ?? null)
    // The left-out stop carries no country: it is not on the route to have one.
    expect(quiet).toEqual([null, 'Iceland', 'Iceland'])
  })

  /*
   * The fold is the section's own contract: it costs one line when closed and
   * still answers the question anyone opens it for, which is how many stops
   * are counting.
   */
  it('starts folded, with the count of what still counts in its head', () => {
    const { head } = open(stats(), { folded: true })

    expect(rows()).toHaveLength(0)
    expect(head).toHaveAttribute('aria-expanded', 'false')
    expect(head!.querySelector('.st-section-badge')?.textContent).toBe('2/3')
  })

  it('is left out entirely when the journey has no stops at all', () => {
    open(stats({ points: [], excluded: [] }))

    expect(screen.queryByText('journey.studio.stops')).toBeNull()
    expect(screen.getByText('journey.studio.noRoute')).toBeInTheDocument()
  })
})

describe('the switch', () => {
  it('asks to leave a counting stop out', () => {
    const { onToggleStop } = open(stats())

    fireEvent.click(switches()[1])

    expect(onToggleStop).toHaveBeenCalledWith(1, true)
  })

  it('asks to count a left-out stop again', () => {
    const { onToggleStop } = open(stats())

    fireEvent.click(switches()[0])

    expect(onToggleStop).toHaveBeenCalledWith(3, false)
  })

  /*
   * The row does not flip on its own: the figures are the server's sum and
   * arrive with the next stats. What the panel owes the user in the meantime
   * is a chip that cannot be clicked twice, and one that comes free again
   * whether the change landed or not, since a refusal is toasted elsewhere.
   */
  it('holds the chip until the answer comes back, then frees it', async () => {
    let settle: (ok: boolean) => void = () => {}
    const onToggleStop = vi.fn(() => new Promise<boolean>(resolve => { settle = resolve }))
    open(stats(), { onToggleStop })

    fireEvent.click(switches()[1])
    expect(switches()[1]).toBeDisabled()
    // One stop in flight does not lock its neighbours.
    expect(switches()[0]).toBeEnabled()

    await act(async () => { settle(false) })
    expect(switches()[1]).toBeEnabled()
  })

  it('is a label, not a button, for a viewer', () => {
    open(stats(), { canEdit: false })

    expect(switches()).toHaveLength(0)
    expect(rows()).toHaveLength(3)
    expect(stateOf(rows()[1])).toBe('journey.studio.stopOn')
  })

  it('is a label for a stop taken from a trip place, which has no entry to switch', () => {
    open(stats({
      points: [
        point({ entryId: null, label: 'Vík' }),
        point({ lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', entryId: 2 }),
      ],
      excluded: [],
    }))

    expect(labels()).toEqual(['Vík', 'Akureyri'])
    expect(switches()).toHaveLength(1)
    expect(rows()[0].querySelector('button')).toBeNull()
    expect(stateOf(rows()[0])).toBe('journey.studio.stopOn')
  })
})
