import { AssistantAttachments } from '../../db/entities/AssistantAttachments.entity';
import type {
  AssistantAttachmentObject,
  AssistantAttachmentsRepository,
  AssistantAttachmentSummary,
  AssistantAttachmentTextStatus,
} from '../../db/repositories/AssistantAttachments.repository';
import { dbNow } from '../../db/types';
import { logError, logInfo } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import { ASSISTANT_FILES_PREFIX, StorageService } from '../storage/storage.service';
import type { AgentToolRun } from './assistant-agent';
import { NO_SUCH_ATTACHMENT, NO_TEXT, type AttachedTurn } from './assistant-attachment-tools';
import { AssistantKeepFileService } from './assistant-keep-file.service';
import { KEEP_ATTACHED_FILE_TOOL, READ_ATTACHED_FILE_TOOL } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { assistantReadAttachedFileArgsSchema, LLM_PHOTO_EXTENSIONS } from '@trek/shared';

import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';

/** How long an attached file is kept with its conversation. */
export const ASSISTANT_ATTACHMENT_TTL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where the bytes sit: under the trip files' category, which is never served
 * by path (`/uploads/files` refuses every request), in a folder of their own.
 * Storage names the folder, so a demo instance still deletes these bytes.
 */
const STORAGE_CATEGORY = 'files';
const KEY_PREFIX = ASSISTANT_FILES_PREFIX;

/** The most text kept of one file; a model is sent a window of it, never all of it. */
const MAX_STORED_TEXT_CHARS = 200_000;

/** Rows one sweep pass takes; the next night takes the rest. */
const SWEEP_BATCH = 500;

/** Bytes put moments ago may belong to a turn whose row is not written yet; the sweep leaves them for an hour. */
const ORPHAN_GRACE_MS = 60 * 60_000;

/** Files whose bytes hold no text TREK reads: photos, and the zipped wallet passes. */
const UNREAD_EXTENSIONS: ReadonlySet<string> = new Set([...LLM_PHOTO_EXTENSIONS, '.pkpass']);

/** A file stored for a turn that has not written its rows yet. */
interface PreparedAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  sha256: string;
  storageKey: string;
  text: string | null;
  textStatus: AssistantAttachmentTextStatus;
}

/** The held changes on an attachment this service applies. */
const ATTACHMENT_CHANGES: ReadonlySet<string> = new Set([READ_ATTACHED_FILE_TOOL, KEEP_ATTACHED_FILE_TOOL]);

/** What a read of a file the user has not agreed to send answers with. */
const NOT_SHARED = 'The user has not let you read this file yet.';

/** What a turn knows of its thread's files: the list without their texts, and the texts the model may read. */
interface TurnAttachments {
  attached: AssistantAttachmentSummary[];
  /** The texts of the files the user let the model read, by attachment id, cut to one model request. */
  texts: Map<string, string>;
}

/** The connection a turn talks to, as far as a file's text is concerned. */
interface TextReader {
  kind: string;
  model: string;
  host: string;
}

/** Where a change on an attachment runs: the user, and the thread and trip of the conversation. */
interface AttachmentChangeAt {
  userId: number;
  threadId: number;
  tripId: number;
}

/** What the thread and the stream are told of a read: the file, never its text. */
function readStub(row: { name: string; mime: string }) {
  return { name: row.name, mime: row.mime, read: true };
}

