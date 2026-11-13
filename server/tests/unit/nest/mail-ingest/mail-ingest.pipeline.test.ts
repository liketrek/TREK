/**
 * The mail import end to end inside MailIngestModule, over a snapshot test db
 * with its real repositories and the real reservation, place and cost writes.
 * Only what reaches outside is replaced: the AI reading (the walker stays
 * real), kitinerary, file storage, geocoding and the notifications.
 */
import { BudgetItems } from '../../../../src/db/entities/BudgetItems.entity';
import { MailIngestCandidates } from '../../../../src/db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../../../src/db/entities/MailIngestMessages.entity';
import { Reservations } from '../../../../src/db/entities/Reservations.entity';
import { BookingImportService } from '../../../../src/nest/booking-import/booking-import.service';
import { importExternalId } from '../../../../src/nest/booking-import/booking-origin';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { FilesService } from '../../../../src/nest/files/files.service';
import { MailReadService } from '../../../../src/nest/llm-parse/mail-read.service';
import type { MailReading as AiReading } from '../../../../src/nest/llm-parse/mail-read.types';
import { walkMail } from '../../../../src/nest/llm-parse/mime-walker';
import { MailIngestActionsService } from '../../../../src/nest/mail-ingest/mail-ingest-actions.service';
import { MailIngestInboxService } from '../../../../src/nest/mail-ingest/mail-ingest-inbox.service';
import { MailIngestIntakeService } from '../../../../src/nest/mail-ingest/mail-ingest-intake.service';
import { MailIngestProcessJob } from '../../../../src/nest/mail-ingest/mail-ingest-process.job';
import { MailIngestRetentionJob } from '../../../../src/nest/mail-ingest/mail-ingest-retention.job';
import { MailIngestSettingsService } from '../../../../src/nest/mail-ingest/mail-ingest-settings.service';
import { MailIngestModule } from '../../../../src/nest/mail-ingest/mail-ingest.module';
import { MapsService } from '../../../../src/nest/maps/maps.service';
import { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, findRow, findRows, updateRows } from '../../../helpers/factories/rows';
import { setAddonEnabled, setAppSetting } from '../../../helpers/factories/settings';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { BookingImportPreviewItem } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const NOW = new Date('2030-01-15T10:00:00Z');
const endpoint = (role: 'from' | 'to', name: string, code: string, lat: number, lng: number) => ({
  role,
  sequence: role === 'from' ? 0 : 1,
  name,
  code,
  lat,
  lng,
  timezone: null,
  local_time: null,
  local_date: null,
});
const FLIGHT: BookingImportPreviewItem = {
  type: 'flight',
  title: 'LH 716 Tokyo to Osaka',
  reservation_time: '2030-03-02T10:00',
  reservation_end_time: '2030-03-02T11:15',
  confirmation_number: 'ABC123',
  metadata: { flight_number: 'LH716', price: '120,50', priceCurrency: 'EUR' },
  endpoints: [
    endpoint('from', 'Tokyo Haneda', 'HND', 35.55, 139.78),
    endpoint('to', 'Osaka Itami', 'ITM', 34.78, 135.44),
  ],
  source: { fileName: 'mail.eml', index: 0 },
};
const BODY = 'Booking reference ABC123. Flight LH 716 from Tokyo to Osaka on 2030-03-02.';

const machine = vi.fn(async (): Promise<BookingImportPreviewItem[]> => [FLIGHT]);
const bookingImport = {
  readMailBookings: machine,
  mapAiReservations: vi.fn(async (): Promise<BookingImportPreviewItem[]> => [FLIGHT]),
  externalKey: (item: BookingImportPreviewItem) => importExternalId(item),
};
const aiRead = vi.fn();
const reader = { walk: (raw: Buffer) => walkMail(raw), isAvailable: vi.fn(async () => false), read: aiRead };
const files = {
  createFileFromBytes: vi.fn(async () => ({ id: 77 })),
  softDeleteFile: vi.fn(async () => undefined),
};
const notifications = { send: vi.fn(async () => ({ attempted: 1, delivered: 1 })), registerResponseAction: vi.fn() };

