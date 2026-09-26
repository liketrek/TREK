import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { dotted } from '../dates'
import { seededTrip, ensureBookingsFixtures, bookingPdfFixture, bookingEmlFixture, BOOKING_EML, HOTEL_TO_BOOK, UNATTACHED_FILE } from './fixtures'
import { openTrip, modal, dialog, portalDialog, importSteps, importTask, dismissImportTask, deleteTripFiles } from './trip-shared'
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

/**
 * A booking's card in the list, by its title.
 *
 * `.last()` because a card holds cards of its own (a traveller pill carries the
 * same class), and the filter keeps only the one that names the booking. The
 * delete question's card names it too, in its body text, and is portalled to the
 * end of the body, so this must not be used while that question stands.
 */
const bookingCard = (page: Page, title: string) => page.locator('.bg-surface-card').filter({ hasText: title }).last()

/** A field of the booking form, by its own label; the block around it is the label's parent. */
const label = (page: Page, text: RegExp) => modal(page).locator('label').filter({ hasText: text }).first()
const block = (page: Page, text: RegExp) => label(page, text).locator('xpath=..')
/** The two-column or three-column row a field shares with its neighbours. */
const row = (page: Page, text: RegExp) => block(page, text).locator('xpath=..')

/** CustomSelect portals its menu to the body: a fixed panel at z-index 99999. */
const selectMenu = (page: Page) => page.locator('body > div[style*="99999"]').last()

const titleBox = (page: Page) => modal(page).getByPlaceholder('e.g. Lufthansa LH123, Hotel Adlon, ...')
const codeBox = (page: Page) => modal(page).getByPlaceholder('e.g. ABC12345')
const timeBox = (page: Page) => modal(page).getByPlaceholder('00:00')
const saveButton = (page: Page, name: 'Add' | 'Update') => modal(page).getByRole('button', { name, exact: true })

