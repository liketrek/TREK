import { test, expect, type Locator, type Page } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureTransportFixtures, TRANSIT_JOURNEY, flightEmlFixture, FLIGHT_EML, FLIGHT_TO_IMPORT } from './fixtures'
import { openTrip, openTripOnDay, selectDay, modal, dialog, portalDialog, importSteps, importTask, dismissImportTask, deleteTripFiles } from './trip-shared'
import { ensureAirtrailConnection, disconnectAirtrail, AIRTRAIL_FLIGHTS, requireExtractor, allowEmlUploads } from './external'
import { tripTransportsContext, tripTransportsGuides } from '../../src/help/contexts/tripTransports'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Transports tab of a trip, keyed by the ids in
 * `src/help/contexts/tripTransports.ts`. They run on the seeded "Autumn in
 * Japan" with the transports `ensureTransportFixtures` adds up front, so the
 * tab has a type chip per group and a planned connection to open; what a guide
 * creates it takes away again in `cleanup`, so the next one starts the same.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTransportsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The flight the seed creates. Its row on day 1 carries the Departure span label. */
const FLIGHT = { title: 'LH716', row: /^Departure LH716/ }
/**
 * The connection the fixtures store on day 6, so no guide has to search for one
 * first. Its card writes the two ends either side of an arrow icon, with no
 * text between them, so `hasText` gets the first end rather than the title.
 */
const JOURNEY = { title: TRANSIT_JOURNEY, onCard: 'Arashiyama Bamboo Grove' }
/** What plan-transit plans on day 1; the title the panel builds from the two ends. */
const PLANNED = 'Senso-ji Temple → teamLab Planets'
/** What add-transport creates. Both ends are searched, so the map has something to draw. */
const TAXI = {
  title: 'Taxi to teamLab Planets',
  from: { query: 'Senso-ji Temple Tokyo', match: /^Sens/ },
  to: { query: 'teamLab Planets', match: /^teamLab/ },
}

/** A day card's header: number, weather, "Day n", date, and the four action buttons. */
const dayHeader = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) })
/** A booking card in the tab, told apart by what is written on it. */
const card = (page: Page, text: string) => page.locator('.bg-surface-card').filter({ hasText: text }).first()
/** A transport's row in the day plan; the whole row is the button that opens it. */
const transportRow = (page: Page, name: RegExp) => page.getByRole('button', { name }).first()
/** A toolbar type chip or a section heading — both are a label followed by their count. */
const counted = (page: Page, label: string) => page.getByRole('button', { name: new RegExp(`^${label} \\d+$`) })
/** A labelled field block inside the open dialog. */
const block = (page: Page, label: string) => modal(page).getByText(label, { exact: true }).locator('xpath=..')
/** CustomSelect portals its menu to the body: a fixed panel at z-index 99999. */
const selectMenu = (page: Page) => page.locator('body > div[style*="99999"]').last()
/** The leg-mode popover, told apart from the connector's tooltip by what stands in it. */
const legMenu = (page: Page) =>
  page.locator('.trek-popover-enter').filter({ has: page.getByRole('button', { name: 'Use day default' }) }).last()
/** The travel-time connector between two stops of the open day. */
const connector = (page: Page) => page.getByRole('button', { name: 'Change travel mode' }).first()
/** The transit search's stop boxes, and the transport form's location boxes. */
const stopBox = (page: Page, n: number) => modal(page).getByPlaceholder('Search stop or station…').nth(n)
const locationBox = (page: Page, n: number) => modal(page).getByPlaceholder('Search station, port, address…').nth(n)
/**
 * Both pickers are an input in its own relative wrapper with the result list as
 * the wrapper's second child, so one expression finds either one's suggestions.
 */
const suggestions = (box: Locator) => box.locator('xpath=../..').locator('> div').nth(1)
/** A result of the transit search: the card's own toggle carries the times as its name. */
const itinerary = (page: Page, n: number) =>
  modal(page).getByRole('button', { name: /^\d{1,2}:\d{2} – \d{1,2}:\d{2} / }).nth(n)
