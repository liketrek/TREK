/**
 * Photos through the AI Parsing addon, end to end: the booking import taking a
 * photo, the Costs receipt scan and its job, and the capability the pickers ask.
 *
 * Real: the guards, multer, LlmParseService with the instance's `vision`
 * setting, the image cap, the OpenAI-compatible client, the import job queue
 * and its status route. Replaced: the kitinerary binary (absent) and the one
 * outbound call, `safeFetchLlm`, which answers as the provider would.
 */
import { db } from '../../src/db/database';
import { Addons } from '../../src/db/entities/Addons.entity';
import { KitineraryExtractorService } from '../../src/nest/booking-import/kitinerary-extractor.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { LlmParseModule } from '../../src/nest/llm-parse/llm-parse.module';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { ReceiptScanModule } from '../../src/nest/receipt-scan/receipt-scan.module';
import { ReservationImportModule } from '../../src/nest/reservation-import/reservation-import.module';
import { updateRows, upsertRow } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Jimp } from 'jimp';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const { safeFetchLlm } = vi.hoisted(() => ({ safeFetchLlm: vi.fn() }));
// A copy of the migrated + seeded snapshot, so the schema is the MikroORM
// chain's. Trip access is the real TripsRepository lookup against it.
vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const tmp = createSnapshotTestDb();
  return {
    db: tmp,
    canAccessTrip: () => undefined,
    isOwner: () => false,
    getPlaceWithTags: () => null,
    closeDb: () => {},
    reinitialize: () => {},
  };
});
vi.mock('../../src/utils/ssrfGuard', async (orig) => ({ ...(await orig<Record<string, unknown>>()), safeFetchLlm }));

let orm: TestOrm;

async function setVision(vision: string): Promise<void> {
  await updateRows(
    orm,
    Addons,
    { id: 'llm_parsing' },
    {
      config: { provider: 'openai', model: 'gpt-4.1-mini', apiKey: '', vision },
    },
  );
}

/** The provider's chat-completions answer, carrying `payload` as its content. */
function providerAnswers(payload: unknown) {
  safeFetchLlm.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
    text: async () => '',
  } as unknown as Response);
}

const sentUserContent = () =>
  JSON.parse((safeFetchLlm.mock.calls[0][1] as RequestInit).body as string).messages[1].content;

