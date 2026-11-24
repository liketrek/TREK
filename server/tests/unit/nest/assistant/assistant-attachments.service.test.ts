/**
 * The files users attach in the trip chat, kept with the conversation: the
 * bytes go to storage before the turn writes anything, the text TREK reads
 * stays in the row and never fails the turn, a thread's bytes go with it, and
 * the nightly sweep removes the week-old ones and the bytes no row names.
 */
import { AssistantAttachments } from '../../../../src/db/entities/AssistantAttachments.entity';
import {
  ASSISTANT_ATTACHMENT_TTL_DAYS,
  AssistantAttachmentsService,
} from '../../../../src/nest/assistant/assistant-attachments.service';
import { AssistantKeepFileService } from '../../../../src/nest/assistant/assistant-keep-file.service';
import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { MikroORM } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';

import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

const NOW = new Date('2026-10-24T03:45:00.000Z');

const FRESH = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
const SHARED = '1c8d3f1f-7a7e-4b9f-8c2b-4e3d2f1a0b98';
const SCAN = '2d9e4a2a-8b8f-4cab-9d3c-5f4e3a2b1c09';
const ELSEWHERE = '3eaf5b3b-9c9a-4dbc-8e4d-6a5f4b3c2d10';

/** The rows findInThread answers: a file not shared yet, one shared, one without text. */
const KEPT = [
  { id: FRESH, name: 'AirBnB Buchung.pdf', mime: 'application/pdf', text: 'Casa Lisboa', shared_at: null },
  {
    id: SHARED,
    name: 'ticket.pdf',
    mime: 'application/pdf',
    text: 'Casa Lisboa, HM4X2',
    shared_at: '2026-10-24 08:00:00',
  },
  { id: SCAN, name: 'scan.pdf', mime: 'application/pdf', text: null, shared_at: '2026-10-24 08:00:00' },
];
const HOUR = 60 * 60_000;

function file(name: string, content = 'Booking ABC123', mimetype = 'application/pdf'): Express.Multer.File {
  const buffer = Buffer.from(content);
  return { originalname: name, buffer, size: buffer.length, mimetype } as Express.Multer.File;
}

interface Listed {
  key: string;
  mtimeMs: number;
}

interface MakeOpts {
  text?: string | Error;
  listed?: Listed[];
  failDelete?: string;
  failPut?: boolean;
  attached?: Array<{ id: string; trip_id: number }>;
  documents?: boolean;
}

async function make(opts: MakeOpts = {}) {
  const rows = {
    insertAttachment: vi.fn(async () => undefined),
    listForThread: vi.fn(async () => opts.attached ?? []),
    listObjectsOfThread: vi.fn(async () => [{ id: 'a1', storage_key: 'assistant/a1.pdf' }]),
    listCreatedBefore: vi.fn(async () => [
      { id: 'old1', storage_key: 'assistant/old1.pdf' },
      { id: 'old2', storage_key: 'assistant/old2.pdf' },
    ]),
    deleteByIds: vi.fn(async (ids: string[]) => ids.length),
    listKnownKeys: vi.fn(async (keys: string[]) => keys.filter((key) => key.startsWith('assistant/kept'))),
    findInThread: vi.fn(async (id: string) => KEPT.find((row) => row.id === id) ?? null),
    listSharedTexts: vi.fn(async () => [{ id: SHARED, text: 'Casa Lisboa, HM4X2' }]),
    markShared: vi.fn(async () => true),
  };
  const put = vi.fn(async (_category: string, _key: string, source: Readable) => {
    if (opts.failPut) throw new Error('bucket is gone');
    for await (const _chunk of source) {
      // drained, as a driver would
    }
  });
  const storage = {
    put,
    delete: vi.fn(async (_category: string, key: string) => {
      if (key === opts.failDelete) throw new Error('permission denied');
    }),
    list: vi.fn(async function* list() {
      for (const entry of opts.listed ?? []) yield { key: entry.key, size: 1, mtimeMs: entry.mtimeMs };
    }),
  };
  const llmParse = {
    readText: vi.fn(async () => {
      if (opts.text instanceof Error) throw opts.text;
      return opts.text ?? ' Booking ABC123 ';
    }),
    fitText: vi.fn((text: string, compact: boolean) => (compact ? text.slice(0, 4) : text)),
  };
  const keeper = {
    keep: vi.fn(async () => ({ ok: true, value: { file: { id: 3 } } })),
    keepsOn: vi.fn(async (_tripId: number) => opts.documents !== false),
  };
  const moduleRef = await Test.createTestingModule({
    providers: [
      AssistantAttachmentsService,
      { provide: getRepositoryToken(AssistantAttachments), useValue: rows },
      { provide: StorageService, useValue: storage },
      { provide: LlmParseService, useValue: llmParse },
      { provide: MikroORM, useValue: {} },
      {
        provide: AssistantKeepFileService,
        useValue: keeper,
      },
    ],
  }).compile();
  return { service: moduleRef.get(AssistantAttachmentsService), rows, storage, llmParse, keeper };
}

