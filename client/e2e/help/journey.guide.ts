import { test, expect, type Page } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureExtraTrips, ensureJourneyFixtures, coverFixture, JOURNEY_TITLE, SECOND_JOURNEY, SPARE_TRIP } from './fixtures'
import { journeyGuides, journeyContext, journalGuides, journalContext, studioGuides, studioContext } from '../../src/help/contexts/journey'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the two Journey screens, keyed by the ids in
 * `src/help/contexts/journey.ts`: the list at `/journey` and the open journal
 * at `/journey/:id`. The fixtures write three entries into the seeded
 * "Autumn in Japan" journey and leave the rest of its timeline as suggestions.
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
  await clearNotices(page)
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
/** Full-screen dialogs of this screen (create, settings, add trip, invite) all sit at z-200. */
const anyDialog = (page: Page) => page.locator('div.fixed.inset-0.z-\\[200\\]')
const dialog = (page: Page) => anyDialog(page).last()
const dialogCard = (page: Page) => dialog(page).locator('> div').first()
/** The entry editor. */
const editor = (page: Page) => page.locator('div.fixed.inset-0.z-\\[9999\\]')

/** A written entry's card in the timeline, and the ⋯ menu button on its cover. */
const entryCard = (page: Page, title: string) => page.locator('div[class*="rounded-[20px]"]').filter({ hasText: title }).first()
// Two builds of the button: on a photo cover (rounded-[10px]) and on a plain card (w-7 h-7 rounded-md).
const entryMenu = (page: Page, title: string) => entryCard(page, title).locator('button[class*="rounded-[10px]"], button.w-7.rounded-md').first()
/** A suggestion card: the one kind of card that carries a dismiss button. */
const suggestion = (page: Page) =>
  page.locator('[role="button"]').filter({ has: page.getByRole('button', { name: 'Dismiss this suggestion' }) }).first()
const settingsButton = (page: Page) => page.getByRole('button', { name: 'Journey Settings' }).first()
const mapPanel = (page: Page) => page.locator('aside').filter({ has: page.locator('.leaflet-container, .maplibregl-map, canvas') }).first()

async function openSettings(page: Page): Promise<void> {
  await settingsButton(page).click()
  await expect(dialog(page).getByText('Journey Settings')).toBeVisible()
  await settle(page)
}

