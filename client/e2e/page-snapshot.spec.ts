import { test } from '@playwright/test';

import { checkPageSnapshot } from './support/pageSnapshotFlow';

// The Studio's page image for the assistant, drawn in Chromium. The same flow
// runs in WebKit from page-snapshot-webkit.spec.ts, the engine with the most
// to get wrong about drawing a page through an SVG foreignObject.
// page.route does not see a request the service worker answers, so it is blocked.
test.use({ serviceWorkers: 'block' });

test('Studio page snapshot: Chromium draws a seeded spread to a JPEG', async ({ page }) => {
  await checkPageSnapshot(page);
});
