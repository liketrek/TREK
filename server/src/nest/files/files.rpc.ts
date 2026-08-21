import pathMod from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService } from '../database/database.service';
import { readEnv } from '../../app-config';
import { isDemoEmail } from '../common/demo';
import { BLOCKED_EXTENSIONS } from './files.constants';
import { FilesService } from './files.service';
import { StorageService } from '../storage/storage.service';
import { StorageNotFoundError, StorageInvalidKeyError, type ObjectStat } from '../storage/storage.types';

/** Files use three separate rights, one per operation, unlike every other domain. */
const UPLOAD_ACTION = 'file_upload';
const EDIT_ACTION = 'file_edit';
const DELETE_ACTION = 'file_delete';

/** Decoded bytes a plugin may read or write in one call. */
const CONTENT_MAX = 10 * 1024 * 1024;

type FileRow = {
  filename: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  deleted_at: string | null;
};

type CreateInput = {
  name: string;
  content_base64: string;
  mimetype?: string;
  description?: string;
  place_id?: number;
  reservation_id?: number;
};

/**
 * The file surface a plugin may reach (#plugins).
 *
 * Two things here are unlike the rest of the plugin surface. Reading a file's BYTES
 * is a separate grant from reading its metadata, because a passport scan is more
 * sensitive than its filename. And the three write operations use three distinct
 * rights (file_upload / file_edit / file_delete) rather than one domain action.
 *
 * This surface holds no direct fs access: both byte-paths — read and write — go
 * through the storage layer, so `ctx.files` behaves identically whether the backend
 * is local disk, S3, or a mirrored pair. The extension blocklist and size cap still
 * run before the put, and a demo user is refused outright.
 */
@PluginController()
export class FilesRpc {
  constructor(
    private readonly files: FilesService,
    private readonly realtime: RealtimeService,
    private readonly db: DatabaseService,
    private readonly guards: PluginGuards,
    private readonly storage: StorageService,
  ) {}

  @PluginMethod('files.list', { permission: 'db:read:files' })
  list(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Trash excluded, the same view the files tab shows.
    return this.guards.tripRead(params, ctx, () => this.files.listFiles(num(params.tripId, 'tripId'), false));
  }

