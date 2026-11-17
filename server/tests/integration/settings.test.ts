/**
 * Settings integration tests — SET-001 through SET-008.
 * Covers GET /api/settings, PUT /api/settings, POST /api/settings/bulk.
 */
import { buildApp } from '../../src/bootstrap';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

let nestApp: INestApplication;
let app: Application;
// The booted app's own ORM, the one the requests write through.
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
});

describe('Settings', () => {
  it('SET-001: GET /api/settings returns empty object for new user', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).get('/api/settings').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(typeof res.body.settings).toBe('object');
    // New user has no custom settings
    expect(Object.keys(res.body.settings)).toHaveLength(0);
  });

  it('SET-002: PUT /api/settings sets a key/value pair', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'theme', value: 'dark' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.key).toBe('theme');
    expect(res.body.value).toBe('dark');
  });

  it('SET-003: PUT /api/settings updates an existing key', async () => {
    const { user } = await makeUser(orm);
    await request(app).put('/api/settings').set('Cookie', authCookie(user.id)).send({ key: 'theme', value: 'dark' });

    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'theme', value: 'light' });

    expect(res.status).toBe(200);
    expect(res.body.value).toBe('light');

    // Verify the GET reflects the updated value
    const getRes = await request(app).get('/api/settings').set('Cookie', authCookie(user.id));
    expect(getRes.body.settings.theme).toBe('light');
  });

  it('SET-004: POST /api/settings/bulk upserts multiple settings', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: { theme: 'dark', language: 'en', compact_mode: 'true' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updated).toBeGreaterThanOrEqual(3);
  });

  it('SET-005: GET /api/settings reflects previously upserted values', async () => {
    const { user } = await makeUser(orm);
    await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: { theme: 'dark', language: 'fr' } });

    const res = await request(app).get('/api/settings').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.settings.theme).toBe('dark');
    expect(res.body.settings.language).toBe('fr');
  });

  it('SET-006: GET /api/settings without auth returns 401', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  it('SET-007: PUT /api/settings without key returns 400', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app).put('/api/settings').set('Cookie', authCookie(user.id)).send({ value: 'dark' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('SET-008: PUT /api/settings with masked value is ignored (no-op)', async () => {
    const { user } = await makeUser(orm);
    // First set a real value
    await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'webhook_url', value: 'https://example.com/hook' });

    // Then try to "save" the masked placeholder
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'webhook_url', value: '••••••••' });
    expect(res.status).toBe(200);
    expect(res.body.unchanged).toBe(true);
  });

  it('SET-009: POST /api/settings/bulk without settings object returns 400', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: null });
    expect(res.status).toBe(400);
  });

  it('SET-010: settings are user-scoped (user A cannot see user B settings)', async () => {
    const { user: userA } = await makeUser(orm);
    const { user: userB } = await makeUser(orm);

    await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(userA.id))
      .send({ key: 'secret_setting', value: 'user_a_secret' });

    const res = await request(app).get('/api/settings').set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(200);
    expect(res.body.settings.secret_setting).toBeUndefined();
  });
});
