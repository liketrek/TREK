/**
 * keep_attached_file applied: the checks a Files upload runs (demo, trip,
 * the trip's Documents addon, rights, types, same-trip links), the bytes copied to a trip file of their
 * own, the rows written in one transaction, the broadcast after it, and a
 * second keep that answers the first file.
 */
import { AssistantAttachments } from '../../../../src/db/entities/AssistantAttachments.entity';
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { AssistantKeepFileService } from '../../../../src/nest/assistant/assistant-keep-file.service';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { AllowedFileTypesService } from '../../../../src/nest/files/allowed-file-types.service';
import { FilesService } from '../../../../src/nest/files/files.service';
import { McpToolGuardsService } from '../../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';

import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

const ID = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
const AT = { userId: 7, threadId: 4, tripId: 9 };

interface Opts {
  demo?: boolean;
  trip?: boolean;
  documents?: boolean;
  upload?: boolean;
  edit?: boolean;
  allowed?: string;
  foreign?: 'reservation_id' | 'budget_item_id' | null;
  row?: Record<string, unknown> | null;
  kept?: Record<string, unknown> | undefined;
  bytes?: Buffer | Error;
  failTx?: boolean;
}

async function make(opts: Opts = {}) {
  const row =
    opts.row === undefined
      ? {
          id: ID,
          trip_id: 9,
          name: 'AirBnB Buchung.pdf',
          mime: 'application/pdf',
          storage_key: `assistant/${ID}.pdf`,
          file_id: null,
        }
      : opts.row;
  const rows = { findInThread: vi.fn(async () => row), setFile: vi.fn(async () => undefined) };
  const storage = {
    getStream: vi.fn(async () => {
      if (opts.bytes instanceof Error) throw opts.bytes;
      return { stream: Readable.from([opts.bytes ?? Buffer.from('%PDF')]), stat: { key: 'k', size: 4, mtimeMs: 0 } };
    }),
  };
  const created = { id: 31, original_name: 'AirBnB Buchung.pdf', reservation_id: 5, place_id: null, url: '/x' };
  const files = {
    getFileById: vi.fn(async () => opts.kept),
    findForeignLinkTarget: vi.fn(async () => opts.foreign ?? null),
    storeBytes: vi.fn(async () => 'stored.pdf'),
    discardBytes: vi.fn(async () => undefined),
    createFile: vi.fn(async () => {
      if (opts.failTx) throw new Error('disk I/O error');
      return created;
    }),
    broadcast: vi.fn(),
  };
  const guards = {
    hasTripPermission: vi.fn(async (action: string) =>
      action === 'file_upload' ? opts.upload !== false : opts.edit !== false,
    ),
  };
  const uow = { transactional: vi.fn(async (fn: () => Promise<unknown>) => fn()) };
  // The trip's Documents addon: what its owner chose, else the instance switch.
  const addons = { isEnabledForTrip: vi.fn(async () => opts.documents !== false) };
  const moduleRef = await Test.createTestingModule({
    providers: [
      AssistantKeepFileService,
      { provide: getRepositoryToken(AssistantAttachments), useValue: rows },
      { provide: StorageService, useValue: storage },
      { provide: FilesService, useValue: files },
      { provide: AllowedFileTypesService, useValue: { get: vi.fn(async () => opts.allowed ?? 'pdf,txt') } },
      { provide: McpToolGuardsService, useValue: guards },
      { provide: DemoService, useValue: { isDemoUserId: vi.fn(async () => opts.demo === true) } },
      {
        provide: TripAccessService,
        useValue: { findAccessible: vi.fn(async () => (opts.trip === false ? undefined : { id: 9 })) },
      },
      { provide: UnitOfWork, useValue: uow },
      { provide: AddonsService, useValue: addons },
    ],
  }).compile();
  return { service: moduleRef.get(AssistantKeepFileService), rows, files, guards, uow, storage, addons };
}

