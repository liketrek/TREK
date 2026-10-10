/**
 * Fixture for `db-call-graph.mjs --sync --tx --root scripts/__fixtures__`: one class that
 * still touches the database synchronously and opens a raw transaction, so the two gates
 * CI runs (`--sync`, `--tx`) each have a known-bad case to report. `unawaited-sample.ts`
 * beside it is clean under both flags.
 */

interface RawDb {
  get(sql: string, ...args: unknown[]): unknown;
  transaction<T>(fn: () => T): T;
}

export class SyncSample {
  private db: RawDb = { get: () => undefined, transaction: (fn) => fn() };

  readSync(id: number): unknown {
    return this.db.get('SELECT 1 WHERE id = ?', id); // sync DB-touching method
  }

  writeInTx(): void {
    this.db.transaction(() => undefined); // raw transaction site
  }
}
