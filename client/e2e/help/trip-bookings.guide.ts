import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { dotted } from '../dates'
import { seededTrip, ensureBookingsFixtures, bookingPdfFixture, bookingEmlFixture, BOOKING_EML, HOTEL_TO_BOOK, UNATTACHED_FILE } from './fixtures'
import { openTrip, modal, portalDialog, importSteps, importTask, dismissImportTask, deleteTripFiles } from './trip-shared'
import { requireExtractor, allowEmlUploads } from './external'
import { tripBookingsContext, tripBookingsGuides } from '../../src/help/contexts/tripBookings'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Bookings tab of a trip, keyed by the ids in
 * `src/help/contexts/tripBookings.ts`. They run on the seeded "Autumn in Japan"
 * with `ensureBookingsFixtures` in front of them, because the seed's only
 * reservation is a flight and a flight is a transport: without the fixture this
 * tab is its empty state. What a guide creates or changes it puts back in
 * `cleanup`, mostly by deleting the booking and letting the fixture build it
 * again, so the next one starts from the same seven cards.
 */

const guide = (id: string): HelpGuide => {
  const g = tripBookingsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The tab id in the address is the legacy German one; its label is Bookings. */
const openBookings = (page: Page) => openTrip(page, { tab: 'buchungen' })

/** A booking's card in the Cards view: an article named after the booking. */
const bookingCard = (page: Page, title: string) => page.getByRole('article', { name: title, exact: true })
/** The pencil and the bin in a card's head band, named by their tooltips. */
const cardAction = (page: Page, title: string, name: 'Edit' | 'Delete') =>
  bookingCard(page, title).getByRole('button', { name, exact: true })

/** Open a booking's editor from its card, the way the texts tell the reader to. */
async function editFromCard(page: Page, title: string): Promise<void> {
  await cardAction(page, title, 'Edit').click()
  await expect(modal(page).getByRole('heading', { name: 'Edit Reservation' })).toBeVisible()
  await settle(page)
}

// ── The bar ───────────────────────────────────────────────────────────────────

/** The tab's one bar: its heading, then search, filter, the views and the add buttons. */
const toolbar = (page: Page) => page.getByRole('heading', { name: 'Bookings', exact: true, level: 2 }).locator('xpath=..')
const searchBox = (page: Page) => toolbar(page).getByRole('textbox', { name: 'Search', exact: true })
/** The chip that says how many are left ("3 of 7") once anything filters; a click resets. */
const resultsChip = (page: Page) => toolbar(page).getByRole('button', { name: /^\d+ of \d+$/ })
const filterButton = (page: Page) => toolbar(page).getByRole('button', { name: 'Filter', exact: true })
/** The filter panel under the funnel: Status, Type and Travelers. */
const filterMenu = (page: Page) => page.getByRole('menu')
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'View', exact: true })
const viewButton = (page: Page, name: 'Cards' | 'List' | 'Timeline') => viewSwitch(page).getByRole('button', { name, exact: true })

// ── Timeline and detail ───────────────────────────────────────────────────────

/** Trip | Day above the chart. */
const zoom = (page: Page) => page.getByRole('group', { name: 'Zoom', exact: true })
/** A day's heading on the Trip zoom; a click opens that day by the hour. */
const dayHeading = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`Day ${n}$`) })
/** A bar of the timeline, named after its booking. */
const timelineBar = (page: Page, title: string) => page.getByRole('button', { name: title, exact: true })
/** The booking's detail popup, labelled by its title. */
const detail = (page: Page, title: string) => page.getByRole('dialog', { name: title })

/** The booking the views guide opens: a tour on day 5, with a place and travellers. */
const VIEWED = { title: 'Fushimi Inari night walk', day: 5 }

// ── The editor ────────────────────────────────────────────────────────────────

/** A field of the booking form, by its own label; the block around it is the label's parent. */
const label = (page: Page, text: RegExp) => modal(page).locator('label').filter({ hasText: text }).first()
const block = (page: Page, text: RegExp) => label(page, text).locator('xpath=..')
/** The two-column or three-column row a field shares with its neighbours. */
const row = (page: Page, text: RegExp) => block(page, text).locator('xpath=..')
/** A labelled block of a dialog's body whose label is not a `<label>` (Who paid?). */
const section = (page: Page, name: string) =>
  modal(page).locator('section').filter({ has: page.getByText(name, { exact: true }) }).first()

