import { measurePhoto } from './photo-signals-runner';

import { parentPort } from 'node:worker_threads';

/**
 * The photo signals' thread: says it is ready once its script has loaded (so
 * the runner can tell a thread that never started from a photo that broke
 * one), then measures the photos it is sent and answers each by its id.
 * `measurePhoto` answers null for anything it cannot read and never throws, so
 * every photo gets its answer.
 */
parentPort?.on('message', (message: { id: number; bytes?: Uint8Array }) => {
  if (!message.bytes) return;
  void measurePhoto(message.bytes).then((pixels) => parentPort?.postMessage({ id: message.id, pixels }));
});
parentPort?.postMessage({ ready: true });
