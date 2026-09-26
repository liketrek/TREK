import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureUsers, seededTrip, ADMIN_USERS } from './fixtures'
import { openTrip, openTripOnDay, modal } from './trip-shared'
import { tripContext, tripGuides } from '../../src/help/contexts/trip'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the trip frame, keyed by the ids in `src/help/contexts/trip.ts`:
 * the people of the trip (the Share dialog), the columns and the undo. They run
 * on the seeded "Autumn in Japan"; what a guide creates (a member, a guest, a
 * link) it leaves for the next one or takes away again in `cleanup`.
 */

const guide = (id: string): HelpGuide => {
  const g = tripGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The block of the Share dialog whose heading this is: the span sits in a row of its own inside the block. */
const block = (page: Page, heading: string | RegExp) => modal(page).getByText(heading, { exact: typeof heading === 'string' }).first().locator('xpath=../..')
/** The Invite User block: its heading is the label, right inside the block. */
const inviteBlock = (page: Page) => modal(page).locator('label').filter({ hasText: 'Invite User' }).locator('xpath=..')
/** The days column's fold toggle comes first in the page; the day cards' own Collapse buttons follow it. */
const leftToggle = (page: Page) => page.locator('button[title="Collapse"], button[title="Plan"]').first()

async function openShare(page: Page): Promise<void> {
  await openTrip(page)
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(modal(page)).toBeVisible()
  await expect(modal(page).getByRole('heading', { name: 'Share Trip' })).toBeVisible()
  await settle(page)
}

const closeModal = async (page: Page): Promise<void> => {
  await page.keyboard.press('Escape')
  await expect(modal(page)).toHaveCount(0)
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'add-member': {
    guide: guide('add-member'),
    start: p => openTrip(p),
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Share', exact: true }),
        act: async p => {
          await p.getByRole('button', { name: 'Share', exact: true }).click()
          await expect(modal(p).getByRole('heading', { name: 'Share Trip' })).toBeVisible()
          await settle(p)
        },
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
          await expect(block(p, /^Access \(/).getByText('mara', { exact: true })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => block(p, /^Access \(/)),
    ],
    cleanup: closeModal,
  },
  'trip-invite-link': {
    guide: guide('trip-invite-link'),
    start: openShare,
    steps: [
      {
        target: p => modal(p).getByRole('button', { name: 'Create invite link' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create invite link' }).click()
          await expect(modal(p).getByRole('button', { name: 'Regenerate' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => block(p, 'Trip invite link')),
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
    start: openShare,
    steps: [
      only(p => block(p, 'Guests')),
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('Guest name'), 'Aunt Lise')
          await beat(p, 300)
        },
        target: p => modal(p).getByPlaceholder('Guest name').locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Add guest' }).click()
          await expect(modal(p).getByText('Aunt Lise')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: closeModal,
  },
  'public-link': {
    guide: guide('public-link'),
    start: openShare,
    steps: [
      {
        target: p => modal(p).getByRole('button', { name: 'Map & Plan' }).locator('xpath=..'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Bookings', exact: true }).click()
          await beat(p, 300)
        },
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
        target: p => block(p, 'Public Link'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Delete link' }).click()
          await expect(modal(p).getByRole('button', { name: 'Create link', exact: true })).toBeVisible({ timeout: 15_000 })
        },
      },
    ],
    cleanup: closeModal,
  },
  'transfer-ownership': {
    guide: guide('transfer-ownership'),
    start: openShare,
    steps: [
      only(p => modal(p).getByRole('button', { name: 'Make owner' }).first()),
      only(p => modal(p).getByRole('button', { name: 'Leave trip' })),
    ],
    cleanup: closeModal,
  },
  'collapse-columns': {
    guide: guide('collapse-columns'),
    start: p => openTrip(p),
    steps: [
      {
        target: leftToggle,
        act: async p => {
          await leftToggle(p).click()
          await expect(p.locator('button[title="Plan"]')).toBeVisible()
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
        target: p => p.locator('div[style*="col-resize"]').first(),
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
      const row = p.getByRole('option', { name: /^Tsukiji Outer Market/ })
      await row.hover()
      const add = row.locator('button').last()
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
          await expect(p.getByRole('button', { name: 'Undo' })).toBeDisabled({ timeout: 15_000 })
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
