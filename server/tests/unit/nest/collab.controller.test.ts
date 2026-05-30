import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

import { CollabController } from '../../../src/nest/collab/collab.controller';
import type { CollabService } from '../../../src/nest/collab/collab.service';
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
    it('GET 404 without access, else lists', () => {
      expect(thrown(() => new CollabController(svc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).listNotes(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
      const s = svc({ listNotes: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<CollabService>);
      expect(new CollabController(s).listNotes(user, '5')).toEqual({ notes: [{ id: 1 }] });
    });

    it('POST 403 without collab_edit, 400 without title, else creates + broadcasts + notifies', () => {
      expect(thrown(() => new CollabController(svc({ canEdit: vi.fn().mockReturnValue(false) })).createNote(user, '5', { title: 'T' }))).toEqual({ status: 403, body: { error: 'No permission' } });
      expect(thrown(() => new CollabController(svc()).createNote(user, '5', {}))).toEqual({ status: 400, body: { error: 'Title is required' } });
      const createNote = vi.fn().mockReturnValue({ id: 9 });
      const broadcast = vi.fn();
      const notifyCollab = vi.fn();
      const s = svc({ createNote, broadcast, notifyCollab } as Partial<CollabService>);
      expect(new CollabController(s).createNote(user, '5', { title: 'T', content: 'c' }, 'sock')).toEqual({ note: { id: 9 } });
      expect(createNote).toHaveBeenCalledWith('5', 1, { title: 'T', content: 'c', category: undefined, color: undefined, website: undefined });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:created', { note: { id: 9 } }, 'sock');
      expect(notifyCollab).toHaveBeenCalledWith('5', user);
    });

    it('PUT 404 when missing, else updates + broadcasts', () => {
      expect(thrown(() => new CollabController(svc({ updateNote: vi.fn().mockReturnValue(null) } as Partial<CollabService>)).updateNote(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ updateNote: vi.fn().mockReturnValue({ id: 9 }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).updateNote(user, '5', '9', { title: 'b' }, 'sock')).toEqual({ note: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:updated', { note: { id: 9 } }, 'sock');
    });

    it('DELETE 404 when missing, else success + broadcasts', () => {
      expect(thrown(() => new CollabController(svc({ deleteNote: vi.fn().mockReturnValue(false) } as Partial<CollabService>)).deleteNote(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ deleteNote: vi.fn().mockReturnValue(true), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).deleteNote(user, '5', '9', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:deleted', { noteId: 9 }, 'sock');
    });
  });

  describe('note files', () => {
    const file = { filename: 'a.pdf' } as Express.Multer.File;
    it('403 without file_upload, 400 without file, 404 unknown note, else returns result', () => {
      expect(thrown(() => new CollabController(svc({ canUploadFiles: vi.fn().mockReturnValue(false) })).addNoteFile(user, '5', '9', file))).toEqual({ status: 403, body: { error: 'No permission to upload files' } });
      expect(thrown(() => new CollabController(svc()).addNoteFile(user, '5', '9', undefined))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
      expect(thrown(() => new CollabController(svc({ addNoteFile: vi.fn().mockReturnValue(null) } as Partial<CollabService>)).addNoteFile(user, '5', '9', file))).toEqual({ status: 404, body: { error: 'Note not found' } });
      const broadcast = vi.fn();
      const s = svc({ addNoteFile: vi.fn().mockReturnValue({ file: { id: 3 } }), getFormattedNoteById: vi.fn().mockReturnValue({ id: 9 }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).addNoteFile(user, '5', '9', file, 'sock')).toEqual({ file: { id: 3 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:note:updated', { note: { id: 9 } }, 'sock');
    });

    it('DELETE file 404 when missing, else success', () => {
      expect(thrown(() => new CollabController(svc({ deleteNoteFile: vi.fn().mockReturnValue(false) } as Partial<CollabService>)).deleteNoteFile(user, '5', '9', '3'))).toEqual({ status: 404, body: { error: 'File not found' } });
      const s = svc({ deleteNoteFile: vi.fn().mockReturnValue(true), getFormattedNoteById: vi.fn().mockReturnValue({ id: 9 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s).deleteNoteFile(user, '5', '9', '3')).toEqual({ success: true });
    });
  });

  describe('polls', () => {
    it('POST 400 without question / <2 options, else creates', () => {
      expect(thrown(() => new CollabController(svc()).createPoll(user, '5', {}))).toEqual({ status: 400, body: { error: 'Question is required' } });
      expect(thrown(() => new CollabController(svc()).createPoll(user, '5', { question: 'q', options: ['only'] }))).toEqual({ status: 400, body: { error: 'At least 2 options are required' } });
      const s = svc({ createPoll: vi.fn().mockReturnValue({ id: 7 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s).createPoll(user, '5', { question: 'q', options: ['a', 'b'] })).toEqual({ poll: { id: 7 } });
    });

    it('vote maps not_found/closed/invalid_index, else broadcasts the poll', () => {
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'not_found' }) } as Partial<CollabService>)).votePoll(user, '5', '7', 0))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'closed' }) } as Partial<CollabService>)).votePoll(user, '5', '7', 0))).toEqual({ status: 400, body: { error: 'Poll is closed' } });
      expect(thrown(() => new CollabController(svc({ votePoll: vi.fn().mockReturnValue({ error: 'invalid_index' }) } as Partial<CollabService>)).votePoll(user, '5', '7', 9))).toEqual({ status: 400, body: { error: 'Invalid option index' } });
      const broadcast = vi.fn();
      const s = svc({ votePoll: vi.fn().mockReturnValue({ poll: { id: 7 } }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).votePoll(user, '5', '7', 0, 'sock')).toEqual({ poll: { id: 7 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:poll:voted', { poll: { id: 7 } }, 'sock');
    });

    it('close 404 when missing, else broadcasts', () => {
      expect(thrown(() => new CollabController(svc({ closePoll: vi.fn().mockReturnValue(null) } as Partial<CollabService>)).closePoll(user, '5', '7'))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      const s = svc({ closePoll: vi.fn().mockReturnValue({ id: 7 }), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s).closePoll(user, '5', '7')).toEqual({ poll: { id: 7 } });
    });

    it('delete 404 when missing, else success', () => {
      expect(thrown(() => new CollabController(svc({ deletePoll: vi.fn().mockReturnValue(false) } as Partial<CollabService>)).deletePoll(user, '5', '7'))).toEqual({ status: 404, body: { error: 'Poll not found' } });
      const s = svc({ deletePoll: vi.fn().mockReturnValue(true), broadcast: vi.fn() } as Partial<CollabService>);
      expect(new CollabController(s).deletePoll(user, '5', '7')).toEqual({ success: true });
    });
  });

  describe('messages', () => {
    it('POST 400 over 5000 chars (before access), 400 empty, 400 reply_not_found, else creates + notifies', () => {
      expect(thrown(() => new CollabController(svc()).createMessage(user, '5', { text: 'x'.repeat(5001) }))).toEqual({ status: 400, body: { error: 'text must be 5000 characters or less' } });
      expect(thrown(() => new CollabController(svc()).createMessage(user, '5', { text: '   ' }))).toEqual({ status: 400, body: { error: 'Message text is required' } });
      expect(thrown(() => new CollabController(svc({ createMessage: vi.fn().mockReturnValue({ error: 'reply_not_found' }) } as Partial<CollabService>)).createMessage(user, '5', { text: 'hi', reply_to: 99 }))).toEqual({ status: 400, body: { error: 'Reply target message not found' } });
      const broadcast = vi.fn();
      const notifyCollab = vi.fn();
      const s = svc({ createMessage: vi.fn().mockReturnValue({ message: { id: 3 } }), broadcast, notifyCollab } as Partial<CollabService>);
      expect(new CollabController(s).createMessage(user, '5', { text: 'hello' }, 'sock')).toEqual({ message: { id: 3 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:created', { message: { id: 3 } }, 'sock');
      expect(notifyCollab).toHaveBeenCalledWith('5', user, 'hello');
    });

    it('react 400 without emoji, 404 unknown, else broadcasts reactions', () => {
      expect(thrown(() => new CollabController(svc()).react(user, '5', '3', ''))).toEqual({ status: 400, body: { error: 'Emoji is required' } });
      expect(thrown(() => new CollabController(svc({ reactMessage: vi.fn().mockReturnValue({ found: false, reactions: [] }) } as Partial<CollabService>)).react(user, '5', '3', '👍'))).toEqual({ status: 404, body: { error: 'Message not found' } });
      const broadcast = vi.fn();
      const s = svc({ reactMessage: vi.fn().mockReturnValue({ found: true, reactions: [{ emoji: '👍', count: 1 }] }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).react(user, '5', '3', '👍', 'sock')).toEqual({ reactions: [{ emoji: '👍', count: 1 }] });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:reacted', { messageId: 3, reactions: [{ emoji: '👍', count: 1 }] }, 'sock');
    });

    it('delete maps not_found (404) / not_owner (403), else success with username', () => {
      expect(thrown(() => new CollabController(svc({ deleteMessage: vi.fn().mockReturnValue({ error: 'not_found' }) } as Partial<CollabService>)).deleteMessage(user, '5', '3'))).toEqual({ status: 404, body: { error: 'Message not found' } });
      expect(thrown(() => new CollabController(svc({ deleteMessage: vi.fn().mockReturnValue({ error: 'not_owner' }) } as Partial<CollabService>)).deleteMessage(user, '5', '3'))).toEqual({ status: 403, body: { error: 'You can only delete your own messages' } });
      const broadcast = vi.fn();
      const s = svc({ deleteMessage: vi.fn().mockReturnValue({ username: 'bob' }), broadcast } as Partial<CollabService>);
      expect(new CollabController(s).deleteMessage(user, '5', '3', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'collab:message:deleted', { messageId: 3, username: 'bob' }, 'sock');
    });
  });

  describe('link preview', () => {
    it('400 without url, maps an error result to 400, else returns the preview', async () => {
      expect(await thrownAsync(() => new CollabController(svc()).linkPreview(user, '5', undefined))).toEqual({ status: 400, body: { error: 'URL is required' } });
      expect(await thrownAsync(() => new CollabController(svc({ linkPreview: vi.fn().mockResolvedValue({ error: 'bad url' }) } as Partial<CollabService>)).linkPreview(user, '5', 'http://x'))).toEqual({ status: 400, body: { error: 'bad url' } });
      const s = svc({ linkPreview: vi.fn().mockResolvedValue({ title: 'T', description: null, image: null, url: 'http://x' }) } as Partial<CollabService>);
      expect(await new CollabController(s).linkPreview(user, '5', 'http://x')).toEqual({ title: 'T', description: null, image: null, url: 'http://x' });
    });

    it('falls back to a null preview when the service throws', async () => {
      const s = svc({ linkPreview: vi.fn().mockRejectedValue(new Error('network')) } as Partial<CollabService>);
      expect(await new CollabController(s).linkPreview(user, '5', 'http://x')).toEqual({ title: null, description: null, image: null, url: 'http://x' });
    });
  });
});