/** Type chips and section headers both carry their count inside the accessible name. */
const counted = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name} \\d+$`) })
/** The toolbar's traveller filter: a labelled row of round avatar buttons. */
const travellers = (page: Page) => page.locator('[aria-label="Travelers"]')

/** The card's delete question is its own portal, with no backdrop class to find it by. */
const deleteAsk = (page: Page) => portalDialog(page, page.getByText('Delete booking?', { exact: true }))

/** The Booking Type field at the head of the form is a CustomSelect; this opens it. */
async function openTypeMenu(page: Page): Promise<void> {
  await block(page, /^Booking Type$/).getByRole('button').first().click()
  await expect(selectMenu(page)).toBeVisible()
  await beat(page, 300)
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

/** The filters live for the browser session, the two sections for the trip. */
async function clearPanelState(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  await page.evaluate(id => {
    try {
      sessionStorage.removeItem(`trek-reservation-filters-${id}`)
      sessionStorage.removeItem(`trek-reservation-filters-${id}-travelers`)
      localStorage.removeItem(`trek:bookings-pending-open:${id}`)
      localStorage.removeItem(`trek:bookings-confirmed-open:${id}`)
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
  'create-booking': {
    guide: guide('create-booking'),
    start: openBookings,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Manual Booking' }),
        act: async p => {
          await p.getByRole('button', { name: 'Manual Booking' }).click()
          await expect(modal(p).getByRole('heading', { name: 'New Reservation' })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await openTypeMenu(p)
        },
        target: selectMenu,
        act: async p => {
          await selectMenu(p).getByRole('button', { name: /^Event$/ }).first().click()
          await expect(selectMenu(p)).toHaveCount(0)
          await expect(block(p, /^Booking Type$/).getByRole('button', { name: /Event/ })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => { await typeInto(p, titleBox(p), 'Kabuki at the Minamiza') },
        target: p => block(p, /^Title \*$/),
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
          await chooseIn(p, /^Status$/, /^Confirmed$/)
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
          await p.getByRole('button', { name: 'Manual Booking' }).click()
          await expect(modal(p).getByRole('heading', { name: 'New Reservation' })).toBeVisible()
          await openTypeMenu(p)
        },
        target: selectMenu,
        act: async p => {
          await selectMenu(p).getByRole('button', { name: /^Accommodation$/ }).first().click()
          await expect(selectMenu(p)).toHaveCount(0)
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
        target: p => bookingCard(p, 'teamLab Planets timed entry').getByRole('button', { name: 'Edit' }),
        act: async p => {
          await bookingCard(p, 'teamLab Planets timed entry').getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Edit Reservation' })).toBeVisible()
          await settle(p)
        },
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
          await expect(bookingCard(p, 'teamLab Planets timed entry').getByText('Link to day assignment')).toBeVisible({ timeout: 20_000 })
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
          await bookingCard(p, 'Fushimi Inari night walk').getByRole('button', { name: 'Edit' }).click()
          await expect(label(p, /^Travelers$/)).toBeVisible()
          await settle(p)
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
          const row = travelerList(p).getByRole('button', { name: /jonas/ })
          await row.click()
          await expect(row).toHaveAttribute('aria-pressed', 'true')
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
          await expect(bookingCard(p, 'Fushimi Inari night walk').getByText('jonas')).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => travellers(p).getByTitle('jonas'),
        act: async p => {
          await travellers(p).getByTitle('jonas').click()
          await expect(travellers(p).getByTitle('jonas')).toHaveAttribute('aria-pressed', 'true')
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
          await bookingCard(p, 'teamLab Planets timed entry').getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByRole('button', { name: 'Attach file' })).toBeVisible()
          await settle(p)
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
          await bookingCard(p, 'Kyoto Cycling Tour').getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByRole('button', { name: 'Create expense' })).toBeVisible()
          await settle(p)
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
          await modal(p).getByPlaceholder('0.00').fill('12000')
          await settle(p)
        },
        target: p => block(p, /^Total amount$/),
        act: settle,
      },
      only(p => block(p, /^Who paid\?$/).locator('xpath=..')),
      {
        target: p => modal(p).getByRole('button', { name: 'Add expense', exact: true }),
        act: async p => {
          const save = modal(p).getByRole('button', { name: 'Add expense', exact: true })
          // What was it for? comes prefilled from the booking; without it the button is dead.
          await expect(save).toBeEnabled()
          await save.click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
          // The block only reads Linked expenses once the booking is opened again.
          await bookingCard(p, 'Kyoto Cycling Tour').getByRole('button', { name: 'Edit' }).click()
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
      only(p => counted(p, 'All').locator('xpath=..')),
      {
        prepare: async p => {
          await counted(p, 'Tour').click()
          await settle(p)
        },
        target: p => counted(p, 'Tour'),
        act: async p => {
          await counted(p, 'Event').click()
          await expect(bookingCard(p, 'Lunch at Nishiki')).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => counted(p, 'All'),
        act: async p => {
          await counted(p, 'All').click()
          await expect(bookingCard(p, 'Lunch at Nishiki')).toBeVisible()
          await settle(p)
        },
      },
      // The gesture belongs to booking-travelers; here the row is only pointed at.
      only(travellers),
      {
        target: p => counted(p, 'Pending'),
        act: async p => {
          await counted(p, 'Pending').click()
          await expect(bookingCard(p, 'Haneda Airport P4')).toHaveCount(0)
          await counted(p, 'Pending').click()
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
        target: dialog,
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
        target: p => bookingCard(p, 'Kyoto Cycling Tour').getByRole('button', { name: 'Edit' }),
        act: async p => {
          await bookingCard(p, 'Kyoto Cycling Tour').getByRole('button', { name: 'Edit' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Edit Reservation' })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => { await typeInto(p, codeBox(p), 'KCT-90412') },
        target: p => block(p, /^Booking Code$/),
        act: settle,
      },
      {
        prepare: async p => {
          await block(p, /^Status$/).getByRole('button').first().click()
          await expect(selectMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: p => block(p, /^Status$/),
        act: async p => {
          await selectMenu(p).getByRole('button', { name: /^Confirmed$/ }).click()
          await expect(selectMenu(p)).toHaveCount(0)
          await expect(block(p, /^Status$/).getByRole('button', { name: 'Confirmed' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => saveButton(p, 'Update'),
        act: async p => {
          await saveButton(p, 'Update').click()
          await expect(modal(p)).toHaveCount(0)
          await expect(bookingCard(p, 'Kyoto Cycling Tour').getByText('Confirmed', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
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
        target: p => bookingCard(p, 'Haneda Airport P4').getByRole('button', { name: 'Delete' }),
        act: async p => {
          await bookingCard(p, 'Haneda Airport P4').getByRole('button', { name: 'Delete' }).click()
          await expect(deleteAsk(p)).toBeVisible()
          await settle(p)
        },
      },
      only(deleteAsk),
      {
        target: p => deleteAsk(p).getByRole('button', { name: 'Confirm' }),
        act: async p => {
          await deleteAsk(p).getByRole('button', { name: 'Confirm' }).click()
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
