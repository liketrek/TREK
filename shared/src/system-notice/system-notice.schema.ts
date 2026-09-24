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

/**
 * One headline card in the release panel. `visual` names a small illustration the
 * client draws for it; a name the client does not know falls back to the icon.
 * `layout: 'wide'` lays the card across the whole row, picture beside the text,
 * for a headliner that comes after a full row of upright cards.
 */
const noticeReleaseFeatureSchema = z.object({
  iconName: z.string(),
  visual: z.string().optional(),
  layout: z.enum(['card', 'wide']).optional(),
  titleKey: z.string(),
  bodyKey: z.string(),
});

/**
 * The release layout: a two-column modal, the release on the left and a note
 * from the maintainer on the right. A notice carrying this renders through
 * ReleaseNoticeModal instead of the generic notice body, so every string it
 * shows lives here rather than inside the component.
 */
const noticeReleaseSchema = z.object({
  /** Shown as the display figure ("4.3.0"), a version string, not a semver gate. */
  version: z.string(),
  eyebrowKey: z.string(),
  headlineKey: z.string(),
  introKey: z.string(),
  featuresLabelKey: z.string(),
  featuresAsideKey: z.string().optional(),
  /** Two to four cards; the grid lays out any of those counts. */
  features: z.array(noticeReleaseFeatureSchema),
  notes: z.object({ labelKey: z.string(), href: z.string() }).optional(),
  footnoteKey: z.string().optional(),
  note: z.object({
    eyebrowKey: z.string(),
    titleKey: z.string(),
    /** Paragraphs above the promise box, separated by a blank line. */
    bodyKey: z.string(),
    promiseLabelKey: z.string(),
    /** The promise's opening sentence, set in bold before the rest. */
    promiseLeadKey: z.string(),
    promiseTextKey: z.string(),
    /** Paragraphs below the promise box, separated by a blank line. */
    bodyAfterKey: z.string(),
    closingKey: z.string(),
  }),
  /** The support footer's opening sentence, set in bold before the rest. */
  supportLeadKey: z.string(),
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
