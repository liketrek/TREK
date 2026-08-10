import 'reflect-metadata';
import 'dotenv/config';
// Fail-fast env validation — must stay directly after dotenv so a malformed
// variable aborts before any other module runs its import-time side effects
// (config.ts key resolution, db/database.ts initDb, ...).
import './app-config/boot-validate';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { buildApp } from './bootstrap';
import { BackupService } from './nest/backup/backup.service';
import { PlacePhotoCacheService } from './nest/place-photos/place-photo-cache.service';
import { AirtrailSyncService } from './nest/integrations/airtrail-sync.service';

// Create upload and data directories on startup.
// Every uploads subdir the app writes to must be listed here (#1762): a dir
// created lazily on first upload needs write permission on the uploads mount
// point itself at request time, which fails with EACCES on Docker hosts whose
// bind-mounted uploads dir isn't writable by the runtime user — while every
// feature writing into an already-existing subdir keeps working. Creating them
// at boot turns that into one loud startup failure instead of a stray 500.
// Keep in sync with the `mkdir -p` list in the Dockerfile (guarded by
// tests/unit/uploads-dirs.test.ts).
const uploadsDir = path.join(__dirname, '../uploads');
const photosDir = path.join(uploadsDir, 'photos');
const filesDir = path.join(uploadsDir, 'files');
const coversDir = path.join(uploadsDir, 'covers');
const avatarsDir = path.join(uploadsDir, 'avatars');
const journeyDir = path.join(uploadsDir, 'journey');
const placesDir = path.join(uploadsDir, 'places');
const backupsDir = path.join(__dirname, '../data/backups');
const tmpDir = path.join(__dirname, '../data/tmp');

[uploadsDir, photosDir, filesDir, coversDir, avatarsDir, journeyDir, placesDir, backupsDir, tmpDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

import * as scheduler from './scheduler';
import { getAppUrl, getMcpSafeUrl, readEnv } from './app-config';

const PORT = readEnv().app.port;
const HOST = readEnv().app.host;
const APP_VERSION: string = readEnv().app.appVersion || (require('../package.json') as { version: string }).version;

const onListen = () => {
  const { logInfo: sLogInfo, logWarn: sLogWarn } = require('./nest/audit/audit-log.logger');
  const env = readEnv();
  const LOG_LVL = (env.app.logLevel || 'info').toLowerCase();
  const tz = env.app.tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const origins = env.http.allowedOriginsRaw || '(same-origin)';
  const appUrl = getAppUrl();
  const resolvedAppUrl = getMcpSafeUrl();
  const banner = [
    '──────────────────────────────────────',
    '  TREK API started',
    `  Version         ${APP_VERSION}`,
    ...(HOST ? [`  Host:           ${HOST}`] : []),
    `  Container Port: ${PORT}`,
    `  App URL:        ${appUrl}`,
    `  Environment:    ${env.app.nodeEnv?.toLowerCase() || 'development'}`,
    `  Timezone:       ${tz}`,
    `  Origins:        ${origins}`,
    `  Log level:      ${LOG_LVL}`,
    `  Log file:       /app/data/logs/trek.log`,
    `  PID:            ${process.pid}`,
    `  User:           uid=${process.getuid?.()} gid=${process.getgid?.()}`,
    '──────────────────────────────────────',
  ];
  banner.forEach(l => console.log(l));
  sLogInfo('NestJS serving all routes (Express decommissioned)');
  if (env.app.appUrl) {
    let parsedAppUrl: URL | null = null;
    try { parsedAppUrl = new URL(env.app.appUrl); } catch { /* invalid */ }

    if (!parsedAppUrl) {
      sLogWarn(`APP_URL: "${env.app.appUrl}" is not a valid URL — it will be ignored.`);
    }

    const mcpSafe = parsedAppUrl !== null && (
      parsedAppUrl.protocol === 'https:' ||
      parsedAppUrl.hostname === 'localhost' ||
      parsedAppUrl.hostname === '127.0.0.1'
    );
    if (!mcpSafe) {
      sLogWarn(`APP_URL: not MCP-safe (requires https:// or http://localhost) — MCP will use ${resolvedAppUrl}.`);
    }
  }
  if (env.demo.enabled) sLogInfo('Demo mode: ENABLED');
  if (env.demo.enabled && env.app.isProduction) {
    sLogWarn('SECURITY WARNING: DEMO_MODE is enabled in production!');
  }
  // The scheduler runs outside the container but needs things inside it. It is
  // handed them here, from the app buildApp() already initialised, rather than
  // reaching for src/services at call time.
  scheduler.setSchedulerDeps({
    backups: nestApp.get(BackupService),
    // The container singleton, not a fresh instance: the in-flight dedup and the
    // known-on-disk set only work if the whole process shares one.
    placePhotos: nestApp.get(PlacePhotoCacheService),
    // The last lazy require() in the cron path. It used to fail inside the tick,
    // logged as "AirTrail sync tick failed", where a boot-time wiring mistake
    // belongs at boot.
    airtrail: nestApp.get(AirtrailSyncService),
  });
  scheduler.start();
  scheduler.startTripReminders();
  scheduler.startTodoReminders();
  scheduler.startVersionCheck();
  scheduler.startDemoReset();
  scheduler.startIdempotencyCleanup();
  scheduler.startTrekPhotoCacheCleanup();
  scheduler.startPlacePhotoCacheCleanup();
  scheduler.startAirTrailSync();
  import('./websocket').then(({ setupWebSocket }) => {
    setupWebSocket(server);
  });
};

let server: http.Server;
let nestApp: INestApplication;

// Strangler toggle: prefixes served by Nest (env-overridable, instant rollback).
async function bootstrap(): Promise<void> {
  // The whole surface runs on the single NestJS app now (Express decommissioned):
  // global pipeline + /uploads + every /api domain + the platform/transport routes
  // (/mcp, /.well-known, OAuth SDK, SPA catch-all). buildApp() owns the composition
  // order; it is shared with the integration-test harness so they can't drift.
  nestApp = await buildApp();
  server = http.createServer(nestApp.getHttpAdapter().getInstance());
  if (HOST) server.listen(PORT, HOST, onListen);
  else server.listen(PORT, onListen);
}

bootstrap().catch((err) => {
  console.error('Fatal: failed to bootstrap server', err);
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string): void {
  const { logInfo: sLogInfo, logError: sLogError } = require('./nest/audit/audit-log.logger');
  const { closeMcpSessions } = require('./mcp');
  sLogInfo(`${signal} received — shutting down gracefully...`);
  scheduler.stop();
  closeMcpSessions();
  void nestApp?.close();
  server.close(() => {
    sLogInfo('HTTP server closed');
    const { closeDb } = require('./db/database');
    closeDb();
    sLogInfo('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    sLogError('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
