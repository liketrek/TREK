import { test, expect, type Page, type Locator } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { monthName, year } from '../dates'
import { vacayGuides, vacayContext } from '../../src/help/contexts/vacay'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the Vacay guides, keyed by the ids in `src/help/contexts/vacay.ts`.
 * They run in the order the context lists them and build on each other: the
 * year the calendar shows gets a few logged days, company holidays and a
 * public-holiday calendar as the run goes on, which is what a lived-in plan
 * looks like anyway.
 */

const YEAR = year()
/** The month after the picture day's: the first one the planner draws after the current. */
const NEXT_MONTH = monthName(1)

const guide = (id: string): HelpGuide => {
  const g = vacayGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

async function openVacay(page: Page): Promise<void> {
  await page.goto('/vacay')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(toolbar(page)).toBeVisible()
  await expect(monthCard(page, NEXT_MONTH)).toBeVisible()
}

/** The floating mode toolbar under the grid. */
const toolbar = (page: Page) => page.locator('.vg-card.rounded-full').first()
/** A month card by its (English) heading. */
const monthCard = (page: Page, month: string) => page.locator('.vg-card').filter({ hasText: month }).first()
/** A day cell inside a month card. */
const day = (page: Page, month: string, n: number) => monthCard(page, month).getByRole('button', { name: String(n), exact: true })
/** A sidebar card by its label (the DOM text; CSS uppercases it). */
const sideCard = (page: Page, label: string) => page.locator('.vg-card').filter({ hasText: label }).first()
/** The settings dialog. */
const settings = (page: Page) => page.locator('.trek-modal-backdrop')
/** The invite and share forms: small dialogs portalled to the body. */
const dialog = (page: Page) => page.locator('.trek-backdrop-enter').last()
/** The switch of a settings row, found through the row's label. */
const toggleRow = (page: Page, label: string): Locator =>
  settings(page).getByText(label, { exact: true }).locator('xpath=../../..').getByRole('button').first()

async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(settings(page)).toBeVisible()
  await settle(page)
}

async function closeSettings(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(settings(page)).toBeHidden()
  await settle(page)
}

/**
 * Pick an option in a CustomSelect: open it, filter, click the match inside
 * the open menu. Scoped to the menu on purpose: a calendar row already set to
 * "Germany" renders a trigger button of that very name, which a page-wide
 * lookup would hit first.
 */
async function pick(page: Page, trigger: Locator, text: string): Promise<void> {
  await trigger.click()
  const search = page.getByPlaceholder('...')
  await search.waitFor({ state: 'visible', timeout: 5_000 })
  await typeInto(page, search, text)
  const menu = search.locator('xpath=../..')
  await menu.getByRole('button', { name: text, exact: true }).first().click()
}