/** CustomSelect portals its menu to the body: a fixed panel at z-index 99999. */
const selectMenu = (page: Page) => page.locator('body > div[style*="99999"]').last()

/** The title is typed into the head band; the field keeps the old placeholder. */
const titleBox = (page: Page) => modal(page).getByPlaceholder('e.g. Lufthansa LH123, Hotel Adlon, ...')
const codeBox = (page: Page) => modal(page).getByPlaceholder('e.g. ABC12345')
const timeBox = (page: Page) => modal(page).getByPlaceholder('00:00')
const saveButton = (page: Page, name: 'Add' | 'Update') => modal(page).getByRole('button', { name, exact: true })

/** The card's delete question is its own portal, with no backdrop class to find it by. */
const deleteAsk = (page: Page) => portalDialog(page, page.getByText('Delete booking?', { exact: true }))

/** The Booking Type is a pill in the head band; its name reads the type after the label. */
const typePill = (page: Page) => modal(page).getByRole('button', { name: /^Booking Type:/ })
/** The pill's list is its own portal, named after the pill's label. */
const typeMenu = (page: Page) => page.getByRole('group', { name: 'Booking Type' })
/** The status pill beside it says what a click turns it into. */
const statusPill = (page: Page) => modal(page).getByRole('button', { name: /^Set to / })

async function openTypeMenu(page: Page): Promise<void> {
  await typePill(page).click()
  await expect(typeMenu(page)).toBeVisible()
  await beat(page, 300)
}

async function pickType(page: Page, type: RegExp): Promise<void> {
  await typeMenu(page).getByRole('button', { name: type }).first().click()
  await expect(typeMenu(page)).toHaveCount(0)
}

async function openManualBooking(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Manual Booking' }).click()
  await expect(modal(page).getByRole('heading', { name: 'New Reservation' })).toBeVisible()
  await settle(page)
}

/** The Travelers field opens its members as a list under it, inside the form. */
const travelerList = (page: Page) => block(page, /^Travelers$/).getByRole('listbox')

/** Open the CustomSelect that belongs to a label and take one option out of it. */
async function chooseIn(page: Page, field: RegExp, option: RegExp, search?: string): Promise<void> {
  await block(page, field).getByRole('button').first().click()
  await expect(selectMenu(page)).toBeVisible()
  if (search) await selectMenu(page).locator('input').fill(search)
  await beat(page, 300)
  await selectMenu(page).getByRole('button', { name: option }).first().click()
  await expect(selectMenu(page)).toHaveCount(0)
}

/**
 * Set a date without touching the calendar: every date field has a keyboard
 * button beside it that swaps in a DD.MM.YYYY box, which is one fill instead of
 * a month of grid cells that move with the trip's dates.
 */
async function setDate(page: Page, nth: number, value: string): Promise<void> {
  await modal(page).getByRole('button', { name: 'Enter date manually' }).nth(nth).click()
  const box = modal(page).getByPlaceholder('DD.MM.YYYY')
  await box.fill(value)
  await box.press('Enter')
  await expect(box).toHaveCount(0)
}

interface Booking {
  id: number
  title: string
}