const db = createSnapshotTestDb();
let t: TestModule;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MailIngestModule],
    overrides: [
      { provide: BookingImportService, useValue: bookingImport },
      { provide: MailReadService, useValue: reader },
      { provide: FilesService, useValue: files },
      { provide: MapsService, useValue: { geocodeQuery: vi.fn(async () => null) } },
      { provide: NotificationsService, useValue: notifications },
    ],
  });
});
beforeEach(async () => {
  resetTestDb(db);
  vi.clearAllMocks();
  machine.mockResolvedValue([FLIGHT]);
  reader.isAvailable.mockResolvedValue(false);
  await setAppSetting(orm(), 'mail_ingest_enabled', 'true');
  await setAddonEnabled(orm(), 'budget', true);
  await setAddonEnabled(orm(), 'documents', true);
});
afterAll(async () => {
  await t.close();
  db.close();
});

const intake = () => t.get(MailIngestIntakeService);
const job = () => t.get(MailIngestProcessJob);
const actions = () => t.get(MailIngestActionsService);

function eml(id: string, subject = 'Fwd: Your flight LH 716', body = BODY): Buffer {
  return Buffer.from(
    [
      'From: Mia <mia@example.com>',
      'To: trips@example.com',
      `Subject: ${subject}`,
      `Message-ID: <${id}@example.com>`,
      'Date: Mon, 1 Jan 2030 10:00:00 +0000',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n'),
  );
}

async function person() {
  const { user } = await makeUser(orm(), { email: 'mia@example.com', username: 'mia' });
  return user;
}

/** Uploads a mail for the person and runs the pipeline over it; answers the mail's id. */
async function forward(userId: number, raw: Buffer): Promise<number> {
  const taken = await intake().upload(raw, userId);
  if (taken.status !== 'accepted') throw new Error(`the mail was not taken in: ${JSON.stringify(taken)}`);
  expect(await job().tick(NOW)).toBe(1);
  return taken.messageId;
}

const entriesOf = (messageId: number) =>
  findRows(orm(), MailIngestCandidates, { message: messageId }, { position: 'asc' });

describe('taking a mail in', () => {
  it('refuses everything while the import is off', async () => {
    const user = await person();
    await setAppSetting(orm(), 'mail_ingest_enabled', 'false');
    expect(await intake().upload(eml('a'), user.id)).toEqual({ status: 'refused', reason: 'unavailable' });
    expect(await job().tick(NOW)).toBe(0);
  });

  it('stores a mail once, and refuses what is no mail', async () => {
    const user = await person();
    const first = await intake().upload(eml('a'), user.id);
    expect(first.status).toBe('accepted');
    expect(await intake().upload(eml('a'), user.id)).toMatchObject({ status: 'duplicate' });
    expect(await intake().upload(Buffer.from('nothing to see'), user.id)).toEqual({
      status: 'refused',
      reason: 'not_a_mail',
    });
    const stored = await findRow(orm(), MailIngestMessages, { user: user.id });
    expect(stored?.raw_eml_enc).toMatch(/^enc:v1:/);
  });

  it('refuses a mail to an address nobody holds', async () => {
    expect(await intake().receive(eml('b'), 'webhook', ['trek+aaaaaaaaaaaaaaaaaaaaaaaa@example.com'])).toEqual({
      status: 'refused',
      reason: 'unknown_address',
    });
  });
});

describe('a booking that passes every check', () => {
  it('lands in its trip with its cost and documents, and tells the forwarder and the trip', async () => {
    const user = await person();
    const { user: friend } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id, { title: 'Japan', start_date: '2030-03-01', end_date: '2030-03-10' });
    await addTripMember(orm(), trip.id, friend.id);

    const messageId = await forward(user.id, eml('flight'));

    const [entry] = await entriesOf(messageId);
    expect(entry).toMatchObject({
      resolution: 'auto_applied',
      reason: null,
      resolved_trip_id: trip.id,
      source: 'kitinerary',
    });
    const booking = await findRow(orm(), Reservations, { trip: trip.id });
    expect(booking).toMatchObject({
      title: 'LH 716 Tokyo to Osaka',
      external_source: 'mail',
      external_id: importExternalId(FLIGHT),
      sync_enabled: 0,
      needs_review: 0,
    });
    expect(await findRow(orm(), BudgetItems, { trip: trip.id })).toMatchObject({ total_price: 120.5 });
    expect(files.createFileFromBytes).toHaveBeenCalledWith(
      trip.id,
      expect.objectContaining({ originalname: 'mail.txt' }),
      user.id,
      expect.objectContaining({ reservation_id: booking?.id }),
    );
    expect(JSON.parse(String((await entriesOf(messageId))[0].created_ids_json)).file_ids).toEqual([77]);
    expect(await findRow(orm(), MailIngestMessages, { id: messageId })).toMatchObject({ status: 'processed' });
    const events = notifications.send.mock.calls.map(([payload]) => [payload.event, payload.scope]);
    expect(events).toEqual([
      ['mail_booking_added', 'user'],
      ['mail_booking_added', 'trip'],
    ]);
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:created', expect.anything());
  });

  it('is undone by its forwarder: the booking and its cost go, the same mail again waits in the inbox', async () => {
    const user = await person();
    const trip = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));

    await actions().undo(entry.id, user.id, false, NOW);
    expect(await countRows(orm(), Reservations, { trip: trip.id })).toBe(0);
    expect(await countRows(orm(), BudgetItems, { trip: trip.id })).toBe(0);
    expect(files.softDeleteFile).toHaveBeenCalledWith(77);
    await expect(actions().undo(entry.id, user.id, false, NOW)).rejects.toThrow(DomainError);

    const [again] = await entriesOf(await forward(user.id, eml('flight-again')));
    expect(again).toMatchObject({ resolution: 'pending', reason: 'possible_duplicate' });
  });

  it('asks before undoing a booking that was edited since', async () => {
    const user = await person();
    const trip = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    await updateRows(orm(), Reservations, { trip: trip.id }, { notes: 'Window seat please' });

    const refused = await actions()
      .undo(entry.id, user.id, false, NOW)
      .catch((err: unknown) => err);
    expect(refused).toBeInstanceOf(DomainError);
    expect((refused as DomainError).getResponse()).toMatchObject({ code: 'needs_confirmation', affects: ['edited'] });
    await actions().undo(entry.id, user.id, true, NOW);
    expect(await countRows(orm(), Reservations, { trip: trip.id })).toBe(0);
  });

  it('is not written twice when the trip holds it already', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await forward(user.id, eml('flight'));
    const [second] = await entriesOf(await forward(user.id, eml('flight-forwarded-again')));
    expect(second).toMatchObject({ resolution: 'duplicate' });
  });

  it('moves into another trip in its dates: written there anew, gone from the first, still undoable', async () => {
    const user = await person();
    const first = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const second = await makeTrip(orm(), user.id, { start_date: '2030-02-25', end_date: '2030-03-05' });
    const elsewhere = await makeTrip(orm(), user.id, { start_date: '2030-08-01', end_date: '2030-08-05' });
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { auto_add: false });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    await actions().applyToTrip(entry.id, user.id, first.id, NOW);

    await expect(actions().move(entry.id, user.id, elsewhere.id, false, NOW)).rejects.toThrow(
      'This booking lies outside the dates of that trip',
    );
    await expect(actions().move(entry.id, user.id, first.id, false, NOW)).rejects.toThrow(
      'This booking is in that trip already',
    );
    const moved = await actions().move(entry.id, user.id, second.id, false, NOW);
    expect(moved).toMatchObject({ resolution: 'applied', resolved_trip_id: second.id });
    expect(await countRows(orm(), Reservations, { trip: first.id })).toBe(0);
    expect(await countRows(orm(), Reservations, { trip: second.id })).toBe(1);
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(first.id, 'reservation:deleted', expect.anything());
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(second.id, 'reservation:created', expect.anything());

    await actions().undo(entry.id, user.id, false, NOW);
    expect(await countRows(orm(), Reservations, { trip: second.id })).toBe(0);
  });

  it('asks before moving a booking that was edited since, and refuses a stranger', async () => {
    const user = await person();
    const { user: stranger } = await makeUser(orm());
    const first = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const second = await makeTrip(orm(), user.id);
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    await updateRows(orm(), Reservations, { trip: first.id }, { notes: 'Aisle seat' });

    const refused = await actions()
      .move(entry.id, user.id, second.id, false, NOW)
      .catch((err: unknown) => err);
    expect((refused as DomainError).getResponse()).toMatchObject({ code: 'needs_confirmation', affects: ['edited'] });
    await expect(actions().move(entry.id, stranger.id, second.id, true, NOW)).rejects.toThrow('Booking not found');
    await actions().move(entry.id, user.id, second.id, true, NOW);
    expect(await countRows(orm(), Reservations, { trip: second.id })).toBe(1);
  });

  it('is moved by its forwarder alone, and undone by any member who may edit the trip', async () => {
    const user = await person();
    const { user: friend } = await makeUser(orm());
    const shared = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await addTripMember(orm(), shared.id, friend.id);
    const friendsOwn = await makeTrip(orm(), friend.id, { start_date: '2030-02-25', end_date: '2030-03-05' });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));

    await expect(actions().move(entry.id, friend.id, friendsOwn.id, true, NOW)).rejects.toThrow(
      'Only the person who forwarded the mail can move it',
    );
    expect(await countRows(orm(), Reservations, { trip: friendsOwn.id })).toBe(0);
    await actions().undo(entry.id, friend.id, true, NOW);
    expect(await countRows(orm(), Reservations, { trip: shared.id })).toBe(0);
  });

  it('is not moved by a demo account', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const second = await makeTrip(orm(), user.id, { start_date: '2030-02-25', end_date: '2030-03-05' });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    const demo = vi.spyOn(t.get(DemoService), 'isDemoUserId').mockResolvedValue(true);
    try {
      await expect(actions().move(entry.id, user.id, second.id, true, NOW)).rejects.toThrow(
        'Demo accounts cannot add bookings',
      );
    } finally {
      demo.mockRestore();
    }
  });
});