const SCRIPTS: Record<string, GuideScript> = {
  'log-day': {
    guide: guide('log-day'),
    start: openVacay,
    steps: [
      { target: p => toolbar(p).getByRole('button').first() },
      {
        target: p => day(p, NEXT_MONTH, 14),
        act: async p => { await day(p, NEXT_MONTH, 14).click(); await beat(p, 600) },
      },
      {
        target: p => day(p, NEXT_MONTH, 14),
        act: async p => {
          await day(p, NEXT_MONTH, 14).click()
          await beat(p, 600)
          // Leave the day logged for the after-picture and the guides that follow.
          await day(p, NEXT_MONTH, 14).click()
          await settle(p)
        },
      },
    ],
  },

  'half-day': {
    guide: guide('half-day'),
    start: openVacay,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Half day' }),
        act: async p => { await p.getByRole('button', { name: 'Half day' }).click() },
      },
      {
        target: p => day(p, NEXT_MONTH, 15),
        act: async p => { await day(p, NEXT_MONTH, 15).click(); await settle(p) },
      },
      {
        target: p => p.getByRole('button', { name: 'Half day' }),
        act: async p => { await p.getByRole('button', { name: 'Half day' }).click() },
      },
    ],
  },

  'comp-day': {
    guide: guide('comp-day'),
    start: openVacay,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Comp / Flex' }),
        act: async p => { await p.getByRole('button', { name: 'Comp / Flex' }).click() },
      },
      {
        target: p => day(p, NEXT_MONTH, 16),
        act: async p => {
          await day(p, NEXT_MONTH, 16).click()
          await settle(p)
          await p.getByRole('button', { name: 'Comp / Flex' }).click()
        },
      },
    ],
  },

  entitlement: {
    guide: guide('entitlement'),
    start: openVacay,
    steps: [
      {
        target: p => sideCard(p, 'Entitlement').locator('[role="button"]').filter({ hasText: 'Days' }).first(),
        act: async p => { await sideCard(p, 'Entitlement').locator('[role="button"]').filter({ hasText: 'Days' }).first().click() },
      },
      {
        target: p => sideCard(p, 'Entitlement').locator('input'),
        act: async p => {
          const input = sideCard(p, 'Entitlement').locator('input')
          await input.fill('')
          await typeInto(p, input, '30')
          await input.press('Enter')
          await settle(p)
        },
      },
    ],
  },

  years: {
    guide: guide('years'),
    start: openVacay,
    steps: [
      {
        target: p => p.getByTitle('Add next year'),
        act: async p => {
          await p.getByTitle('Add next year').click()
          await expect(sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR + 1) })).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => sideCard(p, 'Year').locator('.grid'),
        act: async p => {
          await sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR) }).first().click()
          await settle(p)
        },
      },
      {
        prepare: async p => { await sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR + 1) }).first().hover() },
        target: p => sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR + 1) }).first().getByRole('button', { name: 'Remove year' }),
      },
    ],
    cleanup: async p => {
      // The extra year was for the pictures only; the guides that follow expect the seed's single year.
      const res = await p.request.delete(`/api/addons/vacay/years/${YEAR + 1}`)
      if (!res.ok()) throw new Error(`could not remove year ${YEAR + 1}: ${res.status()}`)
    },
  },

  'company-holidays': {
    guide: guide('company-holidays'),
    start: openVacay,
    steps: [
      {
        // On by default, so the step only shows where the switch lives.
        prepare: openSettings,
        target: p => toggleRow(p, 'Company Holidays'),
        act: closeSettings,
      },
      {
        target: p => p.getByRole('button', { name: 'Company Holiday' }),
        act: async p => { await p.getByRole('button', { name: 'Company Holiday' }).click() },
      },
      {
        target: p => day(p, 'December', 24),
        act: async p => {
          await day(p, 'December', 24).click()
          await beat(p, 400)
          await day(p, 'December', 31).click()
          await settle(p)
          // Back to logging vacation, so the next guide starts where a reader would.
          await toolbar(p).getByRole('button').first().click()
        },
      },
    ],
  },

  'public-holidays': {
    guide: guide('public-holidays'),
    start: openVacay,
    steps: [
      {
        prepare: openSettings,
        target: p => toggleRow(p, 'Public Holidays'),
        act: async p => { await toggleRow(p, 'Public Holidays').click(); await settle(p) },
      },
      {
        target: p => settings(p).getByRole('button', { name: 'Add calendar' }).first(),
        act: async p => {
          await settings(p).getByRole('button', { name: 'Add calendar' }).first().click()
          await typeInto(p, settings(p).getByPlaceholder('Label (optional)').last(), 'Berlin')
          await pick(p, settings(p).getByRole('button', { name: 'Select country' }), 'Germany')
          // The region list loads after the country is picked; give it a moment to show up.
          const region = settings(p).getByRole('button', { name: 'Select region (required)' })
          await region.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {})
          if (await region.isVisible().catch(() => false)) await pick(p, region, 'Berlin')
          await expect(settings(p).getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 10_000 })
          await settings(p).getByRole('button', { name: 'Add', exact: true }).click()
          await settle(p)
        },
      },
      {
        // The dialog's close button has no label of its own: it is the button in the header next to the title.
        target: p => settings(p).locator('h2').locator('xpath=..').getByRole('button').first(),
        act: async p => { await closeSettings(p); await settle(p) },
      },
    ],
  },

  'school-holidays': {
    guide: guide('school-holidays'),
    start: openVacay,
    steps: [
      {
        prepare: openSettings,
        target: p => toggleRow(p, 'School Holidays'),
        act: async p => { await toggleRow(p, 'School Holidays').click(); await settle(p) },
      },
      {
        target: p => settings(p).getByRole('button', { name: 'Add calendar' }).last(),
        act: async p => {
          await settings(p).getByRole('button', { name: 'Add calendar' }).last().click()
          await typeInto(p, settings(p).getByPlaceholder('Label (optional)').last(), 'Schools Berlin')
          await pick(p, settings(p).getByRole('button', { name: 'Select country' }), 'Germany')
          // The region list loads after the country is picked; give it a moment to show up.
          const region = settings(p).getByRole('button', { name: 'Select region (required)' })
          await region.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {})
          if (await region.isVisible().catch(() => false)) await pick(p, region, 'Berlin')
          await expect(settings(p).getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 10_000 })
          await settings(p).getByRole('button', { name: 'Add', exact: true }).click()
          await settle(p)
        },
      },
      {
        // The dialog's close button has no label of its own: it is the button in the header next to the title.
        target: p => settings(p).locator('h2').locator('xpath=..').getByRole('button').first(),
        act: async p => { await closeSettings(p); await settle(p) },
      },
    ],
  },

  weekends: {
    guide: guide('weekends'),
    start: openVacay,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Settings' }),
        act: openSettings,
      },
      {
        target: p => toggleRow(p, 'Block Weekends'),
        act: async p => { await toggleRow(p, 'Block Weekends').click(); await settle(p) },
      },
      {
        target: p => settings(p).getByText('Week starts on', { exact: true }).locator('xpath=../../..'),
        act: closeSettings,
      },
    ],
  },

  'leave-year': {
    guide: guide('leave-year'),
    start: openVacay,
    steps: [
      {
        prepare: openSettings,
        target: p => settings(p).getByText('Vacation year', { exact: true }).locator('xpath=../../..'),
      },
      {
        target: p => settings(p).getByText('Vacation year', { exact: true }).locator('xpath=../../..').getByRole('button').first(),
        act: closeSettings,
      },
    ],
  },

  'carry-over': {
    guide: guide('carry-over'),
    start: openVacay,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Settings' }),
        act: openSettings,
      },
      {
        target: p => toggleRow(p, 'Carry Over'),
        act: async p => { await toggleRow(p, 'Carry Over').click(); await settle(p); await closeSettings(p) },
      },
    ],
  },

  invite: {
    guide: guide('invite'),
    start: openVacay,
    steps: [
      {
        target: p => sideCard(p, 'Persons').getByRole('button').first(),
        act: async p => { await sideCard(p, 'Persons').getByRole('button').first().click(); await settle(p) },
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Select user' }),
        act: async p => {
          await pick(p, dialog(p).getByRole('button', { name: 'Select user' }), 'mira (mira@example.com)')
          await dialog(p).getByRole('button', { name: 'Send Invite' }).click()
          await expect(dialog(p)).toBeHidden({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => sideCard(p, 'Persons').getByText('mira', { exact: false }).first(),
      },
    ],
  },

  'share-calendar': {
    guide: guide('share-calendar'),
    start: openVacay,
    steps: [
      {
        target: p => sideCard(p, 'Shared Calendars').getByTitle('Share calendar'),
        act: async p => { await sideCard(p, 'Shared Calendars').getByTitle('Share calendar').click(); await settle(p) },
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Select user' }),
        act: async p => {
          await pick(p, dialog(p).getByRole('button', { name: 'Select user' }), 'jonas')
          await dialog(p).getByRole('button', { name: 'Share', exact: true }).click()
          await expect(dialog(p)).toBeHidden({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => sideCard(p, 'Shared Calendars'),
      },
    ],
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test('every registered vacay guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(vacayContext.guides.slice().sort())
})

test('hero: vacay', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, vacayContext.id, openVacay)
})

for (const id of vacayContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
