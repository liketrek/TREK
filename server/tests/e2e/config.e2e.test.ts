/**
 * Public config e2e — verifies /api/config is reachable WITHOUT authentication
 * (it has no guard) and returns the server default language. No db needed.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '../../src/nest/config/config.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DEFAULT_LANGUAGE } from '../../src/config';

describe('Public config e2e (no auth guard)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [ConfigModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('200 with the default language and no cookie required', async () => {
    const res = await request(server).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ defaultLanguage: DEFAULT_LANGUAGE });
  });
});