describe('a booking that waits in the inbox', () => {
  it('names why: no trip in its dates, and the person hears of it once', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-06-01', end_date: '2030-06-10' });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    expect(entry).toMatchObject({ resolution: 'pending', reason: 'no_trip_in_range' });
    expect(notifications.send).toHaveBeenCalledWith(expect.objectContaining({ event: 'mail_booking_pending' }));
  });

  it('asks first when the person said so', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { auto_add: false });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    expect(entry).toMatchObject({ resolution: 'pending', reason: 'ask_first', suggested_trip_id: expect.any(Number) });
  });

  it('keeps a mail without a booking for its ways out, with why the AI did not read it', async () => {
    const user = await person();
    machine.mockResolvedValue([]);
    const [entry] = await entriesOf(await forward(user.id, eml('nothing')));
    expect(entry).toMatchObject({ resolution: 'pending', reason: 'ai_disabled', item_json: null });

    const prefill = await actions().prefill(entry.id, user.id);
    expect(prefill.item).toMatchObject({
      type: 'flight',
      confirmation_number: 'ABC123',
      reservation_time: '2030-03-02',
    });

    const trip = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await setAddonEnabled(orm(), 'documents', false);
    await expect(actions().fileToTrip(entry.id, user.id, trip.id, NOW)).rejects.toThrow('This trip takes no documents');
    expect(await findRow(orm(), MailIngestCandidates, { id: entry.id })).toMatchObject({
      resolution: 'pending',
      resolved_at: null,
    });

    await setAddonEnabled(orm(), 'documents', true);
    const filed = await actions().fileToTrip(entry.id, user.id, trip.id, NOW);
    expect(filed).toMatchObject({ resolution: 'filed', resolved_trip_id: trip.id });
    const written = files.createFileFromBytes.mock.calls.length;
    await expect(actions().fileToTrip(entry.id, user.id, trip.id, NOW)).rejects.toThrow(
      'This entry was decided already',
    );
    expect(files.createFileFromBytes).toHaveBeenCalledTimes(written);
  });

  it('is added by hand to the trip the person picks, and can be discarded instead', async () => {
    const user = await person();
    const trip = await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { auto_add: false });
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    const applied = await actions().applyToTrip(entry.id, user.id, trip.id, NOW);
    expect(applied).toMatchObject({ resolution: 'applied', resolved_trip_id: trip.id });
    expect(await countRows(orm(), Reservations, { trip: trip.id })).toBe(1);
    await expect(actions().discard(entry.id, user.id, NOW)).rejects.toThrow('This entry was decided already');
  });
});

