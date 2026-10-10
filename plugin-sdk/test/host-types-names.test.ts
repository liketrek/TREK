/**
 * test/host-types.test-d.ts holds the SDK's plugin API to the host child's copy, name by
 * name. This makes sure it names every one: an export both files declare and the type
 * test does not list would drift unchecked. Skips outside the monorepo, like the other
 * host parity tests.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const hostFile = path.resolve(here, '../../server/src/nest/plugins/runtime/plugin-sdk.ts');
const sdkFile = path.resolve(here, '../src/index.ts');
const typeTest = path.resolve(here, 'host-types.test-d.ts');

const exportsOf = (file: string): Set<string> =>
  new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/^export (?:declare )?(?:interface|type|const|function|class|enum) (\w+)/gm)].map(
      (m) => m[1],
    ),
  );

describe.skipIf(!fs.existsSync(hostFile))('host type parity covers every shared name', () => {
  it('lists each type both sides export', () => {
    const host = exportsOf(hostFile);
    const shared = [...exportsOf(sdkFile)].filter((name) => host.has(name) && name !== 'definePlugin').sort();
    const listed = new Set([...fs.readFileSync(typeTest, 'utf8').matchAll(/expectTypeOf<(?:keyof )?Sdk\.(\w+)>/g)].map((m) => m[1]));
    expect(shared.length).toBeGreaterThan(40);
    expect(shared.filter((name) => !listed.has(name))).toEqual([]);
  });
});
