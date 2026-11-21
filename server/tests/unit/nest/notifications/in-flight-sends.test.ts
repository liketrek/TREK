import { InFlightSends } from '../../../../src/nest/notifications/in-flight-sends';

import { describe, expect, it } from 'vitest';

/** A promise the test settles by hand. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('InFlightSends', () => {
  it('INFLIGHT-001: hands each send back unchanged, its value and its failure', async () => {
    const sends = new InFlightSends();
    await expect(sends.track(Promise.resolve(7))).resolves.toBe(7);
    const failure = new Error('smtp down');
    await expect(sends.track(Promise.reject(failure))).rejects.toBe(failure);
  });

  it('INFLIGHT-002: settled() waits for every send tracked so far, failed ones included, and never rejects', async () => {
    const sends = new InFlightSends();
    const ok = deferred<number>();
    const failing = deferred<number>();
    sends.track(ok.promise).catch(() => undefined);
    sends.track(failing.promise).catch(() => undefined);
    let settled = false;
    const waiting = sends.settled().then(() => {
      settled = true;
    });

    ok.resolve(1);
    await ok.promise;
    await Promise.resolve();
    expect(settled).toBe(false);

    failing.reject(new Error('webhook timed out'));
    await waiting;
    expect(settled).toBe(true);
  });

  it('INFLIGHT-003: with nothing running, or once everything ended, settled() resolves at once', async () => {
    const sends = new InFlightSends();
    await expect(sends.settled()).resolves.toBeUndefined();
    await sends.track(Promise.resolve('done'));
    await expect(sends.settled()).resolves.toBeUndefined();
  });
});
