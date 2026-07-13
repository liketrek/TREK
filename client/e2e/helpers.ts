import type { Page } from '@playwright/test'

/**
 * Dismiss the release-notice modal (SystemNoticeHost), which greets a freshly seeded
 * user on first load and covers the dashboard — its backdrop swallows clicks aimed at
 * anything underneath, `.add-trip-card` included.
 *
 * The X only appears on the notice's last page, so page through first. Dismissal is
 * persisted server-side per user, but each spec gets a fresh DB, so every spec that
 * touches the dashboard has to clear it.
 */
export async function dismissSystemNotices(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: /next/i })
  for (let i = 0; i < 6 && (await next.isVisible().catch(() => false)); i++) {
    if (!(await next.isEnabled())) break
    await next.click()
  }

  const dismiss = page.getByRole('button', { name: 'Dismiss' })
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click()
  await dismiss.waitFor({ state: 'detached' }).catch(() => {})
}
