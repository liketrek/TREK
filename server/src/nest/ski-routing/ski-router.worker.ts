import { NetCache, runSkiJob, type SkiJob } from './ski-router-runner';

import { parentPort } from 'node:worker_threads';

/** The piste router's thread: answers the jobs it is sent on networks it keeps decoded. */
const cache = new NetCache();

parentPort?.on('message', (message: { id: number; job?: SkiJob; forget?: string }) => {
  if (message.forget) {
    cache.forget(message.forget);
    return;
  }
  if (!message.job) return;
  runSkiJob(cache, message.job).then(
    (result) => parentPort?.postMessage({ id: message.id, result }),
    (err: unknown) =>
      parentPort?.postMessage({ id: message.id, error: err instanceof Error ? err.message : String(err) }),
  );
});