/** The read-only sheet an endpoint marker on the map opens; its own portal, no shared class. */
const transportSheet = (page: Page) => portalDialog(page, page.getByRole('button', { name: 'Close' }))

async function searchLocation(page: Page, box: Locator, query: string, match: RegExp): Promise<void> {
  await box.click()
  await typeInto(page, box, query)
  const options = suggestions(box).locator('button')
  await expect(options.first()).toBeVisible({ timeout: 25_000 })
  // The suggestion that answers the query, not whatever came back first: this
  // list is a live geocoder and its top hit for a landmark is as often a shop
  // down the road, which then travels into the picture as the wrong address.
  const wanted = options.filter({ hasText: match }).first()
  await expect(wanted, `no suggestion for "${query}" matching ${match}`).toBeVisible({ timeout: 25_000 })
  await wanted.click()
  await expect(box).toHaveValue(match, { timeout: 15_000 })
}

/** The transit search offers the day's own stops as soon as the box has focus. */
async function pickStop(page: Page, box: Locator, name: string): Promise<void> {
  await box.click()
  const option = suggestions(box).getByRole('button', { name })
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.click()
  await expect(box).toHaveValue(name, { timeout: 10_000 })
}

type ReservationRow = { id: number; title: string; confirmation_number: string | null }

async function deleteWhere(page: Page, matches: (r: ReservationRow) => boolean): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/reservations`)
  const body = (await res.json()) as { reservations?: ReservationRow[] } | ReservationRow[]
  const list = Array.isArray(body) ? body : (body.reservations ?? [])
  for (const r of list.filter(matches)) {
    await page.request.delete(`/api/trips/${tripId}/reservations/${r.id}`)
  }
}

const deleteByTitle = (page: Page, ...titles: string[]) => deleteWhere(page, r => titles.includes(r.title))
/** The imported flight's title is the extractor's; its booking code is the fixture's. */
const deleteByCode = (page: Page, code: string) => deleteWhere(page, r => r.confirmation_number === code)

/**
 * What import-transport-file reads out of its e-ticket. The title is the
 * mapper's (airline and number joined), so the form and the card are checked
 * by what the fixture owns: the code, and the two airports the built-in table
 * resolves from their IATA codes.
 */
const IMPORTED = { code: FLIGHT_TO_IMPORT.code, from: /\(HND\)$/, to: /\(FRA\)$/ }
/** The two AirportSelect boxes of a flight's form, departure first. */
const airportBoxes = (page: Page) => modal(page).getByPlaceholder('Airport code or city (e.g. FRA)')

/**
 * What the AirTrail account holds (external.ts): two flights home on the last
 * day that connect in Tokyo, which the picker offers to join, and the Lisbon
 * weekend in spring for its Other flights. The joined booking's title is the
 * mapper's route, the airport codes joined by arrows (airtrail.mapper.ts).
 */
const [OUT_LEG, HOME_LEG, , OTHER] = AIRTRAIL_FLIGHTS
const JOINED = { title: `${OUT_LEG.from} → ${OUT_LEG.to} → ${HOME_LEG.to}`, layover: OUT_LEG.to }

/** The toolbar's AirTrail button; its label is visible at this viewport, the title is the picker's name. */
const airtrailButton = (page: Page) => page.getByRole('button', { name: 'AirTrail', exact: true })
/** The flight picker is a bare portal like the booking import; its title tells it apart. */
const airtrailPicker = (page: Page) => portalDialog(page, page.getByText('Import from AirTrail', { exact: true }))
/** A flight's row in the picker: a button named by the airline and the flight number. */
const flightRow = (page: Page, flightNumber: string) =>
  airtrailPicker(page).getByRole('button', { name: new RegExp(`\\b${flightNumber}\\b`) })
/** The join tick under a connection's legs, and the framed group it belongs to. */
const joinToggle = (page: Page) =>
  airtrailPicker(page).getByRole('button', { name: /^Import as one flight with a layover in / })
const connectionGroup = (page: Page) => joinToggle(page).locator('xpath=..')
const importCta = (page: Page) => airtrailPicker(page).getByRole('button', { name: /^Import \d+$/ })

/** Give a day's legs back to the day's own mode, whichever stop carries the one that was set. */
async function resetLegModes(page: Page, dayIndex: number): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/days/${dayIds[dayIndex]}/assignments`)
  const body = (await res.json()) as { assignments?: { id: number }[] }
  for (const a of body.assignments ?? []) {
    await page.request.put(`/api/trips/${tripId}/assignments/${a.id}/transport`, { data: { transport_mode: null } })
  }
}

