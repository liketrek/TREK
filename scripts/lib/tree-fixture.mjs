/*
 * A throwaway tree for the tests of the libs in this directory: each key is a
 * path from the tree's root, each value the file's text. The checks run
 * against it with their output collected, so a test sees exactly what CI
 * would print and the exit code it would end with.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export function ratchetTree(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'trek-ratchet-'));
  const log = [];
  const error = [];
  const write = (more) => {
    for (const [key, text] of Object.entries(more)) {
      const path = join(root, key);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
  };
  write(files);
  return {
    root,
    write,
    path: (key) => join(root, key),
    log,
    error,
    out: { log: (line) => log.push(line), error: (line) => error.push(line) },
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}
