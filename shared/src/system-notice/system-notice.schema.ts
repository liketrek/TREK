import { z } from 'zod';

/**
 * System-notice API contract — the /api/system-notices endpoints.
 *
 * Notices are server-side announcements (release notes, onboarding hints, ...)
 * defined in a static registry. The server evaluates each notice's conditions
 * for the current user and returns only the active, non-dismissed ones, sorted
 * by priority/severity/date. The DTO sent to the client is the notice minus the
 * server-only fields (conditions, publishedAt, version bounds, priority) — see
 * SystemNoticeDTO in server/src/systemNotices/types.ts, which this mirrors.
 *
 * The bespoke 404 `{ error: 'NOTICE_NOT_FOUND' }` body and the 204 dismiss
 * response are reproduced in the controller, not derived from this schema.
 */

export const noticeDisplaySchema = z.enum(['modal', 'banner', 'toast']);
export const noticeSeveritySchema = z.enum(['info', 'warn', 'critical']);

const noticeMediaSchema = z.object({
  src: z.string(),
  srcDark: z.string().optional(),
  altKey: z.string(),
  placement: z.enum(['hero', 'inline']).optional(),
  aspectRatio: z.string().optional(),
});

const noticeHighlightSchema = z.object({
  labelKey: z.string(),
  iconName: z.string().optional(),
});

/** Call-to-action: an internal nav, an external link (new tab), or an in-app action. */
const noticeCtaSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('nav'), labelKey: z.string(), href: z.string() }),
  z.object({ kind: z.literal('link'), labelKey: z.string(), href: z.string() }),
  z.object({
    kind: z.literal('action'),
    labelKey: z.string(),
    actionId: z.string(),
    dismissOnAction: z.boolean().optional(),
  }),
]);

/** One "what changed" row in the release panel: icon, headline, prose, optional badge. */
const noticeReleaseFeatureSchema = z.object({
  iconName: z.string(),
  titleKey: z.string(),
  bodyKey: z.string(),
  badgeKey: z.string().optional(),
});

/** A number worth stating next to the release — the figure itself is not translated. */
const noticeReleaseStatSchema = z.object({
  value: z.string(),
  labelKey: z.string(),
});

/**
 * The release layout: a two-column modal, the release on the left and a note
 * from the maintainer on the right. A notice carrying this renders through
 * ReleaseNoticeModal instead of the generic notice body, so every string it
 * shows lives here rather than inside the component.
 */
const noticeReleaseSchema = z.object({
  /** Shown as the display figure ("4.0.0") — a version string, not a semver gate. */
  version: z.string(),
  eyebrowKey: z.string(),
  tagKey: z.string(),
  headlineKey: z.string(),
  introKey: z.string(),
  features: z.array(noticeReleaseFeatureSchema),
  stats: z.array(noticeReleaseStatSchema).optional(),
  notes: z.object({ labelKey: z.string(), href: z.string() }).optional(),
  footnoteKey: z.string().optional(),
  note: z.object({
    eyebrowKey: z.string(),
    titleKey: z.string(),
    /** Markdown paragraphs above the promise box. */
    bodyKey: z.string(),
    promiseLabelKey: z.string(),
    promiseTextKey: z.string(),
    /** Markdown paragraphs below the promise box. */
    bodyAfterKey: z.string(),
    closingKey: z.string(),
    signatureKey: z.string(),
  }),
  supportTextKey: z.string(),
});

/** The client-facing notice (server-evaluated; conditions/versioning stripped). */
export const systemNoticeDtoSchema = z.object({
  id: z.string(),
  display: noticeDisplaySchema,
  severity: noticeSeveritySchema,
  titleKey: z.string(),
  bodyKey: z.string(),
  bodyParams: z.record(z.string(), z.string()).optional(),
  icon: z.string().optional(),
  media: noticeMediaSchema.optional(),
  highlights: z.array(noticeHighlightSchema).optional(),
  cta: noticeCtaSchema.optional(),
  secondaryCta: noticeCtaSchema.optional(),
  desktopOnly: z.boolean().optional(),
  dismissible: z.boolean(),
  release: noticeReleaseSchema.optional(),
});
export type SystemNoticeDto = z.infer<typeof systemNoticeDtoSchema>;
