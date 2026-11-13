/**
 * What the mail import tells people: the forwarder gets keep or undo, the
 * other members of the trip a notice, a waiting mail one note; a failed
 * notification never fails the write. The notification's undo button reaches
 * the inbox's undo with the person who tapped it.
 */
import { MailIngestActionsService } from '../../../../src/nest/mail-ingest/mail-ingest-actions.service';
import { MailIngestNotificationActions } from '../../../../src/nest/mail-ingest/mail-ingest-notification-actions';
import { MailIngestNotifyService } from '../../../../src/nest/mail-ingest/mail-ingest-notify.service';
import { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const notifications = { send: vi.fn(), registerResponseAction: vi.fn() };
const actions = { undo: vi.fn(async () => ({})) };
const realtime = { broadcastToUser: vi.fn() };
let notify: MailIngestNotifyService;
let buttons: MailIngestNotificationActions;

beforeEach(async () => {
  vi.clearAllMocks();
  notifications.send.mockResolvedValue({ attempted: 1, delivered: 1 });
  const moduleRef = await Test.createTestingModule({
    providers: [
      MailIngestNotifyService,
      MailIngestNotificationActions,
      { provide: NotificationsService, useValue: notifications },
      { provide: MailIngestActionsService, useValue: actions },
      { provide: RealtimeService, useValue: realtime },
    ],
  }).compile();
  notify = moduleRef.get(MailIngestNotifyService);
  buttons = moduleRef.get(MailIngestNotificationActions);
});

const MIA = { id: 3, username: 'mia', email: 'mia@example.com', role: 'user' };
const BOOKING = { candidateId: 11, tripId: 7, tripTitle: 'Japan', title: 'LH 716', type: 'flight' };

describe('MailIngestNotifyService', () => {
  it('asks the forwarder to keep or undo, and tells the trip’s other members', async () => {
    await notify.bookingAdded(MIA, BOOKING);
    const [forwarder, trip] = notifications.send.mock.calls.map(([payload]) => payload);
    expect(forwarder).toMatchObject({
      event: 'mail_booking_added',
      scope: 'user',
      targetId: 3,
      params: { booking: 'LH 716', trip: 'Japan', tripId: '7', role: 'forwarder' },
      inApp: {
        type: 'boolean',
        negativeTextKey: 'notif.action.undo',
        negativeCallback: { action: 'mail_ingest_undo', payload: { candidateId: 11 } },
      },
    });
    expect(trip).toMatchObject({ scope: 'trip', targetId: 7, actorId: 3, params: { role: 'traveller', actor: 'mia' } });
  });

  it('sends one note for waiting bookings, survives a failed send, and tells clients of new settings', async () => {
    notifications.send.mockRejectedValue(new Error('smtp down'));
    await expect(notify.bookingsPending(3, 2)).resolves.toBeUndefined();
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'mail_booking_pending', params: { count: '2' } }),
    );
    expect(realtime.broadcastToUser).toHaveBeenCalledWith(3, { type: 'mailInbox:changed', pending: 2 });
    notify.settingsChanged(3);
    expect(realtime.broadcastToUser).toHaveBeenCalledWith(3, { type: 'mailInbox:settings' });
  });
});

describe('MailIngestNotificationActions', () => {
  it('registers undo and keep, and undoes the named booking for the person who tapped', async () => {
    buttons.onModuleInit();
    expect(notifications.registerResponseAction.mock.calls.map(([action]) => action)).toEqual([
      'mail_ingest_undo',
      'mail_ingest_keep',
    ]);
    await buttons.undo({ candidateId: 11 }, 3);
    expect(actions.undo).toHaveBeenCalledWith(11, 3, false);
    await expect(buttons.undo({}, 3)).rejects.toThrow('This notification names no booking');
    const keep = notifications.registerResponseAction.mock.calls[1][1] as () => Promise<void>;
    await expect(keep()).resolves.toBeUndefined();
  });
});
