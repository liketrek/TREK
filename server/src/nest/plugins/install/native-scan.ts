import fs from 'node:fs';
import path from 'node:path';

/**
 * Scan a plugin directory for native binaries / build artifacts (#plugins, M4).
 * Native modules (.node) are forbidden in v1 — a native addon in a fork() child
 * is arbitrary native code at the plugin uid, which would defeat any future
 * sandbox. Returns the offending relative paths (empty = clean).
 */
const OFFENDERS = /\.node$|(^|[\\/])binding\.gyp$|(^|[\\/])prebuilds?[\\/]/i;
const MAX_ENTRIES = 20_000;

export function scanForNativeBinaries(dir: string): string[] {
  const hits: string[] = [];
  let seen = 0;
  const walk = (d: string, rel: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (++seen > MAX_ENTRIES) return;
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) continue; // never follow symlinks
      if (e.isDirectory()) {
        if (OFFENDERS.test(childRel + '/')) hits.push(childRel);
        else walk(path.join(d, e.name), childRel);
      } else if (OFFENDERS.test(childRel)) {
        hits.push(childRel);
      }
    }
  };
  walk(dir, '');
  return hits;
}
