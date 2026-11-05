import type { DatabaseEngine } from '../../db/engine';
import { DATABASE_BACKUP, type DatabaseBackupStrategy } from '../database/database-backup.interface';
import { DatabaseEngineModule, DATABASE_ENGINE } from '../database/database-engine.module';
import { DatabaseLifecycleModule } from '../database/database-lifecycle.module';
import { MaintenanceModule } from '../database/maintenance.module';
import { PostgresDatabaseBackup } from './postgres-database-backup';
import { SqliteDatabaseBackup } from './sqlite-database-backup';
import { Global, Module } from '@nestjs/common';

/**
 * Binds the database backup port (`DATABASE_BACKUP`) to the engine in use
 * (`TREK_DB_URL`, the one `DATABASE_ENGINE` provides).
 *
 * Global because its consumers sit in two domains: the backup domain itself
 * and the admin domain (the demo reset job and the baseline route). Admin
 * cannot import this file. The backup domain already reaches admin (backup
 * imports auth, auth imports settings, settings imports admin), so an
 * `admin -> backup` import would close a new domain cycle that
 * `lint:boundaries` refuses. Both inject the token from the shared database
 * kernel instead. `BackupModule` imports this module, which is what puts it in
 * the application; a test harness that mounts `AdminModule` without
 * `BackupModule` imports it itself (tests/e2e/admin.e2e.test.ts).
 */
@Global()
@Module({
  imports: [DatabaseEngineModule, DatabaseLifecycleModule, MaintenanceModule],
  providers: [
    SqliteDatabaseBackup,
    PostgresDatabaseBackup,
    {
      provide: DATABASE_BACKUP,
      useFactory: (
        engine: DatabaseEngine,
        sqlite: SqliteDatabaseBackup,
        postgres: PostgresDatabaseBackup,
      ): DatabaseBackupStrategy => ({ sqlite, postgres })[engine.id],
      inject: [DATABASE_ENGINE, SqliteDatabaseBackup, PostgresDatabaseBackup],
    },
  ],
  exports: [DATABASE_BACKUP],
})
export class DatabaseBackupModule {}
