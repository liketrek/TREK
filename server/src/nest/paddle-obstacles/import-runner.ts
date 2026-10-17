import { type ImportOutcome, type ImportPhase, importExtract } from './paddle-import';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

/** Reads a region's extract; in a thread of its own where the build ships the script, else on the calling thread. */
export interface ImportRunner {
  run(
    path: string,
    regionId: string,
    onProgress: (phase: ImportPhase, fraction: number | null) => void,
    signal: AbortSignal,
  ): Promise<ImportOutcome>;
}

export const PADDLE_IMPORT_RUNNER = Symbol('PADDLE_IMPORT_RUNNER');

/** The thread's heap: a large region's read builds its network in this much, and fails cleanly when it does not fit. */
const IMPORT_HEAP_MB = 1536;

export class InlineImportRunner implements ImportRunner {
  async run(
    path: string,
    regionId: string,
    onProgress: (phase: ImportPhase, fraction: number | null) => void,
    signal: AbortSignal,
  ): Promise<ImportOutcome> {
    const outcome = await importExtract(path, regionId, onProgress);
    signal.throwIfAborted();
    return outcome;
  }
}

/**
 * The read in a worker thread: the server's thread stays free while a large
 * region takes minutes, and a read that runs out of memory ends its thread,
 * not the server. Calling it off ends the thread at once.
 */
export class WorkerImportRunner implements ImportRunner {
  constructor(private readonly entry: string) {}

  async run(
    path: string,
    regionId: string,
    onProgress: (phase: ImportPhase, fraction: number | null) => void,
    signal: AbortSignal,
  ): Promise<ImportOutcome> {
    signal.throwIfAborted();
    const execArgv = process.execArgv.filter(
      (arg, index, all) =>
        arg === '--require' || arg === '-r' || all[index - 1] === '--require' || all[index - 1] === '-r',
    );
    const worker = new Worker(this.entry, {
      workerData: { path, regionId },
      execArgv,
      resourceLimits: { maxOldGenerationSizeMb: IMPORT_HEAP_MB },
    });
    return await new Promise<ImportOutcome>((resolve, reject) => {
      let settled = false;
      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        action();
        void worker.terminate();
      };
      const abort = () =>
        finish(() => reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason))));
      signal.addEventListener('abort', abort);
      worker.on(
        'message',
        (message: {
          progress?: { phase: ImportPhase; fraction: number | null };
          outcome?: ImportOutcome;
          error?: string;
        }) => {
          if (message.progress) onProgress(message.progress.phase, message.progress.fraction);
          else if (message.outcome) {
            const outcome = message.outcome;
            if (outcome.graph) outcome.graph = { ...outcome.graph, bytes: new Uint8Array(outcome.graph.bytes) };
            finish(() => resolve(outcome));
          } else finish(() => reject(new Error(message.error ?? 'the read failed')));
        },
      );
      worker.on('error', (err) => finish(() => reject(err)));
      worker.on('exit', (code) =>
        finish(() => reject(new Error(`the read ended early (${code}); a smaller region may fit`))),
      );
    });
  }
}

export function importRunner(): ImportRunner {
  const entry = join(__dirname, 'paddle-import.worker.js');
  return existsSync(entry) ? new WorkerImportRunner(entry) : new InlineImportRunner();
}
