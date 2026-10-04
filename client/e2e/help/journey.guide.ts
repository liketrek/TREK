import { test, expect, type APIResponse, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureExtraTrips, ensureJourneyFixtures, filesImageFixture, JOURNEY_TITLE, SECOND_JOURNEY, SPARE_TRIP } from './fixtures'
import { journeyGuides, journeyContext, journalGuides, journalContext, studioGuides, studioContext } from '../../src/help/contexts/journey'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the two Journey screens, keyed by the ids in
 * `src/help/contexts/journey.ts`: the list at `/journey` and the open journal
 * at `/journey/:id`. The fixtures write three entries into the seeded
 * "Autumn in Japan" journey and leave the rest of its timeline as suggestions.
 *
 * A guide that writes something (an entry, photos, a verdict, a share link, a
 * contributor, a linked trip) takes it away again in its cleanup, so every
 * guide starts from the journal the overview picture shows. Each one also
 * clears the same things at its start, which makes a retry after a failed run
 * begin from the seed as well.
 */

const ALL = [...journeyGuides, ...journalGuides, ...studioGuides]

const guide = (id: string): HelpGuide => {
  const g = ALL.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

let journeyId = 0

async function openJourneys(page: Page): Promise<void> {
  await page.goto('/journey')
  // clearNotices pages through a notice by clicking any button whose name holds
  // "next", and the second journey's card is such a button ("Norway, next
  // summer"): it opened that journey instead. While it runs the cards are
  // hidden from role lookups with aria-hidden. Not inert: Playwright still
  // finds an inert button and then waits forever for it to take the click.
  await expect(journeyCard(page, SECOND_JOURNEY.title)).toBeVisible({ timeout: 20_000 })
  const cards = page.locator('.vg-card')
  await cards.evaluateAll(els => els.forEach(el => el.setAttribute('aria-hidden', 'true')))
  await clearNotices(page)
  await cards.evaluateAll(els => els.forEach(el => el.removeAttribute('aria-hidden')))
  await dismissReleaseNotice(page)
  await expect(createCard(page)).toBeVisible({ timeout: 20_000 })
  await expect(journeyCard(page, SECOND_JOURNEY.title)).toBeVisible({ timeout: 20_000 })
  await settle(page)
}

async function openJournal(page: Page): Promise<void> {
  await page.goto(`/journey/${journeyId}`)
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(page.getByRole('button', { name: 'Add Entry' }).first()).toBeVisible({ timeout: 20_000 })
  await expect(entryCard(page, 'First morning in Asakusa')).toBeVisible({ timeout: 20_000 })
  await settle(page)
  await page.waitForTimeout(600) // the map tiles
}

const journeyCard = (page: Page, title: string) => page.locator('.vg-card').filter({ hasText: title }).first()
/** The + card at the end of the grid. */
const createCard = (page: Page) => page.getByRole('button', { name: /Create a new Journey/ })
/**
 * The dialogs of both screens (create, settings, link a trip, invite, the entry
 * editor) are the shared DialogShell: a dimmed backdrop holding the panel. They
 * portal onto the body in the order they open, so the last backdrop is the one
 * on top. ConfirmDialog draws its own backdrop without this class, so a
 * question asked over a dialog is not counted as one.
 */
const anyDialog = (page: Page) => page.locator('div.trek-modal-backdrop')
const dialog = (page: Page) => anyDialog(page).last()
/** The rounded panel of the top dialog: head band, body and footer. */
const dialogCard = (page: Page) => dialog(page).getByRole('dialog')
/** The entry editor, named by the eyebrow over the title it has you type. */
const editor = (page: Page) => page.getByRole('dialog', { name: /^(new|edit) entry$/i })
/** The editor's photo tiles, saved ones first and then the files waiting for Save. */
const photoTiles = (page: Page) => editor(page).locator('.group.h-20.w-20')

/** A written entry's card in the timeline, and the More options button that opens its menu. */
const entryCard = (page: Page, title: string) => page.locator('div[class*="rounded-[20px]"]').filter({ hasText: title }).first()
// The shared MoreButton, in both builds of the card (over a photo cover and on a plain one).
const entryMenu = (page: Page, title: string) => entryCard(page, title).getByRole('button', { name: 'More options' })
/**
 * An item of the menu the More options button opens. The shared ContextMenu
 * portals onto the end of the body, so the last button of that name is its own.
 */
const menuItem = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).last()
/** A suggestion card: the one kind of card that carries a dismiss button. */
const suggestion = (page: Page) =>
  page.locator('[role="button"]').filter({ has: page.getByRole('button', { name: 'Dismiss this suggestion' }) }).first()
/** The suggestion a trip place became, by the place's name. */
const namedSuggestion = (page: Page, name: string) =>
  page.locator('[role="button"]').filter({ has: page.getByRole('button', { name: 'Dismiss this suggestion' }) }).filter({ hasText: name }).first()
const settingsButton = (page: Page) => page.getByRole('button', { name: 'Journey Settings' }).first()
const mapPanel = (page: Page) => page.locator('aside').filter({ has: page.locator('.leaflet-container, .maplibregl-map, canvas') }).first()

async function openSettings(page: Page): Promise<void> {
  await settingsButton(page).click()
  await expect(page.getByRole('dialog', { name: 'Journey Settings' })).toBeVisible()
  await settle(page)
}

