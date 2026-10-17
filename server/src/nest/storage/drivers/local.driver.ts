import { assertValidKey, assertValidPrefix } from '../storage-keys';
import {
  isLocalTempFile,
  StorageBackendError,
  StorageInvalidKeyError,
  StorageNotFoundError,
  type ByteRange,
  type LocalTempFile,
  type ObjectStat,
  type StorageDriver,
} from '../storage.types';

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const SPOOL_DIR_NAME = '.tmp';
/** Boot spool-reap age gate: entries younger than this survive the sweep. */
const SPOOL_REAP_AGE_MS = 60 * 60 * 1000;

function errnoCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException).code;
}

/** ENOENT on the path or any parent segment being a file — both are a miss. */
function isMissing(err: unknown): boolean {
  const code = errnoCode(err);
  return code === 'ENOENT' || code === 'ENOTDIR';
}

/**
 * The only real driver type in v1: plain files under a root directory.
 *
 * `put` is atomic — stream sources spool into the hidden `<root>/.tmp` and
 * commit with a single same-volume `rename()`; caller-owned temp files rename
 * directly with an EXDEV copy-fallback for the cross-volume edge case. The
 * root is realpath'd at `init()` because in Docker both storage anchors are
 * symlinks (Dockerfile: `/app/server/uploads → /app/uploads`,
 * `/app/server/data → /app/data`) and a naive `startsWith` containment check
 * misbehaves on symlinked roots — the trap backup.impl.ts:423 and
 * nest/plugins/paths.ts already work around with `realpathSync`.
 */
export class LocalDriver implements StorageDriver {
  readonly id: string;
  private readonly configuredRoot: string;
  private realRoot: string | null = null;

  constructor(opts: { id: string; root: string }) {
    this.id = opts.id;
    this.configuredRoot = opts.root;
  }

  /**
   * Ensure root + spool + category prefix dirs exist and resolve the real
   * root. Runs on every registry load (boot and reload()) so a newly
   * configured backend is usable immediately; `cleanSpool` is passed at boot
   * only — on a reload it could delete an in-flight upload's spool file.
   */
  init(opts: { ensurePrefixes?: string[]; cleanSpool?: boolean } = {}): void {
    fs.mkdirSync(this.configuredRoot, { recursive: true });
    this.realRoot = fs.realpathSync(this.configuredRoot);
    fs.mkdirSync(this.spoolDir(), { recursive: true });
    for (const prefix of opts.ensurePrefixes ?? []) {
      assertValidPrefix(prefix);
      if (prefix) fs.mkdirSync(path.join(this.realRoot, prefix), { recursive: true });
    }
    if (opts.cleanSpool) {
      for (const entry of fs.readdirSync(this.spoolDir())) {
        const entryPath = path.join(this.spoolDir(), entry);
        // Age gate: only reap entries older than the threshold. Crash leftovers
        // are always old by the next boot; a fresh entry belongs to another
        // process spooling into the same tree right now (the vitest integration
        // workers share uploads/, and a second worker booting mid-upload must
        // not delete the first one's in-flight spool file).
        try {
          if (Date.now() - fs.statSync(entryPath).mtimeMs < SPOOL_REAP_AGE_MS) continue;
        } catch {
          continue; // raced away already — nothing to reap
        }
        fs.rmSync(entryPath, { recursive: true, force: true });
      }
    }
  }

  private root(): string {
    if (!this.realRoot) {
      throw new StorageBackendError(`LocalDriver '${this.id}' used before init()`);
    }
    return this.realRoot;
  }

  private spoolDir(): string {
    return path.join(this.root(), SPOOL_DIR_NAME);
  }

  getSpoolDir(): string {
    return this.spoolDir();
  }

  /**
   * Central key validation plus defense-in-depth containment: even a key that
   * somehow passed validation must resolve inside the real root.
   */
  private resolvePath(key: string): string {
    assertValidKey(key);
    const resolved = path.resolve(this.root(), key);
    if (!resolved.startsWith(this.root() + path.sep)) {
      throw new StorageInvalidKeyError(key);
    }
    return resolved;
  }

  getLocalPath(key: string): string {
    return this.resolvePath(key);
  }

  async put(key: string, source: Readable | LocalTempFile): Promise<void> {
    const dest = this.resolvePath(key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });

    if (isLocalTempFile(source)) {
      try {
        await fs.promises.rename(source.tmpPath, dest);
      } catch (err) {
        if (errnoCode(err) !== 'EXDEV') {
          throw new StorageBackendError(`put failed for '${key}' on '${this.id}'`, err);
        }
        await fs.promises.copyFile(source.tmpPath, dest);
        await fs.promises.unlink(source.tmpPath);
      }
      return;
    }

    const spool = path.join(this.spoolDir(), randomUUID());
    try {
      await pipeline(source, fs.createWriteStream(spool));
      await fs.promises.rename(spool, dest);
    } catch (err) {
      await fs.promises.rm(spool, { force: true });
      throw err instanceof Error && !errnoCode(err)
        ? err // source-stream failure: surface the caller's own error untouched
        : new StorageBackendError(`put failed for '${key}' on '${this.id}'`, err);
    }
  }

  async getStream(key: string, range?: ByteRange): Promise<{ stream: Readable; stat: ObjectStat }> {
    const resolved = this.resolvePath(key);
    const stat = await this.stat(key);
    if (!stat) throw new StorageNotFoundError(key);
    const stream = fs.createReadStream(resolved, range ? { start: range.start, end: range.end } : undefined);
    return { stream, stat };
  }

  async stat(key: string): Promise<ObjectStat | null> {
    const resolved = this.resolvePath(key);
    try {
      const st = await fs.promises.stat(resolved);
      if (!st.isFile()) return null;
      return { key, size: st.size, mtimeMs: st.mtimeMs };
    } catch (err) {
      if (isMissing(err)) return null;
      throw new StorageBackendError(`stat failed for '${key}' on '${this.id}'`, err);
    }
  }

  async delete(key: string): Promise<void> {
    const resolved = this.resolvePath(key);
    try {
      await fs.promises.unlink(resolved);
    } catch (err) {
      if (isMissing(err)) return; // idempotent
      throw new StorageBackendError(`delete failed for '${key}' on '${this.id}'`, err);
    }
  }

  async *list(prefix: string): AsyncIterable<ObjectStat> {
    assertValidPrefix(prefix);
    const root = this.root();
    yield* this.walk(prefix ? path.resolve(root, prefix) : root, root);
  }

  private async *walk(dir: string, root: string): AsyncIterable<ObjectStat> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (isMissing(err)) return; // unpopulated prefix — empty, not an error
      throw new StorageBackendError(`list failed under '${dir}' on '${this.id}'`, err);
    }
    for (const entry of entries) {
      // Skips the .tmp spool (and any dotfile) defensively — key validation
      // already makes dot segments unreachable, but list walks the real disk.
      if (entry.name.startsWith('.')) continue;
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* this.walk(entryPath, root);
      } else if (entry.isFile()) {
        const st = await fs.promises.stat(entryPath);
        yield {
          key: path.relative(root, entryPath).split(path.sep).join('/'),
          size: st.size,
          mtimeMs: st.mtimeMs,
        };
      }
    }
  }
}