async function bookingsOf(page: Page): Promise<Booking[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/reservations`)
  const body = (await res.json()) as { reservations?: Booking[] } | Booking[]
  return Array.isArray(body) ? body : (body.reservations ?? [])
}

/**
 * Delete bookings by title. The route takes the stay of an accommodation and
 * the expense linked to a booking with it, so this undoes those too.
 */
async function deleteBookings(page: Page, ...titles: string[]): Promise<void> {
  const { tripId } = seededTrip()
  for (const booking of (await bookingsOf(page)).filter(b => titles.includes(b.title))) {
    await page.request.delete(`/api/trips/${tripId}/reservations/${booking.id}`)
  }
}

/** Put a changed booking back: drop it, then let the fixture build it again. */
async function restore(page: Page, ...titles: string[]): Promise<void> {
  await deleteBookings(page, ...titles)
  await ensureBookingsFixtures(page.request)
}

/**
 * What the tab remembers: the filters per trip for the browser tab, the view,
 * its grouping, sorting and timeline zoom, and the folded sections in the
 * browser. Every test has a context of its own, so this is only tidiness for a
 * guide that runs another after it in the same page.
 */
async function clearPanelState(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  await page.evaluate(id => {
    try {
      sessionStorage.removeItem(`trek-bookings-filters-bookings-${id}`)
      for (const name of ['view', 'group', 'sort', 'timeline', 'transitApart']) localStorage.removeItem(`trek:bookings-bookings-${name}`)
      localStorage.removeItem(`trek:bookings-bookings-collapsed:${id}`)
      localStorage.removeItem('trek.bg-import-tasks')
    } catch {
      /* a browser that refuses storage has nothing to clear */
    }
  }, tripId)
}

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'booking-views': {
    guide: guide('booking-views'),
    start: openBookings,
    steps: [
      {
        // The three icons are the subject; the pointer rests on List so its name shows.
        target: viewSwitch,
        hover: async p => { await viewButton(p, 'List').hover() },
        act: async p => {
          await viewButton(p, 'List').click()
          await expect(viewButton(p, 'List')).toHaveAttribute('aria-pressed', 'true')
          await expect(p.getByRole('button', { name: VIEWED.title, exact: true })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => viewButton(p, 'Timeline'),
        act: async p => {
          await viewButton(p, 'Timeline').click()
          await expect(zoom(p)).toBeVisible()
          await expect(zoom(p).getByRole('button', { name: 'Trip', exact: true })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
      },
      {
        target: p => dayHeading(p, VIEWED.day),
        act: async p => {
          await dayHeading(p, VIEWED.day).click()
          await expect(zoom(p).getByRole('button', { name: 'Day', exact: true })).toHaveAttribute('aria-pressed', 'true')
          await expect(timelineBar(p, VIEWED.title)).toBeVisible()
          await settle(p)
        },
      },
      only(zoom),
      {
        // Hovered for the picture: the bar's card of facts stands beside it.
        target: p => timelineBar(p, VIEWED.title),
        act: async p => {
          await timelineBar(p, VIEWED.title).click()
          await expect(detail(p, VIEWED.title)).toBeVisible()
          await settle(p)
        },
      },
      only(p => detail(p, VIEWED.title)),
    ],
    cleanup: async p => {
      await closeModal(p)
      await clearPanelState(p)
    },
  },
  'create-booking': {
    guide: guide('create-booking'),
    start: openBookings,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Manual Booking' }),
        act: openManualBooking,
      },
      {
        prepare: async p => {
          await openTypeMenu(p)
        },
        target: typeMenu,
        act: async p => {
          await pickType(p, /^Event$/)
          await expect(typePill(p)).toHaveAccessibleName(/^Booking Type:\s*Event$/)
          await settle(p)
        },
      },
      {
        prepare: async p => { await typeInto(p, titleBox(p), 'Kabuki at the Minamiza') },
        target: titleBox,
        act: async p => {
          await expect(saveButton(p, 'Add')).toBeEnabled()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await setDate(p, 0, dotted(-2))
          await timeBox(p).nth(0).fill('16:30')
          await setDate(p, 1, dotted(-2))
          await timeBox(p).nth(1).fill('20:00')
          await settle(p)
        },
        target: p => row(p, /^Date$/),
        act: async p => {
          await expect(saveButton(p, 'Add')).toBeEnabled()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, codeBox(p), 'MZ-5521')
          await statusPill(p).click()
          await expect(statusPill(p)).toHaveAccessibleName('Set to Pending')
        },
        target: p => row(p, /^Booking Code$/),
        act: settle,
      },
      {
        target: p => saveButton(p, 'Add'),
        act: async p => {
          await saveButton(p, 'Add').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, 'Kabuki at the Minamiza')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteBookings(p, 'Kabuki at the Minamiza'),
  },
  'booking-hotel': {
    guide: guide('booking-hotel'),
    start: openBookings,
    steps: [
      {
        prepare: async p => {
          await openManualBooking(p)
          await openTypeMenu(p)
        },
        target: typeMenu,
        act: async p => {
          await pickType(p, /^Accommodation$/)
          await expect(label(p, /^Check-in until$/)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => { await chooseIn(p, /^Accommodation$/, /^Hotel Granvia Kyoto$/, 'Granvia') },
        target: p => block(p, /^Accommodation$/),
        act: async p => {
          await expect(titleBox(p)).toHaveValue(HOTEL_TO_BOOK.name)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await chooseIn(p, /^From$/, /^Day 5 /)
          await chooseIn(p, /^To$/, /^Day 8 /)
        },
        target: p => row(p, /^To$/),
        act: settle,
      },
      {
        prepare: async p => {
          await timeBox(p).nth(0).fill('15:00')
          await timeBox(p).nth(1).fill('23:00')
          await timeBox(p).nth(2).fill('11:00')
          await typeInto(p, codeBox(p), 'GRK-40218')
        },
        target: p => row(p, /^Check-in$/),
        act: settle,
      },
      {
        target: p => saveButton(p, 'Add'),
        act: async p => {
          await saveButton(p, 'Add').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, HOTEL_TO_BOOK.name)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteBookings(p, HOTEL_TO_BOOK.name),
  },
  'link-booking': {
    guide: guide('link-booking'),
    start: openBookings,
    steps: [
      {
        target: p => cardAction(p, 'teamLab Planets timed entry', 'Edit'),
        act: p => editFromCard(p, 'teamLab Planets timed entry'),
      },
      {
        prepare: async p => {
          await block(p, /^Link to day assignment$/).getByRole('button').first().click()
          await expect(selectMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: selectMenu,
        act: async p => {
          await selectMenu(p).getByRole('button', { name: /^2\. teamLab Planets/ }).click()
          await expect(selectMenu(p)).toHaveCount(0)
          await expect(block(p, /^Link to day assignment$/).getByRole('button', { name: /teamLab Planets/ })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => { await chooseIn(p, /^Place \/ Activity$/, /^teamLab Planets$/, 'teamLab') },
        target: p => block(p, /^Place \/ Activity$/),
        act: settle,
      },
      {
        target: p => saveButton(p, 'Update'),
        act: async p => {
          await saveButton(p, 'Update').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, 'teamLab Planets timed entry').getByText('Linked to', { exact: true })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => restore(p, 'teamLab Planets timed entry'),
  },
  'booking-travelers': {
    guide: guide('booking-travelers'),
    start: openBookings,
    steps: [
      {
        prepare: async p => {
          await editFromCard(p, 'Fushimi Inari night walk')
          await expect(label(p, /^Travelers$/)).toBeVisible()
        },
        target: p => block(p, /^Travelers$/),
        act: settle,
      },
      {
        prepare: async p => {
          await block(p, /^Travelers$/).getByRole('button', { expanded: false }).click()
          await expect(travelerList(p)).toBeVisible()
          await beat(p, 300)
        },
        target: travelerList,
        act: async p => {
          const person = travelerList(p).getByRole('button', { name: /jonas/ })
          await person.click()
          await expect(person).toHaveAttribute('aria-pressed', 'true')
          // A click beside the field folds the list away; Escape would close the whole form.
          await label(p, /^Travelers$/).click()
          await expect(travelerList(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => saveButton(p, 'Update'),
        act: async p => {
          await saveButton(p, 'Update').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, 'Fushimi Inari night walk').getByText('jonas', { exact: true })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await filterButton(p).click()
          await expect(filterMenu(p)).toBeVisible()
          await settle(p)
        },
        // The people are a row of chips under the panel's Travelers caption.
        target: p => filterMenu(p).getByRole('button', { name: /jonas$/ }).locator('xpath=..'),
        act: async p => {
          const person = filterMenu(p).getByRole('button', { name: /jonas$/ })
          await person.click()
          await expect(person).toHaveAttribute('aria-pressed', 'true')
          await expect(bookingCard(p, 'Kyoto Cycling Tour')).toHaveCount(0)
          await expect(bookingCard(p, 'Fushimi Inari night walk')).toBeVisible()
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await clearPanelState(p)
      await restore(p, 'Fushimi Inari night walk')
    },
  },
  'booking-files': {
    guide: guide('booking-files'),
    start: openBookings,
    steps: [
      {
        prepare: async p => {
          await editFromCard(p, 'teamLab Planets timed entry')
          await expect(modal(p).getByRole('button', { name: 'Attach file' })).toBeVisible()
        },
        target: p => modal(p).getByRole('button', { name: 'Attach file' }),
        act: async p => {
          // Set the hidden input directly: clicking the button opens the file
          // picker of the operating system, which Playwright cannot photograph.
          await modal(p).locator('input[type="file"]').setInputFiles(bookingPdfFixture('teamlab-tickets'))
          await expect(modal(p).getByText('teamlab-tickets.pdf')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      only(p => modal(p).getByText('teamlab-tickets.pdf').locator('xpath=..')),
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Link existing file' }).click()
          await expect(modal(p).getByRole('button', { name: UNATTACHED_FILE, exact: true })).toBeVisible()
          await beat(p, 300)
        },
        target: p => modal(p).getByRole('button', { name: 'Link existing file' }).locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: UNATTACHED_FILE, exact: true }).click()
          await expect(modal(p).getByRole('button', { name: UNATTACHED_FILE, exact: true })).toHaveCount(0)
          await expect(modal(p).getByText(UNATTACHED_FILE)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => saveButton(p, 'Update'),
        act: async p => {
          await saveButton(p, 'Update').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, 'teamLab Planets timed entry').getByText('teamlab-tickets.pdf')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    // Deleting the booking takes the link row to the voucher with it, so the
    // voucher is unattached again and Link existing file offers it next time.
    cleanup: async p => {
      const { tripId } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/files`)
      const { files = [] } = (await res.json()) as { files?: { id: number; original_name: string }[] }
      for (const file of files.filter(f => f.original_name === 'teamlab-tickets.pdf')) {
        await p.request.delete(`/api/trips/${tripId}/files/${file.id}`)
      }
      await restore(p, 'teamLab Planets timed entry')
    },
  },
  'booking-cost': {
    guide: guide('booking-cost'),
    start: openBookings,
    steps: [
      {
        prepare: async p => {
          await editFromCard(p, 'Kyoto Cycling Tour')
          await expect(modal(p).getByRole('button', { name: 'Create expense' })).toBeVisible()
        },
        target: p => block(p, /^Costs$/),
        act: settle,
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create expense' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create expense' }).click()
          await expect(p.getByRole('heading', { name: 'Add expense' })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await block(p, /^Total amount$/).locator('input').first().fill('12000')
          await settle(p)
        },
        target: p => row(p, /^Total amount$/),
        act: settle,
      },
      only(p => section(p, 'Who paid?')),
      {
        target: p => modal(p).getByRole('button', { name: 'Add expense', exact: true }),
        act: async p => {
          const save = modal(p).getByRole('button', { name: 'Add expense', exact: true })
          // The name comes prefilled from the booking; without it the button is dead.
          await expect(save).toBeEnabled()
          await save.click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
          // The block only reads Linked expenses once the booking is opened again.
          await editFromCard(p, 'Kyoto Cycling Tour')
          await expect(label(p, /^Linked expenses$/)).toBeVisible({ timeout: 20_000 })
          // The block sits at the foot of a long form: bring it into the picture.
          await label(p, /^Linked expenses$/).evaluate(el => el.scrollIntoView({ block: 'center' }))
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await restore(p, 'Kyoto Cycling Tour')
    },
  },
  'filter-bookings': {
    guide: guide('filter-bookings'),
    start: openBookings,
    steps: [
      {
        prepare: async p => {
          await typeInto(p, searchBox(p), 'Kyoto')
          await expect(resultsChip(p)).toBeVisible()
          await expect(bookingCard(p, 'Haneda Airport P4')).toHaveCount(0)
          await settle(p)
        },
        // The box around the field, with its magnifier.
        target: p => searchBox(p).locator('xpath=..'),
        act: async p => {
          await searchBox(p).press('Escape')
          await expect(searchBox(p)).toHaveValue('')
          await expect(bookingCard(p, 'Haneda Airport P4')).toBeVisible()
          await settle(p)
        },
      },
      {
        target: filterButton,
        act: async p => {
          await filterButton(p).click()
          await expect(filterMenu(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The three choices sit on one grey track under the Status caption.
        target: p => filterMenu(p).getByRole('button', { name: 'Pending', exact: true }).locator('xpath=..'),
        act: async p => {
          await filterMenu(p).getByRole('button', { name: 'Pending', exact: true }).click()
          await expect(bookingCard(p, 'Fushimi Inari night walk')).toHaveCount(0)
          await expect(bookingCard(p, 'Kyoto Cycling Tour')).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => filterMenu(p).getByRole('button', { name: /^Tour\b/ }),
        act: async p => {
          await filterMenu(p).getByRole('button', { name: /^Tour\b/ }).click()
          await expect(bookingCard(p, 'Haneda Airport P4')).toHaveCount(0)
          await expect(bookingCard(p, 'Kyoto Cycling Tour')).toBeVisible()
          await settle(p)
        },
      },
      {
        target: resultsChip,
        act: async p => {
          await resultsChip(p).click()
          await expect(resultsChip(p)).toHaveCount(0)
          await expect(bookingCard(p, 'Fushimi Inari night walk')).toBeVisible()
          await expect(bookingCard(p, 'Haneda Airport P4')).toBeVisible()
          await settle(p)
        },
      },
    ],
    cleanup: clearPanelState,
  },
  'import-booking-file': {
    guide: guide('import-booking-file'),
    // The extractor, and no addon: with it answering, the dialog sends mode
    // no-ai and no model is asked. The mail has to be an allowed file type or
    // the review would save the booking and drop the document without a word.
    start: async p => {
      await requireExtractor(p.request)
      await allowEmlUploads(p.request, true)
      await openBookings(p)
    },
    steps: [
      ...importSteps(bookingEmlFixture, BOOKING_EML),
      {
        prepare: async p => {
          // The card is there at once, spinning. The picture wants it finished:
          // the tick and the Import it offers. The extractor has 30 s in the
          // backend, and on a Windows media host that is a docker run, so the
          // wait is generous rather than tight.
          await expect(importTask(p, BOOKING_EML).getByRole('button', { name: 'Import', exact: true })).toBeVisible({ timeout: 90_000 })
          await settle(p)
        },
        target: p => importTask(p, BOOKING_EML),
        act: async p => {
          await importTask(p, BOOKING_EML).getByRole('button', { name: 'Import', exact: true }).click()
          await expect(modal(p).getByRole('heading', { name: 'New Reservation' })).toBeVisible({ timeout: 20_000 })
          await expect(titleBox(p)).toHaveValue(HOTEL_TO_BOOK.name)
          await expect(codeBox(p)).toHaveValue('GRK-40218')
          await expect(modal(p).getByText(BOOKING_EML)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('dialog'),
        act: async p => {
          await saveButton(p, 'Add').click()
          await expect(modal(p)).toHaveCount(0, { timeout: 20_000 })
          await expect(bookingCard(p, HOTEL_TO_BOOK.name)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await dismissImportTask(p, BOOKING_EML)
      await allowEmlUploads(p.request, false)
      await clearPanelState(p)
      // The route takes the stay and the expense with the booking; the mail it
      // attached stays behind in Files like any unlinked document.
      await deleteBookings(p, HOTEL_TO_BOOK.name)
      await deleteTripFiles(p, BOOKING_EML)
    },
  },
  'edit-booking': {
    guide: guide('edit-booking'),
    start: openBookings,
    steps: [
      {
        target: p => cardAction(p, 'Kyoto Cycling Tour', 'Edit'),
        act: p => editFromCard(p, 'Kyoto Cycling Tour'),
      },
      {
        prepare: async p => { await typeInto(p, codeBox(p), 'KCT-90412') },
        target: p => block(p, /^Booking Code$/),
        act: settle,
      },
      {
        target: statusPill,
        act: async p => {
          await expect(statusPill(p)).toHaveAccessibleName('Set to Confirmed')
          await statusPill(p).click()
          await expect(statusPill(p)).toHaveAccessibleName('Set to Pending')
          await expect(statusPill(p)).toHaveText('Confirmed')
          await settle(p)
        },
      },
      {
        target: p => saveButton(p, 'Update'),
        act: async p => {
          await saveButton(p, 'Update').click()
          await expect(modal(p)).toHaveCount(0)
          // A confirmed card's status dot offers the way back to Pending.
          await expect(bookingCard(p, 'Kyoto Cycling Tour').getByRole('button', { name: 'Set to Pending' })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => restore(p, 'Kyoto Cycling Tour'),
  },
  'delete-booking': {
    guide: guide('delete-booking'),
    start: openBookings,
    steps: [
      {
        target: p => cardAction(p, 'Haneda Airport P4', 'Delete'),
        act: async p => {
          await cardAction(p, 'Haneda Airport P4', 'Delete').click()
          await expect(deleteAsk(p)).toBeVisible()
          await settle(p)
        },
      },
      only(deleteAsk),
      {
        target: p => deleteAsk(p).getByRole('button', { name: 'Delete', exact: true }),
        act: async p => {
          await deleteAsk(p).getByRole('button', { name: 'Delete', exact: true }).click()
          await expect(bookingCard(p, 'Haneda Airport P4')).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => ensureBookingsFixtures(p.request),
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureBookingsFixtures(request)
})

test('every registered bookings guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripBookingsContext.guides].sort())
})

test('hero: trip-bookings', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripBookingsContext.id, openBookings)
})

for (const id of tripBookingsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
