/**
 * The extension point is empty here, and adds nothing to the app.
 *
 * The value of this test is not that an empty module is empty. It is that the
 * emptiness is checked at all: this is the seam where an install can attach its
 * own screens, and the promise made to everyone else is that the public build
 * carries none of them. A stray controller or provider slipping in would be
 * invisible in review and obvious only to whoever it shipped to.
 */
import { describe, it, expect } from 'vitest';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { ManagedExtModule } from '../../../src/nest/managed/managed-ext.module';

const meta = (key: string): unknown[] => (Reflect.getMetadata(key, ManagedExtModule) as unknown[]) ?? [];

describe('ManagedExtModule', () => {
  it('MANAGED-EXT-001: contributes no controllers, providers, imports or exports', () => {
    expect({
      controllers: meta(MODULE_METADATA.CONTROLLERS),
      providers: meta(MODULE_METADATA.PROVIDERS),
      imports: meta(MODULE_METADATA.IMPORTS),
      exports: meta(MODULE_METADATA.EXPORTS),
    }).toEqual({ controllers: [], providers: [], imports: [], exports: [] });
  });

  it('MANAGED-EXT-002: compiles as a module, so app.module can import it unconditionally', async () => {
    // Unconditionally on purpose: a conditional import would tie the module graph
    // to an env var, and the graph is built once per app while TREK_MANAGED is
    // read live. An empty module costs nothing, so the flag never reaches here.
    const built = await Test.createTestingModule({ imports: [ManagedExtModule] }).compile();

    expect(built.get(ManagedExtModule, { strict: false })).toBeInstanceOf(ManagedExtModule);
    await built.close();
  });
});
