import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, coverFixture, ensureTrack, ensureDaysFixtures, ensurePlaceFixtures, PLACE_WEBSITE, RATED_PLACE } from './fixtures'
import { openTrip, selectDay, modal, dialog } from './trip-shared'
import { long } from '../dates'
import { tripPlaceContext, tripPlaceGuides } from '../../src/help/contexts/tripPlace'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the place card that floats over the map, keyed by the ids in
 * `src/help/contexts/tripPlace.ts`. They run on the seeded "Autumn in Japan"
 * with the Kyoto walk imported, the day fixtures in place and this screen's own
 * fixtures on top; what a guide changes it changes back in `cleanup`, so the
 * next one starts from the same card.
 */

const guide = (id: string): HelpGuide => {
  const g = tripPlaceGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** An unplanned waypoint of the imported walk: the place that is on no day yet. */
const SPARE = 'Ginkaku-ji'
/** The walk itself: the only place of the trip that carries a path. */
const TRACK = "Philosopher's Path"
/** What the GPX import hands the trip's first track: TRACK_COLORS[0]. */
const TRACK_IMPORT_COLOR = '#1d4ed8'
/** The colour the guide picks instead: TRACK_COLORS[1]. */
const TRACK_PICKED_COLOR = '#ea580c'
/** The booking `ensureDaysFixtures` pins to the market stop on day 6. */
const BOOKING = 'Lunch at Nishiki'
/** The only list the seed creates. */
const LIST = 'Kyoto shortlist'
/** The list's row in the picker: its name, then the status chip once the place is in it. */
const LIST_ROW = new RegExp(`^${LIST}(?: (?:Idea|Planned|Visited))?$`)
const UPLOADED = 'cover-fixture.jpg'

/** The card itself: the scroll body's parent holds head, body and footer. */
const card = (page: Page) => page.getByTestId('inspector-scroll').locator('xpath=..')
const head = (page: Page) => card(page).locator('> div').first()
const footer = (page: Page) => card(page).locator('div.border-t')
/** A row of the places column (the rows are options of a list). */
const row = (page: Page, name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }).first()
/** A stop inside a day card. Day notes and to-dos share the class, so filter by the name. */
const stop = (page: Page, name: string) => page.locator('.dp-row[role="button"]').filter({ hasText: name }).first()
/** PlaceRating's root: the stars, the average and the voter faces on one line. */
const ratingRow = (page: Page) => card(page).getByRole('radiogroup', { name: 'Your rating' }).locator('xpath=..')
/** ParticipantsBox: found by its eyebrow, which is the box's first child. */
const participants = (page: Page) => card(page).getByText('Participants', { exact: true }).locator('xpath=..')
/** A member's chip, or, once the chip is gone, that member's line in the add list. */
const member = (page: Page, name: string) => participants(page).getByRole('button', { name: new RegExp(name) })
const addMember = (page: Page) => participants(page).getByRole('button', { name: '+', exact: true })
/** "Files" while the place has none, "<n> files" once it has. */
const filesToggle = (page: Page) => card(page).getByRole('button', { name: /^(Files|\d+ files)$/ })
/** The booking strip is a button only for a viewer who may open the booking. */
const bookingStrip = (page: Page) => card(page).getByRole('button', { name: 'Edit Reservation' })
/** The strip's lower row: Date, Time and Booking Code beside each other. */
const bookingFields = (page: Page) => bookingStrip(page).locator('> div').nth(1)
const dayHeader = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) })
const swatch = (page: Page) => card(page).getByRole('button', { name: TRACK_PICKED_COLOR })
/** The seed's day 1: the trip starts nine days before the picture day (`start_date: day(-9)`). */
const DAY_ONE = -9
/** The weekday the English UI prints for a seeded day, `Saturday` on a run where day 1 is one. */
const weekday = (offset: number) => long(offset).split(',')[0]
/**
 * The Opening Hours row: the one button of the card with a clock in it. Found
 * by the icon rather than the label, because the label is the open day's line
 * ("Saturday: 06:00-17:00") and the day moves with the run.
 */
const hoursRow = (page: Page) => card(page).locator('button:has(svg.lucide-clock)')
/** The hours box: the row and, once unfolded, the week under it. */
const hoursBox = (page: Page) => hoursRow(page).locator('xpath=..')

/** The card's own X, the one in its head; the day panel over the map has another. */
async function closeCard(page: Page): Promise<void> {
  await head(page).locator('button:has(svg.lucide-x)').click()
  await expect(card(page)).toHaveCount(0)
}

