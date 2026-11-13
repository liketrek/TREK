/**
 * /api/mail-ingest e2e: the real JwtAuthGuard, TripAccessGuard, AdminGuard,
 * Zod pipe, multer and response contracts over a snapshot SQLite, with
 * MailIngestModule's real repositories and services. Replaced: what reaches
 * outside (the AI reading, kitinerary, file storage, geocoding, the
 * notifications). A mail goes in by upload and by the signed webhook, is
 * read by the real pipeline, and is added, undone and refused through the
 * routes the client and the admin dialog use.
 */
import { db } from '../../src/db/database';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { BookingImportService } from '../../src/nest/booking-import/booking-import.service';
import { importExternalId } from '../../src/nest/booking-import/booking-origin';
import { encrypt_api_key } from '../../src/nest/common/crypto/apiKeyCrypto';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { FilesService } from '../../src/nest/files/files.service';
import { MailReadService } from '../../src/nest/llm-parse/mail-read.service';
import { walkMail } from '../../src/nest/llm-parse/mime-walker';
import { MailIngestProcessJob } from '../../src/nest/mail-ingest/mail-ingest-process.job';
import { signWebhookMail } from '../../src/nest/mail-ingest/mail-ingest-webhook.service';
import { MailIngestModule } from '../../src/nest/mail-ingest/mail-ingest.module';
import { MapsService } from '../../src/nest/maps/maps.service';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { countRows } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';
import type { BookingImportPreviewItem } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const USER = 1;
const OTHER = 2;
const ADMIN = 3;
const SECRET = 'w'.repeat(40);
const TEMPLATE = 'trek+{token}@mail.example.com';

/** A day `days` from today: the checks take a booking only within a few years of now. */
const dayFromToday = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const FLIGHT_DAY = dayFromToday(30);

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
  reservation_time: `${FLIGHT_DAY}T10:00`,
  reservation_end_time: `${FLIGHT_DAY}T11:15`,
  confirmation_number: 'ABC123',
  metadata: { flight_number: 'LH716' },
  endpoints: [
    endpoint('from', 'Tokyo Haneda', 'HND', 35.55, 139.78),
    endpoint('to', 'Osaka Itami', 'ITM', 34.78, 135.44),
  ],
  source: { fileName: 'mail.eml', index: 0 },
};

const bookingImport = {
  readMailBookings: vi.fn(async (): Promise<BookingImportPreviewItem[]> => [FLIGHT]),
  mapAiReservations: vi.fn(async (): Promise<BookingImportPreviewItem[]> => []),
  externalKey: (item: BookingImportPreviewItem) => importExternalId(item),
};
const reader = { walk: (raw: Buffer) => walkMail(raw), isAvailable: vi.fn(async () => false), read: vi.fn() };

function eml(id: string, to = 'trips@example.com'): Buffer {
  return Buffer.from(
    [
      'From: Mia <mia@example.com>',
      `To: ${to}`,
      'Subject: Fwd: Your flight LH 716',
      `Message-ID: <${id}@example.com>`,
      'Date: Mon, 1 Jan 2030 10:00:00 +0000',
      'Content-Type: text/plain; charset=utf-8',
      '',
      `Booking reference ABC123. Flight LH 716 from Tokyo to Osaka on ${FLIGHT_DAY}.`,
    ].join('\r\n'),
  );
}

