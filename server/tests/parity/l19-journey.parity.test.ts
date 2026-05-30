/**
 * C4 parity — journey (authenticated) + public journey share.
 *
 * Same request at the legacy Express routes and the migrated Nest controllers,
 * with journeyService, journeyShareService, the addon gate, db and auth mocked
 * identically. Multipart photo uploads + the stream/sendFile success bodies
 * differ per framework, so this pins routing, the addon-gate 404, status codes
 * (create 201 vs cover/trips/share 200 vs unlink 204) and the JSON envelopes.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => ({ immich_auto_upload: 0 }), all: () => [], run: () => undefined }) },
  closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
vi.mock('../../src/services/adminService', () => ({ isAddonEnabled }));
vi.mock('../../src/services/fileService', () => ({ getAllowedExtensions: () => '*' }));
vi.mock('../../src/services/memories/immichService', () => ({ uploadToImmich: vi.fn(), streamImmichAsset: vi.fn() }));
vi.mock('../../src/services/memories/photoResolverService', () => ({ streamPhoto: vi.fn() }));

const { jsvc } = vi.hoisted(() => ({
  jsvc: {
    canAccessJourney: vi.fn(), isOwner: vi.fn(), canEdit: vi.fn(),
    listJourneys: vi.fn(), createJourney: vi.fn(), getJourneyFull: vi.fn(), updateJourney: vi.fn(),
    updateJourneyPreferences: vi.fn(), deleteJourney: vi.fn(), addTripToJourney: vi.fn(), removeTripFromJourney: vi.fn(),
    listEntries: vi.fn(), createEntry: vi.fn(), updateEntry: vi.fn(), reorderEntries: vi.fn(), deleteEntry: vi.fn(),
    addPhoto: vi.fn(), addProviderPhoto: vi.fn(), linkPhotoToEntry: vi.fn(), uploadGalleryPhotos: vi.fn(),
    addProviderPhotoToGallery: vi.fn(), unlinkPhotoFromEntry: vi.fn(), deleteGalleryPhoto: vi.fn(), setPhotoProvider: vi.fn(),
    updatePhoto: vi.fn(), deletePhoto: vi.fn(), addContributor: vi.fn(), updateContributorRole: vi.fn(), removeContributor: vi.fn(),
    getSuggestions: vi.fn(), listUserTrips: vi.fn(),
  },
}));
vi.mock('../../src/services/journeyService', () => jsvc);

const { sharesvc } = vi.hoisted(() => ({
  sharesvc: {
    createOrUpdateJourneyShareLink: vi.fn(), getJourneyShareLink: vi.fn(), deleteJourneyShareLink: vi.fn(),
    getPublicJourney: vi.fn(), validateShareTokenForPhoto: vi.fn(), validateShareTokenForAsset: vi.fn(),
  },
}));
vi.mock('../../src/services/journeyShareService', () => sharesvc);

import journeyRoutes from '../../src/routes/journey';
import journeyPublicRoutes from '../../src/routes/journeyPublic';
import { JourneyModule } from '../../src/nest/journey/journey.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ADDON_IDS } from '../../src/addons';

describe('C4 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    // Mirror the app.ts mount gate so both stacks 404 when the addon is off.
    app.use('/api/journeys', (_req, res, next) => {
      if (!isAddonEnabled(ADDON_IDS.JOURNEY)) return res.status(404).json({ error: 'Journey addon is not enabled' });
      next();
    }, journeyRoutes);
    app.use('/api/public/journey', journeyPublicRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [JourneyModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    jsvc.listJourneys.mockReturnValue([{ id: 1, title: 'J' }]);
    jsvc.createJourney.mockReturnValue({ id: 9, title: 'J' });
    jsvc.getSuggestions.mockReturnValue([{ id: 1 }]);
    jsvc.listUserTrips.mockReturnValue([{ id: 2 }]);
    jsvc.getJourneyFull.mockReturnValue({ id: 9, title: 'J' });
    jsvc.updateJourney.mockReturnValue({ id: 9, title: 'J2' });
    jsvc.deleteJourney.mockReturnValue(true);
    jsvc.addTripToJourney.mockReturnValue(true);
    jsvc.removeTripFromJourney.mockReturnValue(true);
    jsvc.listEntries.mockReturnValue([{ id: 1 }]);
    jsvc.createEntry.mockReturnValue({ id: 3 });
    jsvc.updateEntry.mockReturnValue({ id: 3 });
    jsvc.deleteEntry.mockReturnValue(true);
    jsvc.reorderEntries.mockReturnValue(true);
    jsvc.addProviderPhoto.mockReturnValue({ id: 5 });
    jsvc.linkPhotoToEntry.mockReturnValue({ id: 5 });
    jsvc.addProviderPhotoToGallery.mockReturnValue({ id: 5 });
    jsvc.unlinkPhotoFromEntry.mockReturnValue(true);
    jsvc.deleteGalleryPhoto.mockReturnValue({ id: 5, file_path: null });
    jsvc.updatePhoto.mockReturnValue({ id: 5 });
    jsvc.deletePhoto.mockReturnValue({ id: 5, file_path: null });
    jsvc.addContributor.mockReturnValue(true);
    jsvc.updateContributorRole.mockReturnValue(true);
    jsvc.removeContributor.mockReturnValue(true);
    jsvc.updateJourneyPreferences.mockReturnValue({ ok: true });
    sharesvc.getJourneyShareLink.mockReturnValue({ token: 'abc' });
    sharesvc.createOrUpdateJourneyShareLink.mockReturnValue({ token: 'abc' });
    sharesvc.deleteJourneyShareLink.mockReturnValue(true);
    sharesvc.getPublicJourney.mockReturnValue({ id: 9 });
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('404 when the Journey addon is disabled', () => {
    isAddonEnabled.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/journeys' });
  });

  it('GET /journeys', () => expectParity(expressServer, nestServer, { path: '/api/journeys' }));
  it('POST /journeys (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys', body: { title: 'J' } }));
  it('POST /journeys 400 no title', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys', body: {} }));
  it('GET /journeys/suggestions', () => expectParity(expressServer, nestServer, { path: '/api/journeys/suggestions' }));
  it('GET /journeys/available-trips', () => expectParity(expressServer, nestServer, { path: '/api/journeys/available-trips' }));

  it('PATCH /journeys/entries/:id', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/entries/3', body: { title: 'x' } }));
  it('PATCH /journeys/entries/:id 404', () => {
    jsvc.updateEntry.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/entries/3', body: {} });
  });
  it('DELETE /journeys/entries/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/entries/3' }));
  it('POST /journeys/entries/:id/provider-photos batch', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/entries/3/provider-photos', body: { provider: 'immich', asset_ids: ['a', 'b'] } }));
  it('POST /journeys/entries/:id/provider-photos 400', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/entries/3/provider-photos', body: { provider: 'immich' } }));
  it('POST /journeys/entries/:id/link-photo (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/entries/3/link-photo', body: { journey_photo_id: 5 } }));
  it('POST /journeys/entries/:id/link-photo 400', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/entries/3/link-photo', body: {} }));
  it('DELETE /journeys/entries/:id/photos/:pid (204)', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/entries/3/photos/7' }));
  it('PATCH /journeys/photos/:id', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/photos/5', body: { caption: 'c' } }));
  it('DELETE /journeys/photos/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/photos/5' }));

  it('POST /journeys/:id/gallery/provider-photos batch', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/gallery/provider-photos', body: { provider: 'immich', asset_ids: ['a'] } }));
  it('DELETE /journeys/:id/gallery/:pid (204)', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/9/gallery/7' }));

  it('GET /journeys/:id', () => expectParity(expressServer, nestServer, { path: '/api/journeys/9' }));
  it('GET /journeys/:id 404', () => {
    jsvc.getJourneyFull.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { path: '/api/journeys/9' });
  });
  it('PATCH /journeys/:id', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/9', body: { title: 'J2' } }));
  it('DELETE /journeys/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/9' }));

  it('POST /journeys/:id/trips (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/trips', body: { trip_id: 2 } }));
  it('POST /journeys/:id/trips 400', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/trips', body: {} }));
  it('DELETE /journeys/:id/trips/:tripId', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/9/trips/2' }));

  it('GET /journeys/:id/entries', () => expectParity(expressServer, nestServer, { path: '/api/journeys/9/entries' }));
  it('POST /journeys/:id/entries (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/entries', body: { entry_date: '2026-01-01' } }));
  it('POST /journeys/:id/entries 400', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/entries', body: {} }));
  it('PUT /journeys/:id/entries/reorder', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/journeys/9/entries/reorder', body: { orderedIds: [1, 2] } }));
  it('PUT /journeys/:id/entries/reorder 400', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/journeys/9/entries/reorder', body: { orderedIds: 'x' } }));

  it('POST /journeys/:id/contributors (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/contributors', body: { user_id: 2 } }));
  it('POST /journeys/:id/contributors 400', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/contributors', body: {} }));
  it('PATCH /journeys/:id/contributors/:uid', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/9/contributors/2', body: { role: 'editor' } }));
  it('DELETE /journeys/:id/contributors/:uid', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/9/contributors/2' }));

  it('PATCH /journeys/:id/preferences', () => expectParity(expressServer, nestServer, { method: 'patch', path: '/api/journeys/9/preferences', body: { theme: 'dark' } }));
  it('GET /journeys/:id/share-link', () => expectParity(expressServer, nestServer, { path: '/api/journeys/9/share-link' }));
  it('POST /journeys/:id/share-link (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/journeys/9/share-link', body: { share_timeline: true } }));
  it('DELETE /journeys/:id/share-link', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/journeys/9/share-link' }));

  // Public
  it('GET /public/journey/:token', () => expectParity(expressServer, nestServer, { path: '/api/public/journey/tok' }));
  it('GET /public/journey/:token 404', () => {
    sharesvc.getPublicJourney.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { path: '/api/public/journey/tok' });
  });
});
