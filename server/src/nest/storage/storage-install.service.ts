import { AppSettings } from '../../db/entities/AppSettings.entity';
import { StorageReclaimMarks } from '../../db/entities/StorageReclaimMarks.entity';
import { StorageReleaseQueue } from '../../db/entities/StorageReleaseQueue.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type { StorageReclaimMarksRepository } from '../../db/repositories/StorageReclaimMarks.repository';
import type { StorageReleaseQueueRepository } from '../../db/repositories/StorageReleaseQueue.repository';
import { DataPathsService } from '../app-config/data-paths.service';
import { logError, logInfo, logWarn } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { INSTALL_ID_KEY, RECLAIM_DELETE_KEY, RECLAIM_RESET_KEYS } from './storage-reclaim.settings';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const INSTALL_ID = /^[a-z0-9-]{8,64}$/;

/**
 * Which installation this is, from a file in the data dir
 * (`data/.trek-install-id`, made on the first start with a random id, mode
 * 0600 like the at-rest key). No backup archive carries it and no restore
 * writes it, so it stays with the data dir while a database can come from
 * anywhere: a backup restore (in the app or at boot), a restart after a
 * restore that failed half way, a copied `travel.db`.
 *
 * At boot, and after every reopen of the database, the database is reconciled
 * with it: a database that names another id, or none, gets this one, and the
 * reclaim state it brought (the deletion switch, the confirmations, both
 * reports, the marks and the release queue) is dropped, since it describes
 * another installation's storage. After a reopen that happens whatever the id
 * says, as before: the rows a restore brings are an older history even when
 * they are this installation's own.
 *
 * What it cannot tell apart is a data dir copied whole, the file with it: the
 * wiki asks to give a clone its own data dir or delete the file. When the file
 * can be neither read nor written, there is no id: nothing is deleted then.
 */
@Injectable()
export class StorageInstallService implements OnApplicationBootstrap {
  /** Undefined until the file was read; null when it cannot be used. */
  private fileId: string | null | undefined;
  /** Bumped on every reopen: a pass or a release tick that saw another epoch stops. */
  private currentEpoch = 0;

  constructor(
    private readonly dataPaths: DataPathsService,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(StorageReclaimMarks) private readonly marks: StorageReclaimMarksRepository,
    @InjectRepository(StorageReleaseQueue) private readonly queue: StorageReleaseQueueRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await withRequestContext(this.orm, () => this.reconcile());
    } catch (err) {
      logError(`[storage] could not reconcile the database with this installation's id: ${messageOf(err)}`);
    }
  }

  /** How many reopens this process has seen. */
  get epoch(): number {
    return this.currentEpoch;
  }

  /**
   * This installation's id, read from its file once and made there on the
   * first start; null when the file holds no id or cannot be read or written,
   * which keeps every delete off (fail closed).
   */
  installId(): string | null {
    if (this.fileId === undefined) this.fileId = this.readOrCreate();
    return this.fileId;
  }

  /**
   * Makes the database name this installation. One that names another, or
   * none, loses its reclaim state first. Answers whether it reset something
   * a database had brought along.
   */
  async reconcile(): Promise<boolean> {
    const id = this.installId();
    if (id === null) return false;
    const stored = await this.appSettings.getValue(INSTALL_ID_KEY);
    if (stored === id) return false;
    const wasOn = await this.reset(id);
    if (stored !== null) {
      logInfo(
        `[storage] the database names another installation (restored, cloned or copied): its reclaim state was ` +
          `dropped${wasOn ? ', and deletion is off until an admin turns it on' : ''}`,
      );
    }
    return stored !== null;
  }

  /**
   * The database was swapped (a restore, the demo reset): what ran on the old
   * one stops, and the new one gets this installation's id and no reclaim
   * state. Contained, since a listener that throws fails the reopen.
   */
  async afterReopen(): Promise<void> {
    this.currentEpoch += 1;
    try {
      const id = this.installId();
      const wasOn = await withRequestContext(this.orm, () => this.reset(id));
      if (wasOn)
        logInfo('[storage] the restored database had reclaim deletion on: it is off until an admin turns it on');
    } catch (err) {
      logError(`[storage] could not reset the reclaim state after the database was reopened: ${messageOf(err)}`);
    }
  }

  /** Drops the reclaim state and writes `id` (when there is one); answers whether deletion was on. */
  private async reset(id: string | null): Promise<boolean> {
    return await this.uow.transactional(async () => {
      const wasOn = (await this.appSettings.getValue(RECLAIM_DELETE_KEY)) !== null;
      if (id !== null) await this.appSettings.upsertOrReplace(INSTALL_ID_KEY, id);
      await RECLAIM_RESET_KEYS.reduce<Promise<void>>(async (previous, key) => {
        await previous;
        await this.appSettings.deleteValue(key);
      }, Promise.resolve());
      await this.marks.deleteAll();
      await this.queue.deleteAll();
      return wasOn;
    });
  }

  private readOrCreate(): string | null {
    const file = this.dataPaths.installIdFile;
    const read = readId(file);
    if (read !== 'missing') return read;
    const id = randomUUID();
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      placeOnce(file, `${id}\n`);
      return id;
    } catch (err) {
      if (codeOf(err) === 'EEXIST') {
        const again = readId(file);
        return again === 'missing' ? null : again;
      }
      logWarn(`[storage] could not write the install id file, nothing is reclaimed: ${messageOf(err)}`);
      return null;
    }
  }
}

/**
 * Puts `text` at `file` unless a file is there already (EEXIST), whole: it is
 * written next to it and linked into place, so two processes starting at once
 * on one data dir end up with one id and neither reads a half-written file. A
 * volume without hard links gets an exclusive create instead.
 */
function placeOnce(file: string, text: string): void {
  const spool = `${file}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(spool, text, { mode: 0o600 });
  try {
    fs.linkSync(spool, file);
  } catch (err) {
    if (codeOf(err) === 'EEXIST') throw err;
    fs.writeFileSync(file, text, { mode: 0o600, flag: 'wx' });
  } finally {
    fs.rmSync(spool, { force: true });
  }
}

/** The id the file holds, 'missing' when there is no file, null when it is unreadable or holds no id. */
function readId(file: string): string | null | 'missing' {
  try {
    const text = fs.readFileSync(file, 'utf8').trim();
    if (INSTALL_ID.test(text)) return text;
    logWarn(`[storage] '${file}' holds no install id, nothing is reclaimed until it is deleted or fixed`);
    return null;
  } catch (err) {
    if (codeOf(err) === 'ENOENT') return 'missing';
    logWarn(`[storage] could not read the install id file, nothing is reclaimed: ${messageOf(err)}`);
    return null;
  }
}

function codeOf(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : undefined;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
