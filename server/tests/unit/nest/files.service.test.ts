import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';

// Mock the side-effect dependencies the wrapper reaches into directly.
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn(() => true) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { svc } = vi.hoisted(() => ({
  svc: {
    verifyTripAccess: vi.fn(),
    authenticateDownload: vi.fn(),
    resolveFilePath: vi.fn(),
    listFiles: vi.fn(),
    getFileById: vi.fn(),
    getDeletedFile: vi.fn(),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    toggleStarred: vi.fn(),
    softDeleteFile: vi.fn(),
    restoreFile: vi.fn(),
    permanentDeleteFile: vi.fn(),
    emptyTrash: vi.fn(),
    createFileLink: vi.fn(),
    deleteFileLink: vi.fn(),
    getFileLinks: vi.fn(),
  },
}));
vi.mock('../../../src/services/fileService', () => svc);

import { FilesService } from '../../../src/nest/files/files.service';
import type { User } from '../../../src/types';

function service() {
  return new FilesService();
}

beforeEach(() => vi.clearAllMocks());

describe('FilesService (thin wrapper around the legacy fileService)', () => {
  it('verifyTripAccess delegates to the legacy service', () => {
    svc.verifyTripAccess.mockReturnValue({ id: 5, user_id: 2 });
    expect(service().verifyTripAccess('5', 2)).toEqual({ id: 5, user_id: 2 });
    expect(svc.verifyTripAccess).toHaveBeenCalledWith('5', 2);
  });

  it('can forwards the ownership flag when the user owns the trip', () => {
    checkPermission.mockReturnValue(true);
    const user = { id: 1, role: 'user' } as User;
    expect(service().can('file_edit', { user_id: 1 } as never, user)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('file_edit', 'user', 1, 1, false);
  });

  it('can marks the user as a guest when they do not own the trip', () => {
    checkPermission.mockReturnValue(false);
    const user = { id: 1, role: 'user' } as User;
    expect(service().can('file_upload', { user_id: 2 } as never, user)).toBe(false);
    expect(checkPermission).toHaveBeenCalledWith('file_upload', 'user', 2, 1, true);
  });

  it('broadcast forwards to the websocket helper', () => {
    service().broadcast('5', 'file:created', { file: { id: 1 } }, 'sock');
    expect(broadcast).toHaveBeenCalledWith('5', 'file:created', { file: { id: 1 } }, 'sock');
  });

  it('authenticateDownload / resolveFilePath delegate', () => {
    const req = { headers: {} } as Request;
    svc.authenticateDownload.mockReturnValue({ userId: 7 });
    expect(service().authenticateDownload(req)).toEqual({ userId: 7 });
    expect(svc.authenticateDownload).toHaveBeenCalledWith(req);

    svc.resolveFilePath.mockReturnValue({ resolved: '/a/b.pdf', safe: true });
    expect(service().resolveFilePath('b.pdf')).toEqual({ resolved: '/a/b.pdf', safe: true });
    expect(svc.resolveFilePath).toHaveBeenCalledWith('b.pdf');
  });

  it('the read helpers delegate', () => {
    svc.listFiles.mockReturnValue([{ id: 1 }]);
    expect(service().listFiles('5', true)).toEqual([{ id: 1 }]);
    expect(svc.listFiles).toHaveBeenCalledWith('5', true);

    svc.getFileById.mockReturnValue({ id: 9 });
    expect(service().getFileById('9', '5')).toEqual({ id: 9 });
    expect(svc.getFileById).toHaveBeenCalledWith('9', '5');

    svc.getDeletedFile.mockReturnValue({ id: 9 });
    expect(service().getDeletedFile('9', '5')).toEqual({ id: 9 });
    expect(svc.getDeletedFile).toHaveBeenCalledWith('9', '5');

    svc.getFileLinks.mockReturnValue([{ id: 1 }]);
    expect(service().getFileLinks('9')).toEqual([{ id: 1 }]);
    expect(svc.getFileLinks).toHaveBeenCalledWith('9');
  });

  it('the mutating helpers delegate', () => {
    const file = { filename: 'a.pdf' } as Express.Multer.File;
    svc.createFile.mockReturnValue({ id: 9 });
    expect(service().createFile('5', file, 1, { description: 'd' })).toEqual({ id: 9 });
    expect(svc.createFile).toHaveBeenCalledWith('5', file, 1, { description: 'd' });

    svc.updateFile.mockReturnValue({ id: 9 });
    const current = { id: 9 } as never;
    expect(service().updateFile('9', current, { description: 'x' })).toEqual({ id: 9 });
    expect(svc.updateFile).toHaveBeenCalledWith('9', current, { description: 'x' });

    svc.toggleStarred.mockReturnValue({ id: 9, starred: 1 });
    expect(service().toggleStarred('9', 0)).toEqual({ id: 9, starred: 1 });
    expect(svc.toggleStarred).toHaveBeenCalledWith('9', 0);

    service().softDeleteFile('9');
    expect(svc.softDeleteFile).toHaveBeenCalledWith('9');

    svc.restoreFile.mockReturnValue({ id: 9 });
    expect(service().restoreFile('9')).toEqual({ id: 9 });
    expect(svc.restoreFile).toHaveBeenCalledWith('9');

    const trashed = { id: 9 } as never;
    service().permanentDeleteFile(trashed);
    expect(svc.permanentDeleteFile).toHaveBeenCalledWith(trashed);

    svc.emptyTrash.mockReturnValue(3);
    expect(service().emptyTrash('5')).toBe(3);
    expect(svc.emptyTrash).toHaveBeenCalledWith('5');

    svc.createFileLink.mockReturnValue([{ id: 1 }]);
    expect(service().createFileLink('9', { reservation_id: 2 })).toEqual([{ id: 1 }]);
    expect(svc.createFileLink).toHaveBeenCalledWith('9', { reservation_id: 2 });

    service().deleteFileLink('3', '9');
    expect(svc.deleteFileLink).toHaveBeenCalledWith('3', '9');
  });
});