describe('mails that are no booking', () => {
  it('drops a newsletter without reading it', async () => {
    const user = await person();
    const raw = Buffer.from(
      [
        'From: news@shop.example',
        'Subject: Our autumn deals',
        'List-Unsubscribe: <mailto:off@shop.example>',
        'Message-ID: <news@shop.example>',
        '',
        'Fresh deals for everyone who loves to shop with us.',
      ].join('\r\n'),
    );
    const messageId = await forward(user.id, raw);
    expect(machine).not.toHaveBeenCalled();
    expect(await findRow(orm(), MailIngestMessages, { id: messageId })).toMatchObject({
      status: 'discarded',
      reason: 'newsletter',
    });
  });

  it('shows a forwarding confirmation’s code in the inbox', async () => {
    const user = await person();
    const messageId = await forward(
      user.id,
      eml('confirm', 'Gmail Forwarding Confirmation', 'Confirmation code: 612345678 for forwarding.'),
    );
    expect(await findRow(orm(), MailIngestMessages, { id: messageId })).toMatchObject({
      forwarding_code: '612345678',
      reason: 'forwarding_confirmation',
    });
    expect((await entriesOf(messageId))[0]).toMatchObject({ reason: 'forwarding_confirmation' });
  });

  it('discards a mail the AI read and found no booking in', async () => {
    const user = await person();
    reader.isAvailable.mockResolvedValue(true);
    machine.mockResolvedValue([]);
    aiRead.mockResolvedValue({ outcome: 'empty', bookings: [], documentText: BODY, imageOnly: false } as AiReading);
    const messageId = await forward(user.id, eml('chat'));
    expect(await findRow(orm(), MailIngestMessages, { id: messageId })).toMatchObject({
      status: 'discarded',
      reason: 'not_a_booking',
      ai_used: 1,
    });
  });
});

