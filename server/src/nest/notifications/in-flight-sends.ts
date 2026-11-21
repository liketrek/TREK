/**
 * The notification sends still running. Most callers start a send without
 * waiting for it (the change it reports is already committed, and email or a
 * webhook should not hold the response), so nothing else knows when one ends.
 * This set does: `settled()` resolves once every send started before the call
 * has finished, whether it delivered or failed.
 */
export class InFlightSends {
  private readonly running = new Set<Promise<unknown>>();

  /** Tracks `send` until it settles and hands it back unchanged. */
  track<T>(send: Promise<T>): Promise<T> {
    const settled = send.then(
      () => undefined,
      () => undefined,
    );
    this.running.add(settled);
    void settled.then(() => this.running.delete(settled));
    return send;
  }

  /** Resolves once every send tracked so far has settled; never rejects. */
  async settled(): Promise<void> {
    await Promise.all([...this.running]);
  }
}