describe('AssistantKeepFileService', () => {
  it('ASTKEP-001: keeps the file as a trip file with its booking, in one transaction, and tells the trip after it', async () => {
    const t = await make();
    const run = await t.service.keep(AT, { attachmentId: ID, reservation_id: 5, name: 'ignored.exe' });
    expect(run).toEqual({
      ok: true,
      value: { file: { id: 31, name: 'AirBnB Buchung.pdf', reservation_id: 5, place_id: null, budget_item_id: null } },
    });
    expect(t.rows.findInThread).toHaveBeenCalledWith(ID, 4, 7);
    expect(t.files.storeBytes).toHaveBeenCalledWith({
      originalname: 'AirBnB Buchung.pdf',
      mimetype: 'application/pdf',
      bytes: Buffer.from('%PDF'),
    });
    expect(t.files.createFile).toHaveBeenCalledWith(
      9,
      { filename: 'stored.pdf', originalname: 'AirBnB Buchung.pdf', size: 4, mimetype: 'application/pdf' },
      7,
      { reservation_id: 5, place_id: null, budget_item_id: null, description: null },
    );
    expect(t.rows.setFile).toHaveBeenCalledWith(ID, 31);
    expect(t.uow.transactional).toHaveBeenCalledTimes(1);
    expect(t.files.broadcast).toHaveBeenCalledWith(
      '9',
      'file:created',
      { file: expect.objectContaining({ id: 31 }) },
      undefined,
    );
    expect(t.guards.hasTripPermission).toHaveBeenCalledWith('file_edit', 9, 7);
  });

  it('ASTKEP-002: an expense link and a description go along; a keep without a link asks no edit right', async () => {
    const t = await make();
    await t.service.keep(AT, { attachmentId: ID, budget_item_id: 12, description: 'Receipt' });
    expect((t.files.createFile.mock.calls[0] as unknown[])[3]).toEqual({
      reservation_id: null,
      place_id: null,
      budget_item_id: 12,
      description: 'Receipt',
    });
    const plain = await make({ edit: false });
    expect((await plain.service.keep(AT, { attachmentId: ID })).ok).toBe(true);
  });

  it('ASTKEP-003: refused for a demo account, off the trip, without the right to upload or to link', async () => {
    const refused = async (opts: Opts, args: Record<string, unknown> = { attachmentId: ID }) => {
      const t = await make(opts);
      const run = await t.service.keep(AT, args);
      expect(t.files.storeBytes).not.toHaveBeenCalled();
      return run;
    };
    const notAllowed = { ok: false, value: 'You are not allowed to keep files on this trip.' };
    expect(await refused({ demo: true })).toEqual(notAllowed);
    expect(await refused({ trip: false })).toEqual(notAllowed);
    expect(await refused({ upload: false })).toEqual(notAllowed);
    expect(await refused({ edit: false }, { attachmentId: ID, place_id: 3 })).toEqual({
      ok: false,
      value: 'You are not allowed to attach files to bookings, expenses or places on this trip.',
    });
  });

  it('ASTKEP-007: refused while the trip has Documents off, with the words the Files routes use', async () => {
    const t = await make({ documents: false });
    expect(await t.service.keep(AT, { attachmentId: ID })).toEqual({
      ok: false,
      value: 'Documents addon is not enabled',
    });
    expect(t.addons.isEnabledForTrip).toHaveBeenCalledWith(9, 'documents');
    expect(t.rows.findInThread).not.toHaveBeenCalled();
    expect(t.files.storeBytes).not.toHaveBeenCalled();
    expect(await t.service.keepsOn(9)).toBe(false);
    expect(await (await make()).service.keepsOn(9)).toBe(true);
  });

  it('ASTKEP-004: an attachment of no one here, a type Files refuses and a link off the trip are refused', async () => {
    const run = async (opts: Opts, args: Record<string, unknown> = { attachmentId: ID }) =>
      (await make(opts)).service.keep(AT, args);
    const none = { ok: false, value: 'No such attachment in this conversation.' };
    expect(await run({ row: null })).toEqual(none);
    expect(await run({ row: { id: ID, trip_id: 99, name: 'a.pdf', mime: 'application/pdf', file_id: null } })).toEqual(
      none,
    );
    expect(await run({}, { attachmentId: 'nope' })).toEqual({ ok: false, value: 'This change can no longer be read.' });
    expect(await run({ allowed: 'jpg' })).toEqual({
      ok: false,
      value: 'This file type is not allowed on this TREK instance.',
    });
    expect(await run({ foreign: 'reservation_id' }, { attachmentId: ID, reservation_id: 404 })).toEqual({
      ok: false,
      value: 'Linked item does not belong to this trip (reservation_id).',
    });
  });

  it('ASTKEP-005: keeping the same file twice answers the first one; a trashed one is kept again', async () => {
    const first = { id: 31, original_name: 'AirBnB Buchung.pdf', reservation_id: 5, place_id: null, deleted_at: null };
    const row = {
      id: ID,
      trip_id: 9,
      name: 'AirBnB Buchung.pdf',
      mime: 'application/pdf',
      file_id: 31,
      storage_key: 'k',
    };
    const again = await make({ row, kept: first });
    expect(await again.service.keep(AT, { attachmentId: ID })).toEqual({
      ok: true,
      value: { file: { id: 31, name: 'AirBnB Buchung.pdf', reservation_id: 5, place_id: null, budget_item_id: null } },
    });
    expect(again.files.storeBytes).not.toHaveBeenCalled();
    const trashed = await make({ row, kept: { ...first, deleted_at: '2026-10-24 09:00:00' } });
    await trashed.service.keep(AT, { attachmentId: ID });
    expect(trashed.files.createFile).toHaveBeenCalled();
  });

  it('ASTKEP-006: bytes that are gone or too large keep nothing; a failed transaction drops the copied bytes', async () => {
    const gone = await make({ bytes: new Error('NoSuchKey') });
    expect(await gone.service.keep(AT, { attachmentId: ID })).toEqual({
      ok: false,
      value: 'The attached file is no longer kept, so it cannot be put into Files.',
    });
    const huge = await make({ bytes: Buffer.alloc(10 * 1024 * 1024 + 1) });
    expect((await huge.service.keep(AT, { attachmentId: ID })).ok).toBe(false);
    const failing = await make({ failTx: true });
    expect(await failing.service.keep(AT, { attachmentId: ID })).toEqual({
      ok: false,
      value: 'The file could not be kept.',
    });
    expect(failing.files.discardBytes).toHaveBeenCalledWith('stored.pdf');
    expect(failing.rows.setFile).not.toHaveBeenCalled();
    expect(failing.files.broadcast).not.toHaveBeenCalled();
  });
});
