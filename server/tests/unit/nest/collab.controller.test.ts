import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { CollabController } from '../../../src/nest/collab/collab.controller';
import { TripAccessGuard, TRIP_PERMISSION_KEY } from '../../../src/nest/permissions/trip-access.guard';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import type { CollabService } from '../../../src/nest/collab/collab.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<CollabService> = {}): CollabService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue({ user_id: 1 }),
    canEdit: vi.fn().mockReturnValue(true),
    canUploadFiles: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyCollab: vi.fn(),
    ...o,
  } as unknown as CollabService;
}

const storageStub = {
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
} as unknown as StorageService;

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('CollabController (parity with the legacy /api/trips/:tripId/collab route)', () => {
  describe('notes', () => {
    it('GET lists', () => {
      const s = svc({ listNotes: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).listNotes(user, '5')).toEqual({ notes: [{ id: 1 }] });
    });

    it('POST creates + broadcasts + notifies (empty title now 400s in the Zod pipe)', () => {
      const createNote = vi.fn().mockReturnValue({ id: 9 });
      const broadcast = vi.fn();
      const notifyCollab = vi.fn();
      const s = svc({ createNote, broadcast, notifyCollab } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).createNote(user, '5', { title: 'T', content: 'c' }, 'sock')).toEqual({ note: { id: 9 } });
      expect(createNote).toHaveBeenCalledWith('5', 1, { title: 'T', content: 'c', category: undefined, color: undefined, website: undefined });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:created', { note: { id: 9 } }, 'sock');
      expect(notifyCollab).toHaveBeenCalledWith('5', user);
    });

    it('PUT 404 when missing, else updates + broadcasts', () => {
      expect(thrown(() => new CollabController(svc({ updateNote: vi.fn().mockReturnValue(null) } as Partial<CollabService>), storageStub).updateNote(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ updateNote: vi.fn().mockReturnValue({ id: 9 }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).updateNote(user, '5', '9', { title: 'b' }, 'sock')).toEqual({ note: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:updated', { note: { id: 9 } }, 'sock');
    });

    it('DELETE 404 when missing, else success + broadcasts', async () => {
      expect(await thrownAsync(() => new CollabController(svc({ deleteNote: vi.fn().mockResolvedValue(false) } as Partial<CollabService>), storageStub).deleteNote(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ deleteNote: vi.fn().mockResolvedValue(true), broadcast } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).deleteNote(user, '5', '9', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:deleted', { noteId: 9 }, 'sock');
    });
  });

  describe('note files', () => {
    const file = { filename: 'a.pdf' } as Express.Multer.File;
    it('403 without file_upload, 400 without file, 404 unknown note, else commits + returns result', async () => {
      expect(await thrownAsync(() => new CollabController(svc({ canUploadFiles: vi.fn().mockReturnValue(false) }), storageStub).addNoteFile(user, '5', '9', file))).toEqual({ status: 403, body: { error: 'No permission to upload files' } });
      expect(await thrownAsync(() => new CollabController(svc(), storageStub).addNoteFile(user, '5', '9', undefined))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
      expect(await thrownAsync(() => new CollabController(svc({ addNoteFile: vi.fn().mockReturnValue(null) } as Partial<CollabService>), storageStub).addNoteFile(user, '5', '9', file))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ addNoteFile: vi.fn().mockReturnValue({ file: { id: 3 } }), getFormattedNoteById: vi.fn().mockReturnValue({ id: 9 }), broadcast } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).addNoteFile(user, '5', '9', file, 'sock')).toEqual({ file: { id: 3 } });
      expect(storageStub.put).toHaveBeenCalledWith('files', 'a.pdf', { tmpPath: undefined });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:updated', { note: { id: 9 } }, 'sock');
    });

    it('reclaims the upload on every refusal, spooled or already committed', async () => {
      // multer has written the file before any check runs, and nothing sweeps
      // orphans, so a loop of rejected POSTs would otherwise fill the disk.
      const spool = path.join(os.tmpdir(), `trek-collab-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
      fs.writeFileSync(spool, 'x');
      const spooled = { filename: 'a.pdf', path: spool } as Express.Multer.File;
      expect(await thrownAsync(() => new CollabController(svc({ canUploadFiles: vi.fn().mockReturnValue(false) }), storageStub).addNoteFile(user, '5', '9', spooled))).toEqual({ status: 403, body: { error: 'No permission to upload files' } });
      expect(fs.existsSync(spool)).toBe(false);

      const spool2 = path.join(os.tmpdir(), `trek-collab-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
      fs.writeFileSync(spool2, 'x');
      expect(await thrownAsync(() => new CollabController(svc({ verifyTripAccess: vi.fn().mockReturnValue(null) }), storageStub).addNoteFile(user, '5', '9', { filename: 'b.pdf', path: spool2 } as Express.Multer.File))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(fs.existsSync(spool2)).toBe(false);

      // Past the commit the spool file is gone, so the final object is what has
      // to go instead.
      await thrownAsync(() => new CollabController(svc({ addNoteFile: vi.fn().mockReturnValue(null) } as Partial<CollabService>), storageStub).addNoteFile(user, '5', '9', file));
      expect(storageStub.delete).toHaveBeenCalledWith('files', 'a.pdf');
    });

    it('DELETE file 404 when missing, else success', async () => {
      expect(await thrownAsync(() => new CollabController(svc({ deleteNoteFile: vi.fn().mockResolvedValue(false) } as Partial<CollabService>), storageStub).deleteNoteFile(user, '5', '9', '3'))).toEqual({ status: 404, body: { error: 'File not found' } });
      const s = svc({ deleteNoteFile: vi.fn().mockResolvedValue(true), getFormattedNoteById: vi.fn().mockReturnValue({ id: 9 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).deleteNoteFile(user, '5', '9', '3')).toEqual({ success: true });
    });
  });

  describe('polls', () => {
    it('POST creates (missing question / <2 options now 400 in the Zod pipe)', () => {
      const s = svc({ createPoll: vi.fn().mockReturnValue({ id: 7 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).createPoll(user, '5', { question: 'q', options: ['a', 'b'] })).toEqual({ poll: { id: 7 } });
    });

    it('vote maps not_found/closed/invalid_index, else broadcasts the poll', () => {
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'not_found' }) } as Partial<CollabService>), storageStub).votePoll(user, '5', '7', { option_index: 0 }))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'closed' }) } as Partial<CollabService>), storageStub).votePoll(user, '5', '7', { option_index: 0 }))).toEqual({ status: 400, body: { error: 'Poll is closed' } });
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'invalid_index' }) } as Partial<CollabService>), storageStub).votePoll(user, '5', '7', { option_index: 9 }))).toEqual({ status: 400, body: { error: 'Invalid option index' } });
      const broadcast = vi.fn();
      const s = svc({ votePoll: vi.fn().mockReturnValue({ poll: { id: 7 } }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).votePoll(user, '5', '7', { option_index: 0 }, 'sock')).toEqual({ poll: { id: 7 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:poll:voted', { poll: { id: 7 } }, 'sock');
    });

    it('close 404 when missing, else broadcasts', () => {
      expect(thrown(() => new CollabController(svc({ closePoll: vi.fn().mockReturnValue(null) } as Partial<CollabService>), storageStub).closePoll(user, '5', '7'))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      const s = svc({ closePoll: vi.fn().mockReturnValue({ id: 7 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).closePoll(user, '5', '7')).toEqual({ poll: { id: 7 } });
    });

    it('delete 404 when missing, else success', () => {
      expect(thrown(() => new CollabController(svc({ deletePoll: vi.fn().mockReturnValue(false) } as Partial<CollabService>), storageStub).deletePoll(user, '5', '7'))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      const s = svc({ deletePoll: vi.fn().mockReturnValue(true), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).deletePoll(user, '5', '7')).toEqual({ success: true });
    });
  });

  describe('messages', () => {
    it('POST 400 whitespace-only, 400 reply_not_found, else creates + notifies (length checks now in the Zod pipe)', () => {
      expect(thrown(() => new CollabController(svc(), storageStub).createMessage(user, '5', { text: '   ' }))).toEqual({ status: 400, body: { error: 'Message text is required' } });
      expect(thrown(() => new CollabController(svc({ createMessage: vi.fn().mockReturnValue({ error: 'reply_not_found' }) } as Partial<CollabService>), storageStub).createMessage(user, '5', { text: 'hi', reply_to: 99 }))).toEqual({ status: 400, body: { error: 'Reply target message not found' } });
      const broadcast = vi.fn();
      const notifyCollab = vi.fn();
      const s = svc({ createMessage: vi.fn().mockReturnValue({ message: { id: 3 } }), broadcast, notifyCollab } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).createMessage(user, '5', { text: 'hello' }, 'sock')).toEqual({ message: { id: 3 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:created', { message: { id: 3 } }, 'sock');
      expect(notifyCollab).toHaveBeenCalledWith('5', user, 'hello');
    });

    it('react 404 unknown, else broadcasts reactions (empty emoji now 400s in the Zod pipe)', () => {
      expect(thrown(() => new CollabController(svc({ reactMessage: vi.fn().mockReturnValue({ found: false, reactions: [] }) } as Partial<CollabService>), storageStub).react(user, '5', '3', { emoji: '👍' }))).toEqual({ status: 404, body: { error: 'Message not found' } });
      const broadcast = vi.fn();
      const s = svc({ reactMessage: vi.fn().mockReturnValue({ found: true, reactions: [{ emoji: '👍', count: 1 }] }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).react(user, '5', '3', { emoji: '👍' }, 'sock')).toEqual({ reactions: [{ emoji: '👍', count: 1 }] });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:reacted', { messageId: 3, reactions: [{ emoji: '👍', count: 1 }] }, 'sock');
    });

    it('delete maps not_found (404) / not_owner (403), else success with username', () => {
      expect(thrown(() => new CollabController(svc({ deleteMessage: vi.fn().mockReturnValue({ error: 'not_found' }) } as Partial<CollabService>), storageStub).deleteMessage(user, '5', '3'))).toEqual({ status: 404, body: { error: 'Message not found' } });
      expect(thrown(() => new CollabController(svc({ deleteMessage: vi.fn().mockReturnValue({ error: 'not_owner' }) } as Partial<CollabService>), storageStub).deleteMessage(user, '5', '3'))).toEqual({ status: 403, body: { error: 'You can only delete your own messages' } });
      const broadcast = vi.fn();
      const s = svc({ deleteMessage: vi.fn().mockReturnValue({ username: 'bob' }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s, storageStub).deleteMessage(user, '5', '3', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:deleted', { messageId: 3, username: 'bob' }, 'sock');
    });
  });

  // The decorators, not the handler body. Constructing the controller directly,
  // which every test above does, runs no guard at all — so removing the trip check
  // again would leave this file green. It shipped without one once.
  describe('link preview guard chain', () => {
    const guardsOn = (target: object): unknown[] => (Reflect.getMetadata('__guards__', target) as unknown[]) ?? [];

    it('resolves the trip and refuses a caller who cannot reach it', () => {
      expect(guardsOn(CollabController.prototype.linkPreview)).toContain(TripAccessGuard);
    });

    it('sits behind the same authentication as the rest of the controller', () => {
      expect(guardsOn(CollabController)).toContain(JwtAuthGuard);
    });

    it('demands no write permission, matching the other read routes', () => {
      // It is requested while rendering a message or a note, never while writing
      // one. Requiring collab_edit would strip previews from a trip whose owner
      // narrowed that right, for people who may still read the chat.
      for (const handler of [CollabController.prototype.linkPreview, CollabController.prototype.listMessages, CollabController.prototype.listNotes]) {
        expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBeUndefined();
      }
      // The write siblings do demand it, so this is a deliberate split, not an omission.
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, CollabController.prototype.createMessage)).toBe('collab_edit');
    });
  });

  describe('link preview', () => {
    it('400 without url, maps an error result to 400, else returns the preview', async () => {
      expect(await thrownAsync(() => new CollabController(svc(), storageStub).linkPreview(user, '5', undefined))).toEqual({ status: 400, body: { error: 'URL is required' } });
      expect(await thrownAsync(() => new CollabController(svc({ linkPreview: vi.fn().mockResolvedValue({ error: 'bad url' }) } as Partial<CollabService>), storageStub).linkPreview(user, '5', 'http://x'))).toEqual({ status: 400, body: { error: 'bad url' } });
      const s = svc({ linkPreview: vi.fn().mockResolvedValue({ title: 'T', description: null, image: null, url: 'http://x' }) } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).linkPreview(user, '5', 'http://x')).toEqual({ title: 'T', description: null, image: null, url: 'http://x' });
    });

    it('maps an exhausted preview budget to 429, not to the 400 a refused URL gets', async () => {
      const s = svc({ linkPreview: vi.fn().mockResolvedValue({ title: null, description: null, image: null, url: 'http://x', rateLimited: true }) } as Partial<CollabService>);
      expect(await thrownAsync(() => new CollabController(s, storageStub).linkPreview(user, '5', 'http://x'))).toEqual({ status: 429, body: { error: 'Too many requests' } });
    });

    it('passes the caller through, so the budget is charged per user and not per instance', async () => {
      const linkPreview = vi.fn().mockResolvedValue({ title: 'T', description: null, image: null, url: 'http://x' });
      await new CollabController(svc({ linkPreview } as Partial<CollabService>), storageStub).linkPreview(user, '5', 'http://x');
      expect(linkPreview).toHaveBeenCalledWith('http://x', user.id);
    });

    it('falls back to a null preview when the service throws', async () => {
      const s = svc({ linkPreview: vi.fn().mockRejectedValue(new Error('network')) } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).linkPreview(user, '5', 'http://x')).toEqual({ title: null, description: null, image: null, url: 'http://x' });
    });
  });
});