describe('the AI’s trip pick', () => {
  it('decides between two trips that fit only where the booking lies near the pick', async () => {
    const user = await person();
    reader.isAvailable.mockResolvedValue(true);
    const japan = await makeTrip(orm(), user.id, { title: 'Japan', start_date: '2030-03-01', end_date: '2030-03-10' });
    await makeTrip(orm(), user.id, { title: 'Work', start_date: '2030-02-25', end_date: '2030-03-05' });
    aiRead.mockImplementation(async (input: { trips: Array<{ ref: string; title: string }> }) => ({
      outcome: 'ok',
      documentText: BODY,
      imageOnly: false,
      bookings: [
        {
          kind: 'new_booking',
          reservations: [{ '@type': 'FlightReservation' }],
          tripRef: input.trips.find((trip) => trip.title === 'Japan')?.ref ?? null,
          tripConfidence: 0.9,
          uncertainFields: [],
          suggestedNewTrip: null,
        },
      ],
    }));
    const [entry] = await entriesOf(await forward(user.id, eml('flight')));
    // Japan has no place near Osaka the server could confirm: the inbox suggests it.
    expect(entry).toMatchObject({ resolution: 'pending', reason: 'trip_ambiguous', suggested_trip_id: japan.id });
    expect(entry.source).toBe('ai');
  });
});

describe('a mail that keeps failing', () => {
  it('is tried again later and given up after its last try', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    machine.mockRejectedValue(new Error('kitinerary crashed'));
    const taken = await intake().upload(eml('poison'), user.id);
    if (taken.status !== 'accepted') throw new Error('not taken in');
    expect(await job().tick(NOW)).toBe(1);
    expect(await findRow(orm(), MailIngestMessages, { id: taken.messageId })).toMatchObject({ status: 'queued' });
    expect(await job().tick(new Date(NOW.getTime() + 60 * 60 * 1000))).toBe(1);
    expect(await job().tick(new Date(NOW.getTime() + 2 * 60 * 60 * 1000))).toBe(1);
    expect(await findRow(orm(), MailIngestMessages, { id: taken.messageId })).toMatchObject({
      status: 'failed',
      reason: 'processing_failed',
    });
  });
});

