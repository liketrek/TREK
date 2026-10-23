/**
 * Runs token refreshes one at a time per key, as an injectable port: two
 * requests that find the same ChatGPT token expired must not both spend the
 * refresh token, which rotates and refuses a second use. In memory today, which
 * serializes within this process; the `secrets_version` check on the write
 * covers a second process.
 */
export abstract class AiRefreshLock {
  abstract run<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

export class InMemoryAiRefreshLock extends AiRefreshLock {
  private readonly tails = new Map<string, Promise<unknown>>();

  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const next = previous.then(fn, fn);
    const tail = next.catch(() => undefined);
    this.tails.set(key, tail);
    void tail.then(() => {
      if (this.tails.get(key) === tail) this.tails.delete(key);
    });
    return next;
  }
}