describe('AssistantAttachmentsService', () => {
  it('ASTATT-001: keeps the bytes under the attachments folder and reads the text, before any row is written', async () => {
    const t = await make();
    const kept = await t.service.stash(file('AirBnB Buchung.pdf'), 'AirBnB Buchung.pdf');
    expect(kept).toMatchObject({
      name: 'AirBnB Buchung.pdf',
      mime: 'application/pdf',
      size: 14,
      text: 'Booking ABC123',
      textStatus: 'ok',
    });
    expect(kept.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(kept.storageKey).toBe(`assistant/${kept.id}.pdf`);
    expect(kept.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(t.storage.put).toHaveBeenCalledWith('files', kept.storageKey, expect.any(Readable), {
      contentType: 'application/pdf',
    });
    expect(t.rows.insertAttachment).not.toHaveBeenCalled();
  });

  it('ASTATT-002: a storage that refuses the bytes refuses the turn', async () => {
    const t = await make({ failPut: true });
    await expect(t.service.stash(file('a.pdf'), 'a.pdf')).rejects.toThrow('bucket is gone');
  });

  it('ASTATT-003: says how reading the text went, and a failure never fails the file', async () => {
    const statusOf = async (name: string, text?: string | Error) => {
      const t = await make({ text });
      return (await t.service.stash(file(name), name)).textStatus;
    };
    expect(await statusOf('scan.pdf', '   ')).toBe('scanned');
    expect(await statusOf('empty.txt', '')).toBe('empty');
    expect(await statusOf('broken.pdf', new Error('bad xref'))).toBe('failed');
    expect(await statusOf('photo.JPG')).toBe('unsupported');
    expect(await statusOf('pass.pkpass')).toBe('unsupported');
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('bad xref'));
  });

  it('ASTATT-004: a name with an odd extension gets a plain key, and a long text is kept to its cap', async () => {
    const t = await make({ text: 'x'.repeat(250_000) });
    const kept = await t.service.stash(file('ticket.p d f'), 'ticket.p d f');
    expect(kept.storageKey).toBe(`assistant/${kept.id}`);
    expect(kept.text).toHaveLength(200_000);
  });

  it('ASTATT-005: records the row in the thread the turn opened, and drops the bytes of a turn that never began', async () => {
    const t = await make();
    const kept = await t.service.stash(file('a.pdf'), 'a.pdf');
    await t.service.record(kept, { threadId: 4, userId: 7, tripId: 9 });
    expect(t.rows.insertAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: kept.id, threadId: 4, userId: 7, tripId: 9, storageKey: kept.storageKey }),
    );
    await t.service.discard(kept);
    expect(t.storage.delete).toHaveBeenCalledWith('files', kept.storageKey);
  });

  it('ASTATT-006: a deleted thread takes its bytes along; one that cannot go now is left for the sweep', async () => {
    const t = await make({ failDelete: 'assistant/a1.pdf' });
    const objects = await t.service.objectsOfThread(4, 7);
    expect(t.rows.listObjectsOfThread).toHaveBeenCalledWith(4, 7);
    await expect(t.service.dropObjects(objects)).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('assistant/a1.pdf'));
  });

  it(`ASTATT-007: the sweep removes what is ${ASSISTANT_ATTACHMENT_TTL_DAYS} days old, bytes first, then loose bytes`, async () => {
    const t = await make({
      failDelete: 'assistant/old2.pdf',
      listed: [
        { key: 'assistant/kept.pdf', mtimeMs: NOW.getTime() - 3 * HOUR },
        { key: 'assistant/loose.pdf', mtimeMs: NOW.getTime() - 3 * HOUR },
        { key: 'assistant/fresh.pdf', mtimeMs: NOW.getTime() - 60_000 },
      ],
    });
    const swept = await t.service.sweep(NOW);
    expect(t.rows.listCreatedBefore).toHaveBeenCalledWith('2026-10-17 03:45:00', 500);
    // The row whose bytes could not be deleted stays, so it can be tried again.
    expect(t.rows.deleteByIds).toHaveBeenCalledWith(['old1']);
    expect(t.rows.listKnownKeys).toHaveBeenCalledWith(['assistant/kept.pdf', 'assistant/loose.pdf']);
    expect(t.storage.delete).toHaveBeenCalledWith('files', 'assistant/loose.pdf');
    expect(t.storage.delete).not.toHaveBeenCalledWith('files', 'assistant/kept.pdf');
    expect(t.storage.delete).not.toHaveBeenCalledWith('files', 'assistant/fresh.pdf');
    expect(swept).toEqual({ expired: 1, orphaned: 1 });
    expect(logMock.logInfo).toHaveBeenCalledWith(
      'Assistant retention: removed 1 attached file(s) and 1 loose object(s)',
    );
  });

  it('ASTATT-008: lists a thread for the user only', async () => {
    const t = await make();
    await t.service.listForThread(4, 7);
    expect(t.rows.listForThread).toHaveBeenCalledWith(4, 7);
  });

  it('ASTATT-009: the consent is kept on the file, and the answer names the file, never its text', async () => {
    const t = await make();
    const run = await t.service.share(7, 4, { attachmentId: FRESH });
    expect(run).toEqual({ ok: true, value: { name: 'AirBnB Buchung.pdf', mime: 'application/pdf', read: true } });
    expect(t.rows.findInThread).toHaveBeenCalledWith(FRESH, 4, 7);
    expect(t.rows.markShared).toHaveBeenCalledWith(FRESH, 4, 7, expect.stringMatching(/^\d{4}-\d{2}-\d{2} /));
    expect(JSON.stringify(run)).not.toContain('Casa');
    expect(await t.service.share(7, 4, { attachmentId: ELSEWHERE })).toEqual({
      ok: false,
      value: 'No such attachment in this conversation.',
    });
    expect(await t.service.share(7, 4, { attachmentId: SCAN })).toMatchObject({ ok: false });
    expect(await t.service.applyChange('read_attached_file', { userId: 7, threadId: 4, tripId: 9 }, {})).toEqual({
      ok: false,
      value: 'No such attachment in this conversation.',
    });
    expect(t.service.handles('read_attached_file')).toBe(true);
    expect(t.service.handles('create_place')).toBe(false);
    const at = { userId: 7, threadId: 4, tripId: 9 };
    expect(await t.service.applyChange('keep_attached_file', at, { attachmentId: FRESH })).toEqual({
      ok: true,
      value: { file: { id: 3 } },
    });
    expect(await t.service.applyChange('create_place', at, {})).toEqual({
      ok: false,
      value: 'Unknown tool: create_place',
    });
  });

  it('ASTATT-010: a shared file is read for the model only; one not shared yet is not read', async () => {
    const t = await make();
    const run = await t.service.readShared(7, 4, SHARED, false);
    expect(run).toEqual({
      ok: true,
      value: { name: 'ticket.pdf', mime: 'application/pdf', read: true },
      modelText: JSON.stringify({
        name: 'ticket.pdf',
        mime: 'application/pdf',
        read: true,
        text: 'Casa Lisboa, HM4X2',
      }),
    });
    expect((await t.service.readShared(7, 4, SHARED, true)).modelText).toContain('"text":"Casa"');
    expect(await t.service.readShared(7, 4, FRESH, false)).toEqual({
      ok: false,
      value: 'The user has not let you read this file yet.',
    });
    expect(await t.service.readShared(7, 4, ELSEWHERE, false)).toMatchObject({ ok: false });
    expect(await t.service.readShared(7, 4, SCAN, false)).toMatchObject({ ok: false });
  });

  it("ASTATT-011: a turn gets the thread's files and the shared texts, cut for its connection", async () => {
    const t = await make();
    const custom = await t.service.turnFor(7, 4, { kind: 'custom', model: 'llama', host: 'gpu.lan' });
    expect(custom.texts).toEqual(new Map([[SHARED, 'Casa']]));
    expect(custom.turn.sentTo).toBe('llama (gpu.lan)');
    const cloud = await t.service.turnFor(7, 4, { kind: 'openai', model: 'gpt-5', host: 'api.openai.com' });
    expect(cloud.texts).toEqual(new Map([[SHARED, 'Casa Lisboa, HM4X2']]));
    expect(t.rows.listSharedTexts).toHaveBeenCalledWith(4, 7);
    // A thread without files has nothing to keep and asks no addon.
    expect(cloud.turn.keeps).toBe(false);
    expect(t.keeper.keepsOn).not.toHaveBeenCalled();
  });

  it('ASTATT-012: a turn may keep its files only while their trip has Documents on', async () => {
    const connection = { kind: 'openai', model: 'gpt-5', host: 'api.openai.com' } as const;
    const attached = [{ id: SHARED, trip_id: 9 }];
    const on = await make({ attached });
    expect((await on.service.turnFor(7, 4, connection)).turn.keeps).toBe(true);
    expect(on.keeper.keepsOn).toHaveBeenCalledWith(9);
    const off = await make({ attached, documents: false });
    expect((await off.service.turnFor(7, 4, connection)).turn.keeps).toBe(false);
  });
});
