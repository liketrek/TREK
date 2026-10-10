import tsParser from '@typescript-eslint/parser';

import { ESLint, Linter } from 'eslint';
import path from 'path';
import { describe, expect, it } from 'vitest';

// fast-xml-parser is allowed in place-import's codecs and the WebDAV client
// only, through no-restricted-imports in eslint.config.mjs. That rule's options
// are replaced, not merged, by every flat-config block that restates it, so a
// later block can silently drop the restriction (or the driver and services
// walls beside it). This asks ESLint for the options it really applies to a
// path and runs them over an import of each restricted module.

const serverRoot = path.resolve(__dirname, '../../..');
const eslint = new ESLint({ cwd: serverRoot });

async function restrictedImportsFor(file: string): Promise<unknown[]> {
  const config = (await eslint.calculateConfigForFile(path.join(serverRoot, file))) as {
    rules?: Record<string, [string, ...unknown[]]>;
  };
  return config.rules?.['no-restricted-imports']?.slice(1) ?? [];
}

async function flags(file: string, source: string): Promise<boolean> {
  const options = await restrictedImportsFor(file);
  const linter = new Linter({ configType: 'flat' });
  const result = linter.verify(
    source,
    [{ files: ['**/*.ts'], languageOptions: { parser: tsParser }, rules: { 'no-restricted-imports': ['error', ...(options as object[])] } }],
    'probe.ts',
  );
  return result.some((m) => m.ruleId === 'no-restricted-imports');
}

const XML = "import { XMLParser } from 'fast-xml-parser';\n";
const DRIVER = "import Database from 'better-sqlite3';\n";
const SERVICES = "import { x } from '../services/x';\n";

describe('fast-xml-parser stays in place-import and the WebDAV client', () => {
  it.each([
    'src/nest/places/places.service.ts',
    'src/nest/collections/collections.service.ts',
    'src/nest/tours/tours.service.ts',
    'src/nest/maps/maps.service.ts',
    'src/db/repositories/Places.repository.ts',
    // The driver's own homes and the plugin sandbox's database, which the
    // driver wall leaves out, and the RPC kit, which restates the rule.
    'src/db/database.ts',
    'src/db/connection.ts',
    'src/db/orm-driver.ts',
    'src/db/durability.ts',
    'src/db/reseat-booked-nights.ts',
    'src/nest/plugins/host/plugin-data.service.ts',
    'src/nest-rpc/rpc-kit/registry.ts',
  ])('refuses it in %s', async (file) => {
    expect(await flags(file, XML)).toBe(true);
  });

  it.each([
    'src/nest/place-import/gpx.codec.ts',
    'src/nest/place-import/kml.codec.ts',
    'src/nest/doc-sync/providers/webdav.client.ts',
  ])('allows it in %s, and keeps the driver and services walls there', async (file) => {
    expect(await flags(file, XML)).toBe(false);
    expect(await flags(file, DRIVER)).toBe(true);
    expect(await flags(file, SERVICES)).toBe(true);
  });

  it('keeps the services wall in the driver-exempt files and the driver wall in the RPC kit', async () => {
    expect(await flags('src/nest/plugins/host/plugin-data.service.ts', SERVICES)).toBe(true);
    expect(await flags('src/nest/plugins/host/plugin-data.service.ts', DRIVER)).toBe(false);
    expect(await flags('src/nest-rpc/rpc-kit/registry.ts', DRIVER)).toBe(true);
  });

  it('keeps the driver and services walls where the parser is refused', async () => {
    expect(await flags('src/nest/places/places.service.ts', DRIVER)).toBe(true);
    expect(await flags('src/nest/places/places.service.ts', SERVICES)).toBe(true);
  });
});
