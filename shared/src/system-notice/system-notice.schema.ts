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

/** Call-to-action: either a navigation link or an in-app action. */
const noticeCtaSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('nav'), labelKey: z.string(), href: z.string() }),
  z.object({
    kind: z.literal('action'),
    labelKey: z.string(),
    actionId: z.string(),
    dismissOnAction: z.boolean().optional(),
  }),
]);

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
  dismissible: z.boolean(),
});
export type SystemNoticeDto = z.infer<typeof systemNoticeDtoSchema>;
