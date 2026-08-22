import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import type { StorageBackend } from '@trek/shared';
import { LocalDriver } from './drivers/local.driver';
import { S3Driver } from './drivers/s3.driver';
import { StorageBackendError, type StorageDriver } from './storage.types';

/**
 * Test-connection probes (spec: POST /api/admin/storage/test). Drivers are
 * EPHEMERAL — constructed per probe, never registered, never touching
 * registry state. A mirror is probed per target (primary and each replica
 * individually) because MirrorDriver hides replica failures by design.
 *
 * Residue: a local probe may leave an empty `trek-probe/` directory in the
 * target root. It is inert — not a category prefix, invisible to lists
 * (objects only), and outside every retention pattern.
 */

export interface ProbeTargetResult {
  name: string;
  ok: boolean;
  error?: string;
}

/**
 * Driver wrappers (S3Driver.wrap) keep the underlying failure as `cause` and
 * out of `message` — right for logs, useless for the admin "Test" toast, where
 * "put failed" must say WHY (ECONNREFUSED vs NoSuchBucket). Flatten the chain
 * here, probe-only.
 */
function describeError(err: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  for (let cur: unknown = err; cur != null && !seen.has(cur); ) {
    seen.add(cur);
    const message = cur instanceof Error ? cur.message : String(cur);
    const code = (cur as { code?: unknown }).code;
    parts.push(typeof code === 'string' && code && !message.includes(code) ? `${message} (${code})` : message);
    cur = cur instanceof Error ? (cur as { cause?: unknown }).cause : undefined;
  }
  return parts.filter(Boolean).join(': ');
}

/** put → stat → delete of a unique probe key; any throw becomes the target's error. */
export async function probeDriver(name: string, driver: StorageDriver): Promise<ProbeTargetResult> {
  const key = `trek-probe/${randomUUID()}`;
  try {
    await driver.put(key, Readable.from('trek storage probe'));
    const stat = await driver.stat(key);
    if (!stat) throw new StorageBackendError('probe object vanished between put and stat');
    await driver.delete(key);
    return { name, ok: true };
  } catch (err) {
    return { name, ok: false, error: describeError(err) };
  }
}

/** A non-mirror backend definition (secrets already decrypted) → throwaway driver. */
export function ephemeralDriverFor(backend: Extract<StorageBackend, { type: 'local' | 's3' }>): StorageDriver {
  if (backend.type === 'local') {
    const driver = new LocalDriver({ id: `probe-${backend.name}`, root: backend.options.root });
    driver.init({ ensurePrefixes: [], cleanSpool: false });
    return driver;
  }
  return new S3Driver({ id: `probe-${backend.name}`, ...backend.options });
}