/**
 * Close whatever dialogs are stacked, the top one first, with the X in its
 * head band. The mouse rather than Escape: a dialog hands the focus back to
 * the button that opened it, and after a key press that focus counts as
 * keyboard focus and brings up the button's tooltip in the next picture.
 */
async function closeDialog(page: Page): Promise<void> {
  for (let i = 0; i < 3 && (await anyDialog(page).count()); i++) {
    await dialogCard(page).getByRole('button', { name: 'Close', exact: true }).first().click()
    await page.waitForTimeout(300)
  }
  await expect(anyDialog(page)).toHaveCount(0)
  await settle(page)
}

async function openEditor(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add Entry' }).first().click()
  await expect(editor(page)).toBeVisible()
  await settle(page)
}

/** Open a written entry in the editor through the menu on its card. */
async function editEntry(page: Page, title: string): Promise<void> {
  await entryMenu(page, title).click()
  await menuItem(page, 'Edit').click()
  await expect(editor(page)).toBeVisible()
  await settle(page)
}

/**
 * Leave the editor without saving. One that holds an unsaved change asks
 * first, in a ConfirmDialog, and the guide means to throw the change away.
 */
async function cancelEditor(page: Page): Promise<void> {
  await editor(page).getByRole('button', { name: 'Cancel', exact: true }).click()
  const discard = page.getByRole('button', { name: 'Discard', exact: true })
  await expect.poll(async () => (await editor(page).count()) === 0 || (await discard.isVisible())).toBe(true)
  if (await discard.isVisible()) await discard.click()
  await expect(editor(page)).toHaveCount(0)
  await settle(page)
}

/**
 * Take the focus off whatever holds it before an after-picture. A closed dialog
 * hands the focus back to the button that opened it, and after typing that
 * counts as keyboard focus: the button then shows its focus ring or tooltip in
 * a picture that is about something else.
 */
