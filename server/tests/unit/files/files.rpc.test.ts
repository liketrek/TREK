/**
 * The file plugin surface after it moved onto @PluginMethod.
 *
 * Files are the only plugin surface with three separate rights (one per write
 * operation), and both its byte-paths — read and write — go through the storage
 * layer rather than touching disk directly. The cases here lean on the upload
 * path: the extension blocklist, the size cap, the demo-mode refusal, that each
 * operation asks for its own permission rather than one shared domain action, and
 * that a create pins the validate -> put -> insert -> broadcast order so a failed
 * put can never leave a DB row pointing at missing bytes.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { Readable } from 'node:stream';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { FilesRpc } from '../../../src/nest/files/files.rpc';
import { FilesModule } from '../../../src/nest/files/files.module';
import { FilesService } from '../../../src/nest/files/files.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import { StorageNotFoundError, StorageInvalidKeyError } from '../../../src/nest/storage/storage.types';
import type { RpcRequest, RpcError, RpcResponse } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

const b64 = (s: string) => Buffer.from(s).toString('base64');

/** File 2 sits on trip 1, which belongs to user 42. */
function build(opts: { file?: Record<string, unknown> | undefined; foreign?: string | null; allow?: (a: string) => boolean } = {}) {
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const files = {
    listFiles: vi.fn(() => [{ id: 2, filename: 'visa.pdf' }]),
    getFileById: vi.fn((id: number) =>
      id === 2 ? (opts.file ?? { filename: 'visa.pdf', original_name: 'visa.pdf', mime_type: 'application/pdf', file_size: 2, deleted_at: null }) : undefined,
    ),
    findForeignLinkTarget: vi.fn(() => opts.foreign ?? null),
    createFile: vi.fn((_t: number, meta: Record<string, unknown>) => ({ id: 130, ...meta })),
    createFileLink: vi.fn(() => [{ file_id: 2 }]),
    updateFile: vi.fn((id: number) => ({ id })),
    softDeleteFile: vi.fn(),
  } as unknown as FilesService & Record<string, ReturnType<typeof vi.fn>>;
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user', email: 'real@example.test' }) })),
  } as unknown as DatabaseService;
  const permissions = {
    checkPermission: vi.fn((action: string) => (opts.allow ? opts.allow(action) : true)),
  } as unknown as PermissionsService;
  const guards = new PluginGuards(db, permissions, { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService);
  const storage = {
    getStream: vi.fn(async () => ({
      stream: Readable.from(Buffer.from('hi')),
      stat: { key: 'visa.pdf', size: 2, mtimeMs: 0 },
    })),
    put: vi.fn(async () => undefined),
  } as unknown as StorageService & Record<string, ReturnType<typeof vi.fn>>;
  // readContent moved onto FilesService (the MCP read tool obeys the same cap and
  // the same storage rules), and the RPC only maps its refusals onto the two wire
  // error types. Bind the real implementation onto this double so the cases below
  // keep exercising that code rather than a stub of it.
  (files as unknown as { readContent: FilesService['readContent'] }).readContent =
    FilesService.prototype.readContent.bind({ getFileById: files.getFileById, storage } as unknown as FilesService);
  const rpc = new FilesRpc(files, realtime, db, guards, storage);
  const host = (...grants: string[]) => new PluginRpcHost('p', new Set(grants), makeDeps(), createTestPluginRegistry([rpc]));
  return { files, realtime, permissions, storage, host };
}

