import { ProcessStoreSlot } from '../common/process-store-slot';
import type { PermissionLevel } from './permissions.service';

/**
 * Where the loaded permission levels are kept between requests.
 *
 * An injectable port (PermissionsService takes it, PermissionsModule provides
 * it). Every method returns a promise, because a store shared between
 * processes lives in the database or on the network and repositories are
 * async; the in-memory one below simply resolves at once. Today a permission
 * change on one process is only seen by that process, which is right while
 * TREK runs as one.
 */
export abstract class PermissionsCacheStore {
  /** The cached levels, or null when nothing is cached. */
  abstract get(): Promise<Map<string, PermissionLevel> | null>;
  /** Install a completed read and return it. */
  abstract set(next: Map<string, PermissionLevel>): Promise<Map<string, PermissionLevel>>;
  /** Drop the cache, so the next reader loads the stored levels again. */
  abstract invalidate(): Promise<void>;
}

/** The current behaviour: one map in this process's memory. */
export class InMemoryPermissionsCacheStore extends PermissionsCacheStore {
  private cache: Map<string, PermissionLevel> | null = null;

  get(): Promise<Map<string, PermissionLevel> | null> {
    return Promise.resolve(this.cache);
  }

  set(next: Map<string, PermissionLevel>): Promise<Map<string, PermissionLevel>> {
    this.cache = next;
    return Promise.resolve(next);
  }

  invalidate(): Promise<void> {
    this.cache = null;
    return Promise.resolve();
  }
}

/**
 * The in-memory store this process starts with. PermissionsModule provides
 * this instance unless the provider is overridden, so the container's
 * PermissionsService and every hand-built one (the no-Nest test harnesses)
 * share one cache, as they did when it was a module-level map.
 */
export const processPermissionsCache: PermissionsCacheStore = new InMemoryPermissionsCacheStore();

/**
 * The store the readers outside the container use: PermissionsModule installs
 * the one the container resolved, so the plain backup restore path
 * (backup.impl.ts), which is free functions by design, flushes the same cache
 * the request path reads even when the provider is swapped.
 */
export const permissionsCacheSlot = new ProcessStoreSlot<PermissionsCacheStore>(processPermissionsCache);

export function getPermissionsCache(): Promise<Map<string, PermissionLevel> | null> {
  return permissionsCacheSlot.get().get();
}

export function invalidatePermissionsCache(): Promise<void> {
  return permissionsCacheSlot.get().invalidate();
}
