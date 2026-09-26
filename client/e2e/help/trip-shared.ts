import { expect, type Locator, type Page } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { dismissReleaseNotice, settle, type StepAction } from './guide'
import { seededTrip } from './fixtures'

/**
 * What every trip screen's script needs: the way into the seeded trip, the
 * day selection and the dialogs. Not a `.guide.ts`, so importing it registers
 * no tests twice.
 */

export const modal = (page: Page) => page.locator('.trek-modal-backdrop').last()
export const dialog = (page: Page) => modal(page).locator('> [role="presentation"], > div').first()
/**
 * ConfirmDialog is its own portal and carries `trek-backdrop-enter` without the
 * `trek-modal-backdrop` of `Modal`, so the yes/no questions need their own
 * locator: `modal` would never see them.
 */
export const confirmBackdrop = (page: Page) => page.locator('.trek-backdrop-enter:not(.trek-modal-backdrop)').last()
export const confirmDialog = (page: Page) => confirmBackdrop(page).locator('.trek-modal-enter').last()
/**
 * The import dialogs of the places column are portals of their own with no
 * shared backdrop class at all, so they are found by what stands inside them.
 * Both the overlay and the card carry `role="presentation"`, and the card comes
 * second in document order, which is the one worth a picture.
 */
export const portalDialog = (page: Page, contains: Locator): Locator =>
  page.locator('div[role="presentation"]').filter({ has: contains }).last()

export async function openTrip(page: Page, opts: { tab?: string; day?: number | null } = {}): Promise<void> {
  const { tripId } = seededTrip()
  const { tab, day = 1 } = opts
  await page.goto(`/trips/${tripId}${tab ? `?tab=${tab}` : ''}`)
  await clearNotices(page)
  await dismissReleaseNotice(page)
  // Exact: the Lists tab carries a Shared button, which the loose name also matches.
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeVisible({ timeout: 30_000 })
  await settle(page)
  if (!tab && day) {
    // The trip is running, so the plan opens on today, an empty day at the
    // bottom. Day 1 has the places; its details panel would cover the map.
    await selectDay(page, day)
    await closeDayDetails(page)
  }
  // The map tiles land after the page says it is idle.
  await page.waitForTimeout(1200)
}

/** Click the day's header: selects it and opens its details panel. */
export async function selectDay(page: Page, n: number): Promise<void> {
  const header = page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) })
  // The header carries buttons of its own: the booked night in the middle, the
  // transit, note and fold actions on the right. A click on the centre lands on
  // the booked night as soon as a day has one, which selects nothing, so the
  // click goes to the day's number at the left edge.
  await header.click({ position: { x: 22, y: 20 } })
  // The details panel is the selection: without it the day's route tools, the
  // + on a place row and To day are all absent, and a guide fails far from here.
  await expect(dayDetails(page)).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

/** The day details panel: the one fixed, floating card over the map. */
export const dayDetails = (page: Page) => page.locator('div.fixed.z-50').first()

/** The details panel's close is the one unlabelled X button over the map. */
export async function closeDayDetails(page: Page): Promise<void> {
  const close = page.locator('button:has(svg.lucide-x)').last()
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await settle(page)
  }
}

/**
 * Open the trip with day `n` selected and its details panel standing. The panel
 * IS the selection — closing it deselects the day — and the day's route tools
 * and the "+" at the end of a place row render for a selected day only, so a
 * guide about either of them starts here rather than at `openTrip`.
 */
export async function openTripOnDay(page: Page, n = 1): Promise<void> {
  await openTrip(page, { day: null })
  await selectDay(page, n)
}

/**
 * Dismiss a `ContextMenu`. It closes on a document click and ignores Escape,
 * and a real click would land on the map or on the row underneath.
 */
export async function closeMenu(page: Page): Promise<void> {
  await page.evaluate(() => document.body.click())
  await settle(page)
}

// ── Import from file ──────────────────────────────────────────────────────────

/**
 * Import from file, on the Bookings and the Transports tab alike. The dialog
 * is another bare portal, told apart by its heading; the parse it starts is
 * reported by the background widget, a fixed portal in the bottom-right
 * corner (the one at z-index 50000) with a card per run.
 */
export const importDialog = (page: Page) =>
  portalDialog(page, page.getByText('Import booking confirmations', { exact: true }))
export const importWidget = (page: Page) => page.locator('body > div[style*="z-index: 50000"]')
/** The widget's card for the run that parses `file`; the card is labelled with the file names. */
export const importTask = (page: Page, file: string) =>
  importWidget(page).locator('.bg-surface-card').filter({ hasText: file }).last()

/**
 * The first three steps of an import guide, the same on either tab: the
 * toolbar button, the drop box with the file named on it, and Import.
 */
export function importSteps(fixture: () => string, file: string): StepAction[] {
  return [
    {
      target: p => p.getByRole('button', { name: 'Import from file' }),
      act: async p => {
        await p.getByRole('button', { name: 'Import from file' }).click()
        await expect(importDialog(p)).toBeVisible()
        await settle(p)
      },
    },
    {
      prepare: async p => {
        // Set the hidden input directly: the box opens the file picker of the
        // operating system, which Playwright cannot photograph.
        await importDialog(p).locator('input[type="file"]').setInputFiles(fixture())
        await expect(importDialog(p).getByText(file)).toBeVisible()
        await settle(p)
      },
      target: p => importDialog(p).getByText(file).locator('xpath=ancestor::button[1]'),
      act: settle,
    },
    {
      target: p => importDialog(p).getByRole('button', { name: 'Import', exact: true }),
      act: async p => {
        await importDialog(p).getByRole('button', { name: 'Import', exact: true }).click()
        await expect(importDialog(p)).toHaveCount(0, { timeout: 20_000 })
        await settle(p)
      },
    },
  ]
}

/**
 * Put the widget away after an import guide. The review takes the card with
 * it when it starts, so one still standing means the run stopped before
 * that, and it would sit in the corner of every later guide's pictures. Close
 * is only offered once the parse has stopped, and the wait is bounded so a
 * card nobody can close does not fail the guide from its cleanup.
 */
export async function dismissImportTask(page: Page, file: string): Promise<void> {
  const task = importTask(page, file)
  if (!(await task.isVisible().catch(() => false))) return
  const close = task.getByRole('button', { name: 'Close' })
  await close.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {})
  if (await close.isVisible().catch(() => false)) await close.click()
}

/**
 * Take a document a guide uploaded out of the trip for good. DELETE alone is
 * the trash, and the Files guides photograph the trash, so the permanent
 * delete follows.
 */
export async function deleteTripFiles(page: Page, ...names: string[]): Promise<void> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/files`)
  const { files = [] } = (await res.json()) as { files?: { id: number; original_name: string }[] }
  for (const file of files.filter(f => names.includes(f.original_name))) {
    await page.request.delete(`/api/trips/${tripId}/files/${file.id}`)
    await page.request.delete(`/api/trips/${tripId}/files/${file.id}/permanent`)
  }
}