async function blurFocus(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

/**
 * Some steps are about a few controls that have no element of their own around
 * them: the three choices of the export dialog sit in two sections, Delete and
 * Archive Journey share the footer with Cancel and Save. The ring is drawn
 * round one element's box, so a transparent box is laid over exactly the
 * union of those controls for the picture and removed again after it. It
 * takes no pointer events, so the measuring and the hovering go through it.
 */
const GROUP_MARK = 'trek-help-group'
const groupMark = (page: Page) => page.locator(`#${GROUP_MARK}`)

async function markGroup(page: Page, items: Locator): Promise<void> {
  const boxes = await items.evaluateAll(els => els.map(el => {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  }))
  if (!boxes.length) throw new Error('markGroup: nothing to mark')
  const box = {
    left: Math.min(...boxes.map(b => b.left)),
    top: Math.min(...boxes.map(b => b.top)),
    right: Math.max(...boxes.map(b => b.right)),
    bottom: Math.max(...boxes.map(b => b.bottom)),
  }
  await page.evaluate(({ id, box }) => {
    document.getElementById(id)?.remove()
    const el = document.createElement('div')
    el.id = id
    Object.assign(el.style, {
      position: 'fixed',
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.right - box.left}px`,
      height: `${box.bottom - box.top}px`,
      pointerEvents: 'none',
    })
    document.body.appendChild(el)
  }, { id: GROUP_MARK, box })
}

async function unmarkGroup(page: Page): Promise<void> {
  await page.evaluate(id => document.getElementById(id)?.remove(), GROUP_MARK)
}

// ── Data a guide brings along ─────────────────────────────────────────────────

/**
 * The seed has one trip with places, and a journey already holds it. The
 * guides that show a trip's places arriving as suggestions therefore put a few
 * real stops on a trip of their own first, each on a day, because only a place
 * on a day becomes a suggestion. `day` is the index of that day in the trip.
 */
interface TripStop { name: string; lat: number; lng: number; address: string; day: number }

/** Five stops for the Lisbon weekend (three days), ticked when a journey is created. */
const LISBON_STOPS: TripStop[] = [
  { name: 'Castelo de São Jorge', lat: 38.7139, lng: -9.1334, address: 'R. de Santa Cruz do Castelo, 1100-129 Lisboa, Portugal', day: 0 },
  { name: 'Miradouro da Senhora do Monte', lat: 38.7192, lng: -9.1326, address: 'Largo Monte, 1170-107 Lisboa, Portugal', day: 0 },
  { name: 'Mosteiro dos Jerónimos', lat: 38.6979, lng: -9.2068, address: 'Praça do Império, 1400-206 Lisboa, Portugal', day: 1 },
  { name: 'Pastéis de Belém', lat: 38.6975, lng: -9.2032, address: 'R. de Belém 84-92, 1300-085 Lisboa, Portugal', day: 1 },
  { name: 'Palácio Nacional da Pena', lat: 38.7876, lng: -9.3906, address: 'Estrada da Pena, 2710-609 Sintra, Portugal', day: 2 },
]
const LISBON_TRIP = 'Weekend in Lisbon'
const NEW_JOURNEY = 'Lisbon weekend'

/** Four stations of the Alps by rail trip (eight days), for the guide that links it. */
const ALPS_STOPS: TripStop[] = [
  { name: 'Zürich HB', lat: 47.378, lng: 8.5402, address: 'Bahnhofplatz, 8001 Zürich, Switzerland', day: 0 },
  { name: 'Alp Grüm', lat: 46.3736, lng: 10.0467, address: '7710 Alp Grüm, Switzerland', day: 2 },
  { name: 'Tirano', lat: 46.2163, lng: 10.1686, address: 'Piazza Stazione, 23037 Tirano SO, Italy', day: 3 },
  { name: 'Venezia Santa Lucia', lat: 45.441, lng: 12.3208, address: 'Fondamenta Santa Lucia, 30121 Venezia VE, Italy', day: 6 },
]

const NEW_ENTRY = 'Night market on the river'
const ASAKUSA = 'First morning in Asakusa'

/** The body of an API answer, or a loud failure naming what was asked. */
async function answer<T>(res: APIResponse, what: string): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`)
  return (await res.json()) as T
}

/** The list inside an answer that comes either bare or wrapped in `{ key: [...] }`. */
function listIn<T>(body: unknown, key: string): T[] {
  if (Array.isArray(body)) return body as T[]
  return ((body as Record<string, T[]>)[key] ?? []) as T[]
}

async function tripId(page: Page, title: string): Promise<number> {
  const body = await answer<unknown>(await page.request.get('/api/trips'), 'list trips')
  // Exact title: a copy another screen's guide made is "Weekend in Lisbon" plus something.
  const trip = listIn<{ id: number; title: string }>(body, 'trips').find(t => t.title === title)
  if (!trip) throw new Error(`fixture trip "${title}" is missing`)
  return trip.id
}

async function tripPlaces(page: Page, trip: number): Promise<{ id: number; name: string }[]> {
  return listIn<{ id: number; name: string }>(await answer<unknown>(await page.request.get(`/api/trips/${trip}/places`), 'list places'), 'places')
}

/** Put the stops on the trip, each on its day; those already there are left alone. */
async function addTripStops(page: Page, title: string, stops: TripStop[]): Promise<void> {
  const trip = await tripId(page, title)
  const have = await tripPlaces(page, trip)
  const days = listIn<{ id: number; day_number?: number; date?: string }>(
    await answer<unknown>(await page.request.get(`/api/trips/${trip}/days`), 'list days'), 'days',
  ).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0) || String(a.date).localeCompare(String(b.date)))
  for (const { day, ...place } of stops) {
    if (have.some(p => p.name === place.name)) continue
    const { place: created } = await answer<{ place: { id: number } }>(
      await page.request.post(`/api/trips/${trip}/places`, { data: place }), `add "${place.name}"`,
    )
    const dayId = days[day]?.id
    if (!dayId) throw new Error(`trip "${title}" has no day ${day + 1}`)
    await answer(await page.request.post(`/api/trips/${trip}/days/${dayId}/assignments`, { data: { place_id: created.id } }), `put "${place.name}" on day ${day + 1}`)
  }
}

/** Take the stops off the trip again, by name, so only what the guide added goes. */
async function removeTripStops(page: Page, title: string, stops: TripStop[]): Promise<void> {
  const trip = await tripId(page, title)
  for (const place of await tripPlaces(page, trip)) {
    if (!stops.some(s => s.name === place.name)) continue
    await answer(await page.request.delete(`/api/trips/${trip}/places/${place.id}`), `remove "${place.name}"`)
  }
}

async function deleteJourneysNamed(page: Page, title: string): Promise<void> {
  const { journeys } = await answer<{ journeys: { id: number; title: string }[] }>(await page.request.get('/api/journeys'), 'list journeys')
  for (const j of journeys.filter(x => x.title === title)) {
    await answer(await page.request.delete(`/api/journeys/${j.id}`), `delete journey "${title}"`)
  }
}

interface JournalEntry { id: number; title: string | null; photos?: { id: number }[] }

async function journalEntries(page: Page): Promise<JournalEntry[]> {
  const { entries } = await answer<{ entries: JournalEntry[] }>(await page.request.get(`/api/journeys/${journeyId}/entries`), 'list entries')
  return entries
}

async function journalEntry(page: Page, title: string): Promise<JournalEntry> {
  const entry = (await journalEntries(page)).find(e => e.title === title)
  if (!entry) throw new Error(`entry "${title}" is missing`)
  return entry
}

async function deleteEntriesNamed(page: Page, title: string): Promise<void> {
  for (const entry of (await journalEntries(page)).filter(e => e.title === title)) {
    await answer(await page.request.delete(`/api/journeys/entries/${entry.id}`), `delete entry "${title}"`)
  }
}

/**
 * Leave an entry with the photo the fixtures gave it and nothing else. That
 * photo was uploaded first, so it has the lowest id; it goes back to the front
 * as well, in case a guide made another one the cover.
 */
async function resetEntryPhotos(page: Page, title: string): Promise<void> {
  const photos = [...((await journalEntry(page, title)).photos ?? [])].sort((a, b) => a.id - b.id)
  for (const photo of photos.slice(1)) {
    await answer(await page.request.delete(`/api/journeys/photos/${photo.id}`), `delete a photo of "${title}"`)
  }
  if (photos[0]) await answer(await page.request.patch(`/api/journeys/photos/${photos[0].id}`, { data: { sort_order: 0 } }), `put the first photo of "${title}" back in front`)
}

/** The fixtures give this entry no verdict; null is what an entry without one holds. */
async function clearVerdict(page: Page, title: string): Promise<void> {
  const entry = await journalEntry(page, title)
  await answer(await page.request.patch(`/api/journeys/entries/${entry.id}`, { data: { pros_cons: null } }), `clear the verdict of "${title}"`)
}

async function removeContributor(page: Page, username: string): Promise<void> {
  const { contributors } = await answer<{ contributors: { user_id: number; username: string; role: string }[] }>(
    await page.request.get(`/api/journeys/${journeyId}`), 'read the journey',
  )
  for (const c of contributors.filter(x => x.username === username && x.role !== 'owner')) {
    await answer(await page.request.delete(`/api/journeys/${journeyId}/contributors/${c.user_id}`), `remove ${username}`)
  }
}

async function deleteShareLink(page: Page): Promise<void> {
  // Answered with success whether or not a link exists.
  await answer(await page.request.delete(`/api/journeys/${journeyId}/share-link`), 'delete the share link')
}

async function unlinkTrip(page: Page, title: string): Promise<void> {
  const trip = await tripId(page, title)
  const res = await page.request.delete(`/api/journeys/${journeyId}/trips/${trip}`)
  // The owner is answered with success whether or not the trip was linked.
  await answer(res, `unlink "${title}"`)
}

// ── Studio ────────────────────────────────────────────────────────────────────

const rail = (page: Page) => page.locator('.st-rail')
const railButton = (page: Page, name: string) => rail(page).getByRole('button', { name, exact: true })
const sidePanel = (page: Page) => page.locator('.st-panel.st-side')
const inspector = (page: Page) => page.locator('.st-inspector')
const studioMenu = (page: Page) => page.locator('.st-menu').last()
/** The export dialog: the shared DialogShell over Studio, titled Export. */
const exportDialog = (page: Page) => page.getByRole('dialog', { name: 'Export' })
const thumbs = (page: Page) => page.locator('.st-thumb-row')
/** The hit targets over the spread, one per element. */
const sheetElements = (page: Page) => page.locator('.st-sheet > div[style*="left:"]')

async function studioSection(page: Page, name: string): Promise<void> {
  await railButton(page, name).click()
  await expect(sidePanel(page)).toBeVisible()
  await settle(page)
}

async function relayoutBook(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Auto layout' }).click()
  await studioMenu(page).getByText('The whole book').click()
  await expect.poll(async () => thumbs(page).count(), { timeout: 30_000 }).toBeGreaterThan(6)
  await settle(page)
  await page.waitForTimeout(800)
}

/**
 * Studio over the journal. A journey with no book yet opens on an empty one,
 * so the first visit lays the book out; every guide then finds pages to work
 * on, and the overview picture shows a book rather than blank covers.
 */
async function openStudio(page: Page): Promise<void> {
  await page.goto(`/journey/${journeyId}/studio`)
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(page.locator('.st-bar')).toBeVisible({ timeout: 30_000 })
  await expect(rail(page)).toBeVisible({ timeout: 30_000 })
  await studioSection(page, 'Pages')
  // An untouched book is cover, first page, one empty spread, last page and back: five thumbnails.
  if ((await thumbs(page).count()) < 7) await relayoutBook(page)
  await settle(page)
  await page.waitForTimeout(800)
}

const SCRIPTS: Record<string, GuideScript> = {
  // ── /journey ────────────────────────────────────────────────────────────
  'create-journey': {
    guide: guide('create-journey'),
    // The ticked trip needs places on its days, or the counter reads 0 and the
    // new journal opens empty, which is the opposite of what the result says.
    start: async p => {
      await deleteJourneysNamed(p, NEW_JOURNEY)
      await addTripStops(p, LISBON_TRIP, LISBON_STOPS)
      await openJourneys(p)
    },
    cleanup: async p => {
      await deleteJourneysNamed(p, NEW_JOURNEY)
      await removeTripStops(p, LISBON_TRIP, LISBON_STOPS)
    },
    steps: [
      {
        target: createCard,
        act: async p => {
          await createCard(p).click()
          await expect(dialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: dialogCard,
        act: async p => {
          await typeInto(p, dialog(p).locator('input').first(), NEW_JOURNEY)
          await typeInto(p, dialog(p).locator('input').nth(1), 'Two days of tiles and custard tarts')
          // By accessible name, not by a substring: a copy of the trip made by
          // another screen's guide is also "Weekend in Lisbon something".
          await dialog(p).getByRole('checkbox', { name: /^Weekend in Lisbon \d+ days/ }).click()
          await beat(p, 400)
        },
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Create Journey' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Create Journey' }).click()
          await expect(p).toHaveURL(/\/journey\/\d+/, { timeout: 15_000 })
          await expect(p.getByRole('button', { name: 'Add Entry' }).first()).toBeVisible({ timeout: 20_000 })
          // The trip's places, now suggestions on their days, are what the result is about.
          await expect(namedSuggestion(p, LISBON_STOPS[0].name)).toBeVisible({ timeout: 20_000 })
          await blurFocus(p)
          await settle(p)
          await p.waitForTimeout(600)
        },
      },
    ],
  },

  'open-journey': {
    guide: guide('open-journey'),
    start: openJourneys,
    steps: [
      {
        target: p => journeyCard(p, SECOND_JOURNEY.title),
      },
    ],
  },

  'continue-writing': {
    guide: guide('continue-writing'),
    start: openJourneys,
    steps: [
      {
        target: p => p.getByText('Continue writing').first(),
      },
    ],
  },

  // ── /journey/:id ────────────────────────────────────────────────────────
  'add-entry': {
    guide: guide('add-entry'),
    start: async p => {
      await deleteEntriesNamed(p, NEW_ENTRY)
      await openJournal(p)
    },
    cleanup: p => deleteEntriesNamed(p, NEW_ENTRY),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Add Entry' }).first(),
        act: openEditor,
      },
      {
        // The name is typed into the head band. Ringing the band keeps the story box and
        // its Markdown toolbar in the frame below it; ringing the story box cuts the band
        // off, and a ring round the name field alone runs through the eyebrow above it.
        target: p => editor(p).locator('header'),
        act: async p => {
          await typeInto(p, editor(p).getByPlaceholder('Give this moment a name...'), NEW_ENTRY)
          await typeInto(
            p,
            editor(p).getByPlaceholder('Write your story...'),
            'Lanterns along the Kamo, grilled sweetfish on sticks and a jazz trio nobody had booked. We stayed until the last stall packed up.',
          )
          await beat(p, 400)
        },
      },
      {
        // The editor's right column: date, location, mood and weather, which is
        // everything the step names (the verdict sits at its top).
        target: p => editor(p).getByRole('group', { name: 'Mood' }).locator('xpath=../..'),
        act: async p => {
          await editor(p).getByRole('button', { name: 'Amazing' }).click()
          await editor(p).getByRole('button', { name: 'Partly cloudy' }).click()
          await beat(p, 400)
        },
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Save', exact: true }),
        act: async p => {
          await editor(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(editor(p)).toHaveCount(0, { timeout: 15_000 })
          await expect(entryCard(p, NEW_ENTRY)).toBeVisible()
          // It lands on today, the last day, far below the top of the timeline
          // where the journal stays after the editor closes.
          await entryCard(p, NEW_ENTRY).evaluate(el => el.scrollIntoView({ block: 'center' }))
          await blurFocus(p)
          await settle(p)
        },
      },
    ],
  },

  // Make 1st is offered on a saved photo that is not first yet; files just
  // picked wait for Save and have none. So the entry is one that already holds
  // two photos (the fixtures' one and a second put there at the start), the
  // upload adds a third, and step 3 shows the second with Make 1st on it.
  'entry-photos': {
    guide: guide('entry-photos'),
    start: async p => {
      await resetEntryPhotos(p, ASAKUSA)
      const entry = await journalEntry(p, ASAKUSA)
      const grove = await filesImageFixture('arashiyama')
      await answer(await p.request.post(`/api/journeys/entries/${entry.id}/photos`, {
        multipart: { photos: { name: 'morning-light.jpg', mimeType: 'image/jpeg', buffer: readFileSync(grove) } },
      }), `add a second photo to "${ASAKUSA}"`)
      await openJournal(p)
    },
    cleanup: p => resetEntryPhotos(p, ASAKUSA),
    steps: [
      {
        target: p => entryMenu(p, ASAKUSA),
        act: p => editEntry(p, ASAKUSA),
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Upload photos' }),
        act: async p => {
          const before = await photoTiles(p).count()
          await editor(p).locator('input[type="file"][multiple]').setInputFiles(await filesImageFixture('jr-pass-map'))
          await expect(photoTiles(p)).toHaveCount(before + 1, { timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The second saved photo; the target is hovered for the picture, which shows its Make 1st.
        target: p => photoTiles(p).nth(1),
        act: async p => {
          await photoTiles(p).nth(1).getByRole('button', { name: 'Make 1st' }).click()
          await beat(p, 400)
          await editor(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(editor(p)).toHaveCount(0, { timeout: 30_000 })
          await expect(entryCard(p, ASAKUSA).locator('img').first()).toBeVisible({ timeout: 15_000 })
          await blurFocus(p)
          await settle(p)
        },
      },
    ],
  },

  suggestions: {
    guide: guide('suggestions'),
    start: openJournal,
    steps: [
      {
        target: suggestion,
      },
      {
        target: p => suggestion(p).getByRole('button', { name: 'Dismiss this suggestion' }),
        act: async p => {
          const before = await p.getByRole('button', { name: 'Dismiss this suggestion' }).count()
          await suggestion(p).getByRole('button', { name: 'Dismiss this suggestion' }).click()
          // A place kept across two days is two suggestions, so one click can take two away.
          await expect.poll(() => p.getByRole('button', { name: 'Dismiss this suggestion' }).count()).toBeLessThan(before)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await openSettings(p)
          await dialog(p).getByText('Bring back dismissed suggestions').scrollIntoViewIfNeeded()
        },
        target: p => dialog(p).getByText('Bring back dismissed suggestions').locator('xpath=../..'),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Bring back dismissed suggestions' }).click()
          await beat(p, 500)
          await closeDialog(p)
          await blurFocus(p)
        },
      },
    ],
  },

  'add-on-day': {
    guide: guide('add-on-day'),
    start: openJournal,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Add an entry on this day' }).nth(1),
        act: async p => {
          await p.getByRole('button', { name: 'Add an entry on this day' }).nth(1).click()
          await expect(editor(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => editor(p).getByText('Date', { exact: true }).locator('xpath=..'),
        act: cancelEditor,
      },
    ],
  },

  'pros-cons': {
    guide: guide('pros-cons'),
    start: async p => {
      await clearVerdict(p, ASAKUSA)
      await openJournal(p)
    },
    cleanup: p => clearVerdict(p, ASAKUSA),
    steps: [
      {
        prepare: async p => {
          await editEntry(p, ASAKUSA)
          await editor(p).getByText('Pros & Cons').scrollIntoViewIfNeeded()
          await settle(p)
        },
        target: p => editor(p).getByText('Pros & Cons').locator('xpath=../..'),
        act: async p => {
          // Two pros through Add another, as the step says, and one con: two short lists.
          await typeInto(p, editor(p).getByPlaceholder('Something great...').last(), 'Empty courtyard at seven')
          await editor(p).getByRole('button', { name: 'Add another' }).first().click()
          await typeInto(p, editor(p).getByPlaceholder('Something great...').last(), 'Soba as the counter opened')
          await typeInto(p, editor(p).getByPlaceholder('Not so great...').last(), 'Coffee only after nine')
          await beat(p, 400)
        },
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Save', exact: true }),
        act: async p => {
          await editor(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(editor(p)).toHaveCount(0, { timeout: 15_000 })
          await expect.poll(async () => {
            const res = await p.request.get(`/api/journeys/${journeyId}/entries`)
            const { entries } = (await res.json()) as { entries: { title: string | null; pros_cons?: { pros?: string[] } | null }[] }
            return entries.find(e => e.title === ASAKUSA)?.pros_cons?.pros ?? []
          }).toContain('Empty courtyard at seven')
          // The card folds the verdict behind Show more; the result is about the verdict.
          await entryCard(p, ASAKUSA).getByRole('button', { name: 'Show more' }).click()
          const verdict = entryCard(p, ASAKUSA).getByText('Empty courtyard at seven')
          await expect(verdict).toBeVisible()
          await verdict.evaluate(el => el.scrollIntoView({ block: 'center' }))
          await blurFocus(p)
          await settle(p)
        },
      },
    ],
  },

  'search-journey': {
    guide: guide('search-journey'),
    start: openJournal,
    steps: [
      {
        // The pill round the field, which carries the magnifier and the border.
        target: p => p.getByPlaceholder('Search this journey').locator('xpath=..'),
        act: async p => {
          await typeInto(p, p.getByPlaceholder('Search this journey'), 'crossing')
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByPlaceholder('Search this journey').fill('')
          await settle(p)
        },
        target: p => p.getByRole('button', { name: /^(Hide|Show) suggestions$/ }).first(),
      },
    ],
  },

  'gallery-map': {
    guide: guide('gallery-map'),
    start: openJournal,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Gallery' }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Gallery' }).first().click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Timeline', exact: true }).first().click()
          await settle(p)
        },
        target: mapPanel,
      },
    ],
  },

  'entry-fields': {
    guide: guide('entry-fields'),
    start: openJournal,
    steps: [
      {
        target: settingsButton,
        act: openSettings,
      },
      {
        prepare: async p => { await dialog(p).getByText('Entry fields', { exact: true }).scrollIntoViewIfNeeded() },
        // The label sits in a row of its own, so the section with its switches is two levels up.
        target: p => dialog(p).getByText('Entry fields', { exact: true }).locator('xpath=../..'),
        act: closeDialog,
      },
    ],
  },

  // The spare trip gets stations on its days first: a trip without places adds
  // nothing to the journal, and the result would show no change at all.
  'journey-status': {
    guide: guide('journey-status'),
    start: openJournal,
    steps: [
      { target: settingsButton, act: openSettings },
      {
        prepare: async p => {
          const status = dialog(p).getByRole('group', { name: 'Status' })
          await status.scrollIntoViewIfNeeded()
          await status.getByRole('button', { name: 'Completed' }).click()
          await expect(status.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
        target: p => dialog(p).getByRole('group', { name: 'Status' }).locator('xpath=..'),
      },
    ],
    cleanup: async p => {
      const status = dialog(p).getByRole('group', { name: 'Status' })
      if (await status.count()) {
        await status.getByRole('button', { name: 'Automatic' }).click()
        await settle(p)
      }
    },
  },
  'link-trip': {
    guide: guide('link-trip'),
    start: async p => {
      await unlinkTrip(p, SPARE_TRIP.title)
      await addTripStops(p, SPARE_TRIP.title, ALPS_STOPS)
      await openJournal(p)
    },
    cleanup: async p => {
      await unlinkTrip(p, SPARE_TRIP.title)
      await removeTripStops(p, SPARE_TRIP.title, ALPS_STOPS)
    },
    steps: [
      {
        target: settingsButton,
        act: openSettings,
      },
      {
        prepare: async p => { await dialog(p).getByRole('button', { name: 'Add Trip' }).scrollIntoViewIfNeeded() },
        target: p => dialog(p).getByRole('button', { name: 'Add Trip' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Add Trip' }).click()
          await expect(dialog(p).getByPlaceholder('Trip name or destination...')).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => dialog(p).getByText(SPARE_TRIP.title).locator('xpath=../..'),
        act: async p => {
          await dialog(p).getByText(SPARE_TRIP.title).locator('xpath=../..').getByRole('button', { name: 'Link' }).click()
          await beat(p, 600)
          // Linking closes the picker and the settings under it once the server has
          // answered; waiting for that keeps the X from racing the request.
          await expect(p.getByPlaceholder('Trip name or destination...')).toHaveCount(0, { timeout: 15_000 })
          if (await anyDialog(p).count()) await closeDialog(p)
          // Its days come months after the running trip, at the foot of the
          // timeline, so the result is taken there, on the first new suggestion.
          const first = namedSuggestion(p, ALPS_STOPS[0].name)
          await expect(first).toBeVisible({ timeout: 15_000 })
          await first.evaluate(el => el.scrollIntoView({ block: 'center' }))
          await blurFocus(p)
          await settle(p)
          await p.waitForTimeout(600) // the map follows the scroll
        },
      },
    ],
  },

  // The link is deleted again afterwards: left in place, it shows up in every
  // later picture of the settings, archive-journey's among them.
  'share-public': {
    guide: guide('share-public'),
    start: async p => {
      await deleteShareLink(p)
      await openJournal(p)
    },
    cleanup: deleteShareLink,
    steps: [
      {
        prepare: async p => {
          await openSettings(p)
          await dialog(p).getByText('Public Share').scrollIntoViewIfNeeded()
        },
        target: p => dialog(p).getByText('Public Share').locator('xpath=..'),
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Create share link' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Create share link' }).click()
          await expect(dialog(p).getByRole('button', { name: 'Copy' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => dialog(p).getByText('Public Share').locator('xpath=..'),
        act: closeDialog,
      },
    ],
  },

  contributors: {
    guide: guide('contributors'),
    start: async p => {
      await removeContributor(p, 'jonas')
      await openJournal(p)
    },
    cleanup: p => removeContributor(p, 'jonas'),
    steps: [
      {
        prepare: async p => {
          await openSettings(p)
          await dialog(p).getByRole('button', { name: 'Invite Contributor' }).scrollIntoViewIfNeeded()
        },
        // The button is the last thing in the Contributors section, so its parent is the whole section.
        target: p => dialog(p).getByRole('button', { name: 'Invite Contributor' }).locator('xpath=..'),
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Invite Contributor' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Invite Contributor' }).click()
          const search = p.getByPlaceholder('Username or email...')
          await expect(search).toBeVisible()
          await typeInto(p, search, 'jonas')
          await dialog(p).locator('button').filter({ hasText: 'jonas' }).first().click()
          await settle(p)
        },
      },
      {
        // The role switch at the left of the footer, with Invite beside it in the
        // frame. Not the footer itself: it spans the panel edge to edge, and a ring
        // round it runs past the panel's rounded corners.
        target: p => dialog(p).getByRole('group', { name: 'Role' }),
        hover: p => dialog(p).getByRole('group', { name: 'Role' }).getByRole('button', { name: 'Editor' }).hover(),
        act: async p => {
          await dialog(p).getByRole('group', { name: 'Role' }).getByRole('button', { name: 'Editor' }).click()
          await dialog(p).getByRole('button', { name: 'Invite', exact: true }).click()
          // The invite lists jonas as well, so the settings are checked only once it has closed.
          await expect(p.getByPlaceholder('Username or email...')).toHaveCount(0, { timeout: 15_000 })
          await expect(dialog(p).getByText('jonas')).toBeVisible({ timeout: 15_000 })
          await beat(p, 500)
          await closeDialog(p)
        },
      },
    ],
  },

  studio: {
    guide: guide('studio'),
    start: openJournal,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Studio', exact: true }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Studio', exact: true }).first().click()
          await expect(p).toHaveURL(/\/studio/, { timeout: 15_000 })
          await expect(p.locator('.st-bar')).toBeVisible({ timeout: 30_000 })
          await settle(p)
          await p.waitForTimeout(1200)
        },
      },
      {
        target: p => p.locator('.st-back'),
      },
    ],
  },

  'archive-journey': {
    guide: guide('archive-journey'),
    start: openJournal,
    steps: [
      {
        target: settingsButton,
        act: openSettings,
      },
      {
        // Delete and Archive Journey, at the left of the footer. The footer as a
        // whole spans the panel edge to edge and its ring would run past the
        // panel's corners, so the two are marked as a group.
        prepare: p => markGroup(p, dialogCard(p).locator('footer').getByRole('button', { name: /^(Delete|Archive Journey|Restore Journey)$/ })),
        target: groupMark,
        // The pointer waits in the empty middle of the footer: on either button it
        // brings up a tooltip right where the step's number goes.
        hover: async p => {
          const footer = await dialogCard(p).locator('footer').boundingBox()
          if (footer) await p.mouse.move(footer.x + footer.width / 2, footer.y + footer.height / 2)
        },
        act: async p => {
          await unmarkGroup(p)
          await closeDialog(p)
        },
      },
    ],
  },

  // ── /journey/:id/studio ─────────────────────────────────────────────────
  'studio-auto-layout': {
    guide: guide('studio-auto-layout'),
    start: openStudio,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Auto layout' }),
        act: async p => {
          await p.getByRole('button', { name: 'Auto layout' }).click()
          await expect(studioMenu(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: studioMenu,
        act: async p => {
          await studioMenu(p).getByText('The whole book').click()
          await expect.poll(async () => thumbs(p).count(), { timeout: 30_000 }).toBeGreaterThan(6)
          await settle(p)
          await p.waitForTimeout(800)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Undo' }),
      },
    ],
  },

  'studio-pages': {
    guide: guide('studio-pages'),
    start: openStudio,
    steps: [
      {
        target: p => railButton(p, 'Pages'),
        act: async p => { await studioSection(p, 'Pages') },
      },
      {
        target: p => sidePanel(p).getByRole('button', { name: 'Add spread' }),
        act: async p => {
          const before = await thumbs(p).count()
          await sidePanel(p).getByRole('button', { name: 'Add spread' }).click()
          await expect(thumbs(p)).toHaveCount(before + 1)
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await thumbs(p).nth(2).scrollIntoViewIfNeeded()
          await thumbs(p).nth(2).hover()
        },
        target: p => thumbs(p).nth(2),
      },
    ],
  },

  'studio-layouts': {
    guide: guide('studio-layouts'),
    start: openStudio,
    steps: [
      {
        prepare: async p => {
          await studioSection(p, 'Pages')
          await thumbs(p).nth(2).locator('.st-thumb').click()
          await settle(p)
        },
        target: p => railButton(p, 'Layouts'),
        act: async p => { await studioSection(p, 'Layouts') },
      },
      {
        target: p => sidePanel(p).locator('.st-tile, .st-thumb').nth(3),
        act: async p => {
          await sidePanel(p).locator('.st-tile, .st-thumb').nth(3).click()
          await settle(p)
          await p.waitForTimeout(600)
        },
      },
    ],
  },

  'studio-content': {
    guide: guide('studio-content'),
    start: openStudio,
    steps: [
      {
        target: p => railButton(p, 'Content'),
        act: async p => { await studioSection(p, 'Content') },
      },
      {
        target: p => sidePanel(p).locator('.st-photo-grid').first(),
        act: async p => {
          const add = sidePanel(p).locator('button[title="Add to this page"]').first()
          await add.hover()
          await add.click()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await sidePanel(p).locator('.st-tabs button').filter({ hasText: 'Entries' }).click()
          await expect(sidePanel(p).locator('.st-entry').first()).toBeVisible()
          await settle(p)
        },
        target: p => sidePanel(p).locator('.st-entry').first(),
        act: async p => {
          await sidePanel(p).locator('.st-entry').first().getByRole('button', { name: 'Title', exact: true }).click()
          await settle(p)
        },
      },
    ],
  },

  'studio-elements': {
    guide: guide('studio-elements'),
    start: openStudio,
    steps: [
      {
        target: p => railButton(p, 'Elements'),
        act: async p => { await studioSection(p, 'Elements') },
      },
      {
        target: sidePanel,
      },
    ],
  },

  'studio-travel': {
    guide: guide('studio-travel'),
    start: openStudio,
    steps: [
      {
        target: p => railButton(p, 'Travel'),
        act: async p => { await studioSection(p, 'Travel') },
      },
      {
        target: sidePanel,
      },
    ],
  },

  'studio-properties': {
    guide: guide('studio-properties'),
    start: openStudio,
    steps: [
      {
        prepare: async p => {
          await studioSection(p, 'Pages')
          await thumbs(p).nth(2).locator('.st-thumb').click()
          await settle(p)
          await expect(sheetElements(p).first()).toBeVisible()
        },
        target: p => sheetElements(p).first(),
        act: async p => {
          await sheetElements(p).first().click()
          await expect(inspector(p).getByRole('button', { name: 'Delete' })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: inspector,
      },
      {
        target: p => inspector(p).getByRole('button', { name: 'Delete' }).locator('xpath=..'),
      },
    ],
  },

  'studio-format': {
    guide: guide('studio-format'),
    start: openStudio,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Page format' }),
        act: async p => {
          await p.getByRole('button', { name: 'Page format' }).click()
          await expect(studioMenu(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: studioMenu,
        act: async p => {
          await p.keyboard.press('Escape')
          if (await studioMenu(p).isVisible()) await p.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2)
        },
      },
    ],
  },

  'studio-export': {
    guide: guide('studio-export'),
    start: openStudio,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Export' }),
        act: async p => {
          await p.getByRole('button', { name: 'Export' }).click()
          await expect(exportDialog(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // Single pages, Spreads and Crop marks: three pressable rows in two
        // sections, marked as one group with the sections' labels, so the
        // step's number sits above LAYOUT instead of on it. The pointer rests
        // on the chosen row, which has no hover look, so no row looks picked
        // that is not.
        prepare: p => markGroup(p, exportDialog(p).locator('section')),
        target: groupMark,
        hover: p => exportDialog(p).getByRole('button', { name: /^Single pages/ }).hover(),
        act: unmarkGroup,
      },
      {
        target: p => exportDialog(p).getByRole('button', { name: 'Print view' }),
        act: async p => {
          // Print view would open the browser's print window; the X closes the dialog instead.
          await exportDialog(p).getByRole('button', { name: 'Close', exact: true }).click()
          await expect(exportDialog(p)).toHaveCount(0)
        },
      },
    ],
  },

  'studio-spread-file': {
    guide: guide('studio-spread-file'),
    start: openStudio,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Download this spread' }),
      },
      {
        prepare: async p => { await studioSection(p, 'Pages') },
        target: p => sidePanel(p).getByRole('button', { name: 'Import', exact: true }),
      },
    ],
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureExtraTrips(request)
  journeyId = await ensureJourneyFixtures(request)
})

test('every registered journey guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...journeyContext.guides, ...journalContext.guides, ...studioContext.guides].sort())
})

test('hero: journey', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, journeyContext.id, openJourneys)
})

test('hero: journey-detail', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, journalContext.id, openJournal)
})

test('hero: journey-studio', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, studioContext.id, openStudio)
})

for (const id of [...journeyContext.guides, ...journalContext.guides, ...studioContext.guides]) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