describe('FilesRpc reads', () => {
  it('FILES-RPC-001 files.list is membership-checked and excludes the trash', async () => {
    const f = build();
    const host = f.host('db:read:files');
    expect((await host.dispatch(req('files.list', { tripId: 1 }), 42)).ok).toBe(true);
    expect(f.files.listFiles).toHaveBeenCalledWith(1, false);
    expect(((await host.dispatch(req('files.list', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('FILES-RPC-002 reading BYTES is a separate grant from reading metadata', async () => {
    const f = build();
    // db:read:files alone must not unlock the content.
    const denied = (await f.host('db:read:files').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(denied.error.code).toBe('PERMISSION_DENIED');
    const ok = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcResponse;
    expect(ok.ok).toBe(true);
    expect(ok.result).toMatchObject({ name: 'visa.pdf', mimetype: 'application/pdf', content_base64: b64('hi') });
  });

  it('FILES-RPC-003 a trashed file is refused like the download path', async () => {
    const f = build({ file: { filename: 'visa.pdf', original_name: 'visa.pdf', mime_type: null, file_size: 2, deleted_at: '2027-01-01' } });
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.message).toBe('no file 2 on trip 1');
  });

  it('FILES-RPC-004 the size is capped BEFORE the read, not after', async () => {
    const f = build({ file: { filename: 'visa.pdf', original_name: 'visa.pdf', mime_type: null, file_size: 400 * 1024 * 1024, deleted_at: null } });
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    // The storage layer is never even asked for an oversized file.
    expect(f.storage.getStream).not.toHaveBeenCalled();
  });

  it('FILES-RPC-005 a missing storage object gets the accessibility envelope, not a raw error', async () => {
    const f = build();
    (f.storage.getStream as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new StorageNotFoundError('files/visa.pdf'));
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.message).toBe('file path is not accessible');
  });

  it('FILES-RPC-005d an invalid storage key gets the accessibility envelope, not a raw error', async () => {
    const f = build();
    (f.storage.getStream as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new StorageInvalidKeyError('..'));
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.message).toBe('file path is not accessible');
  });

  it('FILES-RPC-005e an unexpected storage failure keeps its own taxonomy', async () => {
    const f = build();
    // Only the two storage errors become an accessibility refusal; a backend
    // outage must not be reported to the plugin as a missing file.
    (f.storage.getStream as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('backend down'));
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.code).toBe('HOST_ERROR');
  });

  it('FILES-RPC-005b an object whose stat exceeds the cap is refused before buffering', async () => {
    const f = build();
    const stream = Readable.from(Buffer.from('hi'));
    (f.storage.getStream as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      stream, stat: { key: 'visa.pdf', size: 11 * 1024 * 1024, mtimeMs: 0 },
    });
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe('file too large to read (>10485760 bytes); use the download UI');
    expect(stream.destroyed).toBe(true);
  });

  it('FILES-RPC-005c a stream that outgrows its stat is aborted mid-read', async () => {
    const f = build();
    // stat claims 2 bytes; the stream actually yields 10MB+1 — a lying driver
    // must not push an oversized payload through the IPC pipe.
    const big = Readable.from([Buffer.alloc(6 * 1024 * 1024), Buffer.alloc(6 * 1024 * 1024)]);
    (f.storage.getStream as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      stream: big, stat: { key: 'visa.pdf', size: 2, mtimeMs: 0 },
    });
    const res = (await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42)) as RpcError;
    expect(res.error.message).toBe('file too large to read');
    expect(big.destroyed).toBe(true);
  });
});

describe('FilesRpc writes', () => {
  it('FILES-RPC-006 each operation asks for its own right', async () => {
    const seen: string[] = [];
    const f = build({ allow: (a) => { seen.push(a); return true; } });
    const host = f.host('db:write:files');
    await host.dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x') } }), 42);
    await host.dispatch(req('files.update', { tripId: 1, fileId: 2, input: {} }), 42);
    await host.dispatch(req('files.softDelete', { tripId: 1, fileId: 2 }), 42);
    expect(seen).toEqual(['file_upload', 'file_edit', 'file_delete']);
  });

  it('FILES-RPC-007 a blocked extension never reaches disk', async () => {
    const f = build();
    const res = (await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'evil.exe', content_base64: b64('MZ') } }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe("file extension '.exe' is not allowed");
    expect(f.files.createFile).not.toHaveBeenCalled();
  });

  it('FILES-RPC-008 a file with no extension at all is refused', async () => {
    const f = build();
    const res = (await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'README', content_base64: b64('x') } }), 42)) as RpcError;
    expect(res.error.message).toBe("file extension '(none)' is not allowed");
  });

  it('FILES-RPC-009 name and content are required, and the name is length-capped', async () => {
    const f = build();
    const host = f.host('db:write:files');
    const bad = async (input: Record<string, unknown>) => ((await host.dispatch(req('files.create', { tripId: 1, input }), 42)) as RpcError).error.message;
    expect(await bad({ content_base64: b64('x') })).toBe('file name is required (max 255 chars)');
    expect(await bad({ name: 'x'.repeat(256), content_base64: b64('x') })).toBe('file name is required (max 255 chars)');
    expect(await bad({ name: 'a.pdf' })).toBe('content_base64 is required');
    expect(await bad({ name: 'a.pdf', content_base64: '' })).toBe('content_base64 is required');
  });

  it('FILES-RPC-010 an oversized payload is rejected on its ENCODED length', async () => {
    const f = build();
    const res = (await f.host('db:write:files').dispatch(
      req('files.create', { tripId: 1, input: { name: 'big.pdf', content_base64: 'A'.repeat(15 * 1024 * 1024) } }), 42,
    )) as RpcError;
    expect(res.error.message).toBe('file exceeds the 10MB plugin upload cap');
  });

  it('FILES-RPC-011 empty decoded content is refused', async () => {
    const f = build();
    const res = (await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: '====' } }), 42)) as RpcError;
    expect(res.error.message).toBe('file content is empty');
  });

  it('FILES-RPC-012 a link target on another trip is refused, for create and update alike', async () => {
    const f = build({ foreign: 'reservation 9' });
    const host = f.host('db:write:files');
    const created = (await host.dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x'), reservation_id: 9 } }), 42)) as RpcError;
    expect(created.error.message).toBe('reservation 9 does not belong to trip 1');
    const updated = (await host.dispatch(req('files.update', { tripId: 1, fileId: 2, input: { reservation_id: 9 } }), 42)) as RpcError;
    expect(updated.error.message).toBe('reservation 9 does not belong to trip 1');
  });

  it('FILES-RPC-013 update tells null from undefined, so a link can be cleared', async () => {
    const f = build();
    const host = f.host('db:write:files');
    await host.dispatch(req('files.update', { tripId: 1, fileId: 2, input: { place_id: null } }), 42);
    expect(f.files.updateFile).toHaveBeenLastCalledWith(2, expect.anything(), expect.objectContaining({ place_id: null }));
    await host.dispatch(req('files.update', { tripId: 1, fileId: 2, input: { description: 'x' } }), 42);
    expect(f.files.updateFile).toHaveBeenLastCalledWith(2, expect.anything(), expect.objectContaining({ place_id: undefined }));
  });

  it('FILES-RPC-014 a missing file is RESOURCE_FORBIDDEN across every write', async () => {
    const f = build();
    const host = f.host('db:write:files');
    for (const [method, params] of [
      ['files.createLink', { tripId: 1, fileId: 404, opts: {} }],
      ['files.update', { tripId: 1, fileId: 404, input: {} }],
      ['files.softDelete', { tripId: 1, fileId: 404 }],
    ] as const) {
      const res = (await host.dispatch(req(method, params), 42)) as RpcError;
      expect(res.error.message).toBe('no file 404 on trip 1');
    }
  });

  it('FILES-RPC-015 a userless write is refused before anything else happens', async () => {
    const f = build();
    const res = (await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x') } }), undefined)) as RpcError;
    expect(res.error.message).toBe('file writes require an authenticated user context');
    expect(f.files.createFile).not.toHaveBeenCalled();
  });

  it('FILES-RPC-016 a successful write broadcasts, a refused one does not', async () => {
    const f = build();
    const host = f.host('db:write:files');
    await host.dispatch(req('files.softDelete', { tripId: 1, fileId: 2 }), 42);
    expect(f.realtime.broadcast).toHaveBeenCalledWith(1, 'file:deleted', { fileId: 2 }, undefined);
    f.realtime.broadcast.mockClear();
    await host.dispatch(req('files.softDelete', { tripId: 1, fileId: 404 }), 42);
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('FILES-RPC-016b a demo account cannot upload while demo mode is on, other members can', async () => {
    const prev = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'true';
    try {
      const f = build();
      // The demo guard resolves the uploader's email; user 9 is the demo account.
      const db = {
        canAccessTrip: vi.fn(() => ({ id: 1, user_id: 42 })),
        prepare: vi.fn(() => ({ get: (id: number) => (id === 9 ? { role: 'user', email: 'demo@trek.app' } : { role: 'user', email: 'real@example.test' }) })),
      } as unknown as DatabaseService;
      const guards = new PluginGuards(
        db,
        { checkPermission: vi.fn(() => true) } as unknown as PermissionsService,
        { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
      );
      const files = {
        findForeignLinkTarget: vi.fn(() => null),
        createFile: vi.fn(() => ({ id: 130 })),
      } as unknown as FilesService;
      const storage = { getStream: vi.fn(), put: vi.fn(async () => undefined) } as unknown as StorageService;
      const rpc = new FilesRpc(files, { broadcast: vi.fn() } as unknown as RealtimeService, db, guards, storage);
      const host = new PluginRpcHost('p', new Set(['db:write:files']), makeDeps(), createTestPluginRegistry([rpc]));
      const input = { name: 'a.pdf', content_base64: b64('x') };
      const denied = (await host.dispatch(req('files.create', { tripId: 1, input }), 9)) as RpcError;
      expect(denied.error.message).toBe('Uploads are disabled in demo mode.');
      expect((await host.dispatch(req('files.create', { tripId: 1, input }), 42)).ok).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.DEMO_MODE;
      else process.env.DEMO_MODE = prev;
    }
  });

  it('FILES-RPC-016c link ids are stringified, and absent ones become null', async () => {
    const f = build();
    await f.host('db:write:files').dispatch(req('files.createLink', { tripId: 1, fileId: 2, opts: { reservation_id: 9, assignment_id: 3 } }), 42);
    expect(f.files.createFileLink).toHaveBeenCalledWith(2, { reservation_id: '9', assignment_id: '3', place_id: null });
  });

  it('FILES-RPC-016d create stores its optional link ids as strings', async () => {
    const f = build();
    await f.host('db:write:files').dispatch(
      req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x'), place_id: 7, reservation_id: 9, description: 'd' } }), 42,
    );
    expect(f.files.createFile).toHaveBeenCalledWith(1, expect.anything(), 42, { place_id: '7', reservation_id: '9', description: 'd' });
  });

  it('FILES-RPC-018 create puts the bytes into the storage layer before the DB row', async () => {
    const f = build();
    const order: string[] = [];
    (f.storage.put as ReturnType<typeof vi.fn>).mockImplementation(async () => { order.push('put'); });
    (f.files.createFile as ReturnType<typeof vi.fn>).mockImplementation(() => { order.push('insert'); return { id: 130 }; });
    const res = await f.host('db:write:files').dispatch(
      req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x'), mimetype: 'application/pdf' } }), 42,
    );
    expect(res.ok).toBe(true);
    expect(order).toEqual(['put', 'insert']);
    const [category, name, source, opts] = (f.storage.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(category).toBe('files');
    expect(name).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(source).toBeInstanceOf(Readable);
    expect(opts).toEqual({ contentType: 'application/pdf' });
  });

  it('FILES-RPC-019 create defaults the stored contentType like the returned mimetype', async () => {
    const f = build();
    await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x') } }), 42);
    const [, , , opts] = (f.storage.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts).toEqual({ contentType: 'application/octet-stream' });
  });

  it('FILES-RPC-020 a failed put creates no DB row and broadcasts nothing', async () => {
    const f = build();
    (f.storage.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('backend down'));
    const res = (await f.host('db:write:files').dispatch(
      req('files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: b64('x') } }), 42,
    )) as RpcError;
    expect(res.error).toBeDefined();
    expect(f.files.createFile).not.toHaveBeenCalled();
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('FILES-RPC-021 a refused create never reaches the storage layer', async () => {
    const f = build();
    await f.host('db:write:files').dispatch(req('files.create', { tripId: 1, input: { name: 'evil.exe', content_base64: b64('MZ') } }), 42);
    expect(f.storage.put).not.toHaveBeenCalled();
  });

  it('FILES-RPC-016e a file with no recorded size or mimetype still reads', async () => {
    const f = build({ file: { filename: 'visa.pdf', original_name: 'visa.pdf', mime_type: null, file_size: null, deleted_at: null } });
    const res = await f.host('db:read:files:content').dispatch(req('files.getContent', { tripId: 1, fileId: 2 }), 42);
    expect((res as { result: { mimetype: string } }).result.mimetype).toBe('application/octet-stream');
  });

  it('FILES-RPC-017 the class is listed in its module providers', () => {
    expectRegisteredProvider(FilesModule, FilesRpc);
  });
});
