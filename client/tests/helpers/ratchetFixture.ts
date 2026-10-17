import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * A throwaway client tree for the ratchet scripts in scripts/lib/: each key is
 * a path from the tree's root, each value the file's text. The checks are run
 * against it with their output collected, so a test sees exactly what CI would
 * print and the exit code it would end with.
 */
export interface RatchetTree {
  root: string;
  write: (files: Record<string, string>) => void;
  path: (key: string) => string;
  log: string[];
  error: string[];
  out: { log: (line: string) => void; error: (line: string) => void };
  remove: () => void;
}

export function ratchetTree(files: Record<string, string> = {}): RatchetTree {
  const root = mkdtempSync(join(tmpdir(), 'trek-ratchet-'));
  const log: string[] = [];
  const error: string[] = [];
  const write = (more: Record<string, string>) => {
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

/** n lines of short code, each ending in a newline. */
export function lines(n: number, text = 'const a = 1'): string {
  return `${text}\n`.repeat(n);
}
