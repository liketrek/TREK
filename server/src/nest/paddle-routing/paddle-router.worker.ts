import { GraphCache, runJob, type RouteJob } from './router-runner';

import { parentPort } from 'node:worker_threads';

/** The router thread: plans the legs it is sent on graphs it keeps loaded, so the server's thread never waits on a search. */
const cache = new GraphCache();

parentPort?.on('message', (message: { id: number; job?: RouteJob; forget?: string }) => {
  if (message.forget) {
    cache.forget(message.forget);
    return;
  }
  if (!message.job) return;
  runJob(cache, message.job).then(
    (legs) => parentPort?.postMessage({ id: message.id, legs }),
    (err: unknown) =>
      parentPort?.postMessage({ id: message.id, error: err instanceof Error ? err.message : String(err) }),
  );
});
