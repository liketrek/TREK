import { test, clearNotices, expect, seed } from './shot'
import { PICTURE_DAY } from '../help/guide'
import type { Page, Locator } from '@playwright/test'

/**
 * Collab surfaces, one capture each.
 *
 * Until now a single Collab.png illustrated four different wiki pages — chat,
 * notes, polls and the What's Next widget — so at most one of them showed the
 * feature its page described.
 *
 * The Collab view is NOT tabbed: CollabPanel renders chat in a fixed 380px left
 * column and the other panels beside it, all visible at once (CollabPanel.tsx:94).
 * So each capture targets its own card element rather than clicking a tab.
 */


/**
 * The panel card containing a given piece of seeded content: see cardClass in
 * CollabPanel.tsx.
 *
 * Matching on content rather than the panel heading is deliberate: the headings
 * render uppercase through CSS while the DOM text is "Notes" / "Polls", and
 * those same words also appear in the mobile tab bar, so a heading match is both
 * wrong-cased and ambiguous.
 */
function card(page: Page, contains: string): Locator {
  return page
    .locator('div.bg-surface-secondary.rounded-2xl.min-h-0')
    .filter({ hasText: contains })
    .last()
}

test.beforeEach(async ({ page }) => {
  // What's Next lists only what is still ahead, and shots.setup.ts timed its stop
  // against the picture day's morning, the instant the help pictures are taken at.
  await page.clock.setFixedTime(PICTURE_DAY)
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
  await page.getByRole('button', { name: 'Collab', exact: true }).first().click()
  await page.waitForTimeout(1200)
})

test('collab chat', async ({ page, shot }) => {
  // Seeded as three different people; a single-voice log would misrepresent it.
  // The chat auto-scrolls to the newest message, so assert on the last line of
  // the seeded conversation rather than the first — the first is off-screen.
  await expect(page.getByText('kaiseki', { exact: false }).first()).toBeVisible()
  await shot.element('CollabChat', card(page, 'kaiseki'))
})

test('collab notes', async ({ page, shot }) => {
  await expect(page.getByText('Rail passes', { exact: false })).toBeVisible()
  await shot.element('CollabNotes', card(page, 'Rail passes'))
})

test('collab polls', async ({ page, shot }) => {
  await expect(page.getByText('free for Nara', { exact: false })).toBeVisible()
  await shot.element('CollabPolls', card(page, 'free for Nara'))
})

test("what's next widget", async ({ page, shot }) => {
  await shot.element('WhatsNext', card(page, "What's Next"))
})

test('collab overview', async ({ page, shot }) => {
  await shot.page_('Collab')
})
