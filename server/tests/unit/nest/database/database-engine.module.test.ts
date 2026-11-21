/**
 * DatabaseEngineModule: one engine per container, shared by every injector.
 */
import {
  DatabaseEngineModule,
  DATABASE_ENGINE,
  DATABASE_SETTINGS,
} from '../../../../src/nest/database/database-engine.module';
import { Test } from '@nestjs/testing';

import { describe, expect, it } from 'vitest';

describe('DatabaseEngineModule', () => {
  it('ENGINE-DI-001: provides one engine instance, so state an engine keeps is the same wherever it is injected', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseEngineModule] }).compile();

    const engine = moduleRef.get(DATABASE_ENGINE);
    expect(moduleRef.get(DATABASE_ENGINE)).toBe(engine);
    expect(engine.id).toBe('sqlite');
  });

  it('ENGINE-DI-002: the settings are read from the environment once and the engine is resolved from them', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseEngineModule] }).compile();

    const settings = moduleRef.get(DATABASE_SETTINGS);
    expect(settings.engine).toBe('sqlite');
    expect(moduleRef.get(DATABASE_SETTINGS)).toBe(settings);
  });
});