  @PluginMethod('files.getContent', { permission: 'db:read:files:content' })
  getContent(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () =>
      this.readContent(num(params.tripId, 'tripId'), num(params.fileId, 'fileId')),
    );
  }

  /**
   * Size-capped BEFORE the read, so a 500MB video cannot be pulled through the IPC
   * pipe as ~667MB of base64. The bytes come from the storage layer, so this read
   * works on remote backends too. The read itself runs off the event loop: 10MB of
   * readFile plus base64 on the host thread would stall every other plugin RPC and
   * every HTTP request for its duration.
   */
  private async readContent(tripId: number, fileId: number): Promise<unknown> {
    const file = this.files.getFileById(fileId, tripId) as FileRow | undefined;
    if (!file || file.deleted_at) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
    if ((file.file_size ?? 0) > CONTENT_MAX) {
      throw new BadParams(`file too large to read (>${CONTENT_MAX} bytes); use the download UI`);
    }
    let stream: Readable;
    let stat: ObjectStat;
    try {
      ({ stream, stat } = await this.storage.getStream('files', pathMod.basename(file.filename)));
    } catch (err) {
      if (err instanceof StorageNotFoundError || err instanceof StorageInvalidKeyError) {
        throw new ForbiddenResource('file path is not accessible');
      }
      throw err;
    }
    // Re-checked against the OBJECT, not the DB row: file_size can drift.
    if (stat.size > CONTENT_MAX) {
      stream.destroy();
      throw new BadParams(`file too large to read (>${CONTENT_MAX} bytes); use the download UI`);
    }
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of stream) {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      total += part.length;
      // A driver whose stat under-reports must not push an oversized payload
      // through the IPC pipe: abort as soon as the running total crosses the cap.
      if (total > CONTENT_MAX) {
        stream.destroy();
        throw new BadParams('file too large to read');
      }
      chunks.push(part);
    }
    const buf = Buffer.concat(chunks);
    return {
      name: file.original_name,
      mimetype: file.mime_type ?? 'application/octet-stream',
      size: buf.length,
      content_base64: buf.toString('base64'),
    };
  }

  @PluginMethod('files.create', { permission: 'db:write:files' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'file');
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '' || input.name.length > 255) {
      throw new BadParams('file name is required (max 255 chars)');
    }
    if (typeof input.content_base64 !== 'string' || input.content_base64 === '') {
      throw new BadParams('content_base64 is required');
    }
    // Bound the ENCODED length first: 14MB of base64 is roughly the 10MB cap, and
    // rejecting here avoids decoding an oversized payload just to measure it.
    if (input.content_base64.length > 14 * 1024 * 1024) {
      throw new BadParams('file exceeds the 10MB plugin upload cap');
    }
    this.guards.requireTripEdit(tripId, actor, UPLOAD_ACTION);
    return this.writeFile(tripId, input as unknown as CreateInput, actor);
  }

  private async writeFile(tripId: number, input: CreateInput, actingUserId: number): Promise<unknown> {
    // Mirrors the REST upload guard: a demo user must not write bytes to the shared
    // demo instance, not even through a plugin's db:write:files. The email is only
    // resolved when demo mode is actually on, so self-hosted installs pay nothing.
    if (readEnv().demo.enabled) {
      const uploader = this.db.prepare('SELECT email FROM users WHERE id = ?').get(actingUserId) as { email?: string } | undefined;
      if (isDemoEmail(uploader?.email)) throw new ForbiddenResource('Uploads are disabled in demo mode.');
    }
    const original = pathMod.basename(input.name);
    const ext = pathMod.extname(original).toLowerCase();
    if (!ext || BLOCKED_EXTENSIONS.includes(ext)) {
      throw new BadParams(`file extension '${ext || '(none)'}' is not allowed`);
    }
    const buf = Buffer.from(input.content_base64, 'base64');
    if (buf.length === 0) throw new BadParams('file content is empty');
    if (buf.length > CONTENT_MAX) throw new BadParams('file exceeds the 10MB plugin upload cap');
    const foreign = this.files.findForeignLinkTarget(tripId, {
      reservation_id: input.reservation_id ?? null,
      place_id: input.place_id ?? null,
    });
    if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
    const filename = `${randomUUID()}${ext}`;
    // Same order as the REST upload (files.controller.ts): the object is
    // committed to storage before anything references it — a put failure can
    // orphan a blob at worst, never create a row pointing at missing bytes.
    await this.storage.put('files', filename, Readable.from(buf), {
      contentType: input.mimetype || 'application/octet-stream',
    });
    const file = this.files.createFile(
      tripId,
      { filename, originalname: original, size: buf.length, mimetype: input.mimetype || 'application/octet-stream' },
      actingUserId,
      {
        place_id: input.place_id != null ? String(input.place_id) : null,
        reservation_id: input.reservation_id != null ? String(input.reservation_id) : null,
        description: input.description ?? null,
      },
    );
    this.realtime.broadcast(tripId, 'file:created', { file }, undefined);
    return file;
  }

  @PluginMethod('files.createLink', { permission: 'db:write:files' })
  createLink(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const fileId = num(params.fileId, 'fileId');
    const actor = this.guards.requireActor(ctx, 'file link');
    this.guards.requireTripEdit(tripId, actor, EDIT_ACTION);
    if (!this.files.getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
    const opts = asPayload(params.opts) as { reservation_id?: number; assignment_id?: number; place_id?: number };
    // A link target on another trip would otherwise attach this trip's file to it.
    const foreign = this.files.findForeignLinkTarget(tripId, opts);
    if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
    return this.files.createFileLink(fileId, {
      reservation_id: opts.reservation_id != null ? String(opts.reservation_id) : null,
      assignment_id: opts.assignment_id != null ? String(opts.assignment_id) : null,
      place_id: opts.place_id != null ? String(opts.place_id) : null,
    });
  }

  @PluginMethod('files.update', { permission: 'db:write:files' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const fileId = num(params.fileId, 'fileId');
    const actor = this.guards.requireActor(ctx, 'file');
    this.guards.requireTripEdit(tripId, actor, EDIT_ACTION);
    const current = this.files.getFileById(fileId, tripId);
    if (!current) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
    const input = asPayload(params.input) as { description?: string; place_id?: number | null; reservation_id?: number | null };
    const foreign = this.files.findForeignLinkTarget(tripId, {
      reservation_id: input.reservation_id ?? null,
      place_id: input.place_id ?? null,
    });
    if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
    const file = this.files.updateFile(fileId, current, {
      description: input.description,
      // null clears the link, undefined leaves it alone: the two are distinct here.
      place_id: input.place_id != null ? String(input.place_id) : input.place_id === null ? null : undefined,
      reservation_id: input.reservation_id != null ? String(input.reservation_id) : input.reservation_id === null ? null : undefined,
    });
    this.realtime.broadcast(tripId, 'file:updated', { file }, undefined);
    return file;
  }

  @PluginMethod('files.softDelete', { permission: 'db:write:files' })
  softDelete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const fileId = num(params.fileId, 'fileId');
    const actor = this.guards.requireActor(ctx, 'file');
    this.guards.requireTripEdit(tripId, actor, DELETE_ACTION);
    if (!this.files.getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
    this.files.softDeleteFile(fileId);
    this.realtime.broadcast(tripId, 'file:deleted', { fileId }, undefined);
    return { deleted: true };
  }
}
