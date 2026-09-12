import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { CollabController, collabChatImageFilter, collabNoteFileFilter } from '../../../src/nest/collab/collab.controller';
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
    // Async since the route took its multipart form: it awaits the storage
    // commit, so every case here goes through thrownAsync.
    it('POST 400 whitespace-only, 400 reply_not_found, else creates + notifies (length checks now in the Zod pipe)', async () => {
      // A request with no file part keeps the wording it always had.
      expect(await thrownAsync(() => new CollabController(svc(), storageStub).createMessage(user, '5', { text: '   ' }, undefined)))
        .toEqual({ status: 400, body: { error: 'Message text is required' } });
      expect(await thrownAsync(() => new CollabController(svc(), storageStub).createMessage(user, '5', { text: '   ' }, [])))
        .toEqual({ status: 400, body: { error: 'Message text or image is required' } });
      expect(await thrownAsync(() => new CollabController(svc({ createMessage: vi.fn().mockReturnValue({ error: 'reply_not_found' }) } as Partial<CollabService>), storageStub).createMessage(user, '5', { text: 'hi', reply_to: 99 }, undefined)))
        .toEqual({ status: 400, body: { error: 'Reply target message not found' } });
      const broadcast = vi.fn();
      const notifyCollab = vi.fn();
      const s = svc({ createMessage: vi.fn().mockReturnValue({ message: { id: 3 } }), broadcast, notifyCollab } as Partial<CollabService>);
      expect(await new CollabController(s, storageStub).createMessage(user, '5', { text: 'hello' }, undefined, 'sock')).toEqual({ message: { id: 3 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:created', { message: { id: 3 } }, 'sock');
      expect(notifyCollab).toHaveBeenCalledWith('5', user, 'hello');
    });

    it('refuses a caller who cannot reach the trip or cannot write, from inside the handler', async () => {
      // The decorators had to go because of the multipart body, so these two
      // refusals are the only thing standing in front of the route now.
      expect(await thrownAsync(() => new CollabController(svc({ verifyTripAccess: vi.fn().mockReturnValue(null) } as Partial<CollabService>), storageStub).createMessage(user, '5', { text: 'hi' }, undefined)))
        .toEqual({ status: 404, body: { error: 'Trip not found' } });
      expect(await thrownAsync(() => new CollabController(svc({ canEdit: vi.fn().mockReturnValue(false) } as Partial<CollabService>), storageStub).createMessage(user, '5', { text: 'hi' }, undefined)))
        .toEqual({ status: 403, body: { error: 'No permission' } });
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
  describe('chat images on a message', () => {
    const img = (name: string) => ({ filename: `stored-${name}`, originalname: name, size: 10, mimetype: 'image/png', path: `/tmp/${name}` }) as never;

    it('commits every image to storage and hands the service what it needs to row them', async () => {
      const put = vi.fn().mockResolvedValue(undefined);
      const createMessage = vi.fn().mockReturnValue({ message: { id: 3 } });
      const s = svc({ createMessage, broadcast: vi.fn(), notifyCollab: vi.fn() } as Partial<CollabService>);
      await new CollabController(s, { put, delete: vi.fn() } as never).createMessage(user, '5', { text: 'look' }, [img('a.png'), img('b.png')]);

      expect(put.mock.calls.map(c => c[1])).toEqual(['stored-a.png', 'stored-b.png']);
      expect(createMessage.mock.calls[0][4]).toEqual([
        { filename: 'stored-a.png', originalname: 'a.png', size: 10, mimetype: 'image/png' },
        { filename: 'stored-b.png', originalname: 'b.png', size: 10, mimetype: 'image/png' },
      ]);
    });

    it('takes back what it already committed when a later image fails to store', async () => {
      const del = vi.fn().mockResolvedValue(undefined);
      const put = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('disk full'));
      const createMessage = vi.fn();
      const s = svc({ createMessage } as Partial<CollabService>);

      await expect(new CollabController(s, { put, delete: del } as never).createMessage(user, '5', { text: 'x' }, [img('a.png'), img('b.png')]))
        .rejects.toThrow('disk full');
      // The first one is already in storage and has to come back out; the
      // message row was never written, so nothing would point at it.
      expect(del.mock.calls.map(c => c[1])).toEqual(['stored-a.png']);
      expect(createMessage).not.toHaveBeenCalled();
    });

    it('drops the stored images again when the reply target turns out to be gone', async () => {
      const del = vi.fn().mockResolvedValue(undefined);
      const s = svc({ createMessage: vi.fn().mockReturnValue({ error: 'reply_not_found' }) } as Partial<CollabService>);

      expect(await thrownAsync(() => new CollabController(s, { put: vi.fn().mockResolvedValue(undefined), delete: del } as never)
        .createMessage(user, '5', { text: 'x', reply_to: 99 }, [img('a.png')])))
        .toEqual({ status: 400, body: { error: 'Reply target message not found' } });
      expect(del.mock.calls.map(c => c[1])).toEqual(['stored-a.png']);
    });

    it('refuses an image from someone who may write but may not upload', async () => {
      const put = vi.fn();
      const s = svc({ canUploadFiles: vi.fn().mockReturnValue(false) } as Partial<CollabService>);
      expect(await thrownAsync(() => new CollabController(s, { put, delete: vi.fn() } as never).createMessage(user, '5', { text: 'x' }, [img('a.png')])))
        .toEqual({ status: 403, body: { error: 'No permission to upload files' } });
      expect(put).not.toHaveBeenCalled();
    });
  });

  describe('note file filter', () => {
    const run = (originalname: string, mimetype: string) => {
      let outcome: { err: Error | null; ok?: boolean } = { err: null };
      collabNoteFileFilter!({} as never, { originalname, mimetype } as never, ((err: Error | null, ok?: boolean) => { outcome = { err, ok }; }) as never);
      return outcome;
    };

    it('takes an ordinary attachment', () => {
      expect(run('itinerary.pdf', 'application/pdf').ok).toBe(true);
    });

    it('refuses the spellings the download route would serve as a document', () => {
      expect(run('pwn.html', 'text/html').err).toBeInstanceOf(Error);
      expect(run('pwn.txt', 'image/svg+xml').err).toBeInstanceOf(Error);
      expect(run('pwn.txt', 'application/javascript').err).toBeInstanceOf(Error);
    });
  });

  describe('chat image filter', () => {
    const run = (originalname: string, mimetype: string) => {
      let outcome: { err: Error | null; ok?: boolean } = { err: null };
      collabChatImageFilter!({} as never, { originalname, mimetype } as never, ((err: Error | null, ok?: boolean) => { outcome = { err, ok }; }) as never);
      return outcome;
    };

    it('accepts a real image', () => {
      expect(run('holiday.jpg', 'image/jpeg').ok).toBe(true);
      expect(run('map.PNG', 'image/png').ok).toBe(true);
    });

    it('refuses a type it does not serve', () => {
      expect(run('notes.pdf', 'application/pdf').err).toBeInstanceOf(Error);
    });

    it('refuses a name whose extension disagrees with the type it claims', () => {
      // The mimetype is the header the client wrote. The stored name keeps the
      // extension of the name the client sent, and the download route decides
      // what to serve from that extension and sends it inline, so believing the
      // header alone served attacker HTML on our own origin.
      for (const name of ['pwn.html', 'pwn.svg', 'pwn.js', 'pwn.htm', 'pwn']) {
        const out = run(name, 'image/png');
        expect(out.err, name).toBeInstanceOf(Error);
        expect((out.err as Error & { statusCode?: number }).statusCode).toBe(400);
      }
    });
  });

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
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, CollabController.prototype.createNote)).toBe('collab_edit');
    });

    it('the multipart write routes carry no guard decorators, and check inside instead', () => {
      // Guards run before the interceptor, so a refusal goes out while the client
      // is still streaming the body and the socket dies as ECONNRESET rather than
      // carrying the error envelope. Both of these therefore look unguarded here
      // and do requireTrip plus the permission check in the handler; the test
      // below proves createMessage actually refuses.
      for (const handler of [CollabController.prototype.createMessage, CollabController.prototype.addNoteFile]) {
        expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBeUndefined();
        expect(guardsOn(handler)).not.toContain(TripAccessGuard);
      }
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
