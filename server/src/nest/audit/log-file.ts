import fs from 'node:fs';
import path from 'node:path';

export interface LogFileOptions {
  /** Directory the log lives in; created on the first write, never at construction. */
  dir: string;
  /** File name inside `dir`. */
  file?: string;
  /** Size at which the file is rotated to `<file>.1`. */
  maxBytes?: number;
  /** How many files exist at most, the live one included (`<file>`, `.1` ... `.<maxFiles - 1>`). */
  maxFiles?: number;
  /**
   * Ceiling on what may wait in memory while the disk is slow. Lines past it
   * are counted and dropped, and the count is written once there is room
   * again, so a stalled volume costs log lines rather than the process.
   */
  maxBufferedBytes?: number;
  /** How long a line may wait for others to share its write. */
  flushDelayMs?: number;
  /** Where the sink reports its own failures; it never throws into a caller. */
  onError: (message: string) => void;
}

const DEFAULTS = {
  file: 'trek.log',
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 5,
  maxBufferedBytes: 4 * 1024 * 1024,
  flushDelayMs: 50,
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isMissing(err: unknown): boolean {
  return (err as NodeJS.ErrnoException | null)?.code === 'ENOENT';
}

/**
 * The file half of the server log: lines are queued in memory and appended in
 * batches, off the event loop, by one write at a time.
 *
 * The previous logger did `existsSync` + `statSync` + `appendFileSync` for
 * every line, on the event loop, which a slow volume (an SMB or NFS bind
 * mount) turned into a stall of every request. Here a line costs an array
 * push; the disk sees one `appendFile` per batch.
 *
 * Rotation keeps its old shape (`trek.log` moves to `trek.log.1`, the oldest
 * of `maxFiles` falls off) and is made safe in two ways. It runs inside the
 * same serial chain as the writes, so no batch is appended while files are
 * being renamed. And before rotating it re-reads the size on disk: when
 * another process sharing the directory rotated first, the file is small
 * again and this one only adopts the new size instead of rotating a second
 * time and pushing a fresh file out.
 */
export class BufferedLogFile {
  private readonly filePath: string;
  private readonly opts: Required<Omit<LogFileOptions, 'onError'>> & Pick<LogFileOptions, 'onError'>;
  private pending: string[] = [];
  private pendingBytes = 0;
  /** The batch whose append has not resolved yet; flushSync() writes it too, so an exit does not lose it. */
  private inFlight: string | null = null;
  private dropped = 0;
  /** Bytes in the live file as far as this process knows; read from disk before the first append. */
  private size: number | null = null;
  private dirReady = false;
  private chain: Promise<void> = Promise.resolve();
  private timer: NodeJS.Timeout | null = null;

  constructor(options: LogFileOptions) {
    this.opts = { ...DEFAULTS, ...options };
    this.filePath = path.join(this.opts.dir, this.opts.file);
  }

  get path(): string {
    return this.filePath;
  }

  /** Queue one line (without its newline). Never blocks and never throws. */
  write(line: string): void {
    const chunk = `${line}\n`;
    if (this.pendingBytes + chunk.length > this.opts.maxBufferedBytes) {
      this.dropped++;
      return;
    }
    if (this.dropped > 0) this.reportDropped();
    this.pending.push(chunk);
    this.pendingBytes += chunk.length;
    this.schedule();
  }

  /** Resolves once everything queued before the call is on disk (or reported as failed). */
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.chain = this.chain.then(() => this.drain());
    return this.chain;
  }

  /**
   * Write whatever is still in memory, synchronously. For the last moment of
   * a process (the exit handler), where a promise would never settle. A batch
   * whose async append was still running is written again rather than risked:
   * a duplicated line at exit is better than a lost one.
   */
  flushSync(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const data = (this.inFlight ?? '') + this.takePending();
    if (!data) return;
    try {
      fs.mkdirSync(this.opts.dir, { recursive: true });
      fs.appendFileSync(this.filePath, data);
    } catch (err) {
      this.opts.onError(`log file write failed: ${errorMessage(err)}`);
    }
  }

  private schedule(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.opts.flushDelayMs);
    // A queued log line must never be what keeps a finished process alive.
    this.timer.unref?.();
  }

  private takePending(): string {
    if (this.dropped > 0) this.reportDropped();
    const data = this.pending.join('');
    this.pending = [];
    this.pendingBytes = 0;
    return data;
  }

  private reportDropped(): void {
    const note = `[WARN] [logger] ${this.dropped} log line(s) dropped while the log file could not keep up\n`;
    this.dropped = 0;
    this.pending.push(note);
    this.pendingBytes += note.length;
  }

  private async drain(): Promise<void> {
    const data = this.takePending();
    if (!data) return;
    this.inFlight = data;
    try {
      await this.ensureDir();
      const bytes = Buffer.byteLength(data);
      if (this.size === null) this.size = await this.sizeOnDisk();
      // Same trigger as before: a file already at the cap is rotated before the next append.
      if (this.size >= this.opts.maxBytes) await this.rotate();
      await fs.promises.appendFile(this.filePath, data);
      this.size += bytes;
    } catch (err) {
      // The size we track may be wrong after a failure; learn it again next time.
      this.size = null;
      this.opts.onError(`log file write failed: ${errorMessage(err)}`);
    } finally {
      this.inFlight = null;
    }
  }

  private async ensureDir(): Promise<void> {
    if (this.dirReady) return;
    await fs.promises.mkdir(this.opts.dir, { recursive: true });
    this.dirReady = true;
  }

  private async sizeOnDisk(): Promise<number> {
    try {
      return (await fs.promises.stat(this.filePath)).size;
    } catch (err) {
      if (isMissing(err)) return 0;
      throw err;
    }
  }

  private async rotate(): Promise<void> {
    try {
      // Somebody else may have rotated since we last looked.
      const actual = await this.sizeOnDisk();
      if (actual < this.opts.maxBytes) {
        this.size = actual;
        return;
      }
      for (let i = this.opts.maxFiles - 1; i >= 1; i--) {
        const src = i === 1 ? this.filePath : `${this.filePath}.${i - 1}`;
        try {
          await fs.promises.rename(src, `${this.filePath}.${i}`);
        } catch (err) {
          if (!isMissing(err)) throw err;
        }
      }
      this.size = 0;
    } catch (err) {
      this.opts.onError(`log rotation failed: ${errorMessage(err)}`);
      // Keep appending to the current file rather than losing the batch.
      this.size = await this.sizeOnDisk().catch(() => 0);
    }
  }
}
