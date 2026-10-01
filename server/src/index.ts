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
// bootstrap is required inside bootstrap() below, not imported here: importing
// it opens the database, and a first-start restore (#1089) has to put the
// backup's database in place before that happens.
import type * as Bootstrap from './bootstrap';

// data/tmp is the driver-agnostic global scratch dir (restore-upload spool,
// mirror stream staging) and stays boot-created here. Driver-owned roots — the
// uploads/ category tree and data/backups — are ensured by LocalDriver.init on
// every storage-registry load (boot and reload(), storage-registry.service.ts),
// which keeps the #1762 EACCES guarantee: a non-writable bind mount still
// fails loudly at startup, inside app.init(), instead of as a stray 500 on
// first upload. The Dockerfile `mkdir -p` list is pinned to the registry's
// category prefixes by tests/unit/uploads-dirs.test.ts.
const tmpDir = path.join(__dirname, '../data/tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

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
  // Nothing else to boot by hand: the crons are domain providers on the
  // scheduling registrar, and /ws is the Nest gateway buildApp already bound.
};

let server: http.Server;
let nestApp: INestApplication;

// Strangler toggle: prefixes served by Nest (env-overridable, instant rollback).
async function bootstrap(): Promise<void> {
  // The whole surface runs on the single NestJS app now (Express decommissioned):
  // global pipeline + /uploads + every /api domain + the platform/transport routes
  // (/mcp, /.well-known, OAuth SDK, SPA catch-all). buildApp() owns the composition
  // order; it is shared with the integration-test harness so they can't drift.
  const restore = await restoreBeforeTheDatabaseOpens();
  const { buildApp, getHttpServer } = require('./bootstrap') as typeof Bootstrap;
  nestApp = await buildApp();
  if (restore.restored) await finishFirstBootRestore(nestApp, restore);
  // The server buildApp created and bound /ws to. Creating a second one here
  // would serve the REST API fine and leave the gateway attached to a socket
  // nobody listens on.
  server = getHttpServer();

  // A bind failure has to be fatal and loud, and it needs saying explicitly.
  // listen() reports failure by event, not by rejecting, so the catch around
  // bootstrap() never sees it. And since buildApp attaches the ws server to this
  // http server, ws has already registered its own `error` listener on it, which
  // is enough for Node to stop throwing on an unhandled one. Without this the
  // process would survive EADDRINUSE, never run onListen, and serve nothing
  // while looking healthy.
  server.on('error', (err: NodeJS.ErrnoException) => {
    const where = HOST ? `${HOST}:${PORT}` : `:${PORT}`;
    console.error(`Fatal: cannot listen on ${where} — ${err.code ?? ''} ${err.message}`);
    process.exit(1);
  });

  if (HOST) server.listen(PORT, HOST, onListen);
  else server.listen(PORT, onListen);
}

/**
 * RESTORE_FROM_BACKUP on a first start (#1089), before anything opens the
 * database. See nest/backup/boot-restore.ts for when it runs and why it fails
 * the start rather than coming up empty.
 */
async function restoreBeforeTheDatabaseOpens() {
  const { restoreOnFirstBoot } = require('./nest/backup/boot-restore') as typeof import('./nest/backup/boot-restore');
  const env = readEnv();
  const dataDir = path.join(__dirname, '../data');
  return restoreOnFirstBoot({
    archive: env.backup.restoreFromBackup,
    dbFile: env.db.trekDbFile || path.join(dataDir, 'travel.db'),
    dataDir,
  });
}

/**
 * The uploads go in once storage is up, through the same driver every upload
 * uses, so an instance on S3 gets them in S3. A failure here leaves the restored
 * database running and says where the files are, rather than stopping a start
 * whose data is already in place.
 */
async function finishFirstBootRestore(
  app: INestApplication,
  restore: { uploads: string | null; staging: string },
): Promise<void> {
  const { StorageService } = require('./nest/storage/storage.service') as typeof import('./nest/storage/storage.service');
  const { rehydrateUploads } = require('./nest/backup/backup.impl') as typeof import('./nest/backup/backup.impl');
  try {
    if (restore.uploads) await rehydrateUploads(app.get(StorageService), restore.uploads);
    fs.rmSync(restore.staging, { recursive: true, force: true });
    console.log('[restore] Backup restored. Sign in with an account from the backup.');
  } catch (err) {
    console.error(`[restore] The database was restored, but the uploads could not be copied (${err instanceof Error ? err.message : String(err)}). They are still in ${restore.staging}.`);
  }
}

bootstrap().catch((err) => {
  console.error('Fatal: failed to bootstrap server', err);
  process.exit(1);
});

// Graceful shutdown
//
// The sequence itself lives in ./shutdown so it can be tested without a process
// to exit; this is only the wiring. See that file for why the order matters —
// in short, #2193: nothing here could ever release a WebSocket, so `docker
// stop` always ended in SIGKILL and exit 137.
let shuttingDown = false;
function shutdown(signal: string): void {
  // A second signal — the SIGINT that follows a Ctrl-C, or an impatient
  // orchestrator sending SIGTERM twice — must not start a second teardown on
  // top of the first one.
  if (shuttingDown) return;
  shuttingDown = true;
  const { logInfo: sLogInfo, logError: sLogError } = require('./nest/audit/audit-log.logger');
  const { closeMcpSessions } = require('./mcp');
  const { getServer } = require('./nest/realtime/ws-state');
  const { runShutdown } = require('./shutdown');
  runShutdown(signal, {
    // Both are still undefined if the signal beat bootstrap(); the sequence
    // handles that and still exits rather than hanging or throwing.
    server,
    // nestApp.close() stops every cron via the scheduling registrar's shutdown
    // hook, and tears the plugin supervisor's forked children down.
    closeNestApp: async () => { await nestApp?.close(); },
    getWsClients: () => getServer()?.clients ?? null,
    closeMcpSessions,
    closeDb: () => { require('./db/database').closeDb(); },
    logInfo: sLogInfo,
    logError: sLogError,
    exit: (code: number) => process.exit(code),
  }).catch((err: unknown) => {
    // Fire-and-forget would make this an unhandled rejection, which on Node 22
    // is a crash — a worse ending than the one we are here to fix.
    sLogError(`Shutdown failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
