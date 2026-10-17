import { test, expect, request as apiRequest, type APIRequestContext, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript, type StepAction } from './guide'
import { E2E_BASE_URL } from '../../playwright.config'
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
/** What the entitlement guide sets: not the seed's 30, so the change shows. */
const ENTITLEMENT = '28'

const guide = (id: string): HelpGuide => {
  const g = vacayGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/**
 * What clearNotices in `screenshots/shot.ts` clears, less its loop over every
 * button whose name contains "next". On this page that loop found the year
 * card's "Add next year" and clicked it six times on every visit, so the plan
 * grew by six years per guide and the Year card filled up with chips past
 * 2100. A tour's own button is called just "Next", so that one is still stepped
 * through.
 */
async function clearVacayNotices(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Next', exact: true })
  for (let i = 0; i < 6 && (await next.isVisible().catch(() => false)); i++) {
    if (!(await next.isEnabled().catch(() => false))) break
    await next.click().catch(() => {})
  }
  for (const label of ['Dismiss', 'OK']) {
    const btn = page.getByRole('button', { name: label, exact: true })
    for (let i = 0; i < 4 && (await btn.isVisible().catch(() => false)); i++) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(300)
    }
  }
}

async function openVacay(page: Page): Promise<void> {
  await page.goto('/vacay')
  await dismissReleaseNotice(page)
  await clearVacayNotices(page)
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
/** A settings row by its label: icon, label, hint and, for a toggle, its switch. */
const settingRow = (page: Page, label: string): Locator =>
  settings(page).getByText(label, { exact: true }).locator('xpath=../../..')
/** The switch of a settings row, found through the row's label. */
const toggleRow = (page: Page, label: string): Locator => settingRow(page, label).getByRole('button').first()
/** The form Add calendar opens: colour, label, country, region and its Add button. */
const addCalendarForm = (page: Page): Locator =>
  settings(page).getByPlaceholder('Label (optional)').last().locator('xpath=../..')
/** The Days tile of the Entitlement card while it is being edited. */
const daysTile = (page: Page): Locator => sideCard(page, 'Entitlement').locator('input').locator('xpath=..')
/** A year chip in the Year card. */
const yearChip = (page: Page, y: number): Locator =>
  sideCard(page, 'Year').locator('[role="button"]').filter({ hasText: String(y) }).first()
/** A row of a sidebar card (a person, an invite, a share) by the name in it. */
const cardRow = (page: Page, card: string, name: string): Locator =>
  sideCard(page, card).locator('.group').filter({ hasText: name }).first()

/** Nothing hovered: for a picture where the pointer would reveal a button the step is not about. */
const parkPointer = async (page: Page): Promise<void> => { await page.mouse.move(VIEWPORT.width - 4, VIEWPORT.height - 4) }

/**
 * Back to the top of the page. A step target further down scrolls the page a
 * little, and a result picture taken there hides the top row of months under
 * the header, unlike the hero and the other results.
 */
async function toTop(page: Page): Promise<void> {
  // On a desktop the body is what scrolls (index.css hides the overflow of
  // html), so the window's own scroll position is already 0.
  await page.evaluate(() => {
    for (const el of [document.body, document.documentElement]) el.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })
  await settle(page)
}

/**
 * Turn a settings switch on, and leave it alone when it is on already. Block
 * Weekends and Carry Over start out on, and a plain click switched them off,
 * so the next picture showed the opposite of what the step had just said. The
 * switch has no aria state; its filled track is the only sign it is on.
 */
async function switchOn(page: Page, label: string): Promise<void> {
  const sw = toggleRow(page, label)
  if (!(await sw.evaluate(el => el.classList.contains('bg-content')))) await sw.click()
  await settle(page)
}

async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(settings(page)).toBeVisible()
  await settle(page)
}

async function closeSettings(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(settings(page)).toBeHidden()
  // The dialog hands the focus back to the Settings button, and after a key
  // press that draws a thick focus outline, which in the next picture reads
  // like a step ring.
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur() })
  await settle(page)
}

/**
 * Click Add calendar and fill the form the way the step describes, short of
 * adding it, so the picture shows the fields filled in.
 */
async function fillCalendarForm(page: Page, addButton: Locator, label: string): Promise<void> {
  await addButton.click()
  await typeInto(page, settings(page).getByPlaceholder('Label (optional)').last(), label)
  await pick(page, settings(page).getByRole('button', { name: 'Select country' }), 'Germany')
  // The region list loads after the country is picked; give it a moment to show up.
  const region = settings(page).getByRole('button', { name: 'Select region (required)' })
  await region.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {})
  if (await region.isVisible().catch(() => false)) await pick(page, region, 'Berlin')
  await expect(addCalendarForm(page).getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 10_000 })
}