/**
 * Put the provider's answer for a place into the card's own cache before the
 * card asks for it. The card reads `sessionStorage` under this key first
 * (PlaceInspector's usePlaceDetails) and only then asks the server, with an
 * eight-second limit that Overpass exceeds as often as not; asked here over
 * the API there is no such limit, and a thin answer is asked again.
 */
async function primeDetails(page: Page, placeName: string): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: { name: string; osm_id?: string | null }[] } | { name: string; osm_id?: string | null }[]
  const places = Array.isArray(body) ? body : (body.places ?? [])
  const osmId = places.find(p => p.name === placeName)?.osm_id
  if (!osmId) throw new Error(`${placeName} carries no OpenStreetMap id; ensurePlaceFixtures did not run`)
  type Details = { opening_hours?: string[] | null } | null
  const hasWeek = (d: Details): boolean => Array.isArray(d?.opening_hours) && d.opening_hours.length === 7
  let details: Details = null
  for (let attempt = 1; attempt <= 3 && !hasWeek(details); attempt++) {
    const answer = await page.request.get(`/api/maps/details/${encodeURIComponent(osmId)}?lang=en`, { timeout: 45_000 })
    details = answer.ok() ? ((await answer.json()) as { place: Details }).place : null
  }
  if (!hasWeek(details)) throw new Error(`no opening hours for ${placeName} (${osmId}) from the details route`)
  await page.evaluate(([key, value]) => sessionStorage.setItem(key, value), [`gdetails_${osmId}_en`, JSON.stringify(details)])
}

/**
 * Open a place that carries an OpenStreetMap id and wait until the provider's
 * answer is on the card.
 *
 * The hours, the ring and the phone number arrive one request after the card:
 * the server asks Overpass and Nominatim for them, caches nothing on that path,
 * and the card swallows a lookup that times out. `settle` waits five seconds
 * for the network at most, which a slow mirror exceeds, and the card would then
 * be pictured without the feature the text is about. So this waits for the
 * hours row itself, and when it has not come, closes the card and opens the
 * place again, which fires the lookup afresh (closing clears the id the hook
 * watches). A third miss fails the run. With `day` the row's line is checked
 * against that day's weekday, which is what the step text promises; with
 * `phone` the tel link has to be there too.
 */
async function openWithHours(
  page: Page,
  open: (p: Page) => Promise<void>,
  opts: { day?: number; phone?: RegExp; place?: string } = {},
): Promise<void> {
  await primeDetails(page, opts.place ?? 'Senso-ji Temple')
  for (let attempt = 1; ; attempt++) {
    await open(page)
    const shown = await hoursRow(page).waitFor({ state: 'visible', timeout: 15_000 }).then(() => true, () => false)
    if (shown) break
    if (attempt === 3) throw new Error(`no opening hours on the card after ${attempt} openings`)
    await closeCard(page)
  }
  if (opts.day !== undefined) await expect(hoursRow(page)).toHaveText(new RegExp(`^${weekday(opts.day)}: `))
  if (opts.phone) await expect(card(page).getByRole('link', { name: opts.phone })).toBeVisible()
  await settle(page)
}

async function openPlace(page: Page, name: string): Promise<void> {
  await row(page, name).click()
  await expect(card(page)).toBeVisible()
  await settle(page)
}

/** Opening the card from a stop is what gives it the stop's participants and booking. */
async function openStop(page: Page, name: string): Promise<void> {
  await stop(page, name).click()
  await expect(card(page)).toBeVisible()
  await settle(page)
}

// ── The seed over the API, for the cleanups ──────────────────────────────────

type ApiPlace = { id: number; name: string; lat?: number | null; lng?: number | null }
type ApiAssignment = { id: number; place_id: number }

async function tripPlaces(page: Page): Promise<ApiPlace[]> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: ApiPlace[] } | ApiPlace[]
  return Array.isArray(body) ? body : (body.places ?? [])
}

const findPlace = async (page: Page, name: string): Promise<ApiPlace | undefined> =>
  (await tripPlaces(page)).find(p => p.name === name)

async function patchPlace(page: Page, name: string, data: Record<string, unknown>): Promise<void> {
  const { tripId } = seededTrip()
  const place = await findPlace(page, name)
  if (place) await page.request.put(`/api/trips/${tripId}/places/${place.id}`, { data })
}

