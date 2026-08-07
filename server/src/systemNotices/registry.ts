import type { SystemNotice } from './types.js';
import { registerPredicate } from './conditions.js';
import { db } from '../db/database.js';

registerPredicate('whitespace-collision-detected', () => {
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'whitespace_migration_collision'").get() as { value: string } | undefined;
  return row?.value === 'true';
});

/**
 * SYSTEM NOTICE REGISTRY
 *
 * Rules for authoring:
 * - NEVER reuse a retired `id` — dismissal tracking is keyed by `id`. Retired ids are
 *   listed in RETIRED_NOTICE_IDS so they're never accidentally re-used.
 * - `id` must be globally unique and stable across deployments.
 * - Title: ≤40 chars, sentence case, no trailing punctuation.
 * - Body: markdown (modal) or plain text (banner/toast). ≤400/140/80 chars.
 * - CTA label: ≤20 chars.
 * - Never hardcode version numbers/dates in translated strings — use bodyParams.
 */

/**
 * Retired notices. Kept out of the active list but their ids stay reserved so a future
 * notice never reuses one (dismissals are keyed by id). Do not re-add these ids.
 */
export const RETIRED_NOTICE_IDS = [
  'v3-thankyou',
  'v3-photos',
  'v3-journey',
  'v3-mcp',
  'v3-features',
  'welcome-v1',
  'thank-you-support',
] as const;

export const SYSTEM_NOTICES: SystemNotice[] = [
  // ── 3.0.14 admin notice — whitespace migration collision ───────────────────
  // Operational alert (not promo): shown only to admins who upgraded across the
  // 3.0.14 boundary AND only when the migration actually renamed colliding accounts.
  {
    id: 'v3014-whitespace-collision',
    display: 'banner',
    severity: 'warn',
    icon: 'AlertTriangle',
    titleKey: 'system_notice.v3014_whitespace_collision.title',
    bodyKey:  'system_notice.v3014_whitespace_collision.body',
    dismissible: true,
    conditions: [
      { kind: 'existingUserBeforeVersion', version: '3.0.14' },
      { kind: 'role', roles: ['admin'] },
      { kind: 'custom', id: 'whitespace-collision-detected' },
    ],
    publishedAt: '2026-05-03T00:00:00Z',
    priority: 85,
    minVersion: '3.0.14',
  },
];
