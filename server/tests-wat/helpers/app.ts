import type { INestApplication } from '@nestjs/common';
import type { Application } from 'express';

export interface TestApp {
  app: INestApplication;
  http: Application;
}

// Boots the NestApp for Supertest.
// Call from beforeAll, AFTER the db/config/ websocket modules have been mocked in the test file (bootstrap is required lazily here so those mocks are already registered).
export async function createTestApp(): Promise<TestApp> {
  const { buildApp } = require('../../src/bootstrap');
  const app: INestApplication = await buildApp();
  return { app, http: app.getHttpAdapter().getInstance() };
}
