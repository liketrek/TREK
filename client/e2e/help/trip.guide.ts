import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureUsers, seededTrip, ADMIN_USERS, JOURNEY_TITLE } from './fixtures'
import { openTrip, openTripOnDay, modal, confirmDialog } from './trip-shared'
import { mockTripAssistant, resetTripAssistant, QUESTION, SUGGESTED, type AssistantRun } from './fixtures-assistant'
import { tripContext, tripGuides } from '../../src/help/contexts/trip'
import type { HelpGuide } from '../../src/help/types'

/** The round button at the bottom of the planner, not the navbar's twin of the same name. */
const assistantLauncher = (page: Page) => page.locator('button.trek-assistant-pop')
const assistantWindow = (page: Page) => page.getByRole('dialog', { name: 'Assistant', exact: true })
/** The answer's card of changes: the last section inside the window, by its title while it waits. */
const changeCard = (page: Page) =>
  assistantWindow(page).locator('section').filter({ has: page.getByText('Suggested changes', { exact: true }) }).last()
/** What the mocked chat made for real, for cleanup. */
let assistantRun: AssistantRun | null = null

/**
 * Actions for the trip frame, keyed by the ids in `src/help/contexts/trip.ts`:
 * the trip's Settings (people, sharing, the linked journal, the trip's addons
 * and its own form), the columns and the undo. They run on the seeded "Autumn in Japan"; what a guide creates (a
 * member, a guest, a link, a linked journal) it leaves for the next one or
 * takes away again in `cleanup`.
 */

