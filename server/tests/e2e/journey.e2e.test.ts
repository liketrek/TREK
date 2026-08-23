/**
 * Journey e2e — exercises the migrated /api/journeys and /api/public/journey
 * endpoints through the real JwtAuthGuard against a temp SQLite db. The journey
 * services + addon gate are mocked; this focuses on the addon-gate-before-auth
 * ordering (404 wins over 401), auth, the service-owned 403/404 mapping, status
 * codes and the unguarded public route.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
// The controller's pure helpers (isVideoExtension/isVideoMime/MAX_VIDEO_SIZE)
// now come from the real files.constants; only the request-time app_settings
// read is mocked, preserving the old '*'-allowlist semantics for the fixtures.
// The memories providers are injected since the fold — stubbed on the prototype
// so JourneyModule still resolves them through DI.
vi.mock('../../src/nest/memories/immich.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/immich.service')>();
  actual.ImmichService.prototype.uploadToImmich = vi.fn();
  actual.ImmichService.prototype.streamImmichAsset = vi.fn();
  return actual;
});
vi.mock('../../src/nest/memories/photo-resolver.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/photo-resolver.service')>();
  actual.PhotoResolverService.prototype.streamPhoto = vi.fn();
  return actual;
});

const { jsvc } = vi.hoisted(() => ({
  jsvc: {
    listJourneys: vi.fn(), createJourney: vi.fn(), getJourneyFull: vi.fn(),
    journeyStats: vi.fn(),
  },
}));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';

const { sharesvc } = vi.hoisted(() => ({ sharesvc: { getPublicJourney: vi.fn() } }));
import { JourneyShareService } from '../../src/nest/journey/journey-share.service';

const { booksvc } = vi.hoisted(() => ({
  booksvc: {
    getBook: vi.fn(), canOpen: vi.fn(), saveBook: vi.fn(),
    deleteBook: vi.fn(), broadcastSaved: vi.fn(),
  },
}));
import { JourneyBookService } from '../../src/nest/journey/journey-book.service';

import { JourneyModule } from '../../src/nest/journey/journey.module';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Journey e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, JourneyModule] })
      .overrideProvider(JourneyDomainService)
      .useValue(jsvc)
      .overrideProvider(JourneyShareService)
      .useValue(sharesvc)
      .overrideProvider(JourneyBookService)
      .useValue(booksvc)
      .overrideProvider(AddonsService)
      .useValue({ isAddonEnabled })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp(). Without it a book save
    // would reach the service unvalidated here and the e2e would pass on a
    // route that 400s in production.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    jsvc.listJourneys.mockReturnValue([{ id: 1, title: 'J' }]);
    jsvc.createJourney.mockReturnValue({ id: 9, title: 'J' });
    sharesvc.getPublicJourney.mockReturnValue({ id: 9 });
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
    booksvc.getBook.mockReset();
    booksvc.canOpen.mockReset();
    booksvc.saveBook.mockReset();
    booksvc.deleteBook.mockReset();
    booksvc.broadcastSaved.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('404 (addon gate wins over auth) when the Journey addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/journeys');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  it('401 with the addon enabled but no session cookie', async () => {
    expect((await request(server).get('/api/journeys')).status).toBe(401);
  });

  it('200 list with a session', async () => {
    const res = await request(server).get('/api/journeys').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ journeys: [{ id: 1, title: 'J' }] });
  });

  it('201 create, 400 without a title', async () => {
    const ok = await request(server).post('/api/journeys').set('Cookie', sessionCookie(1)).send({ title: 'J' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ id: 9, title: 'J' });
    const bad = await request(server).post('/api/journeys').set('Cookie', sessionCookie(1)).send({});
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'Title is required' });
  });

  it('404 for an inaccessible journey', async () => {
    jsvc.getJourneyFull.mockReturnValue(null);
    const res = await request(server).get('/api/journeys/9').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  /*
   * The journey figures TREK Studio prints (#1973). Read-only and derived, so
   * what e2e adds over the controller unit test is that the addon gate and the
   * auth guard both run in front of it — a route that reports where someone has
   * been must not be reachable without a session.
   */
  it('401 for the journey stats without a session', async () => {
    expect((await request(server).get('/api/journeys/9/stats')).status).toBe(401);
  });

  it('404 for the stats of an inaccessible journey', async () => {
    jsvc.journeyStats.mockReturnValue(null);
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  it('200 with the figures, returned bare rather than in an envelope', async () => {
    jsvc.journeyStats.mockReturnValue({
      journeyId: 9, distance: 1_189_000, days: 14, steps: 14, photos: 57, places: 0,
      furthest: 408_000,
      countries: [{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }],
      points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS' }],
      start: '2026-06-02', end: '2026-06-15',
    });
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.distance).toBe(1_189_000);
    expect(res.body.countries).toEqual([{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }]);
    expect(jsvc.journeyStats).toHaveBeenCalledWith(9, 1);
  });

  it('404 (addon gate) for the stats when the Journey addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  /*
   * ── The Studio book (#1973) ────────────────────────────────────────────
   *
   * What e2e adds over the service test: the addon gate and the auth guard both
   * run in front of these, the 409 keeps its body (an exception filter that
   * flattened it would cost the client the other version), and DELETE really
   * answers 204 rather than Nest's default 200.
   */
  it('401 for the book without a session', async () => {
    expect((await request(server).get('/api/journeys/9/book')).status).toBe(401);
    expect((await request(server).put('/api/journeys/9/book').send({ document: {} })).status).toBe(401);
    expect((await request(server).delete('/api/journeys/9/book')).status).toBe(401);
  });

  it('404 (addon gate) for the book when the Journey addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  /*
   * "No book yet" is not "no journey". Studio opens on an empty journey, lays a
   * book out and saves it, so a 404 here would make the ordinary first visit
   * look like a missing trip.
   */
  it('200 with a null book for a journey that has none yet', async () => {
    booksvc.getBook.mockReturnValue(null);
    booksvc.canOpen.mockReturnValue(true);
    const res = await request(server).get('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ book: null });
  });

  it('404 for the book of an inaccessible journey', async () => {
    booksvc.getBook.mockReturnValue(null);
    booksvc.canOpen.mockReturnValue(false);
    const res = await request(server).get('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  it('200 with the stored book', async () => {
    booksvc.getBook.mockReturnValue({ id: 3, journeyId: 9, title: 'Iceland', version: 4 });
    const res = await request(server).get('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.book.version).toBe(4);
    expect(booksvc.getBook).toHaveBeenCalledWith(9, 1);
  });

  it('200 on save — not 201, the book is one object being updated', async () => {
    booksvc.saveBook.mockReturnValue({ record: { id: 3, journeyId: 9, title: 'T', version: 5 } });
    const res = await request(server)
      .put('/api/journeys/9/book')
      .set('Cookie', sessionCookie(1))
      .send({ title: 'T', document: { version: 1 }, baseVersion: 4 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(5);
    // The pipe fills the document's defaults on the way in, so the service is
    // never handed a half-document to guess at.
    const [journeyId, userId, input] = booksvc.saveBook.mock.calls[0];
    expect([journeyId, userId]).toEqual([9, 1]);
    expect(input.title).toBe('T');
    expect(input.baseVersion).toBe(4);
    expect(input.document.page.pageWidth).toBe(210);
    expect(input.document.spreads).toEqual([]);
  });

  it('forwards the socket id so the saving client does not echo its own change', async () => {
    booksvc.saveBook.mockReturnValue({ record: { id: 3, version: 5 } });
    await request(server)
      .put('/api/journeys/9/book')
      .set('Cookie', sessionCookie(1))
      .set('X-Socket-Id', 'sock-7')
      .send({ document: {} });
    expect(booksvc.broadcastSaved).toHaveBeenCalledWith(9, 1, { id: 3, version: 5 }, 'sock-7');
  });

  it('409 with the current record in the body, not a bare status', async () => {
    booksvc.saveBook.mockReturnValue({ conflict: { id: 3, journeyId: 9, title: 'Theirs', version: 6 } });
    const res = await request(server)
      .put('/api/journeys/9/book')
      .set('Cookie', sessionCookie(1))
      .send({ document: {}, baseVersion: 4 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Book was changed by someone else');
    expect(res.body.current.version).toBe(6);
    expect(booksvc.broadcastSaved).not.toHaveBeenCalled();
  });

  it('404 on saving into an inaccessible journey', async () => {
    booksvc.saveBook.mockReturnValue(null);
    const res = await request(server)
      .put('/api/journeys/9/book')
      .set('Cookie', sessionCookie(1))
      .send({ document: {} });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  it('400 for a save with no document at all', async () => {
    const res = await request(server)
      .put('/api/journeys/9/book')
      .set('Cookie', sessionCookie(1))
      .send({ title: 'T' });
    expect(res.status).toBe(400);
    expect(booksvc.saveBook).not.toHaveBeenCalled();
  });

  it('204 on delete, and 404 when the journey is out of reach', async () => {
    booksvc.deleteBook.mockReturnValue(true);
    const ok = await request(server).delete('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(204);

    booksvc.deleteBook.mockReturnValue(null);
    const gone = await request(server).delete('/api/journeys/9/book').set('Cookie', sessionCookie(1));
    expect(gone.status).toBe(404);
    expect(gone.body).toEqual({ error: 'Journey not found' });
  });

  it('public journey read is unguarded (200 with a valid token, no cookie)', async () => {
    const res = await request(server).get('/api/public/journey/tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 9 });
  });

  it('public journey read still answers the addon gate when Journey is off', async () => {
    // The authenticated surface goes dark with the addon; a published journey
    // has to go with it, or turning the switch off does not take the feature away.
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/public/journey/tok');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  it('the image fileFilter is wired: a disallowed extension is rejected, not stored', async () => {
    // The multer options are built by MulterModule.registerAsync now, and Nest
    // injects MULTER_MODULE_OPTIONS with @Optional(): a token that fails to
    // resolve is not a boot error, it silently falls back to defaults, which
    // means no fileFilter and no size cap. This case is what turns that into a
    // visible failure, since an unfiltered upload would answer 201.
    const res = await request(server)
      .post('/api/journeys/9/cover')
      .set('Cookie', sessionCookie(1))
      .attach('cover', Buffer.from('MZ'), { filename: 'payload.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  it('public journey 404 for an unknown token', async () => {
    sharesvc.getPublicJourney.mockReturnValueOnce(null);
    const res = await request(server).get('/api/public/journey/bad');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
