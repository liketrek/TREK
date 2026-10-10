import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The version the Docker image was built as, from the `VERSION` file the
 * Dockerfile writes next to `server/package.json`.
 *
 * It wins over the APP_VERSION env var because an env var belongs to the
 * container, not to the image. Portainer's "recreate" and `docker run` with a
 * copied config carry the previous image's APP_VERSION into a container built
 * from the new one, so the server kept announcing the old release and no client
 * ever handed over to the new bundle. A file inside the image cannot outlive it.
 *
 * Read once: the file is part of the image and does not change while the
 * process runs. `null` outside an image (source checkout, tests), where the env
 * var and package.json keep deciding as before.
 */
let cached: string | null | undefined;

export function imageVersion(file = resolve(__dirname, '../../VERSION')): string | null {
  if (cached !== undefined) return cached;
  try {
    cached = readFileSync(file, 'utf8').trim() || null;
  } catch {
    cached = null;
  }
  return cached;
}

/** Test seam: forget the cached read. */
export function resetImageVersion(): void {
  cached = undefined;
}
