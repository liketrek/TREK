import { devices, test } from '@playwright/test';

import { checkPageSnapshot } from './support/pageSnapshotFlow';

// The Studio's page image for the assistant, drawn in WebKit. playwright.config.ts
// has no WebKit project; the engine comes from this file-level device, as in
// e2e/urlbar-scroll-1809.spec.ts. Safari is why the rasteriser is
// modern-screenshot: it decodes images in a foreignObject late, and a page
// drawn too early comes out blank. page.route does not see a request the
// service worker answers, so it is blocked.
test.use({ ...devices['Desktop Safari'], serviceWorkers: 'block' });

test('Studio page snapshot: WebKit draws a seeded spread to a JPEG', async ({ page }) => {
  await checkPageSnapshot(page);
});