const guide = (id: string): HelpGuide => {
  const g = tripGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/**
 * A part of the Settings dialog by the words it opens with: a DialogSection
 * (its label) or a LinkCard (its title). The areas around them are sections
 * too, but they open with the area's own name, so they never match.
 */
const block = (page: Page, opening: RegExp) => modal(page).locator('section').filter({ hasText: opening }).first()
const inviteBlock = (page: Page) => block(page, /^Invite User/)
const accessBlock = (page: Page) => block(page, /^Access\s*\d/)
/** An area in the dialog's list on the left; each carries the area's name as its label. */
type AreaName = 'People' | 'Sharing' | 'Journal' | 'Addons' | 'Edit Trip'
const area = (page: Page, name: AreaName) => modal(page).getByRole('button', { name, exact: true })
/** The Trip settings pill beside the trip's name. */
const settingsPill = (page: Page) => page.getByRole('button', { name: 'Trip settings', exact: true })
/**
 * The days column's fold tab: the one button straight inside the column's
 * frame, which sits 10px in from the left. Its name is Collapse while the
 * column is open and Plan once it is folded, and both names are taken
 * elsewhere (the day cards fold with Collapse, the first tab is Plan).
 */
const leftToggle = (page: Page) => page.locator('div[style*="left: 10px"][style*="top: 10px"] > button').first()
const leftDivider = (page: Page) => page.getByRole('separator', { name: 'Panel width' }).first()

async function clickSettings(page: Page): Promise<void> {
  await settingsPill(page).click()
  await expect(modal(page)).toBeVisible()
  await expect(modal(page).getByRole('heading', { name: 'Trip settings' })).toBeVisible()
  await settle(page)
}

async function openSettings(page: Page): Promise<void> {
  await openTrip(page)
  await clickSettings(page)
}

async function pickArea(page: Page, name: AreaName): Promise<void> {
  await area(page, name).click()
  await expect(area(page, name)).toHaveAttribute('aria-current', 'page')
  await settle(page)
}

const closeModal = async (page: Page): Promise<void> => {
  await page.keyboard.press('Escape')
  await expect(modal(page)).toHaveCount(0)
  // The dialog hands the focus back to the pill, whose focus ring would stay in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

/** Take the journal off the trip again; a trip without one answers that too, which is fine. */
async function unlinkJournal(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  await page.request.delete(`/api/trips/${tripId}/journal`)
}

const only = (target: (p: Page) => Locator) => ({ target })

/**
 * Wait until the first rows of the places column show their photos. A photo
 * that comes back late leaves the category icon in its place for good, so a
 * page that does not get them in time is opened again, at most twice.
 */
async function placePhotos(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const loaded = await page
      .waitForFunction(
        () => {
          const rows = [...document.querySelectorAll('[role="option"]')].slice(0, 8)
          return rows.length > 0 && rows.every(row => row.querySelector('img')?.complete)
        },
        null,
        { timeout: 15_000 },
      )
      .then(() => true)
      .catch(() => false)
    if (loaded) break
    await openTrip(page)
  }
  await settle(page)
}

/** The addon the trip-addons guide switches; its row in the Addons area is the switch's row. */
const ADDON_ID = 'roadtrip'
const ADDON_NAME = 'Road trip'
const addonSwitch = (page: Page) => modal(page).getByRole('button', { name: ADDON_NAME, exact: true })
/** A row of the Addons area: the switch's parent, with the tile, the name, the badge and the line under it. */
const addonRow = (page: Page) => addonSwitch(page).locator('xpath=..')
/** The list of every trip addon, one row each. */
const addonList = (page: Page) => addonRow(page).locator('xpath=..')

/** Back to whatever the instance says for the addon the guide switched. */
async function resetAddon(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  await page.request.put(`/api/trips/${tripId}/addons/${ADDON_ID}`, { data: { enabled: null } })
}

/** A panel of the trip's form by its heading: the heading, its CardHead, then the panel. */
const formPanel = (page: Page, heading: string) =>
  modal(page).getByRole('heading', { name: heading, exact: true }).locator('xpath=../../..')

const SCRIPTS: Record<string, GuideScript> = {
  'add-member': {
    guide: guide('add-member'),
    start: p => openTrip(p),
    steps: [
      {
        target: settingsPill,
        act: clickSettings,
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Select user…' }).click()
          // The select's list is rendered outside the dialog.
          await p.getByRole('button', { name: 'mara', exact: true }).last().click()
          await beat(p, 300)
        },
        target: inviteBlock,
        act: async p => {
          await modal(p).getByRole('button', { name: 'Invite', exact: true }).click()
          await expect(accessBlock(p).getByText('mara', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(accessBlock),
    ],
    cleanup: closeModal,
  },
  'trip-invite-link': {
    guide: guide('trip-invite-link'),
    start: async p => {
      await openSettings(p)
      await pickArea(p, 'Sharing')
    },
    steps: [
      {
        target: p => modal(p).getByRole('button', { name: 'Create invite link' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create invite link' }).click()
          await expect(modal(p).getByRole('button', { name: 'Regenerate' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => block(p, /^Trip invite link/)),
      // The row with Regenerate and Disable.
      only(p => modal(p).getByRole('button', { name: 'Regenerate' }).locator('xpath=..')),
    ],
    cleanup: async p => {
      await modal(p).getByRole('button', { name: 'Disable' }).click()
      await expect(modal(p).getByRole('button', { name: 'Create invite link' })).toBeVisible({ timeout: 15_000 })
      await closeModal(p)
    },
  },
  'add-guest': {
    guide: guide('add-guest'),
    start: openSettings,
    steps: [
      only(p => block(p, /^Guests/)),
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('Guest name'), 'Aunt Lise')
          await beat(p, 300)
        },
        target: p => modal(p).getByPlaceholder('Guest name').locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add guest' }).click()
          await expect(block(p, /^Guests/).getByText('Aunt Lise', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: closeModal,
  },
  'public-link': {
    guide: guide('public-link'),
    start: openSettings,
    steps: [
      {
        target: p => area(p, 'Sharing'),
        act: p => pickArea(p, 'Sharing'),
      },
      {
        // The chips under Options: Map & Plan, Bookings, Packing, Costs, Chat, then the two options.
        target: p => modal(p).getByRole('button', { name: 'Map & Plan' }).locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Packing', exact: true }).click()
          await expect(modal(p).getByRole('button', { name: 'Packing', exact: true })).toHaveAttribute('aria-pressed', 'true')
          await settle(p)
        },
      },
      {
        // The first of the two options; the pointer on it shows what it leaves out.
        target: p => modal(p).getByRole('button', { name: 'Travel & stays only' }),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create link', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create link', exact: true }).click()
          await expect(modal(p).getByRole('button', { name: 'Delete link' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => block(p, /^Public Link/),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Delete link' }).click()
          await expect(modal(p).getByRole('button', { name: 'Create link', exact: true })).toBeVisible({ timeout: 15_000 })
        },
      },
    ],
    // The chips live in the dialog until a link is saved, and the link is gone again.
    cleanup: closeModal,
  },
  'transfer-ownership': {
    guide: guide('transfer-ownership'),
    start: openSettings,
    steps: [
      only(p => modal(p).getByRole('button', { name: 'Make owner' }).first()),
      only(p => modal(p).getByRole('button', { name: 'Leave trip' })),
    ],
    cleanup: closeModal,
  },
  'link-journal': {
    guide: guide('link-journal'),
    start: async p => {
      await unlinkJournal(p)
      await openSettings(p)
    },
    steps: [
      {
        target: p => area(p, 'Journal'),
        act: async p => {
          await pickArea(p, 'Journal')
          await expect(modal(p).getByRole('button', { name: 'Link a journal' })).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Link a journal' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Link a journal' }).click()
          await modal(p).getByRole('button', { name: 'Choose a journal' }).click()
          // The select's list is rendered outside the dialog.
          await p.getByRole('button', { name: JOURNEY_TITLE, exact: true }).last().click()
          await expect(modal(p).getByText('Access for trip members', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The heading row (Everyone can read / Nobody) and a row per person.
        target: p => modal(p).getByText('Access for trip members', { exact: true }).locator('xpath=../..'),
        act: async p => {
          const edit = modal(p).getByRole('radio', { name: 'Edit' }).first()
          await edit.click()
          await expect(edit).toHaveAttribute('aria-checked', 'true')
          await settle(p)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Link journal', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Link journal', exact: true }).click()
          await expect(modal(p).getByText('Linked', { exact: true })).toBeVisible({ timeout: 15_000 })
          await closeModal(p)
          await expect(p.getByRole('button', { name: 'Journal', exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: unlinkJournal,
  },
  'trip-addons': {
    guide: guide('trip-addons'),
    start: async p => {
      await resetAddon(p)
      await openSettings(p)
    },
    steps: [
      {
        target: p => area(p, 'Addons'),
        act: async p => {
          await pickArea(p, 'Addons')
          await expect(addonSwitch(p)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: addonList,
        act: async p => {
          const before = await addonSwitch(p).getAttribute('aria-pressed')
          await addonSwitch(p).click()
          await expect(addonSwitch(p)).not.toHaveAttribute('aria-pressed', before ?? '')
          await expect(addonRow(p).getByText('This trip only', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: addonRow,
        // The result shows the trip with the addon switched.
        act: async p => {
          await closeModal(p)
          await placePhotos(p)
        },
      },
    ],
    cleanup: resetAddon,
  },
  'edit-trip-settings': {
    guide: guide('edit-trip-settings'),
    start: openSettings,
    steps: [
      {
        target: p => area(p, 'Edit Trip'),
        act: async p => {
          await pickArea(p, 'Edit Trip')
          await expect(formPanel(p, 'Name and description')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => formPanel(p, 'Name and description')),
      {
        target: p => modal(p).getByRole('button', { name: 'Update', exact: true }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Update', exact: true }).click()
          await expect(modal(p)).toHaveCount(0, { timeout: 15_000 })
          await settle(p)
        },
      },
    ],
  },
  'collapse-columns': {
    guide: guide('collapse-columns'),
    start: async p => {
      await openTrip(p)
      await placePhotos(p)
    },
    steps: [
      {
        target: leftToggle,
        act: async p => {
          await leftToggle(p).click()
          await expect(leftToggle(p)).toHaveAttribute('aria-label', 'Plan')
          await settle(p)
        },
      },
      {
        target: leftToggle,
        act: async p => {
          await leftToggle(p).click()
          await expect(p.getByRole('button', { name: 'Export' })).toBeVisible()
          await settle(p)
        },
      },
      {
        // The divider is invisible until hovered; the hover shows it.
        target: leftDivider,
        // Out to a wider column and back again, so the loop ends where it began.
        clip: async (p, frame) => {
          const box = await leftDivider(p).boundingBox()
          if (!box) throw new Error('the days column has no divider')
          const x = box.x + box.width / 2
          const y = box.y + box.height / 2
          await p.mouse.move(x, y)
          for (let i = 0; i < 3; i++) await frame()
          await p.mouse.down()
          for (let i = 1; i <= 16; i++) {
            await p.mouse.move(x + (140 * i) / 16, y, { steps: 2 })
            await frame()
          }
          for (let i = 0; i < 4; i++) await frame()
          for (let i = 1; i <= 16; i++) {
            await p.mouse.move(x + 140 - (140 * i) / 16, y, { steps: 2 })
            await frame()
          }
          await p.mouse.up()
          await p.waitForTimeout(300)
          for (let i = 0; i < 3; i++) await frame()
        },
      },
    ],
  },
  'undo-change': {
    guide: guide('undo-change'),
    start: async p => {
      const { tripId } = seededTrip()
      const created = await p.request.post(`/api/trips/${tripId}/places`, {
        data: { name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, address: '4 Chome Tsukiji, Chuo City, Tokyo' },
      })
      if (!created.ok()) throw new Error(`could not create the spare place: ${created.status()} ${await created.text()}`)
      // A change to undo: the spare place onto day 1, from the places column.
      // The day has to stay open for that: the + at the end of a row belongs to
      // the open day, and closing the day's details panel closes the day with it.
      await openTripOnDay(p, 1)
      // The picture shows the rows around it, so their photos have to be in
      // first; the spare place has none of its own and is left out of the wait.
      for (let attempt = 0; attempt < 3; attempt++) {
        const loaded = await p
          .waitForFunction(
            () => {
              // A place's avatar is an <img> with the place's name as its alt
              // while it has a photo, and the category icon once the photo is
              // given up. Day 1's places sit in the day plan and in the places
              // column, so each needs two loaded photos.
              const names = ['Senso-ji Temple', 'teamLab Planets']
              return names.every(name => {
                const imgs = [...document.querySelectorAll('img')].filter(img => img.alt === name)
                return imgs.length >= 2 && imgs.every(img => img.complete && img.naturalWidth > 0)
              })
            },
            null,
            { timeout: 20_000 },
          )
          .then(() => true)
          .catch(() => false)
        if (loaded) break
        await openTripOnDay(p, 1)
      }
      const row = p.getByRole('option', { name: /^Tsukiji Outer Market/ })
      await row.hover()
      const add = row.getByRole('button', { name: '+ Day' })
      await expect(add, 'the + that puts a place on the open day').toBeVisible({ timeout: 15_000 })
      await add.click()
      await expect(p.getByRole('button', { name: 'Undo' })).toBeEnabled({ timeout: 15_000 })
      await settle(p)
    },
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Undo' }),
        act: async p => {
          await p.getByRole('button', { name: 'Undo' }).click()
          await expect(p.getByText(/^Undone: /).first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      const { tripId } = seededTrip()
      const res = await p.request.get(`/api/trips/${tripId}/places`)
      const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
      const places = Array.isArray(body) ? body : (body.places ?? [])
      for (const place of places.filter(x => x.name === 'Tsukiji Outer Market')) {
        await p.request.delete(`/api/trips/${tripId}/places/${place.id}`)
      }
    },
  },
  'trip-assistant': {
    guide: guide('trip-assistant'),
    // No provider answers in the run: fixtures-assistant.ts answers for it, and Apply plans the place for real.
    start: async p => {
      assistantRun = await mockTripAssistant(p)
      await openTrip(p)
      await expect(assistantLauncher(p)).toBeVisible({ timeout: 20_000 })
      await settle(p)
    },
    steps: [
      {
        target: p => assistantLauncher(p),
        act: async p => {
          await assistantLauncher(p).click()
          await expect(assistantWindow(p).getByRole('textbox')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, assistantWindow(p).getByRole('textbox'), QUESTION)
          await beat(p, 300)
          await settle(p)
        },
        target: p => assistantWindow(p).locator('form').last(),
        hover: async p => { await assistantWindow(p).getByRole('button', { name: 'Send', exact: true }).hover() },
        act: async p => {
          await assistantWindow(p).getByRole('button', { name: 'Send', exact: true }).click()
          await expect(changeCard(p)).toBeVisible({ timeout: 20_000 })
          await expect(changeCard(p).getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()
          await settle(p)
        },
      },
      {
        target: p => changeCard(p),
        hover: async p => { await changeCard(p).getByRole('button', { name: 'Apply', exact: true }).hover() },
        act: async p => {
          await changeCard(p).getByRole('button', { name: 'Apply', exact: true }).click()
          await expect(assistantWindow(p).getByRole('button', { name: 'Undo', exact: true }).first()).toBeVisible({ timeout: 20_000 })
          // The place lands in day 1 of the plan behind the window, through the websocket.
          await expect(p.getByText(SUGGESTED.name, { exact: true }).first()).toBeVisible({ timeout: 20_000 })
          await settle(p)
        },
      },
      {
        target: p => assistantWindow(p).getByRole('button', { name: 'Share in the trip chat' }).last(),
        act: async p => {
          await assistantWindow(p).getByRole('button', { name: 'Share in the trip chat' }).last().click()
          await expect(confirmDialog(p).getByRole('button', { name: 'Share', exact: true })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      {
        target: p => confirmDialog(p),
        hover: async p => { await confirmDialog(p).getByRole('button', { name: 'Share', exact: true }).hover() },
        act: async p => {
          await confirmDialog(p).getByRole('button', { name: 'Share', exact: true }).click()
          await expect(p.getByText('Shared in the trip chat').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await resetTripAssistant(p.request, assistantRun)
      assistantRun = null
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  // The seed's members already have access; the invite needs someone who has not.
  await ensureUsers(request, ADMIN_USERS)
})

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test('every registered trip guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripContext.guides].sort())
})

test('hero: trip', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, tripContext.id, p => openTrip(p))
})

for (const id of tripContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
