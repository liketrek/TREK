/**
 * C2 parity — collab (shared notes, polls, chat + reactions, link previews).
 *
 * Same request at the legacy Express /api/trips/:tripId/collab route and the
 * migrated Nest controller, with collabService, permissions, the WebSocket
 * broadcast, the notification fire-and-forget, the db and auth mocked
 * identically. File uploads are exercised by the e2e/unit specs (multer differs
 * per framework); this pins routing, status codes, the error envelopes and the
 * poll/message error-string mapping.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => ({ title: 'T' }), all: () => [], run: () => undefined }) },
  canAccessTrip: vi.fn(() => ({ user_id: 1 })), closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { collabSvc } = vi.hoisted(() => ({
  collabSvc: {
    verifyTripAccess: vi.fn(), listNotes: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(),
    addNoteFile: vi.fn(), getFormattedNoteById: vi.fn(), deleteNoteFile: vi.fn(),
    listPolls: vi.fn(), createPoll: vi.fn(), votePoll: vi.fn(), closePoll: vi.fn(), deletePoll: vi.fn(),
    listMessages: vi.fn(), createMessage: vi.fn(), deleteMessage: vi.fn(), addOrRemoveReaction: vi.fn(), fetchLinkPreview: vi.fn(),
  },
}));
vi.mock('../../src/services/collabService', () => collabSvc);

import collabRoutes from '../../src/routes/collab';
import { CollabModule } from '../../src/nest/collab/collab.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C2 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/collab', collabRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [CollabModule] }).compile();
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
    collabSvc.listNotes.mockReturnValue([{ id: 1, title: 'N' }]);
    collabSvc.createNote.mockReturnValue({ id: 9, title: 'N' });
    collabSvc.updateNote.mockReturnValue({ id: 9, title: 'N2' });
    collabSvc.deleteNote.mockReturnValue(true);
    collabSvc.listPolls.mockReturnValue([{ id: 1 }]);
    collabSvc.createPoll.mockReturnValue({ id: 7 });
    collabSvc.votePoll.mockReturnValue({ poll: { id: 7 } });
    collabSvc.closePoll.mockReturnValue({ id: 7, closed: 1 });
    collabSvc.deletePoll.mockReturnValue(true);
    collabSvc.listMessages.mockReturnValue([{ id: 1, text: 'hi' }]);
    collabSvc.createMessage.mockReturnValue({ message: { id: 3, text: 'hi' } });
    collabSvc.deleteMessage.mockReturnValue({ username: 'u' });
    collabSvc.addOrRemoveReaction.mockReturnValue({ found: true, reactions: [{ emoji: '👍', count: 1 }] });
    collabSvc.fetchLinkPreview.mockResolvedValue({ title: 'T', description: null, image: null, url: 'http://x' });
  });

  beforeEach(() => {
    collabSvc.verifyTripAccess.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  // Notes
  it('GET /notes', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/notes' }));
  it('GET /notes 404 no access', () => {
    collabSvc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/notes' });
  });
  it('POST /notes (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/notes', body: { title: 'N' } }));
  it('POST /notes 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/notes', body: { title: 'N' } });
  });
  it('POST /notes 400 missing title', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/notes', body: {} }));
  it('PUT /notes/:id', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/collab/notes/9', body: { title: 'N2' } }));
  it('PUT /notes/:id 404', () => {
    collabSvc.updateNote.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/collab/notes/9', body: { title: 'x' } });
  });
  it('DELETE /notes/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/collab/notes/9' }));
  it('DELETE /notes/:id 404', () => {
    collabSvc.deleteNote.mockReturnValueOnce(false).mockReturnValueOnce(false);
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/collab/notes/9' });
  });

  // Polls
  it('GET /polls', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/polls' }));
  it('POST /polls (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls', body: { question: 'q', options: ['a', 'b'] } }));
  it('POST /polls 400 missing question', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls', body: { options: ['a', 'b'] } }));
  it('POST /polls 400 too few options', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls', body: { question: 'q', options: ['a'] } }));
  it('POST /polls/:id/vote (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls/7/vote', body: { option_index: 0 } }));
  it('POST /polls/:id/vote 404', () => {
    collabSvc.votePoll.mockReturnValueOnce({ error: 'not_found' }).mockReturnValueOnce({ error: 'not_found' });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls/7/vote', body: { option_index: 0 } });
  });
  it('POST /polls/:id/vote 400 closed', () => {
    collabSvc.votePoll.mockReturnValueOnce({ error: 'closed' }).mockReturnValueOnce({ error: 'closed' });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/polls/7/vote', body: { option_index: 0 } });
  });
  it('PUT /polls/:id/close', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/collab/polls/7/close' }));
  it('DELETE /polls/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/collab/polls/7' }));

  // Messages
  it('GET /messages', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/messages' }));
  it('POST /messages (201)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages', body: { text: 'hi' } }));
  it('POST /messages 400 too long', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages', body: { text: 'x'.repeat(5001) } }));
  it('POST /messages 400 empty', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages', body: { text: '   ' } }));
  it('POST /messages 400 reply_not_found', () => {
    collabSvc.createMessage.mockReturnValueOnce({ error: 'reply_not_found' }).mockReturnValueOnce({ error: 'reply_not_found' });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages', body: { text: 'hi', reply_to: 99 } });
  });
  it('POST /messages/:id/react (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages/3/react', body: { emoji: '👍' } }));
  it('POST /messages/:id/react 404', () => {
    collabSvc.addOrRemoveReaction.mockReturnValueOnce({ found: false, reactions: [] }).mockReturnValueOnce({ found: false, reactions: [] });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/collab/messages/3/react', body: { emoji: '👍' } });
  });
  it('DELETE /messages/:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/collab/messages/3' }));
  it('DELETE /messages/:id 403 not owner', () => {
    collabSvc.deleteMessage.mockReturnValueOnce({ error: 'not_owner' }).mockReturnValueOnce({ error: 'not_owner' });
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/collab/messages/3' });
  });

  // Link preview
  it('GET /link-preview', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/link-preview', query: { url: 'http://x' } }));
  it('GET /link-preview 400 missing url', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/collab/link-preview' }));
});
