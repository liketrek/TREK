import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureDaysFixtures } from './fixtures'
import { openTrip, openTripOnDay, modal, portalDialog, selectDay, closeDayDetails, closeMenu, dayDetails } from './trip-shared'
import { tripDaysContext, tripDaysGuides } from '../../src/help/contexts/tripDays'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the days column of a trip, keyed by the ids in
 * `src/help/contexts/tripDays.ts`. The seeded trip gets a timed stop, a
 * reservation at a stop, a train and a hotel first, so the cards show every
 * kind of row; a guide that changes the plan puts it back in `cleanup`.
 */

const guide = (id: string): HelpGuide => {
  const g = tripDaysGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const SPARE = { name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, address: '4 Chome Tsukiji, Chuo City, Tokyo' }
/** The note the day-note guide writes: a name for the card, markdown underneath. */
const NOTE = { title: 'Rain plan', body: '**Tokyo National Museum** instead of the shrine, tickets at the gate.' }

/** A day card's header button. */
/**
 * The day the route guides read. Day 6 is the only one whose two stops sit next
 * to each other: day 1's are separated by the flight, so it has no leg of its
 * own and its only connector is the one to the booked night, which depends on a
 * fixture. Day 6 also carries a reservation at a stop, so one card shows every
 * row the guide talks about.
 */
const ROUTED_DAY = 6
/** The pencil that renames the open day, in its details panel. */
const renameDay = (page: Page) => dayDetails(page).getByRole('button', { name: 'Edit', exact: true })
const dayHeader = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) })
/**
 * A stop row. Every row of a day card is a div with `role="button"`; a stop is
 * the one whose accessible name opens with the label of the lock on its
 * picture, which is what tells it from the note and booking rows beside it.
 */
const stop = (page: Page, name: string) =>
  page
    .getByRole('button', { name: /^(Keep position during route optimization|Click to unlock) / })
    .filter({ hasText: name })
    .first()
/** A booking row of a day: its phase (Departure / Arrival) and title make its name. */
const bookingRow = (page: Page, name: RegExp) => page.getByRole('button', { name })
/** The note the day-note guide left on day 2, as a row of the card. */
const noteRow = (page: Page) => page.getByRole('button', { name: new RegExp(`^${NOTE.title}`) })
/** A row of the places column. */
const placeRow = (page: Page, name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }).first()
/**
 * The context menu of a stop, a note or a leg. Tooltip renders into the same
 * `.trek-popover-enter` class and a click on a connector leaves its tooltip
 * standing, so the menu is the popover that is not one.
 */
const menu = (page: Page) => page.locator('.trek-popover-enter:not([role="tooltip"])').last()
/** The route bar of the open day: Route, the two hand-offs, Optimize, the modes. */
const routeBar = (page: Page) => page.getByRole('button', { name: 'Route', exact: true }).locator('xpath=..')
const toolbar = (page: Page) => page.getByRole('button', { name: 'Export' }).locator('xpath=..')
/**
 * A connector between two stops, once the day's route is computed. The hotel
 * bookend legs carry the same label and are not between two stops, so they are
 * filtered out by the hotel icon only they have.
 */
/**
 * A leg between two rows of a day, ringed by its travel time. Day 1's is the one
 * to the booked night: the flight sits between its two stops, so they have no
 * leg of their own, and the day fixtures put a hotel on the first four nights.
 */
const connector = (page: Page) => page.getByRole('button', { name: 'Change travel mode' }).first()
/** The note dialog: its own portal with no backdrop class, known by its body field. */
const noteBody = (page: Page) => page.getByPlaceholder('Details, links, reminders…')
const noteDialog = (page: Page) => portalDialog(page, noteBody(page))
/** The question a timed stop asks before it moves; also a portal of its own. */
const timeConfirm = (page: Page) => portalDialog(page, page.getByText('Remove time?'))
/** The reorder popup's panel, the list and its footer, or the question a bin asks in its place. */
const reorderPopup = (page: Page) => page.locator('.trek-modal-enter').filter({ hasText: 'Reorder days' })

async function createSpare(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  const created = await page.request.post(`/api/trips/${tripId}/places`, { data: SPARE })
  if (!created.ok()) throw new Error(`could not create the spare place: ${created.status()} ${await created.text()}`)
}