describe('what the person sees', () => {
  const inbox = () => t.get(MailIngestInboxService);

  it('lists the waiting entries with their mail and the trip they suggest, and no one else’s', async () => {
    const user = await person();
    const { user: other } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id, { title: 'Japan', start_date: '2030-03-01', end_date: '2030-03-10' });
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { auto_add: false });
    const messageId = await forward(user.id, eml('flight'));

    const page = await inbox().inbox(user.id, { status: 'open', limit: 50 }, NOW);
    expect(page.pending).toBe(1);
    expect(page.next_before).toBeNull();
    expect(page.entries).toHaveLength(1);
    expect(page.entries[0]).toMatchObject({
      message_id: messageId,
      resolution: 'pending',
      reason: 'ask_first',
      suggested_trip: { id: trip.id, title: 'Japan', start_date: '2030-03-01', end_date: '2030-03-10' },
      undo_until: null,
      message: { id: messageId, transport: 'upload', status: 'processed', subject: 'Fwd: Your flight LH 716' },
    });
    expect(page.entries[0].message).not.toHaveProperty('raw_eml_enc');
    expect((await inbox().inbox(other.id, { status: 'open', limit: 50 }, NOW)).entries).toEqual([]);
    expect(await inbox().count(user.id)).toEqual({ pending: 1 });
  });

  it('pages decided entries, and an added one carries until when it can be undone', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    await forward(user.id, eml('first'));
    await forward(user.id, eml('again'));

    const page = await inbox().inbox(user.id, { status: 'resolved', limit: 1 }, NOW);
    expect(page.entries).toHaveLength(1);
    expect(page.entries[0]).toMatchObject({ resolution: 'duplicate', undo_until: null });
    expect(page.next_before).toBe(page.entries[0].id);
    const next = await inbox().inbox(user.id, { status: 'resolved', before: page.entries[0].id, limit: 1 }, NOW);
    expect(next.entries[0]).toMatchObject({ resolution: 'auto_applied', undo_until: '2030-01-22T10:00:00.000Z' });
    expect(next.entries[0].reservation_ids).toHaveLength(1);
  });

  it('shows a mail as text without its headers, to its person only, until it is purged', async () => {
    const user = await person();
    const { user: other } = await makeUser(orm());
    machine.mockResolvedValue([]);
    const messageId = await forward(user.id, eml('nothing'));

    const preview = await inbox().preview(user.id, messageId);
    expect(preview).toMatchObject({ id: messageId, subject: 'Fwd: Your flight LH 716', attachments: [] });
    expect(preview.text).toContain('Booking reference ABC123');
    expect(preview.text).not.toContain('mia@example.com');
    await expect(inbox().preview(other.id, messageId)).rejects.toThrow('Mail not found');
    await updateRows(orm(), MailIngestMessages, { id: messageId }, { raw_eml_enc: null });
    await expect(inbox().preview(user.id, messageId)).rejects.toThrow('The mail is no longer stored');
  });

  it('answers the settings card, and only that it is unavailable while the import is off', async () => {
    const user = await person();
    expect(await inbox().settingsOf(user.id)).toEqual({
      available: true,
      address: null,
      prefs: { enabled: true, ai_enabled: true, auto_add: true },
      ai_available: false,
      pending: 0,
    });
    await setAppSetting(orm(), 'mail_ingest_enabled', 'false');
    expect(await inbox().settingsOf(user.id)).toMatchObject({ available: false, address: null, pending: 0 });
    await expect(inbox().updatePrefs(user.id, { auto_add: false })).rejects.toThrow('Mail import is not available');
    expect(await inbox().count(user.id)).toEqual({ pending: 0 });
  });

  it('reads an uploaded mail at once, knows one it has, and refuses what it cannot take', async () => {
    const user = await person();
    const soon = vi.spyOn(job(), 'runSoon');
    const tick = vi.spyOn(job(), 'tick');
    try {
      const first = await inbox().upload(user.id, eml('upload'));
      expect(first).toMatchObject({ duplicate: false, message: { transport: 'upload', status: 'queued' } });
      const again = await inbox().upload(user.id, eml('upload'));
      expect(again).toMatchObject({ duplicate: true, message: { id: first.message.id } });
      expect(soon).toHaveBeenCalledTimes(1);
      // The crons are off in the suites, so the run asked for at once never starts and cannot outlive the case.
      expect(tick).not.toHaveBeenCalled();
      await expect(inbox().upload(user.id, Buffer.from('nothing to see'))).rejects.toThrow('This file is not a mail');
    } finally {
      soon.mockRestore();
      tick.mockRestore();
    }
  });

  it('takes no upload from a person who switched their import off', async () => {
    const user = await person();
    await t.get(MailIngestSettingsService).updatePrefs(user.id, { enabled: false });
    await expect(inbox().upload(user.id, eml('off'))).rejects.toThrow('Your mail import is switched off');
    expect(await findRow(orm(), MailIngestMessages, { user: user.id })).toBeNull();
  });
});

describe('the retention', () => {
  it('purges a settled mail and keeps one an entry waits on', async () => {
    const user = await person();
    await makeTrip(orm(), user.id, { start_date: '2030-03-01', end_date: '2030-03-10' });
    const added = await forward(user.id, eml('flight'));
    machine.mockResolvedValue([]);
    const waiting = await forward(user.id, eml('nothing'));

    // Settled long ago: the mail with nothing waiting on it goes, the one an entry waits on stays.
    const longAgo = { processed_at: '2000-01-01 00:00:00' };
    await updateRows(orm(), MailIngestMessages, { id: { $in: [added, waiting] } }, longAgo);
    await t.get(MailIngestRetentionJob).tick(new Date());
    expect(await findRow(orm(), MailIngestMessages, { id: added })).toMatchObject({ raw_eml_enc: null });
    expect((await findRow(orm(), MailIngestMessages, { id: waiting }))?.raw_eml_enc).toMatch(/^enc:v1:/);
  });
});
