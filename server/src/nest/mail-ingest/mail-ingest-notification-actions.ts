import { NotificationsService } from '../notifications/notifications.service';
import { MailIngestActionsService } from './mail-ingest-actions.service';
import { KEEP_ACTION, UNDO_ACTION } from './mail-ingest.constants';
import { Injectable, type OnModuleInit } from '@nestjs/common';

/**
 * What the forwarder's notification buttons do. Undo takes the booking back
 * out unless its cost moved balances or it was edited since, which needs the
 * inbox's own confirmation; keep only answers the question. The handlers run
 * in the request that answered the notification, under its context.
 */
@Injectable()
export class MailIngestNotificationActions implements OnModuleInit {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly actions: MailIngestActionsService,
  ) {}

  onModuleInit(): void {
    this.notifications.registerResponseAction(UNDO_ACTION, (payload, userId) => this.undo(payload, userId));
    this.notifications.registerResponseAction(KEEP_ACTION, async () => undefined);
  }

  async undo(payload: Record<string, unknown>, userId: number): Promise<void> {
    const candidateId = Number(payload.candidateId);
    if (!Number.isInteger(candidateId) || candidateId <= 0) throw new Error('This notification names no booking');
    await this.actions.undo(candidateId, userId, false);
  }
}