async function deleteByName(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(body) ? body : (body.places ?? [])
  for (const place of places.filter(x => names.includes(x.name))) {
    await page.request.delete(`/api/trips/${tripId}/places/${place.id}`)
  }
}

/**
 * Open the trip on day 1 and draw its route, so the connectors between the
 * stops exist. The day stays selected with its details panel up: the panel is
 * the selection, and the route tools render for the selected day only.
 */
async function openWithRoute(page: Page): Promise<void> {
  await openTripOnDay(page, ROUTED_DAY)
  await page.getByRole('button', { name: 'Route', exact: true }).click()
  await expect(connector(page)).toBeVisible({ timeout: 30_000 })
  await settle(page)
}

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'read-day-plan': {
    guide: guide('read-day-plan'),
    start: openWithRoute,
    steps: [
      only(p => dayHeader(p, ROUTED_DAY)),
      only(p => stop(p, 'Arashiyama Bamboo Grove')),
      only(p => stop(p, 'Nishiki Market')),
      only(connector),
      only(routeBar),
    ],
  },
  'place-onto-day': {
    guide: guide('place-onto-day'),
    start: async p => {
      await createSpare(p)
      // Day 1 stays open: the "+" of a place row and "To day" exist only while
      // a day is selected, and steps 2 and 4 are about those two.
      await openTripOnDay(p, 1)
    },
    steps: [
      {
        target: p => placeRow(p, SPARE.name),
        dropTo: p => dayHeader(p, 2).locator('xpath=..'),
        act: async p => {
          await placeRow(p, SPARE.name).dragTo(dayHeader(p, 2))
          await expect(stop(p, SPARE.name)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The "+" offers the OPEN day, so it is still there with the place on
        // day 2 — and the place stays on a day, which is what the result says.
        prepare: async p => { await placeRow(p, SPARE.name).hover() },
        target: p => placeRow(p, SPARE.name).getByRole('button'),
      },
      only(p => p.getByRole('button', { name: 'Add place to this day' }).first()),
      only(p => p.getByRole('button', { name: 'Add to the open day' })),
    ],
    cleanup: p => deleteByName(p, SPARE.name),
  },
  'reorder-stops': {
    guide: guide('reorder-stops'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => stop(p, 'teamLab Planets').locator('svg.lucide-grip-vertical').locator('xpath=..'),
        dropTo: p => stop(p, 'Senso-ji Temple'),
      },
      {
        prepare: async p => { await stop(p, 'teamLab Planets').hover() },
        target: p => stop(p, 'teamLab Planets').locator('button:has(svg.lucide-chevron-up)'),
      },
      {
        target: p => stop(p, 'teamLab Planets'),
        dropTo: p => dayHeader(p, 2).locator('xpath=..'),
      },
      {
        prepare: async p => {
          // Only a move that breaks the day's chronology asks, and the arrows
          // never do here: the timed stop is the first row of the day. Dropping
          // it below the 13:05 departure does, and Cancel leaves the day alone.
          const booking = bookingRow(p, /Departure.*LH716/)
          const box = await booking.boundingBox()
          if (!box) throw new Error('the departure row of day 1 has no box')
          await stop(p, 'Senso-ji Temple').dragTo(booking, { targetPosition: { x: box.width / 2, y: box.height - 4 } })
          await expect(timeConfirm(p)).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        target: timeConfirm,
        act: async p => {
          await timeConfirm(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.getByText('Remove time?')).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },
  'set-stop-times': {
    guide: guide('set-stop-times'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => {
          await stop(p, 'teamLab Planets').click({ button: 'right' })
          await expect(menu(p).getByRole('button', { name: 'Edit' })).toBeVisible()
          await beat(p, 300)
        },
        target: menu,
        act: async p => {
          await menu(p).getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByText('Start', { exact: true })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          // The time pickers are text fields that parse on blur.
          const times = modal(p).getByPlaceholder(/^(00:00|2:30 PM)$/)
          await times.first().fill('13:00')
          await times.first().blur()
          await times.nth(1).fill('15:00')
          await times.nth(1).blur()
          await beat(p, 300)
        },
        target: p => modal(p).getByText('Start', { exact: true }).locator('xpath=../..'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Update', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Update', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(stop(p, 'teamLab Planets').getByText('13:00')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId, dayIds } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/days/${dayIds[0]}/assignments`)
      const body = (await res.json()) as { assignments?: { id: number; place?: { name: string }; place_name?: string }[] }
      for (const a of body.assignments ?? []) {
        if ((a.place?.name ?? a.place_name) === 'teamLab Planets') {
          await p.request.put(`/api/trips/${tripId}/assignments/${a.id}/time`, { data: { place_time: null, end_time: null } })
        }
      }
    },
  },
  'remove-from-day': {
    guide: guide('remove-from-day'),
    start: async p => {
      await createSpare(p)
      // The "+" puts the place on the OPEN day, so day 1 stays selected.
      await openTripOnDay(p, 1)
      await placeRow(p, SPARE.name).hover()
      await placeRow(p, SPARE.name).getByRole('button').click()
      await expect(stop(p, SPARE.name)).toBeVisible({ timeout: 15_000 })
      await settle(p)
    },
    steps: [
      {
        prepare: async p => {
          await stop(p, SPARE.name).click({ button: 'right' })
          await expect(menu(p).getByRole('button', { name: 'Remove from day' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => menu(p).getByRole('button', { name: 'Remove from day' }),
        act: async p => {
          await menu(p).getByRole('button', { name: 'Remove from day' }).click()
          await expect(stop(p, SPARE.name)).toHaveCount(0, { timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => placeRow(p, SPARE.name)),
    ],
    cleanup: p => deleteByName(p, SPARE.name),
  },
  'lock-stop': {
    guide: guide('lock-stop'),
    start: p => openTrip(p),
    steps: [
      {
        prepare: async p => { await stop(p, 'teamLab Planets').hover() },
        target: p => stop(p, 'teamLab Planets').getByRole('button', { name: 'Keep position during route optimization' }),
        act: async p => {
          await stop(p, 'teamLab Planets').getByRole('button', { name: 'Keep position during route optimization' }).click()
          await expect(stop(p, 'teamLab Planets').getByRole('button', { name: 'Click to unlock' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => stop(p, 'teamLab Planets').getByRole('button', { name: 'Click to unlock' }),
        act: async p => {
          await stop(p, 'teamLab Planets').getByRole('button', { name: 'Click to unlock' }).click()
        },
      },
    ],
  },
  'day-note': {
    guide: guide('day-note'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => dayHeader(p, 2).getByRole('button', { name: 'Add Note' }),
        act: async p => {
          await dayHeader(p, 2).getByRole('button', { name: 'Add Note' }).click()
          await expect(noteBody(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          // Note is the name the day card shows and the only required field;
          // Daily Note below it is the markdown the toolbar formats.
          await typeInto(p, noteDialog(p).getByPlaceholder('Note', { exact: true }), NOTE.title)
          await typeInto(p, noteBody(p), NOTE.body)
          await beat(p, 300)
        },
        target: p => noteBody(p).locator('xpath=ancestor::div[2]'),
      },
      {
        target: p => noteDialog(p).getByText('Icon', { exact: true }).locator('xpath=../..'),
        act: async p => {
          await noteDialog(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(noteDialog(p)).toHaveCount(0)
          await expect(noteRow(p)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await noteRow(p).click({ button: 'right' })
          await expect(menu(p).getByRole('button', { name: 'Edit' })).toBeVisible()
          await beat(p, 300)
        },
        target: noteRow,
        act: closeMenu,
      },
    ],
    cleanup: async p => {
      const { tripId, dayIds } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/days/${dayIds[1]}/notes`)
      const body = (await res.json()) as { notes?: { id: number; text: string }[] } | { id: number; text: string }[]
      const notes = Array.isArray(body) ? body : (body.notes ?? [])
      for (const note of notes.filter(n => n.text.startsWith(NOTE.title))) {
        await p.request.delete(`/api/trips/${tripId}/days/${dayIds[1]}/notes/${note.id}`)
      }
    },
  },
  'day-route': {
    guide: guide('day-route'),
    start: p => openTripOnDay(p, ROUTED_DAY),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Route', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Route', exact: true }).click()
          await expect(connector(p)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(p => routeBar(p).getByRole('button', { name: 'Driving' }).locator('xpath=..')),
      {
        prepare: async p => {
          await connector(p).click()
          await expect(menu(p).getByRole('button', { name: 'Use day default' })).toBeVisible()
          await beat(p, 300)
        },
        target: menu,
        act: closeMenu,
      },
      only(p => p.getByRole('button', { name: 'Optimize' })),
      // The two hand-offs are siblings with no wrapper of their own: their
      // parent is the whole route bar, which is already read-day-plan's step 5.
      only(p => p.getByRole('button', { name: 'Open in Google Maps' })),
    ],
  },
  'manage-days': {
    guide: guide('manage-days'),
    start: p => openTrip(p),
    steps: [
      only(p => dayHeader(p, 1)),
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Reorder days' }).click()
          await expect(p.getByText('Reorder days').first()).toBeVisible()
          await settle(p)
        },
        // The whole popup: the rows with their arrows and bins, and the two ways
        // of adding a day in its footer.
        target: reorderPopup,
      },
      {
        // The question before a day goes, answered with Cancel: the picture shows
        // what would go with the second day, its places and its landing, and the
        // seed keeps all of its days.
        prepare: async p => {
          await reorderPopup(p).getByRole('button', { name: 'Delete day' }).nth(1).click()
          await expect(p.getByRole('heading', { name: /^Delete .+\?$/ })).toBeVisible()
          await settle(p)
        },
        target: reorderPopup,
        act: async p => {
          await reorderPopup(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.getByRole('heading', { name: /^Delete .+\?$/ })).toHaveCount(0)
          await reorderPopup(p).getByRole('button', { name: 'Close', exact: true }).last().click()
          await expect(reorderPopup(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          // The steps before leave the first day selected, and a click on a
          // selected day folds its panel away: a second one brings it back.
          await dayHeader(p, 1).click({ position: { x: 22, y: 20 } })
          await settle(p)
          if (!(await dayDetails(p).isVisible())) await selectDay(p, 1)
          await expect(renameDay(p)).toBeVisible()
          await settle(p)
        },
        // Scoped to the panel: a stop row carries an Edit of its own, so the
        // bare name matches two buttons as soon as any day is unfolded.
        target: p => renameDay(p).locator('xpath=..'),
        act: closeDayDetails,
      },
      only(p => p.getByRole('button', { name: /Expand all days|Collapse all days/ })),
    ],
  },
  'bookings-in-plan': {
    guide: guide('bookings-in-plan'),
    start: async p => {
      await openTrip(p, { day: 5 })
    },
    steps: [
      // The flight, not the train: Departure and Arrival are what a booking
      // gets when it crosses days, and the train starts and ends on one.
      only(p => bookingRow(p, /^Departure LH716/)),
      {
        prepare: async p => { await selectDay(p, 6); await closeDayDetails(p) },
        target: p => stop(p, 'Nishiki Market'),
      },
      {
        prepare: async p => {
          await selectDay(p, 1)
          await expect(p.getByText('Accommodation', { exact: true }).first()).toBeVisible()
          await settle(p)
        },
        target: p => p.getByText('Accommodation', { exact: true }).first().locator('xpath=..'),
        act: closeDayDetails,
      },
      only(p => toolbar(p).getByRole('button', { name: /Show all booking routes|Hide all booking routes/ })),
      {
        prepare: async p => { await stop(p, 'Senso-ji Temple').hover() },
        target: p => stop(p, 'Senso-ji Temple').getByRole('button', { name: 'Add booking' }),
      },
    ],
  },
  'export-plan': {
    guide: guide('export-plan'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Export' }),
        act: async p => {
          await p.getByRole('button', { name: 'Export' }).click()
          await expect(modal(p).getByText('Document', { exact: true })).toBeVisible()
          await settle(p)
        },
      },
      only(p => modal(p).getByText('Document', { exact: true }).locator('xpath=..')),
      only(p => modal(p).getByText('Calendar', { exact: true }).locator('xpath=..')),
      only(p => modal(p).getByText(/^Maps & GPS/).locator('xpath=..')),
    ],
    cleanup: closeModal,
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureDaysFixtures(request)
})

test('every registered days guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripDaysContext.guides].sort())
})

test('hero: trip-days', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  // The plan as it opens: the details panel is trip-day-detail's subject and the
  // route is day-route's, so the hero shows neither.
  await captureHero(page, tripDaysContext.id, p => openTrip(p))
})

for (const id of tripDaysContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
