import type { MailIngestCandidateRow } from '../../db/repositories/MailIngestCandidates.repository';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { MailIngestActionsService } from './mail-ingest-actions.service';
import { MailIngestInboxService } from './mail-ingest-inbox.service';
import {
  idSchema,
  mailIngestApplyRequestSchema,
  mailIngestFileRequestSchema,
  mailIngestInboxQuerySchema,
  mailIngestMoveRequestSchema,
  mailIngestPrefsUpdateRequestSchema,
  mailIngestUndoRequestSchema,
  type MailIngestInboxQuery,
  type MailIngestPrefsUpdateRequest,
} from '@trek/shared';

const candidateId = idSchema.describe('The inbox entry, as list_mail_inbox names it (entries[].id).');

/**
 * The booking mail import as MCP tools: the inbox of bookings read from
 * forwarded mails, and what a person does with an entry, over the same
 * services and checks as /api/mail-ingest. A forwarding address carries its
 * secret token, so no tool reads or makes one; addresses stay in the app.
 */
@McpController()
export class MailIngestMcp {
  constructor(
    private readonly inbox: MailIngestInboxService,
    private readonly actions: MailIngestActionsService,
  ) {}

  @Tool({
    name: 'list_mail_inbox',
    description:
      'List the bookings read from mails the user forwarded to TREK: by default those that wait for a decision (status "open"), with why each one waits (reason), the booking as read (item), the trip it suggests and the mail it came from (subject, received_at, attachments), newest first. status "resolved" lists the decided ones; an added booking names reservation_ids and, while it can still be undone or moved, undo_until. Page with before = next_before.',
    inputSchema: mailIngestInboxQuerySchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'reservations', mode: 'read' },
  })
  async listMailInbox(query: MailIngestInboxQuery, ctx: McpContext) {
    return ok(await this.inbox.inbox(ctx.userId, query));
  }

  @Tool({
    name: 'add_mail_booking',
    description:
      'Add a waiting booking from the mail inbox to a trip: to the trip it suggests, or with trip_id to another trip the user may add bookings to. The booking is written with what the mail said (times, places, reference, cost) and the mail is attached as its document; it can be undone for seven days.',
    inputSchema: { candidateId, ...mailIngestApplyRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'reservations', mode: 'write' },
  })
  async addMailBooking({ candidateId: id, trip_id }: { candidateId: number; trip_id?: number }, ctx: McpContext) {
    return this.answer(await this.actions.applyToTrip(id, ctx.userId, trip_id ?? null));
  }

  @Tool({
    name: 'move_mail_booking',
    description:
      'Move a booking that was added from a mail into another trip (trip_id), while it can still be undone. The booking is written there anew and removed from the first trip. One whose cost was settled with, or that was edited since, is refused with needs_confirmation until confirm is true; the edit is lost.',
    inputSchema: { candidateId, ...mailIngestMoveRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'reservations', mode: 'write' },
  })
  async moveMailBooking(
    { candidateId: id, trip_id, confirm }: { candidateId: number; trip_id: number; confirm?: boolean },
    ctx: McpContext,
  ) {
    return this.answer(await this.actions.move(id, ctx.userId, trip_id, confirm === true));
  }

  @Tool({
    name: 'file_mail_booking',
    description:
      'Put the mail of a waiting entry into a trip (trip_id) as documents, its attachments or else its text, without a booking. Needs the Documents addon.',
    inputSchema: { candidateId, ...mailIngestFileRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'reservations', mode: 'write' },
  })
  async fileMailBooking({ candidateId: id, trip_id }: { candidateId: number; trip_id: number }, ctx: McpContext) {
    return this.answer(await this.actions.fileToTrip(id, ctx.userId, trip_id));
  }

  @Tool({
    name: 'discard_mail_booking',
    description: 'Set a waiting entry of the mail inbox aside without adding anything.',
    inputSchema: { candidateId },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'reservations', mode: 'write' },
  })
  async discardMailBooking({ candidateId: id }: { candidateId: number }, ctx: McpContext) {
    return this.answer(await this.actions.discard(id, ctx.userId));
  }

  @Tool({
    name: 'undo_mail_booking',
    description:
      'Undo a booking that was added from a mail, within seven days: the booking, its stay, its cost and the documents it brought go. One whose cost was settled with, or that was edited since, is refused with needs_confirmation until confirm is true.',
    inputSchema: { candidateId, ...mailIngestUndoRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'reservations', mode: 'write' },
  })
  async undoMailBooking({ candidateId: id, confirm }: { candidateId: number; confirm?: boolean }, ctx: McpContext) {
    return this.answer(await this.actions.undo(id, ctx.userId, confirm === true));
  }

  @Tool({
    name: 'update_mail_import_settings',
    description:
      "Change the user's own switches of the mail import: enabled (whether their address takes mail), ai_enabled (whether an AI reads their mails) and auto_add (add a booking that passes every check on its own, or ask first). Name at least one.",
    inputSchema: mailIngestPrefsUpdateRequestSchema,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'reservations', mode: 'write' },
  })
  async updateMailImportSettings(update: MailIngestPrefsUpdateRequest, ctx: McpContext) {
    const { available, prefs, ai_available, pending } = await this.inbox.updatePrefs(ctx.userId, update);
    return ok({ available, prefs, ai_available, pending });
  }

  private async answer(row: MailIngestCandidateRow) {
    return ok({ candidate: await this.inbox.entry(row) });
  }
}
