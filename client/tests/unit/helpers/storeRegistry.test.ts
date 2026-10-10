import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../../../src/store/authStore';
import { resetAllStores } from '../../helpers/store';
import { RESET_STORES, UNRESET_STORES } from '../../helpers/storeRegistry';

const SRC = join(process.cwd(), 'src');
const STORE = /export const (use[A-Z]\w*Store)\s*=\s*create\b/g;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

/** Every Zustand store src/ exports, as store name → file. */
function storesInSrc(): Map<string, string> {
  const found = new Map<string, string>();
  for (const path of sourceFiles(SRC)) {
    for (const match of readFileSync(path, 'utf8').matchAll(STORE)) found.set(match[1], relative(SRC, path));
  }
  return found;
}

describe('store registry', () => {
  it('FE-STORE-REGISTRY-001: places every store src/ exports, so a new one cannot slip past resetAllStores', () => {
    const inSrc = storesInSrc();
    expect(inSrc.size).toBeGreaterThan(0);
    const listed = new Set([...Object.keys(RESET_STORES), ...Object.keys(UNRESET_STORES)]);
    const missing = [...inSrc].filter(([name]) => !listed.has(name)).map(([name, file]) => `${name} (${file})`);
    expect(missing, 'add each to RESET_STORES or UNRESET_STORES in tests/helpers/storeRegistry.ts').toEqual([]);
    const gone = [...listed].filter((name) => !inSrc.has(name));
    expect(gone, 'remove each from tests/helpers/storeRegistry.ts').toEqual([]);
  });

  it('FE-STORE-REGISTRY-002: lists no store as both reset and left alone', () => {
    expect(Object.keys(RESET_STORES).filter((name) => name in UNRESET_STORES)).toEqual([]);
  });

  it('FE-STORE-REGISTRY-003: resetAllStores puts a registered store back to its first state', () => {
    const before = useAuthStore.getState();
    useAuthStore.setState({ isAuthenticated: !before.isAuthenticated });
    resetAllStores();
    expect(useAuthStore.getState()).toBe(before);
  });
});