/** A plain extension of a file name for its storage key, or none when the name carries something else. */
function keyExtension(name: string): string {
  const ext = extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

/**
 * The files users attach in the trip chat, kept with the conversation
 * (`assistant_attachments`): the bytes in storage, the text TREK read out of
 * them in the row. The text stays on the server; it reaches the model only
 * where the user agreed for that one file, and never a message part.
 */
@Injectable()
export class AssistantAttachmentsService {
  constructor(
    @InjectRepository(AssistantAttachments) private readonly rows: AssistantAttachmentsRepository,
    private readonly storage: StorageService,
    private readonly llmParse: LlmParseService,
    private readonly orm: MikroORM,
    private readonly keeper: AssistantKeepFileService,
  ) {}

  /**
   * Puts the file's bytes into storage and reads its text, before the turn
   * writes anything: a storage that refuses the bytes refuses the turn. A file
   * whose text cannot be read is kept all the same, as `failed`.
   */
  async stash(file: Express.Multer.File, name: string): Promise<PreparedAttachment> {
    const id = randomUUID();
    const storageKey = `${KEY_PREFIX}${id}${keyExtension(name)}`;
    const mime = file.mimetype || 'application/octet-stream';
    await this.storage.put(STORAGE_CATEGORY, storageKey, Readable.from([file.buffer]), { contentType: mime });
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    return { id, name, mime, size: file.size, sha256, storageKey, ...(await this.textOf(file.buffer, name)) };
  }

  /** The row of a prepared file, in the thread its turn opened; written inside the turn's opening transaction. */
  async record(prepared: PreparedAttachment, at: { threadId: number; userId: number; tripId: number }): Promise<void> {
    await this.rows.insertAttachment({
      id: prepared.id,
      threadId: at.threadId,
      userId: at.userId,
      tripId: at.tripId,
      name: prepared.name,
      mime: prepared.mime,
      size: prepared.size,
      sha256: prepared.sha256,
      storageKey: prepared.storageKey,
      text: prepared.text,
      textStatus: prepared.textStatus,
      createdAt: dbNow(),
    });
  }

  /** The bytes of a file whose turn never began; the sweep would find them otherwise, a night later. */
  async discard(prepared: PreparedAttachment): Promise<void> {
    await this.deleteObject(prepared.storageKey);
  }

  /** The user's attachments in a thread, without their text. */
  listForThread(threadId: number, userId: number): Promise<AssistantAttachmentSummary[]> {
    return this.rows.listForThread(threadId, userId);
  }

  /**
   * The thread's files for a turn, and the texts the user let the model read,
   * each cut to what one request carries (`compact` for a server whose
   * context may be small).
   */
  async forTurn(threadId: number, userId: number, compact: boolean): Promise<TurnAttachments> {
    const [attached, shared] = await Promise.all([
      this.rows.listForThread(threadId, userId),
      this.rows.listSharedTexts(threadId, userId),
    ]);
    return { attached, texts: new Map(shared.map((row) => [row.id, this.llmParse.fitText(row.text, compact)])) };
  }

  /**
   * A trip turn's view of its thread's files, for the history and the tools:
   * the shared texts, and the port's turn (assistant-attachment-tools.ts). A
   * server whose context may be small (an admin's own) gets the compact cut.
   */
  async turnFor(
    userId: number,
    threadId: number,
    connection: TextReader,
  ): Promise<{ texts: Map<string, string>; turn: AttachedTurn }> {
    const compact = connection.kind === 'custom';
    const { attached, texts } = await this.forTurn(threadId, userId, compact);
    const sentTo = `${connection.model} (${connection.host})`;
    // A thread's files all belong to its trip, so the first one names it.
    const keeps = attached.length > 0 && (await this.keeper.keepsOn(attached[0].trip_id));
    // Read while the turn streams, outside any request's context.
    const read = (id: string) => withRequestContext(this.orm, () => this.readShared(userId, threadId, id, compact));
    return { texts, turn: { attached, sentTo, keeps, read } };
  }

  /** Whether a held change is one on an attachment, which `applyChange` runs. */
  handles(name: string): boolean {
    return ATTACHMENT_CHANGES.has(name);
  }

  /** Applies a held change on an attachment. */
  applyChange(name: string, at: AttachmentChangeAt, args: Record<string, unknown>): Promise<ToolRun> {
    if (name === READ_ATTACHED_FILE_TOOL) return this.share(at.userId, at.threadId, args);
    if (name === KEEP_ATTACHED_FILE_TOOL) return this.keeper.keep(at, args);
    return Promise.resolve({ ok: false, value: `Unknown tool: ${name}` });
  }

  /**
   * The user agreed on the card that the file's text may go to the model:
   * the agreement is kept on the attachment, and later reads in the thread
   * run at once. The answer names the file, never its text; the text reaches
   * the model through the history (assistant-history.ts).
   */
  async share(userId: number, threadId: number, args: Record<string, unknown>): Promise<ToolRun> {
    const parsed = assistantReadAttachedFileArgsSchema.safeParse(args);
    const row = parsed.success ? await this.rows.findInThread(parsed.data.attachmentId, threadId, userId) : null;
    if (!row) return { ok: false, value: NO_SUCH_ATTACHMENT };
    if (row.text === null) return { ok: false, value: NO_TEXT };
    await this.rows.markShared(row.id, threadId, userId, dbNow());
    return { ok: true, value: readStub(row) };
  }

  /** A file the user let the model read already: its text for the model only, the stub for the thread. */
  async readShared(userId: number, threadId: number, attachmentId: string, compact: boolean): Promise<AgentToolRun> {
    const row = await this.rows.findInThread(attachmentId, threadId, userId);
    if (!row) return { ok: false, value: NO_SUCH_ATTACHMENT };
    if (!row.shared_at) return { ok: false, value: NOT_SHARED };
    if (row.text === null) return { ok: false, value: NO_TEXT };
    const text = this.llmParse.fitText(row.text, compact);
    return { ok: true, value: readStub(row), modelText: JSON.stringify({ ...readStub(row), text }) };
  }

  /** Where the bytes of a thread's attachments sit, read before the thread is deleted. */
  objectsOfThread(threadId: number, userId: number): Promise<AssistantAttachmentObject[]> {
    return this.rows.listObjectsOfThread(threadId, userId);
  }

  /**
   * Deletes the bytes of a thread that is gone; its rows went with it. An
   * object that cannot be deleted now is left for the sweep.
   */
  async dropObjects(objects: readonly AssistantAttachmentObject[]): Promise<void> {
    await Promise.all(objects.map((object) => this.deleteObject(object.storage_key)));
  }

  /**
   * The nightly sweep: attachments older than the TTL (bytes first, then the
   * row, so no row ever names bytes that are gone), then bytes no row names
   * any more (a thread or a user deleted with its rows, a turn that never
   * began). Answers how many attachments and loose objects went.
   *
   * @txIndependent a retention sweep in passes: each object is deleted from
   * storage on its own, and a row only after its bytes.
   */
  async sweep(now: Date = new Date()): Promise<{ expired: number; orphaned: number }> {
    const cutoff = dbNow(new Date(now.getTime() - ASSISTANT_ATTACHMENT_TTL_DAYS * DAY_MS));
    const old = await this.rows.listCreatedBefore(cutoff, SWEEP_BATCH);
    const gone = await Promise.all(
      old.map(async (row) => ((await this.deleteObject(row.storage_key)) ? row.id : null)),
    );
    const expired = await this.rows.deleteByIds(gone.filter((id): id is string => id !== null));
    const orphaned = await this.sweepOrphans(now);
    if (expired + orphaned > 0) {
      logInfo(`Assistant retention: removed ${expired} attached file(s) and ${orphaned} loose object(s)`);
    }
    return { expired, orphaned };
  }

  /** Objects under the attachments' folder that no row names, older than the grace period. */
  private async sweepOrphans(now: Date): Promise<number> {
    const listed: string[] = [];
    for await (const stat of this.storage.list(STORAGE_CATEGORY, KEY_PREFIX)) {
      if (now.getTime() - stat.mtimeMs > ORPHAN_GRACE_MS) listed.push(stat.key);
    }
    const pages = Array.from({ length: Math.ceil(listed.length / SWEEP_BATCH) }, (_page, i) =>
      listed.slice(i * SWEEP_BATCH, (i + 1) * SWEEP_BATCH),
    );
    // One page after another, so a large backlog never asks the database for all its keys at once.
    return pages.reduce<Promise<number>>(async (previous, page) => {
      const done = await previous;
      const known = new Set(await this.rows.listKnownKeys(page));
      const deleted = await Promise.all(page.filter((key) => !known.has(key)).map((key) => this.deleteObject(key)));
      return done + deleted.filter(Boolean).length;
    }, Promise.resolve(0));
  }

  /** Deletes one object; a failure is logged and answered as false, the next sweep tries again. */
  private async deleteObject(key: string): Promise<boolean> {
    try {
      await this.storage.delete(STORAGE_CATEGORY, key);
      return true;
    } catch (err) {
      logError(
        `[assistant] could not delete attached file ${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  /** The text TREK reads out of a file, and how that went. Never throws. */
  private async textOf(
    buffer: Buffer,
    name: string,
  ): Promise<{ text: string | null; textStatus: AssistantAttachmentTextStatus }> {
    const ext = extname(name).toLowerCase();
    if (UNREAD_EXTENSIONS.has(ext)) return { text: null, textStatus: 'unsupported' };
    try {
      const text = (await this.llmParse.readText(buffer, name)).trim();
      if (text) return { text: text.slice(0, MAX_STORED_TEXT_CHARS), textStatus: 'ok' };
      return { text: null, textStatus: ext === '.pdf' ? 'scanned' : 'empty' };
    } catch (err) {
      logError(`[assistant] could not read the text of ${name}: ${err instanceof Error ? err.message : String(err)}`);
      return { text: null, textStatus: 'failed' };
    }
  }
}
