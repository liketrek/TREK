import { test as setup } from '@playwright/test'
import {
  ensureBookingsFixtures, ensureCollabFixtures, ensureDayDetailFixtures, ensureFilesFixtures,
  ensureListsFixtures, ensureMapFixtures, ensureTransportFixtures,
} from '../help/fixtures'

/**
 * The demo trip as the wiki pictures show it: the seed plus the fixtures the help
 * guides add, so the Bookings tab holds a booking of every kind, Files has
 * documents, Collab has links and What's Next something ahead, and the days carry
 * their stays and transports. Its own project between the seed and the capture:
 * the help-media run adds these per guide and has to start from the bare seed.
 */
setup('fill the demo trip for the wiki pictures', async ({ page }) => {
  await ensureDayDetailFixtures(page.request)
  await ensureBookingsFixtures(page.request)
  await ensureTransportFixtures(page.request)
  await ensureMapFixtures(page.request)
  await ensureFilesFixtures(page.request)
  await ensureListsFixtures(page.request)
  await ensureCollabFixtures(page.request)
})