async function assignmentsOf(page: Page, dayIndex: number): Promise<ApiAssignment[]> {
  const { tripId, dayIds } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/days/${dayIds[dayIndex]}/assignments`)
  const body = (await res.json()) as { assignments?: ApiAssignment[] }
  return body.assignments ?? []
}

async function assignmentFor(page: Page, dayIndex: number, name: string): Promise<ApiAssignment | undefined> {
  const place = await findPlace(page, name)
  if (!place) return undefined
  return (await assignmentsOf(page, dayIndex)).find(a => a.place_id === place.id)
}

const closeModal = async (page: Page): Promise<void> => {
  if (await modal(page).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  }
}

const only = (target: (p: Page) => Locator) => ({ target })

/**
 * Take a place out of every collection it sits in.
 *
 * Run before the guide as well as after it: the Collections screen's own guides
 * run earlier in the suite and leave places saved, and a place that is already
 * in a list offers Saved where this guide's first step looks for Save to
 * Collection.
 */
async function unsaveEverywhere(page: Page, name: string): Promise<void> {
  const place = await findPlace(page, name)
  if (!place) return
  const query = new URLSearchParams({ name: place.name, lat: String(place.lat ?? ''), lng: String(place.lng ?? '') })
  const res = await page.request.get(`/api/addons/collections/membership?${query.toString()}`)
  if (!res.ok()) return
  const body = (await res.json()) as { lists?: { place_id: number }[] }
  for (const entry of body.lists ?? []) {
    await page.request.delete(`/api/addons/collections/places/${entry.place_id}`)
  }
}

const SCRIPTS: Record<string, GuideScript> = {
  'read-place': {
    guide: guide('read-place'),
    // Day 1 explicitly: closing a day's detail panel clears the open day, and
    // the card is a different card without one.
    start: async p => {
      await openTrip(p, { day: null })
      await selectDay(p, 1)
    },
    steps: [
      {
        target: p => stop(p, 'Senso-ji Temple'),
        act: p => openWithHours(p, q => openStop(q, 'Senso-ji Temple'), { day: DAY_ONE, phone: /^\+81/ }),
      },
      only(head),
      only(ratingRow),
      only(p => card(p).locator('.collab-note-md').first()),
      only(participants),
      {
        // Unfolded before the picture: the step is about the week, and a ring
        // around the collapsed row would show the reader one line of it.
        prepare: async p => {
          await hoursRow(p).click()
          await expect(hoursRow(p)).toHaveText('Opening Hours')
          await expect(hoursBox(p).getByText(/^Sunday: /)).toBeVisible()
          await settle(p)
        },
        target: hoursBox,
      },
      only(footer),
    ],
  },
  'rate-place': {
    guide: guide('rate-place'),
    start: async p => {
      await openTrip(p, { day: null })
      await openPlace(p, RATED_PLACE)
    },
    steps: [
      only(ratingRow),
      {
        target: p => card(p).getByRole('radio', { name: '4', exact: true }),
        act: async p => {
          await card(p).getByRole('radio', { name: '4', exact: true }).click()
          await expect(card(p).getByRole('radio', { name: '4', exact: true }))
            .toHaveAttribute('aria-checked', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        // captureGuide hovers the target before it shoots, which is the gesture
        // the step describes; the tooltip is a portal, so it is asserted here.
        target: ratingRow,
        act: async p => { await expect(p.getByRole('tooltip')).toBeVisible() },
      },
      only(p => row(p, RATED_PLACE)),
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const place = await findPlace(p, RATED_PLACE)
      // Only the admin's vote: the two members' votes are the fixture's.
      if (place) await p.request.delete(`/api/trips/${tripId}/places/${place.id}/rating`)
    },
  },
  'place-image': {
    guide: guide('place-image'),
    start: p => openTrip(p, { day: null }),
    steps: [
      {
        target: p => row(p, 'Arashiyama Bamboo Grove'),
        act: p => openPlace(p, 'Arashiyama Bamboo Grove'),
      },
      {
        target: p => card(p).getByRole('button', { name: /^(Upload image|Change image)$/ }),
        act: async p => {
          await card(p).locator('input[accept*="image/jpeg"]').setInputFiles(await coverFixture())
          await expect(card(p).getByRole('button', { name: 'Remove image' })).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      only(head),
      only(p => row(p, 'Arashiyama Bamboo Grove')),
    ],
    cleanup: p => patchPlace(p, 'Arashiyama Bamboo Grove', { image_url: null }),
  },
  'place-day-assign': {
    guide: guide('place-day-assign'),
    start: p => openTrip(p, { day: null }),
    steps: [
      {
        target: p => dayHeader(p, 6),
        act: p => selectDay(p, 6),
      },
      {
        target: p => row(p, SPARE),
        act: async p => {
          await openPlace(p, SPARE)
          await expect(footer(p).getByRole('button', { name: 'Add to Day' })).toBeVisible()
        },
      },
      {
        target: p => footer(p).getByRole('button', { name: 'Add to Day' }),
        act: async p => {
          await footer(p).getByRole('button', { name: 'Add to Day' }).click()
          await expect(footer(p).getByRole('button', { name: 'Remove from Day' })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      // The gesture only: dragging it here would leave the day reordered for the
      // last step's picture, and the arrow already says what to do.
      { target: p => stop(p, SPARE), dropTo: p => stop(p, 'Arashiyama Bamboo Grove') },
      {
        target: p => footer(p).getByRole('button', { name: 'Remove from Day' }),
        act: async p => {
          await footer(p).getByRole('button', { name: 'Remove from Day' }).click()
          await expect(footer(p).getByRole('button', { name: 'Add to Day' })).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId, dayIds } = seededTrip()
      const assignment = await assignmentFor(p, 5, SPARE)
      if (assignment) await p.request.delete(`/api/trips/${tripId}/days/${dayIds[5]}/assignments/${assignment.id}`)
    },
  },
  'place-participants': {
    guide: guide('place-participants'),
    start: async p => {
      await openTrip(p, { day: null })
      await selectDay(p, 1)
    },
    steps: [
      {
        target: p => stop(p, 'teamLab Planets'),
        act: async p => {
          await openStop(p, 'teamLab Planets')
          await expect(participants(p)).toBeVisible()
        },
      },
      {
        target: p => member(p, 'jonas'),
        act: async p => {
          await member(p, 'jonas').click()
          await expect(member(p, 'jonas')).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await addMember(p).click()
          await expect(member(p, 'jonas')).toBeVisible()
          await beat(p, 300)
        },
        target: participants,
      },
      {
        target: p => member(p, 'jonas'),
        act: async p => {
          await member(p, 'jonas').click()
          await expect(addMember(p)).toHaveCount(0, { timeout: 20_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const assignment = await assignmentFor(p, 0, 'teamLab Planets')
      // An empty list is what "everybody is going" is stored as.
      if (assignment) {
        await p.request.put(`/api/trips/${tripId}/assignments/${assignment.id}/participants`, { data: { user_ids: [] } })
      }
    },
  },
  'place-booking': {
    guide: guide('place-booking'),
    start: async p => {
      await openTrip(p, { day: null })
      await selectDay(p, 6)
    },
    steps: [
      {
        target: p => stop(p, 'Nishiki Market'),
        act: async p => {
          await openStop(p, 'Nishiki Market')
          await expect(card(p).getByText(BOOKING)).toBeVisible()
        },
      },
      // The fields rather than the whole strip: step 3 rings the strip, and two
      // steps pointing at one element give the reader the same picture twice.
      only(bookingFields),
      {
        target: bookingStrip,
        act: async p => {
          await bookingStrip(p).click()
          await expect(modal(p).getByRole('heading', { name: 'Edit Reservation' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByText('Link to day assignment', { exact: true }).locator('xpath=..'),
        act: closeModal,
      },
      {
        // The + is rendered only while its own stop is hovered, so the row is
        // put in view and hovered before the target is looked up, and hovered
        // again for the picture instead of the button itself.
        prepare: async p => {
          await stop(p, 'Nishiki Market').scrollIntoViewIfNeeded()
          await stop(p, 'Nishiki Market').hover()
          await expect(stop(p, 'Nishiki Market').getByRole('button', { name: 'Add booking' })).toBeVisible()
        },
        target: p => stop(p, 'Nishiki Market').getByRole('button', { name: 'Add booking' }),
        hover: p => stop(p, 'Nishiki Market').hover(),
        act: async p => {
          await stop(p, 'Nishiki Market').getByRole('button', { name: 'Add booking' }).click()
          await expect(modal(p).getByRole('heading', { name: 'New Reservation' })).toBeVisible()
          await settle(p)
        },
      },
    ],
    // The new booking is never saved, so there is nothing to delete.
    cleanup: closeModal,
  },
  'place-files': {
    guide: guide('place-files'),
    start: async p => {
      await openTrip(p, { day: null })
      await openPlace(p, 'teamLab Planets')
    },
    steps: [
      only(filesToggle),
      {
        target: p => card(p).getByText('Upload', { exact: true }),
        act: async p => {
          await card(p).locator('input[type="file"][multiple]').setInputFiles(await coverFixture())
          await expect(card(p).getByRole('button', { name: '1 files' })).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      // The list opens itself once the upload lands.
      only(p => card(p).getByRole('button', { name: '1 files' })),
      // No click: openFile hands the browser a download.
      only(p => card(p).getByRole('button', { name: UPLOADED })),
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/files`)
      const body = (await res.json()) as { files?: { id: number; original_name: string }[] }
      for (const file of (body.files ?? []).filter(f => f.original_name === UPLOADED)) {
        await p.request.delete(`/api/trips/${tripId}/files/${file.id}`)
        await p.request.delete(`/api/trips/${tripId}/files/${file.id}/permanent`)
      }
    },
  },
  'place-navigation': {
    guide: guide('place-navigation'),
    start: async p => {
      await openTrip(p, { day: null })
      await openWithHours(p, q => openPlace(q, PLACE_WEBSITE.place), { place: PLACE_WEBSITE.place })
    },
    steps: [
      {
        target: p => footer(p).getByRole('button', { name: 'Navigation' }),
        act: async p => {
          await footer(p).getByRole('button', { name: 'Navigation' }).click()
          await expect(p.getByRole('menu')).toBeVisible()
          await settle(p)
        },
      },
      only(p => p.getByRole('menu')),
      {
        // Clicking one opens an external tab, so the menu is closed instead.
        target: p => p.getByRole('menuitem', { name: 'Google Maps' }),
        act: async p => {
          await p.keyboard.press('Escape')
          await expect(p.getByRole('menu')).toHaveCount(0)
        },
      },
      only(p => footer(p).getByRole('button', { name: 'Open Website' })),
    ],
  },
  'place-to-collection': {
    guide: guide('place-to-collection'),
    start: async p => {
      await unsaveEverywhere(p, 'Senso-ji Temple')
      await openTrip(p, { day: null })
      await openWithHours(p, q => openPlace(q, 'Senso-ji Temple'))
    },
    steps: [
      {
        target: p => footer(p).getByRole('button', { name: 'Save to Collection' }),
        act: async p => {
          await footer(p).getByRole('button', { name: 'Save to Collection' }).click()
          await expect(modal(p).getByRole('heading', { name: 'Save to list' })).toBeVisible()
          await settle(p)
        },
      },
      only(dialog),
      {
        // Anchored, not exact: the Collections guides leave a list behind whose
        // name opens with this one's, and once the place is saved the row's
        // name grows the status chip (Idea, Planned, Visited).
        target: p => modal(p).getByRole('button', { name: LIST_ROW }),
        act: async p => {
          await modal(p).getByRole('button', { name: LIST_ROW }).click()
          await expect(modal(p).getByRole('button', { name: LIST_ROW })).toHaveClass(/border-accent/, { timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Close' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Close' }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(footer(p).getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 20_000 })
        },
      },
    ],
    cleanup: p => unsaveEverywhere(p, 'Senso-ji Temple'),
  },
  'place-track': {
    guide: guide('place-track'),
    start: p => openTrip(p, { day: null }),
    steps: [
      {
        target: p => row(p, TRACK),
        act: async p => {
          await openPlace(p, TRACK)
          await expect(card(p).getByText('Track Stats', { exact: true })).toBeVisible()
        },
      },
      only(p => card(p).getByText('Track Stats', { exact: true }).locator('xpath=ancestor::div[2]')),
      {
        target: p => card(p).getByRole('button', { name: 'Track color' }),
        act: async p => {
          await card(p).getByRole('button', { name: 'Track color' }).click()
          await expect(swatch(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: swatch,
        act: async p => {
          await swatch(p).click()
          await expect(swatch(p)).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
          await settle(p)
        },
      },
      // No click: it would undo the result picture. The reset happens in cleanup.
      only(p => card(p).getByRole('button', { name: 'Automatic color' })),
    ],
    cleanup: p => patchPlace(p, TRACK, { route_color: TRACK_IMPORT_COLOR }),
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureTrack(request, seededTrip().tripId, 'kyoto-walk')
  await ensureDaysFixtures(request)
  await ensurePlaceFixtures(request)
})

test('every registered place guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripPlaceContext.guides].sort())
})

test('hero: trip-place', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripPlaceContext.id, async p => {
    await openTrip(p, { day: null })
    await selectDay(p, 1)
    await openWithHours(p, q => openStop(q, 'Senso-ji Temple'), { day: DAY_ONE, phone: /^\+81/ })
  })
})

for (const id of tripPlaceContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
