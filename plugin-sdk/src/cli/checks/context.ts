/**
 * Assemble a CheckContext from a plugin directory: read each file ONCE, hand the same
 * strings to every check. Checks stay pure functions of this object, which is what makes
 * them table-testable without a temp dir.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { CheckContext, RegistryEntry } from './types.js';

function readIfPresent(p: string): string | undefined {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return undefined;
  }
}

export function loadContext(
  dir: string,
  extra: { zipBytes?: Buffer; entry?: RegistryEntry } = {},
): CheckContext {
  const root = path.resolve(dir);

  let manifest: Record<string, unknown> | undefined;
  let manifestError: string | undefined;
  const manifestRaw = readIfPresent(path.join(root, 'trek-plugin.json'));
  if (manifestRaw === undefined) {
    manifestError = `no trek-plugin.json in ${dir}`;
  } else {
    try {
      // Tolerate a UTF-8 BOM. Windows editors add one, and a bare JSON.parse then fails with a
      // cryptic "Unexpected token" pointing at an invisible character. Same rule as readJsonFile.
      const text = manifestRaw.charCodeAt(0) === 0xfeff ? manifestRaw.slice(1) : manifestRaw;
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        manifestError = 'trek-plugin.json is not a JSON object';
      } else {
        manifest = parsed as Record<string, unknown>;
      }
    } catch (e) {
      manifestError = 'trek-plugin.json is not valid JSON: ' + (e instanceof Error ? e.message : String(e));
    }
  }

  return {
    dir: root,
    manifest,
    manifestError,
    readme: readIfPresent(path.join(root, 'README.md')),
    clientHtml: readIfPresent(path.join(root, 'client', 'index.html')),
    exists: (rel: string) => fs.existsSync(path.join(root, rel)),
    zipBytes: extra.zipBytes,
    entry: extra.entry,
  };
}

/** Convenience for tests and for callers that already hold the strings. */
export function makeContext(over: Partial<CheckContext> & { dir?: string }): CheckContext {
  const files = new Set<string>();
  return {
    dir: over.dir ?? '/plugin',
    exists: (rel: string) => files.has(rel),
    ...over,
  };
}
