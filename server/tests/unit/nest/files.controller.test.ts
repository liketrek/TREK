import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs';

vi.mock('../../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { FilesController } from '../../../src/nest/files/files.controller';
import { FilesDownloadController } from '../../../src/nest/files/files-download.controller';
import { PhotosController } from '../../../src/nest/photos/photos.controller';
import type { FilesService } from '../../../src/nest/files/files.service';
import type { PhotosService } from '../../../src/nest/photos/photos.service';
import { isDemoEmail } from '../../../src/services/demo';
import type { User } from '../../../src/types';

const user = { id: 1, username: 'u', role: 'user', email: 'u@example.test' } as User;

function fsvc(o: Partial<FilesService> = {}): FilesService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue({ user_id: 1 }),
    can: vi.fn().mockReturnValue(true),
    findForeignLinkTarget: vi.fn().mockReturnValue(null),
    broadcast: vi.fn(),
    ...o,
  } as unknown as FilesService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => { delete process.env.DEMO_MODE; });

describe('FilesController (parity with the legacy /api/trips/:tripId/files route)', () => {
  it('GET / 404 without access, else lists with the trash flag', () => {
    expect(thrown(() => new FilesController(fsvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).list(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    const listFiles = vi.fn().mockReturnValue([{ id: 1 }]);
    expect(new FilesController(fsvc({ listFiles } as Partial<FilesService>)).list(user, '5', 'true')).toEqual({ files: [{ id: 1 }] });
    expect(listFiles).toHaveBeenCalledWith('5', true);
  });

  describe('POST / (upload)', () => {
    const file = { filename: 'a.pdf' } as Express.Multer.File;
    it('403 in demo mode for a demo email', () => {
      process.env.DEMO_MODE = 'true';
      vi.mocked(isDemoEmail).mockReturnValue(true);
      expect(thrown(() => new FilesController(fsvc()).upload(user, '5', file, {}))).toEqual({ status: 403, body: { error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.' } });
    });
    it('403 without file_upload, 400 without a file, else creates + broadcasts', () => {
      expect(thrown(() => new FilesController(fsvc({ can: vi.fn().mockReturnValue(false) })).upload(user, '5', file, {}))).toEqual({ status: 403, body: { error: 'No permission to upload files' } });
      expect(thrown(() => new FilesController(fsvc()).upload(user, '5', undefined, {}))).toEqual({ status: 400, body: { error: 'No file uploaded' } });
      const createFile = vi.fn().mockReturnValue({ id: 9 });
      const broadcast = vi.fn();
      const s = fsvc({ createFile, broadcast } as Partial<FilesService>);
      expect(new FilesController(s).upload(user, '5', file, { description: 'd' }, 'sock')).toEqual({ file: { id: 9 } });
      expect(createFile).toHaveBeenCalledWith('5', file, 1, { place_id: undefined, description: 'd', reservation_id: undefined });
      expect(broadcast).toHaveBeenCalledWith('5', 'file:created', { file: { id: 9 } }, 'sock');
    });
  });

  it('PUT /:id 403 without file_edit, 404 unknown, else updates + broadcasts', () => {
    expect(thrown(() => new FilesController(fsvc({ can: vi.fn().mockReturnValue(false) })).update(user, '5', '9', {}))).toEqual({ status: 403, body: { error: 'No permission to edit files' } });
    expect(thrown(() => new FilesController(fsvc({ getFileById: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).update(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'File not found' } });
    const updateFile = vi.fn().mockReturnValue({ id: 9 });
    const s = fsvc({ getFileById: vi.fn().mockReturnValue({ id: 9, description: 'x' }), updateFile, broadcast: vi.fn() } as Partial<FilesService>);
    expect(new FilesController(s).update(user, '5', '9', { description: 'new' })).toEqual({ file: { id: 9 } });
  });

  it('PATCH /:id/star 403/404, else toggles', () => {
    expect(thrown(() => new FilesController(fsvc({ can: vi.fn().mockReturnValue(false) })).star(user, '5', '9'))).toEqual({ status: 403, body: { error: 'No permission' } });
    expect(thrown(() => new FilesController(fsvc({ getFileById: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).star(user, '5', '9'))).toEqual({ status: 404, body: { error: 'File not found' } });
    const toggleStarred = vi.fn().mockReturnValue({ id: 9, starred: 1 });
    const s = fsvc({ getFileById: vi.fn().mockReturnValue({ id: 9, starred: 0 }), toggleStarred, broadcast: vi.fn() } as Partial<FilesService>);
    expect(new FilesController(s).star(user, '5', '9')).toEqual({ file: { id: 9, starred: 1 } });
    expect(toggleStarred).toHaveBeenCalledWith('9', 0);
  });

  it('DELETE /:id soft-delete 403/404, else success', () => {
    expect(thrown(() => new FilesController(fsvc({ can: vi.fn().mockReturnValue(false) })).remove(user, '5', '9'))).toEqual({ status: 403, body: { error: 'No permission to delete files' } });
    expect(thrown(() => new FilesController(fsvc({ getFileById: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'File not found' } });
    const softDeleteFile = vi.fn();
    const broadcast = vi.fn();
    const s = fsvc({ getFileById: vi.fn().mockReturnValue({ id: 9 }), softDeleteFile, broadcast } as Partial<FilesService>);
    expect(new FilesController(s).remove(user, '5', '9', 'sock')).toEqual({ success: true });
    expect(broadcast).toHaveBeenCalledWith('5', 'file:deleted', { fileId: 9 }, 'sock');
  });

  it('POST /:id/restore 404 not in trash, else restores', () => {
    expect(thrown(() => new FilesController(fsvc({ getDeletedFile: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).restore(user, '5', '9'))).toEqual({ status: 404, body: { error: 'File not found in trash' } });
    const restoreFile = vi.fn().mockReturnValue({ id: 9 });
    const s = fsvc({ getDeletedFile: vi.fn().mockReturnValue({ id: 9 }), restoreFile, broadcast: vi.fn() } as Partial<FilesService>);
    expect(new FilesController(s).restore(user, '5', '9')).toEqual({ file: { id: 9 } });
  });

  it('DELETE /:id/permanent 404 not in trash, else deletes', async () => {
    await expect(new FilesController(fsvc({ getDeletedFile: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).permanent(user, '5', '9')).rejects.toBeInstanceOf(HttpException);
    const permanentDeleteFile = vi.fn().mockResolvedValue(undefined);
    const s = fsvc({ getDeletedFile: vi.fn().mockReturnValue({ id: 9 }), permanentDeleteFile, broadcast: vi.fn() } as Partial<FilesService>);
    expect(await new FilesController(s).permanent(user, '5', '9')).toEqual({ success: true });
  });

  it('DELETE /trash/empty 403, else returns the count', async () => {
    await expect(new FilesController(fsvc({ can: vi.fn().mockReturnValue(false) })).emptyTrash(user, '5')).rejects.toBeInstanceOf(HttpException);
    const s = fsvc({ emptyTrash: vi.fn().mockResolvedValue(3) } as Partial<FilesService>);
    expect(await new FilesController(s).emptyTrash(user, '5')).toEqual({ success: true, deleted: 3 });
  });

  it('POST /:id/link 404 unknown file, else links', () => {
    expect(thrown(() => new FilesController(fsvc({ getFileById: vi.fn().mockReturnValue(undefined) } as Partial<FilesService>)).link(user, '5', '9', {}))).toEqual({ status: 404, body: { error: 'File not found' } });
    const createFileLink = vi.fn().mockReturnValue([{ id: 1 }]);
    const s = fsvc({ getFileById: vi.fn().mockReturnValue({ id: 9 }), createFileLink } as Partial<FilesService>);
    expect(new FilesController(s).link(user, '5', '9', { reservation_id: 2 })).toEqual({ success: true, links: [{ id: 1 }] });
  });

  it('DELETE /:id/link/:linkId removes the link; GET /:id/links lists', () => {
    const deleteFileLink = vi.fn();
    expect(new FilesController(fsvc({ deleteFileLink } as Partial<FilesService>)).unlink(user, '5', '9', '3')).toEqual({ success: true });
    expect(deleteFileLink).toHaveBeenCalledWith('3', '9');
    const s = fsvc({ getFileLinks: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<FilesService>);
    expect(new FilesController(s).links(user, '5', '9')).toEqual({ links: [{ id: 1 }] });
  });

  it('the trash + link routes all reject without file_delete / file_edit', async () => {
    const denied = () => fsvc({ can: vi.fn().mockReturnValue(false) });
    await expect(new FilesController(denied()).permanent(user, '5', '9')).rejects.toMatchObject({ status: 403 });
    expect(thrown(() => new FilesController(denied()).restore(user, '5', '9'))).toEqual({ status: 403, body: { error: 'No permission' } });
    expect(thrown(() => new FilesController(denied()).link(user, '5', '9', {}))).toEqual({ status: 403, body: { error: 'No permission' } });
    expect(thrown(() => new FilesController(denied()).unlink(user, '5', '9', '3'))).toEqual({ status: 403, body: { error: 'No permission' } });
  });

  it('GET /:id/links 404 without trip access', () => {
    const s = fsvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => new FilesController(s).links(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });
});

describe('FilesDownloadController', () => {
  function dsvc(o: Partial<FilesService> = {}): FilesService {
    return {
      authenticateDownload: vi.fn().mockReturnValue({ userId: 1 }),
      verifyTripAccess: vi.fn().mockReturnValue({ user_id: 1 }),
      getFileById: vi.fn().mockReturnValue({ filename: 'x.pdf', original_name: 'x.pdf' }),
      resolveFilePath: vi.fn().mockReturnValue({ resolved: 'C:/nope/x.pdf', safe: true }),
      ...o,
    } as unknown as FilesService;
  }
  const req = { headers: {}, query: {} } as Request;
  const res = { setHeader: vi.fn(), sendFile: vi.fn() } as unknown as Response;

  it('maps the auth error from authenticateDownload', () => {
    const s = dsvc({ authenticateDownload: vi.fn().mockReturnValue({ error: 'Authentication required', status: 401 }) });
    expect(thrown(() => new FilesDownloadController(s).download(req, res, '5', '9'))).toEqual({ status: 401, body: { error: 'Authentication required' } });
  });
  it('404 without trip access, 404 unknown file, 403 on an unsafe path', () => {
    expect(thrown(() => new FilesDownloadController(dsvc({ verifyTripAccess: vi.fn().mockReturnValue(undefined) })).download(req, res, '5', '9'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
    expect(thrown(() => new FilesDownloadController(dsvc({ getFileById: vi.fn().mockReturnValue(undefined) })).download(req, res, '5', '9'))).toEqual({ status: 404, body: { error: 'File not found' } });
    expect(thrown(() => new FilesDownloadController(dsvc({ resolveFilePath: vi.fn().mockReturnValue({ resolved: '/x', safe: false }) })).download(req, res, '5', '9'))).toEqual({ status: 403, body: { error: 'Forbidden' } });
  });

  it('404 when the safe path is gone from disk', () => {
    const missing = path.join(os.tmpdir(), `trek-no-such-${Date.now()}.pdf`);
    const s = dsvc({ resolveFilePath: vi.fn().mockReturnValue({ resolved: missing, safe: true }) });
    expect(thrown(() => new FilesDownloadController(s).download(req, res, '5', '9'))).toEqual({ status: 404, body: { error: 'File not found' } });
  });

  it('streams a regular file via sendFile with an explicit root', () => {
    const real = path.join(os.tmpdir(), `trek-dl-${Date.now()}.pdf`);
    fs.writeFileSync(real, 'x');
    try {
      const sendFile = vi.fn();
      const localRes = { setHeader: vi.fn(), sendFile } as unknown as Response;
      const s = dsvc({ resolveFilePath: vi.fn().mockReturnValue({ resolved: real, safe: true }) });
      new FilesDownloadController(s).download(req, localRes, '5', '9');
      expect(sendFile).toHaveBeenCalledWith(path.basename(real), { root: path.dirname(real) });
      expect(localRes.setHeader).not.toHaveBeenCalled();
    } finally {
      fs.unlinkSync(real);
    }
  });

  it('serves a .pkpass inline with the Wallet MIME type and the original name', () => {
    const real = path.join(os.tmpdir(), `trek-pass-${Date.now()}.pkpass`);
    fs.writeFileSync(real, 'x');
    try {
      const setHeader = vi.fn();
      const localRes = { setHeader, sendFile: vi.fn() } as unknown as Response;
      const s = dsvc({
        getFileById: vi.fn().mockReturnValue({ filename: 'pass.pkpass', original_name: 'BoardingPass.pkpass' }),
        resolveFilePath: vi.fn().mockReturnValue({ resolved: real, safe: true }),
      });
      new FilesDownloadController(s).download(req, localRes, '5', '9');
      expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.pkpass');
      expect(setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="BoardingPass.pkpass"');
    } finally {
      fs.unlinkSync(real);
    }
  });

  it('falls back to the resolved basename when a .pkpass has no original name', () => {
    const real = path.join(os.tmpdir(), `trek-pass-${Date.now()}.pkpass`);
    fs.writeFileSync(real, 'x');
    try {
      const setHeader = vi.fn();
      const localRes = { setHeader, sendFile: vi.fn() } as unknown as Response;
      const s = dsvc({
        getFileById: vi.fn().mockReturnValue({ filename: 'pass.pkpass', original_name: null }),
        resolveFilePath: vi.fn().mockReturnValue({ resolved: real, safe: true }),
      });
      new FilesDownloadController(s).download(req, localRes, '5', '9');
      expect(setHeader).toHaveBeenCalledWith('Content-Disposition', `inline; filename="${path.basename(real)}"`);
    } finally {
      fs.unlinkSync(real);
    }
  });
});

describe('PhotosController', () => {
  const user2 = { id: 1 } as User;
  function psvc(o: Partial<PhotosService> = {}): PhotosService {
    return { canAccess: vi.fn().mockReturnValue(true), stream: vi.fn().mockResolvedValue(undefined), info: vi.fn(), ...o } as unknown as PhotosService;
  }
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

  it('400 on a non-finite id, 403 without access', async () => {
    await expect(new PhotosController(psvc()).thumbnail(user2, 'abc', res)).rejects.toMatchObject({ status: 400 });
    await expect(new PhotosController(psvc({ canAccess: vi.fn().mockReturnValue(false) })).original(user2, '5', res)).rejects.toMatchObject({ status: 403 });
  });

  it('streams thumbnail/original', async () => {
    const stream = vi.fn().mockResolvedValue(undefined);
    const c = new PhotosController(psvc({ stream }));
    await c.thumbnail(user2, '5', res);
    expect(stream).toHaveBeenCalledWith(res, 1, 5, 'thumbnail');
    await c.original(user2, '5', res);
    expect(stream).toHaveBeenCalledWith(res, 1, 5, 'original');
  });

  it('info writes the data, maps a service error', async () => {
    const okRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    await new PhotosController(psvc({ info: vi.fn().mockResolvedValue({ data: { id: '5' } }) })).info(user2, '5', okRes);
    expect(okRes.json).toHaveBeenCalledWith({ id: '5' });
    const errRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    await new PhotosController(psvc({ info: vi.fn().mockResolvedValue({ error: { status: 404, message: 'Photo not found' } }) })).info(user2, '5', errRes);
    expect(errRes.status).toHaveBeenCalledWith(404);
    expect(errRes.json).toHaveBeenCalledWith({ error: 'Photo not found' });
  });
});