describe('Photos through AI Parsing e2e', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;
  let foreignTripId: number;
  let photo: Buffer;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        LlmParseModule,
        ReservationImportModule,
        ReceiptScanModule,
      ],
    })
      .overrideProvider(KitineraryExtractorService)
      .useValue({
        onModuleInit: () => {},
        isAvailable: () => false,
        extract: vi.fn(),
        describe: () => ({ available: false }),
      })
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

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned id: sessionCookie(1) signs for exactly this user.
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    tripId = (await makeTrip(orm, 1, { title: 'Lyon' })).id;
    // A trip user 1 is no member of: the real access lookup answers 404 for it.
    await makeUser(orm, { id: 2, username: 'e2e-other', email: 'e2e-other@example.test' });
    foreignTripId = (await makeTrip(orm, 2, { title: 'Elsewhere' })).id;
    await upsertRow(
      orm,
      Addons,
      { id: 'llm_parsing', name: 'AI Parsing', type: 'integration', enabled: true, config: {} },
      ['enabled'],
    );
    await upsertRow(orm, Addons, { id: 'budget', name: 'Costs', type: 'trip', enabled: true }, ['enabled']);
    photo = Buffer.from(await new Jimp({ width: 40, height: 60, color: 0xffffffff }).getBuffer('image/png'));
    app = await build();
    vi.spyOn(app.get(PermissionsService), 'checkPermission').mockResolvedValue(true);
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    safeFetchLlm.mockReset();
    await setVision('on');
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  describe('GET /api/llm/capabilities', () => {
    it('401 without a cookie', async () => {
      expect((await request(server).get('/api/llm/capabilities')).status).toBe(401);
    });

    it('answers the instance setting, and no for a cloud model on Automatic', async () => {
      expect((await request(server).get('/api/llm/capabilities').set('Cookie', sessionCookie(1))).body).toEqual({
        images: true,
      });
      await setVision('auto');
      expect((await request(server).get('/api/llm/capabilities').set('Cookie', sessionCookie(1))).body).toEqual({
        images: false,
      });
      expect(safeFetchLlm).not.toHaveBeenCalled();
    });
  });

  describe('booking import', () => {
    const upload = () =>
      request(server)
        .post(`/api/trips/${tripId}/reservations/import/booking`)
        .set('Cookie', sessionCookie(1))
        .field('mode', 'fallback-on-empty')
        .attach('files', photo, { filename: 'ticket.png', contentType: 'image/png' });

    it('sends a photo to the model as an image, and maps its answer', async () => {
      providerAnswers({
        reservations: [
          {
            '@type': 'TrainReservation',
            reservationFor: {
              departureStation: { name: 'Lyon Part-Dieu' },
              arrivalStation: { name: 'Paris Gare de Lyon' },
              departureTime: '2026-10-03T08:04:00',
            },
          },
        ],
      });
      const res = await upload();

      expect(res.status).toBe(201);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.files).toEqual([{ fileName: 'ticket.png', aiAvailable: true, aiUsed: true }]);
      const image = sentUserContent().find((p: { type: string }) => p.type === 'image_url');
      expect(image.image_url.url).toMatch(/^data:image\/png;base64,/);
    });

    it('refuses a photo with 400 when the model reads no images', async () => {
      await setVision('off');
      const res = await upload();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('The configured AI model does not read photos');
      expect(safeFetchLlm).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/trips/:tripId/budget/receipt-scan', () => {
    const scan = (name = 'bill.png', trip = tripId) =>
      request(server)
        .post(`/api/trips/${trip}/budget/receipt-scan`)
        .set('Cookie', sessionCookie(1))
        .attach('file', photo, {
          filename: name,
          contentType: name.endsWith('.png') ? 'image/png' : 'application/pdf',
        });

    it('401 without a cookie, 404 for a trip out of reach', async () => {
      expect((await request(server).post(`/api/trips/${tripId}/budget/receipt-scan`)).status).toBe(401);
      expect((await scan('bill.png', foreignTripId)).status).toBe(404);
    });

    it('reads the receipt in a job whose status answers what was read', async () => {
      providerAnswers({
        receipts: [
          {
            merchant: 'Boulangerie du Port',
            date: '2026-09-21',
            total: 18.1,
            currency: 'EUR',
            items: [{ name: 'Quiche', price: 6.9 }],
          },
        ],
      });
      const res = await scan();
      expect(res.status).toBe(201);
      const { jobId } = res.body;

      let status: request.Response | undefined;
      await vi.waitFor(async () => {
        status = await request(server)
          .get(`/api/trips/${tripId}/reservations/import/jobs/${jobId}`)
          .set('Cookie', sessionCookie(1));
        expect(status.body.status).toBe('done');
      });
      expect(status!.body.result).toEqual({
        receipt: {
          merchant: 'Boulangerie du Port',
          date: '2026-09-21',
          total: 18.1,
          currency: 'EUR',
          items: [{ name: 'Quiche', price: 6.9 }],
        },
        warnings: [],
      });
      const body = JSON.parse((safeFetchLlm.mock.calls[0][1] as RequestInit).body as string);
      expect(body.response_format.json_schema.name).toBe('receipts');
    });

    it('refuses a file that is not a photo, and any photo when the model reads no images', async () => {
      expect((await scan('bill.pdf')).status).toBe(400);
      await setVision('off');
      expect((await scan()).status).toBe(400);
      expect(safeFetchLlm).not.toHaveBeenCalled();
    });

    it('404 while Costs is off', async () => {
      await updateRows(orm, Addons, { id: 'budget' }, { enabled: false });
      try {
        const res = await scan();
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Costs addon is not enabled');
      } finally {
        await updateRows(orm, Addons, { id: 'budget' }, { enabled: true });
      }
    });
  });
});
