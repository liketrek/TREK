import 'reflect-metadata';
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import { createApp } from './app';
import { AppModule } from './nest/app.module';

// Create upload and data directories on startup
const uploadsDir = path.join(__dirname, '../uploads');
const photosDir = path.join(uploadsDir, 'photos');
const filesDir = path.join(uploadsDir, 'files');
const coversDir = path.join(uploadsDir, 'covers');
const avatarsDir = path.join(uploadsDir, 'avatars');
const backupsDir = path.join(__dirname, '../data/backups');
const tmpDir = path.join(__dirname, '../data/tmp');

[uploadsDir, photosDir, filesDir, coversDir, avatarsDir, backupsDir, tmpDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Legacy Express app — unchanged. NestJS (its own Express 5 instance) is mounted
// in front of it (strangler pattern): migrated route prefixes are served by Nest,
// everything else falls through to this app via a fallback middleware.
const legacyApp = createApp();

import * as scheduler from './scheduler';
import { getAppUrl, getMcpSafeUrl } from './services/notifications';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST;
const APP_VERSION: string = process.env.APP_VERSION || (require('../package.json') as { version: string }).version;

const onListen = () => {
  const { logInfo: sLogInfo, logWarn: sLogWarn } = require('./services/auditLog');
  const LOG_LVL = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const tz = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const origins = process.env.ALLOWED_ORIGINS || '(same-origin)';
  const appUrl = getAppUrl();
  const resolvedAppUrl = getMcpSafeUrl();
  const banner = [
    '──────────────────────────────────────',
    '  TREK API started',
    `  Version         ${APP_VERSION}`,
    ...(HOST ? [`  Host:           ${HOST}`] : []),
    `  Container Port: ${PORT}`,
    `  App URL:        ${appUrl}`,
    `  Environment:    ${process.env.NODE_ENV?.toLowerCase() || 'development'}`,
    `  Timezone:       ${tz}`,
    `  Origins:        ${origins}`,
    `  Log level:      ${LOG_LVL}`,
    `  Log file:       /app/data/logs/trek.log`,
    `  PID:            ${process.pid}`,
    `  User:           uid=${process.getuid?.()} gid=${process.getgid?.()}`,
    '──────────────────────────────────────',
  ];
  banner.forEach(l => console.log(l));
  if (process.env.APP_URL) {
    let parsedAppUrl: URL | null = null;
    try { parsedAppUrl = new URL(process.env.APP_URL); } catch { /* invalid */ }

    if (!parsedAppUrl) {
      sLogWarn(`APP_URL: "${process.env.APP_URL}" is not a valid URL — it will be ignored.`);
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
  if (process.env.DEMO_MODE?.toLowerCase() === 'true') sLogInfo('Demo mode: ENABLED');
  if (process.env.DEMO_MODE?.toLowerCase() === 'true' && process.env.NODE_ENV?.toLowerCase() === 'production') {
    sLogWarn('SECURITY WARNING: DEMO_MODE is enabled in production!');
  }
  scheduler.start();
  scheduler.startTripReminders();
  scheduler.startTodoReminders();
  scheduler.startVersionCheck();
  scheduler.startDemoReset();
  scheduler.startIdempotencyCleanup();
  scheduler.startTrekPhotoCacheCleanup();
  const { startTokenCleanup } = require('./services/ephemeralTokens');
  startTokenCleanup();
  import('./websocket').then(({ setupWebSocket }) => {
    setupWebSocket(server);
  });
};

let server: http.Server;
let nestApp: INestApplication;

// Path prefixes served by NestJS. Everything else falls through to the legacy
// Express app. This list is the strangler toggle (F7): add a prefix here once
// its module has been migrated to Nest.
const NEST_PREFIXES = ['/api/_nest'];

function isNestPath(p: string): boolean {
  return NEST_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'));
}

async function bootstrap(): Promise<void> {
  // Nest runs on its own Express instance (bodyParser off so request bodies reach
  // the legacy app untouched — it has its own parsers; /mcp relies on raw body).
  nestApp = await NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false });
  await nestApp.init();
  const nestInstance = nestApp.getHttpAdapter().getInstance();

  // Top-level dispatcher: migrated prefixes -> Nest, everything else -> legacy
  // Express (unchanged). Nest never sees non-migrated paths, so its 404 handler
  // only applies within migrated prefixes.
  const top = express();
  top.use((req, res, next) => (isNestPath(req.path) ? nestInstance(req, res, next) : next()));
  top.use(legacyApp);

  server = http.createServer(top);
  if (HOST) server.listen(PORT, HOST, onListen);
  else server.listen(PORT, onListen);
}

bootstrap().catch((err) => {
  console.error('Fatal: failed to bootstrap server', err);
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string): void {
  const { logInfo: sLogInfo, logError: sLogError } = require('./services/auditLog');
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

export default legacyApp;
