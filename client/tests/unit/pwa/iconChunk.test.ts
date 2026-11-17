import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_CHUNK } from '../../../iconChunk.js';

describe('ICON_CHUNK', () => {
  it('FE-ICON-CHUNK-001: takes every lucide module, on either path separator', () => {
    expect(ICON_CHUNK.test.test('/app/node_modules/lucide-react/dist/esm/icons/chevron-down.js')).toBe(true);
    expect(ICON_CHUNK.test.test('/app/node_modules/lucide-react/dist/esm/createLucideIcon.js')).toBe(true);
    expect(ICON_CHUNK.test.test('C:\\app\\node_modules\\lucide-react\\dist\\esm\\icons\\map.js')).toBe(true);
  });

  it('FE-ICON-CHUNK-002: takes nothing else', () => {
    expect(ICON_CHUNK.test.test('/app/node_modules/react/index.js')).toBe(false);
    expect(ICON_CHUNK.test.test('/app/node_modules/lucide-react-native/dist/esm/icons/map.js')).toBe(false);
    expect(ICON_CHUNK.test.test('/app/client/src/components/shared/PluginIcon.tsx')).toBe(false);
    expect(ICON_CHUNK.test.test('/app/client/src/lucide-react/own.ts')).toBe(false);
  });

  it('FE-ICON-CHUNK-003: holds only what the first load already needs', () => {
    // Without the tag the group would also collect icons that sit behind a lazy route
    // and make them part of the first load (see the note on the groups in vite.config.js).
    expect(ICON_CHUNK.tags).toEqual(['$initial']);
    expect(ICON_CHUNK.name).toBe('vendor-icons');
  });

  it('FE-ICON-CHUNK-004: vite.config.js lists it among the chunk groups', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');
    const groups = config.slice(config.indexOf('groups: ['));
    expect(config).toContain("import { ICON_CHUNK } from './iconChunk.js'");
    expect(groups).toMatch(/groups: \[[\s\S]*?\n {12}ICON_CHUNK,\n/);
  });
});