/** The day route toggle stays on until it is clicked again; it is only there while a day is open. */
async function switchRouteOff(page: Page): Promise<void> {
  const route = page.getByRole('button', { name: 'Route', exact: true }).first()
  if (await route.isVisible().catch(() => false)) {
    await route.click()
    await settle(page)
  }
}

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'transports-list': {
    guide: guide('transports-list'),
    start: p => openTrip(p, { tab: 'transports' }),
    steps: [
      only(p => p.getByRole('button', { name: 'Transports', exact: true })),
      {
        target: p => counted(p, 'All').locator('xpath=..'),
        act: async p => {
          await counted(p, 'Train').click()
          await expect(card(p, FLIGHT.title)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await counted(p, 'All').click()
          await expect(card(p, FLIGHT.title)).toBeVisible()
          await settle(p)
        },
        target: p => counted(p, 'Automated public transit'),
      },
      only(p => card(p, FLIGHT.title)),
      {
        prepare: async p => {
          await card(p, FLIGHT.title).getByRole('button', { name: 'Delete' }).click()
          await expect(p.getByText('Delete booking?')).toBeVisible()
          await beat(p, 300)
        },
        target: p => portalDialog(p, p.getByText('Delete booking?')),
        // Cancel, not Confirm: the flight has to survive for the next guide.
        act: async p => {
          await portalDialog(p, p.getByText('Delete booking?')).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.getByText('Delete booking?')).toHaveCount(0)
          await expect(card(p, FLIGHT.title)).toBeVisible()
        },
      },
    ],
    cleanup: async p => {
      await p.evaluate(() => { try { sessionStorage.clear() } catch { /* a locked-down browser keeps its filters */ } })
    },
  },
  'add-transport': {
    guide: guide('add-transport'),
    start: p => openTrip(p),
    steps: [
      {
        // captureGuide hovers the target before the shot, so the tooltip is in the picture.
        target: p => dayHeader(p, 1).getByRole('button', { name: 'Add transport' }),
        act: async p => {
          await dayHeader(p, 1).getByRole('button', { name: 'Add transport' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Add transport' })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await block(p, 'Booking Type').getByRole('button').first().click()
          await expect(selectMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: selectMenu,
        act: async p => {
          await selectMenu(p).getByRole('button', { name: /^Taxi$/ }).first().click()
          await expect(selectMenu(p)).toHaveCount(0)
          await expect(modal(p).getByText('Start time', { exact: true })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('e.g. Lufthansa LH123, Hotel Adlon, ...'), TAXI.title)
          await settle(p)
        },
        target: p => block(p, 'Title *'),
      },
      {
        prepare: async p => {
          await searchLocation(p, locationBox(p, 0), TAXI.from.query, TAXI.from.match)
          await searchLocation(p, locationBox(p, 1), TAXI.to.query, TAXI.to.match)
          await settle(p)
        },
        target: p => modal(p).getByText('From', { exact: true }).locator('xpath=../..'),
      },
      {
        prepare: async p => {
          // Between the two stops of day 1, which the fixtures give 09:30 and 13:00.
          await modal(p).getByPlaceholder('00:00').nth(0).fill('12:00')
          await modal(p).getByPlaceholder('00:00').nth(1).fill('12:30')
          await settle(p)
        },
        target: p => modal(p).getByText('Date', { exact: true }).locator('xpath=../..'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(transportRow(p, new RegExp(TAXI.title))).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByTitle(p, TAXI.title),
  },
  'import-transport-file': {
    guide: guide('import-transport-file'),
    // See import-booking-file: the extractor and no addon, and the mail has to
    // be an allowed file type for the review to keep it under Files.
    start: async p => {
      await requireExtractor(p.request)
      await allowEmlUploads(p.request, true)
      await openTrip(p, { tab: 'transports' })
    },
    steps: [
      ...importSteps(flightEmlFixture, FLIGHT_EML),
      {
        prepare: async p => {
          await expect(importTask(p, FLIGHT_EML).getByRole('button', { name: 'Import', exact: true })).toBeVisible({ timeout: 90_000 })
          await settle(p)
        },
        target: p => importTask(p, FLIGHT_EML),
        act: async p => {
          await importTask(p, FLIGHT_EML).getByRole('button', { name: 'Import', exact: true }).click()
          await expect(modal(p).getByRole('heading', { name: 'Add transport' })).toBeVisible({ timeout: 20_000 })
          await expect(modal(p).getByPlaceholder('e.g. Lufthansa LH123, Hotel Adlon, ...')).toHaveValue(/203/)
          // Both airports came out of the built-in table by their codes: the
          // airport boxes are the two with an airport code in brackets.
          await expect(airportBoxes(p).nth(0)).toHaveValue(IMPORTED.from)
          await expect(airportBoxes(p).nth(1)).toHaveValue(IMPORTED.to)
          await expect(modal(p).getByPlaceholder('e.g. ABC12345')).toHaveValue(IMPORTED.code)
          await expect(modal(p).getByText(FLIGHT_EML)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: dialog,
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 20_000 })
          await expect(card(p, IMPORTED.code)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await closeModal(p)
      await dismissImportTask(p, FLIGHT_EML)
      await allowEmlUploads(p.request, false)
      await p.evaluate(() => {
        try { localStorage.removeItem('trek.bg-import-tasks') } catch { /* nothing was stored */ }
      })
      await deleteByCode(p, IMPORTED.code)
      await deleteTripFiles(p, FLIGHT_EML)
    },
  },
  'plan-transit': {
    guide: guide('plan-transit'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => dayHeader(p, 1).getByRole('button', { name: 'Public transit' }),
        act: async p => {
          await dayHeader(p, 1).getByRole('button', { name: 'Public transit' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Public transit' })).toBeVisible()
          await settle(p)
        },
      },
      {
        // The quick picks open on focus, so the day's own stops are in the picture.
        prepare: async p => {
          await stopBox(p, 0).click()
          await expect(suggestions(stopBox(p, 0)).getByRole('button', { name: 'Senso-ji Temple' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => modal(p).getByText('From', { exact: true }).locator('xpath=../..'),
        act: async p => {
          await pickStop(p, stopBox(p, 0), 'Senso-ji Temple')
          await pickStop(p, stopBox(p, 1), 'teamLab Planets')
          await expect(modal(p).getByRole('button', { name: 'Search' })).toBeEnabled()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Depart' }).locator('xpath=ancestor::div[3]'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Fewer transfers' }).click()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Tram' }).locator('xpath=ancestor::div[2]'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Search' }).click()
          await expect(modal(p).getByText('Routing data via')).toBeVisible({ timeout: 60_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await itinerary(p, 0).click()
          await expect(modal(p).getByRole('button', { name: 'Add to day' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => itinerary(p, 0).locator('xpath=..'),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Add to day' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add to day' }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 30_000 })
          await expect(transportRow(p, /Senso-ji Temple.*teamLab Planets/)).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => deleteByTitle(p, PLANNED),
  },
  'change-transit-route': {
    guide: guide('change-transit-route'),
    start: p => openTrip(p, { tab: 'transports' }),
    steps: [
      {
        target: p => card(p, JOURNEY.onCard),
        act: async p => {
          await card(p, JOURNEY.onCard).click()
          await expect(modal(p).getByRole('heading', { name: 'Public transit journey' })).toBeVisible()
          await settle(p)
        },
      },
      only(p => modal(p).getByText('Itinerary', { exact: true }).locator('xpath=..')),
      {
        target: p => modal(p).getByRole('button', { name: 'Change route' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Change route' }).click()
          await expect(modal(p).getByRole('button', { name: 'Search' })).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Search' }).click()
          await expect(modal(p).getByText('Routing data via')).toBeVisible({ timeout: 60_000 })
          await itinerary(p, 1).click()
          await expect(modal(p).getByRole('button', { name: 'Add to day' })).toBeVisible()
          await beat(p, 300)
        },
        target: p => modal(p).getByRole('button', { name: 'Add to day' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add to day' }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 30_000 })
          await settle(p)
        },
      },
    ],
    // The connection now carries another itinerary: put the canned one back.
    cleanup: async p => {
      await deleteByTitle(p, JOURNEY.title)
      await ensureTransportFixtures(p.request)
    },
  },
  'leg-travel-mode': {
    guide: guide('leg-travel-mode'),
    // The route tools only render for the day that is open, and closing its
    // details panel closes the day again, so day 1 stays open here.
    start: p => openTripOnDay(p, 1),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Route', exact: true }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Route', exact: true }).first().click()
          await expect(connector(p)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(connector),
      {
        prepare: async p => {
          await connector(p).click()
          await expect(legMenu(p)).toBeVisible()
          await beat(p, 300)
        },
        target: legMenu,
      },
      {
        target: p => legMenu(p).getByRole('button', { name: 'Walking' }),
        act: async p => {
          await legMenu(p).getByRole('button', { name: 'Walking' }).click()
          // The menu closing is the change landing. Not the icon on the first
          // leg: the day re-routes when a mode changes, and which leg comes
          // first is not fixed while it does.
          await expect(legMenu(p)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await switchRouteOff(p)
      await resetLegModes(p, 0)
    },
  },
  'edit-transport': {
    guide: guide('edit-transport'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => transportRow(p, FLIGHT.row),
        act: async p => {
          await transportRow(p, FLIGHT.row).click()
          await expect(modal(p).getByRole('heading', { name: 'Edit transport' })).toBeVisible()
          await settle(p)
        },
      },
      only(dialog),
      only(p => block(p, 'Route')),
      {
        // Escape rather than Update: nothing about the seeded flight may change.
        target: p => modal(p).getByRole('button', { name: 'Update', exact: true }),
        act: closeModal,
      },
    ],
  },
  'transport-on-map': {
    guide: guide('transport-on-map'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => transportRow(p, FLIGHT.row).getByRole('button', { name: 'Show booking routes' }),
        act: async p => {
          await transportRow(p, FLIGHT.row).getByRole('button', { name: 'Show booking routes' }).click()
          await expect(transportRow(p, FLIGHT.row).getByRole('button', { name: 'Hide booking routes' })).toBeVisible()
          await settle(p)
          await p.waitForTimeout(1500)
        },
      },
      // The map is on Tokyo, so the Frankfurt end is off screen and the Haneda
      // one, drawn second, is the marker the reader can actually see.
      only(p => p.locator('.trek-endpoint-marker').last()),
      {
        prepare: async p => {
          await p.locator('.trek-endpoint-marker').last().click()
          await expect(transportSheet(p)).toBeVisible()
          await settle(p)
        },
        target: transportSheet,
        act: async p => {
          await transportSheet(p).getByRole('button', { name: 'Close' }).click()
          await expect(transportSheet(p)).toHaveCount(0)
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Show all booking routes' }),
        act: async p => {
          await p.getByRole('button', { name: 'Show all booking routes' }).click()
          await expect(p.getByRole('button', { name: 'Hide all booking routes' })).toBeVisible()
          await settle(p)
          await p.waitForTimeout(1500)
        },
      },
      {
        // Day 6 carries the stored connection, and it has the two located stops
        // the route tools need, so its Route toggle is there to switch on.
        prepare: async p => {
          await selectDay(p, 6)
          await expect(p.getByRole('button', { name: 'Route', exact: true }).first()).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByRole('button', { name: 'Route', exact: true }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Route', exact: true }).first().click()
          await settle(p)
          await p.waitForTimeout(1500)
        },
      },
    ],
    cleanup: async p => {
      await switchRouteOff(p)
      const { tripId } = seededTrip()
      await p.evaluate(id => {
        try { localStorage.removeItem(`trek:visible-connections:${id}`) } catch { /* nothing was stored */ }
      }, tripId)
    },
  },
  'airtrail-import': {
    guide: guide('airtrail-import'),
    // The connection is made here and taken away in cleanup, so the hero and
    // the guides before this one keep a toolbar without the AirTrail button.
    start: async p => {
      await ensureAirtrailConnection(p.request)
      await openTrip(p, { tab: 'transports' })
      // The addon list and the connection probe are read once, when the app
      // loads. One more load now that the connection exists, and the button
      // is waited for, so a missing connection fails here and not at step 1.
      await p.reload()
      await expect(p.getByRole('button', { name: 'Share', exact: true })).toBeVisible({ timeout: 30_000 })
      await expect(airtrailButton(p)).toBeVisible({ timeout: 30_000 })
      await settle(p)
    },
    steps: [
      {
        target: airtrailButton,
        act: async p => {
          await airtrailButton(p).click()
          await expect(airtrailPicker(p)).toBeVisible()
          // The rows come from the AirTrail instance itself, over the LAN.
          await expect(flightRow(p, HOME_LEG.flightNumber)).toBeVisible({ timeout: 30_000 })
          await expect(flightRow(p, OTHER.flightNumber)).toBeVisible()
          await settle(p)
        },
      },
      // The whole picker: During this trip with its ticked rows, Other flights below.
      only(airtrailPicker),
      // A row under Other flights, unticked, as the text says those are. Not
      // clicked: a spring flight imported into an autumn trip would be clamped
      // onto day 1 and spoil the result picture.
      only(p => flightRow(p, OTHER.flightNumber)),
      {
        // Joined by default: the tick under the two legs is on before anyone touches it.
        prepare: async p => {
          await expect(joinToggle(p)).toContainText(`Import as one flight with a layover in ${JOINED.layover}`)
          await expect(joinToggle(p).locator('svg.lucide-check')).toBeVisible()
        },
        target: connectionGroup,
      },
      {
        // The two flights home and nothing else are ticked.
        prepare: async p => {
          await expect(importCta(p)).toHaveText('Import 2')
        },
        target: importCta,
        act: async p => {
          await importCta(p).click()
          await expect(p.getByText('Import from AirTrail', { exact: true })).toHaveCount(0, { timeout: 30_000 })
          // The toast counts flight ids, so the joined pair reports two.
          const toast = p.getByText('2 flight(s) imported', { exact: true })
          await expect(toast).toBeVisible({ timeout: 15_000 })
          await expect(card(p, JOINED.title)).toBeVisible({ timeout: 20_000 })
          // The toast fades after three seconds; the card's picture and the
          // result are taken without a half-faded message in the corner.
          await expect(toast).toHaveCount(0, { timeout: 10_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await expect(card(p, JOINED.title).getByText('AirTrail', { exact: true })).toBeVisible()
        },
        target: p => card(p, JOINED.title),
      },
    ],
    cleanup: async p => {
      // By every title the import can produce: the joined route, or one
      // flight number per card when the join was off.
      await deleteByTitle(p, JOINED.title, ...AIRTRAIL_FLIGHTS.map(f => f.flightNumber))
      await disconnectAirtrail(p.request)
      await p.evaluate(() => { try { sessionStorage.clear() } catch { /* a locked-down browser keeps its filters */ } })
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureTransportFixtures(request)
})

test('every registered transports guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTransportsContext.guides].sort())
})

test('hero: trip-transports', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripTransportsContext.id, p => openTrip(p, { tab: 'transports' }))
})

for (const id of tripTransportsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