/** Close whatever dialogs are stacked: Escape first, then the backdrop, until none is left. */
async function closeDialog(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  for (let i = 0; i < 3 && (await anyDialog(page).count()); i++) {
    await page.mouse.click(20, VIEWPORT.height / 2)
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

// ── Studio ────────────────────────────────────────────────────────────────────

const rail = (page: Page) => page.locator('.st-rail')
const railButton = (page: Page, name: string) => rail(page).getByRole('button', { name, exact: true })
const sidePanel = (page: Page) => page.locator('.st-panel.st-side')
const inspector = (page: Page) => page.locator('.st-inspector')
const studioMenu = (page: Page) => page.locator('.st-menu').last()
const exportDialog = (page: Page) => page.locator('.st-ex')
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
    start: openJourneys,
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
          await typeInto(p, dialog(p).locator('input').first(), 'Lisbon weekend')
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
    start: openJournal,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Add Entry' }).first(),
        act: openEditor,
      },
      {
        target: p => editor(p).getByPlaceholder('Write your story...'),
        act: async p => {
          await typeInto(p, editor(p).getByPlaceholder('Give this moment a name...'), 'Night market on the river')
          await typeInto(
            p,
            editor(p).getByPlaceholder('Write your story...'),
            'Lanterns along the Kamo, grilled sweetfish on sticks and a jazz trio nobody had booked. We stayed until the last stall packed up.',
          )
          await beat(p, 400)
        },
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Amazing' }).locator('xpath=../..'),
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
          await expect(entryCard(p, 'Night market on the river')).toBeVisible()
          await settle(p)
        },
      },
    ],
  },

  'entry-photos': {
    guide: guide('entry-photos'),
    start: openJournal,
    steps: [
      {
        target: p => entryMenu(p, 'Barefoot through the light'),
        act: async p => {
          await entryMenu(p, 'Barefoot through the light').click()
          await p.getByRole('button', { name: 'Edit', exact: true }).first().click()
          await expect(editor(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Upload photos' }),
        act: async p => {
          const file = await coverFixture()
          await editor(p).locator('input[type="file"][multiple]').setInputFiles(file)
          await expect(editor(p).locator('img').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => { await editor(p).locator('img').first().hover() },
        target: p => editor(p).getByRole('button', { name: 'Save', exact: true }),
        act: async p => {
          await editor(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(editor(p)).toHaveCount(0, { timeout: 30_000 })
          await expect(entryCard(p, 'Barefoot through the light').locator('img').first()).toBeVisible({ timeout: 15_000 })
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
        act: async p => {
          await editor(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(editor(p)).toHaveCount(0)
        },
      },
    ],
  },

  'pros-cons': {
    guide: guide('pros-cons'),
    start: openJournal,
    steps: [
      {
        prepare: async p => {
          await entryMenu(p, 'First morning in Asakusa').click()
          await p.getByRole('button', { name: 'Edit', exact: true }).first().click()
          await expect(editor(p)).toBeVisible()
          await editor(p).getByText('Pros & Cons').scrollIntoViewIfNeeded()
          await settle(p)
        },
        target: p => editor(p).getByText('Pros & Cons').locator('xpath=../..'),
        act: async p => {
          await typeInto(p, editor(p).getByPlaceholder('Something great...').last(), 'Empty courtyard at seven')
          await typeInto(p, editor(p).getByPlaceholder('Not so great...').last(), 'Coffee only after nine')
          await beat(p, 400)
        },
      },
      {
        target: p => editor(p).getByRole('button', { name: 'Save', exact: true }),
        act: async p => {
          await editor(p).getByRole('button', { name: 'Save', exact: true }).click()
          await expect(editor(p)).toHaveCount(0, { timeout: 15_000 })
          // The card folds a long entry, so the saved verdict is checked at the source.
          await expect.poll(async () => {
            const res = await p.request.get(`/api/journeys/${journeyId}/entries`)
            const { entries } = (await res.json()) as { entries: { title: string | null; pros_cons?: { pros?: string[] } | null }[] }
            return entries.find(e => e.title === 'First morning in Asakusa')?.pros_cons?.pros ?? []
          }).toContain('Empty courtyard at seven')
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
        target: p => p.getByPlaceholder('Search this journey'),
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
        prepare: async p => { await dialog(p).getByText('Entry fields').scrollIntoViewIfNeeded() },
        target: p => dialog(p).getByText('Entry fields').locator('xpath=..'),
        act: closeDialog,
      },
    ],
  },

  'link-trip': {
    guide: guide('link-trip'),
    start: openJournal,
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
          if (await anyDialog(p).count()) await closeDialog(p)
          await settle(p)
        },
      },
    ],
  },

  'share-public': {
    guide: guide('share-public'),
    start: openJournal,
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
    start: openJournal,
    steps: [
      {
        prepare: async p => {
          await openSettings(p)
          await dialog(p).getByRole('button', { name: 'Invite Contributor' }).scrollIntoViewIfNeeded()
        },
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
        target: p => dialog(p).getByRole('button', { name: 'Invite', exact: true }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Invite', exact: true }).click()
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
        prepare: async p => { await dialog(p).getByRole('button', { name: 'Archive Journey' }).scrollIntoViewIfNeeded() },
        target: p => dialog(p).getByRole('button', { name: 'Archive Journey' }).locator('xpath=..'),
        act: closeDialog,
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
        target: exportDialog,
      },
      {
        target: p => exportDialog(p).getByRole('button', { name: 'Print view' }),
        act: async p => {
          await exportDialog(p).getByRole('button', { name: 'Close' }).click()
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
