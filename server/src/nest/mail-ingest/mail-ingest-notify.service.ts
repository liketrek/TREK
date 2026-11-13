import type { MailIngestPersonRow } from '../../db/repositories/MailIngestCandidates.repository';
import { logError } from '../audit/audit-log.logger';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { KEEP_ACTION, UNDO_ACTION } from './mail-ingest.constants';
import { Injectable } from '@nestjs/common';

/** A booking a mail added, as its notifications name it. */
interface AddedBooking {
  candidateId: number;
  tripId: number;
  tripTitle: string;
  title: string;
  type: string;
}

/**
 * What the mail import tells people. The forwarder hears of every booking it
 * added, with keep and undo; the other members of a shared trip hear that a
 * booking came in (owner decision 13.11.2026); and a mail whose bookings wait
 * in the inbox sends one note for the lot. A notification never fails the
 * write it reports.
 */
@Injectable()
export class MailIngestNotifyService {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Tells the person's open clients how many entries wait in their inbox now. */
  inboxChanged(userId: number, pending: number): void {
    this.realtime.broadcastToUser(userId, { type: 'mailInbox:changed', pending });
  }

  /** Tells the person's open clients that their address or switches changed, so the settings card reads them again. */
  settingsChanged(userId: number): void {
    this.realtime.broadcastToUser(userId, { type: 'mailInbox:settings' });
  }

  /** @txStandalone a notice reports a write that committed; a failed one undoes nothing. */
  async bookingAdded(forwarder: MailIngestPersonRow, booking: AddedBooking): Promise<void> {
    const params = {
      booking: booking.title,
      type: booking.type,
      trip: booking.tripTitle,
      tripId: String(booking.tripId),
      actor: forwarder.username,
    };
    await this.quietly(
      this.notifications.send({
        event: 'mail_booking_added',
        actorId: null,
        scope: 'user',
        targetId: forwarder.id,
        params: { ...params, role: 'forwarder' },
        inApp: {
          type: 'boolean',
          positiveTextKey: 'notif.action.keep',
          negativeTextKey: 'notif.action.undo',
          positiveCallback: { action: KEEP_ACTION, payload: { candidateId: booking.candidateId } },
          negativeCallback: { action: UNDO_ACTION, payload: { candidateId: booking.candidateId } },
        },
      }),
    );
    // Trip scope reaches every member but the actor, who heard above.
    await this.quietly(
      this.notifications.send({
        event: 'mail_booking_added',
        actorId: forwarder.id,
        scope: 'trip',
        targetId: booking.tripId,
        params: { ...params, role: 'traveller' },
      }),
    );
  }

  /** @txStandalone one note for the bookings of a mail that wait in the inbox. */
  async bookingsPending(userId: number, pending: number): Promise<void> {
    this.inboxChanged(userId, pending);
    await this.quietly(
      this.notifications.send({
        event: 'mail_booking_pending',
        actorId: null,
        scope: 'user',
        targetId: userId,
        params: { count: String(pending) },
      }),
    );
  }

  private async quietly(sent: Promise<unknown>): Promise<void> {
    try {
      await sent;
    } catch (err) {
      logError(`[mail-ingest] A notification failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
