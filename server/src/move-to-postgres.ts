import 'reflect-metadata';
import 'dotenv/config';
// The same fail-fast validation as a server start: TREK_DB_URL is read as the server reads it.
import './app-config/boot-validate';

import { runMoveCommand } from './db/engine/postgres/sqlite-move/command';

/**
 * Moves a SQLite install into an empty Postgres database, with TREK stopped:
 *
 *   docker compose -f docker-compose.postgres.yml run --rm --user node -w /app/server app \
 *     node --require tsconfig-paths/register dist/move-to-postgres.js
 *   npm run db:move-to-postgres   (in server/, outside Docker)
 *
 * The target is TREK_DB_URL; the source is data/travel.db, or --from=<file>.
 * The SQLite files and the uploads are never changed. The wiki page
 * Database-Postgres ("Moving an existing install to Postgres") has the steps,
 * and src/db/engine/postgres/sqlite-move/ the move itself.
 */
void runMoveCommand(process.argv.slice(2)).then((code) => process.exit(code));
