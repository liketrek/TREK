/**
 * Booking import e2e (#2477): a Booking.com print read by Gemini through its
 * OpenAI-compatible endpoint, driven through the real upload route.
 *
 * Real: the JwtAuthGuard and TripAccessGuard, multer on the import route, the
 * text extraction of a PDF, LlmParseService, the OpenAI-compatible client with
 * its request body, and the kitinerary mapper. Replaced: the kitinerary binary
 * (not installed, as on the reporter's instance, so the AI path runs) and the
 * one outbound call, `safeFetchLlm`, which answers the way Gemini did.
 *
 * The PDF is built here from synthetic text; the reporter's document is never
 * part of the repository.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { canAccessTrip, safeFetchLlm } = vi.hoisted(() => ({ canAccessTrip: vi.fn(), safeFetchLlm: vi.fn() }));
// The temp db is born inside the factory, which runs before anything imports it,
// and read back below through the mocked module itself.
vi.mock('../../src/db/database', async () => {
  const { default: Database } = await import('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return {
    db: tmp,
    canAccessTrip,
    isOwner: vi.fn(() => true),
    getPlaceWithTags: vi.fn(),
    closeDb: () => {},
    reinitialize: () => {},
  };
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (orig) => ({ ...(await orig<Record<string, unknown>>()), safeFetchLlm }));

import { db } from '../../src/db/database';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { ReservationImportModule } from '../../src/nest/reservation-import/reservation-import.module';
import { KitineraryExtractorService } from '../../src/nest/booking-import/kitinerary-extractor.service';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

/** A one-page PDF whose text layer holds `lines`, in the standard Helvetica. */
function pdfWithText(lines: string[]): Buffer {
  // PDF string literal: escape \ ( ), and write the euro sign as its WinAnsi byte.
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => '\\' + c).replace(/€/g, '\x80');
  const content = ['BT', '/F1 10 Tf', '12 TL', '20 780 Td', ...lines.map((l) => `(${esc(l)}) '`), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body, 'latin1');
  const rows = offsets.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${rows}`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

const PRINT = pdfWithText([
  'Harbour View Inn',
  'Address: Example Road 1, 1000 Sample Town',
  'Preis (für 2 Gäste)',
  '€ 89,35',
  'ANREISE 6 SEPTEMBER 13:00 ABREISE 7 SEPTEMBER 11:00',
]);

/** Gemini's chat-completions answer carrying `reservations` as its content. */
function geminiAnswers(reservations: unknown[]) {
  safeFetchLlm.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: JSON.stringify({ reservations }) } }] }),
    text: async () => '',
  } as unknown as Response);
}

/** The node Gemini returned in the report: every declared root field, no venue. */
const bareStay = {
  '@type': 'LodgingReservation',
  checkinTime: '2026-09-06T13:00:00',
  checkoutTime: '2026-09-07T11:00:00',
  price: 89.35,
  priceCurrency: 'EURials',
};

describe('Booking import e2e (#2477): a schema-bound provider on the upload route', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, ReservationImportModule] })
      .overrideProvider(KitineraryExtractorService)
      .useValue({ onModuleInit: () => {}, isAvailable: () => false, extract: vi.fn(), describe: () => ({ available: false }) })
      .overrideProvider(NotificationsService)
      .useValue({ send: vi.fn().mockResolvedValue(undefined) })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  const upload = (fileName: string, mode: string) =>
    request(server)
      .post(`/api/trips/${tripId}/reservations/import/booking`)
      .set('Cookie', sessionCookie(1))
      .field('mode', mode)
      .attach('files', PRINT, { filename: fileName, contentType: 'application/pdf' });

  const sentSchema = () => {
    const body = JSON.parse((safeFetchLlm.mock.calls[0][1] as RequestInit).body as string);
    return body.response_format.json_schema.schema.properties.reservations.items;
  };

  beforeAll(async () => {
    createTables(db);
    runMigrations(db);
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    tripId = Number(db.prepare("INSERT INTO trips (user_id, title) VALUES (1, 'Albania')").run().lastInsertRowid);
    // The instance config the reporter ran: Gemini behind the "openai" provider.
    db.prepare(
      `INSERT INTO addons (id, name, type, enabled, config) VALUES ('llm_parsing', 'AI Parsing', 'integration', 1, ?)
       ON CONFLICT(id) DO UPDATE SET enabled = 1, config = excluded.config`,
    ).run(JSON.stringify({ provider: 'openai', model: 'gemini-3.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' }));
    app = await build();
    vi.spyOn(app.get(PermissionsService), 'checkPermission').mockReturnValue(true);
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockImplementation((id: unknown) => db.prepare('SELECT * FROM trips WHERE id = ?').get(id));
    safeFetchLlm.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/reservations/import/booking`);
    expect(res.status).toBe(401);
    expect(safeFetchLlm).not.toHaveBeenCalled();
  });

  it('sends Gemini a reservationFor with declared venue fields, and requires it', async () => {
    geminiAnswers([]);
    await upload('booking.pdf', 'force-ai');

    const item = sentSchema();
    expect(item.required).toEqual(['@type', 'reservationFor']);
    expect(item.properties.reservationFor.properties).toMatchObject({
      name: { type: 'string' },
      address: { type: 'string' },
      telephone: { type: 'string' },
    });
    // The PDF went as text, and its euro amount survived the extraction.
    const user = JSON.parse((safeFetchLlm.mock.calls[0][1] as RequestInit).body as string).messages[1].content[0].text;
    expect(user).toContain('Harbour View Inn');
    expect(user).toContain('€ 89,35');
  });

  it("the reported answer: two venue-less nodes give one warning, with the file's own name", async () => {
    geminiAnswers([bareStay, { ...bareStay }]);
    const res = await upload('Bestätigung_1234567890.PDF', 'force-ai');

    expect(res.status).toBe(201);
    expect(res.body.items).toEqual([]);
    // One warning, not two: the copy is gone before the mapper sees it.
    expect(res.body.warnings).toHaveLength(1);
    expect(res.body.warnings[0]).toMatch(/^Incomplete LodgingReservation in Bestätigung_1234567890\.PDF\[0\] \(no reservationFor\)/);
    expect(res.body.files).toEqual([{ fileName: 'Bestätigung_1234567890.PDF', aiAvailable: true, aiUsed: true }]);
  });

  it('once Gemini fills the venue: one hotel in EUR, attached to the uploaded file', async () => {
    const stay = { ...bareStay, reservationFor: { name: 'Harbour View Inn', address: 'Example Road 1, 1000 Sample Town' } };
    geminiAnswers([stay, { ...stay }]);
    const res = await upload('Bestätigung_1.pdf', 'force-ai');

    expect(res.status).toBe(201);
    expect(res.body.warnings).toEqual([]);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      type: 'hotel',
      title: 'Harbour View Inn',
      needs_review: true,
      _accommodation: { check_in: '2026-09-06T13:00', check_out: '2026-09-07T11:00' },
      metadata: { price: 89.35, priceCurrency: 'EUR' },
      source: { fileName: 'Bestätigung_1.pdf', index: 0 },
    });
  });

  it("the upload dialog's mode reaches the same path, and a currency the model made up comes from the document", async () => {
    geminiAnswers([{ ...bareStay, priceCurrency: 'ZZZ', reservationFor: { name: 'Harbour View Inn' } }]);
    const res = await upload('Bestätigung_2.pdf', 'fallback-on-empty');

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].metadata.priceCurrency).toBe('EUR');
    expect(res.body.items[0].source.fileName).toBe('Bestätigung_2.pdf');
  });
});