describe('/api/mail-ingest e2e (real guards + snapshot SQLite)', () => {
  let orm: TestOrm;
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), MailIngestModule],
    })
      .overrideProvider(BookingImportService)
      .useValue(bookingImport)
      .overrideProvider(MailReadService)
      .useValue(reader)
      .overrideProvider(FilesService)
      .useValue({ createFileFromBytes: vi.fn(async () => ({ id: 77 })), softDeleteFile: vi.fn() })
      .overrideProvider(MapsService)
      .useValue({ geocodeQuery: vi.fn(async () => null) })
      .overrideProvider(NotificationsService)
      .useValue({ send: vi.fn(async () => ({ attempted: 0, delivered: 0 })), registerResponseAction: vi.fn() })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

  /** Runs the pipeline over what came in, the way its two-minute job does. */
  const readQueued = () => app.get(MailIngestProcessJob).tick();

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: USER, username: 'mia', email: 'mia@example.com' });
    await makeUser(orm, { id: OTHER, username: 'noa', email: 'noa@example.com' });
    await makeAdmin(orm, { id: ADMIN, username: 'admin', email: 'admin@example.com' });
    const dates = { start_date: dayFromToday(20), end_date: dayFromToday(40) };
    tripId = (await makeTrip(orm, USER, { title: 'Japan', ...dates })).id;
    await setAppSetting(orm, 'mail_ingest_enabled', 'true');
    await setAppSetting(orm, 'mail_ingest_address_template', TEMPLATE);
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('MAIL-E2E-001: 401 without a session on every route a person or an admin uses', async () => {
    for (const path of ['/api/mail-ingest/settings', '/api/mail-ingest/inbox', '/api/admin/mail-ingest/status']) {
      expect((await request(server).get(path)).status, path).toBe(401);
    }
    expect((await request(server).post(`/api/trips/${tripId}/mail-ingest/address`)).status).toBe(401);
  });

  it('MAIL-E2E-002: the settings card, its switches and a renewed own address', async () => {
    const card = await request(server).get('/api/mail-ingest/settings').set(as(USER));
    expect(card.status).toBe(200);
    expect(card.body).toMatchObject({ available: true, address: null, ai_available: false, pending: 0 });

    expect((await request(server).patch('/api/mail-ingest/settings').set(as(USER)).send({})).status).toBe(400);
    const off = await request(server).patch('/api/mail-ingest/settings').set(as(USER)).send({ auto_add: false });
    expect(off.status).toBe(200);
    expect(off.body.prefs).toEqual({ enabled: true, ai_enabled: true, auto_add: false });

    const renewed = await request(server).post('/api/mail-ingest/address/renew').set(as(USER));
    expect(renewed.status).toBe(200);
    expect(renewed.body.address.address).toMatch(/^trek\+[a-z2-7]{24}@mail\.example\.com$/);
  });

  it('MAIL-E2E-003: an uploaded mail waits in the inbox, is added by hand and undone, for its person', async () => {
    const soon = vi.spyOn(app.get(MailIngestProcessJob), 'runSoon');
    const upload = await request(server)
      .post('/api/mail-ingest/upload')
      .set(as(USER))
      .attach('file', eml('upload-1'), { filename: 'booking.eml', contentType: 'message/rfc822' });
    expect(upload.status).toBe(201);
    expect(upload.body).toMatchObject({ duplicate: false, message: { transport: 'upload', status: 'queued' } });
    expect(soon).toHaveBeenCalledTimes(1);
    soon.mockRestore();
    expect(await readQueued()).toBe(1);

    const inbox = await request(server).get('/api/mail-ingest/inbox').set(as(USER));
    expect(inbox.status).toBe(200);
    expect(inbox.body.pending).toBe(1);
    const [entry] = inbox.body.entries;
    expect(entry).toMatchObject({ reason: 'ask_first', suggested_trip: { id: tripId, title: 'Japan' } });
    expect((await request(server).get('/api/mail-ingest/inbox/count').set(as(USER))).body).toEqual({ pending: 1 });

    const apply = (userId: number) =>
      request(server).post(`/api/mail-ingest/candidates/${entry.id}/apply`).set(as(userId)).send({});
    expect((await apply(OTHER)).status).toBe(404);
    const applied = await apply(USER);
    expect(applied.status).toBe(200);
    expect(applied.body.candidate).toMatchObject({ resolution: 'applied', resolved_trip_id: tripId });
    expect(await countRows(orm, Reservations, { trip: tripId })).toBe(1);

    const undone = await request(server).post(`/api/mail-ingest/candidates/${entry.id}/undo`).set(as(USER)).send({});
    expect(undone.status).toBe(200);
    expect(undone.body.candidate.resolution).toBe('undone');
    expect(await countRows(orm, Reservations, { trip: tripId })).toBe(0);

    const preview = (userId: number) =>
      request(server).get(`/api/mail-ingest/messages/${entry.message_id}/preview`).set(as(userId));
    const shown = await preview(USER);
    expect(shown.status).toBe(200);
    expect(shown.body.text).toContain('Booking reference ABC123');
    expect((await preview(OTHER)).status).toBe(404);
  });

  it('MAIL-E2E-004: an upload that is no mail, and a closed body, are refused', async () => {
    const pdf = await request(server)
      .post('/api/mail-ingest/upload')
      .set(as(USER))
      .attach('file', Buffer.from('%PDF-1.4'), { filename: 'ticket.pdf', contentType: 'application/pdf' });
    expect(pdf.status).toBe(400);
    const extra = await request(server).post('/api/mail-ingest/candidates/1/undo').set(as(USER)).send({ token: 'x' });
    expect(extra.status).toBe(400);
  });

  it('MAIL-E2E-005: a trip address is made by a member who may add bookings, and hidden from others', async () => {
    const path = `/api/trips/${tripId}/mail-ingest/address`;
    const made = await request(server).post(path).set(as(USER));
    expect(made.status).toBe(200);
    expect(made.body.address).toMatchObject({ trip_id: tripId });
    expect((await request(server).get(path).set(as(USER))).body).toEqual(made.body);
    expect((await request(server).get(path).set(as(OTHER))).status).toBe(404);
    expect((await request(server).delete(path).set(as(USER))).body).toEqual({ success: true });
    expect((await request(server).get(path).set(as(USER))).body).toEqual({ address: null });
  });

  it('MAIL-E2E-006: the status card and the connection test are the admin’s, and hold counts only', async () => {
    expect((await request(server).get('/api/admin/mail-ingest/status').set(as(USER))).status).toBe(403);
    const status = await request(server).get('/api/admin/mail-ingest/status').set(as(ADMIN));
    expect(status.status).toBe(200);
    expect(status.body).toMatchObject({ transport: 'off', last_day: { by_status: { processed: 1 } } });
    expect(JSON.stringify(status.body)).not.toContain('LH 716');
    const test = await request(server).post('/api/admin/mail-ingest/test').set(as(ADMIN));
    expect(test.status).toBe(200);
    expect(test.body).toMatchObject({ transport: 'off', ok: false });
  });

  it('MAIL-E2E-007: the webhook is a 404 until it is the transport, then takes signed mail only', async () => {
    const own = await request(server).get('/api/mail-ingest/settings').set(as(USER));
    const address: string = own.body.address.address;
    const raw = eml('hook-1', address);
    const post = (headers: Record<string, string>, body: Buffer = raw) =>
      request(server)
        .post('/api/mail-ingest/inbound')
        .set({ 'Content-Type': 'message/rfc822', ...headers })
        .send(body);
    const signed = (timestamp = String(Math.floor(Date.now() / 1000))) => ({
      'X-Trek-Timestamp': timestamp,
      'X-Trek-Recipient': address,
      'X-Trek-Signature': `sha256=${signWebhookMail(SECRET, timestamp, address, raw)}`,
    });

    expect((await post(signed())).status).toBe(404);
    await setAppSetting(orm, 'mail_ingest_transport', 'webhook');
    await setAppSetting(orm, 'mail_ingest_webhook_secret', encrypt_api_key(SECRET));

    expect((await post({})).status).toBe(401);
    expect((await post(signed(String(Math.floor(Date.now() / 1000) - 3600)))).status).toBe(401);
    const json = await request(server).post('/api/mail-ingest/inbound').set(signed()).send({ raw: 'x' });
    expect(json.status).toBe(415);

    const taken = await post(signed());
    expect(taken.status).toBe(200);
    expect(taken.body).toEqual({ accepted: true, duplicate: false });
    expect((await post(signed())).body).toEqual({ accepted: true, duplicate: true });
  });
});
