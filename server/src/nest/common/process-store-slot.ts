/**
 * The store a piece of process-wide state is kept in right now.
 *
 * A store port (the permissions cache, the OAuth pending codes, the socket
 * rooms) is provided by its module, so a store shared between processes can
 * be swapped in there. Some readers cannot take it through a constructor: the
 * backup restore is plain functions, the broadcasts are free functions every
 * domain calls, and the no-Nest test harnesses build consumers by hand. They
 * read the slot instead, and the owning module installs whatever the
 * container resolved for the port, so swapping the provider changes every
 * reader, not only the injected ones.
 *
 * Starts on the in-memory default, which is also what the module provides
 * unless it is overridden, so a process that never builds the module (a
 * hand-built test) sees what it saw before.
 */
export class ProcessStoreSlot<T> {
  private current: T;

  constructor(private readonly fallback: T) {
    this.current = fallback;
  }

  /** The store every out-of-container reader uses now. */
  get(): T {
    return this.current;
  }

  /** Called by the owning module with the store the container resolved. */
  install(store: T): void {
    this.current = store;
  }

  /**
   * Called when that module is torn down: back to the default, unless a later
   * app has installed its own store since.
   */
  release(store: T): void {
    if (this.current === store) this.current = this.fallback;
  }
}
