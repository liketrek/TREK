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
  'release-4-0-0',
] as const;

export const SYSTEM_NOTICES: SystemNotice[] = [
  // ── Release notes: what the current release brought, and a note from the maintainer ──
  // One entry for every release. Each big release swaps the copy (the release_notes
  // keys) and the version below, and keeps this id. `recurring: 'per-version'` brings
  // it back to every user on every upgrade, a patch release included, so nobody is
  // ever left on a version with nothing to show. No upper bound for the same reason.
  {
    id: 'release-notes',
    recurring: 'per-version',
    display: 'modal',
    severity: 'info',
    titleKey: 'system_notice.release_notes.headline',
    bodyKey: 'system_notice.release_notes.intro',
    release: {
      version: '4.3.2',
      eyebrowKey: 'system_notice.release_notes.eyebrow',
      headlineKey: 'system_notice.release_notes.headline',
      introKey: 'system_notice.release_notes.intro',
      featuresLabelKey: 'system_notice.release_notes.features_label',
      featuresAsideKey: 'system_notice.release_notes.features_aside',
      features: [
        {
          iconName: 'Database',
          visual: 'places-api',
          titleKey: 'system_notice.release_notes.feature_places_title',
          bodyKey: 'system_notice.release_notes.feature_places_body',
        },
        {
          iconName: 'Route',
          visual: 'roadtrip',
          titleKey: 'system_notice.release_notes.feature_roadtrip_title',
          bodyKey: 'system_notice.release_notes.feature_roadtrip_body',
        },
        {
          iconName: 'MapPin',
          visual: 'dawarich',
          titleKey: 'system_notice.release_notes.feature_dawarich_title',
          bodyKey: 'system_notice.release_notes.feature_dawarich_body',
        },
        {
          iconName: 'FolderSync',
          visual: 'docsync',
          layout: 'wide',
          titleKey: 'system_notice.release_notes.feature_docsync_title',
          bodyKey: 'system_notice.release_notes.feature_docsync_body',
        },
      ],
      footnoteKey: 'system_notice.release_notes.footnote',
      notes: {
        labelKey: 'system_notice.release_notes.notes_label',
        href: 'https://github.com/liketrek/TREK/releases/tag/v4.3.2',
      },
      note: {
        eyebrowKey: 'system_notice.release_notes.note_eyebrow',
        titleKey: 'system_notice.release_notes.note_title',
        bodyKey: 'system_notice.release_notes.note_body',
        promiseLabelKey: 'system_notice.release_notes.promise_label',
        promiseLeadKey: 'system_notice.release_notes.promise_lead',
        promiseTextKey: 'system_notice.release_notes.promise_text',
        bodyAfterKey: 'system_notice.release_notes.note_body_after',
        closingKey: 'system_notice.release_notes.note_closing',
      },
      supportLeadKey: 'system_notice.release_notes.support_lead',
      supportTextKey: 'system_notice.release_notes.support_text',
    },
    cta: {
      kind: 'link',
      labelKey: 'system_notice.release_notes.cta_bmc',
      href: 'https://buymeacoffee.com/mauriceboe',
    },
    secondaryCta: {
      kind: 'link',
      labelKey: 'system_notice.release_notes.cta_kofi',
      href: 'https://ko-fi.com/mauriceboe',
    },
    dismissible: true,
    // Desktop-only: the two-column layout has no phone form, and the phone has its
    // own onboarding.
    desktopOnly: true,
    // It asks the reader to fund the project, and on a managed install they already
    // pay whoever runs it.
    conditions: [{ kind: 'managed', is: false }],
    publishedAt: '2026-09-15T00:00:00Z',
    priority: 110,
    // Where the thank-you notice below hands over; nothing on 3.x ships this copy.
    minVersion: '4.0.0',
  },

  // ── Thank-you + support the project — shown once per install AND once per upgrade ──
  // `recurring: 'per-version'` re-surfaces it whenever the app version moves up.
  {
    id: 'thank-you-support',
    display: 'modal',
    severity: 'info',
    icon: 'Heart',
    titleKey: 'system_notice.thank_you_support.title',
    bodyKey: 'system_notice.thank_you_support.body',
    highlights: [
      { labelKey: 'system_notice.thank_you_support.highlight_opensource', iconName: 'Github' },
      { labelKey: 'system_notice.thank_you_support.highlight_free', iconName: 'Infinity' },
      { labelKey: 'system_notice.thank_you_support.highlight_community', iconName: 'Users' },
    ],
    cta: {
      kind: 'link',
      labelKey: 'system_notice.thank_you_support.cta_bmc',
      href: 'https://buymeacoffee.com/mauriceboe',
    },
    secondaryCta: {
      kind: 'link',
      labelKey: 'system_notice.thank_you_support.cta_kofi',
      href: 'https://ko-fi.com/mauriceboe',
    },
    dismissible: true,
    // Desktop-only: the support modal is suppressed on small/mobile viewports.
    desktopOnly: true,
    // Not on a centrally administered install. The body thanks the reader for
    // installing TREK and asks them to fund it, and there the reader installed
    // nothing and already pays whoever runs it. Gated rather than reworded: the
    // text is right for everyone it was written for.
    conditions: [{ kind: 'managed', is: false }],
    publishedAt: '2026-06-27T00:00:00Z',
    priority: 100,
    recurring: 'per-version',
    // From 4.0.0 on, the release modal carries the same thank-you and the same
    // two support links, so this one would be the second half of a message the
    // reader just read. Retired by version rather than deleted: installs still
    // on 3.x keep it.
    maxVersion: '4.0.0',
  },

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
      // The body says to check the server logs. On a managed install the reader
      // has none, and the operator sees the same collision in theirs.
      { kind: 'managed', is: false },
    ],
    publishedAt: '2026-05-03T00:00:00Z',
    priority: 85,
    minVersion: '3.0.14',
  },
];
