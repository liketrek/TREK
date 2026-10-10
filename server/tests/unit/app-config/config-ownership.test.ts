/**
 * Every environment variable has exactly one owner: either `readEnv()` (live,
 * per call, reachable from anywhere) or one registerAs token (boot-stable,
 * injected). A variable read through both drifts the moment one side's
 * semantics change, and its dependency is invisible to whoever reads the
 * other. These cases record which keys each side actually touches, through a
 * Proxy over the raw environment, so a new field in the wrong derive function
 * fails here rather than in review.
 */
import { BOOT_DERIVERS, type BootNamespace } from '../../../src/app-config/boot-derive';
import { deriveAll, type RawEnv } from '../../../src/app-config/derive';
import { envSchema } from '../../../src/app-config/env.schema';
import { BOOT_STABLE_TOKENS } from '../../../src/nest/app-config/tokens';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC = path.join(__dirname, '..', '..', '..', 'src');
const TOKENS_FILE = path.join(SRC, 'nest', 'app-config', 'tokens.ts');

/**
 * Variables Node itself and the outbound proxy support read. They are not TREK
 * configuration, so the schema does not list them; deriveNet passes them on.
 */
const PLATFORM_VARIABLES = new Set(['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'NO_PROXY', 'no_proxy']);

/** The keys `derive` reads from an empty environment, in the order it reads them. */
function keysReadBy(derive: (raw: RawEnv) => unknown): Set<string> {
  const read = new Set<string>();
  const raw = new Proxy({} as RawEnv, {
    get(_target, key) {
      if (typeof key === 'string') read.add(key);
      return undefined;
    },
  });
  derive(raw);
  return read;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const namespaces = Object.keys(BOOT_DERIVERS) as BootNamespace[];
const liveKeys = keysReadBy(deriveAll);

describe('config ownership', () => {
  it('CONFIG-OWN-001: the recorder sees what readEnv() derives (sanity)', () => {
    expect(liveKeys.has('DEMO_MODE')).toBe(true);
    expect(liveKeys.has('ALLOWED_ORIGINS')).toBe(true);
    expect(keysReadBy(BOOT_DERIVERS.http).has('TRUST_PROXY')).toBe(true);
  });

  it.each(namespaces)('CONFIG-OWN-002: no variable the %s token owns is also derived by readEnv()', (ns) => {
    const both = [...keysReadBy(BOOT_DERIVERS[ns])].filter((key) => liveKeys.has(key));
    expect(both).toEqual([]);
  });

  it('CONFIG-OWN-003: no variable is owned by two tokens', () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const ns of namespaces) {
      for (const key of keysReadBy(BOOT_DERIVERS[ns])) {
        const previous = owner.get(key);
        if (previous) clashes.push(`${key}: ${previous} and ${ns}`);
        owner.set(key, ns);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('CONFIG-OWN-004: every token registers under its namespace and derives with its BOOT_DERIVERS entry', () => {
    expect(BOOT_STABLE_TOKENS.map((token) => String(token.KEY)).sort()).toEqual(
      namespaces.map((ns) => `CONFIGURATION(${ns})`).sort(),
    );
    for (const token of BOOT_STABLE_TOKENS) {
      const ns = /^CONFIGURATION\((.+)\)$/.exec(String(token.KEY))![1] as BootNamespace;
      expect(token()).toEqual(BOOT_DERIVERS[ns](process.env as RawEnv));
    }
  });

  it('CONFIG-OWN-005: every token is injected somewhere, so none is dead scaffolding', () => {
    const consumers = sourceFiles(SRC)
      .filter((file) => file !== TOKENS_FILE)
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    const unused = namespaces.filter((ns) => !consumers.includes(`${ns}Config.KEY`));
    expect(unused).toEqual([]);
  });

  it('CONFIG-OWN-006: every variable either side reads is in the validated schema', () => {
    const schemaKeys = new Set(Object.keys(envSchema.shape));
    const read = new Set([...liveKeys, ...namespaces.flatMap((ns) => [...keysReadBy(BOOT_DERIVERS[ns])])]);
    const unvalidated = [...read].filter((key) => !schemaKeys.has(key) && !PLATFORM_VARIABLES.has(key));
    expect(unvalidated).toEqual([]);
  });
});
