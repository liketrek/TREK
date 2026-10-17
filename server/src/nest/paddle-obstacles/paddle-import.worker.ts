import { importExtract } from './paddle-import';

import { parentPort, workerData } from 'node:worker_threads';

/** One region's read in a thread of its own; it reports its progress and hands the outcome back, then ends. */
const { path, regionId } = workerData as { path: string; regionId: string };

importExtract(path, regionId, (phase, fraction) => parentPort?.postMessage({ progress: { phase, fraction } })).then(
  // Copied, not transferred: a small Buffer shares Node's pool, which a transfer would take from this thread.
  (outcome) => parentPort?.postMessage({ outcome }),
  (err: unknown) => parentPort?.postMessage({ error: err instanceof Error ? err.message : String(err) }),
);