async function submitCalendarForm(page: Page): Promise<void> {
  await addCalendarForm(page).getByRole('button', { name: 'Add', exact: true }).click()
  // The form closes once the calendar is saved and turns into its row.
  await expect(settings(page).getByRole('button', { name: 'Add', exact: true })).toBeHidden({ timeout: 10_000 })
  await settle(page)
}

/**
 * "Close Settings", the last step of the holiday guides. The ring goes round
 * the head band rather than the close button alone: the 960 px dialog is as
 * wide as the smallest frame, so a frame centred on the button leaves out the
 * band's title and the calendar the guide just added, and the band is still
 * what the step names. The pointer rests on the button, so its Close tooltip
 * marks where to click inside the ring.
 */
const settingsCloseStep: StepAction = {
  target: p => settings(p).locator('header').first(),
  hover: async p => { await settings(p).getByRole('button', { name: 'Close' }).hover() },
  act: closeSettings,
}

// ── A calendar shared with the admin ──────────────────────────────────────────

/**
 * The seeded member whose calendar the share-calendar guide shows as shared
 * with the admin. Not jonas: the admin shares with jonas in the same guide,
 * and two rows named jonas would hide which one is incoming.
 */
const SHARER = { username: 'mira', email: 'mira@example.com', password: 'DemoSeed12345!' }

/**
 * A request context acting as the member. Its own context with a bearer
 * token: a login on the page's context would put the member's session cookie
 * on the admin's requests.
 */
async function asMember(member: typeof SHARER): Promise<APIRequestContext> {
  const anon = await apiRequest.newContext({ baseURL: E2E_BASE_URL, storageState: undefined })
  const login = await anon.post('/api/auth/login', { data: { email: member.email, password: member.password } })
  const token = login.ok() ? ((await login.json()) as { token?: string }).token : undefined
  await anon.dispose()
  if (!token) throw new Error(`could not log in as ${member.username}: ${login.status()}`)
  return apiRequest.newContext({
    baseURL: E2E_BASE_URL,
    storageState: undefined,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
}

/** The member shares her calendar with the admin, as she would from her own Vacay. */
async function shareWithAdmin(page: Page): Promise<void> {
  const me = await page.request.get('/api/auth/me')
  const adminId = ((await me.json()) as { user: { id: number } }).user.id
  const member = await asMember(SHARER)
  try {
    const res = await member.post('/api/addons/vacay/shares', { data: { user_id: adminId } })
    // A retried guide finds the share from its first attempt still there.
    if (!res.ok() && !(await res.text()).includes('Already shared')) {
      throw new Error(`could not share ${SHARER.username}'s calendar with the admin: ${res.status()}`)
    }
  } finally {
    await member.dispose()
  }
}

/** Take back what shareWithAdmin did: the share and the notification it sent the admin. */
async function unshareWithAdmin(page: Page): Promise<void> {
  const shares = (await (await page.request.get('/api/addons/vacay/shares')).json()) as { incoming: { id: number; username: string }[] }
  for (const s of shares.incoming.filter(x => x.username === SHARER.username)) {
    const res = await page.request.delete(`/api/addons/vacay/shares/${s.id}`)
    if (!res.ok()) throw new Error(`could not remove ${SHARER.username}'s share: ${res.status()}`)
  }
  const inbox = (await (await page.request.get('/api/notifications/in-app?limit=50')).json()) as {
    notifications: { id: number; title_key: string; sender_username: string | null }[]
  }
  for (const n of inbox.notifications.filter(x => x.title_key === 'notif.vacay_share.title' && x.sender_username === SHARER.username)) {
    await page.request.delete(`/api/notifications/in-app/${n.id}`)
  }
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
          await toTop(p)
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
        act: async p => { await p.getByRole('button', { name: 'Half day' }).click(); await toTop(p) },
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
          await toTop(p)
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
        // The seed's entitlement is 30, so typing 30 changed nothing and the
        // result showed the Left of before. A different number is typed first,
        // so the picture shows it in the field and the result recalculates Left.
        prepare: async p => {
          const input = sideCard(p, 'Entitlement').locator('input')
          await input.fill('')
          await typeInto(p, input, ENTITLEMENT)
        },
        // The whole tile, so the ring and its number sit round the Days label
        // and the field rather than on the label.
        target: daysTile,
        act: async p => {
          await sideCard(p, 'Entitlement').locator('input').press('Enter')
          await expect(sideCard(p, 'Entitlement').locator('input')).toHaveCount(0)
          await toTop(p)
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
          // Over to the new year and back. Staying put would leave the Entitlement
          // card on the numbers of the year just added, which Add next year loads
          // under the heading of the year still selected; switching reloads them.
          await sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR + 1) }).first().click()
          await settle(p)
          await sideCard(p, 'Year').locator('[role="button"]').filter({ hasText: String(YEAR) }).first().click()
          await settle(p)
        },
      },
      {
        // The chip with its minus showing, rather than the minus alone: the step
        // says to hover the chip, and a ring round the tiny minus put its number
        // on top of the year it belongs to.
        prepare: async p => { await yearChip(p, YEAR + 1).hover() },
        target: p => yearChip(p, YEAR + 1),
        // With the ring on the chip, this is what still fails the guide when the minus is gone.
        act: async p => { await expect(yearChip(p, YEAR + 1).getByRole('button', { name: 'Remove year' })).toBeVisible() },
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
        // On by default, so the step only shows where the switch lives. The ring
        // takes the whole row, name and switch, which is what "check that it is
        // on" reads off, and it pulls the frame over the dialog instead of the
        // page beside it.
        prepare: openSettings,
        target: p => settingRow(p, 'Company Holidays'),
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
          await toTop(p)
        },
      },
    ],
  },

  'public-holidays': {
    guide: guide('public-holidays'),
    start: openVacay,
    steps: [
      {
        // The whole row, as in company-holidays step 1: name and switch together.
        prepare: openSettings,
        target: p => settingRow(p, 'Public Holidays'),
        act: async p => { await toggleRow(p, 'Public Holidays').click(); await settle(p) },
      },
      {
        // The step is about the country and the region, so the picture shows
        // the form filled in rather than the button that opens it empty.
        prepare: p => fillCalendarForm(p, settings(p).getByRole('button', { name: 'Add calendar' }).first(), 'Berlin'),
        target: addCalendarForm,
        act: submitCalendarForm,
      },
      settingsCloseStep,
    ],
  },

  'school-holidays': {
    guide: guide('school-holidays'),
    start: openVacay,
    steps: [
      {
        prepare: openSettings,
        target: p => settingRow(p, 'School Holidays'),
        act: async p => { await toggleRow(p, 'School Holidays').click(); await settle(p) },
      },
      {
        // The last Add calendar: the public-holiday one above it is the first.
        prepare: p => fillCalendarForm(p, settings(p).getByRole('button', { name: 'Add calendar' }).last(), 'Schools Berlin'),
        target: addCalendarForm,
        act: submitCalendarForm,
      },
      settingsCloseStep,
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
        act: async p => { await switchOn(p, 'Block Weekends') },
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
        // The step names all three choices, so the ring goes round the row that holds them.
        target: p => settings(p).getByText('Vacation year', { exact: true }).locator('xpath=../../..').getByRole('button').first().locator('xpath=..'),
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
        act: async p => { await switchOn(p, 'Carry Over'); await closeSettings(p) },
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
        // Picked before the picture, so it shows mira chosen and Send Invite
        // ready, which is the button the step ends on; the dialog closes on send,
        // so no later picture shows the choice.
        prepare: async p => {
          await pick(p, dialog(p).getByRole('button', { name: 'Select user' }), 'mira (mira@example.com)')
          await expect(dialog(p).getByRole('button', { name: 'Send Invite' })).toBeEnabled()
        },
        target: p => dialog(p).getByRole('button', { name: 'Send Invite' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Send Invite' }).click()
          await expect(dialog(p)).toBeHidden({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The whole row, with the pending chip the step is about. The pointer
        // stays off it, or the row's Cancel button shows as well.
        target: p => cardRow(p, 'Persons', 'mira'),
        hover: parkPointer,
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
        // As in the invite guide: jonas picked and Share ready in the picture.
        prepare: async p => {
          await pick(p, dialog(p).getByRole('button', { name: 'Select user' }), 'jonas')
          await expect(dialog(p).getByRole('button', { name: 'Share', exact: true })).toBeEnabled()
        },
        target: p => dialog(p).getByRole('button', { name: 'Share', exact: true }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Share', exact: true }).click()
          await expect(dialog(p)).toBeHidden({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // The step also names calendars shared with you, and the seed has none,
        // so mira shares hers with the admin first. The page learns of it over
        // the socket; a reload is the fallback should that message not come.
        prepare: async p => {
          await shareWithAdmin(p)
          const incoming = cardRow(p, 'Shared Calendars', SHARER.username)
          if (!(await incoming.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true, () => false))) await openVacay(p)
          await expect(incoming).toBeVisible()
        },
        target: p => sideCard(p, 'Shared Calendars'),
        // On the row the admin shares, so its Stop sharing button shows.
        hover: async p => { await cardRow(p, 'Shared Calendars', 'jonas').hover() },
      },
    ],
    cleanup: unshareWithAdmin,
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
